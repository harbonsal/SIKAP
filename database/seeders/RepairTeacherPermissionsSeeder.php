<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RepairTeacherPermissionsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Repairing Teacher Permissions...');

        // 1. Get Teacher Level
        $teacherLevel = UserLevel::where('name', 'Guru')->first();
        if (!$teacherLevel) {
            $this->command->error('Role "Guru" not found.');
            return;
        }

        // 2. Define Essential Permissions for Teachers
        // Based on User.php defaults + Dashboard requirements
        $essentialPermissions = [
            // Menu
            'menu_dashboard',
            'menu_academic',
            // Dashboard Widgets
            'view_dashboard_stats',
            'view_dashboard_calendar', // Crucial for Schedule Widget
            // Features
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
            // Additional Safe Views
            'view_class_members', // For read-only member list patch
            'view_active_subjects',
        ];

        // 3. Ensure permissions exist in DB
        foreach ($essentialPermissions as $permName) {
            Permission::firstOrCreate(['name' => $permName]);
        }

        // 4. Sycn Permissions (Using sync without detaching generally, but here we want to Restore Defaults + Keep others? 
        // No, user said "bubrah", so let's Force Sync essentials + keep existing valid ones?
        // Or just re-add essentials.

        $permissionIds = Permission::whereIn('name', $essentialPermissions)->pluck('id');
        $teacherLevel->permissions()->syncWithoutDetaching($permissionIds);

        $this->command->info('Teacher permissions have been repaired/added.');
        $this->command->info('Total: ' . count($essentialPermissions) . ' permissions synced.');
    }
}
