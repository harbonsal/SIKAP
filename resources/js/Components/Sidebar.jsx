import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Home, Users, BookOpen, Heart, Settings, ChevronDown, ChevronRight, Database, Calendar, FileText, GraduationCap, ClipboardCheck, Book, User, Search, Banknote, LogOut, Trash2, Download, Cpu, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    {
        title: "Dashboard",
        icon: Home,
        href: "dashboard",
        active: "dashboard",
        // Semua user yang login berhak melihat tombol Dashboard
    },
    // Al-Quran Digital — accessible to all roles including Santri
    {
        title: "Al-Quran Digital",
        icon: BookOpen,
        children: [
            { title: "Skrining", href: "quran.skrining" },
            { title: "Tilawah", href: "quran.tilawah" },
        ],
        // no permission required so Santri can access
    },
    // DIVISI 1: PENDIDIKAN (Fokus: KBM & Tahfidz)
    {
        title: "Pendidikan",
        icon: BookOpen,
        permission: 'menu_academic',
        children: [
            { title: "Kalender Pendidikan", href: "academic-calendar.index" },
            {
                title: "Penilaian & Rapor",
                children: [
                    { title: "Input Nilai", href: "assessments.index", permission: 'view_assessments', requiresTeachingLoad: true },
                    { title: "Rekap Nilai", href: "recap.class.index", permission: 'view_grade_recap', roles: ['Administrator', 'Wali Kelas'] },
                    { title: "Rekap Per Santri", href: "recap.student.index", permission: 'view_grade_recap', roles: ['Administrator', 'Wali Kelas'] },
                    { title: "Cetak Rapor SM1", href: "reports.index", params: { semester: 'Ganjil' }, permission: 'view_reports' },
                    { title: "Cetak Rapor SM2", href: "reports.index", params: { semester: 'Genap' }, permission: 'view_reports' },
                    { title: "Cetak Ijazah", href: "reports.index", params: { type: 'ijazah' }, permission: 'view_reports' },
                    { title: "Analisis Data", href: "analysis.index", permission: 'menu_analysis' },
                ],
            },
            {
                title: "KBM & Kurikulum",
                children: [
                    { title: "Daftar Pengajar", href: "daftar-pengajar.index" },
                    { title: "Silabus & Materi", href: "silabus.index", permission: 'view_silabus', requiresTeachingLoad: true },
                    { title: "Absensi & Jurnal", href: "journals.index", permission: 'view_journals', requiresTeachingLoad: true },
                    { title: "Input Absensi Manual", href: "journals.manual.index", permission: 'input_manual_attendance' }, // Strict: Wali Kelas+
                    { title: "RPP / Modul Ajar", href: "supervision-rpps.index", permission: 'view_supervision_rpps' },
                    { title: "Ikhtabir Nafsi (Tes AI)", href: "ikhtabir-nafsi.index", icon: Bot, roles: ['Guru', 'Administrator', 'Wali Kelas'] }, // NEW MENu
                    { title: "Cetak Absensi Manual", href: "attendance.print.index", permission: 'print_manual_attendance' }, // Strict: Admin
                ]
            },
            { title: "Cari & Biodata Santri", href: "students.index", permission: 'view_students' },
            { title: "Manajemen Ijazah", href: "academic.ijazah.index", permission: 'manage_ijazah' }, 
            {
                title: "Supervisi Guru",
                permission: 'menu_supervision', // NEW LOCK
                children: [
                    { title: "Penilaian Supervisi", href: "supervisions.index" },
                    { title: "Supervisi AI Assistant", href: "supervisions.ai.create", icon: Cpu },
                    { title: "RPP Generator", href: "rpp-generator.index" },
                ]
            },
            {
                title: "Rapor Supervisi Saya",
                href: "supervisions.me", // Dedicated secure route
                permission: 'view_own_supervision', // Control via Access Settings
                hideIfPermission: 'menu_supervision', // Still hide if user has full access (Optional, user might want both)
            },
        ]
    },
    {
        title: "Tahfidz Al-Qur'an",
        icon: Book,
        permission: 'menu_tahfidz', // Controls entire sidebar group visibility
        children: [
            // { title: "Menu Tahfidz", href: "tahfidz.dashboard", permission: 'menu_tahfidz', hideIfRoles: ['Guru', 'Wali Kelas'] }, // REMOVED (Broken Link)
            { title: "Penilaian Tahfidz", href: "tahfidz.assessments.index", permission: 'menu_tahfidz_assessment' }, // Controlled Permission
            { title: "Rekap Nilai", href: "tahfidz.recap.index", permission: 'menu_tahfidz_recap' }, // Controlled Permission
            { title: "Pantau Skrining", href: "tahfidz.pantau-skrining", roles: ['Administrator', 'Manager Tahfidz'] },
            { title: "Capaian Hafalan", href: "tahfidz.achievements.index", permission: 'view_tahfidz_achievements' },
            { title: "Pantauan Halaqoh", href: "tahfidz.monitoring.index", permission: 'view_tahfidz_halaqoh' },
            { title: "Analisa Tahfidz", href: "tahfidz.analysis.index", permission: 'view_tahfidz_analysis' },
        ]
    },
    // DIVISI 2: PENGASUHAN (Fokus: Asrama & Akhlak)
    {
        title: "Pengasuhan",
        icon: Heart,
        permission: 'menu_care', // NEW LOCK
        children: [
            {
                title: "Penilaian Akhlak",
                children: [
                    { title: "Input Akhlak", href: "assessments.character.index", permission: 'view_character_input' },
                    { title: "Rekap Kamar SM1 (Jul-Des)", href: "assessments.character.recap.index", params: { semester: 1 }, permission: 'view_character_recap' },
                    { title: "Rekap Kamar SM2 (Jan-Jun)", href: "assessments.character.recap.index", params: { semester: 2 }, permission: 'view_character_recap' },
                    { title: "Rekap Per Santri", href: "assessments.character.recap.student.index", permission: 'view_character_recap' },
                    { title: "Analisa Nilai Akhlak", href: "assessments.character.analysis.index", permission: 'view_character_recap' },
                ]
            },
            {
                title: "Keasramaan",
                children: [
                    { title: "Plotting Anggota Kamar", href: "kamar-members.index", permission: 'view_kamar_members' },
                ]
            },
            { title: "Perizinan Santri", href: "permissions.index", permission: 'view_permissions' },
            {
                title: "Kesehatan",
                children: [
                    { title: "Input Kesehatan", href: "health.records.create", permission: 'create_health_record' },
                    { title: "Pantauan Kesehatan", href: "health.records.index", permission: 'view_health_stats' },
                ]
            },
        ]
    },
    // DIVISI 3: KEUANGAN
    {
        title: "Keuangan",
        icon: Banknote,
        permission: 'menu_finance', // NOW CONTROLLED BY PERMISSION
        children: [
            { title: "Pembayaran", href: "#" },
            { title: "Tagihan", href: "#" },
            { title: "Laporan Keuangan", href: "#" },
        ]
    },
    {
        title: "Portal Santri",
        icon: GraduationCap,
        roles: ['Santri', 'Siswa'],
        children: [
            { title: "Nilai Akademik", href: "students.grades.index" },
            { title: "Nilai Tahfidz", href: "students.tahfidz.index" },
            { title: "Riwayat Skrining", href: "tahfidz.pantau-skrining" },
            { title: "Riwayat Kesehatan", href: "students.health.index" },
            { title: "Isi Angket Supervisi", href: "student.supervisions.index" },
        ]
    },
    // DIVISI 4: PENGATURAN
    {
        title: "Pengaturan",
        icon: Settings,
        children: [
            { title: "Manajemen User", href: "users.index", permission: 'view_users', roles: ['Administrator'] },
            { title: "Menu Tersembunyi", href: "settings.hidden-menu.index", roles: ['Administrator'] },
            { title: "Pengaturan Tahun Pelajaran", href: "settings.academic.index", roles: ['Administrator'] },
            {
                title: "Master Pendidikan",
                roles: ['Administrator'],
                children: [
                    { title: "Data Kelas", href: "kelas.index" },
                    { title: "Mata Pelajaran", href: "mapels.index" },
                    { title: "Bobot Nilai", href: "grade-weights.index" },
                    { title: "Anggota Kelas", href: "class-members.index" },
                    { title: "Pengaturan Jadwal Pelajaran", href: "settings.education.schedules.index" },
                    { title: "Plotting Guru", href: "settings.education.schedules.index", params: { tab: 'teachers' } },
                    { title: "Distribusi Jam Mengajar", href: "settings.education.schedules.index", params: { tab: 'distribution' } },
                    { title: "Pengaturan Supervisi", href: "supervision-settings.index" },
                    { title: "Pertanyaan Angket Santri", href: "supervision-settings.student-questionnaires.index" },
                    { title: "Pengaturan Ijazah", href: "settings.education.ijazah.index" },
                    { title: "Metode Mengajar", href: "settings.teaching-methods.index" },
                ]
            },
            {
                title: "Master Tahfidz",
                roles: ['Administrator', 'Manager Tahfidz'],
                children: [
                    { title: "Pengaturan Tahfidz", href: "settings.tahfidz.index", roles: ['Administrator', 'Manager Tahfidz'] },
                    { title: "Pengaturan Halaqoh", href: "tahfidz.halaqoh-settings.index", permission: 'view_tahfidz_halaqoh' },
                ]
            },
            {
                title: "Master Sekolah",
                roles: ['Administrator'],
                children: [
                    { title: "Identitas Sekolah", href: "settings.school-info.index" },
                    { title: "Manajemen Akses", href: "settings.access-control.index" },
                    { title: "Manajemen API Key", href: "settings.api-keys.index" },
                    { title: "Tes API Key", href: "settings.api-keys.tester", fallbackPath: "/settings/system/api-keys/tester" },
                    { title: "Level Pengguna", href: "user-levels.index" },
                    { title: "Backup Sistem", href: "settings.system.backup.index" },
                ]
            },
            {
                title: "Master Pengasuhan",
                roles: ['Administrator'],
                children: [
                    { title: "Pengaturan Akhlak", href: "settings.master.character-settings.index" },
                    { title: "Kategori Akhlak", href: "master.character-categories.index" },
                    { title: "Data Kamar Fisik", href: "kamars.index" },
                    { title: "Kamar & Musrif Aktif", href: "active-kamars.index" },
                ]
            },
        ]
    },
];

export default function Sidebar({ className }) {
    const { auth, url, quran_settings, app_settings } = usePage().props;
    const userRole = auth.user?.user_level?.name || 'Guest';
    const [openMenus, setOpenMenus] = useState({});
    const isQuranSkriningEnabled = quran_settings?.skrining_enabled !== false;

    // Helper to check permission and roles
    const checkAccess = (item) => {
        const permissions = auth.user?.permissions || [];
        const userRoles = auth.user?.roles || [auth.user?.user_level?.name || 'Guest'];
        const hasTeachingLoad = auth.user?.has_teaching_load; 

        if (item.hideIfPermission) {
            if (permissions.includes(item.hideIfPermission) || userRoles.includes('Administrator')) {
                return false;
            }
        }

        if (item.requiresTeachingLoad) {
            if (!userRoles.includes('Administrator') && !userRoles.includes('Manager') && !hasTeachingLoad) {
                return false;
            }
        }

        if ((userRoles.includes('Administrator') || userRoles.includes('Manager')) && !item.strictRoles) return true;

        if (item.roles && Array.isArray(item.roles)) {
            const hasRole = item.roles.some(role => userRoles.includes(role));
            if (!hasRole) {
                return false;
            }
        }

        if (item.permission) {
            if (!permissions.includes(item.permission)) {
                return false;
            }
        }

        return true;
    };

    useEffect(() => {
        const newOpenMenus = {};
        const checkIsActive = (href, params) => {
            try {
                if (!href || href === '#') return false;
                const isRouteMatch = route().current(href);
                if (!isRouteMatch) return false;

                if (params) {
                    const currentParams = new URLSearchParams(window.location.search);
                    const currentRouteParams = route().params;

                    for (const [key, value] of Object.entries(params)) {
                        const currentVal = currentParams.get(key) || currentRouteParams[key];
                        if (currentVal != value) return false;
                    }
                }
                return true;
            } catch (error) {
                return false;
            }
        };

        navItems.forEach(item => {
            if (item.children) {
                let isGroupActive = false;
                item.children.forEach(child => {
                    const isChildActive = checkIsActive(child.href, child.params);
                    if (isChildActive) isGroupActive = true;

                    if (child.children) {
                        const isGrandChildActive = child.children.some(grandChild =>
                            checkIsActive(grandChild.href, grandChild.params)
                        );
                        if (isGrandChildActive) {
                            newOpenMenus[child.title] = true;
                            isGroupActive = true;
                        }
                    }
                });
                if (isGroupActive) newOpenMenus[item.title] = true;
            }
        });
        setOpenMenus(newOpenMenus);
    }, [url]);

    const toggleMenu = (title) => {
        setOpenMenus(prev => {
            const isTopLevel = navItems.some(item => item.title === title);
            if (isTopLevel) {
                const newOpenMenus = {};
                Object.keys(prev).forEach(key => {
                    const keyIsTopLevel = navItems.some(item => item.title === key);
                    if (!keyIsTopLevel) newOpenMenus[key] = prev[key];
                });
                newOpenMenus[title] = !prev[title];
                return newOpenMenus;
            }
            return { ...prev, [title]: !prev[title] };
        });
    };

    const safeRoute = (name, params = {}, fallbackPath = '#') => {
        try { return name === '#' ? fallbackPath : route(name, params); } catch (e) { return fallbackPath; }
    };

    const safeIsActive = (name, params = {}) => {
        try {
            if (name === '#') return false;
            const isRouteMatch = route().current(name);
            if (!isRouteMatch) return false;
            if (params && Object.keys(params).length > 0) {
                const currentParams = new URLSearchParams(window.location.search);
                const currentRouteParams = route().params;
                for (const [key, value] of Object.entries(params)) {
                    const currentVal = currentParams.get(key) || currentRouteParams[key];
                    if (currentVal != value) return false;
                }
            }
            return true;
        } catch (e) { return false; }
    };

    const isItemDisabled = (item) => item.href === 'quran.skrining' && !isQuranSkriningEnabled;

    const filterItemsBetter = (items) => {
        const result = [];
        items.forEach(item => {
            if (!checkAccess(item)) return;
            if (item.children) {
                const visibleChildren = filterItemsBetter(item.children);
                if (visibleChildren.length > 0) result.push({ ...item, children: visibleChildren });
            } else {
                result.push(item);
            }
        });
        return result;
    }

    const filteredNavItems = filterItemsBetter(navItems);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    return (
        <div className={cn("flex flex-col h-screen w-64 bg-background/95 backdrop-blur-sm border-r border-border", className)}>
            {/* Logo — fixed at top */}
            <div className="flex-shrink-0 px-7 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <img src={app_settings?.app_logo || "/images/logo.png"} alt="Logo" className="h-8 w-auto" />
                    <h2 className="text-lg font-bold tracking-tight text-foreground">{app_settings?.app_name || "SIKAP Lembaga Anda"}</h2>
                </div>
            </div>

            {/* Scrollable nav area */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {filteredNavItems.map((item, index) => (
                            <div key={index}>
                                {item.children ? (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(item.title)}
                                            className={cn(
                                                "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                                                openMenus[item.title]
                                                    ? "text-indigo-900 bg-white/40 shadow-sm ring-1 ring-black/5"
                                                    : "text-muted-foreground hover:bg-white/30 hover:text-indigo-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-1 rounded-md transition-colors", openMenus[item.title] ? "bg-indigo-100 text-indigo-600" : "text-muted-foreground group-hover:text-indigo-600")}>
                                                    {item.icon && <item.icon className="h-4 w-4" />}
                                                </div>
                                                {item.title}
                                            </div>
                                            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200 opacity-50", openMenus[item.title] && "rotate-90 text-indigo-500")} />
                                        </button>
                                        {openMenus[item.title] && (
                                            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-indigo-100 pl-3">
                                                {item.children.map((child, childIndex) => (
                                                    <div key={childIndex}>
                                                        {child.children ? (
                                                            <>
                                                                <button
                                                                    onClick={() => toggleMenu(child.title)}
                                                                    className="w-full flex items-center justify-between rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-indigo-800 hover:bg-white/30 transition-all"
                                                                >
                                                                    {child.title}
                                                                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 opacity-50", openMenus[child.title] && "rotate-90")} />
                                                                </button>
                                                                {openMenus[child.title] && (
                                                                    <div className="ml-3 mt-1 space-y-0.5 border-l border-indigo-100 pl-3">
                                                                        {child.children.map((grandChild, grandChildIndex) => {
                                                                            const isDisabled = isItemDisabled(grandChild);
                                                                            return isDisabled ? (
                                                                                <div key={grandChildIndex} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground/50 bg-white/20 cursor-not-allowed">
                                                                                    {grandChild.title}
                                                                                </div>
                                                                            ) : (
                                                                                <Link
                                                                                    key={grandChildIndex}
                                                                                    href={safeRoute(grandChild.href, grandChild.params, grandChild.fallbackPath || '#')}
                                                                                    className={cn(
                                                                                        "block rounded-md px-3 py-1.5 text-sm transition-all relative overflow-hidden",
                                                                                        safeIsActive(grandChild.href, grandChild.params)
                                                                                            ? "text-indigo-800 font-bold bg-white border-l-4 border-indigo-600 pl-3 shadow-md"
                                                                                            : "text-muted-foreground font-medium hover:text-indigo-700 hover:pl-4"
                                                                                    )}
                                                                                >
                                                                                    {grandChild.title}
                                                                                </Link>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Link
                                                                href={safeRoute(child.href, child.params, child.fallbackPath || '#')}
                                                                className={cn(
                                                                    "block rounded-md px-3 py-1.5 text-sm transition-all relative overflow-hidden",
                                                                    safeIsActive(child.href, child.params)
                                                                        ? "text-indigo-800 font-bold bg-white border-l-4 border-indigo-600 pl-3 shadow-md"
                                                                        : "text-muted-foreground font-medium hover:text-indigo-700 hover:pl-4"
                                                                )}
                                                            >
                                                                {child.title}
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={safeRoute(item.href, item.params, item.fallbackPath || '#')}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all group relative overflow-hidden",
                                            safeIsActive(item.active || item.href, item.params)
                                                ? "text-indigo-800 bg-white shadow-md border-l-4 border-indigo-600 font-bold"
                                                : "text-muted-foreground font-medium hover:bg-white/50 hover:text-indigo-700"
                                        )}
                                    >
                                        <div className={cn("p-1 rounded-md transition-colors", safeIsActive(item.active || item.href, item.params) ? "bg-indigo-100 text-indigo-600" : "group-hover:text-indigo-600")}>
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                        </div>
                                        {item.title}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
            </div>

            {/* Footer — always visible at bottom */}
            <div className="flex-shrink-0 border-t border-border p-4 space-y-1">
                {(userRole === 'Administrator' || userRole === 'Manager') && (
                    <button onClick={() => router.post(route('system.clear-cache'))} className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all group">
                        <Trash2 className="h-4 w-4" /> Clear Cache
                    </button>
                )}
                {deferredPrompt && (
                    <button onClick={handleInstallClick} className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                        <Download className="h-4 w-4" /> Install Aplikasi
                    </button>
                )}
                <Link href={route('profile.edit')} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all">
                    <User className="h-4 w-4" /> Profil Saya
                </Link>
                <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">
                    <LogOut className="h-4 w-4" /> Keluar
                </Link>
            </div>
        </div>
    );
}
