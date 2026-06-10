<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ClassGradeRecapController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum diatur.');
        }

        $query = ActiveClass::with(['kelas', 'kelasParalel', 'teacher'])
            ->where('academic_year_id', $activeYear->id)
            ->join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->select('active_classes.*')
            ->orderBy('kelas.jenjang_id')
            ->orderBy('kelas.name')
            ->orderBy('active_classes.id'); // Deterministic fallback

        // Filter logic can be added here if needed (e.g. only show classes for specific teacher?)
        // For now, let's show all classes to Admin/Staff, or maybe filter for Teachers?
        // The user request implies a general recap, so maybe all classes.

        if ($request->search) {
            $query->whereHas('kelas', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $activeClasses = $query->paginate(10)->withQueryString();

        return Inertia::render('Teacher/Assessment/Recap/Class/Index', [
            'activeClasses' => $activeClasses,
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
        ]);
    }

    public function show(Request $request, $id)
    {
        $activeClass = ActiveClass::with(['kelas', 'kelasParalel', 'teacher', 'classMembers.student.user'])
            ->findOrFail($id);

        $activeYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();

        $targetSemesterName = $request->semester ?: ($activeSemester ? $activeSemester->name : 'Ganjil');
        $targetSemester = Semester::where('name', $targetSemesterName)->first();

        // 1. Get all subjects for this class
        $activeSubjects = ActiveSubject::with(['mapel', 'teacher'])
            ->where('active_class_id', $id)
            ->get();

        // Sem 2 Logic
        $isSem2View = $targetSemester->name === 'Genap' || $targetSemester->name === 'Semester 2';
        $sem1 = null;
        if ($isSem2View) {
            $sem1 = Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        // 2. Get all grade weights
        // Target Sem Weights
        $gradeWeightsTarget = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $targetSemester->name, strtolower($targetSemester->name)])
            ->get();

        // Sem 1 Weights
        $gradeWeightsSem1 = collect();
        if ($isSem2View && $sem1) {
            $gradeWeightsSem1 = GradeWeight::where('academic_year_id', $activeYear->id)
                ->where('category', 'pengetahuan')
                ->whereIn('semester', ['all', 'semua', 'All', $sem1->name, strtolower($sem1->name)])
                ->get();
        }

        // 3. Get all grades for students in this class
        // Load grades for both Semesters (Target + Sem 1)
        $semesterIds = [$targetSemester->id];
        if ($sem1 && $isSem2View) $semesterIds[] = $sem1->id;

        // Load all student grades with proper eager loading
        $activeClass->load(['classMembers.student.studentGrades' => function ($q) use ($activeSubjects, $semesterIds) {
            $q->whereIn('active_subject_id', $activeSubjects->pluck('id'))
                ->whereIn('semester_id', $semesterIds)
                ->with('gradeWeight'); // Ensure grade weight is loaded
        }]);

        // 4. Calculate Final Grades and Rank
        $studentRecaps = $activeClass->classMembers->map(function ($member) use ($activeSubjects, $gradeWeightsTarget, $gradeWeightsSem1, $targetSemester, $sem1, $isSem2View) {
            $student = $member->student;
            $grades = $student->studentGrades;
            $subjectsData = [];
            $totalScore = 0;

            // Helper Calc
            $calc = function ($weights, $semId, $subjId) use ($grades) {
                $sg = $grades->where('active_subject_id', $subjId)->where('semester_id', $semId);
                $final = 0;
                foreach ($weights as $w) {
                    $g = $sg->where('grade_weight_id', $w->id)->first();
                    $s = $g ? $g->score : 0;
                    $final += $s * ($w->weight / 100);
                }
                return round($final);
            };

            foreach ($activeSubjects as $subject) {

                $scoreTarget = $calc($gradeWeightsTarget, $targetSemester->id, $subject->id);
                $finalScore = $scoreTarget;

                if ($isSem2View && $sem1) {
                    $scoreSem1 = $calc($gradeWeightsSem1, $sem1->id, $subject->id);
                    $finalScore = round(($scoreSem1 + (2 * $scoreTarget)) / 3);
                }

                $subjectsData[$subject->id] = [
                    'final_score' => $finalScore,
                ];
                $totalScore += $finalScore;
            }

            $averageScore = $activeSubjects->count() > 0 ? $totalScore / $activeSubjects->count() : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'nomor_induk' => $student->nomor_induk,
                'subjects' => $subjectsData,
                'total_score' => $totalScore,
                'average_score' => round($averageScore, 2),
            ];
        });

        // Sort by Total Score Descending to get Rank
        $studentRecaps = $studentRecaps->sortByDesc('total_score')->values();

        // Add Rank to data
        $studentRecaps = $studentRecaps->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // Fetch KKMs
        $kkms = \App\Models\Kkm::where('kelas_id', $activeClass->kelas_id)->get()->keyBy('mapel_id');

        // Fetch grade weights for Ledger tab (exclude 'Validasi' category)
        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->where('name', '!=', 'Validasi')
            ->whereIn('semester', ['all', 'semua', 'All', $targetSemester->name, strtolower($targetSemester->name)])
            ->orderBy('id')
            ->get();

        // Calculate detailed ledger data (individual weight scores breakdown)
        $studentLedgers = $activeClass->classMembers->map(function ($member) use ($activeSubjects, $gradeWeights, $targetSemester, $isSem2View, $sem1, $gradeWeightsSem1) {
            $student = $member->student;
            $grades = $student->studentGrades;
            $subjectsData = [];
            $totalScore = 0;

            // Helper Calc for Sem 1
            $calc = function ($weights, $semId, $subjId) use ($grades) {
                $sg = $grades->where('active_subject_id', $subjId)->where('semester_id', $semId);
                $final = 0;
                foreach ($weights as $w) {
                    $g = $sg->where('grade_weight_id', $w->id)->first();
                    $s = $g ? $g->score : 0;
                    $final += $s * ($w->weight / 100);
                }
                return round($final);
            };

            foreach ($activeSubjects as $subject) {
                $subjectGrades = $grades->where('active_subject_id', $subject->id)
                    ->where('semester_id', $targetSemester->id);
                $weightsData = [];
                $finalSubjectScore = 0;

                foreach ($gradeWeights as $weight) {
                    $grade = $subjectGrades->where('grade_weight_id', $weight->id)->first();
                    $score = $grade ? $grade->score : null;
                    $weightsData[$weight->id] = $score;

                    // Add to final score according to weight percentage (only if score exists)
                    if ($score !== null) {
                        $finalSubjectScore += $score * ($weight->weight / 100);
                    }
                }

                $finalSubjectScore = round($finalSubjectScore);

                $r2Score = null;
                if ($isSem2View && $sem1) {
                    $sem1Score = $calc($gradeWeightsSem1, $sem1->id, $subject->id);
                    $r2Score = round(($sem1Score + (2 * $finalSubjectScore)) / 3);
                }

                $subjectsData[$subject->id] = [
                    'weights' => $weightsData,
                    'final_score' => $finalSubjectScore,
                    'r2_score' => $r2Score,
                ];

                $totalScore += $finalSubjectScore;
            }

            $averageScore = $activeSubjects->count() > 0 ? $totalScore / $activeSubjects->count() : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'nomor_induk' => $student->nomor_induk,
                'subjects' => $subjectsData,
                'total_score' => $totalScore,
                'average_score' => round($averageScore, 2),
            ];
        });

        // Sort by Total Score Descending to get Rank
        $studentLedgers = $studentLedgers->sortByDesc('total_score')->values();

        // Add Rank to data
        $studentLedgers = $studentLedgers->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // --- IJAZAH RECAP LOGIC ---
        // Fetch Ijazah Subjects
        $ijazahSettings = \App\Models\Setting::where('key', 'like', 'ijazah_%')->pluck('value', 'key');
        $ijazahSubjectsRaw = $ijazahSettings->get('ijazah_subjects', '[]');
        $ijazahSubjects = json_decode($ijazahSubjectsRaw ?? '[]', true);
        if (!is_array($ijazahSubjects)) $ijazahSubjects = [];
        $ijazahSubjects = array_values($ijazahSubjects);

        // Fetch Manual Grades for all students in class
        $studentIds = $activeClass->classMembers->pluck('student_id');
        $ijazahManualGradesRaw = \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
            ->whereIn('student_id', $studentIds)
            ->get();
        $ijazahManualGrades = [];
        foreach ($ijazahManualGradesRaw as $mg) {
            $ijazahManualGrades[$mg->student_id][$mg->mapel_name] = $mg->score;
        }

        $mapelToActiveSubject = $activeSubjects->keyBy('mapel_id');

        $studentIjazahs = $activeClass->classMembers->map(function ($member) use ($ijazahSubjects, $ijazahManualGrades, $targetSemester, $sem1, $gradeWeightsTarget, $gradeWeightsSem1, $isSem2View, $mapelToActiveSubject) {
            $student = $member->student;
            $grades = $student->studentGrades;
            $subjectsData = [];
            $totalScore = 0;
            $count = 0;

            // Helper Calc
            $calc = function ($weights, $semId, $subjId) use ($grades) {
                $sg = $grades->where('active_subject_id', $subjId)->where('semester_id', $semId);
                $final = 0;
                foreach ($weights as $w) {
                    $g = $sg->where('grade_weight_id', $w->id)->first();
                    $s = $g ? $g->score : 0;
                    $final += $s * ($w->weight / 100);
                }
                return round($final);
            };

            foreach ($ijazahSubjects as $idx => $subj) {
                if (!is_array($subj)) continue;
                $subjName = isset($subj['name']) ? (string)$subj['name'] : (isset($subj['mapel_name']) ? (string)$subj['mapel_name'] : '');
                $mapelId = $subj['mapel_id'] ?? null;
                $finalGrade = 0;

                // 1. Manual Grade
                if ($subjName && isset($ijazahManualGrades[$student->id][$subjName])) {
                    $finalGrade = (int) $ijazahManualGrades[$student->id][$subjName];
                }
                // 2. Calculated Grade
                elseif ($mapelId) {
                    $activeSubject = $mapelToActiveSubject->get($mapelId);
                    if ($activeSubject) {
                        $sem2Score = 0;
                        $sem1Score = 0;

                        if ($isSem2View) {
                            $sem2Score = $calc($gradeWeightsTarget, $targetSemester->id, $activeSubject->id);
                            if ($sem1) {
                                $sem1Score = $calc($gradeWeightsSem1, $sem1->id, $activeSubject->id);
                            }
                            $finalGrade = round(($sem1Score + (2 * $sem2Score)) / 3);
                        } else {
                            $finalGrade = $calc($gradeWeightsTarget, $targetSemester->id, $activeSubject->id);
                        }
                    }
                }

                $subjectsData[$idx] = [
                    'final_score' => $finalGrade,
                ];
                if ($finalGrade > 0) {
                    $totalScore += $finalGrade;
                    $count++;
                }
            }

            $averageScore = $count > 0 ? $totalScore / $count : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'nomor_induk' => $student->nomor_induk,
                'subjects' => $subjectsData,
                'total_score' => $totalScore,
                'average_score' => round($averageScore, 2),
            ];
        });

        // Sort by Total Score Descending to get Rank
        $studentIjazahs = $studentIjazahs->sortByDesc('total_score')->values();

        // Add Rank to data
        $studentIjazahs = $studentIjazahs->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });
        // --- END IJAZAH RECAP LOGIC ---

        return Inertia::render('Teacher/Assessment/Recap/Class/Show', [
            'activeClass' => $activeClass,
            'activeSubjects' => $activeSubjects,
            'gradeWeights' => $gradeWeights,
            'studentRecaps' => $studentRecaps,
            'studentLedgers' => $studentLedgers,
            'ijazahSubjects' => $ijazahSubjects,
            'studentIjazahs' => $studentIjazahs,
            'academicYear' => $activeYear,
            'semester' => $targetSemester,
            'kkms' => $kkms,
        ]);
    }
}
