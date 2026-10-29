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
        // 1. Daftarkan Permissions OSWAN
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

        // 2. Daftar 3 Qismu OSWAN + 1 Koordinator
        $qismuList = [
            [
                'name' => 'OSWAN Lughoh',
                'description' => 'Bagian Bahasa OSWAN (Pencatat Mukholafah Bahasa)',
                'email' => 'oswan.lughoh@sikap.alwan.ac.id',
                'nis' => 'oswan.lughoh',
                'full_name' => 'OSWAN - Qismu Lughoh',
            ],
            [
                'name' => 'OSWAN Ibadah',
                'description' => 'Bagian Ibadah OSWAN (Pencatat Mukholafah Ibadah/Salat)',
                'email' => 'oswan.ibadah@sikap.alwan.ac.id',
                'nis' => 'oswan.ibadah',
                'full_name' => 'OSWAN - Qismu Ibadah',
            ],
            [
                'name' => 'OSWAN Tandzim',
                'description' => 'Bagian Ketertiban OSWAN (Pencatat Mukholafah Tandzim/Tidur)',
                'email' => 'oswan.tandzim@sikap.alwan.ac.id',
                'nis' => 'oswan.tandzim',
                'full_name' => 'OSWAN - Qismu Tandzim',
            ],
            [
                'name' => 'OSWAN',
                'description' => 'Koordinator OSWAN (Pencatat & Pemantau Seluruh Bagian)',
                'email' => 'oswan@sikap.alwan.ac.id',
                'nis' => 'oswan',
                'full_name' => 'Pengurus Koordinator OSWAN',
            ],
        ];

        foreach ($qismuList as $qismu) {
            // Pastikan Role / UserLevel OSWAN tersedia
            $role = UserLevel::firstOrCreate(
                ['name' => $qismu['name']],
                [
                    'category' => 'Santri',
                    'dashboard_type' => 'Oswan',
                    'description' => $qismu['description'],
                    'widgets' => [],
                ]
            );

            // Update dashboard_type ke 'Oswan' jika sebelumnya masih 'minimal' atau 'Default'
            if ($role->dashboard_type !== 'Oswan') {
                $role->update(['dashboard_type' => 'Oswan']);
            }

            // Berikan izin input_oswan_conduct & view_oswan_conduct
            if (isset($permissionModels['input_oswan_conduct'])) {
                $role->permissions()->syncWithoutDetaching([
                    $permissionModels['input_oswan_conduct'],
                    $permissionModels['view_oswan_conduct'],
                ]);
            }

            // Pastikan Akun User Tersedia
            $user = User::firstOrCreate(
                ['email' => $qismu['email']],
                [
                    'name' => $qismu['full_name'],
                    'password' => Hash::make('password'),
                    'user_level_id' => $role->id,
                    'status' => 'Aktif',
                    'nomor_induk' => $qismu['nis'],
                ]
            );

            // Sinkronkan data jika sudah pernah ada
            $user->update([
                'name' => $qismu['full_name'],
                'user_level_id' => $role->id,
                'status' => 'Aktif',
                'nomor_induk' => $qismu['nis'],
            ]);
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
    }
}
