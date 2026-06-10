<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\UserLevel;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Santri Permissions
        $santriRole = UserLevel::where('name', 'Santri')->first();
        if ($santriRole) {
            $santriPermissions = [
                'view_own_biodata',
                'view_own_grades',
                'view_own_finance',
                'view_own_schedule',
            ];
            $this->syncPermissions($santriRole, $santriPermissions);
        }

        // 2. Guru Permissions
        $guruRole = UserLevel::where('name', 'Guru')->first();
        if ($guruRole) {
            $guruPermissions = [
                'view_active_subjects',
                'view_students',
                'view_own_schedule',
                'view_class_members', // Permitted
            ];
            $this->syncPermissions($guruRole, $guruPermissions);
        }

        // 3. Wali Kelas Permissions
        $waliRole = UserLevel::where('name', 'Wali Kelas')->first();
        if ($waliRole) {
            $waliPermissions = [
                'view_class_members',
                'view_students',
                'view_active_subjects',
            ];
            $this->syncPermissions($waliRole, $waliPermissions);
        }

        // 4. Kepala Sekolah & Musrif
        $ksRole = UserLevel::where('name', 'Kepala Sekolah')->first();
        if ($ksRole) {
            $this->syncPermissions($ksRole, ['view_class_members', 'view_students', 'view_active_subjects']);
        }
        $musrifRole = UserLevel::where('name', 'Musrif Asrama')->first();
        if ($musrifRole) {
            $this->syncPermissions($musrifRole, ['view_class_members', 'view_students']);
        }

        // 4. Administrator (Usually has all, but handled via code/gate usually. 
        // If we want to be explicit, we can assign all here, but Admin check is often hardcoded to true)
    }

    private function syncPermissions(UserLevel $role, array $permissionNames)
    {
        $permissionIds = Permission::whereIn('name', $permissionNames)->pluck('id');
        $role->permissions()->syncWithoutDetaching($permissionIds);
    }
}
