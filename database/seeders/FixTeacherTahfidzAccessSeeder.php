<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\UserLevel;

class FixTeacherTahfidzAccessSeeder extends Seeder
{
    /**
     * Cabut izin plotting dan manajemen tahfidz dari role Guru
     */
    public function run(): void
    {
        $teacherRole = UserLevel::where('name', 'Guru')->first();
        if ($teacherRole) {
            // Izin-izin manajerial tahfidz yang TIDAK boleh dimiliki Guru biasa
            $sensitivePermissions = [
                'manage_tahfidz_testers',
                'view_tahfidz_testers',
                'view_all_tahfidz_grades',
                'manage_tahfidz_halaqoh',
                'manage_tahfidz_settings',
            ];

            $permIds = Permission::whereIn('name', $sensitivePermissions)->pluck('id')->toArray();
            if (!empty($permIds)) {
                $teacherRole->permissions()->detach($permIds);
            }

            // Bersihkan widgets Guru dari shortcut_tahfidz_testers jika pernah tersimpan
            $widgets = is_array($teacherRole->widgets) ? $teacherRole->widgets : [];
            if (isset($widgets['shortcut_tahfidz_testers'])) {
                $widgets['shortcut_tahfidz_testers'] = false;
                $teacherRole->update(['widgets' => $widgets]);
            }
        }

        // Pastikan Administrator dan Manager Tahfidz tetap memiliki izin penuh
        $managerRole = UserLevel::firstOrCreate(['name' => 'Manager Tahfidz'], [
            'category' => 'Guru',
            'dashboard_type' => 'Admin',
            'description' => 'Penanggung Jawab dan Pengelola Program Tahfidz'
        ]);

        $allTahfidzPerms = Permission::where('name', 'like', '%tahfidz%')->pluck('id')->toArray();
        if (!empty($allTahfidzPerms)) {
            $managerRole->permissions()->syncWithoutDetaching($allTahfidzPerms);
        }
    }
}

