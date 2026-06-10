<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Services\AnalysisPerformanceService;

class AnalysisController extends Controller
{
    public function index(Request $request)
    {
        try {
        // Performance monitoring (development only)
        $startTime = microtime(true);
        if (config('app.debug')) {
            \Illuminate\Support\Facades\DB::enableQueryLog();
        }
        
        // Initialize performance service
        $performanceService = app(AnalysisPerformanceService::class);
        
        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        // --- SEMESTER FILTER ---
        // Allow user to pick which semester to analyze (default: active semester)
        $allSemesters = \App\Models\Semester::orderBy('id')->get();
        $selectedSemesterId = $request->input('semester_id');
        $selectedSemester = $selectedSemesterId
            ? \App\Models\Semester::find($selectedSemesterId)
            : $activeSemester;
        // Fallback to active if not found
        if (!$selectedSemester) $selectedSemester = $activeSemester;

        // Use selectedSemester instead of activeSemester for all calculations
        $activeSemester = $selectedSemester;

        // --- 1. PREPARE WEIGHTS & CONTEXT ---
        // Use cached grade weights for better performance
        $gradeWeights = ($academicYear && $activeSemester)
            ? $performanceService->getCachedGradeWeights($academicYear->id, $activeSemester->name)
            : collect();

        // Store original unfiltered weights for allWeightComponents (before exam type filtering)
        $allGradeWeights = $gradeWeights;

        $weightCategories = $gradeWeights->pluck('name')->unique()->values(); // e.g. ['UH1', 'UTS', 'UAS']

        // Sort weightCategories in specific order: UH1, UTS, UH2, UAS/UKK
        $customOrder = ['UH1', 'UTS', 'UH2', 'UAS/UKK'];
        $weightCategories = $weightCategories->sortBy(function ($item) use ($customOrder) {
            $index = array_search($item, $customOrder);
            return $index === false ? 999 : $index;
        })->values();
        $totalWeightSum = $gradeWeights->sum('weight');

        // Check if we are in Semester 2 (for Safety Target Logic)
        $isSem2 = false;
        $sem1 = null;
        if ($activeSemester && in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $isSem2 = true;
            $sem1 = \App\Models\Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        // --- 2. PREPARE FILTERS ---
        $filterJenjang = $request->input('jenjang_id');
        $filterKelas = $request->input('kelas_id');
        $search = $request->input('search');
        $safetyStatus = $request->input('safety_status'); // 'aman', 'perlu_perhatian', 'tidak_aman'

        $kelasFilterType = $request->input('kelas_filter_type', 'include');
        $includeSem1 = $request->has('include_sem1') ? filter_var($request->input('include_sem1'), FILTER_VALIDATE_BOOLEAN) : true;

        // Exam type filter
        $examFilterType = $request->input('exam_filter_type', 'include'); // 'include' or 'exclude'
        $filterExamTypes = $request->input('exam_types'); // comma-separated e.g. "UH1,UTS"
        $filterExamTypesArray = [];
        if ($filterExamTypes) {
            $filterExamTypesArray = array_filter(explode(',', $filterExamTypes));
        }

        // Apply exam type filter to gradeWeights used in calculations
        if (!empty($filterExamTypesArray)) {
            if ($examFilterType === 'exclude') {
                $gradeWeights = $gradeWeights->filter(fn($w) => !in_array($w->name, $filterExamTypesArray))->values();
            } else {
                $gradeWeights = $gradeWeights->filter(fn($w) => in_array($w->name, $filterExamTypesArray))->values();
            }
            $weightCategories = $gradeWeights->pluck('name')->unique()->values();
            $totalWeightSum = $gradeWeights->sum('weight');
        }

        // Shared Base Query Scope
        $filterScope = function ($q) use ($academicYear, $filterJenjang, $filterKelas, $kelasFilterType, $search) {
            $q->whereHas('classMembers.activeClass', function ($kq) use ($academicYear, $filterJenjang, $filterKelas, $kelasFilterType) {
                if ($academicYear) $kq->where('academic_year_id', $academicYear->id);
                if ($filterKelas) {
                    $kelasArray = is_array($filterKelas) ? $filterKelas : explode(',', $filterKelas);
                    $kelasArray = array_filter($kelasArray);
                    
                    if (!empty($kelasArray)) {
                        if ($kelasFilterType === 'exclude') {
                            $kq->whereNotIn('kelas_id', $kelasArray);
                        } else {
                            $kq->whereIn('kelas_id', $kelasArray);
                        }
                    }
                }
                if ($filterJenjang) {
                    $kq->whereHas('kelas', function ($jq) use ($filterJenjang) {
                        $jq->where('jenjang_id', $filterJenjang);
                    });
                }
            });

            if ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('nisn', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('nomor_induk', 'like', "%{$search}%");
                        });
                });
            }
        };

        // Fetch Sem 1 Weights early if Sem 2 (use cached version)
        $sem1Weights = collect();
        if ($isSem2 && $sem1) {
            $sem1Weights = $performanceService->getCachedGradeWeights($academicYear->id, $sem1->name);
        }

        // --- 3. CALCULATE RANKING & FAILURES ---
        $failuresVariable = [
            '1' => [],
            '2' => [],
            '3' => [],
            '>3' => []
        ];

        // Fetch ALL matching students with comprehensive eager loading to avoid N+1 queries
        $semesterIds = $activeSemester ? [$activeSemester->id] : [];
        if ($isSem2 && $sem1 && $includeSem1) $semesterIds[] = $sem1->id;

        $allRankQuery = \App\Models\Student::query()->where($filterScope)
            ->with([
                'studentGrades' => function ($q) use ($semesterIds) {
                    if (!empty($semesterIds)) $q->whereIn('semester_id', $semesterIds);
                },
                'studentGrades.gradeWeight',
                'studentGrades.activeSubject.mapel',
                'classMembers.activeClass' => function($q) {
                    $q->with([
                        'kelas.jenjang',
                        'kelasParalel',
                        'activeSubjects.mapel'
                    ]);
                },
                'user'
            ]);

        $allFilteredStudents = $allRankQuery->get();

        // KKMs Lookup Cache (use cached version for better performance)
        $kkms = $performanceService->getCachedKKMs($academicYear->id);

        $calculatedStudents = $allFilteredStudents->map(function ($student) use ($gradeWeights, $totalWeightSum, $isSem2, $sem1, $sem1Weights, $activeSemester, $kkms, $includeSem1, &$failuresVariable) {
            $member = $student->classMembers->first();
            if (!$member || !$member->activeClass) return null;

            $activeClass = $member->activeClass;
            $activeSubjects = $activeClass->activeSubjects;
            if (!$activeSubjects || $activeSubjects->count() === 0) return null;

            $grades = $student->studentGrades;
            $failureCount = 0;
            $totalScore = 0;

            // Helper Calc (exact match with ClassGradeRecapController)
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
                $kkm = $kkms[$activeClass->kelas_id][$subject->mapel_id]->kkm_value ?? 70;
                
                $scoreTarget = $calc($gradeWeights, $activeSemester ? $activeSemester->id : 0, $subject->id);
                $finalScore = $scoreTarget;

                if ($isSem2 && $sem1 && $includeSem1) {
                    $scoreSem1 = $calc($sem1Weights, $sem1->id, $subject->id);
                    $finalScore = round(($scoreSem1 + (2 * $scoreTarget)) / 3);
                }

                $totalScore += $finalScore;

                if ($finalScore < $kkm) {
                    $failureCount++;
                }
            }

            // Student Overall Average for Rank
            $averageScore = $activeSubjects->count() > 0 ? $totalScore / $activeSubjects->count() : 0;
            
            $studentData = [
                'student_name' => $student->user->name ?? $student->nisn ?? 'Unknown',
                'class_name' => ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? ''),
                'avg_score' => round($averageScore, 2),
                'id' => $student->id,
                'has_grades' => $grades->count() > 0,
                'failure_count' => $failureCount
            ];

            if ($failureCount > 0) {
                if ($failureCount == 1) $failuresVariable['1'][] = $studentData;
                elseif ($failureCount == 2) $failuresVariable['2'][] = $studentData;
                elseif ($failureCount == 3) $failuresVariable['3'][] = $studentData;
                else $failuresVariable['>3'][] = $studentData;
            }

            return $studentData;
        })->filter()->values();

        $topLimit = $request->input('top_limit', 10);
        $bottomLimit = $request->input('bottom_limit', 20);

        // Sort Top
        $sortedForTop = $calculatedStudents->sortByDesc('avg_score');
        $top10 = ($topLimit === 'all' || $topLimit === 'Semua') ? $sortedForTop->values() : $sortedForTop->take((int)$topLimit)->values();

        // Sort Bottom
        $sortedForBottom = $calculatedStudents->where('has_grades', true)->sortBy('avg_score');
        $bottom20 = ($bottomLimit === 'all' || $bottomLimit === 'Semua') ? $sortedForBottom->values() : $sortedForBottom->take((int)$bottomLimit)->values();

        // --- 4. MAIN PAGINATED DATA ---
        // Optimize eager loading to avoid redundant fetches
        $mainQuery = \App\Models\Student::query()
            ->where($filterScope)
            ->with([
                'user',
                'classMembers.activeClass' => function($q) {
                    $q->with([
                        'activeSubjects.mapel',
                        'kelas.jenjang',
                        'kelasParalel'
                    ]);
                }
            ])
            ->withAvg(['studentGrades' => function ($q) use ($activeSemester) {
                if ($activeSemester) $q->where('semester_id', $activeSemester->id);
            }], 'score');

        $paginatedStudents = $mainQuery->orderBy('user_id')->paginate(25)->withQueryString();

        // --- 5. MISSING INPUTS ---
        $missingGrades = [];
        foreach ($gradeWeights as $weight) {
            $categoryLabel = $weight->name; // e.g. "UH1", "UTS", "UAS"
            $subjectsWithoutGrades = \App\Models\ActiveSubject::with(['mapel', 'activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])
                ->whereDoesntHave('studentGrades', function ($q) use ($weight, $activeSemester) {
                    if ($activeSemester) $q->where('semester_id', $activeSemester->id);
                    $q->where('grade_weight_id', $weight->id);
                })
                ->whereHas('activeClass', function ($q) use ($academicYear, $filterKelas, $kelasFilterType, $filterJenjang) {
                    if ($academicYear) $q->where('academic_year_id', $academicYear->id);
                    if ($filterKelas) {
                        $kelasArray = is_array($filterKelas) ? $filterKelas : explode(',', $filterKelas);
                        $kelasArray = array_filter($kelasArray);
                        
                        if (!empty($kelasArray)) {
                            if ($kelasFilterType === 'exclude') {
                                $q->whereNotIn('kelas_id', $kelasArray);
                            } else {
                                $q->whereIn('kelas_id', $kelasArray);
                            }
                        }
                    }
                    if ($filterJenjang) {
                        $q->whereHas('kelas', function ($kq) use ($filterJenjang) {
                            $kq->where('jenjang_id', $filterJenjang);
                        });
                    }
                })
                ->get();
            
            if ($subjectsWithoutGrades->isNotEmpty()) {
                $missingGrades[$categoryLabel] = $subjectsWithoutGrades;
            }
        }

        // --- 6. CALCULATE SAFETY TARGETS (Only for Paginated Batch) ---
        $studentIds = $paginatedStudents->pluck('id');
        // Optimize eager loading for grades query
        $gradesQuery = \App\Models\StudentGrade::whereIn('student_id', $studentIds)
            ->with(['activeSubject.mapel', 'gradeWeight']);

        if ($activeSemester) {
            if ($isSem2 && $sem1) {
                $gradesQuery->whereIn('semester_id', [$activeSemester->id, $sem1->id]);
            } else {
                $gradesQuery->where('semester_id', $activeSemester->id);
            }
        }

        $allGradesGrouped = $gradesQuery->get()->groupBy('student_id');

        // KKMs Lookup Cache (reuse cached version)
        // $kkms already loaded above with cached version

        // Sem 1 Weights if needed (reuse cached version)
        // $sem1Weights already loaded above with cached version

        $safetyTargets = $paginatedStudents->flatMap(function ($student) use ($allGradesGrouped, $kkms, $gradeWeights, $totalWeightSum, $sem1Weights, $isSem2, $sem1, $activeSemester, $includeSem1) {
            $member = $student->classMembers->first();
            if (!$member || !$member->activeClass) return [];

            $activeClass = $member->activeClass;
            $grades = $allGradesGrouped->get($student->id) ?? collect();

            if (!$activeClass->activeSubjects) return [];

            return $activeClass->activeSubjects->map(function ($subject) use ($student, $grades, $activeClass, $kkms, $gradeWeights, $totalWeightSum, $sem1Weights, $isSem2, $sem1, $activeSemester, $includeSem1) {
                // KKM logic
                $kkm = $kkms[$activeClass->kelas_id][$subject->mapel_id]->kkm_value ?? 70;

                // Sem 1 Score
                $sem1Score = 0;
                $hasSem1Data = false;
                if ($isSem2 && $sem1) {
                    $s1Grades = $grades->where('active_subject_id', $subject->id)->where('semester_id', $sem1->id);
                    if ($s1Grades->count() > 0) {
                        $hasSem1Data = true;
                        $s1Total = 0;
                        $s1WeightSum = $sem1Weights->sum('weight');
                        foreach ($sem1Weights as $w) {
                            $g = $s1Grades->where('grade_weight_id', $w->id)->first();
                            $s1Total += ($g ? $g->score : 0) * $w->weight;
                        }
                        $sem1Score = $s1WeightSum > 0 ? round($s1Total / $s1WeightSum) : 0;
                    }
                }

                // --- Progress Analysis & Rapor Calculation ---
                $currentWeightedSum = 0;
                $componentsData = [];

                foreach ($gradeWeights as $w) {
                    $g = $grades->where('active_subject_id', $subject->id)->where('semester_id', $activeSemester->id)->where('grade_weight_id', $w->id)->first();
                    $val = null;

                    if ($g) {
                        $val = $g->score;
                    }

                    // For report card calculation, missing is 0
                    $scoreForRapor = $val ? $val : 0;
                    $currentWeightedSum += ($scoreForRapor * $w->weight);

                    $componentsData[$w->name] = [
                        'name' => $w->name,
                        'weight' => $w->weight,
                        'value' => $val,
                        'is_predicted' => false,
                        'id' => $w->id
                    ];
                }

                // Calculate Sem 2 Score
                $sem2Score = 0;
                if ($totalWeightSum > 0) {
                    $sem2Score = $currentWeightedSum / $totalWeightSum;
                }

                // --- D. Calculate Final Rapor ---
                $finalRapor = $sem2Score;
                if ($isSem2 && $hasSem1Data && $includeSem1) {
                    $finalRapor = ($sem1Score + (2 * $sem2Score)) / 3;
                }

                // --- E. Status Check ---
                $hasRedMark = false;
                // Check Sem 1 red mark
                if ($isSem2 && $hasSem1Data && $includeSem1 && $sem1Score < $kkm) {
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
                    $status = 'Tidak Aman'; // Rapor is failing
                } elseif ($hasRedMark || $sem2Score < $kkm) {
                    $status = 'Perlu Perhatian';
                }

                // Calculate Target Rapor Sem 2
                $targetRaporSem2 = $kkm;
                if ($isSem2 && $hasSem1Data && $includeSem1) {
                    // Formula: (Sem 1 + 2 * Sem 2) / 3 >= KKM  =>  Sem 2 >= (3 * KKM - Sem 1) / 2
                    $targetRaporSem2 = (3 * $kkm - $sem1Score) / 2;
                }

                return [
                    'student_name' => $student->user->name ?? $student->nisn,
                    'nis' => $student->nisn ?? $student->user->nomor_induk ?? '-',
                    'jenjang_name' => $activeClass->kelas->jenjang->name ?? '-',
                    'class_name' => ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? ''),
                    'subject_name' => $subject->mapel->name,
                    'kkm' => $kkm,
                    'sem1_score' => $isSem2 ? ($hasSem1Data ? $sem1Score : '-') : null,
                    'target_rapor_sem2' => $isSem2 ? max(0, $targetRaporSem2) : null,
                    'target_sem2_final' => $isSem2 ? round($finalRapor, 1) : $kkm,
                    'components' => $componentsData,
                    'status' => $status,
                ];
            });
        })->values();

        // Filter by Safety Status
        if ($safetyStatus) {
            $safetyTargets = $safetyTargets->filter(function ($row) use ($safetyStatus) {
                if ($safetyStatus === 'aman') return $row['status'] === 'Aman';
                if ($safetyStatus === 'perlu_perhatian') return $row['status'] === 'Perlu Perhatian';
                if ($safetyStatus === 'tidak_aman') return $row['status'] === 'Tidak Aman';
                return true;
            })->values();
        }

        // --- 7. STUDENT GRADES LIST ---

        // Derived from Paginated Batch for Table
        $studentGradesList = $paginatedStudents->flatMap(function ($student) use ($kkms, $allGradesGrouped, $gradeWeights) {
            $member = $student->classMembers->first();
            if (!$member || !$member->activeClass) return [];

            $activeClass = $member->activeClass;
            $studentGrades = $allGradesGrouped->get($student->id) ?? collect();
            $gradesBySubject = $studentGrades->groupBy('active_subject_id');

            return $gradesBySubject->map(function ($grades, $subjectId) use ($student, $activeClass, $kkms, $gradeWeights) {
                $subject = $grades->first()->activeSubject;
                $kkm = $kkms[$activeClass->kelas_id][$subject->mapel_id]->kkm_value ?? 70;
                $scores = [];
                
                // Only include scores for filtered grade weights
                foreach ($gradeWeights as $weight) {
                    $grade = $grades->where('grade_weight_id', $weight->id)->first();
                    $scores[$weight->name] = $grade ? $grade->score : null;
                }
                
                return [
                    'student_name' => $student->user->name ?? $student->nisn,
                    'nis' => $student->nisn ?? $student->user->nomor_induk ?? '-',
                    'class_name' => ($activeClass->kelas->name ?? '-') . ' ' . ($activeClass->kelasParalel->name ?? '-'),
                    'jenjang_name' => $activeClass->kelas->jenjang->name ?? '-',
                    'subject_name' => $subject->mapel->name,
                    'kkm' => $kkm,
                    'scores' => $scores,
                ];
            });
        })->values();

        // --- 8. RETURN ---
        $allJenjangs = \App\Models\Jenjang::all();
        $allKelas = \App\Models\Kelas::all();

        // Performance monitoring - log metrics (development only)
        if (config('app.debug')) {
            $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            $queryCount = count(\Illuminate\Support\Facades\DB::getQueryLog());
            $memoryUsage = memory_get_peak_usage(true) / 1024 / 1024; // Convert to MB
            
            \Illuminate\Support\Facades\Log::info('AnalysisController Performance Metrics', [
                'execution_time_ms' => round($executionTime, 2),
                'query_count' => $queryCount,
                'memory_usage_mb' => round($memoryUsage, 2),
                'student_count' => $paginatedStudents->total(),
            ]);
        }

        return Inertia::render('Academic/Analysis/Index', [
            'top10' => $top10,
            'bottom20' => $bottom20,
            'failures' => $failuresVariable,
            'missingGrades' => $missingGrades,
            'studentGradesList' => $studentGradesList,
            'safetyTargets' => $safetyTargets,
            'weightComponents' => $weightCategories,
            'isSem2' => $isSem2,
            'paginatedStudents' => $paginatedStudents,
            'allWeightComponents' => $allGradeWeights
                ->pluck('name')->unique()
                ->sortBy(function ($item) use ($customOrder) {
                    $index = array_search($item, $customOrder);
                    return $index === false ? 999 : $index;
                })->values(),
            'filters' => array_merge($request->only(['jenjang_id', 'kelas_id', 'kelas_filter_type', 'search', 'safety_status', 'top_limit', 'bottom_limit', 'exam_types', 'exam_filter_type']), ['include_sem1' => $includeSem1, 'semester_id' => $activeSemester?->id]),
            'jenjangs' => $allJenjangs,
            'kelases' => $allKelas,
            'allSemesters' => $allSemesters,
            'selectedSemesterId' => $activeSemester?->id,
            'activeSemesterName' => $activeSemester?->name,
        ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AnalysisController error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return back()->with('error', 'Terjadi kesalahan saat memuat halaman analisis: ' . $e->getMessage());
        }
    }
}
