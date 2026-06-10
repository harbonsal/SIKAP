<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, \Closure $next)
    {
        $user = $request->user();

        // Check if the current request is trying to perform a mutating action for non-admins on archived/draft years
        if ($user && !$user->hasRole('Administrator')) {
            if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                $routeName = $request->route() ? $request->route()->getName() : null;
                $safeRouteNames = [
                    'academic.switch-state',
                    'logout',
                    'smart-search.query',
                    'profile.update',
                    'profile.destroy',
                ];

                if (!($routeName && in_array($routeName, $safeRouteNames))) {
                    $path = $request->path();
                    if (!(
                        str_contains($path, 'logout') || 
                        str_contains($path, 'academic/switch-state') || 
                        str_contains($path, 'smart-search')
                    )) {
                        $currentYear = \App\Services\AcademicStateService::currentAcademicYear();
                        if ($currentYear && in_array($currentYear->status, ['archived', 'draft'])) {
                            $statusLabel = $currentYear->status === 'archived' ? 'telah diarsip' : 'masih berupa draft';
                            if ($request->header('X-Inertia') || $request->ajax()) {
                                return back()->with('error', "Anda tidak memiliki izin untuk mengedit data pada Tahun Pelajaran yang {$statusLabel}.");
                            }
                            abort(403, "Anda tidak memiliki izin untuk mengedit data pada Tahun Pelajaran yang {$statusLabel}.");
                        }
                    }
                }
            }
        }

        return parent::handle($request, $next);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
                'auth' => [
                    'user' => fn() => $request->user() ? (function ($user) {
                    $systemAcademicYear = \App\Services\AcademicStateService::activeAcademicYear();
                    $systemSemester = \App\Services\AcademicStateService::activeSemester();
                    $academicYearId = $systemAcademicYear?->id;

                    $hasTeachingLoad = $academicYearId
                        ? $user->activeSubjects()->whereHas('activeClass', function ($q) use ($academicYearId) {
                            $q->where('academic_year_id', $academicYearId);
                        })->exists()
                        : false;

                    $isCurrentHomeroomTeacher = $academicYearId
                        ? \App\Models\ActiveClass::where('academic_year_id', $academicYearId)
                            ->where(function ($q) use ($user, $systemSemester) {
                                $q->where('teacher_id', $user->id);

                                if ($systemSemester) {
                                    $q->orWhereHas('semesterHomeroomTeachers', function ($subQ) use ($user, $systemSemester) {
                                        $subQ
                                            ->where('semester_id', $systemSemester->id)
                                            ->where('teacher_id', $user->id);
                                    });
                                }
                            })
                            ->exists()
                        : false;

                    $permissions = $user->getAllPermissions()->values()->toArray();

                    // [Fix] Dynamic Permission Injection for Implicit Teachers
                    if ($hasTeachingLoad) {
                        $teacherPermissions = [
                            'menu_dashboard',
                            'menu_academic',
                            'view_dashboard_stats',
                            'view_academic_schedules',
                            'view_silabus',
                            'view_assessments',
                            'create_assessments',
                            'edit_assessments',
                            'view_journals',
                            'create_journals',
                            'view_students'
                        ];
                        // Merge and ensure unique values
                        $permissions = array_values(array_unique(array_merge($permissions, $teacherPermissions)));
                    }

                    $roles = array_merge(
                        [$user->userLevel?->name ?? 'User'],
                        $user->additionalLevels->pluck('name')->toArray()
                    );

                    if ($isCurrentHomeroomTeacher) {
                        $permissions = array_values(array_unique(array_merge($permissions, [
                            'menu_dashboard',
                            'menu_academic',
                            'menu_analysis',
                            'view_dashboard_stats',
                            'view_dashboard_calendar',
                            'view_students',
                            'view_active_classes',
                            'view_class_members',
                            'view_academic_schedules',
                            'view_silabus',
                            'view_assessments',
                            'create_assessments',
                            'edit_assessments',
                            'view_grade_recap',
                            'view_class_recap',
                            'view_student_recap',
                            'view_reports',
                            'create_report_notes',
                            'view_journals',
                            'create_journals',
                            'edit_journals',
                            'input_manual_attendance',
                            'view_supervision_rpps',
                            'view_pickets',
                            'view_learning_analysis',
                            'view_grade_analysis',
                        ])));

                        if (!in_array('Wali Kelas', $roles, true)) {
                            $roles[] = 'Wali Kelas';
                        }
                    }

                    return array_merge(
                        $user->load(['userLevel', 'additionalLevels'])->toArray(),
                        [
                            'permissions' => $permissions,
                            'roles' => array_values(array_unique($roles)),
                            'has_teaching_load' => $hasTeachingLoad,
                        ]
                    );
                })($request->user()) : null,
            ],
            'ziggy' => fn() => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'app_settings' => fn() => [
                'app_name' => 'SIKAP ' . (\App\Models\SchoolInfo::first()?->name ?? 'Alwan'),
                'app_logo' => \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png',
                'login_background' => \App\Models\Setting::where('key', 'login_background')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'login_background')->value('value')) : '/masjid_login.webp',
            ],
            'quran_settings' => fn() => [
                'skrining_enabled' => Setting::where('key', 'quran_skrining_enabled')->value('value') !== '0',
            ],
            'academic_state' => fn() => [
                'active_year' => \App\Services\AcademicStateService::currentAcademicYear(),
                'active_semester' => \App\Services\AcademicStateService::currentSemester(),
                'system_year' => \App\Services\AcademicStateService::activeAcademicYear(),
                'system_semester' => \App\Services\AcademicStateService::activeSemester(),
                'is_historical' => \App\Services\AcademicStateService::isHistoricalView(),
                'can_switch_year' => $request->user() !== null,
                'years' => call_user_func(function() use ($request) {
                    $hasStatus = \Illuminate\Support\Facades\Schema::hasColumn('academic_years', 'status');
                    $user = $request->user();
                    
                    if ($user && ($user->hasRole('Administrator') || $this->canSwitchAcademicContext($request))) {
                        return \App\Models\AcademicYear::orderBy('name', 'desc')->get(['id', 'name', 'is_active']);
                    }
                    
                    if ($hasStatus) {
                        return \App\Models\AcademicYear::whereIn('status', ['active', 'archived'])
                            ->orWhere('is_active', true)
                            ->orderBy('name', 'desc')
                            ->get(['id', 'name', 'is_active']);
                    }
                    
                    return \App\Models\AcademicYear::where('is_active', true)
                        ->orderBy('name', 'desc')
                        ->get(['id', 'name', 'is_active']);
                }),
                'semesters' => \App\Models\Semester::get(['id', 'name', 'is_active']),
            ]
        ];
    }

    private function canSwitchAcademicContext(Request $request): bool
    {
        $user = $request->user();

        if (!$user) {
            return false;
        }

        return $user->can('edit_active_classes')
            || $user->can('create_active_classes')
            || $user->can('edit_active_subjects')
            || $user->can('create_active_subjects')
            || $user->can('edit_access_control')
            || $user->userLevel?->name === 'Administrator';
    }
}
