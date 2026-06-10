<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Exports\ArrayExport;
use App\Models\ActiveSubject;
use App\Models\StudentGrade;
use App\Models\GradeWeight;
use App\Models\AcademicYear;
use App\Models\Semester;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum diatur.');
        }

        $query = ActiveSubject::with(['mapel', 'activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])
            ->withMax('studentGrades', 'updated_at')
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });

        // Filter by teacher if not admin/staff (assuming role logic, for now simple check)
        // If user has 'teacher' role or similar. For now, let's assume if user has a 'teacher' relation or check permissions.
        // We'll use the permission system: 'view_all_assessments' vs 'view_own_assessments'
        // Filter by teacher if not admin/staff
        // Filter by user role/permission using the standardized scope
        // Strict Role Check for View All
        $canViewAll = $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);
        if ($canViewAll) {
            // User can view all (Administrator, Manager, etc.)
        } else {
            // Strict filter for Teachers
            $query->where('active_subjects.teacher_id', $user->id);
        }

        // Filter by Active Class (Specific Class + Parallel)
        if ($request->active_class_id) {
            $query->where('active_subjects.active_class_id', $request->active_class_id);
        }

        // Filter by Mapel
        if ($request->mapel_id) {
            $query->where('active_subjects.mapel_id', $request->mapel_id);
        }

        // EXCLUDE Tahfidz from Standard Assessment Input (Handled via Penilaian Tahfidz)
        $query->whereHas('mapel', function ($q) {
            $q->where('name', 'not like', '%Tahfizh%')
                ->where('name', 'not like', '%Tahfidz%');
        });

        // Search
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('mapel', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', '%' . $request->search . '%');
                })->orWhereHas('activeClass.kelas', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }

        // Sorting
        $activeSubjects = $query->join('active_classes', 'active_subjects.active_class_id', '=', 'active_classes.id')
            ->join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->leftJoin('kelas_paralels', 'active_classes.kelas_paralel_id', '=', 'kelas_paralels.id')
            ->select('active_subjects.*') // Select active_subjects columns to avoid ID conflicts
            ->orderBy('student_grades_max_updated_at', 'desc')
            ->orderBy('kelas.name', 'asc')
            ->orderBy('kelas_paralels.name', 'asc')
            ->paginate(10)
            ->withQueryString();

        $activeSubjects->getCollection()->transform(function ($subject) use ($activeYear) {
            $kkm = \App\Models\Kkm::where('mapel_id', $subject->mapel_id)
                ->where('kelas_id', $subject->activeClass->kelas_id)
                ->where('academic_year_id', $activeYear->id)
                ->first();
            $subject->kkm = $kkm ? $kkm->kkm_value : '-';
            return $subject;
        });

        // Get data for filters
        // Fetch ActiveClasses instead of generic Kelas to include parallel info
        $classesQuery = \App\Models\ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeYear->id)
            ->whereHas('activeSubjects'); // Only show classes that have subjects

        $mapelsQuery = \App\Models\Mapel::whereHas('activeSubjects', function ($q) use ($activeYear) {
            $q->whereHas('activeClass', function ($subQ) use ($activeYear) {
                $subQ->where('academic_year_id', $activeYear->id);
            });
        });

        // Initialize teachers list
        $teachers = [];

        if (!$user->hasRole(['Administrator', 'Manager'])) {
            // Teacher sees only their own classes
            $classesQuery->whereHas('activeSubjects', function ($q) use ($user) {
                $q->forUser($user);
            });
            $mapelsQuery->whereHas('activeSubjects', function ($q) use ($user) {
                $q->forUser($user);
            });
        } else {
            // Admin can see all, fetch Teachers list for filter
            // Get users who are teachers (have Active Subjects assigned)
            $teachers = \App\Models\User::whereHas('activeSubjects', function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($subQ) use ($activeYear) {
                    $subQ->where('academic_year_id', $activeYear->id);
                });
            })->orderBy('name')->get(['id', 'name']);

            // Apply Teacher Filter if selected
            if ($request->teacher_id) {
                $query->where('active_subjects.teacher_id', $request->teacher_id);
            }
        }

        // Get unique ActiveClasses
        $classes = $classesQuery->get()->sortBy(function ($activeClass) {
            return $activeClass->kelas->name . ' ' . ($activeClass->kelasParalel->name ?? '');
        })->values();

        $mapels = $mapelsQuery->orderBy('name')->get();

        return Inertia::render('Teacher/Assessment/Index', [
            'activeSubjects' => $activeSubjects,
            'filters' => $request->only(['search', 'active_class_id', 'mapel_id', 'teacher_id']),
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
            'classes' => $classes,
            'mapels' => $mapels,
            'teachers' => $teachers,
        ]);
    }

    public function exportExcel(Request $request)
    {
        $user = Auth::user();
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum diatur.');
        }

        $query = ActiveSubject::with(['mapel', 'activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])
            ->withMax('studentGrades', 'updated_at')
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });

        $canViewAll = $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);
        if (!$canViewAll) {
            $query->where('active_subjects.teacher_id', $user->id);
        }

        if ($request->active_class_id) {
            $query->where('active_subjects.active_class_id', $request->active_class_id);
        }

        if ($request->mapel_id) {
            $query->where('active_subjects.mapel_id', $request->mapel_id);
        }

        if ($canViewAll && $request->teacher_id) {
            $query->where('active_subjects.teacher_id', $request->teacher_id);
        }

        $query->whereHas('mapel', function ($q) {
            $q->where('name', 'not like', '%Tahfizh%')
                ->where('name', 'not like', '%Tahfidz%');
        });

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('mapel', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', '%' . $request->search . '%');
                })->orWhereHas('activeClass.kelas', function ($subQ) use ($request) {
                    $subQ->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }

        $subjects = $query->join('active_classes', 'active_subjects.active_class_id', '=', 'active_classes.id')
            ->join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->leftJoin('kelas_paralels', 'active_classes.kelas_paralel_id', '=', 'kelas_paralels.id')
            ->select('active_subjects.*')
            ->orderBy('student_grades_max_updated_at', 'desc')
            ->orderBy('kelas.name', 'asc')
            ->orderBy('kelas_paralels.name', 'asc')
            ->get();

        $subjects->transform(function ($subject) use ($activeYear) {
            $kkm = \App\Models\Kkm::where('mapel_id', $subject->mapel_id)
                ->where('kelas_id', $subject->activeClass->kelas_id)
                ->where('academic_year_id', $activeYear->id)
                ->first();
            $subject->kkm = $kkm ? $kkm->kkm_value : '-';
            return $subject;
        });

        $rows = [];
        foreach ($subjects as $index => $subject) {
            $kelas = $subject->activeClass->kelas->name ?? '-';
            $paralel = $subject->activeClass->kelasParalel->name ?? '';
            $kelasLabel = trim($kelas . ' ' . $paralel) ?: '-';

            $rows[] = [
                $index + 1,
                $kelasLabel,
                $subject->mapel->name ?? '-',
                $subject->teacher?->name ?? '-',
                $subject->kkm ?? '-',
                $subject->student_grades_max_updated_at ? date('d M Y H:i', strtotime($subject->student_grades_max_updated_at)) : '-',
            ];
        }

        $columns = ['No', 'Kelas', 'Mata Pelajaran', 'Guru Pengampu', 'KKM', 'Terakhir Diupdate'];
        $fileName = 'daftar_nilai_akademik_' . date('Ymd_His') . '.xlsx';

        return Excel::download(new ArrayExport($rows, $columns), $fileName);
    }

    public function show(Request $request, $id)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $activeSubject = ActiveSubject::with([
            'mapel',
            'teacher',
            'activeClass.kelas',
            'activeClass.kelasParalel',
            'activeClass.classMembers.student.user',
            'activeClass.classMembers.student.studentGrades' => function ($query) use ($id, $activeSemester) {
                $query->where('active_subject_id', $id)
                    ->where('semester_id', $activeSemester->id);
            }
        ])->findOrFail($id);

        // Sort Class Members by User Nomor Induk (NIS)
        if ($activeSubject->activeClass && $activeSubject->activeClass->classMembers) {
            $sortedMembers = $activeSubject->activeClass->classMembers->sortBy(function ($member) {
                return $member->student->user->nomor_induk ?? $member->student->nis ?? 999999;
            })->values();

            $activeSubject->activeClass->setRelation('classMembers', $sortedMembers);
        }

        // Get grade weights for this academic year and semester (if applicable)
        // Note: GradeWeight currently has academic_year_id. 
        // We might need to filter by category 'pengetahuan' or 'keterampilan' if we separate them.
        // For now, fetch all 'pengetahuan' weights.
        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->where('name', 'not like', '%alidasi%')
            ->orderByRaw("CASE 
                WHEN LOWER(name) LIKE 'uh1%' OR LOWER(name) = 'uh 1' THEN 1
                WHEN LOWER(name) LIKE 'uts%' THEN 2
                WHEN LOWER(name) LIKE 'uh2%' OR LOWER(name) = 'uh 2' THEN 3
                WHEN LOWER(name) LIKE 'ukk%' OR LOWER(name) LIKE 'uas%' THEN 4
                ELSE 5 END")
            ->orderBy('id')
            ->get();

        // Fetch KKM for this subject/class
        $kkm = \App\Models\Kkm::where('mapel_id', $activeSubject->mapel_id)
            ->where('kelas_id', $activeSubject->activeClass->kelas_id)
            ->where('academic_year_id', $activeYear->id)
            ->first();
        $kkmValue = $kkm ? $kkm->kkm_value : 70; // Default 70 if not set

        return Inertia::render('Teacher/Assessment/Show', [
            'activeSubject' => $activeSubject,
            'gradeWeights' => $gradeWeights,
            'semester' => $activeSemester,
            'previousParams' => $request->query(),
            'kkmValue' => $kkmValue,
        ]);
    }

    public function exportSubjectExcel(Request $request, $id)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum diatur.');
        }

        $activeSubject = ActiveSubject::with([
            'mapel',
            'activeClass.kelas',
            'activeClass.kelasParalel',
            'activeClass.classMembers.student.user',
            'activeClass.classMembers.student.studentGrades' => function ($query) use ($id, $activeSemester) {
                $query->where('active_subject_id', $id)
                    ->where('semester_id', $activeSemester->id);
            }
        ])->findOrFail($id);

        // Sort Class Members by User Nomor Induk (NIS)
        if ($activeSubject->activeClass && $activeSubject->activeClass->classMembers) {
            $sortedMembers = $activeSubject->activeClass->classMembers->sortBy(function ($member) {
                return $member->student->user->nomor_induk ?? $member->student->nis ?? 999999;
            })->values();

            $activeSubject->activeClass->setRelation('classMembers', $sortedMembers);
        }

        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->where('name', 'not like', '%alidasi%')
            ->orderByRaw("CASE 
                WHEN LOWER(name) LIKE 'uh1%' OR LOWER(name) = 'uh 1' THEN 1
                WHEN LOWER(name) LIKE 'uts%' THEN 2
                WHEN LOWER(name) LIKE 'uh2%' OR LOWER(name) = 'uh 2' THEN 3
                WHEN LOWER(name) LIKE 'ukk%' OR LOWER(name) LIKE 'uas%' THEN 4
                ELSE 5 END")
            ->orderBy('id')
            ->get();

        $columns = ['No', 'NIS', 'Nama'];
        foreach ($gradeWeights as $weight) {
            $columns[] = $weight->name . ' [' . $weight->weight . '%]';
        }

        $rows = [];
        foreach ($activeSubject->activeClass->classMembers as $index => $member) {
            $row = [
                $index + 1,
                $member->student->nomor_induk ?? $member->student->nis ?? '',
                $member->student->name ?? '',
            ];

            $studentGrades = $member->student->studentGrades->keyBy('grade_weight_id');
            foreach ($gradeWeights as $weight) {
                if ($studentGrades->has($weight->id)) {
                    $score = $studentGrades->get($weight->id)->score;
                    $row[] = $score !== null ? (float) $score : '';
                } else {
                    $row[] = '';
                }
            }

            $rows[] = $row;
        }

        $kelas = $activeSubject->activeClass->kelas->name ?? '';
        $paralel = $activeSubject->activeClass->kelasParalel->name ?? '';
        $kelasLabel = trim($kelas . ' ' . $paralel);
        $fileName = 'export_nilai_' . ($activeSubject->mapel->name ?? 'mapel') . '_' . ($kelasLabel ?: 'kelas') . '_' . date('Ymd_His') . '.xlsx';

        return Excel::download(new ArrayExport($rows, $columns), $fileName);
    }

    public function store(Request $request, $id)
    {
        $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.grade_weight_id' => 'required|exists:grade_weights,id',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

        $currentUser = Auth::user();
        $semesterId = \App\Services\AcademicStateService::currentSemester()->id;

        foreach ($request->grades as $gradeData) {
            $conditions = [
                'active_subject_id' => $id,
                'student_id' => $gradeData['student_id'],
                'grade_weight_id' => $gradeData['grade_weight_id'],
                'semester_id' => $semesterId,
            ];

            // Find existing record to check for changes
            $existingGrade = StudentGrade::where($conditions)->first();

            if ($existingGrade) {
                $oldScore = $existingGrade->score;
                $newScore = $gradeData['score'] !== '' ? (float)$gradeData['score'] : null;

                // Only record history and update if score ACTUALLY changed
                if ((string)$oldScore !== (string)$newScore) {
                    $existingGrade->update(['score' => $newScore]);

                    // Log history
                    \App\Models\StudentGradeHistory::create([
                        'student_grade_id' => $existingGrade->id,
                        'old_score' => $oldScore,
                        'new_score' => $newScore,
                        'user_id' => $currentUser->id,
                    ]);
                }
            } else {
                // If no record existed, create one
                $newScore = $gradeData['score'] !== '' ? (float)$gradeData['score'] : null;
                $newGrade = StudentGrade::create(array_merge($conditions, ['score' => $newScore]));

                // Optional: Log history as initial entry?
                // User said: "pastikan tercatat historinya, contoh anak A, pertama dapat nilai 65..."
                // So initial entry might not be strictly required as "history of change", but helps visibility.
                // For now, only log changes.
            }
        }

        return redirect()->back()->with('success', 'Nilai berhasil disimpan.');
    }
    public function downloadTemplate($id)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $activeSubject = ActiveSubject::with([
            'mapel',
            'activeClass.kelas',
            'activeClass.kelasParalel',
            'activeClass.classMembers.student.user', // Added user to eager load for sorting
            'activeClass.classMembers.student.studentGrades' => function ($query) use ($id, $activeSemester) {
                $query->where('active_subject_id', $id)
                    ->where('semester_id', $activeSemester->id);
            }
        ])->findOrFail($id);

        // Sort Class Members by User Nomor Induk (NIS)
        if ($activeSubject->activeClass && $activeSubject->activeClass->classMembers) {
            $sortedMembers = $activeSubject->activeClass->classMembers->sortBy(function ($member) {
                return $member->student->user->nomor_induk ?? $member->student->nis ?? 999999;
            })->values();

            $activeSubject->activeClass->setRelation('classMembers', $sortedMembers);
        }

        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->where('name', 'not like', '%alidasi%')
            ->orderByRaw("CASE 
                WHEN LOWER(name) LIKE 'uh1%' OR LOWER(name) = 'uh 1' THEN 1
                WHEN LOWER(name) LIKE 'uts%' THEN 2
                WHEN LOWER(name) LIKE 'uh2%' OR LOWER(name) = 'uh 2' THEN 3
                WHEN LOWER(name) LIKE 'ukk%' OR LOWER(name) LIKE 'uas%' THEN 4
                ELSE 5 END")
            ->orderBy('id')
            ->get();

        $filename = 'Template_Nilai_' . $activeSubject->mapel->name . '_' . $activeSubject->activeClass->kelas->name . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($activeSubject, $gradeWeights) {
            $file = fopen('php://output', 'w');

            // Header Row
            $header = ['No', 'NIS', 'Nama'];
            foreach ($gradeWeights as $weight) {
                // Determine display name (e.g. UH1 [10%]) for clarity, but for matching we might just use name
                $header[] = $weight->name . " [" . $weight->weight . "%]";
            }
            fputcsv($file, $header);

            // Data Rows
            foreach ($activeSubject->activeClass->classMembers as $index => $member) {
                $row = [
                    $index + 1,
                    $member->student->nis,
                    $member->student->name,
                ];

                // Group grades by weight id for quick lookup
                $studentGrades = $member->student->studentGrades->keyBy('grade_weight_id');

                // Fill columns for grades
                foreach ($gradeWeights as $weight) {
                    if ($studentGrades->has($weight->id)) {
                        $score = $studentGrades->get($weight->id)->score;
                        $row[] = $score !== null ? (float)$score : '';
                    } else {
                        $row[] = '';
                    }
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importSubjectGrades(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx',
        ]);

        $activeSubject = ActiveSubject::findOrFail($id);
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Load existing weights for lookup
        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->where('name', 'not like', '%alidasi%')
            ->orderByRaw("CASE 
                WHEN LOWER(name) LIKE 'uh1%' OR LOWER(name) = 'uh 1' THEN 1
                WHEN LOWER(name) LIKE 'uts%' THEN 2
                WHEN LOWER(name) LIKE 'uh2%' OR LOWER(name) = 'uh 2' THEN 3
                WHEN LOWER(name) LIKE 'ukk%' OR LOWER(name) LIKE 'uas%' THEN 4
                ELSE 5 END")
            ->orderBy('id')
            ->get();

        $file = $request->file('file');

        // Simple CSV Parsing
        $data = array_map('str_getcsv', file($file->getPathname()));

        if (count($data) < 2) {
            return back()->with('error', 'File kosong atau format salah.');
        }

        $header = $data[0];
        $rows = array_slice($data, 1);

        // Map Header Columns to Weight IDs
        $colMap = []; // index => weight_id
        foreach ($header as $index => $colName) {
            // Clean col name: "UH1 [10%]" -> "UH1"
            // Or just try to find containment
            foreach ($gradeWeights as $weight) {
                // Check if header contains the weight name (case insensitive)
                if (stripos($colName, $weight->name) !== false) {
                    $colMap[$index] = $weight->id;
                    break;
                }
            }
        }

        $successCount = 0;
        $failCount = 0;
        $errors = [];

        foreach ($rows as $rowIndex => $row) {
            $rowNum = $rowIndex + 2;

            // Assume NIS is column index 1 (based on template)
            // But let's find 'NIS' in header? Or stick to fixed structure?
            // Let's use flexible header search for NIS
            $nisIndex = array_search('NIS', $header);
            if ($nisIndex === false) $nisIndex = 1; // Fallback

            $nis = isset($row[$nisIndex]) ? trim($row[$nisIndex]) : '';
            if (empty($nis)) continue;

            $student = \App\Models\Student::where('nis', $nis)->first();
            if (!$student) {
                $failCount++;
                $errors[] = "Baris $rowNum: NIS $nis tidak ditemukan.";
                continue;
            }

            // Iterate mapped columns
            foreach ($colMap as $colIndex => $weightId) {
                if (isset($row[$colIndex]) && is_numeric($row[$colIndex])) {
                    StudentGrade::updateOrCreate(
                        [
                            'active_subject_id' => $activeSubject->id,
                            'student_id' => $student->id,
                            'grade_weight_id' => $weightId,
                            'semester_id' => $activeSemester->id,
                        ],
                        [
                            'score' => $row[$colIndex]
                        ]
                    );
                }
            }
            $successCount++;
        }

        $msg = "Impor selesai. $successCount siswa diproses.";
        if ($failCount > 0) $msg .= " $failCount gagal.";

        return back()->with('success', $msg);
    }
}
