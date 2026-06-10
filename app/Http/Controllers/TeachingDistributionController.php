<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveSubject;
use App\Models\TeacherQuota;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeachingDistributionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_active_subjects')->only(['index']);
        $this->middleware('permission:edit_active_subjects')->only(['updateQuota', 'bulkUpdateQuota']);
    }

    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$activeYear) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        $query = User::query()
            ->whereHas('userLevel', function ($q) {
                // Filter for 'Askar' category (non-Santri)
                $q->whereNotIn('name', ['Santri', 'Santri Khusus', 'Santri Dengan Catatan']);
            })
            ->with(['teacherQuota' => function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            }]);

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $teachers = $query->orderBy('name')->paginate(20)->withQueryString();

        // Calculate assigned hours (Terjadwal) for each teacher by counting scheduled slots
        $teachers->getCollection()->transform(function ($teacher) use ($activeYear) {
            $assignedHours = \App\Models\Schedule::where('teacher_id', $teacher->id)
                ->where('academic_year_id', $activeYear->id)
                ->count();

            $teacher->assigned_hours = $assignedHours;
            $teacher->max_hours = $teacher->teacherQuota ? $teacher->teacherQuota->max_hours : 0;

            return $teacher;
        });

        // --- Class Analysis Data ---
        $activeClasses = \App\Models\ActiveClass::where('academic_year_id', $activeYear->id)
            ->with(['kelas', 'kelasParalel', 'teacher', 'activeSubjects'])
            ->get()
            ->map(function ($class) use ($activeYear) {
                $targetHours = $class->total_hours_per_week ?: 35;
                $assignedHours = \App\Models\Schedule::where('active_class_id', $class->id)
                    ->where('academic_year_id', $activeYear->id)
                    ->count();
                $missingTeacherCount = $class->activeSubjects->whereNull('teacher_id')->count();

                return [
                    'id' => $class->id,
                    'name' => ($class->kelas->name ?? '') . ($class->kelasParalel ? ' ' . $class->kelasParalel->name : ''),
                    'full_name' => $class->name ? $class->name : (($class->kelas->name ?? '') . ($class->kelasParalel ? ' ' . $class->kelasParalel->name : '')),
                    'teacher' => $class->teacher,
                    'target_hours' => $targetHours,
                    'assigned_hours' => $assignedHours,
                    'remaining_hours' => max(0, $targetHours - $assignedHours),
                    'is_complete' => $assignedHours >= $targetHours,
                    'missing_teacher_count' => $missingTeacherCount,
                    'status' => ($assignedHours < $targetHours) ? 'Kurang Jam' : 'Lengkap',
                ];
            })
            ->sortBy('name') // Sort by class name naturally
            ->values();

        // Summary Statistics
        $summary = [
            'total_classes' => $activeClasses->count(),
            'incomplete_hours_count' => $activeClasses->where('is_complete', false)->count(),
            'missing_teacher_count' => $activeClasses->where('missing_teacher_count', '>', 0)->count(),
            'total_unallocated_hours' => $activeClasses->sum('remaining_hours'),
        ];

        return Inertia::render('Settings/Education/TeachingDistribution/Index', [
            'teachers' => $teachers,
            'activeClasses' => $activeClasses,
            'summary' => $summary,
            'filters' => $request->only(['search']),
            'academicYear' => $activeYear,
        ]);
    }

    public function updateQuota(Request $request, User $user)
    {
        $request->validate([
            'max_hours' => 'required|integer|min:0',
        ]);

        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$activeYear) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        TeacherQuota::updateOrCreate(
            [
                'user_id' => $user->id,
                'academic_year_id' => $activeYear->id,
            ],
            [
                'max_hours' => $request->max_hours,
            ]
        );

        return redirect()->back()->with('success', 'Kuota mengajar berhasil diperbarui.');
    }

    public function bulkUpdateQuota(Request $request)
    {
        $request->validate([
            'quotas' => 'required|array',
            'quotas.*' => 'integer|min:0',
        ]);

        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$activeYear) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        foreach ($request->quotas as $userId => $maxHours) {
            TeacherQuota::updateOrCreate(
                [
                    'user_id' => $userId,
                    'academic_year_id' => $activeYear->id,
                ],
                [
                    'max_hours' => $maxHours,
                ]
            );
        }

        return redirect()->back()->with('success', 'Kuota mengajar berhasil diperbarui secara massal.');
    }
}
