<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\UserLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccessControlController extends Controller
{
    public static function getFeaturesRegistry()
    {
        return [
            // Akademik & KBM
            [
                'key' => 'shortcut_journals',
                'alias' => 'journals',
                'label' => 'Absensi & Jurnal Mengajar',
                'description' => 'Presensi dan catatan materi pembelajaran harian',
                'category' => 'Akademik & KBM',
                'icon' => 'CalendarDays',
                'required_permission' => 'view_journals',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Guru', 'Wali Kelas'],
            ],
            [
                'key' => 'shortcut_grades',
                'alias' => 'grades',
                'label' => 'Input Nilai Siswa',
                'description' => 'Penilaian formatif, sumatif, ulangan, dan rapor',
                'category' => 'Akademik & KBM',
                'icon' => 'GraduationCap',
                'required_permission' => 'view_assessments',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Guru', 'Wali Kelas'],
            ],
            [
                'key' => 'shortcut_silabus',
                'alias' => 'silabus',
                'label' => 'Silabus & RPP / Modul',
                'description' => 'Rencana pembelajaran, ATP, dan perangkat ajar',
                'category' => 'Akademik & KBM',
                'icon' => 'BookOpen',
                'required_permission' => 'view_silabus',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Guru', 'Wali Kelas'],
            ],
            [
                'key' => 'shortcut_recap',
                'alias' => 'recap',
                'label' => 'Rekap Nilai Kelas',
                'description' => 'Ringkasan capaian dan ranking siswa per rombel',
                'category' => 'Akademik & KBM',
                'icon' => 'BarChart2',
                'required_permission' => 'view_assessments',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Guru', 'Wali Kelas', 'Kepala Sekolah'],
            ],
            [
                'key' => 'shortcut_reports',
                'alias' => 'reports',
                'label' => 'Cetak & Pantau Rapor',
                'description' => 'Kelola dan cetak buku rapor semester santri',
                'category' => 'Akademik & KBM',
                'icon' => 'FileText',
                'required_permission' => 'view_reports',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Wali Kelas', 'Kepala Sekolah'],
            ],
            [
                'key' => 'shortcut_schedule',
                'alias' => 'schedule',
                'label' => 'Jadwal Mengajar / KBM',
                'description' => 'Jadwal roster tatap muka mingguan kelas & guru',
                'category' => 'Akademik & KBM',
                'icon' => 'Clock',
                'required_permission' => 'view_academic_schedules',
                'parent_menu' => 'menu_academic',
                'default_for' => ['Guru', 'Wali Kelas', 'Santri'],
            ],
            [
                'key' => 'shortcut_calendar',
                'alias' => 'calendar',
                'label' => 'Kalender Akademik',
                'description' => 'Agenda tahunan, hari libur, dan jadwal ujian',
                'category' => 'Akademik & KBM',
                'icon' => 'CalendarRange',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Santri', 'Kepala Sekolah'],
            ],

            // Al-Qur'an & Tahfidz
            [
                'key' => 'shortcut_tahfidz',
                'alias' => 'tahfidz',
                'label' => 'Penilaian Tahfidz',
                'description' => 'Mutabaah harian, setoran juz, dan ujian tahfidz',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Book',
                'required_permission' => 'menu_tahfidz',
                'parent_menu' => 'menu_tahfidz',
                'default_for' => ['Guru', 'Musrif', 'Manager Tahfidz'],
            ],
            [
                'key' => 'shortcut_skrining',
                'alias' => 'skrining',
                'label' => 'Skrining Hafalan Santri',
                'description' => 'Verifikasi dan uji kelayakan juz hafalan santri',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Sparkles',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Guru', 'Musrif', 'Santri'],
            ],
            [
                'key' => 'shortcut_ikhtabir',
                'alias' => 'ikhtabir',
                'label' => 'Tes Mandiri AI (Ikhtabir)',
                'description' => 'Uji sambung ayat pintar AI untuk persiapan ujian',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Bot',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Guru', 'Santri'],
            ],
            [
                'key' => 'shortcut_quran',
                'alias' => 'quran',
                'label' => 'Al-Qur\'an Digital',
                'description' => 'Mushaf Al-Qur\'an digital untuk murajaah harian',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'BookOpenCheck',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Santri', 'Guru'],
            ],

            // Kesiswaan & Pengasuhan
            [
                'key' => 'shortcut_students',
                'alias' => 'students',
                'label' => 'Direktori Santri / Siswa',
                'description' => 'Daftar santri aktif dan data biodata santri',
                'category' => 'Kesiswaan & Pengasuhan',
                'icon' => 'Users',
                'required_permission' => 'view_students',
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Musrif', 'Kepala Sekolah'],
            ],
            [
                'key' => 'shortcut_permissions',
                'alias' => 'permissions',
                'label' => 'Perizinan Santri',
                'description' => 'Surat izin pulang, izin keluar, dan rekapan izin',
                'category' => 'Kesiswaan & Pengasuhan',
                'icon' => 'Key',
                'required_permission' => 'view_permissions',
                'parent_menu' => 'menu_care',
                'default_for' => ['Musrif', 'Kepala Sekolah', 'Administrator'],
            ],
            [
                'key' => 'shortcut_health',
                'alias' => 'health',
                'label' => 'Kesehatan Santri (UKS)',
                'description' => 'Catatan keluhan sakit santri dan riwayat berobat',
                'category' => 'Kesiswaan & Pengasuhan',
                'icon' => 'HeartPulse',
                'required_permission' => 'view_health_records',
                'parent_menu' => 'menu_care',
                'default_for' => ['Bagian Kesehatan', 'Musrif', 'Santri'],
            ],

            // Informasi & Akun
            [
                'key' => 'shortcut_profile',
                'alias' => 'profile',
                'label' => 'Profil Saya & Sandi',
                'description' => 'Biodata diri, foto profil, dan ubah password',
                'category' => 'Informasi & Akun',
                'icon' => 'UserCheck',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Santri', 'Musrif', 'Kepala Sekolah'],
            ],
            [
                'key' => 'shortcut_finance',
                'alias' => 'finance',
                'label' => 'Keuangan / SPP / Gaji',
                'description' => 'Tagihan SPP santri atau slip rincian honor guru',
                'category' => 'Informasi & Akun',
                'icon' => 'Wallet',
                'required_permission' => 'view_payments',
                'parent_menu' => 'menu_finance',
                'default_for' => ['Santri', 'Guru'],
            ],
            [
                'key' => 'shortcut_install_app',
                'alias' => 'install_app',
                'label' => 'Pasang Aplikasi PWA',
                'description' => 'Pintasan instal aplikasi ke beranda HP / Android',
                'category' => 'Informasi & Akun',
                'icon' => 'Download',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Santri', 'Musrif'],
            ],

            // Widget Dashboard
            [
                'key' => 'welcome_card',
                'alias' => 'welcome_card',
                'label' => 'Kartu Sambutan Dashboard',
                'description' => 'Banner selamat datang personal di bagian atas',
                'category' => 'Widget Dashboard',
                'icon' => 'LayoutDashboard',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Santri', 'Musrif', 'Kepala Sekolah'],
            ],
            [
                'key' => 'stats_cards',
                'alias' => 'stats_cards',
                'label' => 'Kartu Statistik Ringkasan',
                'description' => 'Statistik santri, kelas, mapel, atau kehadiran',
                'category' => 'Widget Dashboard',
                'icon' => 'Layers',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Guru', 'Wali Kelas', 'Kepala Sekolah'],
            ],
            [
                'key' => 'schedule_today',
                'alias' => 'schedule_today',
                'label' => 'Jadwal Hari Ini',
                'description' => 'Daftar jadwal mengajar / pelajaran hari berjalan',
                'category' => 'Widget Dashboard',
                'icon' => 'CalendarCheck',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Guru', 'Wali Kelas', 'Santri'],
            ],
            [
                'key' => 'class_info',
                'alias' => 'class_info',
                'label' => 'Info Rombel & Asrama Aktif',
                'description' => 'Kartu informasi kelas dan kamar santri',
                'category' => 'Widget Dashboard',
                'icon' => 'School',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Santri'],
            ],
            [
                'key' => 'activity_feed',
                'alias' => 'activity_feed',
                'label' => 'Feed Aktivitas & Pengumuman',
                'description' => 'Linimasa kabar terbaru dan kegiatan satuan pendidikan',
                'category' => 'Widget Dashboard',
                'icon' => 'Bell',
                'required_permission' => null,
                'parent_menu' => null,
                'default_for' => ['Administrator', 'Kepala Sekolah'],
            ],
        ];
    }

    public function index(Request $request)
    {
        $userLevels = UserLevel::with('permissions:id,name')->orderBy('id')->get()->map(function ($level) {
            return [
                'id' => $level->id,
                'name' => $level->name,
                'category' => $level->category ?? 'Lainnya',
                'dashboard_type' => $level->dashboard_type ?? 'Default',
                'widgets' => $level->widgets ?? [],
                'permission_names' => $level->permissions->pluck('name')->toArray(),
            ];
        });

        return Inertia::render('Settings/AccessControl/Index', [
            'userLevels' => $userLevels,
            'features' => self::getFeaturesRegistry(),
            'currentTab' => $request->query('tab', 'quick-access'),
        ]);
    }

    public function updateQuickAccessMatrix(Request $request)
    {
        $request->validate([
            'matrix' => 'required|array',
            'auto_sync_permissions' => 'nullable|boolean',
        ]);

        $matrix = $request->input('matrix', []);
        $autoSync = $request->boolean('auto_sync_permissions', false);

        $features = self::getFeaturesRegistry();
        $featureMap = collect($features)->keyBy('key');

        foreach ($matrix as $userLevelId => $widgets) {
            $userLevel = UserLevel::find($userLevelId);
            if (!$userLevel) continue;

            $cleanWidgets = [];
            foreach ($widgets as $k => $v) {
                $cleanWidgets[$k] = (bool) $v;
            }
            $userLevel->widgets = $cleanWidgets;
            $userLevel->save();

            // Auto sync required permissions if checked
            if ($autoSync && $userLevel->name !== 'Administrator') {
                $permsToAttach = [];
                foreach ($cleanWidgets as $featKey => $isEnabled) {
                    if (!$isEnabled) continue;
                    $feat = $featureMap->get($featKey);
                    if ($feat) {
                        if (!empty($feat['required_permission'])) {
                            $p = Permission::firstOrCreate(['name' => $feat['required_permission']]);
                            $permsToAttach[] = $p->id;
                        }
                        if (!empty($feat['parent_menu'])) {
                            $parentP = Permission::firstOrCreate(['name' => $feat['parent_menu']]);
                            $permsToAttach[] = $parentP->id;
                        }
                    }
                }

                if (!empty($permsToAttach)) {
                    $userLevel->permissions()->syncWithoutDetaching(array_unique($permsToAttach));
                }
            }
        }

        return redirect()->back()->with('success', 'Matriks pengaturan akses cepat & widget berhasil disimpan.');
    }

    public function edit(UserLevel $userLevel)
    {
        $excludedPermissions = [
            'view_user_levels',
            'create_user_levels',
            'edit_user_levels',
            'delete_user_levels',
            'view_access_control',
            'edit_access_control',
        ];

        $permissions = Permission::whereNotIn('name', $excludedPermissions)->get();

        // Group permissions by module
        $groupedPermissions = $permissions->groupBy(function ($item) {
            $parts = explode('_', $item->name, 2);
            $action = $parts[0];
            $module = $parts[1] ?? 'other';

            // Allow specific actions to define the module
            if (in_array($action, ['view', 'create', 'edit', 'delete', 'import', 'export', 'generate', 'use'])) {
                return $module;
            }
            // Logic for 'menu_' permissions
            if ($action === 'menu') {
                return 'Menu Sidebar';
            }
            return 'Other';
        });

        return Inertia::render('Settings/AccessControl/Edit', [
            'userLevel' => $userLevel->load('permissions'),
            'groupedPermissions' => $groupedPermissions,
            'allPermissions' => $permissions,
        ]);
    }

    public function update(Request $request)
    {
        // Keep for backward compatibility if needed, or remove.
        // We will implement bulk update here or in a new method.
        // Let's use a new method for clarity.
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'user_level_id' => 'required|exists:user_levels,id',
            'permission_changes' => 'required|array',
            'permission_changes.*.permission_id' => 'required|exists:permissions,id',
            'permission_changes.*.has_access' => 'required|boolean',
        ]);

        $userLevel = UserLevel::findOrFail($request->user_level_id);
        $permissionsToSync = [];
        $permissionsToDetach = [];

        // 1. Process explicit changes from UI
        foreach ($request->permission_changes as $change) {
            if ($change['has_access']) {
                $userLevel->permissions()->syncWithoutDetaching([$change['permission_id']]);
            } else {
                $userLevel->permissions()->detach($change['permission_id']);
            }
        }

        // 2. SMART AUTO-FIX: Ensure Parent Menus exist if Children exist
        $currentPermissions = $userLevel->permissions()->pluck('name')->toArray();
        $missingParents = [];

        // Definition of Parent -> Child dependency
        $dependencies = [
            'menu_academic' => ['view_assessments', 'create_assessments', 'view_journals', 'view_silabus', 'view_academic_schedules'],
            'menu_tahfidz' => ['view_tahfidz_assessments', 'view_tahfidz_halaqoh', 'view_tahfidz_achievements'],
            'menu_care' => ['view_health_records', 'view_health_complaints', 'view_permissions'],
            'menu_finance' => ['view_payments', 'view_bills'],
            'menu_settings' => ['view_users', 'view_school_info'],
        ];

        foreach ($dependencies as $parent => $children) {
            // Check if ANY child permission exists in current permissions
            $hasChild = false;
            foreach ($children as $child) {
                if (in_array($child, $currentPermissions)) {
                    $hasChild = true;
                    break;
                }
            }

            // If has child but missing parent, Add Parent
            if ($hasChild && !in_array($parent, $currentPermissions)) {
                $missingParents[] = $parent;
            }
        }

        if (!empty($missingParents)) {
            $parentIds = [];
            foreach ($missingParents as $parentName) {
                // Self-Healing: Create permission if it doesn't exist
                $p = Permission::firstOrCreate(['name' => $parentName]);
                $parentIds[] = $p->id;
            }
            $userLevel->permissions()->syncWithoutDetaching($parentIds);
        }

        return redirect()->back()->with('success', 'Hak akses berhasil diperbarui (Menu Induk otomatis disesuaikan).');
    }
}
