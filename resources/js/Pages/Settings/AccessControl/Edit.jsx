import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft, CheckSquare, Square, Check } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

export default function Edit({ userLevel, groupedPermissions, allPermissions }) {
    const availablePermissions = allPermissions; // Fix for ReferenceError
    const [permissions, setPermissions] = useState(
        userLevel.permissions.map(p => p.id)
    );

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        user_level_id: userLevel.id,
        permission_changes: [],
    });

    const handleCheckboxChange = (permissionId, checked) => {
        let newPermissions = [...permissions];
        if (checked) {
            newPermissions.push(permissionId);
        } else {
            newPermissions = newPermissions.filter(id => id !== permissionId);
        }
        setPermissions(newPermissions);

        // Prepare bulk update payload (simplified for now, ideally we sync all)
        // Actually, let's just sync the whole list status for the changed item
        // But the controller expects a diff or specific changes.
        // Let's change Controller logic or just send "permission_changes"

        // For simplicity, we track changes relative to INITIAL state or just all current state?
        // The controller bulkUpdate implementation expects { permission_id, has_access } loop.
        // Let's accumulate changes.

        const existingChangeIndex = data.permission_changes.findIndex(c => c.permission_id === permissionId);
        const newChanges = [...data.permission_changes];

        if (existingChangeIndex >= 0) {
            newChanges[existingChangeIndex] = { permission_id: permissionId, has_access: checked };
        } else {
            newChanges.push({ permission_id: permissionId, has_access: checked });
        }

        setData('permission_changes', newChanges);
    };

    // Explicit toggle handler for my custom div
    const handleToggle = (permissionId) => {
        const isChecked = permissions.includes(permissionId);
        handleCheckboxChange(permissionId, !isChecked);
    };

    // Group helper
    const getPerm = (groupName, action) => {
        const group = groupedPermissions[groupName];
        if (!group) return null;
        return group.find(p => p.name.startsWith(action + '_'));
    };

    // --- SMART TRANSLATION SYSTEM ---
    const moduleTranslations = {
        // --- MASTER DATA ---
        'school_info': { title: 'Identitas Sekolah', desc: 'Profil sekolah untuk kop surat & laporan' },
        'academic_years': { title: 'Tahun Pelajaran', desc: 'Setting tahun ajaran baru & aktif' },
        'jenjangs': { title: 'Jenjang Pendidikan', desc: 'Level sekolah (SD/SMP/SMA)' },
        'kelas': { title: 'Data Kelas', desc: 'Master nama kelas (7A, 8B, dst)' },
        'kelas_paralel': { title: 'Rombel / Paralel', desc: 'Kelompok kelas lebih spesifik' },
        'kamars': { title: 'Data Asrama', desc: 'Gedung & kamar santri' },
        'mapels': { title: 'Mata Pelajaran', desc: 'Daftar pelajaran sekolah' },
        'kkms': { title: 'KKM', desc: 'Standar nilai minimal kelulusan' },
        'grade_weights': { title: 'Bobot Nilai', desc: 'Persentase nilai tugas/ujian di rapor' },
        'pekans': { title: 'Pekan Efektif', desc: 'Minggu belajar dalam satu semester' },
        'days': { title: 'Hari Sekolah', desc: 'Hari efektif KBM' },
        'regions': { title: 'Wilayah', desc: 'Data daerah (Provinsi - Kecamatan)' },

        // --- PENGGUNA ---
        'users': { title: 'Manajemen User', desc: 'Akun login guru/admin/staff' },
        'user_levels': { title: 'Role & Jabatan', desc: 'Hak akses (Kepsek, Guru, Admin)' },
        'access_control': { title: 'Kontrol Akses', desc: 'Atur detail izin per role' },
        'students': { title: 'Data Santri', desc: 'Biodata lengkap siswa' },
        'teacher_quotas': { title: 'Kuota Mengajar', desc: 'Beban jam mengajar guru' },
        'unavailable_hours': { title: 'Jam Kosong Guru', desc: 'Waktu guru tidak bisa mengajar' },
        'import': { title: 'Import Data', desc: 'Upload data massal via Excel' },

        // --- AKADEMIK & KBM ---
        'active_classes': { title: 'Kelas Aktif', desc: 'Kelas yang beroperasi tahun ini' },
        'active_subjects': { title: 'Guru Pengampu', desc: 'Plotting guru ke mata pelajaran' },
        'class_members': { title: 'Anggota Kelas', desc: 'Siswa yang masuk di kelas ini' },
        'academic_schedules': { title: 'Jadwal Pelajaran', desc: 'Roster pelajaran mingguan' },
        'learning_hours': { title: 'Jam KBM', desc: 'Durasi per jam pelajaran' },
        'silabus': { title: 'Silabus / RPP', desc: 'Dokumen rencana pembelajaran' },
        'journals': { title: 'Jurnal Kelas', desc: 'Absensi harian & materi ajar' },
        'attendances': { title: 'Absensi Siswa', desc: 'Kehadiran siswa di kelas' },

        // --- KEPENGASUHAN ---
        'active_kamars': { title: 'Penghuni Asrama', desc: 'Plotting santri ke kamar' },
        'kamar_members': { title: 'Anggota Kamar', desc: 'List santri per kamar' },
        'permissions': { title: 'Perizinan', desc: 'Izin pulang/keluar/sakit santri' },
        'health_records': { title: 'Kesehatan (UKS)', desc: 'Rekam medis & sakit santri' },
        'character_assessments': { title: 'Penilaian Akhlak', desc: 'Poin perilaku & ibadah' },
        'character_categories': { title: 'Kategori Akhlak', desc: 'Master aspek penilaian perilaku' },
        'achievements': { title: 'Prestasi', desc: 'Pencatatan lomba/juara santri' },
        'violations': { title: 'Pelanggaran', desc: 'Pencatatan poin pelanggaran' },
        'pickets': { title: 'Piket Guru', desc: 'Jadwal & laporan guru piket' },

        // --- TAHFIDZ ---
        'tahfidz': { title: 'Data Tahfidz', desc: 'Hafalan Al-Quran santri' },
        'halaqoh': { title: 'Halaqoh', desc: 'Kelompok mengaji / halaqoh' },
        'tahfidz_testers': { title: 'Penguji Tahfidz', desc: 'Data penguji hafalan' },
        'all_tahfidz_grades': { title: 'Nilai Semua Kelas', desc: 'Melihat nilai seluruh santri (Bahaya untuk Guru)' },
        'tahfidz_achievements': { title: 'Capaian Hafalan', desc: 'Grafik/Data hafalan santri' },
        'tahfidz_halaqoh': { title: 'Kelompok Halaqoh', desc: 'Manajemen kelompok ngaji' },

        // --- PENILAIAN ---
        'assessments': { title: 'Input Nilai', desc: 'Nilai Tugas/UH/UTS/UAS' },
        'reports': { title: 'Rapor Akademik', desc: 'Cetak rapor siswa' },
        'legers': { title: 'Leger Nilai', desc: 'Rekap nilai satu angkuran lebihat' },
        'grade_recap': { title: 'Rekap Mapel', desc: 'Sebaran nilai per pelajaran' },
        'class_recap': { title: 'Rekap Kelas', desc: 'Ranking & rata-rata kelas' },
        'student_recap': { title: 'Rekap Siswa', desc: 'Transkrip nilai individu' },

        // --- DASHBOARD ---
        'dashboard_stats': { title: 'Statistik', desc: 'Grafik siswa/guru di dashboard' },
        'dashboard_calendar': { title: 'Kalender', desc: 'Agenda di dashboard' },
        'dashboard_announcements': { title: 'Pengumuman', desc: 'Info papan pengumuman' },

        // --- MENUS ---
        'menu_dashboard': { title: 'Menu Dashboard', desc: 'Akses ke halaman utama' },
        'menu_academic': { title: 'Menu Akademik', desc: 'Sidebar menu pendidikan' },
        'menu_care': { title: 'Menu Pengasuhan', desc: 'Sidebar menu asrama' },
        'menu_finance': { title: 'Menu Keuangan', desc: 'Sidebar menu bayaran' },
        'menu_settings': { title: 'Menu Pengaturan', desc: 'Sidebar menu setting' },
        'menu_tahfidz': { title: 'Menu Tahfidz', desc: 'Sidebar menu quran' },
        'menu_tahfidz_assessment': { title: 'Menu Penilaian Tahfidz', desc: 'Akses tombol sidebar Penilaian' },
        'menu_tahfidz_recap': { title: 'Menu Rekap Nilai', desc: 'Akses tombol sidebar Rekap' },
        'menu_analysis': { title: 'Menu Analisis', desc: 'Sidebar menu statistik' },

        // --- PENGATURAN UMUM (Added based on feedback) ---
        'academic_settings': { title: 'Pengaturan Akademik', desc: 'Setting kurikulum & aturan akademik' },
        'settings': { title: 'Pengaturan Umum', desc: 'Konfigurasi dasar aplikasi' },
        'master_general_settings': { title: 'Master Umum', desc: 'Data master non-akademik' },
        'master_education_settings': { title: 'Master Pendidikan', desc: 'Data master pendidikan' },

        // --- UJIAN & CBT ---
        'ujians': { title: 'Data Ujian / Asesmen', desc: 'Jadwal & bank soal ujian' },
        'exam_schedules': { title: 'Jadwal Ujian', desc: 'Waktu pelaksanaan ujian' },
        'question_banks': { title: 'Bank Soal', desc: 'Kumpulan soal ujian' },

        // --- DASHBOARD ITEMS ---
        'dashboard': { title: 'Dashboard', desc: 'Halaman utama' },
        'stats': { title: 'Statistik', desc: 'Widget statistik' },
        'calendar': { title: 'Kalender', desc: 'Widget agenda' },
        'announcements': { title: 'Pengumuman', desc: 'Papan informasi sekolah' },

        // --- PENGATURAN & MASTER TAMBAHAN ---
        'education': { title: 'Pengaturan Pendidikan', desc: 'Konfigurasi kurikulum & akademik' },
        'master_education': { title: 'Master Data Pendidikan', desc: 'Data referensi pendidikan' },
        'care': { title: 'Pengaturan Pengasuhan', desc: 'Konfigurasi asrama & kedisiplinan' },
        'master_care': { title: 'Master Data Pengasuhan', desc: 'Data referensi pengasuhan' },
        'student_academic': { title: 'Menu Akademik Santri', desc: 'Akses fitur akademik santri' },

        // --- AKADEMIK & PENILAIAN ---
        'kkm': { title: 'KKM', desc: 'Kriteria Ketuntasan Minimal' },
        'report_notes': { title: 'Catatan Rapor', desc: 'Catatan wali kelas untuk rapor' },
        'learning_analysis': { title: 'Analisis Pembelajaran', desc: 'Statistik perkembangan belajar' },
        'grade_analysis': { title: 'Analisis Nilai', desc: 'Statistik perolehan nilai' },
        'supervisions': { title: 'Supervisi Guru', desc: 'Penilaian kinerja guru' },

        // --- KEPENGASUHAN ---
        'student_permissions': { title: 'Perizinan Santri', desc: 'Keluar/masuk & izin pulang' },
        'rfid_scanner': { title: 'Scanner RFID', desc: 'Fitur tap kartu untuk absen/kantin' },

        // --- FITUR MANDIRI SANTRI (View Own ...) ---
        'own_biodata': { title: 'Biodata Diri', desc: 'Profil lenkap santri' },
        'own_grades': { title: 'Nilai Saya', desc: 'Riwayat nilai & rapor' },
        'own_schedule': { title: 'Jadwal Saya', desc: 'Jadwal pelajaran pribadi' },
        'own_finance': { title: 'Keuangan Saya', desc: 'Tagihan & riwayat pembayaran' },
        'own_achievements': { title: 'Prestasi Saya', desc: 'Catatan prestasi diri' },
        'own_violations': { title: 'Pelanggaran Saya', desc: 'Catatan poin disiplin' },
        'change_password': { title: 'Ganti Password', desc: 'Izin mengubah password akun sendiri' },


        'payments': { title: 'Pembayaran', desc: 'Transaksi keuangan santri' },
        'bills': { title: 'Tagihan', desc: 'Data tagihan SPP dll' },
        'payment_types': { title: 'Jenis Pembayaran', desc: 'Master kategori pembayaran' },
    };

    const formatSmartLabel = (permissionName) => {
        // 1. Check Exact Match
        if (moduleTranslations[permissionName]) {
            return {
                title: moduleTranslations[permissionName].title,
                desc: moduleTranslations[permissionName].desc
            };
        }

        // 2. Parse Actions (view_, create_, edit_, delete_)
        const actions = {
            'view': 'Lihat',
            'create': 'Tambah',
            'edit': 'Ubah',
            'delete': 'Hapus',
            'manage': 'Kelola',
            'print': 'Cetak',
            'import': 'Import'
        };

        const parts = permissionName.split('_');
        const prefix = parts[0];

        if (actions[prefix]) {
            const moduleKey = parts.slice(1).join('_');
            const translation = moduleTranslations[moduleKey];

            if (translation) {
                return {
                    title: `${actions[prefix]} ${translation.title}`,
                    // desc: `${actions[prefix]} data ${translation.title.toLowerCase()}`
                    desc: translation.desc // Keep context simple
                };
            }
        }

        // 3. Fallback: Pretty Formatting
        const fallbackTitle = permissionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return { title: fallbackTitle, desc: '-' };
    };

    // --- GROUP DEFINITIONS (Shared between Render & Logic) ---
    // --- GROUP DEFINITIONS (Shared between Render & Logic) ---
    const groups = [
        { title: 'MENU UTAMA & DASHBOARD', keywords: ['menu_dashboard', 'dashboard', 'stats', 'calendar', 'announcements', 'own', 'change_password'] },
        // Moved UP to prevent keyword conflicts (e.g. 'recap' in 'menu_tahfidz_recap' being stolen by Academic)
        { title: 'TAHFIDZ AL-QURAN', keywords: ['menu_tahfidz', 'tahfidz', 'halaqoh'] },
        { title: 'KEPENGASUHAN', keywords: ['menu_care', 'care', 'pickets', 'students', 'character', 'kamars', 'permissions', 'health', 'rfid'] },
        { title: 'AKADEMIK & KBM', keywords: ['menu_academic', 'assessments', 'recap', 'reports', 'silabus', 'schedules', 'journals', 'attendance', 'rpp', 'ujians', 'exam', 'question_banks', 'kkm', 'report_notes', 'learning_analysis', 'grade_analysis', 'supervisions'] },
        { title: 'KEUANGAN', keywords: ['menu_finance', 'finance', 'payments', 'bills', 'payment_types'] },
        { title: 'MASTER DATA', keywords: ['school_info', 'academic_years', 'jenjangs', 'regions', 'days', 'pekans', 'mapels', 'kkms', 'kelas', 'active_classes', 'active_subjects', 'academic_settings', 'master_general', 'master_education', 'master_care', 'education', 'settings_care'] },
        { title: 'PENGATURAN SISTEM', keywords: ['menu_settings', 'users', 'access_control', 'user_levels', 'settings'] },
    ];

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.access-control.bulk-update'));
    };

    const toggleGroup = (groupTitle, check) => {
        let permsInGroup = [];

        if (groupTitle === 'LAIN-LAIN') {
            // Find permissions NOT in any other group
            permsInGroup = availablePermissions.filter(p => {
                // Check if any group keyword matches
                const assigned = groups.some(g => g.keywords.some(k => p.name.includes(k)));
                return !assigned;
            });
        } else {
            // Standard Group Logic
            const groupDef = groups.find(g => g.title === groupTitle);
            if (!groupDef) return;

            // Find all permissions that belong to this group based on keywords
            permsInGroup = availablePermissions.filter(p =>
                groupDef.keywords.some(k => p.name.includes(k))
            );
        }

        let newPermissions = [...permissions];
        let newChanges = [...data.permission_changes];

        permsInGroup.forEach(p => {
            const isChecked = newPermissions.includes(p.id);
            if (check && !isChecked) {
                newPermissions.push(p.id);
                // Add change
                const idx = newChanges.findIndex(c => c.permission_id === p.id);
                if (idx >= 0) newChanges[idx] = { permission_id: p.id, has_access: true };
                else newChanges.push({ permission_id: p.id, has_access: true });
            } else if (!check && isChecked) {
                newPermissions = newPermissions.filter(id => id !== p.id);
                // Add change
                const idx = newChanges.findIndex(c => c.permission_id === p.id);
                if (idx >= 0) newChanges[idx] = { permission_id: p.id, has_access: false };
                else newChanges.push({ permission_id: p.id, has_access: false });
            }
        });

        setPermissions(newPermissions);
        setData('permission_changes', newChanges);
    };

    // Standard Presets (Based on System Defaults & User Request)
    const standardPresets = {
        'Guru': [
            'menu_dashboard', 'menu_academic', 'change_password',
            'view_dashboard_stats', 'view_dashboard_calendar', 'view_dashboard_announcements',
            'view_academic_schedules', 'view_silabus',
            'view_assessments', 'create_assessments', 'edit_assessments',
            'view_journals', 'create_journals', 'edit_journals',
            'view_supervision_rpps', 'view_pickets',
            'view_active_subjects', 'view_students', 'view_class_members',
        ],
        'Wali Kelas': [
            'menu_dashboard', 'menu_academic', 'menu_analysis', 'menu_care', 'change_password',
            'view_dashboard_stats', 'view_dashboard_calendar', 'view_dashboard_announcements',
            'view_academic_schedules', 'view_silabus',
            'view_assessments', 'create_assessments', 'edit_assessments',
            'view_journals', 'create_journals', 'edit_journals',
            'view_supervision_rpps', 'view_pickets',
            'view_students', 'view_class_members',
            'view_reports', 'create_report_notes',
            'view_grade_recap', 'view_class_recap', 'view_student_recap',
            'view_active_classes',
            'view_learning_analysis', 'view_grade_analysis',
            'view_permissions', 'create_permissions',
            'view_health_records',
            'view_character_assessments', 'create_character_assessments',
            'view_achievements', 'create_achievements',
            'view_violations', 'create_violations',
        ],
        'Musrif': [
            'menu_dashboard', 'menu_care', 'menu_tahfidz', 'change_password',
            'view_dashboard_stats',
            'view_kamars', 'view_kamar_members', 'view_active_kamars',
            'view_students',
            'view_permissions', 'create_permissions',
            'view_health_records',
            'view_character_assessments', 'create_character_assessments',
            'view_achievements', 'create_achievements',
            'view_violations', 'create_violations',
        ],
        'Santri': [
            'view_own_biodata', 'view_own_grades', 'view_own_schedule', 'view_own_finance',
            'menu_dashboard', 'menu_student_academic', 'change_password'
        ]
    };

    const applyPreset = () => {
        const preset = standardPresets[userLevel.name];
        if (!preset) return;

        const presetIds = [];
        preset.forEach(name => {
            const perm = availablePermissions.find(p => p.name === name);
            if (perm) presetIds.push(perm.id);
        });

        setPermissions(presetIds);

        const newChanges = availablePermissions.map(p => ({
            permission_id: p.id,
            has_access: presetIds.includes(p.id)
        }));

        setData('permission_changes', newChanges);
    };

    return (
        <MainLayout>
            <Head title={`Edit Akses - ${userLevel.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('settings.access-control.index')} className="p-2 rounded-full hover:bg-muted">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Edit Hak Akses: {userLevel.name}
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        {standardPresets[userLevel.name] && (
                            <button
                                type="button"
                                onClick={applyPreset}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                                Reset Standar
                            </button>
                        )}
                        <PrimaryButton onClick={submit} disabled={processing} className="gap-2">
                            <Save className="h-4 w-4" />
                            Simpan Perubahan
                        </PrimaryButton>
                    </div>
                </div>

                {/* GROUPED RENDERING (SMART NO DUPES) */}
                {(() => {
                    // groups is now defined in component scope

                    const buckets = {};
                    groups.forEach(g => { buckets[g.title] = []; });
                    buckets['LAIN-LAIN'] = [];

                    availablePermissions.forEach(p => {
                        let assigned = false;
                        for (const group of groups) {
                            if (group.keywords.some(k => p.name.includes(k))) {
                                buckets[group.title].push(p);
                                assigned = true;
                                break;
                            }
                        }
                        if (!assigned) buckets['LAIN-LAIN'].push(p);
                    });

                    return [...groups, { title: 'LAIN-LAIN' }].map(group => {
                        const perms = buckets[group.title];
                        if (!perms || perms.length === 0) return null;

                        return (
                            <div key={group.title} className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                                <div className="bg-muted/50 px-6 py-4 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-lg tracking-tight">{group.title}</h3>
                                    <div className="flex gap-2 text-xs">
                                        <button type="button" onClick={() => toggleGroup(group.title, true)} className="text-primary hover:underline">Pilih Semua</button>
                                        <span className="text-muted-foreground">/</span>
                                        <button type="button" onClick={() => toggleGroup(group.title, false)} className="text-destructive hover:underline">Hapus Semua</button>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {perms.map((permission) => {
                                        // SMART LABEL LOGIC:
                                        // 1. Try Manual Dictionary (Edit.jsx)
                                        // 2. Try Database Description (permission.description)
                                        // 3. Fallback to Auto-Formatting
                                        const getLabel = (p) => {
                                            const name = p.name;

                                            // 1. Manual Dictionary
                                            if (moduleTranslations[name]) {
                                                return moduleTranslations[name];
                                            }

                                            // 2. Parsed Actions (view_, etc) linked to Dictionary
                                            const parts = name.split('_');
                                            const prefix = parts[0];
                                            const actions = {
                                                'view': 'Lihat', 'create': 'Tambah', 'edit': 'Ubah',
                                                'delete': 'Hapus', 'manage': 'Kelola', 'menu': 'Menu'
                                            };

                                            if (actions[prefix]) {
                                                const moduleKey = parts.slice(1).join('_');
                                                if (moduleTranslations[moduleKey]) {
                                                    return {
                                                        title: `${actions[prefix]} ${moduleTranslations[moduleKey].title}`,
                                                        desc: moduleTranslations[moduleKey].desc
                                                    };
                                                }
                                            }

                                            // 3. Database Description (Dynamic Fallback)
                                            if (p.description && p.description !== '-') {
                                                return { title: p.description, desc: name }; // Show tech name in desc
                                            }

                                            // 4. Raw Formatter
                                            return {
                                                title: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                desc: '-'
                                            };
                                        };

                                        const { title, desc } = getLabel(permission);
                                        const isChecked = permissions.includes(permission.id);

                                        return (
                                            <div
                                                key={permission.id}
                                                onClick={() => handleToggle(permission.id)}
                                                className={`
                                                    group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none
                                                    ${isChecked
                                                        ? 'bg-primary/5 border-primary/20 shadow-sm'
                                                        : 'bg-background hover:bg-muted/50 hover:border-muted-foreground/25'}
                                                `}
                                            >
                                                <div className={`
                                                    mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-all duration-200
                                                    ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 group-hover:border-primary/50'}
                                                `}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium leading-none ${isChecked ? 'text-primary' : 'text-foreground/90'}`}>
                                                        {title}
                                                    </span>
                                                    {desc && desc !== '-' && (
                                                        <span className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                                            {desc}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
        </MainLayout>
    );
}
