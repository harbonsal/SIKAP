<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Support\Facades\Hash;

class OswanRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Pastikan Role / UserLevel OSWAN tersedia
        $oswanRole = UserLevel::firstOrCreate(
            ['name' => 'OSWAN'],
            [
                'category' => 'Santri',
                'dashboard_type' => 'minimal',
                'widgets' => [],
            ]
        );

        // 2. Daftarkan Permissions
        $permissions = [
            'input_oswan_conduct' => 'Akses Input Rekap Ketertiban OSWAN',
            'view_oswan_conduct' => 'Akses Pemantauan Ketertiban Santri',
            'view_all_oswan_conduct' => 'Akses Pemantauan Ketertiban Seluruh Pondok',
        ];

        $permissionModels = [];
        foreach ($permissions as $name => $desc) {
            $perm = Permission::firstOrCreate(
                ['name' => $name],
                ['description' => $desc]
            );
            $permissionModels[$name] = $perm->id;
        }

        // Berikan izin input_oswan_conduct ke role OSWAN
        if (isset($permissionModels['input_oswan_conduct'])) {
            $oswanRole->permissions()->syncWithoutDetaching([$permissionModels['input_oswan_conduct']]);
        }

        // Berikan izin view_all_oswan_conduct ke Administrator dan Manager
        $adminRoles = UserLevel::whereIn('name', ['Administrator', 'Manager', 'Manager Pengasuhan'])->get();
        foreach ($adminRoles as $ar) {
            $ar->permissions()->syncWithoutDetaching(array_values($permissionModels));
        }

        // Berikan izin view_oswan_conduct ke Musrif Asrama dan Guru
        $musrifRoles = UserLevel::whereIn('name', ['Musrif Asrama', 'Musrif', 'Musyrif', 'Guru', 'Wali Kelas'])->get();
        foreach ($musrifRoles as $mr) {
            if (isset($permissionModels['view_oswan_conduct'])) {
                $mr->permissions()->syncWithoutDetaching([$permissionModels['view_oswan_conduct']]);
            }
        }

        // 3. Buat / Pastikan User Akun Default OSWAN
        $defaultOswanUser = User::firstOrCreate(
            ['email' => 'oswan@sikap.alwan.ac.id'],
            [
                'name' => 'Pengurus OSWAN',
                'password' => Hash::make('password'),
                'user_level_id' => $oswanRole->id,
                'status' => 'Aktif',
                'nomor_induk' => 'oswan',
            ]
        );

        if ($defaultOswanUser->nomor_induk !== 'oswan') {
            $defaultOswanUser->update(['nomor_induk' => 'oswan']);
        }

        // Pastikan role tersinkronisasi jika user sudah ada sebelumnya
        if ($defaultOswanUser->user_level_id !== $oswanRole->id) {
            $defaultOswanUser->update(['user_level_id' => $oswanRole->id]);
        }
    }
}
