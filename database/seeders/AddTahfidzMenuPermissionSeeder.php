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

        // 2. Assign 'menu_tahfidz' to Manager & Admin (Bukan Guru biasa)
        $roles_to_assign = ['Administrator', 'Manager Tahfidz', 'Kepala Sekolah'];
        foreach ($roles_to_assign as $roleName) {
            $role = UserLevel::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching([$permission->id]);
            }
        }

        // 3. Pastikan 'view_tahfidz_testers' HANYA untuk Administrator dan Manager Tahfidz
        $adminRoles = UserLevel::whereIn('name', ['Administrator', 'Manager Tahfidz'])->get();
        foreach ($adminRoles as $ar) {
            $ar->permissions()->syncWithoutDetaching([$permissionTesters->id]);
        }

        // 4. Cabut permission manajerial dari role Guru
        $guruRole = UserLevel::where('name', 'Guru')->first();
        if ($guruRole) {
            $guruRole->permissions()->detach([$permissionTesters->id]);
        }
    }
}
