<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use App\Services\AnalysisPerformanceService;

class TahfidzAnalysisController extends Controller
{
    public function index(Request $request)
    {
        // Memory limit removed - should not be needed after optimization
        // ini_set('memory_limit', '512M');
        
        // Initialize performance service
        $performanceService = app(AnalysisPerformanceService::class);
        
        $user = Auth::user();
        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager Tahfidz')) {
            // Allow if user has specific permission as fallback
            if (!$user->hasPermission('view_all_assessments')) {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }
        }

        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // 1. Identify Tahfidz Mapel (use caching for better performance)
        $tahfidzMapel = \Illuminate\Support\Facades\Cache::remember('tahfidz_mapel_id', 86400, function () {
            return \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
                ->orWhere('name', 'like', '%Tahfidz%')
                ->orderByRaw("CASE WHEN name LIKE '%Al-Quran%' THEN 0 ELSE 1 END")
                ->first();
        });

        if (!$tahfidzMapel) {
            return Inertia::render('Tahfidz/Analysis/Index', ['error' => 'Mapel Tahfidz belum disetting.']);
        }

        // 2. Fetch Grade Weights (Exam Types) - Fetch all for the year
        $allGradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->get();

        $sem1Weights = $allGradeWeights->filter(function($gw) {
            return in_array(strtolower($gw->semester), ['all', 'semua', 'ganjil']);
        });

        $sem2Weights = $allGradeWeights->filter(function($gw) {
            return in_array(strtolower($gw->semester), ['all', 'semua', 'genap']);
        });

        // Current semester columns for the top table
        $gradeWeights = $allGradeWeights->filter(function($gw) use ($activeSemester) {
            return stripos($gw->name, 'Validasi') === false && in_array(strtolower($gw->semester), ['all', 'semua', strtolower($activeSemester->name)]);
        })->sortBy(function($gw) {
            $name = strtoupper($gw->name);
            if (str_contains($name, 'UH1') || str_contains($name, 'UH 1')) return 1;
            if (str_contains($name, 'UTS') || str_contains($name, 'PTS')) return 2;
            if (str_contains($name, 'UH2') || str_contains($name, 'UH 2')) return 3;
            if (str_contains($name, 'UKK') || str_contains($name, 'PAS') || str_contains($name, 'UAS')) return 4;
            return 99;
        })->values();

        // 3. Fetch All Active Subjects (Classes) for Tahfidz
        // Optimize eager loading - load only required relationships
        $activeSubjects = ActiveSubject::with([
            'activeClass' => function($q) {
                $q->with(['kelas', 'kelasParalel']);
            },
            'activeClass.classMembers.student' => function($q) {
                $q->with('user');
            },
            'tahfidzTesters.user',
            'teacher',
            // Optimize grade loading with specific filters
            'activeClass.classMembers.student.studentGrades' => function ($q) use ($tahfidzMapel) {
                $q->whereHas('activeSubject', function ($sq) use ($tahfidzMapel) {
                        $sq->where('mapel_id', $tahfidzMapel->id);
                    })
                    ->with(['gradeWeight', 'semester']); // Add gradeWeight and semester relationship
            }
        ])
            ->where('mapel_id', $tahfidzMapel->id)
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            })
            ->get();

        // 4. Process Data
        $data = [];
        $topStudents = [];
        $belowKkmStudents = [];
        $kkm = 70; // Default KKM for Tahfidz

        foreach ($activeSubjects as $subject) {
            // Get Testers Name
            $testerNames = $subject->tahfidzTesters->map(fn($t) => $t->user->name)->implode(', ');
            if (empty($testerNames)) $testerNames = $subject->teacher->name ?? '-';

            foreach ($subject->activeClass->classMembers as $member) {
                $student = $member->student;
                $grades = $student->studentGrades; // Collection

                // Calculate Averages & Status for Current Semester
                $count = 0;
                $examStatus = []; // For Check/X status logic
                $scoresMap = []; // To hold actual values

                $totalWeightSum = $gradeWeights->sum('weight');
                $weightedSum = 0;

                foreach ($gradeWeights as $gw) {
                    $gradeRecord = $grades->where('grade_weight_id', $gw->id)->where('semester.name', $activeSemester->name)->first();
                    // Fallback to check without semester relation if not loaded correctly
                    if (!$gradeRecord) {
                        $gradeRecord = $grades->where('grade_weight_id', $gw->id)->first();
                    }

                    $hasGrade = $gradeRecord && $gradeRecord->score > 0;
                    $examStatus[$gw->id] = $hasGrade;

                    // Map Score
                    $scoreVal = $hasGrade ? $gradeRecord->score : 0;
                    $scoresMap[$gw->id] = $scoreVal;

                    if ($hasGrade) {
                        $count++;
                    }
                    // Weighted Calculation
                    $weight = $gw->weight ?? 0;
                    $weightedSum += $scoreVal * $weight;
                }

                // Average current semester
                $average = $totalWeightSum > 0 ? round($weightedSum / $totalWeightSum, 2) : 0;

                // Calculate Sem 1 Average
                $totalWeightSem1 = $sem1Weights->sum('weight');
                $sumSem1 = 0;
                foreach ($sem1Weights as $gw) {
                    $gRec = $grades->where('grade_weight_id', $gw->id)->filter(function($q) {
                        return strtolower($q->semester->name ?? '') === 'ganjil';
                    })->first();
                    // Fallback
                    if (!$gRec) $gRec = $grades->where('grade_weight_id', $gw->id)->first();
                    $sVal = ($gRec && $gRec->score > 0) ? $gRec->score : 0;
                    $sumSem1 += $sVal * ($gw->weight ?? 0);
                }
                $averageSem1 = $totalWeightSem1 > 0 ? round($sumSem1 / $totalWeightSem1, 2) : 0;

                // Calculate Sem 2 Average
                $totalWeightSem2 = $sem2Weights->sum('weight');
                $sumSem2 = 0;
                foreach ($sem2Weights as $gw) {
                    $gRec = $grades->where('grade_weight_id', $gw->id)->filter(function($q) {
                        return strtolower($q->semester->name ?? '') === 'genap';
                    })->first();
                    if (!$gRec) $gRec = $grades->where('grade_weight_id', $gw->id)->first();
                    $sVal = ($gRec && $gRec->score > 0) ? $gRec->score : 0;
                    $sumSem2 += $sVal * ($gw->weight ?? 0);
                }
                $averageSem2 = $totalWeightSem2 > 0 ? round($sumSem2 / $totalWeightSem2, 2) : 0;

                // Build Row Data
                $row = [
                    'active_subject_id' => $subject->id,
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'nis' => $student->nis,
                    'class_name' => ($subject->activeClass->kelas->name ?? '-') . ' ' . ($subject->activeClass->kelasParalel->name ?? ''),
                    'tester_name' => $testerNames,
                    'exam_status' => $examStatus,
                    'scores' => $scoresMap,
                    'average' => $average,
                    'average_sem1' => $averageSem1,
                    'average_sem2' => $averageSem2,
                    'filled_count' => $count,
                    'kkm' => $kkm
                ];

                $data[] = $row;

                // Logic for Top 10 (Only if at least 1 exam is filled)
                if ($count > 0) {
                    $topStudents[] = $row;
                }

                // Logic for Below KKM (Only significant if they have participated)
                // Or maybe strictly average < KKM
                if ($count > 0 && $average < $kkm) {
                    $belowKkmStudents[] = $row;
                }
            }
        }

        // Sort Top 10
        usort($topStudents, fn($a, $b) => $b['average'] <=> $a['average']);
        $topStudents = array_slice($topStudents, 0, 10);

        // Sort Below KKM (Lowest first)
        usort($belowKkmStudents, fn($a, $b) => $a['average'] <=> $b['average']);

        return Inertia::render('Tahfidz/Analysis/Index', [
            'gradeWeights' => $gradeWeights,
            'allData' => $data, // Full list for Tab 1
            'topStudents' => $topStudents, // Tab 2
            'belowKkmStudents' => $belowKkmStudents, // Tab 3
            'kkm' => $kkm
        ]);
    }

    public function targetAnalysisApi(Request $request)
    {
        $period = $request->get('period', 'weekly'); // weekly, monthly, mid_semester, semester, yearly
        $musyrifId = $request->get('musyrif_id', 'all');
        
        $startDate = now();
        $endDate = now();

        switch ($period) {
            case 'weekly':
                $startDate = now()->startOfWeek();
                $endDate = now()->endOfWeek();
                break;
            case 'monthly':
                $startDate = now()->startOfMonth();
                $endDate = now()->endOfMonth();
                break;
            case 'mid_semester':
                // Approximation for mid semester, 3 months from start of semester
                // In a real scenario, this would check academic calendar dates
                $activeSemester = \App\Services\AcademicStateService::currentSemester();
                $startDate = now()->startOfYear(); // Placeholder
                $endDate = now();
                break;
            case 'semester':
                $activeSemester = \App\Services\AcademicStateService::currentSemester();
                $startDate = now()->startOfYear(); // Placeholder
                $endDate = now();
                break;
            case 'yearly':
                $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
                $startDate = now()->startOfYear(); // Placeholder
                $endDate = now();
                break;
        }

        $service = app(\App\Services\TahfidzTargetAnalysisService::class);
        $data = $service->analyzeTargets($startDate, $endDate, $musyrifId);

        return response()->json($data);
    }

    public function mistakesAnalysisApi(Request $request)
    {
        $period = $request->get('period', 'weekly');
        $musyrifId = $request->get('musyrif_id', 'all');
        
        $startDate = now();
        $endDate = now();

        switch ($period) {
            case 'weekly':
                $startDate = now()->startOfWeek();
                $endDate = now()->endOfWeek();
                break;
            case 'monthly':
                $startDate = now()->startOfMonth();
                $endDate = now()->endOfMonth();
                break;
            default:
                $startDate = now()->subMonths(6); // Default 6 months for general
                $endDate = now();
                break;
        }

        $service = app(\App\Services\TahfidzTargetAnalysisService::class);
        $data = $service->getMistakesAnalysis($startDate, $endDate, $musyrifId);

        return response()->json($data);
    }
}
