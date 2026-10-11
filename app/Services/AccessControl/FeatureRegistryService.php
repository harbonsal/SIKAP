<?php

namespace App\Services\AccessControl;

use App\Models\Permission;

class FeatureRegistryService
{
    /**
     * Master catalog of all system features and their CRUD actions.
     */
    public static function getMasterCatalog(): array
    {
        return [
            // ==========================================
            // DIVISI 1: KBM & AKADEMIK
            // ==========================================
            [
                'id' => 'assessments',
                'name' => 'Input & Penilaian Mapel',
                'description' => 'Penilaian formatif, sumatif, ulangan harian, dan rapor',
                'category' => 'Akademik & KBM',
                'icon' => 'GraduationCap',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_assessments',
                    'view' => 'view_assessments',
                    'edit' => 'edit_assessments',
                    'delete' => 'delete_assessments',
                ],
            ],
            [
                'id' => 'class_recap',
                'name' => 'Rekap & Leger Nilai Kelas',
                'description' => 'Rekapitulasi nilai angka, predikat, rata-rata, dan ranking rombel',
                'category' => 'Akademik & KBM',
                'icon' => 'BarChart2',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_grade_recap',
                ],
            ],
            [
                'id' => 'student_recap',
                'name' => 'Rekap Nilai Per Santri',
                'description' => 'Transkrip dan capaian akademik individu santri',
                'category' => 'Akademik & KBM',
                'icon' => 'FileSpreadsheet',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_student_recap',
                ],
            ],
            [
                'id' => 'recap_ijazah',
                'name' => 'Rekap Nilai Ijazah',
                'description' => 'Penggabungan nilai portofolio akhir jenjang untuk ijazah',
                'category' => 'Akademik & KBM',
                'icon' => 'Award',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_ijazah',
                    'view' => 'view_grade_recap',
                    'edit' => 'edit_ijazah',
                    'delete' => 'delete_ijazah',
                ],
            ],
            [
                'id' => 'reports',
                'name' => 'Cetak Buku Rapor',
                'description' => 'Generate dan cetak buku rapor semester ganjil/genap',
                'category' => 'Akademik & KBM',
                'icon' => 'Printer',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit'],
                'permission_keys' => [
                    'create' => 'view_reports',
                    'view' => 'view_reports',
                    'edit' => 'edit_reports',
                ],
            ],
            [
                'id' => 'report_notes',
                'name' => 'Catatan Rapor Wali Kelas',
                'description' => 'Catatan bimbingan dan perkembangan santri di rapor',
                'category' => 'Akademik & KBM',
                'icon' => 'FilePenLine',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_report_notes',
                    'view' => 'view_reports',
                    'edit' => 'create_report_notes',
                    'delete' => 'delete_report_notes',
                ],
            ],
            [
                'id' => 'learning_analysis',
                'name' => 'Analisis Nilai & Pembelajaran',
                'description' => 'Statistik daya serap, grafik KKM, dan evaluasi hasil belajar',
                'category' => 'Akademik & KBM',
                'icon' => 'TrendingUp',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_learning_analysis',
                ],
            ],
            [
                'id' => 'academic_calendar',
                'name' => 'Kalender Pendidikan',
                'description' => 'Agenda tahunan, hari efektif, hari libur, dan jadwal ujian',
                'category' => 'Akademik & KBM',
                'icon' => 'CalendarRange',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_academic_settings',
                    'view' => 'view_academic_settings',
                    'edit' => 'edit_academic_settings',
                    'delete' => 'edit_academic_settings',
                ],
            ],
            [
                'id' => 'silabus',
                'name' => 'Silabus & RPP / Modul Ajar',
                'description' => 'Dokumen rencana pembelajaran, ATP, dan perangkat kurikulum',
                'category' => 'Akademik & KBM',
                'icon' => 'BookOpen',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_silabus',
                    'view' => 'view_silabus',
                    'edit' => 'edit_silabus',
                    'delete' => 'delete_silabus',
                ],
            ],
            [
                'id' => 'journals',
                'name' => 'Jurnal Mengajar & Absensi Kelas',
                'description' => 'Presensi harian siswa dan materi tatap muka per pertemuan',
                'category' => 'Akademik & KBM',
                'icon' => 'CalendarDays',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_journals',
                    'view' => 'view_journals',
                    'edit' => 'edit_journals',
                    'delete' => 'delete_journals',
                ],
            ],
            [
                'id' => 'monitoring_journals',
                'name' => 'Pantauan Jurnal KBM',
                'description' => 'Monitoring kepatuhan pengisian jurnal mengajar seluruh guru',
                'category' => 'Akademik & KBM',
                'icon' => 'CheckCircle2',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_attendance_recap',
                ],
            ],
            [
                'id' => 'manual_attendance',
                'name' => 'Input Absensi Manual (Guru Piket)',
                'description' => 'Pencatatan presensi darurat / guru piket saat guru berhalangan',
                'category' => 'Akademik & KBM',
                'icon' => 'ClipboardList',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit'],
                'permission_keys' => [
                    'create' => 'input_manual_attendance',
                    'view' => 'view_attendance_recap',
                    'edit' => 'input_manual_attendance',
                ],
            ],
            [
                'id' => 'print_attendance',
                'name' => 'Cetak Blangko Absensi Manual',
                'description' => 'Cetak lembar absen fisik KBM mingguan/bulanan',
                'category' => 'Akademik & KBM',
                'icon' => 'Printer',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'print_manual_attendance',
                ],
            ],
            [
                'id' => 'schedules',
                'name' => 'Jadwal Pelajaran (Roster)',
                'description' => 'Jadwal tatap muka mingguan kelas, jam KBM, dan guru',
                'category' => 'Akademik & KBM',
                'icon' => 'Clock',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_academic_schedules',
                    'view' => 'view_academic_schedules',
                    'edit' => 'edit_academic_schedules',
                    'delete' => 'delete_academic_schedules',
                ],
            ],
            [
                'id' => 'supervisions',
                'name' => 'Supervisi Guru',
                'description' => 'Instrumen evaluasi dan penilaian kinerja mengajar guru',
                'category' => 'Akademik & KBM',
                'icon' => 'ShieldCheck',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_supervisions',
                    'view' => 'view_supervisions',
                    'edit' => 'edit_supervisions',
                    'delete' => 'delete_supervisions',
                ],
            ],
            [
                'id' => 'supervision_ai',
                'name' => 'Supervisi AI Assistant',
                'description' => 'Bantuan analisis evaluasi pembelajaran berbasis AI',
                'category' => 'Akademik & KBM',
                'icon' => 'Cpu',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'use_supervision_ai',
                ],
            ],
            [
                'id' => 'rpp_generator',
                'name' => 'RPP Generator AI',
                'description' => 'Pembuat draft modul ajar dan tujuan pembelajaran otomatis AI',
                'category' => 'Akademik & KBM',
                'icon' => 'Sparkles',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view'],
                'permission_keys' => [
                    'create' => 'use_rpp_generator',
                    'view' => 'view_supervision_rpps',
                ],
            ],
            [
                'id' => 'own_supervision',
                'name' => 'Rapor Supervisi Saya',
                'description' => 'Akses guru untuk melihat hasil penilaian supervisi dirinya',
                'category' => 'Akademik & KBM',
                'icon' => 'UserCheck',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_supervision',
                ],
            ],
            [
                'id' => 'ikhtabir_ai',
                'name' => 'Ikhtabir Nafsi (Tes Mandiri AI)',
                'description' => 'Fitur uji sambung ayat cerdas AI untuk latihan santri & guru',
                'category' => 'Akademik & KBM',
                'icon' => 'Bot',
                'parent_menu' => 'menu_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'use_ikhtabir_ai',
                ],
            ],
            [
                'id' => 'ijazah',
                'name' => 'Manajemen Ijazah & Kelulusan',
                'description' => 'Penomoran, verifikasi berkas, dan penerbitan ijazah santri',
                'category' => 'Akademik & KBM',
                'icon' => 'Award',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'manage_ijazah',
                    'view' => 'manage_ijazah',
                    'edit' => 'manage_ijazah',
                    'delete' => 'manage_ijazah',
                ],
            ],

            // ==========================================
            // DIVISI 2: AL-QUR'AN & TAHFIDZ
            // ==========================================
            [
                'id' => 'tahfidz_dashboard',
                'name' => 'Dashboard Musyrif Tahfidz',
                'description' => 'Ringkasan setoran, target juz, dan pantauan halaqoh',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'LayoutDashboard',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_tahfidz_halaqoh',
                ],
            ],
            [
                'id' => 'tahfidz_assessments',
                'name' => 'Penilaian Tahfidz & Mutabaah',
                'description' => 'Input setoran harian, ziyadah, murajaah, dan tasmi\'',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Book',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_tahfidz_assessments',
                    'view' => 'menu_tahfidz_assessment',
                    'edit' => 'edit_tahfidz_assessments',
                    'delete' => 'delete_tahfidz_assessments',
                ],
            ],
            [
                'id' => 'tahfidz_recap',
                'name' => 'Rekap Nilai Tahfidz',
                'description' => 'Rekapitulasi pencapaian hafalan per halaqoh atau kelas',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'FileText',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'menu_tahfidz_recap',
                ],
            ],
            [
                'id' => 'tahfidz_analysis',
                'name' => 'Analisa Capaian Tahfidz',
                'description' => 'Statistik laju mutabaah, progres santri, dan target juz',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'LineChart',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_tahfidz_analysis',
                ],
            ],
            [
                'id' => 'tahfidz_halaqoh',
                'name' => 'Plotting & Pantauan Halaqoh',
                'description' => 'Pembagian santri ke musyrif dan monitoring kehadiran halaqoh',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Users',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_tahfidz_halaqoh',
                    'view' => 'view_tahfidz_halaqoh',
                    'edit' => 'edit_tahfidz_halaqoh',
                    'delete' => 'delete_tahfidz_halaqoh',
                ],
            ],
            [
                'id' => 'tahfidz_skrining',
                'name' => 'Skrining Kelayakan Hafalan',
                'description' => 'Uji kelayakan dan verifikasi penguasaan juz sebelum ujian',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Sparkles',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_tahfidz_skrining',
                    'view' => 'view_tahfidz_halaqoh',
                    'edit' => 'edit_tahfidz_skrining',
                    'delete' => 'delete_tahfidz_skrining',
                ],
            ],
            [
                'id' => 'tahfidz_testers',
                'name' => 'Tim Penguji Tahfidz',
                'description' => 'Plotting dan jadwal ustadz penguji ujian tasmi\'/tahfidz',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'UserCheck',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_tahfidz_testers',
                    'view' => 'view_tahfidz_testers',
                    'edit' => 'edit_tahfidz_testers',
                    'delete' => 'delete_tahfidz_testers',
                ],
            ],
            [
                'id' => 'tahfidz_settings',
                'name' => 'Pengaturan Master Tahfidz',
                'description' => 'Target juz tahunan, kriteria penilaian, dan jadwal ujian',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'Settings',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['view', 'edit'],
                'permission_keys' => [
                    'view' => 'view_tahfidz_halaqoh',
                    'edit' => 'edit_academic_settings',
                ],
            ],
            [
                'id' => 'quran_digital',
                'name' => 'Al-Qur\'an Digital & Tilawah',
                'description' => 'Mushaf Al-Qur\'an online dan modul latihan membaca',
                'category' => 'Al-Qur\'an & Tahfidz',
                'icon' => 'BookOpenCheck',
                'parent_menu' => 'menu_tahfidz',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_quran_tilawah',
                ],
            ],

            // ==========================================
            // DIVISI 3: PENGASUHAN, ASRAMA & AKHLAK
            // ==========================================
            [
                'id' => 'musryif_tarbiyah',
                'name' => 'Musyrif Tarbiyah & Anak Asuh',
                'description' => 'Plotting pembina asrama ke kelompok santri binaan',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Users',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_musryif_tarbiyah',
                    'view' => 'view_musryif_tarbiyah',
                    'edit' => 'edit_musryif_tarbiyah',
                    'delete' => 'delete_musryif_tarbiyah',
                ],
            ],
            [
                'id' => 'character_assessments',
                'name' => 'Penilaian Karakter & Akhlak',
                'description' => 'Input nilai adab, ibadah, dan kedisiplinan santri',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Heart',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_character_assessments',
                    'view' => 'view_character_input',
                    'edit' => 'edit_character_assessments',
                    'delete' => 'delete_character_assessments',
                ],
            ],
            [
                'id' => 'character_recap',
                'name' => 'Rekap Nilai Akhlak',
                'description' => 'Rekap nilai adab per kamar, semester, dan santri',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'FileSpreadsheet',
                'parent_menu' => 'menu_care',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_character_recap',
                ],
            ],
            [
                'id' => 'character_analysis',
                'name' => 'Analisa Nilai Akhlak',
                'description' => 'Statistik pelanggaran, tren sikap, dan evaluasi pengasuhan',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'LineChart',
                'parent_menu' => 'menu_care',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_character_recap',
                ],
            ],
            [
                'id' => 'kamars',
                'name' => 'Data Kamar Asrama Fisik',
                'description' => 'Master gedung asrama, lantai, dan ruangan kamar santri',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Home',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_kamars',
                    'view' => 'view_kamars',
                    'edit' => 'edit_kamars',
                    'delete' => 'delete_kamars',
                ],
            ],
            [
                'id' => 'active_kamars',
                'name' => 'Kamar & Musrif Aktif',
                'description' => 'Penetapan kamar yang digunakan dan musrif penanggung jawab',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Bed',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_active_kamars',
                    'view' => 'view_active_kamars',
                    'edit' => 'edit_active_kamars',
                    'delete' => 'delete_active_kamars',
                ],
            ],
            [
                'id' => 'kamar_members',
                'name' => 'Plotting Santri / Anggota Kamar',
                'description' => 'Penempatan santri ke dalam kamar asrama tahun ajaran aktif',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'UserPlus',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_kamar_members',
                    'view' => 'view_kamar_members',
                    'edit' => 'edit_kamar_members',
                    'delete' => 'delete_kamar_members',
                ],
            ],
            [
                'id' => 'student_permissions',
                'name' => 'Perizinan Santri (Pulang/Keluar)',
                'description' => 'Pengajuan surat izin santri, approval musrif, dan log keluar-masuk',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Key',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_permissions',
                    'view' => 'view_permissions',
                    'edit' => 'edit_permissions',
                    'delete' => 'delete_permissions',
                ],
            ],
            [
                'id' => 'rfid_scanner',
                'name' => 'Scanner RFID Gerbang Asrama',
                'description' => 'Tap kartu RFID santri untuk validasi otomatis kepulangan',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Cpu',
                'parent_menu' => 'menu_care',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'use_rfid_scanner',
                ],
            ],
            [
                'id' => 'health_records',
                'name' => 'Pencatatan Rekam Medis (UKS)',
                'description' => 'Input santri sakit, keluhan medis, tindakan, dan obat',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'HeartPulse',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_health_record',
                    'view' => 'view_health_records',
                    'edit' => 'edit_health_records',
                    'delete' => 'delete_health_records',
                ],
            ],
            [
                'id' => 'health_stats',
                'name' => 'Pantauan Kesehatan Santri',
                'description' => 'Statistik santri sakit, keluhan dominan, dan riwayat berobat',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Activity',
                'parent_menu' => 'menu_care',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_health_stats',
                ],
            ],
            [
                'id' => 'achievements',
                'name' => 'Catatan Prestasi Santri',
                'description' => 'Pencatatan medali lomba, hafalan luar biasa, dan piagam',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'Trophy',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_achievements',
                    'view' => 'view_achievements',
                    'edit' => 'edit_achievements',
                    'delete' => 'delete_achievements',
                ],
            ],
            [
                'id' => 'violations',
                'name' => 'Catatan Pelanggaran & Poin Santri',
                'description' => 'Buku rekam indisipliner, pelanggaran adab, dan poin sansi',
                'category' => 'Pengasuhan & Asrama',
                'icon' => 'AlertTriangle',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_violations',
                    'view' => 'view_violations',
                    'edit' => 'edit_violations',
                    'delete' => 'delete_violations',
                ],
            ],

            // ==========================================
            // DIVISI 4: KESISWAAN & DATA SANTRI
            // ==========================================
            [
                'id' => 'students',
                'name' => 'Direktori Data Santri',
                'description' => 'Biodata lengkap santri, data wali, NISN, dan status aktif',
                'category' => 'Kesiswaan & Santri',
                'icon' => 'Users',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_students',
                    'view' => 'view_students',
                    'edit' => 'edit_students',
                    'delete' => 'delete_students',
                ],
            ],
            [
                'id' => 'import_students',
                'name' => 'Import Santri Massal (Excel)',
                'description' => 'Upload massal biodata santri baru melalui template Excel',
                'category' => 'Kesiswaan & Santri',
                'icon' => 'FileSpreadsheet',
                'parent_menu' => 'menu_academic',
                'actions' => ['create'],
                'permission_keys' => [
                    'create' => 'import_students',
                ],
            ],
            [
                'id' => 'class_members',
                'name' => 'Rombel & Anggota Kelas Aktif',
                'description' => 'Plotting penempatan santri ke kelas dan wali kelas',
                'category' => 'Kesiswaan & Santri',
                'icon' => 'School',
                'parent_menu' => 'menu_academic',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_class_members',
                    'view' => 'view_class_members',
                    'edit' => 'edit_class_members',
                    'delete' => 'delete_class_members',
                ],
            ],

            // ==========================================
            // DIVISI 5: KEUANGAN (FINANCE)
            // ==========================================
            [
                'id' => 'bills',
                'name' => 'Tagihan Biaya / SPP Santri',
                'description' => 'Pembuatan pos tagihan bulanan, pendaftaran, dan biaya pondok',
                'category' => 'Keuangan (Finance)',
                'icon' => 'Wallet',
                'parent_menu' => 'menu_finance',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_bills',
                    'view' => 'view_bills',
                    'edit' => 'edit_bills',
                    'delete' => 'delete_bills',
                ],
            ],
            [
                'id' => 'payments',
                'name' => 'Pencatatan Pembayaran & Kwitansi',
                'description' => 'Transaksi setoran biaya santri dan cetak bukti pembayaran',
                'category' => 'Keuangan (Finance)',
                'icon' => 'Banknote',
                'parent_menu' => 'menu_finance',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_payments',
                    'view' => 'view_payments',
                    'edit' => 'edit_payments',
                    'delete' => 'delete_payments',
                ],
            ],
            [
                'id' => 'financial_reports',
                'name' => 'Laporan Rekap Keuangan',
                'description' => 'Rekap arus kas, tunggakan santri, dan laporan buku kas',
                'category' => 'Keuangan (Finance)',
                'icon' => 'FileText',
                'parent_menu' => 'menu_finance',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_bills',
                ],
            ],

            // ==========================================
            // DIVISI 6: PORTAL MANDIRI SANTRI & WALI
            // ==========================================
            [
                'id' => 'own_biodata',
                'name' => 'Biodata Diri Santri',
                'description' => 'Akses santri melihat profil dan memperbarui kontak diri',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'User',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view', 'edit'],
                'permission_keys' => [
                    'view' => 'view_own_biodata',
                    'edit' => 'view_own_biodata',
                ],
            ],
            [
                'id' => 'own_grades',
                'name' => 'Rapor & Nilai Saya',
                'description' => 'Santri melihat riwayat nilai ujian, tugas, dan capaian KBM',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'GraduationCap',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_grades',
                ],
            ],
            [
                'id' => 'own_tahfidz',
                'name' => 'Riwayat Tahfidz & Skrining Mandiri',
                'description' => 'Santri memantau capaian juz setoran dan hasil skrining',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'Book',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_grades',
                ],
            ],
            [
                'id' => 'own_schedule',
                'name' => 'Jadwal Pelajaran Mandiri',
                'description' => 'Santri mengecek jadwal tatap muka harian kelasnya',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'Clock',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_schedule',
                ],
            ],
            [
                'id' => 'own_health',
                'name' => 'Riwayat Kesehatan Mandiri',
                'description' => 'Santri mengecek histori berobat dan catatan medis UKS',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'HeartPulse',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_biodata',
                ],
            ],
            [
                'id' => 'own_finance',
                'name' => 'Informasi Tagihan & SPP Saya',
                'description' => 'Santri/wali mengecek status lunas atau sisa tagihan',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'Wallet',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['view'],
                'permission_keys' => [
                    'view' => 'view_own_finance',
                ],
            ],
            [
                'id' => 'student_questionnaires',
                'name' => 'Pengisian Angket Supervisi Santri',
                'description' => 'Kuesioner evaluasi pembelajaran ustadz oleh santri',
                'category' => 'Portal Mandiri Santri',
                'icon' => 'ClipboardCheck',
                'parent_menu' => 'menu_student_academic',
                'actions' => ['create', 'view'],
                'permission_keys' => [
                    'create' => 'view_own_biodata',
                    'view' => 'view_own_biodata',
                ],
            ],

            // ==========================================
            // DIVISI 7: DATA MASTER & PENGATURAN SEKOLAH
            // ==========================================
            [
                'id' => 'users',
                'name' => 'Manajemen Pengguna (User)',
                'description' => 'Pembuatan, reset password, dan status aktif akun login',
                'category' => 'Master & Pengaturan',
                'icon' => 'Users',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_users',
                    'view' => 'view_users',
                    'edit' => 'edit_users',
                    'delete' => 'delete_users',
                ],
            ],
            [
                'id' => 'academic_years',
                'name' => 'Tahun Pelajaran & Semester',
                'description' => 'Master tahun ajaran, semester ganjil/genap, dan penetapan aktif',
                'category' => 'Master & Pengaturan',
                'icon' => 'Calendar',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_academic_years',
                    'view' => 'view_academic_years',
                    'edit' => 'edit_academic_years',
                    'delete' => 'delete_academic_years',
                ],
            ],
            [
                'id' => 'jenjangs',
                'name' => 'Jenjang Pendidikan',
                'description' => 'Master jenjang satuan pendidikan (MTs, MA, SMP, SMA)',
                'category' => 'Master & Pengaturan',
                'icon' => 'School',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_jenjangs',
                    'view' => 'view_jenjangs',
                    'edit' => 'edit_jenjangs',
                    'delete' => 'delete_jenjangs',
                ],
            ],
            [
                'id' => 'kelas',
                'name' => 'Data Kelas & Tingkat',
                'description' => 'Master nama tingkat kelas (Tingkat 7, Tingkat 8, dst)',
                'category' => 'Master & Pengaturan',
                'icon' => 'Layers',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_kelas',
                    'view' => 'view_kelas',
                    'edit' => 'edit_kelas',
                    'delete' => 'delete_kelas',
                ],
            ],
            [
                'id' => 'kelas_paralel',
                'name' => 'Rombel Paralel',
                'description' => 'Master pembagian rombongan belajar paralel (A, B, C)',
                'category' => 'Master & Pengaturan',
                'icon' => 'Split',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_kelas_paralel',
                    'view' => 'view_kelas_paralel',
                    'edit' => 'edit_kelas_paralel',
                    'delete' => 'delete_kelas_paralel',
                ],
            ],
            [
                'id' => 'mapels',
                'name' => 'Mata Pelajaran (Mapel)',
                'description' => 'Daftar kurikulum mata pelajaran dan kode pelajaran',
                'category' => 'Master & Pengaturan',
                'icon' => 'BookMarked',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_mapels',
                    'view' => 'view_mapels',
                    'edit' => 'edit_mapels',
                    'delete' => 'delete_mapels',
                ],
            ],
            [
                'id' => 'active_classes',
                'name' => 'Rombel Kelas Aktif',
                'description' => 'Kelas yang beroperasi dan penunjukan wali kelas',
                'category' => 'Master & Pengaturan',
                'icon' => 'Building',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_active_classes',
                    'view' => 'view_active_classes',
                    'edit' => 'edit_active_classes',
                    'delete' => 'delete_active_classes',
                ],
            ],
            [
                'id' => 'active_subjects',
                'name' => 'Distribusi Guru Pengampu',
                'description' => 'Plotting penugasan guru ke kelas dan mata pelajaran',
                'category' => 'Master & Pengaturan',
                'icon' => 'UserCheck',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_active_subjects',
                    'view' => 'view_active_subjects',
                    'edit' => 'edit_active_subjects',
                    'delete' => 'delete_active_subjects',
                ],
            ],
            [
                'id' => 'grade_weights',
                'name' => 'Bobot Nilai & KKM',
                'description' => 'Persentase nilai tugas, UH, PTS, PAS, dan KKM kelulusan',
                'category' => 'Master & Pengaturan',
                'icon' => 'Scale',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_grade_weights',
                    'view' => 'view_grade_weights',
                    'edit' => 'edit_grade_weights',
                    'delete' => 'delete_grade_weights',
                ],
            ],
            [
                'id' => 'education_schedules',
                'name' => 'Pengaturan Jadwal Pelajaran',
                'description' => 'Durasi jam pelajaran, jam istirahat, dan hari efektif KBM',
                'category' => 'Master & Pengaturan',
                'icon' => 'CalendarClock',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_academic_settings',
                    'view' => 'view_academic_settings',
                    'edit' => 'edit_academic_settings',
                    'delete' => 'edit_academic_settings',
                ],
            ],
            [
                'id' => 'unavailable_hours',
                'name' => 'Jam Off & Kuota Mengajar Guru',
                'description' => 'Setting beban jam mengajar dan waktu luang guru',
                'category' => 'Master & Pengaturan',
                'icon' => 'Clock',
                'parent_menu' => 'menu_settings',
                'actions' => ['view', 'edit'],
                'permission_keys' => [
                    'view' => 'view_unavailable_hours',
                    'edit' => 'edit_unavailable_hours',
                ],
            ],
            [
                'id' => 'supervision_settings',
                'name' => 'Pengaturan Supervisi & Angket',
                'description' => 'Butir pertanyaan instrumen penilaian supervisi dan angket',
                'category' => 'Master & Pengaturan',
                'icon' => 'HelpCircle',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_supervisions',
                    'view' => 'view_supervisions',
                    'edit' => 'edit_supervisions',
                    'delete' => 'delete_supervisions',
                ],
            ],
            [
                'id' => 'school_info',
                'name' => 'Identitas Sekolah & Kop Surat',
                'description' => 'Profil madrasah, logo, alamat, email, dan nama kepala sekolah',
                'category' => 'Master & Pengaturan',
                'icon' => 'School',
                'parent_menu' => 'menu_settings',
                'actions' => ['view', 'edit'],
                'permission_keys' => [
                    'view' => 'view_school_info',
                    'edit' => 'edit_school_info',
                ],
            ],
            [
                'id' => 'regions',
                'name' => 'Master Wilayah Administratif',
                'description' => 'Sinkronisasi data daerah Provinsi, Kabupaten/Kota, Kecamatan',
                'category' => 'Master & Pengaturan',
                'icon' => 'MapPin',
                'parent_menu' => 'menu_settings',
                'actions' => ['create', 'view', 'edit'],
                'permission_keys' => [
                    'create' => 'create_regions',
                    'view' => 'view_regions',
                    'edit' => 'edit_regions',
                ],
            ],
            [
                'id' => 'report_settings',
                'name' => 'Pengaturan Cetak Rapor',
                'description' => 'Titimangsa rapor, lokasi pembagian, dan format penandatangan',
                'category' => 'Master & Pengaturan',
                'icon' => 'Printer',
                'parent_menu' => 'menu_settings',
                'actions' => ['view', 'edit'],
                'permission_keys' => [
                    'view' => 'view_report_settings',
                    'edit' => 'edit_report_settings',
                ],
            ],
            [
                'id' => 'character_settings',
                'name' => 'Pengaturan & Kategori Akhlak',
                'description' => 'Kategori adab, jenis pelanggaran, prestasi, dan bobot poin',
                'category' => 'Master & Pengaturan',
                'icon' => 'SlidersHorizontal',
                'parent_menu' => 'menu_care',
                'actions' => ['create', 'view', 'edit', 'delete'],
                'permission_keys' => [
                    'create' => 'create_character_assessments',
                    'view' => 'view_character_assessments',
                    'edit' => 'edit_character_assessments',
                    'delete' => 'delete_character_assessments',
                ],
            ],
        ];
    }

    /**
     * Get all features with auto-discovery for any newly added permissions.
     */
    public static function getAllFeatures(): array
    {
        $catalog = self::getMasterCatalog();
        $knownPermissionNames = [];

        foreach ($catalog as $feature) {
            foreach ($feature['permission_keys'] as $action => $pName) {
                $knownPermissionNames[$pName] = true;
            }
        }

        // Auto-Discovery: Check all permissions in database
        try {
            $allDbPermissions = Permission::orderBy('name')->pluck('name')->toArray();
        } catch (\Exception $e) {
            $allDbPermissions = [];
        }

        $unmappedPermissions = [];
        foreach ($allDbPermissions as $pName) {
            // Ignore system menu headers and excluded internal/admin-only permissions
            if (
                str_starts_with($pName, 'menu_') ||
                in_array($pName, [
                    'view_user_levels', 'create_user_levels', 'edit_user_levels', 'delete_user_levels',
                    'view_access_control', 'edit_access_control',
                    'view_backup', 'create_backup', 'delete_backup',
                    'view_api_keys', 'create_api_keys', 'edit_api_keys', 'delete_api_keys',
                ]) ||
                str_contains($pName, 'backup') ||
                str_contains($pName, 'api_key')
            ) {
                continue;
            }

            if (!isset($knownPermissionNames[$pName])) {
                $unmappedPermissions[] = $pName;
            }
        }

        // Group unmapped permissions into dynamic features
        if (!empty($unmappedPermissions)) {
            $dynamicGroups = [];
            foreach ($unmappedPermissions as $pName) {
                $parts = explode('_', $pName, 2);
                $action = $parts[0];
                $module = $parts[1] ?? 'lainnya';

                // Standard action prefix detection
                $validActions = ['create', 'view', 'edit', 'delete'];
                if (!in_array($action, $validActions)) {
                    $action = 'view';
                    $module = $pName;
                }

                if (!isset($dynamicGroups[$module])) {
                    $dynamicGroups[$module] = [
                        'id' => 'custom_' . $module,
                        'name' => ucwords(str_replace('_', ' ', $module)),
                        'description' => 'Modul kustom / fitur tambahan otomatis',
                        'category' => 'Modul Tambahan / Kustom',
                        'icon' => 'Layers',
                        'parent_menu' => null,
                        'actions' => [],
                        'permission_keys' => [],
                    ];
                }

                if (!in_array($action, $dynamicGroups[$module]['actions'])) {
                    $dynamicGroups[$module]['actions'][] = $action;
                }
                $dynamicGroups[$module]['permission_keys'][$action] = $pName;
            }

            foreach ($dynamicGroups as $dyn) {
                $catalog[] = $dyn;
            }
        }

        return $catalog;
    }
}
