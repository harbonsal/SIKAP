<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\ClassMember;
use App\Models\User;

class SyncClassMemberCommand extends Command
{
    protected $signature = 'app:sync-class-member';
    protected $description = 'Sync Class Member data from legacy database (perkelas)';

    public function handle()
    {
        $this->info('Starting Class Member Synchronization...');

        // 1. Get Active Academic Year
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            $this->error('No active Academic Year found.');
            return;
        }

        $legacyTp = str_replace('/', '', $activeYear->name); // 2025/2026 -> 20252026
        $this->info("Target Year: {$activeYear->name} (Legacy TP: {$legacyTp})");

        // 2. Load SIKAP Active Classes into a Map for quick lookup
        // Key: Normalized Name "3 Tsanawiy A"
        $sikapClasses = ActiveClass::where('academic_year_id', $activeYear->id)
            ->with(['kelas', 'kelasParalel'])
            ->get()
            ->mapWithKeys(function ($ac) {
                $uniqueName = trim(($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? ''));
                return [$uniqueName => $ac->id];
            });

        $this->info("Loaded {$sikapClasses->count()} active classes from SIKAP.");

        // 3. Fetch Legacy Data
        $this->info("Fetching legacy 'perkelas'...");
        $legacyMembers = DB::connection('mysql_legacy')
            ->table('perkelas')
            ->join('kelas', 'perkelas.Kode_Kelas', '=', 'kelas.Kode_Kelas')
            ->where('perkelas.Kode_TP', $legacyTp)
            ->where('perkelas.Aktif', 'Y')
            ->select('perkelas.Kode_User', 'kelas.Kelas as Nama_Kelas')
            ->get();

        $this->info("Found {$legacyMembers->count()} legacy class members.");

        $bar = $this->output->createProgressBar($legacyMembers->count());
        $bar->start();

        $stats = ['synced' => 0, 'skipped_user' => 0, 'skipped_class' => 0];

        foreach ($legacyMembers as $row) {
            $rowName = $row->Nama_Kelas; // e.g., "3A Tsanawiy"
            $nis = $row->Kode_User;

            // Normalize Legacy Name
            $targetName = $this->normalizeClassName($rowName);

            // Find Active Class ID
            $activeClassId = $sikapClasses[$targetName] ?? null;

            if (!$activeClassId) {
                // Try fuzzy match? (e.g. without duplicate spaces)
                // For now, stricter.
                // $this->warn("Class not found: '$rowName' -> '$targetName'");
                $stats['skipped_class']++;
                $bar->advance();
                continue;
            }

            // Find Student
            $user = User::where('nomor_induk', $nis)->with('student')->first();
            if (!$user || !$user->student) {
                $stats['skipped_user']++;
                $bar->advance();
                continue;
            }

            // Sync
            ClassMember::firstOrCreate(
                [
                    'active_class_id' => $activeClassId,
                    'student_id' => $user->student->id
                ]
            );

            $stats['synced']++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Sync Completed.");
        $this->table(['Metric', 'Count'], [
            ['Synced', $stats['synced']],
            ['Skipped (Class Not Found)', $stats['skipped_class']],
            ['Skipped (User Not Found)', $stats['skipped_user']],
        ]);
    }

    private function normalizeClassName($legacyName)
    {
        // "IL Tsanawiy" -> "IL Tsanawiy"
        if ($legacyName === 'IL Tsanawiy') return $legacyName;

        // "3A Tsanawiy" -> "3 Tsanawiy A"
        // Pattern: Number + Letter + Space + Word
        if (preg_match('/^(\d+)([A-Za-z])\s+(.*)$/', $legacyName, $matches)) {
            return "{$matches[1]} {$matches[3]} {$matches[2]}";
        }

        // "1A Mutawasith" -> "1 Mutawasith A"
        // Works with above regex too.

        // If simple "1 Mutawasith" (no letter) -> "1 Mutawasith" 
        // Note: SIKAP might expect "1 Mutawasith -" or just "1 Mutawasith". 
        // My map key uses "1 Mutawasith A" or "1 Mutawasith -".
        // Let's assume SIKAP class names are trimmed.

        return trim($legacyName);
    }
}
