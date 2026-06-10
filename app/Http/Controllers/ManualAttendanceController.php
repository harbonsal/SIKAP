<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\AttendanceSummary;
use App\Services\AcademicStateService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ManualAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $academicYear = AcademicStateService::currentAcademicYear();
        $currentSemester = AcademicStateService::currentSemester();

        if (!$academicYear) {
            return redirect()->back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        $query = ActiveClass::with(['kelas', 'kelasParalel', 'teacher', 'semesterHomeroomTeachers.teacher'])
            ->where('academic_year_id', $academicYear->id);

        if (!$user->hasRole('Administrator')) {
            $query->where(function ($q) use ($user, $currentSemester) {
                $q->where('teacher_id', $user->id);

                if ($currentSemester) {
                    $q->orWhereHas('semesterHomeroomTeachers', function ($overrideQuery) use ($user, $currentSemester) {
                        $overrideQuery
                            ->where('semester_id', $currentSemester->id)
                            ->where('teacher_id', $user->id);
                    });
                }
            });
        }

        if ($request->search) {
            $query->whereHas('kelas', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $query->join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->select('active_classes.*')
            ->orderBy('kelas.jenjang_id')
            ->orderBy('kelas.name')
            ->orderBy('active_classes.id');

        $activeClasses = $query->paginate(20)->withQueryString();
        $activeClasses->getCollection()->transform(function ($activeClass) use ($currentSemester) {
            $effectiveTeacher = $currentSemester
                ? $activeClass->homeroomForSemester($currentSemester->id)
                : $activeClass->teacher;

            $activeClass->setAttribute('effective_teacher_name', $effectiveTeacher?->name);

            return $activeClass;
        });

        return Inertia::render('Academic/Attendance/Manual/Index', [
            'activeClasses' => $activeClasses,
            'academicYear' => $academicYear,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Request $request, ActiveClass $activeClass)
    {
        $user = Auth::user();
        $currentSemester = AcademicStateService::currentSemester();
        $activeClass->loadMissing('semesterHomeroomTeachers.teacher');

        if (!$this->canAccessClass($user, $activeClass, $currentSemester?->id)) {
            abort(403, 'Anda tidak memiliki akses ke kelas ini.');
        }

        $activeClass->load(['classMembers.student.user', 'kelas', 'kelasParalel', 'academicYear']);

        $academicYear = $activeClass->academicYear;
        $semester = $request->input('semester', $currentSemester?->name ?? 'Ganjil');

        $students = $activeClass->classMembers->map(function ($member) use ($academicYear, $semester) {
            $student = $member->student;

            $summary = AttendanceSummary::where('student_id', $student->user_id)
                ->where('academic_year_id', $academicYear->id)
                ->where('semester', $semester)
                ->first();

            return [
                'student_id' => $student->user->id,
                'nis' => $student->user->nomor_induk,
                'name' => $student->user->name,
                'sakit' => $summary ? $summary->sakit : 0,
                'izin' => $summary ? $summary->izin : 0,
                'alpa' => $summary ? $summary->alpa : 0,
            ];
        });

        return Inertia::render('Academic/Attendance/Manual/Show', [
            'activeClass' => $activeClass,
            'students' => $students,
            'semester' => $semester,
            'academicYear' => $academicYear,
        ]);
    }

    public function store(Request $request, ActiveClass $activeClass)
    {
        \Log::info('ManualAttendance Store Request:', $request->all());

        $user = Auth::user();
        $currentSemester = AcademicStateService::currentSemester();
        $activeClass->loadMissing('semesterHomeroomTeachers.teacher');

        if (!$this->canAccessClass($user, $activeClass, $currentSemester?->id)) {
            abort(403, 'Anda tidak memiliki akses ke kelas ini.');
        }

        $validated = $request->validate([
            'semester' => 'required|string',
            'students' => 'required|array',
            'students.*.student_id' => 'required|exists:users,id',
            'students.*.sakit' => 'nullable|numeric|min:0',
            'students.*.izin' => 'nullable|numeric|min:0',
            'students.*.alpa' => 'nullable|numeric|min:0',
        ]);

        $academicYearId = $activeClass->academic_year_id;
        $semester = $validated['semester'];

        foreach ($validated['students'] as $data) {
            AttendanceSummary::updateOrCreate(
                [
                    'student_id' => $data['student_id'],
                    'academic_year_id' => $academicYearId,
                    'semester' => $semester,
                ],
                [
                    'active_class_id' => $activeClass->id, // Update class if changed?
                    'sakit' => $data['sakit'] ?? 0,
                    'izin' => $data['izin'] ?? 0,
                    'alpa' => $data['alpa'] ?? 0,
                ]
            );
        }

        return redirect()->back()->with('success', 'Data absensi manual berhasil disimpan.');
    }

    private function canAccessClass($user, ActiveClass $activeClass, ?int $semesterId): bool
    {
        if ($user->hasRole('Administrator')) {
            return true;
        }

        if ((int) $activeClass->teacher_id === (int) $user->id) {
            return true;
        }

        if (!$semesterId) {
            return false;
        }

        return $activeClass->semesterHomeroomTeachers->contains(function ($assignment) use ($user, $semesterId) {
            return (int) $assignment->semester_id === (int) $semesterId
                && (int) $assignment->teacher_id === (int) $user->id;
        });
    }
}
