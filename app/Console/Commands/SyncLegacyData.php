<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\ActiveKamar;
use App\Models\ClassMember;
use App\Models\KamarMember;

class SyncLegacyData extends Command
{
    protected $signature = 'sync:legacy-data';
    protected $description = 'Final synchronization of students, classes, and rooms from legacy CSV';

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

        // Map Columns
        $colMap = [];
        foreach ($header as $idx => $h) {
            $colMap[trim($h)] = $idx;
        }
        print_r($colMap); // Debug header mapping
        $idxNis = -1;
        foreach ($colMap as $name => $idx) {
            if (stripos($name, 'NIS') !== false) $idxNis = $idx;
        }
        $idxKelas = $colMap['Kelas'] ?? -1;
        $idxKamar = $colMap['Kamar'] ?? -1;
        $idxName = $colMap['Nama'] ?? -1;

        if ($idxNis == -1) {
            $this->error("NIS column not found");
            return 1;
        }

        $ay = AcademicYear::where('name', '2025/2026')->first();
        if (!$ay) {
            $this->error("AY 2025/2026 not found");
            return 1;
        }

        // --- 1. BUILD MAPPINGS ---

        // Class Map (CSV Name -> DB ActiveClass ID)
        // Hardcoded based on analysis
        $classMap = [
            '1A Mutawasith' => 44, // 1 Mutawasith A
            '1 Mutawasith A' => 44,

            '1B Mutawasith' => 57, // 1 Mutawasith B
            '1 Mutawasith B' => 57,

            '2A Mutawasith' => 46, // 2 Mutawasith A
            '2 Mutawasith A' => 46,

            '2B Mutawasith' => 58, // 2 Mutawasith B
            '2 Mutawasith B' => 58,

            '3A Mutawasith' => 59, // 3 Mutawasith A
            '3 Mutawasith A' => 59,

            '3B Mutawasith' => 49, // 3 Mutawasith B
            '3 Mutawasith B' => 49,

            '1A Tsanawiy' => 51, // 1 Tsanawiy A
            '1 Tsanawiy A' => 51,

            '1B Tsanawiy' => 60, // 1 Tsanawiy B
            '1 Tsanawiy B' => 60,

            '2A Tsanawiy' => 53, // 2 Tsanawiy A
            '2 Tsanawiy A' => 53,

            '2B Tsanawiy' => 61, // 2 Tsanawiy B
            '2 Tsanawiy B' => 61,

            '3A Tsanawiy' => 62, // 3 Tsanawiy A
            '3 Tsanawiy A' => 62,

            '3B Tsanawiy' => 52, // 3 Tsanawiy B
            '3 Tsanawiy B' => 52,

            'IL Tsanawiy' => 50,
        ];

        // Room Map (CSV Name -> DB ActiveKamar ID)
        // Dynamic construction
        $kamarMap = [];
        $activeKamars = ActiveKamar::where('academic_year_id', $ay->id)->with('kamar')->get();
        foreach ($activeKamars as $ak) {
            $name = $ak->name;
            if (empty($name) && $ak->kamar) {
                $name = $ak->kamar->name;
            }
            if (!empty($name)) {
                $kamarMap[strtoupper(trim($name))] = $ak->id;
            }
        }
        // --- 2. EXECUTE SYNC ---

        $countProcessed = 0;
        $countClassSynced = 0;
        $countKamarSynced = 0;
        $countStudentCreated = 0;

        foreach ($csvData as $row) {
            if (!isset($row[$idxNis])) continue;

            $nis = trim($row[$idxNis]);
            if (empty($nis)) continue;

            $csvKelas = isset($row[$idxKelas]) ? trim($row[$idxKelas]) : '';
            $csvKamar = isset($row[$idxKamar]) ? trim($row[$idxKamar]) : '';

            // A. Find Student
            $user = User::where('nomor_induk', $nis)->first();
            if (!$user) {
                $this->warn("User not found for NIS: $nis");
                continue;
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                $existingByNisn = Student::where('nisn', $nis)->first();
                if ($existingByNisn) {
                    $this->warn("Found existing Student by NISN ($nis) but user_id mismatch. Using existing student ID {$existingByNisn->id}.");
                    $student = $existingByNisn;
                } else {
                    // Create Student if missing
                    $name = isset($row[$idxName]) ? trim($row[$idxName]) : $user->name;
                    try {
                        $student = Student::create([
                            'user_id' => $user->id,
                            'name' => $name,
                            'nisn' => $nis,
                            'nik' => '-' . $user->id . rand(100, 999), // Ensure unique NIK just in case
                            'religion' => 'Islam',
                            'citizenship' => 'WNI',
                            'child_order' => 1,
                            'siblings_count' => 0,
                            'living_with' => 'Orang Tua',
                            'financial_sponsor' => 'Orang Tua',
                            'gender' => 'L',
                            'birth_place' => '-',
                            'birth_date' => '2010-01-01',
                            'address' => '-',
                            'origin_region' => '-',
                            'province' => '-',
                            'city' => '-',
                            'district' => '-',
                            'village' => '-',
                            'postal_code' => '-',
                            'address_details' => '-',
                            'height' => 0,
                            'weight' => 0,
                            'blood_type' => '-',
                            'parent_name' => 'Wali Santri',
                            'parent_phone' => '-',
                            'father_name' => '-',
                            'father_nik' => '-',
                            'father_birth_year' => '1980',
                            'father_education' => '-',
                            'father_occupation' => '-',
                            'father_income' => '-',
                            'mother_name' => '-',
                            'mother_nik' => '-',
                            'mother_birth_year' => '1980',
                            'mother_education' => '-',
                            'mother_occupation' => '-',
                            'mother_income' => '-',
                            'guardian_name' => '-',
                            // 'guardian_address' => '-', // Add if needed
                        ]);
                        $countStudentCreated++;
                        $this->info("Created Student record for NIS: $nis ({$user->name})");
                    } catch (\Exception $e) {
                        $this->error("Failed to create student NIS $nis: " . $e->getMessage());
                        continue; // Skip rest of loop for this row
                    }
                }
            }

            // B. Sync Class
            if (isset($classMap[$csvKelas])) {
                $activeClassId = $classMap[$csvKelas];

                // Check existing membership
                $existingClass = ClassMember::whereHas('activeClass', function ($q) use ($ay) {
                    $q->where('academic_year_id', $ay->id);
                })->where('student_id', $student->id)->first();

                if ($existingClass) {
                    if ($existingClass->active_class_id !== $activeClassId) {
                        $existingClass->active_class_id = $activeClassId;
                        $existingClass->save();
                        $countClassSynced++;
                    }
                } else {
                    ClassMember::create([
                        'active_class_id' => $activeClassId,
                        'student_id' => $student->id
                    ]);
                    $countClassSynced++;
                }
            } else {
                if (!empty($csvKelas)) $this->warn("Unknown Class: $csvKelas (NIS: $nis)");
            }

            // C. Sync Kamar
            $upperKamar = strtoupper(trim($csvKamar));
            if (isset($kamarMap[$upperKamar])) {
                $activeKamarId = $kamarMap[$upperKamar];

                // Check existing membership
                $existingKamar = KamarMember::whereHas('activeKamar', function ($q) use ($ay) {
                    $q->where('academic_year_id', $ay->id);
                })->where('student_id', $student->id)->first();

                if ($existingKamar) {
                    if ($existingKamar->active_kamar_id !== $activeKamarId) {
                        $existingKamar->active_kamar_id = $activeKamarId;
                        $existingKamar->save();
                        $countKamarSynced++;
                    }
                } else {
                    KamarMember::create([
                        'active_kamar_id' => $activeKamarId,
                        'student_id' => $student->id
                    ]);
                    $countKamarSynced++;
                }
            } else {
                if (!empty($csvKamar)) $this->warn("Unknown Kamar Lookup Failed: '$upperKamar' (Original: '$csvKamar')");
            }

            $countProcessed++;
        }

        $this->info("\n--- SYNC COMPLETED ---");
        $this->info("Processed Rows: $countProcessed");
        $this->info("Student Records Created: $countStudentCreated");
        $this->info("Class Members Updated/Created: $countClassSynced");
        $this->info("Kamar Members Updated/Created: $countKamarSynced");

        return 0;
    }
}
