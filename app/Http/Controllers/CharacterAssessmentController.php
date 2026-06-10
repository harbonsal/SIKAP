<?php

namespace App\Http\Controllers;

use App\Exports\ArrayExport;
use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\CharacterAssessment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class CharacterAssessmentController extends Controller
{
    // private $categories = [
    //     'Ibadah',
    //     'Patuh',
    //     'Disiplin',
    //     'Bersih',
    //     'Sopan',
    //     'Rajin'
    // ];

    public function index(Request $request)
    {
        $academicYear = AcademicYear::where('is_active', true)->first();

        $user = auth()->user()->load('userLevel');
        $canViewAll = $user->hasPermission('view_all_character_assessments');

        // Fetch Kamar Aktif instead of Classes for the dropdown
        $itemQuery = \App\Models\ActiveKamar::where('academic_year_id', $academicYear->id)
            ->with(['kamar', 'musrif']);

        // If not having view all permission, filter by Musrif ID
        if (!$canViewAll) {
            $itemQuery->where('musrif_id', $user->id);
        }

        $activeKamars = $itemQuery->get()
            ->map(function ($ak) {
                return [
                    'id' => $ak->id,
                    'name' => $ak->kamar->name, // Or a combined name if needed
                    'musrif' => $ak->musrif ? $ak->musrif->name : '-',
                ];
            });

        $selectedKamarId = $request->input('active_kamar_id');
        $selectedMonth = $request->input('month');
        $selectedYear = $request->input('year', date('Y')); // Default to current year if not specified

        $students = [];
        $assessments = [];
        $reports = [];

        if ($selectedKamarId && $selectedMonth) {
            $activeKamar = \App\Models\ActiveKamar::with([
                'members.student.user',
                'members.student.classMembers' => function ($q) use ($academicYear) {
                    $q->whereHas('activeClass', function ($sq) use ($academicYear) {
                        $sq->where('academic_year_id', $academicYear->id);
                    })->with('activeClass.kelas', 'activeClass.kelasParalel');
                }
            ])->find($selectedKamarId);

            if ($activeKamar) {
                $students = $activeKamar->members->map(function ($member) {
                    $student = $member->student;

                    // Find active class info for display
                    $activeClassMember = $student->classMembers->first();
                    $className = '-';
                    $activeClassId = null;

                    if ($activeClassMember && $activeClassMember->activeClass) {
                        $ac = $activeClassMember->activeClass;
                        $className = ($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? '');
                        $activeClassId = $ac->id;
                    }

                    return [
                        'id' => $student->id, // Student ID (not User ID directly, but relations map correctly)
                        'user_id' => $student->user_id,
                        'name' => $student->name, // Accessor from Student model
                        'nis' => $student->nomor_induk,
                        'class_name' => $className,
                        'active_class_id' => $activeClassId, // Needed for storing
                    ];
                })->sortBy('name')->values();

                // Load existing assessments for these students
                // We need to fetch assessments where student_id is in our list
                // AND active_class_id matches their current class (to ensure we pull correct year data)
                $studentIds = $students->pluck('id')->toArray();
                $userIds = $students->pluck('user_id')->filter()->unique()->values()->toArray();

                $assessmentByUserId = CharacterAssessment::whereIn('student_id', $userIds)
                    ->where('month', $selectedMonth)
                    ->where('year', $selectedYear)
                    ->get()
                    ->groupBy('student_id')
                    ->map(function ($items) {
                        return $items->pluck('score', 'category');
                    });

                // Backward compatibility:
                // Some legacy rows were stored using students.id in character_assessments.student_id.
                $assessmentByLegacyStudentId = CharacterAssessment::whereIn('student_id', $studentIds)
                    ->where('month', $selectedMonth)
                    ->where('year', $selectedYear)
                    ->get()
                    ->groupBy('student_id')
                    ->map(function ($items) {
                        return $items->pluck('score', 'category');
                    });

                $assessments = $students->mapWithKeys(function ($student) use ($assessmentByUserId, $assessmentByLegacyStudentId) {
                    $scores = $assessmentByUserId->get($student['user_id']);
                    if (!$scores || $scores->isEmpty()) {
                        $scores = $assessmentByLegacyStudentId->get($student['id'], collect());
                    }
                    return [$student['id'] => $scores];
                });

                // Fetch existing reports (notes)
                $reports = \App\Models\CharacterReport::whereIn('student_id', $studentIds)
                    ->where('month', $selectedMonth)
                    ->where('year', $selectedYear)
                    ->get()
                    ->pluck('notes', 'student_id');
            }
        }

        return Inertia::render('Care/Assessment/Index', [
            'kamars' => $activeKamars,
            'categories' => \App\Models\CharacterCategory::where('type', 'dimension')->where('is_active', true)->pluck('name'),
            'rubrics' => \App\Models\CharacterCategory::where('type', 'rubric')->where('is_active', true)->get(),
            'students' => $students,
            'existingAssessments' => $assessments,
            'existingReports' => $reports ?? [],
            'filters' => [
                'active_kamar_id' => $selectedKamarId,
                'month' => $selectedMonth,
                'year' => $selectedYear
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'assessments' => 'present|array', // [student_id => [category => score]]
            'comments' => 'nullable|array', // [student_id => comment_string]
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        $month = $request->month;
        $year = $request->year;

        $data = $request->assessments;
        $comments = $request->comments ?? [];
        // Expected structure from frontend:
        // assessments: {
        //   studentId1: { scores: { Ibadah: 90, ... }, active_class_id: 123 },
        //   studentId2: { ... }
        // }
        // OR better: we re-resolve active_class_id here for security/integrity? 
        // Let's resolve here to be safe and simple input.

        DB::beginTransaction();
        try {
            $academicYear = AcademicYear::where('is_active', true)->first();
            if (!$academicYear) {
                DB::rollBack();
                return back()->withErrors(['error' => 'Tahun ajaran aktif tidak ditemukan.']);
            }

            $validStudentIds = collect(array_keys((array) $data))
                ->filter(fn($id) => is_numeric($id))
                ->map(fn($id) => (int) $id)
                ->values();

            $students = \App\Models\Student::with(['classMembers' => function ($q) use ($academicYear) {
                $q->whereHas('activeClass', function ($sq) use ($academicYear) {
                    $sq->where('academic_year_id', $academicYear->id);
                });
            }])->whereIn('id', $validStudentIds)->get()->keyBy('id');

            $validCategories = \App\Models\CharacterCategory::where('type', 'dimension')
                ->where('is_active', true)
                ->pluck('name')
                ->all();

            $savedCount = 0;
            $skippedCount = 0;

            foreach ($data as $studentId => $scores) {
                if (!is_numeric($studentId) || !is_array($scores)) {
                    $skippedCount++;
                    continue;
                }

                $student = $students->get((int) $studentId);
                if (!$student) {
                    $skippedCount++;
                    continue;
                }

                $activeClassId = $student->classMembers->first()?->active_class_id;
                if (!$activeClassId) {
                    $skippedCount++;
                    continue; // Skip if student has no class (cannot store report data)
                }

                foreach ($scores as $category => $score) {
                    // Check if category is valid
                    // Optimization: Fetch valid categories once outside loop if performance concern
                    // For now, loose check or trust input + DB constraint? DB has no constraint on string name.
                    // Let's trust input but maybe do a quick check against cache if needed.
                    // if (!in_array($category, $this->categories)) continue;
                    if (!in_array($category, $validCategories, true)) {
                        continue;
                    }

                    if ($score !== null && $score !== '') {
                        if (!is_numeric($score)) {
                            continue;
                        }

                        $normalizedScore = (int) round((float) $score);
                        $normalizedScore = max(10, min(100, $normalizedScore));

                        if (!$student->user_id) {
                            continue;
                        }

                        CharacterAssessment::updateOrCreate(
                            [
                                'student_id' => $student->user_id,
                                'active_class_id' => $activeClassId,
                                'category' => $category,
                                'month' => $month,
                                'year' => $year,
                            ],
                            ['score' => $normalizedScore]
                        );
                        $savedCount++;
                    }
                }

                // Save Comment/Report
                if (isset($comments[$studentId])) {
                    \App\Models\CharacterReport::updateOrCreate(
                        [
                            'student_id' => $studentId,
                            'active_class_id' => $activeClassId,
                            'month' => $month,
                            'year' => $year,
                        ],
                        ['notes' => $comments[$studentId]]
                    );
                }
            }
            DB::commit();

            $message = 'Penilaian akhlak berhasil disimpan.';
            if ($skippedCount > 0) {
                $message .= " ($skippedCount data dilewati karena tidak valid/tidak punya kelas aktif.)";
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
    }
    public function import()
    {
        abort(404);
    }

    public function exportExcel(Request $request)
    {
        $selectedKamarId = $request->input('active_kamar_id');
        $selectedMonth = $request->input('month');
        $selectedYear = $request->input('year', date('Y'));

        $categories = \App\Models\CharacterCategory::where('type', 'dimension')
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        $rows = [];

        if ($selectedKamarId && $selectedMonth) {
            $academicYear = AcademicYear::where('is_active', true)->first();

            $activeKamar = \App\Models\ActiveKamar::with([
                'members.student.user',
                'members.student.classMembers' => function ($q) use ($academicYear) {
                    $q->whereHas('activeClass', function ($sq) use ($academicYear) {
                        $sq->where('academic_year_id', $academicYear->id);
                    })->with('activeClass.kelas', 'activeClass.kelasParalel');
                }
            ])->find($selectedKamarId);

            if ($activeKamar) {
                $students = $activeKamar->members->map(function ($member) {
                    $student = $member->student;
                    $activeClassMember = $student->classMembers->first();
                    $className = '-';

                    if ($activeClassMember && $activeClassMember->activeClass) {
                        $ac = $activeClassMember->activeClass;
                        $className = ($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? '');
                        $className = trim($className) ?: '-';
                    }

                    return [
                        'id' => $student->id,
                        'user_id' => $student->user_id,
                        'nis' => $student->nomor_induk,
                        'name' => $student->name,
                        'class_name' => $className,
                    ];
                })->sortBy('name')->values();

                $userIds = $students->pluck('user_id')->filter()->unique()->values()->toArray();
                $assessmentMapByUser = CharacterAssessment::whereIn('student_id', $userIds)
                    ->where('month', $selectedMonth)
                    ->where('year', $selectedYear)
                    ->get()
                    ->groupBy('student_id')
                    ->map(function ($items) {
                        return $items->pluck('score', 'category');
                    });

                $legacyStudentIds = $students->pluck('id')->toArray();
                $assessmentMapLegacy = CharacterAssessment::whereIn('student_id', $legacyStudentIds)
                    ->where('month', $selectedMonth)
                    ->where('year', $selectedYear)
                    ->get()
                    ->groupBy('student_id')
                    ->map(function ($items) {
                        return $items->pluck('score', 'category');
                    });

                foreach ($students as $index => $student) {
                    $row = [
                        $index + 1,
                        $student['nis'],
                        $student['name'],
                        $student['class_name'],
                    ];

                    foreach ($categories as $category) {
                        $score = $assessmentMapByUser[$student['user_id']][$category] ?? ($assessmentMapLegacy[$student['id']][$category] ?? '');
                        $row[] = ($score === '' || $score === null) ? '' : (int) round((float) $score);
                    }

                    $rows[] = $row;
                }
            }
        }

        $columns = array_merge(['No', 'NIS', 'Nama Santri', 'Kelas'], $categories);
        $fileName = 'export_nilai_karakter_' . $selectedYear . '_' . str_pad((string) $selectedMonth, 2, '0', STR_PAD_LEFT) . '_' . date('Ymd_His') . '.xlsx';

        return Excel::download(new ArrayExport($rows, $columns), $fileName);
    }

    public function processImport(Request $request)
    {
        abort(404);
    }
}
