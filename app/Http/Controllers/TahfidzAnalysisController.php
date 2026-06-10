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

        // 2. Fetch Grade Weights (Exam Types) - use cached version
        $gradeWeights = $performanceService->getCachedGradeWeights($activeYear->id, $activeSemester->name);

        // Filter out "Validasi" and sort columns
        $gradeWeights = $gradeWeights->filter(function($gw) {
            return stripos($gw->name, 'Validasi') === false;
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
            'activeClass.classMembers.student.studentGrades' => function ($q) use ($activeSemester, $tahfidzMapel) {
                $q->where('semester_id', $activeSemester->id)
                    ->whereHas('activeSubject', function ($sq) use ($tahfidzMapel) {
                        $sq->where('mapel_id', $tahfidzMapel->id);
                    })
                    ->with('gradeWeight'); // Add gradeWeight relationship
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

                // Calculate Averages & Status
                $count = 0;
                $examStatus = []; // For Check/X status logic (optional if we switch to scores)
                $scoresMap = []; // To hold actual values

                $totalWeightSum = $gradeWeights->sum('weight');
                $weightedSum = 0;

                foreach ($gradeWeights as $gw) {
                    $gradeRecord = $grades->where('grade_weight_id', $gw->id)->first();
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

                // Average is now calculated like academic score: (Sum of Score * Weight) / Total Weight
                $average = $totalWeightSum > 0 ? round($weightedSum / $totalWeightSum, 2) : 0;

                // Build Row Data
                $row = [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'nis' => $student->nis,
                    'class_name' => ($subject->activeClass->kelas->name ?? '-') . ' ' . ($subject->activeClass->kelasParalel->name ?? ''),
                    'tester_name' => $testerNames,
                    'exam_status' => $examStatus,
                    'scores' => $scoresMap, // [NEW] Actual scores
                    'average' => $average,
                    'filled_count' => $count,
                    'kkm' => $kkm // Added to fix frontend Remedial table
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
}
