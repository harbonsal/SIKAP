<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use App\Models\StudentGrade;
use App\Models\TahfidzAssessmentDetail;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TahfidzAssessmentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Find standard Tahfidz Mapel
        // We look for 'Tahfizh Al-Quran' specifically as per user data, or fallback to 'Tahfidz'
        $tahfidzMapel = \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
            ->orWhere('name', 'like', '%Tahfidz%')
            ->orderByRaw("CASE WHEN name LIKE '%Al-Quran%' THEN 0 ELSE 1 END") // Prioritize full name
            ->first();

        if (!$tahfidzMapel) {
            return redirect()->back()->with('error', 'Mata pelajaran Tahfidz belum dikonfigurasi (Mapel: Tahfizh Al-Quran).');
        }

        $query = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'tahfidzTesters.user'])
            ->where('mapel_id', $tahfidzMapel->id)
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });

        // Filter by teacher (if not Manager Tahfidz and not strictly having 'view_all_assessments')
        // Check Permission
        $isManagerTahfidz = optional($user->userLevel)->name === 'Manager Tahfidz'
            || ($user->additionalLevels && $user->additionalLevels->contains('name', 'Manager Tahfidz'))
            || optional($user->userLevel)->name === 'Administrator'; // Include Admin in "Manager" logic for scope

        // Strict Filter: Even if user has 'view_all_tahfidz_grades' (e.g. from Check All), 
        // we enforce strictness for teachers unless they are explicitly Managers.

        $canViewAll = $isManagerTahfidz || $user->hasPermission('view_all_tahfidz_grades');

        // FORCE FILTER for Context "Guru" if not Manager
        // Use direct relationship check since hasRole() is likely undefined
        $isGuru = optional($user->userLevel)->name === 'Guru';

        if ($isGuru && !$isManagerTahfidz) {
            $canViewAll = false; // Override permission if it was accidentally granted
        }

        if (!$canViewAll) {
            $query->whereHas('tahfidzTesters', function ($subQ) use ($user) {
                $subQ->where('user_id', $user->id);
            });
        }

        $activeSubjects = $query->get()->sortBy(function ($q) {
            $kelas = $q->activeClass->kelas ?? null;
            $paralel = $q->activeClass->kelasParalel ?? null;
            return ($kelas->level ?? 99) . ($kelas->name ?? '') . ($paralel->name ?? '');
        })->values();

        return Inertia::render('Teacher/TahfidzAssessment/Index', [
            'activeSubjects' => $activeSubjects,
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
        ]);
    }

    public function show($id)
    {
        // 1. Show List of Exams (GradeWeights) for this class
        $activeSubject = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])->findOrFail($id);
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Fetch ALL Standard Grade Weights (UH1, UTS, UAS, etc.) for this semester
        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->orderBy('name')
            ->get();

        return Inertia::render('Teacher/TahfidzAssessment/Show', [
            'activeSubject' => $activeSubject,
            'gradeWeights' => $gradeWeights,
        ]);
    }

    public function showStudents(Request $request, $active_subject, $grade_weight)
    {
        // 2. Show List of Students for selected Exam
        $activeSubject = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.classMembers.student.user'])->findOrFail($active_subject);

        // Sort Class Members by User Nomor Induk (NIS)
        if ($activeSubject->activeClass && $activeSubject->activeClass->classMembers) {
            $sortedMembers = $activeSubject->activeClass->classMembers->sortBy(function ($member) {
                return $member->student->user->nomor_induk ?? $member->student->nis ?? 999999;
            })->values();

            $activeSubject->activeClass->setRelation('classMembers', $sortedMembers);
        }

        $gradeWeight = GradeWeight::findOrFail($grade_weight);
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Fetch existing grades for this exam to show status
        $existingGrades = StudentGrade::where('active_subject_id', $active_subject)
            ->where('grade_weight_id', $grade_weight)
            ->where('semester_id', $activeSemester->id)
            ->with(['tahfidzDetails']) // Changed to hasMany
            ->get()
            ->keyBy('student_id');

        // Fetch KKM
        $kkmValue = 75; // Default fallback
        $kkm = \App\Models\Kkm::where('academic_year_id', $activeSubject->activeClass->academic_year_id)
            ->where('kelas_id', $activeSubject->activeClass->kelas_id)
            ->where('mapel_id', $activeSubject->mapel_id)
            ->first();

        if ($kkm && $kkm->kkm_value) {
            $kkmValue = $kkm->kkm_value;
        }

        return Inertia::render('Teacher/TahfidzAssessment/StudentList', [
            'activeSubject' => $activeSubject,
            'gradeWeight' => $gradeWeight,
            'existingGrades' => $existingGrades,
            'kkm' => $kkmValue,
            'lockStatus' => $this->checkLockedStatus(),
        ]);
    }

    public function assess(Request $request, $active_subject, $grade_weight, $student_id)
    {
        // 3. Assessment Interface
        $activeSubject = ActiveSubject::findOrFail($active_subject);
        $gradeWeight = GradeWeight::findOrFail($grade_weight);
        $student = \App\Models\Student::findOrFail($student_id);
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Check if already graded
        $grade = StudentGrade::where('active_subject_id', $active_subject)
            ->where('grade_weight_id', $grade_weight)
            ->where('student_id', $student_id)
            ->where('semester_id', $activeSemester->id)
            ->with(['tahfidzDetails' => function ($q) {
                $q->orderBy('question_number');
            }])
            ->first();

        // [NEW] Find Next Student for Navigation
        // Re-fetch active subject with class members to determine order
        $subjectWithStudents = ActiveSubject::with(['activeClass.classMembers.student.user'])->find($active_subject);
        $nextStudentId = null;

        if ($subjectWithStudents && $subjectWithStudents->activeClass) {
            // Get all students sorted by name (same as list view)
            $students = $subjectWithStudents->activeClass->classMembers
                ->map(function ($member) {
                    return $member->student;
                })
                ->sortBy(function ($student) {
                    return $student->user->nomor_induk ?? $student->nis ?? 999999;
                })
                ->values(); // Reset keys to 0, 1, 2...

            // Find current index
            $currentIndex = $students->search(function ($s) use ($student_id) {
                return $s->id == $student_id;
            });

            // Get next if exists
            if ($currentIndex !== false && isset($students[$currentIndex + 1])) {
                $nextStudentId = $students[$currentIndex + 1]->id;
            }
        }

        // [NEW] Calculate Eligible Juz for Validation
        $eligibleValidationJuz = [];
        if (str_contains(strtolower($gradeWeight->name), 'validasi')) {
            // Get all completed juz – these are all eligible for validation testing
            // Note: is_validated flag may contain dirty data from sync issues, so we
            // show ALL completed juz and let the teacher choose which to test
            $eligibleValidationJuz = \App\Models\TahfidzMemorization::where('student_id', $student_id)
                ->where('is_completed', true)
                ->pluck('juz')
                ->map(fn($j) => intval($j))
                ->sort()
                ->values()
                ->toArray();
        }

        return Inertia::render('Teacher/TahfidzAssessment/Assessment', [
            'activeSubject' => $activeSubject,
            'gradeWeight' => $gradeWeight,
            'student' => $student,
            'grade' => $grade,
            'nextStudentId' => $nextStudentId,
            'kkm' => $this->getKkmValue($activeSubject), // Fetch KKM
            'lockStatus' => $this->checkLockedStatus(),
            'eligibleValidationJuz' => $eligibleValidationJuz,
        ]);
    }

    private function getKkmValue($activeSubject)
    {
        $kkmValue = 75; // Default fallback
        $kkm = \App\Models\Kkm::where('academic_year_id', $activeSubject->activeClass->academic_year_id)
            ->where('kelas_id', $activeSubject->activeClass->kelas_id)
            ->where('mapel_id', $activeSubject->mapel_id)
            ->first();

        if ($kkm && $kkm->kkm_value) {
            $kkmValue = $kkm->kkm_value;
        }
        return $kkmValue;
    }

    public function store(Request $request, $id)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'grade_weight_id' => 'required|exists:grade_weights,id',
            'answers' => 'required|array',
            'answers.*.question_number' => 'required|integer',
            'answers.*.mistakes' => 'required|integer|min:0',
            'answers.*.surah_name' => 'nullable|string',
            'answers.*.verse_start' => 'nullable',
            'reading_quality' => 'required|string|in:bagus,kurang',
            'reading_deficiencies' => 'nullable|array',
            'is_remedial' => 'nullable|boolean',
            'is_excused' => 'nullable|boolean',
        ]);

        $lockStatus = $this->checkLockedStatus();
        if ($lockStatus === 'strict_lock') {
            return back()->with('error', 'Masa perbaikan ujian telah berakhir. Anda tidak dapat melakukan input nilai.');
        }

        try {
            return \DB::transaction(function () use ($request, $id) {
                $activeSemester = \App\Services\AcademicStateService::currentSemester();

                // 1. Get or Create Main Grade Record
                $grade = StudentGrade::firstOrCreate(
                    [
                        'active_subject_id' => $id,
                        'student_id' => $request->student_id,
                        'grade_weight_id' => $request->grade_weight_id,
                        'semester_id' => $activeSemester->id,
                    ],
                    ['score' => 0]
                );

                $isNewSubmission = $grade->wasRecentlyCreated;
                $existingScore = $grade->score;

                // 2. Save/Update Question Details
                foreach ($request->answers as $answer) {
                    TahfidzAssessmentDetail::updateOrCreate(
                        [
                            'student_grade_id' => $grade->id,
                            'question_number' => $answer['question_number'],
                        ],
                        [
                            'mistakes' => $answer['mistakes'],
                            'surah_name' => $answer['surah_name'] ?? null,
                            'verse_start' => $answer['verse_start'] ?? null,
                            'juz' => $answer['juz'] ?? null,
                        ]
                    );
                }

                // 3. Re-Calculate Average Score
                $gw = GradeWeight::findOrFail($request->grade_weight_id);
                $name = strtoupper($gw->name);
                
                $totalQuestions = 1; // Default
                if (str_contains($name, 'UH')) $totalQuestions = 3;
                if (str_contains($name, 'UTS') || str_contains($name, 'UAS') || str_contains($name, 'UKK')) $totalQuestions = 5;

                $allDetails = $grade->tahfidzDetails()->get();
                $totalPoints = 0;
                foreach ($allDetails as $detail) {
                    // Skala 0-100 per soal: (10 - mistakes) * 10
                    $totalPoints += max(0, 10 - $detail->mistakes) * 10;
                }

                $calculatedScore = $totalPoints / max(1, $totalQuestions);
                $finalScore = $calculatedScore;

                // 4. Mode Distinction Logic
                if ($request->boolean('is_remedial')) {
                    // REMEDIAL MODE: Only take if better than current score
                    if ($calculatedScore <= $existingScore) {
                        // Throw exception to trigger DB::transaction rollback
                        throw new \Exception('Nilai pengulangan (' . round($calculatedScore, 1) . ') tidak lebih tinggi dari nilai sebelumnya (' . round($existingScore, 1) . '). Data tidak disimpan.');
                    }

                    // Cap at 70
                    $finalScore = min(70, $calculatedScore);
                } else {
                    // NORMAL MODE
                    if ($lockStatus === 'late_phase' && $isNewSubmission && !$request->boolean('is_excused')) {
                        // Telat & Tledor -> Cap at 70
                        $finalScore = min(70, $calculatedScore);
                    }
                }

                // 5. Update Grade Record
                $grade->update([
                    'score' => $finalScore,
                    'reading_quality' => $request->reading_quality,
                    'reading_deficiencies' => $request->reading_deficiencies ?? [],
                    'is_excused' => $request->boolean('is_excused', false),
                ]);

                // 6. Handle Validation Logic for Juz
                if (str_contains(strtolower($gw->name), 'validasi')) {
                    foreach ($request->answers as $ans) {
                        if (isset($ans['juz']) && $ans['juz'] && $ans['juz'] !== 'all') {
                            \App\Models\TahfidzMemorization::where('student_id', $request->student_id)
                                ->where('juz', $ans['juz'])
                                ->where('is_completed', true)
                                ->update(['is_validated' => true]);
                        }
                    }
                }

                return back()->with('success', 'Penilaian berhasil disimpan. Skor: ' . round($finalScore, 1));
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function recapIndex(Request $request)
    {
        $user = Auth::user();
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // Identical mapel fetching logic as index
        $tahfidzMapel = \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
            ->orWhere('name', 'like', '%Tahfidz%')
            ->orderByRaw("CASE WHEN name LIKE '%Al-Quran%' THEN 0 ELSE 1 END")
            ->first();

        if (!$tahfidzMapel) {
            return redirect()->back()->with('error', 'Mata pelajaran Tahfidz belum dikonfigurasi.');
        }

        $query = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel'])
            ->where('mapel_id', $tahfidzMapel->id)
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            });

        // Filter by teacher permission
        $isManagerTahfidz = optional($user->userLevel)->name === 'Manager Tahfidz'
            || ($user->additionalLevels && $user->additionalLevels->contains('name', 'Manager Tahfidz'))
            || optional($user->userLevel)->name === 'Administrator';

        // Override permission usage for strict 'Guru' context
        $canViewAll = $isManagerTahfidz || $user->hasPermission('view_all_tahfidz_grades');

        $isGuru = optional($user->userLevel)->name === 'Guru';
        if ($isGuru && !$isManagerTahfidz) {
            $canViewAll = false;
        }

        if (!$canViewAll) {
            $query->where(function ($q) use ($user) {
                $q->where('teacher_id', $user->id)
                    ->orWhereHas('tahfidzTesters', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    });
            });
        }

        $activeSubjects = $query->get()->sortBy(function ($q) {
            $kelas = $q->activeClass->kelas ?? null;
            $paralel = $q->activeClass->kelasParalel ?? null;
            return ($kelas->level ?? 99) . ($kelas->name ?? '') . ($paralel->name ?? '');
        })->values();

        return Inertia::render('Teacher/TahfidzAssessment/RecapList', [
            'activeSubjects' => $activeSubjects,
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
        ]);
    }

    public function recapShow($id)
    {
        $activeSubject = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.classMembers.student', 'teacher'])->findOrFail($id);
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        // 1. Get ALL GradeWeights for the columns (Horizontal)
        // Custom sort order: UH1 → UTS → UH2 → UKK/UAS (then anything else)
        $gradeWeightsRaw = GradeWeight::where('academic_year_id', $activeYear->id)
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->get();

        $orderMap = ['UH1' => 1, 'UTS' => 2, 'UH2' => 3, 'UKK' => 4, 'UAS' => 4, 'VALIDASI' => 5];
        $gradeWeights = $gradeWeightsRaw->sortBy(function ($gw) use ($orderMap) {
            $nameUpper = strtoupper(trim($gw->name));
            foreach ($orderMap as $key => $order) {
                if (str_contains($nameUpper, $key)) return $order;
            }
            return 99;
        })->values();

        // 2. Get ALL Students for the rows (Vertical)
        $students = $activeSubject->activeClass->classMembers->map(function ($member) {
            return $member->student;
        })->sortBy(function ($student) {
            return $student->user->nomor_induk ?? $student->nis ?? 999999;
        });

        // 3. Get ALL Grades for this subject WITH tahfidz_details for mistake history
        $grades = StudentGrade::where('active_subject_id', $id)
            ->where('semester_id', $activeSemester->id)
            ->with(['tahfidzDetails' => function ($q) {
                $q->orderBy('question_number');
            }])
            ->get();

        // 4. Map Grades for easier frontend consumption
        // gradeMatrix: { student_id: { grade_weight_id: score } }
        // gradeDetails: { student_id: { grade_weight_id: [detail, ...] } }
        $gradeMatrix = [];
        $gradeDetails = [];
        foreach ($grades as $g) {
            if (!isset($gradeMatrix[$g->student_id])) {
                $gradeMatrix[$g->student_id] = [];
                $gradeDetails[$g->student_id] = [];
            }
            $gradeMatrix[$g->student_id][$g->grade_weight_id] = $g->score;
            $gradeDetails[$g->student_id][$g->grade_weight_id] = $g->tahfidzDetails->values();
        }

        // 5. Get KKM Value
        $kkmValue = 75; // Default fallback
        $kkm = \App\Models\Kkm::where('academic_year_id', $activeYear->id)
            ->where('kelas_id', $activeSubject->activeClass->kelas_id)
            ->where('mapel_id', $activeSubject->mapel_id)
            ->first();

        if ($kkm && $kkm->kkm_value) {
            $kkmValue = $kkm->kkm_value;
        }

        return Inertia::render('Teacher/TahfidzAssessment/RecapDetail', [
            'activeSubject' => $activeSubject,
            'gradeWeights' => $gradeWeights, // Columns
            'students' => $students->values(), // Rows
            'gradeMatrix' => $gradeMatrix, // Cells
            'gradeDetails' => $gradeDetails, // Mistake history per student per grade weight
            'kkm' => $kkmValue,
        ]);
    }
    public function history($active_subject, $student_id)
    {
        $activeSubject = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel'])->findOrFail($active_subject);
        $student = \App\Models\Student::with('user')->findOrFail($student_id);
        $activeSemester = \App\Services\AcademicStateService::currentSemester();
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        // Get all grades for this student in this subject for current semester
        // We load gradeWeight to show "UH1", "UTS", etc.
        // We load tahfidzDetails to show the question breakdown
        $grades = StudentGrade::where('active_subject_id', $active_subject)
            ->where('student_id', $student_id)
            ->where('semester_id', $activeSemester->id)
            ->with(['gradeWeight', 'tahfidzDetails' => function ($q) {
                $q->orderBy('question_number');
            }])
            ->get()
            ->sortBy(function ($grade) {
                return $grade->gradeWeight->name; // Sort by exam name (simple sort)
            })
            ->values();

        return Inertia::render('Teacher/TahfidzAssessment/History', [
            'activeSubject' => $activeSubject,
            'student' => $student,
            'grades' => $grades,
            'semester' => $activeSemester,
            'academicYear' => $activeYear,
        ]);
    }
    private function checkLockedStatus()
    {
        $user = Auth::user();

        // 1. Bypass for Admin and Manager Tahfidz
        $userLevel = $user->userLevel->name ?? '';
        $additionalLevels = $user->additionalLevels->pluck('name')->toArray();

        if (
            $userLevel === 'Administrator' || $userLevel === 'Manager Tahfidz' ||
            in_array('Administrator', $additionalLevels) || in_array('Manager Tahfidz', $additionalLevels)
        ) {
            return 'open';
        }

        // 2. Check Dates
        $startDate = Setting::where('key', 'tahfidz_exam_start_date')->value('value');
        $endDate = Setting::where('key', 'tahfidz_exam_end_date')->value('value');

        // If dates are not set, assume OPEN
        if (!$startDate && !$endDate) {
            return 'open';
        }

        $now = Carbon::now();

        if ($startDate && $now->lt(Carbon::parse($startDate))) {
            return 'not_started';
        }

        if ($endDate) {
            $end = Carbon::parse($endDate);
            if ($now->gt($end)) {
                $latePhaseEnd = $end->copy()->addDay();
                if ($now->lte($latePhaseEnd)) {
                    return 'late_phase';
                }
                return 'strict_lock';
            }
        }

        return 'open';
    }
}
