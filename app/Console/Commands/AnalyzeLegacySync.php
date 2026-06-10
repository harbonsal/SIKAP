<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\ClassMember;

class AnalyzeLegacySync extends Command
{
    protected $signature = 'analyze:legacy-sync';
    protected $description = 'Analyze discrepancies between SIM Lama CSV and SIKAP DB';

    public function handle()
    {
        $csvFile = base_path('sim_lama.csv');
        if (!file_exists($csvFile)) {
            $this->error("File sim_lama.csv not found!");
            return 1;
        }

        $this->info("Reading CSV...");
        $csvData = array_map('str_getcsv', file($csvFile));
        $header = array_shift($csvData);

        // Find NIS Index
        $nisIndex = -1;
        foreach ($header as $idx => $col) {
            if (trim($col) === '.NIS' || trim($col) === 'NIS') {
                $nisIndex = $idx;
                break;
            }
        }

        if ($nisIndex === -1) {
            $this->error("Column NIS not found in CSV header: " . implode(', ', $header));
            return 1;
        }

        // Collect Legacy NIS List with Names
        $legacyData = [];
        $nameIndex = -1;
        foreach ($header as $idx => $col) {
            if (stripos($col, 'Nama') !== false) {
                $nameIndex = $idx;
                break;
            }
        }

        foreach ($csvData as $row) {
            if (isset($row[$nisIndex])) {
                $nis = trim($row[$nisIndex]);
                if (!empty($nis)) {
                    $name = ($nameIndex !== -1 && isset($row[$nameIndex])) ? trim($row[$nameIndex]) : 'Unknown';
                    $legacyData[$nis] = $name;
                }
            }
        }
        $this->info("Total Students in SIM Lama (CSV): " . count($legacyData));

        // Get SIKAP Data
        $sikaStudents = Student::with('user')->get();
        $sikaNisMap = [];
        foreach ($sikaStudents as $s) {
            if ($s->user && $s->user->nomor_induk) {
                $sikaNisMap[$s->user->nomor_induk] = [
                    'student' => $s,
                    'status' => $s->user->status
                ];
            }
        }

        // Check AY for Class enrollment
        $ay = AcademicYear::where('name', '2025/2026')->first();
        $enrolledNis = [];
        if ($ay) {
            $classMembers = ClassMember::whereHas('activeClass', function ($q) use ($ay) {
                $q->where('academic_year_id', $ay->id);
            })->with('student.user')->get();

            foreach ($classMembers as $m) {
                if ($m->student && $m->student->user && $m->student->user->nomor_induk) {
                    $enrolledNis[$m->student->user->nomor_induk] = true;
                }
            }
        }

        $missingInDb = [];
        $notActive = [];
        $activeButNotEnrolled = [];

        foreach ($legacyData as $nis => $legacyName) {
            if (!isset($sikaNisMap[$nis])) {
                $missingInDb[] = ['nis' => $nis, 'name' => $legacyName];
            } else {
                // Exists in DB
                $data = $sikaNisMap[$nis];
                if ($data['status'] !== 'Aktif') {
                    $notActive[] = [
                        'nis' => $nis,
                        'name' => $data['student']->name,
                        'status' => $data['status']
                    ];
                } else {
                    // Active in DB, check if enrolled in class
                    if (!isset($enrolledNis[$nis])) {
                        $activeButNotEnrolled[] = [
                            'nis' => $nis,
                            'name' => $data['student']->name
                        ];
                    }
                }
            }
        }

        $this->info("\n--- ANALISIS DISKREPANSI ---");

        if (count($missingInDb) > 0) {
            $this->error("[!] " . count($missingInDb) . " NIS Tidak Ditemukan di Database SIKAP (Sama Sekali):");
            foreach ($missingInDb as $item) $this->line("   - {$item['nis']} | {$item['name']}");
        } else {
            $this->info("[OK] Semua NIS dari CSV ditemukan di Database SIKAP.");
        }

        if (count($notActive) > 0) {
            $this->warn("\n[!] " . count($notActive) . " NIS Ada di Database tapi Status TIDAK AKTIF:");
            foreach ($notActive as $item) {
                $this->line("   - {$item['nis']} | {$item['name']} (Status: {$item['status']})");
            }
        }

        if (count($activeButNotEnrolled) > 0) {
            $this->warn("\n[!] " . count($activeButNotEnrolled) . " NIS Ada & Aktif tapi BELUM MASUK KELAS 2025/2026:");
            foreach ($activeButNotEnrolled as $item) {
                $this->line("   - {$item['nis']} | {$item['name']}");
            }
        }

        // Summary
        $countFound = count($legacyData) - count($missingInDb);
        $countReady = $countFound - count($notActive);
        $countFix = count($missingInDb) + count($notActive) + count($activeButNotEnrolled);

        $this->info("\nSummary:");
        $this->info("- Total CSV: " . count($legacyData));
        $this->info("- Missing in DB: " . count($missingInDb));
        $this->info("- Found but Inactive: " . count($notActive));
        $this->info("- Active but Unenrolled (Target Fix): " . count($activeButNotEnrolled));

        return 0;
    }
}
