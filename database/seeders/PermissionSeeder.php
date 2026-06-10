<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // User Management
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',

            // User Level Management (Admin Only - Hidden from UI)
            'view_user_levels',
            'create_user_levels',
            'edit_user_levels',
            'delete_user_levels',

            // Access Control (Admin Only - Hidden from UI)
            'view_access_control',
            'edit_access_control',

            // Academic Year (TP)
            'view_academic_years',
            'create_academic_years',
            'edit_academic_years',
            'delete_academic_years',

            // Active Academic Settings
            'view_academic_settings',
            'edit_academic_settings',

            // Master Data: Jenjang
            'view_jenjangs',
            'create_jenjangs',
            'edit_jenjangs',
            'delete_jenjangs',

            // Master Data: Kelas
            'view_kelas',
            'create_kelas',
            'edit_kelas',
            'delete_kelas',

            // Master Data: Kelas Paralel
            'view_kelas_paralel',
            'create_kelas_paralel',
            'edit_kelas_paralel',
            'delete_kelas_paralel',

            // Master Data: Mapel
            'view_mapels',
            'create_mapels',
            'edit_mapels',
            'delete_mapels',

            // Master Data: Ujian
            'view_ujians',
            'create_ujians',
            'edit_ujians',
            'delete_ujians',

            // Pendidikan: Silabus
            'view_silabus',
            'create_silabus',
            'edit_silabus',
            'delete_silabus',

            // Kesiswaan: Data Siswa
            'view_students',
            'create_students',
            'edit_students',
            'delete_students',
            'import_students',

            // Pendidikan: Kelas Aktif (Rombel)
            'view_active_classes',
            'create_active_classes',
            'edit_active_classes',
            'delete_active_classes',

            // Pendidikan: Anggota Kelas (Perkelas)
            'view_class_members',
            'create_class_members',
            'delete_class_members',

            // Pendidikan: Mapel Aktif (Distribusi Guru)
            'view_active_subjects',
            'create_active_subjects',
            'edit_active_subjects',
            'delete_active_subjects',

            // Pendidikan: Persen Nilai (Bobot)
            'view_grade_weights',
            'create_grade_weights',
            'edit_grade_weights',
            'delete_grade_weights',

            // Pendidikan: KKM
            'view_kkm',
            'create_kkm',
            'edit_kkm',
            'delete_kkm',

            // Santri Specific Permissions
            'view_own_biodata',
            'view_own_grades',
            'view_own_finance',
            'view_own_schedule',

            // NEW FEATURES
            // Jadwal (Generator Helper)
            'view_schedules',
            'generate_schedules',

            // Jadwal (Public)
            'view_academic_schedules',

            // Jam Off Guru
            'view_unavailable_hours',
            'edit_unavailable_hours',

            // Analisis
            'view_learning_analysis',
            'view_grade_analysis',

            // --- MISSING PERMISSION ADDITIONS ---

            // Assessments (Nilai)
            'view_assessments',
            'view_all_assessments', // Untuk Admin/Kepsek lihat semua nilai
            'create_assessments',
            'edit_assessments',
            'delete_assessments',

            // Journals (Jurnal Kelas)
            'view_journals',
            'create_journals',
            'edit_journals',
            'delete_journals',
            'input_manual_attendance',
            'print_manual_attendance',

            // Reports (Rapor)
            'view_reports',
            'view_all_reports', // Untuk melihat rapor kelas lain
            'create_report_notes', // Catatan Wali Kelas

            // RFID System
            'view_rfid',
            'use_rfid_scanner',

            // Student Permissions (Perizinan Santri / Musrif)
            'view_student_permissions',
            'create_student_permissions',
            'edit_student_permissions',
            'delete_student_permissions', // Jika perlu

            // Grade Recap (Rekap Nilai)
            'view_class_recap',
            'view_student_recap',

            // Dashboard Widgets
            'view_dashboard_stats',
            'view_dashboard_calendar',
            'view_dashboard_announcements',

            // Sidebar Menus (High Level)
            'menu_dashboard',
            'menu_users',
            'menu_academic',
            'menu_student_academic',
            'menu_care',
            'menu_finance',
            'menu_settings',

            // Specific Settings Menus
            'menu_settings_education',
            'menu_settings_care',
            'menu_settings_master_general',
            'menu_settings_master_education',
            'menu_settings_master_care',

            // Tahfidz Specific Permissions
            'view_tahfidz_testers',
            'view_tahfidz_halaqoh',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
