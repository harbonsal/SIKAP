<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\ClassMember;
use App\Models\KamarMember;
use App\Models\Student;

class VerifyStudents extends Command
{
    protected $signature = 'verify:students';
    protected $description = 'Verify 2025/2026 student data synchronization';

    public function handle()
    {
        $ay = AcademicYear::where('name', '2025/2026')->first();
        if (!$ay) {
            $this->error('Academic Year 2025/2026 not found!');
            return 1;
        }
        $this->info("TARGET: Sinkronisasi Data 2025/2026 (Ref: NIS)");
        $this->info("Academic Year: {$ay->name} (ID: {$ay->id})");

        // 1. Valid Active Students (Master Data)
        // We assume 'users.status' = 'Aktif' and 'users.user_level' is related to Student
        // Getting all students with active user account
        $activeStudents = Student::whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        })->with('user')->get();

        $activeByNis = $activeStudents->mapWithKeys(function ($s) {
            return [$s->user->nomor_induk => $s];
        });

        $this->info("Total Santri Aktif (Master): " . $activeStudents->count());
        $this->info("Target (SIM Lama): 355");

        // 2. Existing Class Memberships
        $classMembers = ClassMember::whereHas('activeClass', function ($q) use ($ay) {
            $q->where('academic_year_id', $ay->id);
        })->with('student.user', 'activeClass.kelas', 'activeClass.kelasParalel')->get();

        // Group by NIS
        $groupedClasses = $classMembers->groupBy(function ($item) {
            return $item->student->user->nomor_induk ?? 'NO_NIS_' . $item->student_id;
        });

        // A. DUPLICATES (GANDA)
        $this->info("\n[1] CEK DATA GANDA (Duplicate Check)");
        $duplicates = $groupedClasses->filter(function ($g) {
            return $g->count() > 1;
        });

        if ($duplicates->count() > 0) {
            $this->error("Ditemukan " . $duplicates->count() . " NIS dengan data kelas ganda:");
            foreach ($duplicates as $nis => $members) {
                $s = $members->first()->student;
                $this->line("NIS: $nis - {$s->name}");
                foreach ($members as $m) {
                    $cls = $m->activeClass;
                    $this->line("   - ID: {$m->id} | Kelas: {$cls->kelas->name} {$cls->kelasParalel->name} | Updated: {$m->updated_at}");
                }
            }
        } else {
            $this->info("OK: Tidak ada NIS ganda di kelas.");
        }

        // B. MISSING (KURANG)
        $this->info("\n[2] CEK SANTRI BELUM MASUK KELAS");
        // Check which Valid Active Students are NOT in Class List
        $missingNis = [];
        foreach ($activeByNis as $nis => $student) {
            if (!isset($groupedClasses[$nis])) {
                $missingNis[] = $student;
            }
        }

        // Custom filter to remove Alumni/Non-Aktif if status check isn't enough
        // We rely on user status 'Aktif'

        if (count($missingNis) > 0) {
            $this->warn("Ditemukan " . count($missingNis) . " Santri Aktif belum masuk kelas:");
            foreach (array_slice($missingNis, 0, 20) as $s) {
                $this->line(" - NIS: {$s->user->nomor_induk} | {$s->name}");
            }
            if (count($missingNis) > 20) $this->line("... dan " . (count($missingNis) - 20) . " lainnya.");
        } else {
            $this->info("OK: Semua santri aktif sudah masuk kelas.");
        }

        // C. KAMAR SYNC
        $this->info("\n[3] CEK SINKRONISASI KAMAR");
        $kamarMembers = KamarMember::whereHas('activeKamar', function ($q) use ($ay) {
            $q->where('academic_year_id', $ay->id);
        })->with('student.user', 'activeKamar')->get();

        $kamarByNis = $kamarMembers->groupBy(function ($item) {
            return $item->student->user->nomor_induk ?? 'NO_NIS_' . $item->student_id;
        });

        $studentsWithClassNoRoom = [];
        foreach ($groupedClasses as $nis => $members) {
            if (!isset($kamarByNis[$nis])) {
                $studentsWithClassNoRoom[] = $members->first()->student;
            }
        }

        if (count($studentsWithClassNoRoom) > 0) {
            $this->warn("Ditemukan " . count($studentsWithClassNoRoom) . " Santri punya kelas tapi BELUM punya kamar:");
            foreach (array_slice($studentsWithClassNoRoom, 0, 10) as $s) {
                $this->line(" - NIS: {$s->user->nomor_induk} | {$s->name}");
            }
        } else {
            $this->info("OK: Semua santri berkelas sudah punya kamar.");
        }

        return 0;
    }
}
