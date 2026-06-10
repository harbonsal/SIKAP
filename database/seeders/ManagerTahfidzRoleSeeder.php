<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class ManagerTahfidzRoleSeeder extends Seeder
{
    public function run()
    {
        DB::transaction(function () {
            // 1. Create Role
            $role = UserLevel::firstOrCreate(
                ['name' => 'Manager Tahfidz'],
                [
                    'category' => 'Ustadz', // Asumsikan kategori Ustadz/Guru
                    'dashboard_type' => 'Admin', // Default dashboard view
                ]
            );

            // 2. Define Permissions
            $permissions = [
                'menu_tahfidz',
                'view_all_assessments', // To view all students grades
                'view_all_tahfidz_grades',
                'view_tahfidz_recap',
                'view_tahfidz_testers',
                'manage_tahfidz_testers',
                'view_students', // Needed to see student lists
            ];

            // 3. Create & Attach Permissions
            foreach ($permissions as $permName) {
                // Ensure permission exists (basic check, usually handled by PermissionSeeder)
                $perm = Permission::firstOrCreate(['name' => $permName]);

                // Attach if not already attached
                if (!$role->permissions->contains($perm->id)) {
                    $role->permissions()->attach($perm->id);
                }
            }

            $this->command->info('Role "Manager Tahfidz" updated/created successfully.');
        });
    }
}
