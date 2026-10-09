<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class StudentGradeController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Ensure user is a student
        if (!$user->student) {
            // [FIX] Allow Admins/Teachers to see the page but with an info message instead of 403
            return Inertia::render('Student/Grades/Index', [
                'error' => 'Anda sedang melihat halaman ini sebagai Administrator/Guru. Halaman ini sejatinya adalah tampilan khusus Siswa. Untuk melihat nilai siswa tertentu, gunakan menu Rekap Per Santri.',
                'safetyTargets' => [],
                'studentGrades' => [],
                'student' => null, // Frontend should handle null student
            ]);
        }

        $student = $user->student;

        // Fetch all Academic Years and Semesters for dropdowns
        $academicYears = \App\Models\AcademicYear::orderBy('name', 'desc')->get();
        $semesters = \App\Models\Semester::all();

        // Default to active year/semester if no filter provided
        $activeAcademicYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemesterDefault = \App\Services\AcademicStateService::currentSemester();

        $academicYearId = $request->input('academic_year_id', $activeAcademicYear->id ?? null);
        $semesterId = $request->input('semester_id', $activeSemesterDefault->id ?? null);

        $academicYear = \App\Models\AcademicYear::find($academicYearId);
        $activeSemester = \App\Models\Semester::find($semesterId);

        // Load Active Class & Members based on selected academic year
        $member = \App\Models\ClassMember::where('student_id', $student->id)
            ->whereHas('activeClass', function ($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })
            ->with(['activeClass.kelas.jenjang', 'activeClass.kelasParalel'])
            ->latest()
            ->first();

        if (!$member || !$member->activeClass) {
            return Inertia::render('Student/Grades/Index', [
                'error' => 'Anda belum terdaftar di kelas untuk tahun pelajaran yang dipilih.',
                'safetyTargets' => [],
                'studentGrades' => [],
                'student' => $student,
                'academicYears' => $academicYears,
                'semesters' => $semesters,
                'filters' => [
                    'academic_year_id' => $academicYearId,
                    'semester_id' => $semesterId,
                ],
                'gradeConfig' => \App\Models\SchoolInfo::first()?->grade_config ?? [],
            ]);
        }

        $activeClass = $member->activeClass;
        $activeClass->load(['activeSubjects.mapel']); // Load subjects

        // --- CALCULATION LOGIC (Adapted from AnalysisController) ---

        // 1. Determine Sem 2 Context
        $isSem2 = false;
        $sem1 = null;
        if ($activeSemester && in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $isSem2 = true;
            $sem1 = \App\Models\Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        // 2. Fetch Weights
        $knowledgeWeights = \App\Models\GradeWeight::where('academic_year_id', $academicYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['All', 'all', 'Semua', 'semua', $activeSemester->name])
            ->get();

        // 1. Filter out "Validasi" (case-insensitive)
        $knowledgeWeights = $knowledgeWeights->filter(function ($w) {
            return strtolower($w->name) !== 'validasi';
        });

        // 2. Custom Order: UH1, UTS, UH2, UKK/UAS
        $knowledgeWeights = \App\Helpers\GradeHelper::sortGradeWeights($knowledgeWeights);

        $knowledgeWeightSum = $knowledgeWeights->sum('weight');
        $weightComponents = $knowledgeWeights->map(fn($w) => $w->name)->values()->all();

        // Sem 1 Weights (If needed)
        $knowledgeWeightsSem1 = collect();
        if ($isSem2 && $sem1) {
            $knowledgeWeightsSem1 = \App\Models\GradeWeight::where('academic_year_id', $academicYear->id)
                ->where('category', 'pengetahuan')
                ->whereIn('semester', ['All', 'all', 'Semua', 'semua', $sem1->name])
                ->get();
        }

        // 3. Fetch Student Grades (All relevant semesters)
        $gradeQuery = \App\Models\StudentGrade::where('student_id', $student->id)
            ->with(['activeSubject', 'gradeWeight']);

        if ($isSem2 && $sem1) {
            $gradeQuery->whereIn('semester_id', [$activeSemester->id, $sem1->id]);
        } else {
            $gradeQuery->where('semester_id', $activeSemester->id);
        }

        $allGrades = $gradeQuery->get();

        // 4. KKMs
        $kkms = \App\Models\Kkm::where('kelas_id', $activeClass->kelas_id)->get()->keyBy('mapel_id');

        // 5. Calculate Safety Targets Per Subject
        $safetyTargets = $activeClass->activeSubjects->map(function ($subject) use ($student, $allGrades, $kkms, $knowledgeWeights, $knowledgeWeightSum, $isSem2, $sem1, $knowledgeWeightsSem1, $activeSemester) {
            // Determine KKM
            $kkm = $kkms[$subject->mapel_id]->kkm_value ?? 70;

            // --- A. Calculate Sem 1 Score ---
            $sem1Score = 0;
            $hasSem1Data = false;

            if ($isSem2 && $sem1) {
                $subjGradesSem1 = $allGrades->where('active_subject_id', $subject->id)
                    ->where('semester_id', $sem1->id);

                if ($subjGradesSem1->count() > 0) {
                    $hasSem1Data = true;
                    $s1Total = 0;
                    $s1WeightSum = $knowledgeWeightsSem1->sum('weight');
                    foreach ($knowledgeWeightsSem1 as $w) {
                        $g = $subjGradesSem1->where('grade_weight_id', $w->id)->first();
                        $val = $g ? $g->score : 0;
                        $s1Total += ($val * $w->weight);
                    }
                    $sem1Score = $s1WeightSum > 0 ? round($s1Total / $s1WeightSum) : 0;
                }
            }

            // --- C. Analyze Current Sem 2 Progress & Rapor Calculation ---
            $subjectGradesCurrent = $allGrades->where('active_subject_id', $subject->id)
                ->where('semester_id', $activeSemester->id);

            // First pass: Calculate sum of existing weights and sum of missing weights
            $currentWeightedSum = 0;
            $missingWeightSum = 0;

            foreach ($knowledgeWeights as $w) {
                $grade = $subjectGradesCurrent->where('grade_weight_id', $w->id)->first();
                if ($grade) {
                    $currentWeightedSum += ($grade->score * $w->weight);
                } else {
                    $missingWeightSum += $w->weight;
                }
            }

            // Calculate Target Sem 2 Score required to pass KKM
            $targetSem2Score = $kkm;
            if ($isSem2 && $hasSem1Data) {
                // finalRapor = (sem1 + 2 * sem2) / 3 >= KKM
                $targetSem2Score = (3 * $kkm - $sem1Score) / 2;
            }

            // Calculate Required Score for Missing Components
            $predictedScore = 0;
            if ($missingWeightSum > 0) {
                $neededTotal = ($targetSem2Score * $knowledgeWeightSum) - $currentWeightedSum;
                $predictedScore = $neededTotal / $missingWeightSum;
                if ($predictedScore < 0) $predictedScore = 0;
            }

            // Second pass: Build components array & actual Sem 2 Score
            $componentsData = [];
            foreach ($knowledgeWeights as $w) {
                $grade = $subjectGradesCurrent->where('grade_weight_id', $w->id)->first();
                $val = null;
                $isPredicted = false;

                if ($grade) {
                    $val = $grade->score;
                } else {
                    if ($missingWeightSum > 0) {
                        $val = round($predictedScore, 1);
                        $isPredicted = true;
                    }
                }

                $componentsData[$w->name] = [
                    'weight' => $w->weight,
                    'value' => $val,
                    'is_predicted' => $isPredicted,
                ];
            }

            // Calculate Sem 2 Score (Actual, treating missing as 0)
            $sem2Score = 0;
            if ($knowledgeWeightSum > 0) {
                $sem2Score = $currentWeightedSum / $knowledgeWeightSum;
            }

            // --- D. Calculate Final Rapor ---
            $finalRapor = $sem2Score;
            if ($isSem2 && $hasSem1Data) {
                $finalRapor = ($sem1Score + (2 * $sem2Score)) / 3;
            }

            // --- E. Status Check ---
            $hasRedMark = false;
            // Check Sem 1 red mark
            if ($isSem2 && $hasSem1Data && $sem1Score < $kkm) {
                $hasRedMark = true;
            }
            // Check current actual grades red mark
            foreach ($componentsData as $data) {
                if ($data['value'] !== null && $data['value'] < $kkm) {
                    $hasRedMark = true;
                    break;
                }
            }

            $status = 'Aman';
            if ($finalRapor < $kkm && $isSem2) {
                $status = 'Belum Aman'; // Rapor is failing
            } elseif ($hasRedMark || $sem2Score < $kkm) {
                $status = 'Perlu Perhatian';
            }

            return [
                'subject_name' => $subject->mapel->name,
                'kkm' => $kkm,
                'sem1_score' => $isSem2 ? ($hasSem1Data ? $sem1Score : '-') : null,
                'target_sem2_final' => $isSem2 ? round($finalRapor, 1) : $kkm, // 'SEM 2' column uses Final Rapor Score ((Sem1 + 2*Sem2)/3)
                'components' => $componentsData,
                'status' => $status,
                'target_remaining' => round($predictedScore, 1) // Store this for info or just display target directly
            ];
        })->values();

        $tahfidzGrades = \App\Models\StudentGrade::where('student_id', $student->id)
            ->whereHas('activeSubject', function ($q) use ($academicYear) {
                $q->whereHas('activeClass', function ($qClass) use ($academicYear) {
                    $qClass->where('academic_year_id', $academicYear->id);
                })->whereHas('mapel', function ($qMapel) {
                    $qMapel->where('name', 'like', '%Tahfidz%')
                           ->orWhere('name', 'like', '%Tahfizh%');
                });
            })
            ->with(['activeSubject.mapel', 'gradeWeight', 'tahfidzDetails'])
            ->where('semester_id', $activeSemester->id)
            ->get();

        // 7. Memorization Count
        $memorizationCount = \App\Models\TahfidzMemorization::where('student_id', $student->id)
            ->where('is_completed', true)
            ->pluck('juz')
            ->filter(fn ($juz) => filled($juz))
            ->unique()
            ->count();

        $gradeConfig = \App\Models\SchoolInfo::first()?->grade_config ?? [];

        return Inertia::render('Student/Grades/Index', [
            'safetyTargets' => $safetyTargets,
            'studentGrades' => $allGrades,
            'student' => $student,
            'className' => ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? ''),
            'semesterName' => $activeSemester->name,
            'weightComponents' => $weightComponents,
            'isSem2' => $isSem2,
            'error' => null,
            'tahfidzGrades' => $tahfidzGrades,
            'memorizationCount' => $memorizationCount,
            'academicYears' => $academicYears,
            'semesters' => $semesters,
            'filters' => [
                'academic_year_id' => $academicYearId,
                'semester_id' => $semesterId,
            ],
            'gradeConfig' => $gradeConfig,
        ]);
    }
}

