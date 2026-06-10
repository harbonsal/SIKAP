<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\CharacterAssessment;
use App\Models\CharacterCategory;
use App\Models\ActiveKamar;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CharacterAnalysisController extends Controller
{
    public function index(Request $request)
    {
        $academicYear = AcademicYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();

        // Allow user to pick which semester to analyze
        $allSemesters = Semester::orderBy('id')->get();
        $selectedSemesterId = $request->input('semester_id');
        $selectedSemester = $selectedSemesterId
            ? Semester::find($selectedSemesterId)
            : $activeSemester;
        
        if (!$selectedSemester) $selectedSemester = $activeSemester;
        $activeSemester = $selectedSemester;

        // Determine active months based on semester
        $allMonths = [
            ['value' => 1, 'label' => 'Januari'],
            ['value' => 2, 'label' => 'Februari'],
            ['value' => 3, 'label' => 'Maret'],
            ['value' => 4, 'label' => 'April'],
            ['value' => 5, 'label' => 'Mei'],
            ['value' => 6, 'label' => 'Juni'],
            ['value' => 7, 'label' => 'Juli'],
            ['value' => 8, 'label' => 'Agustus'],
            ['value' => 9, 'label' => 'September'],
            ['value' => 10, 'label' => 'Oktober'],
            ['value' => 11, 'label' => 'November'],
            ['value' => 12, 'label' => 'Desember'],
        ];

        $targetMonthValues = [];
        $semesterName = $activeSemester ? strtolower($activeSemester->name) : '';
        
        $activeMonthsRaw = \App\Models\Setting::where('key', 'character_active_months')->value('value');
        $activeMonthsConfig = [];
        if ($activeMonthsRaw) {
            $activeMonthsConfig = json_decode($activeMonthsRaw, true);
        }

        if (is_array($activeMonthsConfig) && count($activeMonthsConfig) > 0) {
            $targetMonths = array_filter($allMonths, fn($m) => in_array($m['value'], $activeMonthsConfig));
        } else {
            if (str_contains($semesterName, 'ganjil') || str_contains($semesterName, '1')) {
                $targetMonths = array_filter($allMonths, fn($m) => $m['value'] >= 7);
            } else {
                $targetMonths = array_filter($allMonths, fn($m) => $m['value'] <= 6);
            }
        }
        $targetMonthValues = array_column($targetMonths, 'value');
        $targetMonths = array_values($targetMonths);

        // Filters
        $filterJenjang = $request->input('jenjang_id');
        $filterKamar = $request->input('kamar_id');
        $search = $request->input('search');
        $safetyStatus = $request->input('safety_status');
        $kkm = 70; // Fixed KKM as requested

        // Fetch Categories
        $categories = CharacterCategory::where('type', 'dimension')
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('name');

        // Filter Scope for Students
        $filterScope = function ($q) use ($academicYear, $filterJenjang, $filterKamar, $search) {
            if ($academicYear) {
                $q->whereHas('kamarMembers.activeKamar', function ($kq) use ($academicYear, $filterKamar) {
                    $kq->where('academic_year_id', $academicYear->id);
                    if ($filterKamar) {
                        $kamarArray = is_array($filterKamar) ? $filterKamar : explode(',', $filterKamar);
                        $kamarArray = array_filter($kamarArray);
                        if (!empty($kamarArray)) {
                            $kq->whereIn('kamar_id', $kamarArray);
                        }
                    }
                });

                // Jenjang filter (based on class)
                if ($filterJenjang) {
                    $q->whereHas('classMembers.activeClass.kelas', function ($jq) use ($filterJenjang) {
                        $jq->where('jenjang_id', $filterJenjang);
                    });
                }
            }

            if ($search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('nisn', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('nomor_induk', 'like', "%{$search}%");
                        });
                });
            }
            $q->whereHas('user', function($uq) {
                $uq->where('status', 'Aktif');
            });
        };

        // Base Query
        $mainQuery = Student::query()
            ->where($filterScope)
            ->with([
                'user',
                'kamarMembers.activeKamar.kamar',
                'classMembers.activeClass.kelas.jenjang',
                'classMembers.activeClass.kelasParalel'
            ]);

        $paginatedStudents = $mainQuery->orderBy('user_id')->paginate(25)->withQueryString();

        // Year to check assessments (Assume based on academic year start year for Sem 1, end year for Sem 2)
        // If year string is like "2025/2026"
        $assessmentYear = date('Y');
        if ($academicYear) {
            $years = explode('/', $academicYear->name);
            if (count($years) == 2) {
                if (str_contains($semesterName, 'ganjil') || str_contains($semesterName, '1')) {
                    $assessmentYear = trim($years[0]);
                } else {
                    $assessmentYear = trim($years[1]);
                }
            }
        }
        $selectedYear = $request->input('year', $assessmentYear);

        // Fetch Assessments for all matching students
        $studentIds = $paginatedStudents->pluck('user_id'); // Assessments use user_id as student_id
        $gradesQuery = CharacterAssessment::whereIn('student_id', $studentIds)
            ->where('year', $selectedYear)
            ->whereIn('month', $targetMonthValues)
            ->get()
            ->groupBy('student_id');

        // Compile Student Data
        $studentGradesList = $paginatedStudents->map(function ($student) use ($gradesQuery, $categories, $targetMonths, $kkm) {
            $assessments = $gradesQuery->get($student->user_id) ?? collect();
            
            $monthlyScores = [];
            $categoryScores = [];
            $totalAll = 0;
            $countAll = 0;
            $hasRedMark = false;

            // Calculate monthly average
            foreach ($targetMonths as $m) {
                $monthAssessments = $assessments->where('month', $m['value']);
                if ($monthAssessments->isNotEmpty()) {
                    $avg = round($monthAssessments->avg('score'), 1);
                    $monthlyScores[$m['label']] = $avg;
                    if ($avg < $kkm) $hasRedMark = true;
                } else {
                    $monthlyScores[$m['label']] = null;
                }
            }

            // Calculate category average over all active months
            foreach ($categories as $cat) {
                $catAssessments = $assessments->where('category', $cat);
                if ($catAssessments->isNotEmpty()) {
                    $avg = round($catAssessments->avg('score'), 1);
                    $categoryScores[$cat] = $avg;
                    $totalAll += $avg;
                    $countAll++;
                    if ($avg < $kkm) $hasRedMark = true;
                } else {
                    $categoryScores[$cat] = null;
                }
            }

            $finalScore = $countAll > 0 ? round($totalAll / $countAll, 1) : 0;
            
            $status = 'Aman';
            if ($finalScore > 0 && $finalScore < $kkm) {
                $status = 'Tidak Aman';
            } elseif ($hasRedMark || $finalScore == 0) {
                $status = 'Perlu Perhatian';
            }

            $kamarMember = $student->kamarMembers->first();
            $classMember = $student->classMembers->first();

            return [
                'id' => $student->id,
                'student_name' => $student->user->name ?? $student->nisn,
                'nis' => $student->user->nomor_induk ?? '-',
                'kamar_name' => $kamarMember?->activeKamar?->kamar?->name ?? '-',
                'jenjang_name' => $classMember?->activeClass?->kelas?->jenjang?->name ?? '-',
                'class_name' => ($classMember?->activeClass?->kelas?->name ?? '') . ' ' . ($classMember?->activeClass?->kelasParalel?->name ?? ''),
                'monthly_scores' => $monthlyScores,
                'category_scores' => $categoryScores,
                'final_score' => $finalScore,
                'status' => $status,
                'kkm' => $kkm,
                'has_grades' => $assessments->count() > 0
            ];
        })->values();

        // Calculate missing inputs (Pantauan Belum Input)
        // Which active kamars have NO assessments for a specific month?
        $missingInputs = [];
        if ($academicYear) {
            $allActiveKamars = ActiveKamar::with(['kamar', 'musrif'])
                ->where('academic_year_id', $academicYear->id)
                ->get();
            
            // For each month, check if there are any assessments for students in that kamar
            foreach ($targetMonths as $m) {
                $monthMissing = [];
                foreach ($allActiveKamars as $activeKamar) {
                    $kamarUserIds = $activeKamar->members->map(function($mem) { return $mem->student->user_id; });
                    
                    if ($kamarUserIds->isEmpty()) continue;

                    $hasAssessment = CharacterAssessment::whereIn('student_id', $kamarUserIds)
                        ->where('year', $selectedYear)
                        ->where('month', $m['value'])
                        ->exists();
                    
                    if (!$hasAssessment) {
                        $monthMissing[] = [
                            'kamar_name' => $activeKamar->kamar->name,
                            'musrif_name' => $activeKamar->musrif->name ?? '-',
                        ];
                    }
                }
                if (!empty($monthMissing)) {
                    $missingInputs[$m['label']] = $monthMissing;
                }
            }
        }

        // Top 10 / Bottom 20
        $topLimit = $request->input('top_limit', 10);
        $bottomLimit = $request->input('bottom_limit', 20);

        // Fetch all students for ranking to get accurate top/bottom across all pages
        $allRankQuery = Student::query()->where($filterScope)
            ->with(['user', 'kamarMembers.activeKamar.kamar'])
            ->get();
        
        $allRankStudentIds = $allRankQuery->pluck('user_id');
        $allRankGrades = CharacterAssessment::whereIn('student_id', $allRankStudentIds)
            ->where('year', $selectedYear)
            ->whereIn('month', $targetMonthValues)
            ->get()
            ->groupBy('student_id');
        
        $failuresVariable = [
            '1' => [], '2' => [], '3' => [], '>3' => []
        ];

        $rankedStudents = $allRankQuery->map(function($student) use ($allRankGrades, $kkm) {
            $assessments = $allRankGrades->get($student->user_id) ?? collect();
            if ($assessments->isEmpty()) return null;

            $avg = round($assessments->avg('score'), 1);
            $failureCount = 0;
            // Failure count can be based on categories average across months
            $cats = $assessments->groupBy('category');
            foreach ($cats as $catScores) {
                if ($catScores->avg('score') < $kkm) $failureCount++;
            }

            $kamarMember = $student->kamarMembers->first();

            $data = [
                'id' => $student->id,
                'student_name' => $student->user->name ?? $student->nisn,
                'kamar_name' => $kamarMember?->activeKamar?->kamar?->name ?? '-',
                'avg_score' => $avg,
                'failure_count' => $failureCount
            ];

            return $data;
        })->filter()->values();

        foreach ($rankedStudents as $st) {
            if ($st['failure_count'] > 0) {
                if ($st['failure_count'] == 1) $failuresVariable['1'][] = $st;
                elseif ($st['failure_count'] == 2) $failuresVariable['2'][] = $st;
                elseif ($st['failure_count'] == 3) $failuresVariable['3'][] = $st;
                else $failuresVariable['>3'][] = $st;
            }
        }

        $sortedForTop = $rankedStudents->sortByDesc('avg_score');
        $top10 = ($topLimit === 'all' || $topLimit === 'Semua') ? $sortedForTop->values() : $sortedForTop->take((int)$topLimit)->values();

        $sortedForBottom = $rankedStudents->sortBy('avg_score');
        $bottom20 = ($bottomLimit === 'all' || $bottomLimit === 'Semua') ? $sortedForBottom->values() : $sortedForBottom->take((int)$bottomLimit)->values();

        return Inertia::render('Care/Character/Analysis/Index', [
            'studentGradesList' => $studentGradesList,
            'paginatedStudents' => $paginatedStudents,
            'categories' => $categories,
            'targetMonths' => array_column($targetMonths, 'label'),
            'missingInputs' => $missingInputs,
            'top10' => $top10,
            'bottom20' => $bottom20,
            'failures' => $failuresVariable,
            'allSemesters' => $allSemesters,
            'selectedSemesterId' => $selectedSemester->id,
            'activeSemesterName' => $selectedSemester->name,
            'selectedYear' => (int)$selectedYear,
            'filters' => $request->only(['jenjang_id', 'kamar_id', 'search', 'safety_status', 'top_limit', 'bottom_limit']),
            'jenjangs' => \App\Models\Jenjang::all(),
            'kamars' => \App\Models\Kamar::all(),
        ]);
    }
}
