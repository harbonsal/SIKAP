
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { 
    Users, GraduationCap, School, Activity, CalendarDays, User, Calendar, 
    Heart, Stethoscope, FileText, Search, ClipboardCheck, Book, BookOpen, 
    HeartPulse, BarChart2, CalendarRange, Sparkles, Bot, BookOpenCheck, Key, Plus,
    Wallet, Download, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard({ stats, allowedWidgets = {}, activities = [] }) {
    const { auth } = usePage().props;

    // Defaults if allowedWidgets is empty
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showStats = allowedWidgets.stats_cards ?? true;
    const showActivity = allowedWidgets.activity_feed ?? true;

    // Helper to check if shortcut is enabled
    const hasConfiguredWidgets = Object.keys(allowedWidgets).length > 0;
    const isAllowed = (key, alias = null, defaultVal = false) => {
        if (allowedWidgets[key] !== undefined) return Boolean(allowedWidgets[key]);
        if (alias && allowedWidgets[alias] !== undefined) return Boolean(allowedWidgets[alias]);
        // If the role has custom widgets saved in the matrix, items not explicitly true are false
        return hasConfiguredWidgets ? false : defaultVal;
    };

    const shortcutDefinitions = [
        // 1. Profil Saya & Sandi
        {
            id: 'shortcut_profile',
            alias: 'profile',
            title: 'Profil Saya',
            subtitle: 'Edit Akun & Password',
            href: route('profile.edit'),
            icon: User,
            gradient: 'from-purple-500 to-purple-600',
            borderHover: 'hover:border-purple-200',
            textHover: 'group-hover:text-purple-700',
            shadow: 'shadow-purple-500/30 ring-purple-50',
            default: true,
        },
        // 2. Kesehatan Santri (UKS) - Prioritas untuk Bagian Kesehatan & UKS
        {
            id: 'shortcut_health',
            alias: 'health',
            title: 'Kesehatan Santri (UKS)',
            subtitle: 'Catatan Sakit & Berobat',
            href: route('health.records.index'),
            secondaryHref: route('health.records.create'),
            secondaryLabel: '+ Input Sakit',
            icon: HeartPulse,
            gradient: 'from-rose-500 to-rose-600',
            borderHover: 'hover:border-rose-200',
            textHover: 'group-hover:text-rose-700',
            shadow: 'shadow-rose-500/30 ring-rose-50',
            default: false,
        },
        // 3. Jadwal KBM & Guru
        {
            id: 'shortcut_schedule',
            alias: 'schedule',
            title: 'Jadwal Pelajaran',
            subtitle: 'Jadwal KBM & Guru',
            href: route('academic.schedules.index'),
            icon: Calendar,
            gradient: 'from-cyan-500 to-cyan-600',
            borderHover: 'hover:border-cyan-200',
            textHover: 'group-hover:text-cyan-700',
            shadow: 'shadow-cyan-500/30 ring-cyan-50',
            default: false,
        },
        // 4. Absensi & Jurnal
        {
            id: 'shortcut_journals',
            alias: 'journals',
            title: 'Absensi & Jurnal',
            subtitle: 'Absensi & Materi',
            href: route('journals.index'),
            icon: CalendarDays,
            gradient: 'from-amber-500 to-amber-600',
            borderHover: 'hover:border-amber-200',
            textHover: 'group-hover:text-amber-700',
            shadow: 'shadow-amber-500/30 ring-amber-50',
            default: false,
        },
        // 5. Input Nilai Siswa
        {
            id: 'shortcut_grades',
            alias: 'grades',
            title: 'Input Nilai',
            subtitle: 'Akademik & Ujian',
            href: route('assessments.index'),
            icon: GraduationCap,
            gradient: 'from-emerald-500 to-emerald-600',
            borderHover: 'hover:border-emerald-200',
            textHover: 'group-hover:text-emerald-700',
            shadow: 'shadow-emerald-500/30 ring-emerald-50',
            default: false,
        },
        // 6. Silabus & RPP / Modul
        {
            id: 'shortcut_silabus',
            alias: 'silabus',
            title: 'Silabus',
            subtitle: 'Rencana Pembelajaran',
            href: route('silabus.index'),
            icon: Activity,
            gradient: 'from-blue-500 to-blue-600',
            borderHover: 'hover:border-blue-200',
            textHover: 'group-hover:text-blue-700',
            shadow: 'shadow-blue-500/30 ring-blue-50',
            default: false,
        },
        // 7. Rekap Nilai Kelas
        {
            id: 'shortcut_recap',
            alias: 'recap',
            title: 'Rekap Nilai Kelas',
            subtitle: 'Capaian Per Rombel',
            href: route('recap.class.index'),
            icon: BarChart2,
            gradient: 'from-indigo-500 to-indigo-600',
            borderHover: 'hover:border-indigo-200',
            textHover: 'group-hover:text-indigo-700',
            shadow: 'shadow-indigo-500/30 ring-indigo-50',
            default: false,
        },
        // 8. Cetak & Pantau Rapor
        {
            id: 'shortcut_reports',
            alias: 'reports',
            title: 'Cetak & Pantau Rapor',
            subtitle: 'Buku Rapor Santri',
            href: route('reports.index'),
            icon: FileText,
            gradient: 'from-violet-500 to-violet-600',
            borderHover: 'hover:border-violet-200',
            textHover: 'group-hover:text-violet-700',
            shadow: 'shadow-violet-500/30 ring-violet-50',
            default: false,
        },
        // 9. Penilaian Tahfidz
        {
            id: 'shortcut_tahfidz',
            alias: 'shortcut_tahfidz_grades',
            title: 'Penilaian Tahfidz',
            subtitle: 'Akses Semua Kelas',
            href: route('tahfidz.assessments.index'),
            icon: School,
            gradient: 'from-teal-500 to-teal-600',
            borderHover: 'hover:border-teal-200',
            textHover: 'group-hover:text-teal-700',
            shadow: 'shadow-teal-500/30 ring-teal-50',
            default: false,
        },
        // 10. Rekap Tahfidz
        {
            id: 'shortcut_tahfidz_recap',
            alias: 'tahfidz_recap',
            title: 'Rekap Tahfidz',
            subtitle: 'Laporan & Progress',
            href: route('tahfidz.recap.index'),
            icon: Activity,
            gradient: 'from-lime-500 to-lime-600',
            borderHover: 'hover:border-lime-200',
            textHover: 'group-hover:text-lime-700',
            shadow: 'shadow-lime-500/30 ring-lime-50',
            default: false,
        },
        // 11. Plotting Penguji Tahfidz
        {
            id: 'shortcut_tahfidz_testers',
            alias: 'tahfidz_testers',
            title: 'Plotting Penguji',
            subtitle: 'Atur Penguji Tahfidz',
            href: route('settings.tahfidz.index'),
            icon: Users,
            gradient: 'from-orange-500 to-orange-600',
            borderHover: 'hover:border-orange-200',
            textHover: 'group-hover:text-orange-700',
            shadow: 'shadow-orange-500/30 ring-orange-50',
            default: false,
        },
        // 12. Pantauan Halaqoh
        {
            id: 'shortcut_tahfidz_monitoring',
            alias: 'tahfidz_monitoring',
            title: 'Pantauan halaqoh',
            subtitle: 'Lembar Pantauan',
            href: route('tahfidz.monitoring.index'),
            icon: ClipboardCheck,
            gradient: 'from-pink-500 to-pink-600',
            borderHover: 'hover:border-pink-200',
            textHover: 'group-hover:text-pink-700',
            shadow: 'shadow-pink-500/30 ring-pink-50',
            default: false,
        },
        // 13. Skrining Hafalan Santri
        {
            id: 'shortcut_skrining',
            alias: 'skrining',
            title: 'Skrining Hafalan Santri',
            subtitle: 'Verifikasi & Uji Juz',
            href: route('tahfidz.pantau-skrining'),
            icon: Sparkles,
            gradient: 'from-amber-500 to-yellow-600',
            borderHover: 'hover:border-yellow-200',
            textHover: 'group-hover:text-yellow-700',
            shadow: 'shadow-amber-500/30 ring-amber-50',
            default: false,
        },
        // 14. Tes Mandiri AI (Ikhtabir)
        {
            id: 'shortcut_ikhtabir',
            alias: 'ikhtabir',
            title: 'Tes Mandiri AI (Ikhtabir)',
            subtitle: 'Uji Sambung Ayat AI',
            href: route('ikhtabir-nafsi.index'),
            icon: Bot,
            gradient: 'from-cyan-500 to-blue-600',
            borderHover: 'hover:border-cyan-200',
            textHover: 'group-hover:text-cyan-700',
            shadow: 'shadow-cyan-500/30 ring-cyan-50',
            default: false,
        },
        // 15. Al-Qur'an Digital
        {
            id: 'shortcut_quran',
            alias: 'quran',
            title: "Al-Qur'an Digital",
            subtitle: 'Mushaf & Murajaah',
            href: route('quran.index'),
            icon: BookOpenCheck,
            gradient: 'from-emerald-500 to-teal-600',
            borderHover: 'hover:border-emerald-200',
            textHover: 'group-hover:text-emerald-700',
            shadow: 'shadow-emerald-500/30 ring-emerald-50',
            default: false,
        },
        // 16. Kalender Akademik
        {
            id: 'shortcut_calendar',
            alias: 'calendar',
            title: 'Kalender Pendidikan',
            subtitle: 'Agenda & KBM',
            href: route('academic-calendar.index'),
            icon: CalendarRange,
            gradient: 'from-indigo-500 to-indigo-600',
            borderHover: 'hover:border-indigo-200',
            textHover: 'group-hover:text-indigo-700',
            shadow: 'shadow-indigo-500/30 ring-indigo-50',
            default: true,
        },
        // 17. Direktori & Biodata Santri
        {
            id: 'shortcut_students',
            alias: 'students',
            title: 'Cari & Biodata Santri',
            subtitle: 'Data & Pencarian',
            href: route('students.index'),
            icon: Users,
            gradient: 'from-blue-500 to-blue-600',
            borderHover: 'hover:border-blue-200',
            textHover: 'group-hover:text-blue-700',
            shadow: 'shadow-blue-500/30 ring-blue-50',
            default: false,
        },
        // 18. Perizinan Santri
        {
            id: 'shortcut_permissions',
            alias: 'permissions',
            title: 'Perizinan Santri',
            subtitle: 'Surat Izin & RFID',
            href: route('permissions.index'),
            secondaryHref: route('permissions.create', { type: 'personal' }),
            secondaryLabel: '+ Izin Personal',
            icon: Key,
            gradient: 'from-amber-600 to-red-600',
            borderHover: 'hover:border-amber-200',
            textHover: 'group-hover:text-amber-700',
            shadow: 'shadow-amber-500/30 ring-amber-50',
            default: false,
        },
        // 18b. Izin Personal Santri
        {
            id: 'shortcut_permission_personal',
            alias: 'permission_personal',
            title: 'Izin Personal Santri',
            subtitle: 'Beri Izin 1 Santri Langsung',
            href: route('permissions.create', { type: 'personal' }),
            icon: UserCheck,
            gradient: 'from-emerald-600 to-teal-600',
            borderHover: 'hover:border-emerald-200',
            textHover: 'group-hover:text-emerald-700',
            shadow: 'shadow-emerald-500/30 ring-emerald-50',
            default: false,
        },
        // 19. Keuangan & Tagihan
        {
            id: 'shortcut_finance',
            alias: 'finance',
            title: 'Keuangan & SPP',
            subtitle: 'Tagihan & Informasi',
            href: '#',
            icon: Wallet,
            gradient: 'from-emerald-600 to-teal-700',
            borderHover: 'hover:border-emerald-200',
            textHover: 'group-hover:text-emerald-700',
            shadow: 'shadow-emerald-500/30 ring-emerald-50',
            default: false,
        },
        // 20. Pasang Aplikasi PWA
        {
            id: 'shortcut_install_app',
            alias: 'install_app',
            title: 'Pasang Aplikasi',
            subtitle: 'PWA Mobile & Desktop',
            href: '#install-pwa',
            icon: Download,
            gradient: 'from-slate-700 to-indigo-800',
            borderHover: 'hover:border-indigo-200',
            textHover: 'group-hover:text-indigo-700',
            shadow: 'shadow-indigo-500/30 ring-indigo-50',
            default: false,
        },
    ];

    const activeShortcuts = shortcutDefinitions.filter(item => 
        isAllowed(item.id, item.alias, item.default)
    );

    return (
        <div className="space-y-8">
            {/* Welcome Card */}
            {showWelcome && (
                <Card className="border-none bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none"></div>

                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                                Selamat datang, {auth.user.name} <span className="text-indigo-200 font-medium text-xl md:text-2xl ml-2">({(auth.user.roles && auth.user.roles.length > 0) ? auth.user.roles.join(', ') : (auth.user.user_level?.name || 'Administrator')})</span> 👋
                            </h2>
                            <p className="text-slate-300 text-lg max-w-2xl hidden md:block mt-1">
                                Berikut adalah ringkasan aktivitas dan statistik terkini di satuan pendidikan Anda hari ini.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions (Shortcuts) */}
            {(allowedWidgets.quick_actions ?? true) && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-full lg:col-span-7 border-none shadow-md bg-white">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-800">Akses Cepat</CardTitle>
                                    <CardDescription className="text-gray-500">
                                        Pintasan menu prioritas.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {activeShortcuts.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {activeShortcuts.map((sc) => {
                                        const Icon = sc.icon;
                                        return (
                                            <div key={sc.id} className="relative group flex flex-col">
                                                <Link href={sc.href} className="block flex-1">
                                                    <div className={cn(
                                                        "group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 h-full relative overflow-hidden",
                                                        sc.borderHover
                                                    )}>
                                                        <div className={cn(
                                                            "bg-gradient-to-br text-white p-4 rounded-xl mb-4 shadow-lg ring-4 group-hover:scale-110 transition-transform duration-300 relative z-10",
                                                            sc.gradient,
                                                            sc.shadow
                                                        )}>
                                                            <Icon className="h-7 w-7 drop-shadow-sm" />
                                                        </div>
                                                        <h4 className={cn("font-bold text-slate-800 transition-colors relative z-10 text-center line-clamp-1", sc.textHover)}>
                                                            {sc.title}
                                                        </h4>
                                                        <p className="text-xs text-center text-slate-500 mt-1 relative z-10 line-clamp-1">
                                                            {sc.subtitle}
                                                        </p>
                                                    </div>
                                                </Link>
                                                {sc.secondaryHref && (
                                                    <div className="mt-2 text-center">
                                                        <Link
                                                            href={sc.secondaryHref}
                                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-200 transition-colors shadow-sm"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            {sc.secondaryLabel || 'Input Baru'}
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm">Tidak ada pintasan aktif. Anda dapat mengaktifkannya di Pengaturan Hak Akses.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions / Activity Feed */}
            {showActivity && activities && activities.length > 0 && (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                    <Card className="col-span-full border-none shadow-md bg-white">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-gray-800">Aktivitas Terbaru</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Render activities list here in the future */}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Stats Grid */}
            {showStats && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link href={route('students.index', { status: 'Aktif' })} className="block h-full">
                        <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white h-full shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-24 h-24 -mr-6 -mt-6" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-medium text-emerald-100">
                                    Total Santri Aktif
                                </CardTitle>
                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-extrabold text-white mt-2 drop-shadow-sm">{stats.total_students ?? 0}</div>
                                <p className="text-xs text-emerald-100 mt-1 font-medium bg-emerald-700/30 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Status Aktif
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('users.index', { status: 'Aktif', category: 'Askar' })} className="block h-full">
                        <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-amber-500 to-amber-600 text-white h-full shadow-lg shadow-amber-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <GraduationCap className="w-24 h-24 -mr-6 -mt-6" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-medium text-amber-100">
                                    Guru & Staf
                                </CardTitle>
                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                    <GraduationCap className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-extrabold text-white mt-2 drop-shadow-sm">{stats.total_teachers ?? 0}</div>
                                <p className="text-xs text-amber-100 mt-1 font-medium bg-amber-700/30 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Personil Aktif
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('active-classes.index')} className="block h-full">
                        <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-red-500 to-red-600 text-white h-full shadow-lg shadow-red-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <School className="w-24 h-24 -mr-6 -mt-6" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-medium text-rose-100">
                                    Kelas Aktif
                                </CardTitle>
                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                    <School className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-extrabold text-white mt-2 drop-shadow-sm">{stats.active_classes ?? 0}</div>
                                <p className="text-xs text-rose-100 mt-1 font-medium bg-red-700/30 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Rombel Semester Ini
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('tahfidz.pantau-skrining')} className="block h-full">
                        <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-violet-500 to-purple-600 text-white h-full shadow-lg shadow-violet-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen className="w-24 h-24 -mr-6 -mt-6" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                <CardTitle className="text-sm font-medium text-violet-100">
                                    Skrining Hafalan
                                </CardTitle>
                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-extrabold text-white mt-2 drop-shadow-sm">{stats.skrining_today ?? 0}</div>
                                <p className="text-xs text-violet-100 mt-1 font-medium bg-violet-700/30 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    Aktivitas Hari Ini
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Health Stats Widget */}
                    {(allowedWidgets.health_stats_widget ?? false) && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-1 grid grid-rows-2 gap-6">
                            <Link href={route('health.records.index', { date: new Date().toISOString().split('T')[0], status: 'Sakit' })}>
                                <Card className="group hover:shadow-lg transition-all border-none bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md relative overflow-hidden h-full cursor-pointer hover:-translate-y-1">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-rose-100">
                                            Sakit Hari Ini
                                        </CardTitle>
                                        <Heart className="h-4 w-4 text-rose-100" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.health_sick_today ?? 0}</div>
                                        <p className="text-xs text-rose-100 mt-1">Santri perlu dipantau &rarr;</p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href={route('health.records.index', { date_range: '30_days' })}>
                                <Card className="group hover:shadow-lg transition-all border-none bg-white shadow-md relative overflow-hidden border border-gray-100 h-full cursor-pointer hover:-translate-y-1">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium text-gray-500">
                                            Keluhan Terbanyak (30 Hari)
                                        </CardTitle>
                                        <Stethoscope className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-gray-800 truncate" title={stats.health_most_common}>
                                            {stats.health_most_common ?? '-'}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Lihat Tren Kesehatan &rarr;</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
