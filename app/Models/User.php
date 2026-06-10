<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'no_hp',
        'password',
        'nomor_induk',
        'nama_arab',
        'user_level_id',
        'status',
        'inactive_date',
        'inactive_reason',
        'inactive_note',
        'rfid',
        'signature',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['permissions'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function userLevel()
    {
        return $this->belongsTo(UserLevel::class);
    }

    public function activeSubjects()
    {
        return $this->hasMany(ActiveSubject::class, 'teacher_id');
    }

    public function teacherQuota()
    {
        return $this->hasOne(TeacherQuota::class);
    }

    public function additionalLevels()
    {
        return $this->belongsToMany(UserLevel::class, 'user_additional_levels');
    }

    public function isCurrentHomeroomTeacher(): bool
    {
        $currentAcademicYear = \App\Services\AcademicStateService::currentAcademicYear();
        $currentSemester = \App\Services\AcademicStateService::currentSemester();

        if (!$currentAcademicYear) {
            return false;
        }

        return ActiveClass::where('academic_year_id', $currentAcademicYear->id)
            ->where(function ($q) use ($currentSemester) {
                $q->where('teacher_id', $this->id);

                if ($currentSemester) {
                    $q->orWhereHas('semesterHomeroomTeachers', function ($subQ) use ($currentSemester) {
                        $subQ
                            ->where('semester_id', $currentSemester->id)
                            ->where('teacher_id', $this->id);
                    });
                }
            })
            ->exists();
    }

    public function hasPermission($permissionName)
    {
        if ($this->userLevel && $this->userLevel->name === 'Administrator') {
            return true;
        }

        $permissions = $this->getAllPermissions();

        if ($permissions->contains('*')) {
            return true;
        }

        return $permissions->contains($permissionName);
    }

    public function hasRole($roles)
    {
        if (is_array($roles)) {
            foreach ($roles as $role) {
                if ($this->hasRole($role)) {
                    return true;
                }
            }
            return false;
        }

        return in_array($roles, $this->getRoleNames(), true);
    }

    public function unavailableHours()
    {
        return $this->hasMany(TeacherUnavailableHour::class);
    }

    /**
     * Get all permissions (DB Driven).
     */
    public function getAllPermissions()
    {
        // 1. Try DB Permissions (Main Source)
        $permissions = $this->userLevel ? $this->userLevel->permissions->pluck('name')->toArray() : [];

        foreach ($this->additionalLevels as $level) {
            $permissions = array_merge($permissions, $level->permissions->pluck('name')->toArray());
        }

        // 2. Hardcoded Fallback for Administrator
        if ($this->userLevel && $this->userLevel->name === 'Administrator') {
            return collect(['*']);
        }

        if ($this->isCurrentHomeroomTeacher()) {
            $permissions = array_merge($permissions, $this->getImplicitHomeroomPermissions());
        }

        return collect(array_unique($permissions));
    }

    public function getPermissionsAttribute()
    {
        return $this->getAllPermissions()->values()->toArray();
    }

    public function getRoleNames(): array
    {
        $roles = [];

        if ($this->userLevel?->name) {
            $roles[] = $this->userLevel->name;
        }

        foreach ($this->additionalLevels as $level) {
            if ($level->name) {
                $roles[] = $level->name;
            }
        }

        if ($this->isCurrentHomeroomTeacher()) {
            $roles[] = 'Wali Kelas';
        }

        return array_values(array_unique($roles));
    }

    private function getImplicitHomeroomPermissions(): array
    {
        return [
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
        ];
    }

    /**
     * Define Hardcoded Permissions temporarily.
     */
    private function getHardcodedPermissionsForLevel($levelName)
    {
        switch ($levelName) {
            case 'Administrator':
                return ['*'];
                // Manager Removed - will use DB permissions


            case 'Wali Kelas':
                return [
                    'menu_dashboard',
                    'menu_academic',
                    'menu_analysis',
                    'view_dashboard_stats',
                    'view_dashboard_calendar',
                    'view_students',
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
                    'view_supervision_rpps',
                    'view_pickets',
                    'view_learning_analysis',
                    'view_grade_analysis',
                    // Sidebar check usually expects 'view_students' for student list
                    'view_class_members',
                    'view_active_classes',
                ];

            case 'Guru':
                return [
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
                    'view_supervision_rpps',
                    'view_pickets',
                    'view_students',
                    'view_active_classes', // Needed for Dashboard card
                ];

            case 'Musrif':
                return [
                    'menu_dashboard',
                    'menu_tahfidz',
                    'view_dashboard_stats',
                    'view_tahfidz_testers',
                    'view_tahfidz_halaqoh',
                    'view_students'
                ];

            case 'Bagian Kesehatan':
                return [
                    'menu_dashboard',
                    'menu_care',
                    'view_students',
                    'view_health_complaints',
                    // Add any other specific health permissions if they exist
                ];

            case 'Santri':
                return [
                    'view_own_biodata',
                    'view_own_grades',
                    'view_own_finance',
                    'view_own_schedule'
                ];

            default:
                return [];
        }
    }
}
