<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class StudentTahfidzController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Ensure user is a student
        if (!$user->student) {
            return Inertia::render('Student/Tahfidz/Index', [
                'error' => 'Anda sedang melihat halaman ini sebagai Administrator/Guru. Halaman ini sejatinya adalah tampilan khusus Siswa.',
                'student' => null,
            ]);
        }

        $student = $user->student;
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        // Load Active Class & Members ONLY FOR CURRENT ACADEMIC YEAR
        $academicYearId = \App\Services\AcademicStateService::currentAcademicYear()->id;

        $member = \App\Models\ClassMember::where('student_id', $student->id)
            ->whereHas('activeClass', function ($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })
            ->with(['activeClass.kelas.jenjang', 'activeClass.kelasParalel'])
            ->latest()
            ->first();

        $activeClass = $member ? $member->activeClass : null;
        $className = $activeClass ? trim(($activeClass->kelas?->name ?? '') . ' ' . ($activeClass->kelasParalel?->name ?? '')) : '-';

        // Dapatkan semua ID Mapel yang mengandung kata Tahfidz / Tahfizh
        $tahfidzMapelIds = \App\Models\Mapel::where('name', 'like', '%Tahfi%')->pluck('id');

        $tahfidzGrades = [];
        if ($activeSemester) {
            $tahfidzGrades = \App\Models\StudentGrade::where('student_id', $student->id)
                ->whereHas('activeSubject', function ($q) use ($tahfidzMapelIds) {
                    $q->whereIn('mapel_id', $tahfidzMapelIds);
                })
                ->where('semester_id', $activeSemester->id)
                ->with(['activeSubject.mapel', 'gradeWeight', 'tahfidzDetails', 'semester'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Debug: Log nilai score dan original_score
            \Log::info('Tahfidz Grades Debug', [
                'student_id' => $student->id,
                'grades' => $tahfidzGrades->map(function($grade) {
                    return [
                        'id' => $grade->id,
                        'score' => $grade->score,
                        'original_score' => $grade->original_score,
                        'display_value' => $grade->original_score ?? $grade->score,
                    ];
                })->toArray()
            ]);
        }

        // 2. Fetch Setoran Perolehan Hafalan
        $tahfidzEntries = \App\Models\TahfidzEntry::with('teacher')
            ->where('student_id', $student->id)
            ->orderBy('date', 'desc')
            ->get();

        // 3. Fetch Verifikasi Halaqoh (Tahfidz Monitoring)
        $halaqohAttendances = \App\Models\TahfidzMonitoring::with(['session.officer', 'attendances.musyrif'])
            ->where('user_id', $user->id)
            ->orderBy('recorded_at', 'desc')
            ->get();

        // 4. Riwayat Skrining Mandiri
        $skriningRecords = \App\Models\HafalanSkrining::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate total hafalan estimation from TahfidzMemorization if available
        $memorizations = \App\Models\TahfidzMemorization::where('student_id', $student->id)
            ->orderBy('juz', 'asc')
            ->get();

        $memorizationCount = $memorizations->where('is_completed', true)->count();

        // Get Screening Reports for mapping
        $screeningReports = \App\Models\HafalanSkriningReport::where('user_id', $user->id)
            ->get()
            ->keyBy('juz_number');

        $memorizationSummary = $memorizations->map(function ($m) use ($screeningReports) {
            $report = $screeningReports->get($m->juz);
            return [
                'juz' => $m->juz,
                'is_completed' => $m->is_completed,
                'confirmed_at' => $m->updated_at->format('d M Y'),
                'has_screening' => !!$report,
                'screening_id' => $report ? $report->id : null,
                'total_mistakes' => $report ? $report->total_mistakes : 0,
            ];
        });

        return Inertia::render('Student/Tahfidz/Index', [
            'student' => $student,
            'className' => $className,
            'semesterName' => $activeSemester ? $activeSemester->name : '-',
            'memorizationCount' => $memorizationCount,
            'memorizationSummary' => $memorizationSummary,
            'tahfidzGrades' => $tahfidzGrades,
            'tahfidzEntries' => $tahfidzEntries,
            'halaqohAttendances' => $halaqohAttendances,
            'skriningRecords' => $skriningRecords,
            'error' => null
        ]);
    }
}
