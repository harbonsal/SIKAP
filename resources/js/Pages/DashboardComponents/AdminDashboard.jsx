
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Users, GraduationCap, School, Activity, CalendarDays, User, Calendar, Heart, Stethoscope, FileText, Search, ClipboardCheck, Book, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard({ stats, allowedWidgets = {}, activities = [] }) {
    const { auth } = usePage().props;

    // Defaults if allowedWidgets is empty
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showStats = allowedWidgets.stats_cards ?? true;
    const showActivity = allowedWidgets.activity_feed ?? true;

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
                                Selamat datang, {auth.user.name} <span className="text-indigo-200 font-medium text-xl md:text-2xl ml-2">({auth.user.user_level?.name || 'Administrator'})</span> 👋
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
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* 1. Profil Saya */}
                                {allowedWidgets.shortcut_profile && (
                                    <Link href={route('profile.edit')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-purple-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-purple-500/30 ring-4 ring-purple-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <User className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors relative z-10">Profil Saya</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Edit Akun & Password</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 2. Kalender (Hide for Bagian Kesehatan) */}
                                {(!allowedWidgets.health_stats_widget) && (
                                    <Link href={route('academic.schedules.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-cyan-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <Calendar className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors relative z-10">Kalender</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Kegiatan Akademik</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 3. Absensi & Jurnal */}
                                {(allowedWidgets.shortcut_journals ?? false) && (
                                    <Link href={route('journals.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-amber-500/30 ring-4 ring-amber-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <CalendarDays className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors relative z-10">Absensi & Jurnal</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Absensi & Materi</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 4. Input Nilai */}
                                {(allowedWidgets.shortcut_grades ?? false) && (
                                    <Link href={route('assessments.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <GraduationCap className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors relative z-10">Input Nilai</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Akademik & Ujian</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 4b. Silabus */}
                                {(allowedWidgets.shortcut_silabus ?? false) && (
                                    <Link href={route('silabus.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <Activity className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors relative z-10">Silabus</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Rencana Pembelajaran</p>
                                        </div>
                                    </Link>
                                )}

                                {/* [Manager Tahfidz] 5. Penilaian Tahfidz */}
                                {(allowedWidgets.shortcut_tahfidz_grades ?? false) && (
                                    <Link href={route('tahfidz.assessments.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-teal-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-teal-500/30 ring-4 ring-teal-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <School className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors relative z-10">Nilai Tahfidz</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Akses Semua Kelas</p>
                                        </div>
                                    </Link>
                                )}

                                {/* [Manager Tahfidz] 6. Rekap Tahfidz */}
                                {(allowedWidgets.shortcut_tahfidz_recap ?? false) && (
                                    <Link href={route('tahfidz.recap.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-lime-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-lime-400 to-lime-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-lime-500/30 ring-4 ring-lime-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <Activity className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-lime-700 transition-colors relative z-10">Rekap Tahfidz</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Laporan & Progress</p>
                                        </div>
                                    </Link>
                                )}

                                {/* [Manager Tahfidz] 7. Plotting Penguji */}
                                {(allowedWidgets.shortcut_tahfidz_testers ?? false) && (
                                    <Link href={route('settings.tahfidz.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-orange-500/30 ring-4 ring-orange-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <Users className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-orange-700 transition-colors relative z-10">Plotting Penguji</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Atur Penguji</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 8. Kalender Pendidikan (Kaldik) */}
                                <Link href={route('academic-calendar.index')}>
                                    <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 h-full relative overflow-hidden">
                                        <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                            <Calendar className="h-7 w-7 drop-shadow-sm" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors relative z-10">Kalender Pendidikan</h4>
                                        <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Agenda & KBM</p>
                                    </div>
                                </Link>

                                {/* 9. Cari & Biodata Santri */}
                                {(allowedWidgets.shortcut_health_biodata ?? true) && (
                                    <Link href={route('students.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 h-full relative overflow-hidden">
                                            <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl mb-4 shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                                <Users className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors relative z-10">Cari & Biodata Santri</h4>
                                            <p className="text-xs text-center text-slate-500 mt-1 relative z-10">Data & Pencarian</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
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
                    <Link href={route('students.index', { status: 'Aktif' })}>
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

                    <Link href={route('users.index', { status: 'Aktif', category: 'Askar' })}>
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

                    <Link href={route('active-classes.index')}>
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
