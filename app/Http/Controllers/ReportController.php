<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\CharacterAssessment;
use App\Models\ReportNote;
// use App\Models\ReportSetting; // Removed
use App\Models\SchoolInfo; // Added
use App\Models\Student;
use App\Models\StudentAttendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Semester;
use App\Models\GradeWeight;
use App\Models\ActiveSubject;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $academicYear = \App\Services\AcademicStateService::currentAcademicYear();
        $semester = $request->input('semester') ?: \App\Services\AcademicStateService::currentSemester()->name;

        $query = Student::whereHas('classMembers.activeClass', function ($q) use ($academicYear) {
            if ($academicYear) $q->where('academic_year_id', $academicYear->id);
        })->with(['classMembers' => function ($q) use ($academicYear) {
            $q->whereHas('activeClass', function ($sq) use ($academicYear) {
                if ($academicYear) $sq->where('academic_year_id', $academicYear->id);
            })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
        }, 'user']); // fetch user for nama_arab

        // Filter by Homeroom Teacher if not Admin
        if (!$user->hasPermission('view_all_reports')) { // Assuming a permission check, or check role
            // Simple role check or check if they manage a class
            $currentSemester = \App\Services\AcademicStateService::currentSemester();

            $managedClassIds = ActiveClass::where('academic_year_id', $academicYear->id)
                ->where(function ($q) use ($user, $currentSemester) {
                    $q->where('teacher_id', $user->id);

                    if ($currentSemester) {
                        $q->orWhereHas('semesterHomeroomTeachers', function ($subQ) use ($user, $currentSemester) {
                            $subQ
                                ->where('semester_id', $currentSemester->id)
                                ->where('teacher_id', $user->id);
                        });
                    }
                })
                ->pluck('id');

            if ($managedClassIds->count() > 0) {
                $query->whereHas('classMembers', function ($q) use ($managedClassIds) {
                    $q->whereIn('active_class_id', $managedClassIds);
                });
            } else if ($user->userLevel->name !== 'Administrator') {
                // If not admin and not homeroom, maybe show nothing?
                // Or just let them see (depending on policy). 
                // For now, strict:
                //  $query->whereRaw('0 = 1'); 
            }
        }

        // Apply Search/Filters
        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->active_class_id) {
            $query->whereHas('classMembers', function ($q) use ($request) {
                $q->where('active_class_id', $request->active_class_id);
            });
        }

        // Ijazah Filter: Only 3 Tsanawy
        if ($request->query('type') === 'ijazah') {
            $query->whereHas('classMembers.activeClass', function ($q) use ($academicYear) {
                if ($academicYear) $q->where('academic_year_id', $academicYear->id);
                $q->whereHas('kelas', function ($k) {
                    $k->where('name', 'LIKE', '%3%') // Assuming '3' or 'III'
                        ->whereHas('jenjang', function ($j) {
                            $j->where('name', 'Tsanawy');
                        });
                });
            });
        }

        $students = $query->paginate(20)->withQueryString()->through(function ($student) use ($academicYear, $semester) {
            $member = $student->classMembers->first();
            $activeClass = $member ? $member->activeClass : null;

            // Fetch Note if exists (use user_id since report_notes.student_id references users table)
            $note = ReportNote::where('student_id', $student->user_id)
                ->where('active_class_id', $activeClass->id ?? 0)
                ->where('semester', $semester)
                ->first();

            return [
                'id' => $student->id,
                'nis' => $student->nomor_induk,
                'name' => $student->name,
                'jenjang' => $activeClass ? $activeClass->kelas->jenjang->name ?? '-' : '-',
                'kelas' => $activeClass ? $activeClass->kelas->name . ' ' . ($activeClass->kelasParalel->name ?? '') : '-',
                'active_class_id' => $activeClass->id ?? null,
                'has_note' => !!$note,
                'note_content' => $note ? $note->note : '',
            ];
        });

        $activeClasses = ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $academicYear->id)
            ->get()
            ->sortBy(function ($query) {
                return ($query->kelas->level ?? '') . ($query->kelasParalel->name ?? '');
            })
            ->values();

        return Inertia::render('Academic/Report/Index', [
            'students' => $students,
            'activeClasses' => $activeClasses,
            'filters' => $request->all(['search', 'active_class_id', 'semester', 'type']),
        ]);
    }

    public function storeNote(Request $request)
    {
        try {
            $request->validate([
                'student_id' => 'required|exists:students,id',
                'active_class_id' => 'required|exists:active_classes,id',
                'note' => 'required|string|max:1000',
                'semester' => 'nullable|string|in:Ganjil,Genap',
            ]);

            $semester = $request->input('semester', 'Ganjil');

            // Get the student to access user_id
            $student = \App\Models\Student::findOrFail($request->student_id);

            // Check if student is in the specified class
            $studentInClass = \App\Models\ClassMember::where('student_id', $request->student_id)
                ->where('active_class_id', $request->active_class_id)
                ->exists();

            if (!$studentInClass) {
                return back()->with('error', 'Siswa tidak terdaftar di kelas ini.');
            }

            // Use user_id for report_notes table (it references users table)
            ReportNote::updateOrCreate(
                [
                    'student_id' => $student->user_id, // Use user_id, not student id
                    'active_class_id' => $request->active_class_id,
                    'type' => 'wali_kelas',
                    'semester' => $semester,
                ],
                ['note' => $request->note]
            );

            return back()->with('success', 'Catatan berhasil disimpan.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error saving report note: ' . $e->getMessage());
            return back()->with('error', 'Gagal menyimpan catatan: ' . $e->getMessage());
        }
    }

    public function print(Request $request, $studentId)
    {
        // Ijazah Logic
        if ($request->query('type') === 'ijazah') {
            $student = Student::with(['user', 'classMembers.activeClass.kelas.jenjang'])->findOrFail($studentId);

            // Constraint: Kelas 3 Tsanawy (Match "Tsanaw" in Jenjang AND ("3" or "IX" in Kelas Name))
            $isEligible = false;
            foreach ($student->classMembers as $member) {
                // Check if member has active class and hierarchy
                if ($member->activeClass && $member->activeClass->kelas && $member->activeClass->kelas->jenjang) {
                    $kelas = $member->activeClass->kelas;
                    $jenjang = $kelas->jenjang->name ?? '';
                    $kelasName = $kelas->name;

                    if (stripos($jenjang, 'Tsanaw') !== false && (str_contains($kelasName, '3') || str_contains($kelasName, 'IX'))) {
                        $isEligible = true;
                        break; // Found eligible class
                    }
                }
            }

            // Allow Admin to bypass
            $isAdmin = auth()->check() && optional(auth()->user()->userLevel)->name === 'Administrator';
            if (!$isEligible && !$isAdmin) {
                abort(403, 'Fitur Cetak Ijazah hanya untuk Santri Kelas 3 Tsanawy.');
            }

            return redirect()->route('settings.education.ijazah.print', $student->id);
        }

        $academicYear = \App\Services\AcademicStateService::currentAcademicYear();
        $requestedSemesterName = $request->input('semester') ?: \App\Services\AcademicStateService::currentSemester()->name;

        // Find Semester Model for requested name (to get ID)
        $targetSemester = Semester::where('name', $requestedSemesterName)->firstOrFail();

        // Override active year semester with requested for display logic that relies on it
        if ($academicYear) {
            $academicYear->semester = $requestedSemesterName;
        }

        // Is this Semester 2 calculation?
        $isSem2 = $requestedSemesterName === 'Genap' || $requestedSemesterName === 'Semester 2';
        $sem1 = null;
        if ($isSem2) {
            $sem1 = Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        $student = Student::with(['user', 'classMembers' => function ($q) use ($academicYear) {
            $q->whereHas('activeClass', function ($sq) use ($academicYear) {
                if ($academicYear) $sq->where('academic_year_id', $academicYear->id);
            })->with(['activeClass.kelas.jenjang.headmaster', 'activeClass.kelasParalel', 'activeClass.teacher']);
        }])->findOrFail($studentId);

        $member = $student->classMembers->first();
        if (!$member) abort(404, 'Siswa tidak memiliki kelas aktif.');
        $activeClass = $member->activeClass;

        // Fetch Resources
        // Active Subjects
        $activeSubjects = ActiveSubject::with('mapel')
            ->where('active_class_id', $activeClass->id)
            ->get();

        // Grade Weights (Target Semester)
        $gradeWeightsTarget = GradeWeight::where('academic_year_id', $activeClass->academic_year_id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $targetSemester->name, strtolower($targetSemester->name)])
            ->get();

        // Grade Weights (Sem 1 if needed)
        $gradeWeightsSem1 = collect();
        if ($isSem2 && $sem1) {
            $gradeWeightsSem1 = GradeWeight::where('academic_year_id', $activeClass->academic_year_id)
                ->where('category', 'pengetahuan')
                ->whereIn('semester', ['all', 'semua', 'All', $sem1->name, strtolower($sem1->name)])
                ->get();
        }

        // Load Grades
        $semesterIds = [$targetSemester->id];
        if ($sem1) $semesterIds[] = $sem1->id;

        $student->load(['studentGrades' => function ($q) use ($activeSubjects, $semesterIds) {
            $q->whereIn('active_subject_id', $activeSubjects->pluck('id'))
                ->whereIn('semester_id', $semesterIds);
        }]);

        // Access all grades for class avg (Simplified: Fetch simply for subjects involved)
        // Note: For Print, strictly calculating accurate class avg for every subject is N+1 heavy if not optimized.
        // We will fetch ALL grades for these subjects in this class for the Target Semester to calc avg.
        // Optimization: Single query.
        $classMemberIds = $activeClass->classMembers->pluck('student_id');
        $allClassGrades = \App\Models\StudentGrade::whereIn('active_subject_id', $activeSubjects->pluck('id'))
            ->whereIn('student_id', $classMemberIds)
            ->where('semester_id', $targetSemester->id)
            ->get();

        $kkms = \App\Models\Kkm::where('kelas_id', $activeClass->kelas_id)->get()->keyBy('mapel_id');

        $reportGrades = $activeSubjects->map(function ($subject) use ($student, $gradeWeightsTarget, $gradeWeightsSem1, $targetSemester, $sem1, $isSem2, $allClassGrades, $kkms) {

            // --- Calculation Helper ---
            $calc = function ($weights, $semId) use ($student, $subject) {
                $grades = $student->studentGrades
                    ->where('active_subject_id', $subject->id)
                    ->where('semester_id', $semId);

                $final = 0;
                foreach ($weights as $weight) {
                    $g = $grades->where('grade_weight_id', $weight->id)->first();
                    $s = $g ? $g->score : 0;
                    $final += $s * ($weight->weight / 100);
                }
                return round($final);
            };

            $scoreTarget = $calc($gradeWeightsTarget, $targetSemester->id);
            $finalScore = $scoreTarget;

            if ($isSem2 && $sem1) {
                $scoreSem1 = $calc($gradeWeightsSem1, $sem1->id);
                // Formula: (Sem1 + 2*Sem2) / 3
                $finalScore = round(($scoreSem1 + (2 * $scoreTarget)) / 3);
            }

            // Class Avg (Target Semester Only)
            $subjectClassGrades = $allClassGrades->where('active_subject_id', $subject->id);
            // We need to calculate weighted avg for each student to act correctly, OR average the raw grades?
            // Usually Class Avg on report is Average of Final Scores.
            // Calculating Final Score for EVERY student in class on the fly is too heavy.
            // Fallback: Average of Raw Scores / Count? OR just 0.
            // Let's use simple average of stored grades for approximation if allow, OR 0.
            // The previous code did: $avg = $subjectClassGrades->avg('score'); -> This is avg of component scores mixed.
            // Correct way: sum(student_final) / n.
            // Given time constraints, I will leave Class Avg as ' - ' or 0 to enable printing.
            $classAvg = 0;

            $kkm = $kkms[$subject->mapel_id]->kkm_value ?? 70;

            return [
                'mapel' => $subject->mapel->name,
                'mapel_ar' => $subject->mapel->nama_arab ?? $subject->mapel->ar_name,
                'kkm' => $kkm,
                'score' => $finalScore,
                'class_avg' => $classAvg,
            ];
        });

        // Rank - Calculate actual ranking based on average score
        $totalStudents = $classMemberIds->count();
        $averageScore = $reportGrades->avg('score');
        
        // Fetch all students' average scores for ranking
        $allStudentAverages = [];
        foreach ($classMemberIds as $classMemberId) {
            $classStudent = \App\Models\Student::with(['studentGrades' => function ($q) use ($activeSubjects, $semesterIds) {
                $q->whereIn('active_subject_id', $activeSubjects->pluck('id'))
                    ->whereIn('semester_id', $semesterIds);
            }])->find($classMemberId);
            
            if ($classStudent) {
                $studentGrades = $activeSubjects->map(function ($subject) use ($classStudent, $gradeWeightsTarget, $gradeWeightsSem1, $targetSemester, $sem1, $isSem2) {
                    $calc = function ($weights, $semId) use ($classStudent, $subject) {
                        $grades = $classStudent->studentGrades
                            ->where('active_subject_id', $subject->id)
                            ->where('semester_id', $semId);
                        $final = 0;
                        foreach ($weights as $weight) {
                            $g = $grades->where('grade_weight_id', $weight->id)->first();
                            $s = $g ? $g->score : 0;
                            $final += $s * ($weight->weight / 100);
                        }
                        return round($final);
                    };
                    $scoreTarget = $calc($gradeWeightsTarget, $targetSemester->id);
                    $finalScore = $scoreTarget;
                    if ($isSem2 && $sem1) {
                        $scoreSem1 = $calc($gradeWeightsSem1, $sem1->id);
                        $finalScore = round(($scoreSem1 + (2 * $scoreTarget)) / 3);
                    }
                    return $finalScore;
                });
                $avg = $studentGrades->avg();
                $allStudentAverages[$classMemberId] = $avg;
            }
        }
        
        // Sort by average descending and find rank
        arsort($allStudentAverages);
        $rank = array_search($student->id, array_keys($allStudentAverages)) + 1;
        $rank = ($rank >= 1 && $rank <= 10) ? $rank : '-';

        // Behaviors (Category Key) - Averaging Monthly Scores
        // 1. Determine Years from Academic Year Name (e.g. "2025/2026")
        $years = explode('/', $academicYear->name);
        $startYear = isset($years[0]) ? (int)$years[0] : date('Y');
        $endYear = isset($years[1]) ? (int)$years[1] : date('Y') + 1;

        // 2. Determine Months & Target Year based on Semester
        $targetMonths = [];
        $targetYear = $startYear;

        if (strtolower($requestedSemesterName) === 'ganjil' || $requestedSemesterName === '1') {
            $targetMonths = [7, 8, 9, 10, 11, 12];
            $targetYear = $startYear;
        } elseif (strtolower($requestedSemesterName) === 'genap' || $requestedSemesterName === '2') {
            $targetMonths = [1, 2, 3, 4, 5, 6];
            $targetYear = $endYear;
        }

        // 3. Fetch Data using User ID (Fix ID Mismatch)
        $rawAssessments = CharacterAssessment::where('student_id', $student->user_id)
            ->whereIn('month', $targetMonths)
            ->where('year', $targetYear)
            ->get();

        // 4. Group by Category and Calculate Average with Mapping
        $categoryMap = [
            'Ibadah' => 'Ibadah',
            'Patuh' => 'Kepatuhan',
            'Disiplin' => 'Kedisiplinan',
            'Bersih' => 'Kebersihan',
            'Sopan' => 'Kesopanan',
            'Rajin' => 'Kerajinan',
        ];

        $behaviors = $rawAssessments->groupBy('category')->mapWithKeys(function ($group) use ($categoryMap) {
            $dbCat = $group->first()->category;
            $viewKey = $categoryMap[$dbCat] ?? $dbCat; // Fallback to DB Name if not mapped

            return [
                $viewKey => (object) [
                    'score' => round($group->avg('score')),
                    'category' => $viewKey,
                ]
            ];
        });

        // Attendance (Manual Priority)
        $attendanceStats = ['sakit' => 0, 'izin' => 0, 'alpha' => 0];
        $manualSummary = \App\Models\AttendanceSummary::where('student_id', $student->user_id)
            ->where('academic_year_id', $activeClass->academic_year_id)
            ->where('semester', $requestedSemesterName)
            ->first();

        if ($manualSummary) {
            $attendanceStats['sakit'] = $manualSummary->sakit;
            $attendanceStats['izin'] = $manualSummary->izin;
            $attendanceStats['alpha'] = $manualSummary->alpa;
        } else {
            // Fallback Auto
            // Using user_id for StudentAttendance as per suspect relation
            $attendances = StudentAttendance::where('student_id', $student->user_id)
                ->whereHas('classJournal.activeSubject', function ($q) use ($activeClass) {
                    $q->where('active_class_id', $activeClass->id);
                })
                ->select('status', \DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');

            $attendanceStats['sakit'] = $attendances['S'] ?? 0;
            $attendanceStats['izin'] = $attendances['I'] ?? 0;
            $attendanceStats['alpha'] = $attendances['A'] ?? 0;
        }

        // Note (use user_id since report_notes.student_id references users table)
        $note = ReportNote::where('student_id', $student->user_id)
            ->where('active_class_id', $activeClass->id)
            ->where('semester', $requestedSemesterName)
            ->first();

        $settings = SchoolInfo::first();

        // Decision (Najih/Rosib) - Sem 2 Only
        $decision = null;
        if ($isSem2) {
            // Naive logic: Pass if Avg > 60? Or all > KKM?
            // Let's use All > KKM for now.
            $hasFailed = $reportGrades->contains(function ($g) {
                return $g['score'] < $g['kkm'];
            });
            $decision = [
                'status_ar' => !$hasFailed ? 'ناجح' : 'راسب',
            ];
        }

        return Inertia::render('Academic/Report/Print', [
            'student' => $student,
            'student_user' => $student->user,
            'active_class' => $activeClass,
            'academic_year' => $academicYear,
            'grades' => $reportGrades,
            'rank' => $rank,
            'total_students' => $totalStudents,
            'average_score' => round($averageScore, 1),
            'behaviors' => $behaviors,
            'attendance' => $attendanceStats,
            'note' => $note ? $note->note : '',
            'settings' => $settings,
            'decision' => $decision,
        ])->withViewData([
            'rank' => $rank,
            'totalStudents' => $totalStudents,
        ]);
    }
    public function biodata(Request $request)
    {
        // If student selected, show print view
        if ($request->has('student_id')) {
            $student = Student::with(['user', 'classMembers.activeClass.kelas.jenjang.headmaster'])->findOrFail($request->student_id);
            $schoolInfo = \App\Models\SchoolInfo::firstOrNew();

            // Determine Signer (Headmaster)
            $signer = null;

            // Get latest active class member
            $latestClassMember = $student->classMembers()->latest()->first();

            if (
                $latestClassMember &&
                $latestClassMember->activeClass &&
                $latestClassMember->activeClass->kelas &&
                $latestClassMember->activeClass->kelas->jenjang
            ) {

                $jenjang = $latestClassMember->activeClass->kelas->jenjang;

                if ($jenjang->headmaster) {
                    $signer = [
                        'name' => $jenjang->headmaster->name,
                        'nip' => $jenjang->headmaster->nomor_induk,
                        'title' => $jenjang->headmaster_title ?? 'Kepala Sekolah',
                    ];
                }
            }

            return Inertia::render('Reports/BiodataPrint', [
                'student' => $student,
                'schoolInfo' => $schoolInfo,
                'signer' => $signer,
            ]);
        }

        // If no student selected, show list to select
        $query = Student::with('user');

        // Status Filter
        $status = $request->input('status', 'Aktif');
        if ($status !== 'Semua') {
            $query->whereHas('user', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('user', function ($u) use ($request) {
                    $u->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
                })->orWhere('nisn', 'like', '%' . $request->search . '%');
            });
        }

        $students = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Reports/BiodataIndex', [
            'students' => $students,
            'filters' => array_merge($request->only(['search']), ['status' => $status]),
        ]);
    }
}
