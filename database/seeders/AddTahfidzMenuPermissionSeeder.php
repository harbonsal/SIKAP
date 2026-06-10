<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\UserLevel;

class AddTahfidzMenuPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Permission
        $permission = Permission::firstOrCreate(['name' => 'menu_tahfidz']);
        $permissionTesters = Permission::firstOrCreate(['name' => 'view_tahfidz_testers']);

        // 2. Assign 'menu_tahfidz' to Roles
        $roles_to_assign = ['Administrator', 'Guru', 'Kepala Sekolah'];
        foreach ($roles_to_assign as $roleName) {
            $role = UserLevel::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching([$permission->id]);
            }
        }

        // 3. Assign 'view_tahfidz_testers' ONLY to Administrator
        $adminRole = UserLevel::where('name', 'Administrator')->first();
        if ($adminRole) {
            $adminRole->permissions()->syncWithoutDetaching([$permissionTesters->id]);
        }
    }
}
