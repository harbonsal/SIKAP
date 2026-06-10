<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\ActiveSubject;
use App\Models\AcademicYear;
use App\Models\User;
use App\Models\Semester;
use App\Models\SemesterSubjectTeacher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class SubjectTeacherController extends Controller
{
    public function __construct()
    {
        // Assuming permissions are similar, or we can create new ones. Using view_active_subjects for now.
        $this->middleware('permission:view_active_subjects')->only(['index', 'show']);
        $this->middleware('permission:edit_active_subjects')->only(['update']);
    }

    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $request->academic_year_id ?? ($activeYear ? $activeYear->id : null);

        if (!$activeYearId) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        $query = User::query()
            ->where('status', 'Aktif')
            ->where(function ($q) use ($activeYearId) {
                // Include explicit teaching roles via Category (Primary or Secondary)
                $q->whereHas('userLevel', function ($subQ) {
                    $subQ->where('category', 'Ustadz');
                })->orWhereHas('additionalLevels', function ($subQ) {
                    $subQ->where('category', 'Ustadz');
                })
                    // OR include anyone who already has a quota set for this year
                    ->orWhereHas('teacherQuota', function ($subQ) use ($activeYearId) {
                        $subQ->where('academic_year_id', $activeYearId);
                    })
                    // OR include anyone who is assigned to a subject this year
                    ->orWhereHas('activeSubjects', function ($subQ) use ($activeYearId) {
                        $subQ->whereHas('activeClass', function ($classQ) use ($activeYearId) {
                            $classQ->where('academic_year_id', $activeYearId);
                        });
                    });
            })
            ->with(['teacherQuota' => function ($q) use ($activeYearId) {
                $q->where('academic_year_id', $activeYearId);
            }])
            ->with(['activeSubjects' => function ($q) use ($activeYearId) {
                $q->whereHas('activeClass', function ($sq) use ($activeYearId) {
                    $sq->where('academic_year_id', $activeYearId);
                });
                $q->with(['mapel', 'activeClass.kelas', 'activeClass.kelasParalel']);
            }]);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
            });
        }

        $teachers = $query->orderBy('name')->paginate(20)->withQueryString();

        // Transform data to include helper attributes
        $teachers->getCollection()->transform(function ($teacher) {
            $teacher->assigned_hours = $teacher->activeSubjects->sum('jam');
            $teacher->max_hours = $teacher->teacherQuota ? $teacher->teacherQuota->max_hours : 0;
            return $teacher;
        });

        return Inertia::render('Settings/Education/SubjectTeacher/Index', [
            'teachers' => $teachers,
            'activeYearId' => $activeYearId,
            'filters' => $request->only(['search', 'academic_year_id']),
        ]);
    }

    public function show(ActiveClass $subjectTeacher) // Route param is 'subject_teacher' (active_class_id)
    {
        $activeClass = $subjectTeacher->load([
            'academicYear',
            'kelas',
            'kelasParalel',
            'teacher',
            'semesterHomeroomTeachers.semester', // Load overrides
            'semesterHomeroomTeachers.teacher'
        ]);

        $subjects = ActiveSubject::where('active_class_id', $activeClass->id)
            ->with([
                'mapel',
                'teacher',
                'semesterSubjectTeachers.semester', // Load overrides
                'semesterSubjectTeachers.teacher'
            ])
            ->get()
            ->sortBy('mapel.name')
            ->values();

        // Get all teachers (Include Ustadz category from primary OR secondary roles)
        $teachers = User::where('status', 'Aktif')
            ->where(function ($q) {
                $q->whereHas('userLevel', function ($subQ) {
                    $subQ->where('category', 'Ustadz');
                })->orWhereHas('additionalLevels', function ($subQ) {
                    $subQ->where('category', 'Ustadz');
                });
            })->orderBy('name')->get();

        $semesters = Semester::all();

        return Inertia::render('Settings/Education/SubjectTeacher/Show', [
            'activeClass' => $activeClass,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'semesters' => $semesters,
        ]);
    }

    public function update(Request $request, ActiveSubject $subjectTeacher) // Route param is 'subject_teacher' (active_subject_id)
    {
        $request->validate([
            'teacher_id' => 'nullable|exists:users,id',
            'semester_id' => 'nullable|exists:semesters,id',
        ]);

        if ($request->filled('semester_id')) {
            // Update/Create Semester Specific Override
            if ($request->teacher_id) {
                SemesterSubjectTeacher::updateOrCreate(
                    [
                        'active_subject_id' => $subjectTeacher->id,
                        'semester_id' => $request->semester_id,
                    ],
                    [
                        'teacher_id' => $request->teacher_id,
                    ]
                );
            } else {
                // If clearing teacher for semester, delete override
                SemesterSubjectTeacher::where('active_subject_id', $subjectTeacher->id)
                    ->where('semester_id', $request->semester_id)
                    ->delete();
            }
            $msg = 'Guru semester berhasil diperbarui.';
        } else {
            // Update Annual Default
            $subjectTeacher->update([
                'teacher_id' => $request->teacher_id,
            ]);
            $msg = 'Guru utama (tahunan) berhasil diperbarui.';
        }

        // --- SYNC SCHEDULE START ---
        // Automatically update the teacher in the Schedule table
        // Calculate the effective teacher based on current active semester
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();
        $effectiveTeacherId = $subjectTeacher->teacher_id; // Default to annual

        if ($activeSemester) {
            $override = SemesterSubjectTeacher::where('active_subject_id', $subjectTeacher->id)
                ->where('semester_id', $activeSemester->id)
                ->first();

            if ($override && $override->teacher_id) {
                $effectiveTeacherId = $override->teacher_id;
            }
        }

        // Update all related schedule entries
        try {
            // We fetch the potential schedules first to avoid updating if it causes conflict? 
            // Or just try-catch the bulk update.
            // Note: Update on builder might fail all if one fails. 
            // Better to ignore errors? or Log?
            // For now, simple try-catch to ensure Plotting Save succeeds.
            \App\Models\Schedule::where('active_subject_id', $subjectTeacher->id)
                ->update(['teacher_id' => $effectiveTeacherId]);
        } catch (\Exception $e) {
            // Log error or ignore. Conflict means schedule is double-booked.
            // User will see mismatched schedule and fix it there.
            \Log::error('Schedule Sync Failed: ' . $e->getMessage());
        }
        // --- SYNC SCHEDULE END ---

        return redirect()->back()->with('success', $msg);
    }
}
