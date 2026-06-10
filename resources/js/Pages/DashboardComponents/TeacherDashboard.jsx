
import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Users, GraduationCap, School, Clock, CalendarDays, Activity, BookOpen, FilePenLine, User, Wallet, Calendar, Bot, Book } from 'lucide-react';

export default function TeacherDashboard({ stats, schedule, allowedWidgets = {} }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const permissions = user?.permissions || [];
    const hasTeachingLoad = user?.has_teaching_load; // Injected via HandleInertiaRequests

    const [showScheduleSection, setShowScheduleSection] = React.useState(false);
    const scheduleRef = React.useRef(null);

    const handleToggleSchedule = () => {
        setShowScheduleSection(prev => {
            const newState = !prev;
            if (newState) {
                // Wait for animation frame
                setTimeout(() => {
                    scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
            }
            return newState;
        });
    };

    // Defaults if allowedWidgets is empty
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showStats = allowedWidgets.stats_cards ?? true;
    const showSchedule = allowedWidgets.schedule_today ?? true;
    const showQuickActions = allowedWidgets.quick_actions ?? true;

    // Helper to check permission
    const can = (p) => user?.user_level?.name === 'Administrator' || permissions.includes(p);

    // Helper to check if feature requires teaching load
    const isTeacher = user?.user_level?.name === 'Guru';
    const canViewAcademic = !isTeacher || hasTeachingLoad; // If Teacher, MUST have load. Admin/Others skipped.

    return (
        <div className="space-y-8">
            {/* Welcome Card */}
            {showWelcome && can('menu_dashboard') && (
                <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>

                    <CardContent className="p-6 md:p-8 relative z-10">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                                Selamat datang, {auth.user.name} <span className="text-yellow-300">({user?.user_level?.name || 'Guru'})</span> 👋
                            </h2>
                            <p className="text-blue-100 text-lg max-w-2xl hidden md:block">
                                Berikut adalah ringkasan aktivitas dan jadwal mengajar Anda hari ini.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Schedule */}
            {showSchedule && can('view_academic_schedules') && canViewAcademic && (
                <div id="schedule-section" ref={scheduleRef} className={`transition-all duration-500 ease-in-out overflow-hidden ${showScheduleSection ? 'max-h-[2000px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                        {can('view_dashboard_calendar') && (
                            <Card className="col-span-full border-none shadow-md bg-white flex flex-col h-full">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-gray-800">Jadwal Hari Ini</CardTitle>
                                            <CardDescription className="text-gray-500">Agenda akademik.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex-1">
                                    {schedule && schedule.length > 0 ? (
                                        <div className="space-y-3">
                                            {schedule.map((item, index) => (
                                                <div key={index} className="group flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all">

                                                    {/* Hour Badge */}
                                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg border border-indigo-100">
                                                        {item.learning_hour?.hour_number || (index + 1)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate text-base">
                                                            {item.active_subject?.mapel?.name || 'Mapel tidak ditemukan'}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                            <span className="font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                                {item.active_class?.grade?.name || item.active_class?.kelas?.name} {item.active_class?.name}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                {item.learning_hour?.start_time} - {item.learning_hour?.end_time}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={route('journals.create', { active_subject_id: item.active_subject_id || item.active_subject?.id })}
                                                            className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors group-hover:bg-blue-100"
                                                            title="Isi Jurnal"
                                                        >
                                                            <FilePenLine className="w-5 h-5" />
                                                        </Link>
                                                        <Link
                                                            href={route('assessments.index', { active_subject_id: item.active_subject_id || item.active_subject?.id })}
                                                            className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors group-hover:bg-emerald-100"
                                                            title="Input Nilai"
                                                        >
                                                            <GraduationCap className="w-5 h-5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="p-4 bg-white rounded-full mb-3 shadow-sm">
                                                <Clock className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="font-medium text-gray-500">Tidak ada jadwal hari ini</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && (
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
                                {/* 1. Absensi & Jurnal */}
                                {(allowedWidgets.shortcut_journals ?? true) && can('view_journals') && canViewAcademic && (
                                    <Link href={route('journals.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-white hover:from-amber-100 hover:to-amber-50 rounded-2xl border border-amber-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-amber-500/30 ring-4 ring-amber-50 group-hover:scale-110 transition-transform">
                                                <CalendarDays className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-amber-700">Absensi & Jurnal</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Absensi & Materi</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 2. Jadwal Mengajar (Toggle) */}
                                {(allowedWidgets.shortcut_schedule ?? true) && can('view_academic_schedules') && canViewAcademic && (
                                    <div onClick={handleToggleSchedule} className="cursor-pointer">
                                        <div className={`group flex flex-col items-center justify-center p-6 bg-gradient-to-b ${showScheduleSection ? 'from-indigo-100 to-indigo-50 border-indigo-300' : 'from-indigo-50 to-white'} hover:from-indigo-100 hover:to-indigo-50 rounded-2xl border border-indigo-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full`}>
                                            <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-50 group-hover:scale-110 transition-transform">
                                                <Clock className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-indigo-700">Jadwal Mengajar</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">{showScheduleSection ? 'Tutup Jadwal' : 'Agenda Hari Ini'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Input Nilai */}
                                {(allowedWidgets.shortcut_grades ?? true) && can('view_assessments') && canViewAcademic && (
                                    <Link href={route('assessments.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-50 to-white hover:from-emerald-100 hover:to-emerald-50 rounded-2xl border border-emerald-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-50 group-hover:scale-110 transition-transform">
                                                <GraduationCap className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-emerald-700">Input Nilai</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Akademik & Ujian</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 4. Penilaian Tahfidz (Conditional based on Exam Period) */}
                                {allowedWidgets.shortcut_tahfidz && can('menu_tahfidz') && (
                                    <Link href={route('tahfidz.assessments.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cyan-50 to-white hover:from-cyan-100 hover:to-cyan-50 rounded-2xl border border-cyan-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-50 group-hover:scale-110 transition-transform">
                                                <BookOpen className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-cyan-700">Penilaian Tahfidz</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Hafalan & Setoran</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 5. Kalender Akademik */}
                                {(allowedWidgets.shortcut_calendar && can('view_academic_schedules') && canViewAcademic) && (
                                    <Link href={route('academic.schedules.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-teal-50 to-white hover:from-teal-100 hover:to-teal-50 rounded-2xl border border-teal-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-teal-400 to-teal-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-teal-500/30 ring-4 ring-teal-50 group-hover:scale-110 transition-transform">
                                                <Calendar className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-teal-700">Kalender</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Kegiatan Akademik</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 6. Silabus */}
                                {can('view_silabus') && canViewAcademic && (
                                    <Link href={route('silabus.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 rounded-2xl border border-blue-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-blue-500/30 ring-4 ring-blue-50 group-hover:scale-110 transition-transform">
                                                <Activity className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-blue-700">Silabus</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Rencana Pembelajaran</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 7. Profil Saya */}
                                {allowedWidgets.shortcut_profile && (
                                    <Link href={route('profile.edit')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 rounded-2xl border border-purple-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-purple-500/30 ring-4 ring-purple-50 group-hover:scale-110 transition-transform">
                                                <User className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-purple-700">Profil Saya</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Edit Akun & Password</p>
                                        </div>
                                    </Link>
                                )}

                                {/* 8. Ikhtabir Nafsi (Self-Assessment) */}
                                {(allowedWidgets.shortcut_ikhtabir !== false) && (
                                    <Link href={route('ikhtabir-nafsi.index')}>
                                        <div className="group flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50 to-white hover:from-rose-100 hover:to-rose-50 rounded-2xl border border-rose-100 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 h-full">
                                            <div className="bg-gradient-to-br from-rose-400 to-rose-600 text-white p-4 rounded-xl mb-3 shadow-lg shadow-rose-500/30 ring-4 ring-rose-50 group-hover:scale-110 transition-transform">
                                                <Bot className="h-7 w-7 drop-shadow-sm" />
                                            </div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-rose-700">Tes Kemampuan</h4>
                                            <p className="text-xs text-center text-gray-500 mt-1">Ikhtabir Nafsi AI</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Teacher Stats */}
            {
                showStats && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {can('view_active_classes') && canViewAcademic && (
                            <Link href={route('active-classes.index', { my_classes: 1 })}>
                                <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white h-full shadow-lg shadow-indigo-500/20 relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Users className="w-24 h-24 -mr-6 -mt-6" />
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium text-indigo-100 uppercase tracking-wider">
                                            Kelas Diampu ({stats.my_classes})
                                        </CardTitle>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                                            <Users className="h-4 w-4 text-white" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10 flex-1 flex flex-col">
                                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
                                            {stats.my_class_list && stats.my_class_list.length > 0 ? (
                                                stats.my_class_list.map((cls, idx) => (
                                                    <div key={idx} className="text-sm font-semibold border-b border-indigo-400/30 pb-1 last:border-0 last:pb-0 font-mono">
                                                        {cls}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-indigo-200 text-sm italic">Belum ada kelas</div>
                                            )}
                                        </div>
                                        <p className="text-xs text-indigo-100 mt-auto pt-3 flex items-center gap-1 opacity-90">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                            Kelas Semester Ini
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {can('view_students') && canViewAcademic && (
                            <Link href={route('students.index', { my_students: 1, status: 'Aktif' })}>
                                <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white h-full shadow-lg shadow-emerald-500/20 relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <GraduationCap className="w-24 h-24 -mr-6 -mt-6" />
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium text-emerald-100 uppercase tracking-wider">
                                            Total Santri Ajar
                                        </CardTitle>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                                            <GraduationCap className="h-4 w-4 text-white" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10 flex-1 flex items-center">
                                        <div className="w-full">
                                            <div className="text-4xl font-extrabold drop-shadow-sm leading-none">{stats.my_students}</div>
                                            <p className="text-xs text-emerald-100 mt-2 flex items-center gap-1 opacity-90">
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                                                Santri
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {can('view_silabus') && canViewAcademic && (
                            <Link href={route('silabus.index')}>
                                <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-amber-500 to-amber-600 text-white h-full shadow-lg shadow-amber-500/20 relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <BookOpen className="w-24 h-24 -mr-6 -mt-6" />
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                        <CardTitle className="text-sm font-medium text-amber-100 uppercase tracking-wider">
                                            Mapel Diampu ({stats.my_subjects})
                                        </CardTitle>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                                            <BookOpen className="h-4 w-4 text-white" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10 flex-1 flex flex-col">
                                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-1">
                                            {stats.my_subject_list && stats.my_subject_list.length > 0 ? (
                                                stats.my_subject_list.map((subj, idx) => (
                                                    <div key={idx} className="text-sm font-semibold border-b border-amber-400/30 pb-1 last:border-0 last:pb-0 font-mono">
                                                        {subj}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-amber-100 text-sm italic">Belum ada mapel</div>
                                            )}
                                        </div>
                                        <p className="text-xs text-amber-100 mt-auto pt-3 flex items-center gap-1 opacity-90">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                                            Mata Pelajaran
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        )}

                        {/* Skrining Hafalan Widget */}
                        <Link href={route('tahfidz.pantau-skrining')} className="block h-full">
                            <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none bg-gradient-to-br from-violet-500 to-purple-600 text-white h-full shadow-lg shadow-violet-500/20 relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BookOpen className="w-24 h-24 -mr-6 -mt-6" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                                    <CardTitle className="text-sm font-medium text-violet-100 uppercase tracking-wider">
                                        Skrining Hafalan
                                    </CardTitle>
                                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                        <BookOpen className="h-5 w-5 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 flex-1 flex items-center">
                                    <div className="w-full">
                                        <div className="text-4xl font-extrabold drop-shadow-sm leading-none">{stats.skrining_today ?? 0}</div>
                                        <p className="text-xs text-violet-100 mt-2 flex items-center gap-1 opacity-90">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(167,139,250,0.8)]"></span>
                                            Aktivitas Hari Ini
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                )
            }
        </div >
    );
}
