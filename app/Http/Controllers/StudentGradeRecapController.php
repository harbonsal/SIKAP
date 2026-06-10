<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use App\Models\ActiveClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class StudentGradeRecapController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = Student::with(['user', 'classMembers' => function ($q) use ($activeYear) {
            // Filter classMembers to only eager load the one for the current active year
            // This ensures when we access classMembers in frontend/backend, we primarily see the relevant one
            // However, typical eager loading constraints don't filter the *parent* model result without whereHas.
            if ($activeYear) {
                $q->whereHas('activeClass', function ($query) use ($activeYear) {
                    $query->where('academic_year_id', $activeYear->id);
                });
            }
            $q->with(['activeClass.kelas', 'activeClass.kelasParalel']);
        }])
            ->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            });

        // ONLY show students active in the current academic year
        if ($activeYear) {
            $query->whereHas('classMembers.activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });
        }

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->active_class_id) {
            $query->whereHas('classMembers', function ($q) use ($request) {
                $q->where('active_class_id', $request->active_class_id);
            });
        }

        // Sort by NIS (Nomor Induk)
        $query->join('users', 'students.user_id', '=', 'users.id')
            ->orderBy('users.nomor_induk', 'asc')
            ->select('students.*'); // Preserve student model structure

        $students = $query->paginate(20)->withQueryString();

        // Get active classes for filter dropdown
        $activeClasses = [];
        if ($activeYear) {
            $classQuery = ActiveClass::with(['kelas', 'kelasParalel'])
                ->where('academic_year_id', $activeYear->id);

            // [FILTER] Restrict classes for Teachers (Non-Admin/Non-Kepsek)
            $user = Auth::user();
            if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah')) {
                $classQuery->where(function ($q) use ($user) {
                    $q->where('teacher_id', $user->id) // As Homeroom
                        ->orWhereHas('activeSubjects', function ($subQ) use ($user) {
                            $subQ->where('teacher_id', $user->id); // As Subject Teacher
                        });
                });
            }

            $activeClasses = $classQuery->orderBy('name')->get();
        }

        return Inertia::render('Teacher/Assessment/Recap/Student/Index', [
            'students' => $students,
            'activeClasses' => $activeClasses,
            'filters' => $request->only(['search', 'active_class_id']),
        ]);
    }

    public function show(Request $request, $id)
    {
        $student = Student::with(['user', 'classMembers.activeClass.kelas', 'classMembers.activeClass.kelasParalel'])
            ->findOrFail($id);

        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();

        // Use requested semester, fallback to active or Ganjil
        $targetSemesterName = $request->semester ?: ($activeSemester ? $activeSemester->name : 'Ganjil');
        $targetSemester = Semester::where('name', $targetSemesterName)->first();

        if (!$activeYear || !$targetSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum diatur.');
        }

        // Find the student's active class for the current academic year
        $classMember = $student->classMembers()
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            })
            ->with(['activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.teacher'])
            ->first();

        if (!$classMember) {
            return redirect()->back()->with('error', 'Siswa tidak terdaftar di kelas aktif tahun ini.');
        }

        $activeClassId = $classMember->active_class_id;

        // Determine Sem 2 Logic based on TARGET semester
        $isSem2View = $targetSemester->name === 'Genap' || $targetSemester->name === 'Semester 2';

        // 1. Get all subjects for this class
        $activeSubjects = ActiveSubject::with('mapel')
            ->where('active_class_id', $activeClassId)
            ->get();

        // 2. Prepare Semesters Context
        $sem1 = null;
        if ($isSem2View) {
            $sem1 = Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        // 3. Get Grade Weights
        $sortGradeWeights = function ($collection) {
            $orderMap = [
                'UH1' => 1,
                'UTS' => 2,
                'UH2' => 3,
                'UKK' => 4,
                'UAS' => 5,
            ];
            
            return $collection
                ->filter(function ($w) {
                    $name = strtoupper($w->name);
                    return !str_contains($name, 'VALIDASI') && !str_contains($name, 'VALIDATION');
                })
                ->sortBy(function ($w) use ($orderMap) {
                    $name = strtoupper($w->name);
                    foreach ($orderMap as $key => $order) {
                        if (str_contains($name, $key)) return $order;
                    }
                    return 99; // Others at the end
                })
                ->values();
        };

        // Target Semester Weights
        $gradeWeightsTargetRaw = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $targetSemester->name, strtolower($targetSemester->name)])
            ->get();
        $gradeWeightsTarget = $sortGradeWeights($gradeWeightsTargetRaw);

        // Sem 1 Weights (If Sem 2 View)
        $gradeWeightsSem1 = collect();
        if ($isSem2View && $sem1) {
            $gradeWeightsSem1Raw = GradeWeight::where('academic_year_id', $activeYear->id)
                ->where('category', 'pengetahuan')
                ->whereIn('semester', ['all', 'semua', 'All', $sem1->name, strtolower($sem1->name)])
                ->get();
            $gradeWeightsSem1 = $sortGradeWeights($gradeWeightsSem1Raw);
        }

        // 4. Get All Grades for Student
        // Load grades for Target + Sem 1 (if Sem 2 view)
        $semesterIds = [$targetSemester->id];
        if ($sem1 && $isSem2View) $semesterIds[] = $sem1->id;

        $student->load(['studentGrades' => function ($q) use ($activeSubjects, $semesterIds) {
            $q->whereIn('active_subject_id', $activeSubjects->pluck('id'))
                ->whereIn('semester_id', $semesterIds);
        }]);

        // 5. Structure the data
        $gradesData = $activeSubjects->map(function ($subject) use ($student, $gradeWeightsTarget, $gradeWeightsSem1, $targetSemester, $sem1, $isSem2View) {

            // --- Calculation Helper ---
            $calculateScore = function ($weights, $semesterId) use ($student, $subject) {
                $subjectGrades = $student->studentGrades
                    ->where('active_subject_id', $subject->id)
                    ->where('semester_id', $semesterId);

                $final = 0;
                foreach ($weights as $weight) {
                    $grade = $subjectGrades->where('grade_weight_id', $weight->id)->first();
                    $score = $grade ? $grade->score : 0;
                    $final += $score * ($weight->weight / 100);
                }
                return round($final);
            };

            // Target Semester Components (View)
            $components = [];
            $subjectGradesTarget = $student->studentGrades
                ->where('active_subject_id', $subject->id)
                ->where('semester_id', $targetSemester->id);

            foreach ($gradeWeightsTarget as $weight) {
                $grade = $subjectGradesTarget->where('grade_weight_id', $weight->id)->first();
                $score = $grade ? $grade->score : 0;
                $components[] = [
                    'weight_id' => $weight->id,
                    'name' => $weight->name,
                    'weight_percent' => $weight->weight,
                    'score' => $score,
                ];
            }

            // Calculate Scores
            $scoreTarget = $calculateScore($gradeWeightsTarget, $targetSemester->id);

            $scoreSem1 = 0;
            $finalRapor = $scoreTarget;

            if ($isSem2View && $sem1) {
                $scoreSem1 = $calculateScore($gradeWeightsSem1, $sem1->id);
                // Formula: (Sem 1 + (2 * Sem 2)) / 3
                $finalRapor = round(($scoreSem1 + (2 * $scoreTarget)) / 3);
            }

            return [
                'subject_id' => $subject->id,
                'subject_name' => $subject->mapel->name,
                'kkm' => 70,
                'components' => $components,
                'final_score' => $scoreTarget, // Raw Target Score (Jumlah)
                'sem1_score' => $isSem2View ? $scoreSem1 : null,
                'rapor_score' => $finalRapor,
            ];
        });

        $averageScore = $gradesData->count() > 0 ? $gradesData->avg('rapor_score') : 0;

        return Inertia::render('Teacher/Assessment/Recap/Student/Show', [
            'student' => $student,
            'activeClass' => $classMember->activeClass,
            'gradesData' => $gradesData,
            'academicYear' => $activeYear,
            'semester' => $targetSemester, // Pass Target Semester
            'averageScore' => round($averageScore, 2),
            'isSem2' => $isSem2View,
        ]);
    }
}
