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
                if (in_array($level->name, ['Guru', 'Wali Kelas', 'Kepala Sekolah'])) {
                    $type = 'Teacher';
                } elseif (in_array($level->name, ['Siswa', 'Siswa Khusus', 'Siswa Dengan Catatan'])) {
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
                    'label' => $type === 'Teacher' ? 'Guru' : ($type === 'Student' ? 'Santri' : 'Admin'),
                    'type' => $type
                ];
            }
        }

        // [Feature] Prioritize Teacher Dashboard for Managers with Teaching Load
        $hasActiveSubjects = \App\Models\ActiveSubject::where('teacher_id', $user->id)
            ->whereHas('activeClass', function ($q) use ($academicYearId) {
                $q->where('academic_year_id', $academicYearId);
            })
            ->exists();

        // 1. Determine Default Dashboard Type
        // If user has teaching load, PREFER 'Teacher' dashboard, even if they are Manager
        $defaultType = $user->userLevel?->dashboard_type ?? 'Default';

        if ($defaultType === 'Default') {
            if ($user->userLevel && in_array($user->userLevel->name, ['Siswa', 'Siswa Khusus', 'Siswa Dengan Catatan'])) {
                $defaultType = 'Student';
            } elseif ($hasActiveSubjects) {
                // FORCE Teacher Dashboard if they have active subjects
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
                // ... (Teacher logic existing) ...
                // Teacher-specific Stats
                $myActiveSubjects = \App\Models\ActiveSubject::where('teacher_id', $user->id)
                    ->whereHas('activeClass', function ($q) use ($academicYearId) {
                        $q->where('academic_year_id', $academicYearId);
                    })
                    ->get();

                $myClassIds = $myActiveSubjects->pluck('active_class_id')->unique();

                // Count students in classes I teach
                $myStudentCount = \App\Models\ClassMember::whereIn('active_class_id', $myClassIds)
                    ->distinct('student_id')
                    ->count();

                // Get Classes details
                $myClasses = \App\Models\ActiveClass::whereIn('id', $myClassIds)
                    ->with(['kelas', 'kelasParalel'])
                    ->get()
                    ->sortBy(function ($ac) {
                        return $ac->kelas->name;
                    });

                // Get Unique Subjects
                $mySubjects = $myActiveSubjects->unique('mapel_id')->map(function ($as) {
                    return $as->mapel->name;
                })->values();

                $skriningToday = \App\Models\HafalanSkrining::whereDate('created_at', \Carbon\Carbon::today())->count();

                // Override global stats with personal stats
                $stats = [
                    'my_students' => $myStudentCount,
                    'my_classes' => $myClassIds->count(),
                    'my_subjects' => $mySubjects->count(), // Count unique subjects
                    'my_class_list' => $myClasses->map(fn($c) => $c->kelas->name . ' ' . ($c->kelasParalel->name ?? ''))->values(),
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
                    $notScreenedJuz = $memorizedJuz->diff($screenedJuz)->values();

                    $stats['memorized_juz_count'] = $memorizedJuz->count();
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

        $userWidgets = $user->userLevel?->widgets ?? $defaultWidgets;

        // [Feature] Manager Tahfidz Widget Injection
        // If user has 'Manager Tahfidz' role (either primary or additional), inject specific shortcuts
        $isManagerTahfidz = ($user->userLevel?->name === 'Manager Tahfidz') || $user->additionalLevels->contains('name', 'Manager Tahfidz');

        if (($dashboardType === 'Admin' || $dashboardType === 'Teacher') && $isManagerTahfidz) {
            $userWidgets = array_merge($userWidgets, [
                'shortcut_tahfidz_grades' => true,
                'shortcut_tahfidz_recap' => true,
                'shortcut_tahfidz_testers' => true,
            ]);
        }

        // [Feature] Generic Academic Shortcuts based on Permission
        // Allows any role (e.g. Manager Tahfidz) to access academic tools if they have permission
        if ($dashboardType !== 'Teacher') {
            if ($user->hasPermission('view_journals')) {
                $userWidgets['shortcut_journals'] = true;
            }
            if ($user->hasPermission('view_assessments')) {
                $userWidgets['shortcut_grades'] = true;
            }
            if ($user->hasPermission('view_silabus')) {
                $userWidgets['shortcut_silabus'] = true;
            }
        } else {
            // Force enable these for teachers if they are somehow missing from default widgets but valid for role
            $userWidgets['shortcut_tahfidz'] = $isTahfidzExamPeriod;
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

            $userWidgets = array_merge($userWidgets, [
                'health_stats_widget' => true,
                'shortcut_health_search' => true,
                'shortcut_health_biodata' => true,
            ]);
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
