<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicYear;
use App\Models\ActiveKamar;
use App\Models\KamarMember;
use App\Models\User;

class SyncKamarMemberCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-kamar-member';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Kamar Member data from legacy database based on active Academic Year';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Kamar Member Synchronization...');

        // 1. Get Active Academic Year
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            $this->error('No active Academic Year found in SIKAP.');
            return;
        }

        // Convert 2024/2025 -> 20242025
        $legacyTp = str_replace('/', '', $activeYear->name);
        $this->info("Target Active Year: {$activeYear->name} (Legacy TP: {$legacyTp})");

        // 2. Fetch from Legacy 'perkamar'
        // Join with 'kamar' to get the room name (legacy 'Kamar' column)
        $this->info("Fetching data from legacy table: perkamar...");

        try {
            // Check legacy tables again if 'kamar' table provides the name
            // 'perkamar' usually has 'Kode_Kamar' and 'Kode_User'
            // We need to join with 'kamar' on 'Kode_Kamar' to get the Name specific to that room code

            $legacyMembers = DB::connection('mysql_legacy')
                ->table('perkamar')
                ->join('kamar', 'perkamar.Kode_Kamar', '=', 'kamar.Kode_Kamar')
                ->where('perkamar.Kode_TP', $legacyTp)
                ->where('perkamar.Aktif', 'Y')
                ->select(
                    'perkamar.Kode_User',      // This is likely NIS
                    'kamar.Kamar as Nama_Kamar',
                    'perkamar.Kode_Kamar'
                )
                ->get();
        } catch (\Exception $e) {
            $this->error("Failed to query legacy table: " . $e->getMessage());
            return;
        }

        if ($legacyMembers->isEmpty()) {
            $this->warn("No active member data found in perkamar for Kode_TP {$legacyTp}.");
            return;
        }

        $this->info("Found {$legacyMembers->count()} member records. Processing...");

        $bar = $this->output->createProgressBar($legacyMembers->count());
        $bar->start();

        $successCount = 0;
        $skippedCount = 0;

        foreach ($legacyMembers as $row) {
            $nis = $row->Kode_User;
            $namaKamar = $row->Nama_Kamar ?? $row->Kode_Kamar;

            // 3. Find Student (via User)
            $userStudent = User::where('nomor_induk', $nis)->with('student')->first();

            if (!$userStudent || !$userStudent->student) {
                // User or Student profile not found
                // $this->warn("Student with NIS {$nis} not found."); 
                $skippedCount++;
                $bar->advance();
                continue;
            }

            $studentId = $userStudent->student->id;

            // 4. Find ActiveKamar
            // We need to find the ActiveKamar ID for this year and this room name
            // We search by Name logic used in previous sync
            $activeKamar = ActiveKamar::where('academic_year_id', $activeYear->id)
                ->whereHas('kamar', function ($q) use ($namaKamar) {
                    $q->where('name', $namaKamar);
                })
                ->first();

            if (!$activeKamar) {
                // Active Room not found (maybe sync-kamar-aktif hasn't run or mismatch)
                $skippedCount++;
                $bar->advance();
                continue;
            }

            // 5. Create KamarMember
            // Avoid duplicates
            KamarMember::firstOrCreate(
                [
                    'active_kamar_id' => $activeKamar->id,
                    'student_id' => $studentId,
                ]
            );

            $successCount++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Synchronization completed.");
        $this->info("Synced: {$successCount}, Skipped: {$skippedCount} (Student/Room not found).");
    }
}
