<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\AcademicStateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $academicYearId = AcademicStateService::currentAcademicYear()?->id;
        $user = auth()->user();
        $schedule = [];

        // Initial Stats Setup
        $stats = ['role' => 'guest']; // Default

        // Check Permissions
        $canViewStats = $user->hasPermission('view_dashboard_stats');
        $canViewCalendar = $user->hasPermission('view_dashboard_calendar');

        // Determine Available Dashboards
        $availableDashboards = [];
        $allLevels = collect([$user->userLevel])->merge($user->additionalLevels)->unique('id');

        foreach ($allLevels as $level) {
            if ($level) {
                $type = $level->dashboard_type ?? 'Default';
            } else {
                $type = 'Default';
            }

            // Map generic levels to types if needed (fallback logic)
            if ($type === 'Default' && $level) {
                if (str_contains(strtolower($level->name), 'oswan')) {
                    $type = 'Oswan';
                } elseif (in_array($level->name, ['Guru', 'Wali Kelas', 'Kepala Sekolah'])) {
                    $type = 'Teacher';
                } elseif ($level->name === 'Santri') {
                    $type = 'Student';
                } elseif ($level->name === 'Manager Tahfidz') {
                    $type = 'Admin';
                } else {
                    $type = 'Admin';
                }
            } elseif ($type === 'Default') {
                $type = 'Admin'; // Absolute fallback
            }

            // Avoid duplicates
            if (!isset($availableDashboards[$type])) {
                $availableDashboards[$type] = [
                    'label' => $type === 'Teacher' ? 'Guru' : ($type === 'Student' ? 'Santri' : ($type === 'Oswan' ? 'OSWAN' : 'Admin')),
                    'type' => $type
                ];
            }
        }

        $isTeacherRole = in_array('Guru', $allLevels->pluck('name')->toArray());
        $isHomeroomRole = in_array('Wali Kelas', $allLevels->pluck('name')->toArray()) || $user->isCurrentHomeroomTeacher();

        // [Feature] Prioritize Teacher Dashboard for Managers with Teaching Load or Teacher Role
        $hasActiveSubjects = false;
        if ($academicYearId) {
            $hasActiveSubjects = \App\Models\ActiveSubject::where('teacher_id', $user->id)
                ->whereHas('activeClass', fn($q) => $q->where('academic_year_id', $academicYearId))
                ->exists()
                || \App\Models\Schedule::where('teacher_id', $user->id)->where('academic_year_id', $academicYearId)->exists()
                || \App\Models\SemesterSubjectTeacher::where('teacher_id', $user->id)->whereHas('activeSubject.activeClass', fn($q) => $q->where('academic_year_id', $academicYearId))->exists()
                || $isTeacherRole;
        }

        // 1. Determine Default Dashboard Type
        // If user has teaching load, PREFER 'Teacher' dashboard, even if they are Manager
        $defaultType = $user->userLevel?->dashboard_type ?? 'Default';

        if ($defaultType === 'Default') {
            if ($user->userLevel && str_contains(strtolower($user->userLevel->name), 'oswan')) {
                $defaultType = 'Oswan';
            } elseif ($user->userLevel && $user->userLevel->name === 'Santri') {
                $defaultType = 'Student';
            } elseif ($hasActiveSubjects && $isTeacherRole) {
                // FORCE Teacher Dashboard if they have active subjects and are a teacher
                $defaultType = 'Teacher';
            } elseif ($user->userLevel && in_array($user->userLevel->name, ['Guru', 'Wali Kelas', 'Kepala Sekolah'])) {
                $defaultType = 'Teacher';
            } else {
                $defaultType = 'Admin';
            }
        }

        // 2. Handle 'view_as' Override
        $request = request();
        $requestedType = $request->query('view_as');

        // Check availability of Teacher dashboard
        if ($hasActiveSubjects && !isset($availableDashboards['Teacher'])) {
            $availableDashboards['Teacher'] = [
                'label' => 'Guru',
                'type' => 'Teacher'
            ];
        }

        if ($requestedType && isset($availableDashboards[$requestedType])) {
            $dashboardType = $requestedType;
        } else {
            $dashboardType = $defaultType;
        }

        if ($canViewStats) {
            if ($dashboardType === 'Teacher') {
                // Teacher-specific Stats across all assignments (direct, schedule, semester)
                $myActiveSubjectIds = collect([]);
                if ($academicYearId) {
                    $directIds = \App\Models\ActiveSubject::where('teacher_id', $user->id)
                        ->whereHas('activeClass', fn($q) => $q->where('academic_year_id', $academicYearId))
                        ->pluck('id');
                    $scheduleSubjectIds = \App\Models\Schedule::where('teacher_id', $user->id)
                        ->where('academic_year_id', $academicYearId)
                        ->whereNotNull('active_subject_id')
                        ->pluck('active_subject_id');
                    $semesterSubjectIds = \App\Models\SemesterSubjectTeacher::where('teacher_id', $user->id)
                        ->whereHas('activeSubject.activeClass', fn($q) => $q->where('academic_year_id', $academicYearId))
                        ->pluck('active_subject_id');
                    $myActiveSubjectIds = $directIds->merge($scheduleSubjectIds)->merge($semesterSubjectIds)->unique()->values();
                }

                $myActiveSubjects = \App\Models\ActiveSubject::whereIn('id', $myActiveSubjectIds)
                    ->with(['activeClass.kelas', 'activeClass.kelasParalel', 'mapel'])
                    ->get();

                $myClassIds = $myActiveSubjects->pluck('active_class_id')->filter()->unique();

                // Count students in classes I teach
                $myStudentCount = \App\Models\ClassMember::whereIn('active_class_id', $myClassIds)
                    ->distinct('student_id')
                    ->count();

                // Get Classes details
                $myClasses = \App\Models\ActiveClass::whereIn('id', $myClassIds)
                    ->with(['kelas', 'kelasParalel'])
                    ->get()
                    ->sortBy(fn($ac) => $ac->kelas?->name ?? '');

                // Get Unique Subjects
                $mySubjects = $myActiveSubjects->map(fn($as) => $as->mapel?->name)->filter()->unique()->values();

                $skriningToday = \App\Models\HafalanSkrining::whereDate('created_at', \Carbon\Carbon::today())->count();

                // Override global stats with personal stats
                $stats = [
                    'my_students' => $myStudentCount,
                    'my_classes' => $myClassIds->count(),
                    'my_subjects' => $mySubjects->count(), // Count unique subjects
                    'my_class_list' => $myClasses->map(fn($c) => ($c->kelas?->name ?? '') . ' ' . ($c->kelasParalel?->name ?? ''))->values(),
                    'my_subject_list' => $mySubjects,
                    'role' => 'teacher',
                    'skrining_today' => $skriningToday, // Widget
                ];
            }
        }

        if ($dashboardType === 'Student') {
            // Student-specific Stats
            // 1. Get Student Record
            $student = \App\Models\Student::where('user_id', $user->id)->first();

            if ($student) {
                // 2. Get Active Class for current Academic Year
                $classMember = \App\Models\ClassMember::where('student_id', $student->id)
                    ->whereHas('activeClass', function ($q) use ($academicYearId) {
                        $q->where('academic_year_id', $academicYearId);
                    })
                    ->with(['activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.teacher'])
                    ->latest()
                    ->first();

                if ($classMember) {
                    $myClass = $classMember->activeClass;

                    // 3. Get Homeroom Teacher (Account for semester overrides if needed, generic for now)
                    // Assuming simple relationship first, can use the helper method on ActiveClass if exists
                    $homeroomTeacher = $myClass->teacher;

                    $stats = [
                        'class_name' => trim(($myClass->kelas->name ?? '') . ' ' . ($myClass->kelasParalel->name ?? '')),
                        'homeroom_teacher' => $homeroomTeacher->name ?? '-',
                        'role' => 'student'
                    ];

                    // 4. Get Schedule for Student's Class
                    \Carbon\Carbon::setLocale('id');
                    $dayName = \Carbon\Carbon::now()->translatedFormat('l');
                    $day = \App\Models\Day::where('name', $dayName)->first();

                    if ($day) {
                        $schedule = \App\Models\Schedule::where('active_class_id', $myClass->id)
                            ->where('academic_year_id', $academicYearId)
                            ->where('day_id', $day->id)
                            ->with([
                                'learningHour',
                                'activeSubject.mapel',
                                'teacher'
                            ])
                            ->join('learning_hours', 'schedules.learning_hour_id', '=', 'learning_hours.id')
                            ->select('schedules.*')
                            ->orderBy('learning_hours.start_time')
                            ->get();
                    }

                    // 5. Get Active Kamar (Dorm)
                    $kamarMember = \App\Models\KamarMember::where('student_id', $student->id)
                        ->whereHas('activeKamar', function ($q) use ($academicYearId) {
                            $q->where('academic_year_id', $academicYearId);
                        })
                        ->with(['activeKamar.kamar', 'activeKamar.musrif'])
                        ->first();

                    if ($kamarMember && $kamarMember->activeKamar) {
                        $stats['kamar_name'] = $kamarMember->activeKamar->name ?? ($kamarMember->activeKamar->kamar->name ?? '-');
                        $stats['musrif_name'] = $kamarMember->activeKamar->musrif->name ?? '-';
                    }

                    // 6. [NEW] Grade Analysis (Low Grades < 70)
                    $lowGrades = \App\Models\StudentGrade::where('student_id', $student->id)
                        ->where('semester_id', \App\Models\Semester::where('is_active', true)->value('id'))
                        ->where('score', '<', 70)
                        ->with(['activeSubject.mapel', 'gradeWeight'])
                        ->get()
                        ->map(function ($grade) {
                            return [
                                'subject' => $grade->activeSubject->mapel->name,
                                'type' => $grade->gradeWeight->name,
                                'score' => $grade->score,
                            ];
                        });

                    $stats['low_grades'] = $lowGrades;

                    // 7. [NEW] Tahfidz Summary (Latest Grade)
                    $latestTahfidz = \App\Models\StudentGrade::where('student_id', $student->id)
                        ->whereHas('activeSubject.mapel', function ($q) {
                            $q->where('name', 'like', '%Tahfidz%');
                        })
                        ->where('semester_id', \App\Models\Semester::where('is_active', true)->value('id'))
                        ->latest()
                        ->first();

                    $stats['latest_tahfidz'] = $latestTahfidz ? [
                        'score' => $latestTahfidz->score,
                        'predicate' => $latestTahfidz->score >= 90 ? 'Mumtaz' : ($latestTahfidz->score >= 80 ? 'Jayyid Jiddan' : 'Jayyid'),
                    ] : null;

                    // 8. [NEW] Finance Placeholder
                    $stats['finance_status'] = 'Lunas'; // Placeholder logic
                    $stats['outstanding_bill'] = 0; // Placeholder logic

                    // 9. [NEW] Skrining Hafalan Stats (Student)
                    $mySkriningCount = \App\Models\HafalanSkrining::where('user_id', $user->id)
                        ->whereMonth('created_at', \Carbon\Carbon::now()->month)
                        ->count();
                    $stats['skrining_count_month'] = $mySkriningCount;

                    // 9.0 [NEW] Holiday Mode Detection
                    $activeHoliday = \App\Models\StudentPermission::where('student_id', $student->id)
                        ->whereNotNull('exit_at')
                        ->whereNull('return_at')
                        ->whereHas('permissionGroup', function ($q) {
                            $q->where('name', 'like', '%libur%');
                        })
                        ->with('permissionGroup')
                        ->first();

                    if ($activeHoliday) {
                        $stats['active_holiday'] = [
                            'name' => $activeHoliday->permissionGroup->name,
                            'description' => $activeHoliday->permissionGroup->description,
                            'start_time' => $activeHoliday->permissionGroup->start_time->format('Y-m-d H:i:s'),
                            'end_time' => $activeHoliday->permissionGroup->end_time->format('Y-m-d H:i:s'),
                            'exit_at' => $activeHoliday->exit_at->format('Y-m-d H:i:s'),
                        ];
                    } else {
                        $stats['active_holiday'] = null;
                    }

                    // 9.1 Calculate Unscreened Juz (Attention for Santri)
                    $memorizedJuz = \App\Models\TahfidzMemorization::where('student_id', $student->id)
                        ->where('is_completed', true)
                        ->pluck('juz')
                        ->filter(fn ($juz) => filled($juz))
                        ->map(fn ($juz) => (int) $juz)
                        ->unique()
                        ->sort()
                        ->values();
                    $screenedJuz = \App\Models\HafalanSkriningReport::where('user_id', $user->id)
                        ->pluck('juz_number')
                        ->filter(fn ($juz) => filled($juz))
                        ->map(fn ($juz) => (int) $juz)
                        ->unique()
                        ->values();
                        
                    // Gabungkan juz yang sudah selesai setoran dan juz yang sudah pernah di-skrining
                    $allCompletedJuz = $memorizedJuz->merge($screenedJuz)->unique()->sort()->values();
                    
                    $notScreenedJuz = $allCompletedJuz->diff($screenedJuz)->values();

                    $stats['memorized_juz_count'] = $allCompletedJuz->count();
                    $stats['not_screened_juz_count'] = $notScreenedJuz->count();
                    $stats['not_screened_juz'] = $notScreenedJuz->all();

                    // 10. [NEW] Evaluasi Guru (Angket)
                    // Check if there are open questionnaires for the classes the student is in
                    $openSupervisions = \App\Models\Supervision::where('is_student_questionnaire_open', true)
                        ->whereHas('activeSubject.activeClass.classMembers', function ($q) use ($student) {
                            $q->where('student_id', $student->id);
                        })
                        ->get();

                    // Count how many are unfilled
                    $filledSupervisionIds = \App\Models\StudentQuestionnaireResponse::where('student_id', $student->id)
                        ->whereIn('supervision_id', $openSupervisions->pluck('id'))
                        ->pluck('supervision_id')
                        ->unique();

                    $stats['active_angket_count'] = $openSupervisions->count() - $filledSupervisionIds->count();

                    // 11. [NEW] Health Status
                    // Get latest health record if created within last 3 days
                    $latestHealth = \App\Models\StudentHealthRecord::where('student_id', $student->id)
                        ->where('date', '>=', \Carbon\Carbon::today()->subDays(3))
                        ->latest('date')
                        ->first();

                    if ($latestHealth) {
                        $stats['latest_health_status'] = [
                            'status' => $latestHealth->status,
                            'date' => $latestHealth->date->format('d M Y'),
                            'is_sick' => strtolower($latestHealth->status) === 'sakit',
                            'description' => $latestHealth->therapy ?? $latestHealth->description ?? 'Tidak ada rekam medis detil.'
                        ];
                    } else {
                        $stats['latest_health_status'] = null;
                    }
                }
            }
        }

        if ($dashboardType === 'Oswan') {
            $levelName = strtolower($user->userLevel?->name ?? '');
            $userNis = strtolower($user->nomor_induk ?? '');
            $userEmail = strtolower($user->email ?? '');
            $userName = strtolower($user->name ?? '');

            $oswanSection = 'all';
            if (str_contains($levelName, 'lughoh') || str_contains($levelName, 'bahasa')
                || str_contains($userNis, 'lughoh') || str_contains($userNis, 'bahasa')
                || str_contains($userEmail, 'lughoh') || str_contains($userEmail, 'bahasa')
                || str_contains($userName, 'lughoh') || str_contains($userName, 'bahasa')) {
                $oswanSection = 'bahasa';
            } elseif (str_contains($levelName, 'ibadah') 
                || str_contains($userNis, 'ibadah') 
                || str_contains($userEmail, 'ibadah') 
                || str_contains($userName, 'ibadah')) {
                $oswanSection = 'ibadah';
            } elseif (str_contains($levelName, 'tandzim') || str_contains($levelName, 'ketertiban')
                || str_contains($userNis, 'tandzim') || str_contains($userNis, 'ketertiban')
                || str_contains($userEmail, 'tandzim') || str_contains($userEmail, 'ketertiban')
                || str_contains($userName, 'tandzim') || str_contains($userName, 'ketertiban')) {
                $oswanSection = 'tandzim';
            }

            $currentMonth = (int) date('n');
            $currentYear = (int) date('Y');
            $dayOfMonth = (int) date('j');
            $currentWeek = min(5, max(1, (int) ceil($dayOfMonth / 7)));

            $monthRecords = \App\Models\OswanConductRecord::where('academic_year_id', $academicYearId)
                ->where('year', $currentYear)
                ->where('month', $currentMonth)
                ->get();

            $weekRecords = $monthRecords->where('week_number', $currentWeek);

            if ($oswanSection === 'bahasa') {
                $totalWeek = $weekRecords->sum('bahasa_count');
                $totalMonth = $monthRecords->sum('bahasa_count');
                $studentsViolating = $monthRecords->where('bahasa_count', '>', 0)->pluck('student_id')->unique()->count();
            } elseif ($oswanSection === 'ibadah') {
                $totalWeek = $weekRecords->sum('ibadah_count');
                $totalMonth = $monthRecords->sum('ibadah_count');
                $studentsViolating = $monthRecords->where('ibadah_count', '>', 0)->pluck('student_id')->unique()->count();
            } elseif ($oswanSection === 'tandzim') {
                $totalWeek = $weekRecords->sum('tidur_count');
                $totalMonth = $monthRecords->sum('tidur_count');
                $studentsViolating = $monthRecords->where('tidur_count', '>', 0)->pluck('student_id')->unique()->count();
            } else {
                $totalWeek = $weekRecords->sum(fn($r) => ($r->bahasa_count ?? 0) + ($r->ibadah_count ?? 0) + ($r->tidur_count ?? 0));
                $totalMonth = $monthRecords->sum(fn($r) => ($r->bahasa_count ?? 0) + ($r->ibadah_count ?? 0) + ($r->tidur_count ?? 0));
                $studentsViolating = $monthRecords->filter(fn($r) => (($r->bahasa_count ?? 0) + ($r->ibadah_count ?? 0) + ($r->tidur_count ?? 0)) > 0)->pluck('student_id')->unique()->count();
            }

            $stats = [
                'role' => 'oswan',
                'oswan_section' => $oswanSection,
                'total_violations_week' => (int) $totalWeek,
                'total_violations_month' => (int) $totalMonth,
                'total_students_violating' => (int) $studentsViolating,
                'current_week' => $currentWeek,
                'current_month' => $currentMonth,
                'current_year' => $currentYear,
            ];
        }

        if ($canViewStats) {
            if ($dashboardType === 'Admin') {
                // Admin / Staff Stats (Existing)
                // ... (Admin logic existing) ...
                $skriningToday = \App\Models\HafalanSkrining::whereDate('created_at', \Carbon\Carbon::today())->count();

                $stats = [
                    'total_students' => Student::whereHas('user', function ($q) {
                        $q->where('status', 'Aktif');
                    })->count(),
                    'total_teachers' => User::whereHas('userLevel', function ($q) {
                        $q->whereIn('name', ['Guru', 'Wali Kelas', 'Kepala Sekolah']);
                    })->where('status', 'Aktif')->count(),
                    'active_classes' => ActiveClass::where('academic_year_id', $academicYearId)->count(),
                    'role' => 'admin', // Marker
                    'skrining_today' => $skriningToday, // Widget
                ];
            }
        } else {
            // Pass role to avoid frontend crash, but empty data
            $stats['role'] = ($dashboardType === 'Teacher') ? 'teacher' : 'admin';
        }

        if ($dashboardType === 'Teacher' && $canViewCalendar) {
            \Carbon\Carbon::setLocale('id');
            $dayName = \Carbon\Carbon::now()->translatedFormat('l');
            $day = \App\Models\Day::where('name', $dayName)->first();

            if ($day) {
                // Eager load relationships for the schedule card
                $schedule = \App\Models\Schedule::where('teacher_id', $user->id)
                    ->where('academic_year_id', $academicYearId)
                    ->where('day_id', $day->id)
                    ->with([
                        'learningHour',
                        'activeClass.kelas', // Fallback if grade not used
                        'activeSubject.mapel'
                    ])
                    ->join('learning_hours', 'schedules.learning_hour_id', '=', 'learning_hours.id')
                    ->select('schedules.*')
                    ->orderBy('learning_hours.start_time')
                    ->get();
            }
        }

        // --- Widget Configuration & Logic ---

        // Check Tahfidz Exam Period
        $tahfidzStart = \App\Models\Setting::where('key', 'tahfidz_exam_start_date')->value('value');
        $tahfidzEnd = \App\Models\Setting::where('key', 'tahfidz_exam_end_date')->value('value');
        $isTahfidzExamPeriod = false;

        if ($tahfidzStart && $tahfidzEnd) {
            $now = \Carbon\Carbon::now();
            $isTahfidzExamPeriod = $now->between($tahfidzStart, $tahfidzEnd);
        }

        // OR if the user is a Manager Tahfidz, they might always want to see it? 
        // Request says: "muncul ketika jadwal ujian tahfidz diaktifkan oleh manager tahfidz"
        // So we stick to the date check.

        $defaultWidgets = [];
        if ($dashboardType === 'Student') {
            $defaultWidgets = ['welcome_card' => true, 'class_info' => true, 'schedule_today' => true];
        } elseif ($dashboardType === 'Teacher') {
            $defaultWidgets = [
                'welcome_card' => true,
                'stats_cards' => true,
                'quick_actions' => true,
                'schedule_today' => true,
                'shortcut_journals' => true,
                'shortcut_grades' => true,
                'shortcut_profile' => true,
                'shortcut_calendar' => true,
                'shortcut_pickets' => true,
                'shortcut_silabus' => true,
                // Only enable Tahfidz shortcut if in exam period
                'shortcut_tahfidz' => $isTahfidzExamPeriod
            ];
        } else {
            $defaultWidgets = [
                'welcome_card' => true,
                'stats_cards' => true,
                'activity_feed' => true,
                'quick_actions' => true,
                'shortcut_profile' => true,
                'shortcut_calendar' => true
            ];
        }

        // Merge & Resolve widgets across ALL user levels (Level Utama + Level Tambahan)
        $featuresRegistry = \App\Http\Controllers\AccessControlController::getFeaturesRegistry();
        $allUserLevels = collect([$user->userLevel])->merge($user->additionalLevels)->filter()->unique('id');

        $mergedWidgets = [];

        foreach ($featuresRegistry as $feat) {
            $featKey = $feat['key'];
            $featAlias = $feat['alias'] ?? null;
            $featPerm = $feat['required_permission'] ?? null;
            $isExplicitlyAllowed = false;
            $isRoleDefault = false;

            foreach ($allUserLevels as $lvl) {
                $lvlWidgets = (is_array($lvl->widgets)) ? $lvl->widgets : [];

                if (isset($lvlWidgets[$featKey])) {
                    if ((bool) $lvlWidgets[$featKey]) {
                        $isExplicitlyAllowed = true;
                    }
                } elseif ($featAlias && isset($lvlWidgets[$featAlias])) {
                    if ((bool) $lvlWidgets[$featAlias]) {
                        $isExplicitlyAllowed = true;
                    }
                } else {
                    // Cek default untuk role ini
                    if (is_array($feat['default_for'] ?? null) && in_array($lvl->name, $feat['default_for'])) {
                        $isRoleDefault = true;
                    }
                }
            }

            // Jika ada salah satu role yang mengecek ya atau default role menyertakan
            $finalAllowed = $isExplicitlyAllowed || $isRoleDefault;

            // Permission fallback: jika user memiliki hak akses (permission) fitur ini, aktifkan!
            if (!$finalAllowed && $featPerm && $user->hasPermission($featPerm)) {
                $finalAllowed = true;
            }

            $mergedWidgets[$featKey] = $finalAllowed;
            if ($featAlias) {
                $mergedWidgets[$featAlias] = $finalAllowed;
            }
        }

        // Always enable essential shell widgets
        $mergedWidgets['welcome_card'] = true;
        $mergedWidgets['quick_actions'] = true;
        $mergedWidgets['shortcut_profile'] = true;
        $mergedWidgets['shortcut_calendar'] = true;
        $mergedWidgets['shortcut_install_app'] = true;

        $userWidgets = $mergedWidgets;

        // [Feature] Manager Tahfidz Active Injection
        // HANYA jika user memiliki role 'Manager Tahfidz' atau 'Administrator'
        $isManagerTahfidz = ($user->userLevel?->name === 'Manager Tahfidz') 
            || $user->additionalLevels->contains('name', 'Manager Tahfidz')
            || (method_exists($user, 'hasRole') && $user->hasRole(['Manager Tahfidz', 'Administrator']));

        if ($isManagerTahfidz) {
            $userWidgets['shortcut_tahfidz'] = true;
            $userWidgets['shortcut_tahfidz_grades'] = true;
            $userWidgets['shortcut_tahfidz_recap'] = true;
            $userWidgets['shortcut_tahfidz_testers'] = true;
            $userWidgets['shortcut_tahfidz_monitoring'] = true;
            $userWidgets['shortcut_skrining'] = true;
            $userWidgets['shortcut_ikhtabir'] = true;
            $userWidgets['shortcut_quran'] = true;
        } else {
            // Pastikan user non-Manager Tahfidz & non-Admin TIDAK mendapatkan shortcut plotting penguji
            $userWidgets['shortcut_tahfidz_testers'] = false;
        }

        // [Feature] Teacher & Academic Shortcuts Active Injection
        // If user is a teacher or has teaching load, make sure their academic shortcuts are fully recognized
        if ($hasActiveSubjects || $isTeacherRole) {
            if ($user->hasPermission('view_journals') || $hasActiveSubjects) {
                $userWidgets['shortcut_journals'] = true;
            }
            if ($user->hasPermission('view_assessments') || $hasActiveSubjects) {
                $userWidgets['shortcut_grades'] = true;
            }
            if ($user->hasPermission('view_silabus') || $hasActiveSubjects) {
                $userWidgets['shortcut_silabus'] = true;
            }
            if ($user->hasPermission('view_academic_schedules') || $hasActiveSubjects) {
                $userWidgets['shortcut_schedule'] = true;
            }
            if ($user->hasPermission('view_grade_recap')) {
                $userWidgets['shortcut_recap'] = true;
            }
            if ($dashboardType === 'Teacher') {
                $userWidgets['shortcut_tahfidz'] = $isTahfidzExamPeriod || $isManagerTahfidz;
                if (!$isManagerTahfidz) {
                    $userWidgets['shortcut_tahfidz_testers'] = false;
                }
            }
        }

        // [Feature] Homeroom (Wali Kelas) Shortcuts Active Injection
        if ($isHomeroomRole || $user->isCurrentHomeroomTeacher()) {
            $userWidgets['shortcut_reports'] = true;
            $userWidgets['shortcut_recap'] = true;
            if ($user->hasPermission('view_students')) {
                $userWidgets['shortcut_students'] = true;
            }
        }

        // [Feature] Care & Health Shortcuts
        if ($user->hasPermission('view_students')) {
            $userWidgets['shortcut_students'] = true;
        }
        if ($user->hasPermission('view_permissions')) {
            $userWidgets['shortcut_permissions'] = true;
        }
        if ($user->hasPermission('create_permissions')) {
            $userWidgets['shortcut_permission_personal'] = true;
        }
        if ($user->hasPermission('view_health_records')) {
            $userWidgets['shortcut_health'] = true;
        }

        // [Feature] "Bagian Kesehatan" Widget Injection
        $isHealthStaff = ($user->userLevel?->name === 'Bagian Kesehatan') || $user->additionalLevels->contains('name', 'Bagian Kesehatan');

        if (($dashboardType === 'Admin') && $isHealthStaff) {
            // Fetch Health Stats
            $stats['health_sick_today'] = \App\Models\StudentHealthRecord::whereDate('date', \Carbon\Carbon::today())->where('status', 'Sakit')->count();

            // Most common complaint (last 30 days)
            $stats['health_most_common'] = \Illuminate\Support\Facades\DB::table('health_record_complaint')
                ->join('health_complaints', 'health_record_complaint.health_complaint_id', '=', 'health_complaints.id')
                ->select('health_complaints.name', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
                ->whereDate('health_record_complaint.created_at', '>=', \Carbon\Carbon::now()->subDays(30))
                ->groupBy('health_complaints.name')
                ->orderByDesc('total')
                ->limit(1)
                ->value('name') ?? '-';

            // Ensure health shortcuts are enabled for Bagian Kesehatan unless explicitly disabled as false
            if (!isset($userWidgets['shortcut_health']) || $userWidgets['shortcut_health'] === true) {
                $userWidgets['shortcut_health'] = true;
            }
            if (!isset($userWidgets['health_stats_widget'])) {
                $userWidgets['health_stats_widget'] = true;
            }
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'schedule' => $schedule,
            'dashboard_type' => $dashboardType,
            'allowed_widgets' => $userWidgets,
            'available_dashboards' => array_values($availableDashboards), // Pass as array
            'is_tahfidz_active' => $isTahfidzExamPeriod,
        ]);
    }
}
