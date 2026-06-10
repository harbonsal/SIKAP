<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\Permission;

class PermissionSyncSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $levels = UserLevel::all();

        $hardcoded = [
            'Administrator' => ['*'],
            'Kepala Sekolah' => [
                'menu_dashboard',
                'menu_academic',
                'menu_care',
                'menu_finance',
                'menu_settings',
                'menu_tahfidz',
                'menu_analysis',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'view_dashboard_announcements',
                'view_users',
                'view_students',
                'view_active_classes',
                'view_active_subjects',
                'view_schedules',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'view_all_assessments',
                'view_grade_recap',
                'view_class_recap',
                'view_student_recap',
                'view_reports',
                'view_all_reports',
                'view_journals',
                'view_attendance_recap',
                'view_supervision_rpps',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_learning_analysis',
                'view_grade_analysis',
                'view_pickets',
            ],
            'Wali Kelas' => [
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
                'input_manual_attendance',
                'view_supervision_rpps',
                'view_pickets',
                'view_learning_analysis',
                'view_grade_analysis',
                'view_class_members',
            ],
            'Guru' => [
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
            ],
            'Musrif' => [
                'menu_dashboard',
                'menu_tahfidz',
                'view_dashboard_stats',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_students'
            ],
            'Bagian Kesehatan' => [
                'menu_dashboard',
                'menu_care',
                'view_students',
                'view_health_complaints',
            ],
            'Santri' => [
                'view_own_biodata',
                'view_own_grades',
                'view_own_finance',
                'view_own_schedule'
            ]
        ];

        // Ensure "Musyrif" (y) is treated as Musrif
        $hardcoded['Musyrif'] = $hardcoded['Musrif'];

        foreach ($levels as $level) {
            $roleName = $level->name;
            if (!isset($hardcoded[$roleName])) {
                $this->command->info("Skipping Role: $roleName (No hardcoded defaults found)");
                continue;
            }

            $perms = $hardcoded[$roleName];
            $ids = [];

            foreach ($perms as $pName) {
                if ($pName === '*') {
                    continue;
                }

                $permModel = Permission::firstOrCreate(['name' => $pName], ['description' => 'Auto generated']);
                $ids[] = $permModel->id;
            }

            $level->permissions()->sync($ids);
            $this->command->info("Synced Role: $roleName (" . count($ids) . " permissions)");
        }
    }
}
