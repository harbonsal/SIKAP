<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicYear;
use App\Models\Kamar;
use App\Models\ActiveKamar;
use App\Models\User;

class SyncKamarAktifCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-kamar-aktif';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Active Kamar data from legacy database based on active Academic Year';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Kamar Aktif Synchronization...');

        // 1. Get Active Academic Year
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            $this->error('No active Academic Year found in SIKAP.');
            return;
        }

        // Convert 2024/2025 -> 20242025
        $legacyTp = str_replace('/', '', $activeYear->name);
        $this->info("Target Active Year: {$activeYear->name} (Legacy TP: {$legacyTp})");

        // 2. Fetch from Legacy
        // Use 'kamar_aktif' and join with 'kamar' for names
        $legacyTable = 'kamar_aktif';
        // Note: join might be case sensitive on table names on some OS, match what DB has
        $this->info("Fetching data from legacy table: {$legacyTable}...");

        try {
            $legacyKamars = DB::connection('mysql_legacy')
                ->table('kamar_aktif')
                ->join('kamar', 'kamar_aktif.Kode_Kamar', '=', 'kamar.Kode_Kamar')
                ->where('kamar_aktif.Kode_TP', $legacyTp)
                ->select(
                    'kamar_aktif.Kode_Kamar',
                    'kamar_aktif.Kode_User',
                    'kamar.Kamar as Nama_Kamar'
                )
                ->get();
        } catch (\Exception $e) {
            $this->error("Failed to query legacy table: " . $e->getMessage());
            return;
        }

        if ($legacyKamars->isEmpty()) {
            $this->warn("No data found in {$legacyTable} for Kode_TP {$legacyTp}.");
            return;
        }

        $this->info("Found {$legacyKamars->count()} records. Processing...");

        $bar = $this->output->createProgressBar($legacyKamars->count());
        $bar->start();

        foreach ($legacyKamars as $row) {
            // $row has: Kode_Kamar, Kode_User, Nama_Kamar

            // 3. Find or Create 'Kamar' Master
            // Use Name from legacy 'kamar' table
            $namaKamar = $row->Nama_Kamar ?? $row->Kode_Kamar;

            $kamar = Kamar::firstOrCreate(
                ['name' => $namaKamar],
                [
                    'building' => '-',        // Default
                    'capacity' => 20,         // Default assumption
                    'gender' => 'L',          // Default assumption
                    'description' => 'Imported from Legacy (' . $row->Kode_Kamar . ')',
                ]
            );

            // 4. Find Musrif (User)
            $musrifId = null;
            $kodeUser = $row->Kode_User ?? null;

            if ($kodeUser) {
                // Find user by nomor_induk
                $musrif = User::where('nomor_induk', $kodeUser)->first();
                if ($musrif) {
                    $musrifId = $musrif->id;
                }
            }

            // 5. Update/Create ActiveKamar
            ActiveKamar::updateOrCreate(
                [
                    'academic_year_id' => $activeYear->id,
                    'kamar_id' => $kamar->id,
                ],
                [
                    'musrif_id' => $musrifId,
                    'name' => null, // We generally use the master name, unless overriden
                ]
            );

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Synchronization completed successfully.');
    }
}
