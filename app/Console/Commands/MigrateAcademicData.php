<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\AcademicYear;
use App\Models\Mapel;
use App\Models\Jenjang;
use App\Models\Kelas;
use App\Models\ActiveClass;
use App\Models\ClassMember;
use App\Models\ActiveSubject;
use App\Models\SubjectTeacher;
use App\Models\User;
use App\Models\Student;

class MigrateAcademicData extends Command
{
    protected $signature = 'migrate:academic-data';
    protected $description = 'Migrate academic data (Mapel, Classes, Members, Subjects) for TP 2025/2026 from sim_lama';

    public function handle()
    {
        $this->info('Starting Academic Data Migration for TP 2025/2026...');

        // 1. Setup & Checks
        $tpCode = '20252026';
        $academicYear = AcademicYear::where('name', '2025/2026')->first();

        if (!$academicYear) {
            $this->error('Academic Year 2025/2026 not found in sikap_db!');
            return 1;
        }

        $this->info("Target Academic Year: {$academicYear->name} (ID: {$academicYear->id})");

        try {
            DB::beginTransaction();

            // 2. Migrate Master Mapel
            $this->migrateMasterMapel();

            // 3. Migrate Active Classes
            $this->migrateActiveClasses($tpCode, $academicYear);

            // 4. Migrate Class Members
            $this->migrateClassMembers($tpCode, $academicYear);

            // 5. Migrate Active Subjects & Teachers
            $this->migrateActiveSubjects($tpCode, $academicYear);

            DB::commit();
            $this->info('Migration completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            file_put_contents('migration_error.log', $e->getMessage() . "\n" . $e->getTraceAsString());
            $this->error('Migration failed. Check migration_error.log');
            return 1;
        }

        return 0;
    }

    private function migrateMasterMapel()
    {
        $this->info('Migrating Master Mapel...');
        $legacyMapels = DB::connection('mysql')->select("SELECT * FROM sim_lama.mapel");

        foreach ($legacyMapels as $legacy) {
            Mapel::firstOrCreate(
                ['code' => $legacy->Kode_Mapel],
                [
                    'name' => $legacy->Mata_Pelajaran,
                    'nama_arab' => $legacy->Mata_Pelajaran_Arab ?? null,
                    'description' => null,
                ]
            );
        }
        $this->info('Master Mapel migrated.');
    }

    private function migrateActiveClasses($tpCode, $academicYear)
    {
        $this->info('Migrating Active Classes...');

        $legacyClasses = DB::connection('mysql')->select("
            SELECT ka.*, k.Kls, k.Kelas as Nama_Kelas
            FROM sim_lama.kelas_aktif ka
            JOIN sim_lama.kelas k ON ka.Kode_Kelas = k.Kode_Kelas
            WHERE ka.Kode_TP = ?", [$tpCode]);

        foreach ($legacyClasses as $legacy) {
            // Find Jenjang (Kls)
            $jenjangId = $this->mapKlsToJenjangId($legacy->Kls);
            $jenjang = Jenjang::find($jenjangId);

            if (!$jenjang) {
                // If ID specific logic fails, try to fallback or just skip
                $this->warn("Jenjang ID {$jenjangId} (Level {$legacy->Kls}) not found. Skipping Class {$legacy->Nama_Kelas}.");
                continue;
            }

            // Find or Create Master Kelas (e.g. 7A)
            // In SIKAP, Kelas belongs to Jenjang.
            // Check if we have a robust mapping. For now, try to find by Name match or Create
            // Actually, SIKAP structure: Jenjang -> Kelas (Nama) -> ActiveClass
            // We need to ensure the Master Kelas exists first.

            $kelas = Kelas::firstOrCreate(
                ['name' => $legacy->Nama_Kelas, 'jenjang_id' => $jenjang->id],
                ['description' => "Migrated from Legacy"]
            );

            $kelasParalelId = $this->getKelasParalelId($legacy->Nama_Kelas);

            // Create Active Class
            ActiveClass::firstOrCreate(
                [
                    'academic_year_id' => $academicYear->id,
                    'kelas_id' => $kelas->id,
                    'kelas_paralel_id' => $kelasParalelId,
                ],
                [
                    'name' => $legacy->Nama_Kelas,
                    'total_hours_per_week' => 0
                ]
            );
        }
        $this->info('Active Classes migrated.');
    }

    private function getKelasParalelId($name)
    {
        $name = strtoupper($name);
        if (str_contains($name, ' A ') || str_ends_with($name, ' A') || str_contains($name, '1A') || str_contains($name, '2A') || str_contains($name, '3A') || str_contains($name, '7A') || str_contains($name, '8A') || str_contains($name, '9A')) return 1;
        if (str_contains($name, ' B ') || str_ends_with($name, ' B') || str_contains($name, '1B') || str_contains($name, '2B') || str_contains($name, '3B') || str_contains($name, '7B') || str_contains($name, '8B') || str_contains($name, '9B')) return 2;
        if (str_contains($name, ' C ') || str_ends_with($name, ' C') || str_contains($name, '1C') || str_contains($name, '2C') || str_contains($name, '3C') || str_contains($name, '7C') || str_contains($name, '8C') || str_contains($name, '9C')) return 3;
        if (str_contains($name, ' D ') || str_ends_with($name, ' D') || str_contains($name, '1D') || str_contains($name, '2D') || str_contains($name, '3D') || str_contains($name, '7D') || str_contains($name, '8D') || str_contains($name, '9D')) return 4;

        // Check for "Putra" / "Putri" if strictly separated
        if (str_contains($name, 'PUTRA')) return 1; // Treat as A
        if (str_contains($name, 'PUTRI')) return 2; // Treat as B

        return 1; // Default to A
    }

    private function mapKlsToJenjangId($kls)
    {
        if ($kls >= 1 && $kls <= 6) return 1; // Ibtida'i
        if ($kls >= 7 && $kls <= 9) return 2; // Mutawasith
        if ($kls >= 10 && $kls <= 12) return 3; // Aliyah
        return 2; // Default to Mutawasith (since we are doing 7-9 mostly?) or 1?
    }

    private function migrateClassMembers($tpCode, $academicYear)
    {
        $this->info('Migrating Class Members...');

        $members = DB::connection('mysql')->select("
            SELECT pk.*, k.Kelas as Nama_Kelas
            FROM sim_lama.perkelas pk
            JOIN sim_lama.kelas k ON pk.Kode_Kelas = k.Kode_Kelas
            WHERE pk.Kode_TP = ?", [$tpCode]);

        $count = 0;
        foreach ($members as $member) {
            // Find User by Nomor Induk (Kode_User is usually NIS in legacy if numeric, or mapped)
            // In Analyze, Kode_User 1707018 seems to be NIS.
            $user = User::where('nomor_induk', $member->Kode_User)->first();
            if (!$user) {
                // $this->warn("User NIS {$member->Kode_User} not found. Skipping.");
                continue;
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student) continue;

            // Find Active Class in SIKAP
            // Need to join with Kelas to get Name
            $kelasName = $member->Nama_Kelas;

            $activeClass = ActiveClass::where('academic_year_id', $academicYear->id)
                ->whereHas('kelas', function ($q) use ($kelasName) {
                    $q->where('name', $kelasName);
                })->first();

            if ($activeClass) {
                ClassMember::firstOrCreate([
                    'active_class_id' => $activeClass->id,
                    'student_id' => $student->id,
                ]);
                $count++;
            }
        }
        $this->info("Class Members migrated: $count students.");
    }

    private function migrateActiveSubjects($tpCode, $academicYear)
    {
        $this->info('Migrating Active Subjects & Teachers...');

        // 1. Build Legacy Class Map: Name -> {Kode_Kelas, Kls_Level}
        // This lets us map SIKAP Class (by Name) -> Legacy ID -> Legacy Assignments
        $classMap = [];
        $legacyClasses = DB::connection('mysql')->select("
            SELECT ka.Kode_Kelas, k.Kls, k.Kelas as Nama_Kelas
            FROM sim_lama.kelas_aktif ka
            JOIN sim_lama.kelas k ON ka.Kode_Kelas = k.Kode_Kelas
            WHERE ka.Kode_TP = ?", [$tpCode]);

        foreach ($legacyClasses as $row) {
            $classMap[$row->Nama_Kelas] = [
                'code' => $row->Kode_Kelas,
                'level' => $row->Kls
            ];
        }

        // 2. Fetch Curriculum Distribution (Mapel per Level)
        $curriculum = DB::connection('mysql')->select("
            SELECT ma.*, m.Mata_Pelajaran as Nama_Mapel
            FROM sim_lama.mapel_aktif ma
            JOIN sim_lama.mapel m ON ma.Kode_Mapel = m.Kode_Mapel
            WHERE ma.Kode_TP = ?", [$tpCode]);

        // 3. Iterate SIKAP Active Classes and Assign Subjects
        $activeClasses = ActiveClass::where('academic_year_id', $academicYear->id)->get();

        foreach ($curriculum as $subjectDef) {
            $targetLevel = $subjectDef->Kls;
            $mapelName = $subjectDef->Nama_Mapel;

            // Find Master Mapel
            // Use Code if possible for better accuracy, fall back to Name
            $mapel = Mapel::where('code', $subjectDef->Kode_Mapel)->first();
            if (!$mapel) {
                // Try by name
                $mapel = Mapel::where('name', $mapelName)->first();
            }
            if (!$mapel) continue;

            foreach ($activeClasses as $ac) {
                // Check if this class is at the target level
                // We use the Name to lookup in classMap
                if (!isset($classMap[$ac->name])) continue;

                $legacyInfo = $classMap[$ac->name];
                if ($legacyInfo['level'] != $targetLevel) continue;

                // Create Active Subject
                $activeSubject = ActiveSubject::firstOrCreate([
                    'active_class_id' => $ac->id,
                    'mapel_id' => $mapel->id,
                ]);

                // 4. Find Teachers (Assignments)
                // specific to this Class ID and Mapel
                $legacyClassCode = $legacyInfo['code'];

                $assignments = DB::connection('mysql')->select(
                    "
                    SELECT * FROM sim_lama.guru_mapel 
                    WHERE Kode_TP = ? AND Kode_Kelas = ? AND Kode_Mapel = ?",
                    [$tpCode, $legacyClassCode, $subjectDef->Kode_Mapel]
                );

                foreach ($assignments as $assign) {
                    $teacherUser = User::where('nomor_induk', $assign->Kode_Guru)->first();
                    if ($teacherUser) {
                        SubjectTeacher::firstOrCreate([
                            'active_subject_id' => $activeSubject->id,
                            'teacher_id' => $teacherUser->id,
                        ], [
                            'is_main' => 1
                        ]);
                    }
                }
            }
        }
        $this->info('Active Subjects & Teachers migrated.');
    }
}
