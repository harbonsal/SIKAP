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

        $canViewAll = $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) || $user->hasPermission('view_all_assessments');
        if (!$canViewAll) {
            // Hanya guru pengampu yang dapat melihat & menginput mapel miliknya
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
            ->addSelect('active_subjects.*') // Select active_subjects columns to avoid ID conflicts
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
        $classesQuery = \App\Models\ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeYear->id)
            ->whereHas('activeSubjects');

        $mapelsQuery = \App\Models\Mapel::whereHas('activeSubjects', function ($q) use ($activeYear) {
            $q->whereHas('activeClass', function ($subQ) use ($activeYear) {
                $subQ->where('academic_year_id', $activeYear->id);
            });
        });

        // Initialize teachers list
        $teachers = [];

        if (!$canViewAll) {
            // Guru hanya melihat filter kelas dan mapel yang benar-benar diampunya
            $classesQuery->whereHas('activeSubjects', function ($sub) use ($user) {
                $sub->where('teacher_id', $user->id);
            });

            $mapelsQuery->whereHas('activeSubjects', function ($q) use ($activeYear, $user) {
                $q->whereHas('activeClass', function ($subQ) use ($activeYear) {
                    $subQ->where('academic_year_id', $activeYear->id);
                })->where('teacher_id', $user->id);
            });
        } else {
            // Admin can see all, fetch Teachers list for filter
            $teachers = \App\Models\User::whereHas('activeSubjects', function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($subQ) use ($activeYear) {
                    $subQ->where('academic_year_id', $activeYear->id);
                });
            })->orderBy('name')->get(['id', 'name']);

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

        $canViewAll = $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) || $user->hasPermission('view_all_assessments');
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
            ->addSelect('active_subjects.*')
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

        $currentUser = Auth::user();
        $isSuper = $currentUser->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) || $currentUser->hasPermission('view_all_assessments');
        $isTeacher = $activeSubject->teacher_id == $currentUser->id;

        if (!$isSuper && !$isTeacher) {
            abort(403, 'Akses ditolak: Hanya guru pengampu mata pelajaran yang bersangkutan atau Administrator yang berhak mengakses halaman input nilai ini.');
        }

        $isReadOnly = false;

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

        $kkm = \App\Models\Kkm::where('mapel_id', $activeSubject->mapel_id)
            ->where('kelas_id', $activeSubject->activeClass->kelas_id)
            ->where('academic_year_id', $activeYear->id)
            ->first();
        $kkmValue = $kkm ? $kkm->kkm_value : 70;

        return Inertia::render('Teacher/Assessment/Show', [
            'activeSubject' => $activeSubject,
            'gradeWeights' => $gradeWeights,
            'semester' => $activeSemester,
            'previousParams' => $request->query(),
            'kkmValue' => $kkmValue,
            'isReadOnly' => $isReadOnly,
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

        $currentUser = Auth::user();
        $isSuper = $currentUser->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) || $currentUser->hasPermission('view_all_assessments');
        $isTeacher = $activeSubject->teacher_id == $currentUser->id;

        if (!$isSuper && !$isTeacher) {
            abort(403, 'Akses ditolak: Hanya guru pengampu mata pelajaran atau Administrator yang berhak mengunduh data nilai mata pelajaran ini.');
        }

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

        $columns = ['No', 'NIS'];
        foreach ($gradeWeights as $weight) {
            $columns[] = $weight->name . ' [' . $weight->weight . '%]';
        }

        $rows = [];
        foreach ($activeSubject->activeClass->classMembers as $index => $member) {
            $row = [
                $index + 1,
                $member->student->user->nomor_induk ?? $member->student->nis ?? '',
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
        $currentUser = Auth::user();
        $activeSubject = ActiveSubject::findOrFail($id);

        $isSuper = $currentUser->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);
        $isTeacher = $activeSubject->teacher_id == $currentUser->id;

        // Enforce strict mutate lock: Only assigned teacher or Super Admin can edit grades
        if (!$isSuper && !$isTeacher) {
            abort(403, 'Akses ditolak: Hanya guru pengampu mata pelajaran yang berhak menginput atau mengubah nilai.');
        }

        $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.grade_weight_id' => 'required|exists:grade_weights,id',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

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

        $currentUser = Auth::user();
        $isSuper = $currentUser->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) || $currentUser->hasPermission('view_all_assessments');
        $isTeacher = $activeSubject->teacher_id == $currentUser->id;

        if (!$isSuper && !$isTeacher) {
            abort(403, 'Akses ditolak: Hanya guru pengampu mata pelajaran yang berhak mengunduh template input nilai.');
        }

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

        $columns = ['No', 'NIS'];
        foreach ($gradeWeights as $weight) {
            $columns[] = $weight->name . ' [' . $weight->weight . '%]';
        }

        $rows = [];
        foreach ($activeSubject->activeClass->classMembers as $index => $member) {
            $row = [
                $index + 1,
                $member->student->user->nomor_induk ?? $member->student->nis ?? '',
            ];

            // Fill empty columns for grades since this is an input template
            foreach ($gradeWeights as $weight) {
                $row[] = '';
            }
            
            $rows[] = $row;
        }

        $kelas = $activeSubject->activeClass->kelas->name ?? '';
        $paralel = $activeSubject->activeClass->kelasParalel->name ?? '';
        $kelasLabel = trim($kelas . ' ' . $paralel);
        $fileName = 'Template_Input_Nilai_' . ($activeSubject->mapel->name ?? 'mapel') . '_' . ($kelasLabel ?: 'kelas') . '_' . date('Ymd_His') . '.xlsx';

        return Excel::download(new ArrayExport($rows, $columns), $fileName);
    }

    public function importSubjectGrades(Request $request, $id)
    {
        $currentUser = Auth::user();
        $activeSubject = ActiveSubject::findOrFail($id);

        $isSuper = $currentUser->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);
        $isTeacher = $activeSubject->teacher_id == $currentUser->id;

        if (!$isSuper && !$isTeacher) {
            abort(403, 'Akses ditolak: Hanya guru pengampu mata pelajaran yang berhak mengimpor nilai.');
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx',
        ]);

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

        // Parse using Excel Facade to support xlsx/csv seamlessly
        $dataArray = \Maatwebsite\Excel\Facades\Excel::toArray(new \App\Imports\GenericImport, $file);

        if (empty($dataArray) || count($dataArray[0]) < 2) {
            return back()->with('error', 'File kosong atau format salah.');
        }

        $sheetData = $dataArray[0];
        $header = $sheetData[0];
        $rows = array_slice($sheetData, 1);

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
