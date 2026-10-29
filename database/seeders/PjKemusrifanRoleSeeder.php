<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserLevel;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PjKemusrifanRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Daftar Permissions yang wajib dimiliki oleh PJ Kemusrifan
            $permissionsMap = [
                'menu_dashboard' => 'Akses Dashboard Utama',
                'menu_care' => 'Akses Menu Utama Pengasuhan',
                'view_students' => 'Melihat Daftar & Biodata Santri',
                'view_kamars' => 'Melihat Data Kamar & Asrama',
                'view_kamar_members' => 'Melihat & Mengatur Anggota Kamar',
                'view_character_assessments' => 'Melihat & Input Penilaian Akhlak',
                'view_character_input' => 'Input Nilai Akhlak Santri',
                'view_character_recap' => 'Melihat Rekapitulasi Nilai Akhlak',
                'view_permissions' => 'Melihat & Mengelola Perizinan Santri',
                'create_permissions' => 'Membuat Surat Izin Keluar/Pulang Santri',
                'view_student_permissions' => 'Melihat Rekap Izin Santri',
                'create_student_permissions' => 'Input Izin Santri',
                'edit_student_permissions' => 'Edit Data Izin Santri',
                'view_health_records' => 'Melihat Catatan Kesehatan Santri (UKS)',
                'view_health_stats' => 'Melihat Statistik & Pantauan Kesehatan Santri',
                'view_oswan_conduct' => 'Melihat Rekapan Pelanggaran Santri dari OSWAN',
                'view_all_oswan_conduct' => 'Melihat Catatan Ketertiban Seluruh Pondok',
            ];

            $permissionIds = [];
            foreach ($permissionsMap as $permName => $desc) {
                $perm = Permission::firstOrCreate(
                    ['name' => $permName],
                    ['description' => $desc]
                );
                $permissionIds[] = $perm->id;
            }

            // 2. Default Widgets Dashboard untuk PJ Kemusrifan
            $defaultWidgets = [
                'welcome_card' => true,
                'stats_cards' => true,
                'activity_feed' => true,
                'quick_actions' => true,
                'shortcut_profile' => true,
                'shortcut_calendar' => true,
                'shortcut_musyrif_performance_monitoring' => true,
                'shortcut_musyrif_performance_logbook' => true,
                'shortcut_oswan_monitor' => true,
                'shortcut_students' => true,
                'shortcut_permissions' => true,
                'shortcut_permission_personal' => true,
                'shortcut_health' => true,
                'shortcut_install_app' => true,
            ];

            // 3. Buat atau Sinkronkan Role 'PJ Kemusrifan'
            $roleNames = ['PJ Kemusrifan', 'PJ Musyrif'];
            $mainRole = null;

            foreach ($roleNames as $idx => $roleName) {
                $role = UserLevel::firstOrCreate(
                    ['name' => $roleName],
                    [
                        'category' => 'Musrif',
                        'dashboard_type' => 'Admin',
                        'widgets' => $defaultWidgets,
                    ]
                );

                // Perbarui category & dashboard_type jika belum pas
                $role->update([
                    'category' => 'Musrif',
                    'dashboard_type' => 'Admin',
                    'widgets' => array_merge($role->widgets ?? [], $defaultWidgets),
                ]);

                // Pasang permissions
                $role->permissions()->syncWithoutDetaching($permissionIds);

                if ($idx === 0) {
                    $mainRole = $role;
                }
            }

            // 4. Pastikan Akun Default PJ Kemusrifan Tersedia
            $defaultUser = User::firstOrCreate(
                ['email' => 'pj.kemusrifan@sikap.alwan.ac.id'],
                [
                    'name' => 'Ustadz PJ Kemusrifan',
                    'nomor_induk' => 'pj.kemusrifan',
                    'password' => Hash::make('password'),
                    'user_level_id' => $mainRole->id,
                    'status' => 'Aktif',
                ]
            );

            // Jika user sudah ada tetapi levelnya belum PJ Kemusrifan, sinkronkan
            if ($defaultUser->user_level_id !== $mainRole->id) {
                $defaultUser->update(['user_level_id' => $mainRole->id]);
            }

            $this->command->info('Role & Akun PJ Kemusrifan berhasil dibuat/diperbarui.');
        });
    }
}

