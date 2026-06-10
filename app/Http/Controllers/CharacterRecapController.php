<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\CharacterAssessment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CharacterRecapController extends Controller
{
    public function index(Request $request)
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        if (!$academicYear) {
            return redirect()->back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        $user = auth()->user()->load('userLevel');
        $isAdmin = $user->hasPermission('view_all_character_assessments') || $user->hasRole('Manager Tahfidz') || $user->hasRole('Administrator');

        // Fetch Kamar Aktif instead of Classes
        $query = \App\Models\ActiveKamar::with(['kamar', 'musrif'])
            ->where('academic_year_id', $academicYear->id)
            ->join('kamars', 'active_kamars.kamar_id', '=', 'kamars.id')
            ->select('active_kamars.*')
            ->orderByRaw('LENGTH(kamars.name), kamars.name');

        if (!$isAdmin) {
            $query->where('musrif_id', $user->id);
        }

        if ($request->search) {
            $query->whereHas('kamar', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        $activeKamars = $query->paginate(100)->withQueryString();

        return Inertia::render('Care/Recap/Index', [
            'activeKamars' => $activeKamars,
            'academicYear' => $academicYear,
            'semester' => $request->integer('semester'),
        ]);
    }

    public function show(Request $request, $id)
    {
        $activeKamar = \App\Models\ActiveKamar::with(['kamar', 'musrif', 'members.student.user'])
            ->findOrFail($id);

        $semester = $request->integer('semester');
        $month = $request->input('month');
        $year = $request->input('year', date('Y'));

        // Define months based on semester
        $allMonths = [
            ['value' => '1', 'label' => 'Januari'],
            ['value' => '2', 'label' => 'Februari'],
            ['value' => '3', 'label' => 'Maret'],
            ['value' => '4', 'label' => 'April'],
            ['value' => '5', 'label' => 'Mei'],
            ['value' => '6', 'label' => 'Juni'],
            ['value' => '7', 'label' => 'Juli'],
            ['value' => '8', 'label' => 'Agustus'],
            ['value' => '9', 'label' => 'September'],
            ['value' => '10', 'label' => 'Oktober'],
            ['value' => '11', 'label' => 'November'],
            ['value' => '12', 'label' => 'Desember'],
        ];

        $availableMonths = $allMonths;
        $targetMonthValues = [];

        if ($semester === 1) { // Ganjil (July - Dec)
            $availableMonths = array_filter($allMonths, fn($m) => intval($m['value']) >= 7);
            $targetMonthValues = array_column($availableMonths, 'value');
            if (!$month) $month = 7; // Default to Start of Sem
        } elseif ($semester === 2) { // Genap (Jan - June)
            $availableMonths = array_filter($allMonths, fn($m) => intval($m['value']) <= 6);
            $targetMonthValues = array_column($availableMonths, 'value');
            if (!$month) $month = 1; // Default to Start of Sem
        } else {
            $targetMonthValues = range(1, 12);
            if (!$month) $month = date('n');
        }

        // Re-index array for nice JSON
        $availableMonths = array_values($availableMonths);

        $isAllMonths = $month === 'all';

        // If year is not set in request (defaulted to 2026), but we are in Sem 1 (which might be 2025),
        // we should probably infer the year from TP if possible? 
        // But for now, user manually changing year is cleaner.
        // However, if Semester is 1 (July-Dec) and current month is Jan 2026, 
        // default year 2026 is wrong for Sem 1. Sem 1 is usually Previous Year.
        // Let's refine default Year logic based on Semester and TP if available?
        // Or just let user switch year. User complaint was about "Blank Data".
        // Let's stick to simple logic for now.

        $students = $activeKamar->members->map(function ($member) {
            return $member->student;
        })->sortBy('user.name')->values();

        // Fetch Assessments (Uses User ID)
        $userIds = $students->pluck('user_id');
        $queryAssessments = CharacterAssessment::whereIn('student_id', $userIds)
            ->where('year', $year);

        if (!$isAllMonths) {
            $queryAssessments->where('month', $month);
        } elseif ($semester) {
            $queryAssessments->whereIn('month', $targetMonthValues);
        }

        $assessments = $queryAssessments->get()->groupBy('student_id');

        // Fetch Reports (Uses Student ID)
        $studentIds = $students->pluck('id');
        $queryReports = \App\Models\CharacterReport::whereIn('student_id', $studentIds)
            ->where('year', $year);

        if (!$isAllMonths) {
            $queryReports->where('month', $month);
        } elseif ($semester) {
            $queryReports->whereIn('month', $targetMonthValues);
        }

        $reports = $queryReports->get()->groupBy('student_id');

        // Compile Recap Data
        $categoryNames = \App\Models\CharacterCategory::where('type', 'dimension')
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('name');

        $recap = $students->map(function ($student) use ($assessments, $reports, $categoryNames, $isAllMonths) {
            // Assessments grouped by User ID (stored as student_id in character_assessments table)
            $studentAssessments = $assessments->get($student->user_id, collect());

            // Reports grouped by Student ID
            $studentReports = $reports->get($student->id, collect());

            $scores = [];
            $total = 0;
            $count = 0;

            foreach ($categoryNames as $cat) {
                // If All Months: calculate Average of this category across all months
                // Assessment 'category' column stores the NAME of the dimension
                if ($isAllMonths) {
                    // Filter assessments for this category
                    $catAssessments = $studentAssessments->where('category', $cat);
                    if ($catAssessments->isNotEmpty()) {
                        $avgScore = $catAssessments->avg('score');
                        $scores[$cat] = round($avgScore, 1); // Round to 1 decimal
                        $total += $avgScore;
                        $count++;
                    } else {
                        $scores[$cat] = null;
                    }
                } else {
                    $assessment = $studentAssessments->where('category', $cat)->first();
                    $scores[$cat] = $assessment ? $assessment->score : null;

                    if ($assessment) {
                        $total += $assessment->score;
                        $count++;
                    }
                }
            }

            $average = $count > 0 ? round($total / $count, 1) : 0;

            // Handle Comment
            $comment = '';
            if ($isAllMonths) {
                // Concatenate or just say "Lihat Detail"
                $comment = $studentReports->count() . ' Catatan Bulanan';
            } else {
                $latestReport = $studentReports->first();
                $comment = $latestReport ? $latestReport->notes : '';
            }

            return [
                'id' => $student->id,
                'name' => $student->user->name,
                'nis' => $student->user->nomor_induk,
                'scores' => $scores,
                'total' => $total,
                'average' => $average,
                'comment' => $comment,
            ];
        });

        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();

        return Inertia::render('Care/Recap/Show', [
            'activeKamar' => $activeKamar,
            'recap' => $recap,
            'categories' => $categoryNames,
            'academicYear' => $academicYear,
            'filters' => [
                'month' => $month, // Pass as is (string 'all' or int)
                'year' => (int)$year,
            ],
            'availableMonths' => $availableMonths,
            'semester' => $semester,
        ]);
    }

    public function studentIndex(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $query = \App\Models\Student::with(['user', 'activeKamar.kamar'])
            ->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            });

        // ONLY show students active in the current academic year's active kamar
        if ($activeYear) {
            $query->whereHas('kamarMembers.activeKamar', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });
        }

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->active_kamar_id) {
            $query->whereHas('kamarMembers', function ($q) use ($request) {
                $q->where('active_kamar_id', $request->active_kamar_id);
            });
        }

        $query->join('users', 'students.user_id', '=', 'users.id')
            ->orderBy('users.name', 'asc')
            ->select('students.*');

        $students = $query->paginate(20)->withQueryString();

        $activeKamars = [];
        if ($activeYear) {
            $kamarQuery = \App\Models\ActiveKamar::with(['kamar'])
                ->where('academic_year_id', $activeYear->id);
            
            $user = Auth::user();
            $isAdmin = $user->hasPermission('view_all_character_assessments') || $user->hasRole('Manager Tahfidz') || $user->hasRole('Administrator');

            if (!$isAdmin) {
                $kamarQuery->where('musrif_id', $user->id);
            }

            $activeKamars = $kamarQuery->join('kamars', 'active_kamars.kamar_id', '=', 'kamars.id')
                ->select('active_kamars.*')
                ->orderByRaw('LENGTH(kamars.name), kamars.name')
                ->get();
        }

        return Inertia::render('Care/Recap/StudentIndex', [
            'students' => $students,
            'activeKamars' => $activeKamars,
            'filters' => $request->only(['search', 'active_kamar_id']),
        ]);
    }

    public function student(Request $request, $id)
    {
        $student = \App\Models\Student::with(['user', 'activeClass.class', 'activeKamar.kamar', 'activeKamar.musrif'])
            ->findOrFail($id);

        $academicYear = AcademicYear::where('is_active', true)->first();
        if (!$academicYear) return redirect()->back();

        $year = $request->input('year', date('Y'));

        $assessments = CharacterAssessment::where('student_id', $student->user_id)
            ->where('year', $year)
            ->get();

        $reports = \App\Models\CharacterReport::where('student_id', $student->id)
            ->where('year', $year)
            ->get()
            ->keyBy('month');

        $categories = \App\Models\CharacterCategory::where('type', 'dimension')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Group by Month
        $monthlyData = [];
        $months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        foreach ($months as $m) {
            $monthScores = [];
            foreach ($categories as $cat) {
                $score = $assessments->where('month', $m)->where('category', $cat->name)->first();
                $monthScores[$cat->name] = $score ? $score->score : null;
            }

            $report = $reports->get($m);

            // Only add if there is data
            if (!empty(array_filter($monthScores)) || $report) {
                $monthlyData[$m] = [
                    'scores' => $monthScores,
                    'comment' => $report ? $report->notes : '',
                ];
            }
        }

        return Inertia::render('Care/Recap/StudentDetail', [
            'student' => $student,
            'monthlyData' => $monthlyData,
            'categories' => $categories->pluck('name'),
            'academicYear' => $academicYear,
            'year' => (int)$year
        ]);
    }
}
