import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { 
    Clock, CalendarDays, BookOpen, GraduationCap, School, User, 
    Home, AlertTriangle, BookOpenCheck, ClipboardCheck, Book, HeartPulse, 
    CalendarRange, Bot, Sparkles, Key, ChevronRight, CheckCircle2
} from 'lucide-react';

export default function StudentDashboard({ stats = {}, schedule = [], allowedWidgets = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    
    const notScreenedJuz = Array.isArray(stats?.not_screened_juz) ? stats.not_screened_juz : [];
    const hasTahfidzTarget = (stats?.memorized_juz_count ?? 0) > 0;
    const hasPendingSkrining = notScreenedJuz.length > 0;
    const pendingSkriningCount = stats?.not_screened_juz_count ?? notScreenedJuz.length;
    const lowGradesCount = stats?.low_grades?.length ?? 0;

    // Filter widget permissions (default true jika tidak dispesifikasikan)
    const showGrades = allowedWidgets.shortcut_grades ?? true;
    const showTahfidz = allowedWidgets.widget_tahfidz_monitoring ?? true;
    const showSkrining = allowedWidgets.shortcut_skrining ?? true;
    const showQuran = allowedWidgets.shortcut_quran ?? true;
    const showIkhtabir = allowedWidgets.shortcut_ikhtabir ?? true;
    const showHealth = allowedWidgets.shortcut_health ?? true;
    const showPermissions = allowedWidgets.shortcut_permissions ?? true;
    const showCalendar = allowedWidgets.shortcut_calendar ?? true;
    const showProfile = allowedWidgets.shortcut_profile ?? true;
    const showSchedule = allowedWidgets.schedule_today ?? true;

    // Menu shortcuts configuration - Iconic & Compact
    const menuItems = [
        showGrades && {
            id: 'grades',
            title: 'Rapor & Nilai',
            badge: lowGradesCount > 0 ? `${lowGradesCount} Perhatian` : 'Akademik',
            badgeColor: lowGradesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700',
            href: route('students.grades.index'),
            icon: GraduationCap,
            gradient: 'from-emerald-500 to-teal-600',
            iconColor: 'text-white',
            bgIcon: 'bg-emerald-500',
        },
        showTahfidz && {
            id: 'tahfidz',
            title: 'Hafalan Tahfidz',
            badge: stats?.latest_tahfidz ? `${stats.latest_tahfidz.score} (${stats.latest_tahfidz.predicate})` : 'Setoran',
            badgeColor: 'bg-amber-50 text-amber-700',
            href: route('students.tahfidz.index'),
            icon: BookOpenCheck,
            gradient: 'from-amber-500 to-amber-600',
            iconColor: 'text-white',
            bgIcon: 'bg-amber-500',
        },
        showSkrining && {
            id: 'skrining',
            title: 'Skrining Mandiri',
            badge: hasPendingSkrining ? `${pendingSkriningCount} Juz Belum` : (hasTahfidzTarget ? 'Tuntas' : 'Siap'),
            badgeColor: hasPendingSkrining ? 'bg-orange-100 text-orange-700 font-semibold animate-pulse' : 'bg-emerald-50 text-emerald-700',
            href: route('quran.skrining'),
            icon: Sparkles,
            gradient: hasPendingSkrining ? 'from-orange-500 to-amber-600' : 'from-teal-500 to-cyan-600',
            iconColor: 'text-white',
            bgIcon: hasPendingSkrining ? 'bg-orange-500' : 'bg-teal-500',
        },
        showQuran && {
            id: 'quran',
            title: "Al-Qur'an Digital",
            badge: 'Mushaf 30 Juz',
            badgeColor: 'bg-emerald-50 text-emerald-700',
            href: route('quran.index'),
            icon: Book,
            gradient: 'from-teal-600 to-emerald-700',
            iconColor: 'text-white',
            bgIcon: 'bg-teal-600',
        },
        showIkhtabir && {
            id: 'ikhtabir',
            title: 'Ikhtabir AI',
            badge: 'Sambung Ayat',
            badgeColor: 'bg-cyan-50 text-cyan-700',
            href: route('ikhtabir-nafsi.index'),
            icon: Bot,
            gradient: 'from-cyan-500 to-blue-600',
            iconColor: 'text-white',
            bgIcon: 'bg-cyan-500',
        },
        showHealth && {
            id: 'health',
            title: 'Kesehatan (UKS)',
            badge: stats?.latest_health_status?.is_sick ? stats.latest_health_status.status : 'Sehat',
            badgeColor: stats?.latest_health_status?.is_sick ? 'bg-rose-100 text-rose-700 font-semibold' : 'bg-green-50 text-green-700',
            href: route('students.health.index'),
            icon: HeartPulse,
            gradient: 'from-rose-500 to-pink-600',
            iconColor: 'text-white',
            bgIcon: 'bg-rose-500',
        },
        showPermissions && {
            id: 'permissions',
            title: 'Perizinan',
            badge: 'Kartu / Izin',
            badgeColor: 'bg-violet-50 text-violet-700',
            href: route('rfid.scan'),
            icon: Key,
            gradient: 'from-violet-500 to-indigo-600',
            iconColor: 'text-white',
            bgIcon: 'bg-violet-500',
        },
        showCalendar && {
            id: 'calendar',
            title: 'Kalender Akademik',
            badge: 'Agenda & Libur',
            badgeColor: 'bg-blue-50 text-blue-700',
            href: route('academic-calendar.index'),
            icon: CalendarRange,
            gradient: 'from-blue-500 to-indigo-600',
            iconColor: 'text-white',
            bgIcon: 'bg-blue-500',
        },
        showProfile && {
            id: 'profile',
            title: 'Biodata & Profil',
            badge: 'Data Akun',
            badgeColor: 'bg-slate-100 text-slate-700',
            href: route('profile.edit'),
            icon: User,
            gradient: 'from-slate-600 to-slate-800',
            iconColor: 'text-white',
            bgIcon: 'bg-slate-600',
        },
        stats?.active_angket_count > 0 && {
            id: 'angket',
            title: 'Angket Evaluasi',
            badge: `${stats.active_angket_count} Wajib Diisi`,
            badgeColor: 'bg-amber-100 text-amber-800 font-bold animate-bounce',
            href: route('student.supervisions.index'),
            icon: ClipboardCheck,
            gradient: 'from-amber-500 to-orange-600',
            iconColor: 'text-white',
            bgIcon: 'bg-amber-500',
        },
    ].filter(Boolean);

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto pb-4">
            {/* Top Compact Hero Strip (Minimalist & Clean) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-600/30 shrink-0">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                Assalamu'alaikum, {user.name?.split(' ')[0]}
                            </h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                Santri
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Selamat belajar! Simak agenda & progres kegiatanmu hari ini.
                        </p>
                    </div>
                </div>

                {/* Class & Kamar Badges */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {stats?.class_name ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                            <School className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.class_name}</span>
                            {stats.homeroom_teacher && (
                                <span className="text-[11px] text-slate-400">({stats.homeroom_teacher})</span>
                            )}
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs">
                            Kelas belum terdaftar
                        </div>
                    )}

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                        <Home className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{stats?.kamar_name || 'Asrama'}</span>
                        {stats?.musrif_name && (
                            <span className="text-[11px] text-slate-400">({stats.musrif_name})</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Action Alert Strip (Jika ada yang butuh perhatian segera) */}
            {(hasPendingSkrining || lowGradesCount > 0 || stats?.active_angket_count > 0) && (
                <div className="flex flex-wrap items-center gap-2.5 p-2.5 px-3.5 bg-amber-500/10 border border-amber-300/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {hasPendingSkrining && (
                            <span>
                                <strong>Skrining:</strong> {pendingSkriningCount} Juz belum diskrining ({notScreenedJuz.slice(0, 3).map(j => `Juz ${j}`).join(', ')}{notScreenedJuz.length > 3 ? ` +${notScreenedJuz.length - 3}` : ''})
                            </span>
                        )}
                        {lowGradesCount > 0 && (
                            <span>
                                <strong>Akademik:</strong> {lowGradesCount} mapel perlu evaluasi nilai.
                            </span>
                        )}
                        {stats?.active_angket_count > 0 && (
                            <span>
                                <strong>Supervisi:</strong> {stats.active_angket_count} kuesioner evaluasi guru aktif.
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content: Split Grid (Left: Iconic Menu Launcher | Right: Schedule) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left Side: Iconic App Hub (Span 7 or 8 on desktop) */}
                <div className={`${showSchedule ? 'lg:col-span-7 xl:col-span-8' : 'col-span-full'}`}>
                    <div className="flex items-center justify-between mb-2.5 px-0.5">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Menu Utama
                        </h2>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Pilih ikon untuk akses cepat
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
                        {menuItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden min-h-[105px]"
                                >
                                    {/* Top row: Icon + Arrow */}
                                    <div className="flex items-start justify-between">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                                            <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    {/* Bottom row: Title & Short Badge */}
                                    <div className="mt-3">
                                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {item.title}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md truncate max-w-full ${item.badgeColor}`}>
                                                {item.badge}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Compact Schedule Roster */}
                {showSchedule && (
                    <div className="lg:col-span-5 xl:col-span-4">
                        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            Jadwal Hari Ini
                                        </h3>
                                    </div>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    {schedule?.length || 0} Mapel
                                </span>
                            </div>

                            <CardContent className="p-3">
                                {schedule && schedule.length > 0 ? (
                                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                        {schedule.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                            >
                                                {/* Jam ke- Badge */}
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                    {item.learning_hour?.hour_number || (index + 1)}
                                                </div>

                                                {/* Mapel & Detail */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                                        {item.active_subject?.mapel?.name || 'Mata Pelajaran'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        <span className="truncate max-w-[120px]">
                                                            {item.teacher?.name || '-'}
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span className="shrink-0 text-slate-400">
                                                            {item.learning_hour?.start_time || ''}-{item.learning_hour?.end_time || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            Tidak ada KBM hari ini
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                            Manfaatkan waktu untuk tilawah & murojaah
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
