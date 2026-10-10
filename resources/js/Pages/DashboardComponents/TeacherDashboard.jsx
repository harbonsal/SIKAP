import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Users, GraduationCap, Clock, CalendarDays, BookOpen, FilePenLine, User, Calendar, Bot, Book, ChevronRight, Sparkles } from 'lucide-react';

export default function TeacherDashboard({ stats, schedule, allowedWidgets = {} }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const permissions = user?.permissions || [];
    const hasTeachingLoad = user?.has_teaching_load;

    // Defaults if allowedWidgets is empty
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showStats = allowedWidgets.stats_cards ?? true;
    const showSchedule = allowedWidgets.schedule_today ?? true;
    const showQuickActions = allowedWidgets.quick_actions ?? true;

    // Helper to check permission
    const can = (p) => user?.user_level?.name === 'Administrator' || permissions.includes(p);
    const isTeacher = user?.user_level?.name === 'Guru';
    const canViewAcademic = !isTeacher || hasTeachingLoad;

    // Format tanggal hari ini dalam Bahasa Indonesia
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    return (
        <div className="space-y-5 sm:space-y-8">
            {/* 1. HERO WELCOME BANNER (Mobile-First Card) */}
            {showWelcome && can('menu_dashboard') && (
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/20 p-5 sm:p-7">
                    {/* Background Glows */}
                    <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-44 h-44 bg-black/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold tracking-wide text-indigo-100 border border-white/20">
                                <Calendar className="w-3.5 h-3.5 text-yellow-300" />
                                <span>{todayFormatted}</span>
                            </div>

                            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                                <span>Assalamu'alaikum, {auth.user.name.split(' ')[0]}</span>
                                <span className="inline-block animate-wave origin-bottom-right">👋</span>
                            </h2>

                            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                                Selamat datang di ruang kerja guru. Pantau jadwal mengajar hari ini dan kelola absensi siswa dengan mudah dari smartphone Anda.
                            </p>
                        </div>

                        {/* Quick Badge info */}
                        <div className="flex items-center gap-2 self-start md:self-auto pt-1 md:pt-0">
                            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                                <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold block">Jadwal Hari Ini</span>
                                <span className="text-lg font-black text-yellow-300">{schedule?.length || 0} Mapel</span>
                            </div>
                            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                                <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold block">Total Santri</span>
                                <span className="text-lg font-black text-white">{stats.my_students || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. JADWAL MENGAJAR HARI INI (Priority Focus di HP - Langsung Terlihat Tanpa Toggle) */}
            {showSchedule && can('view_academic_schedules') && canViewAcademic && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                    Jadwal Mengajar Hari Ini
                                    {schedule && schedule.length > 0 && (
                                        <span className="text-xs bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                            {schedule.length}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-muted-foreground">Jadwal KBM yang harus diisi jurnal & absensinya</p>
                            </div>
                        </div>
                        <Link
                            href={route('academic.schedules.index')}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                        >
                            <span>Semua</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {schedule && schedule.length > 0 ? (
                        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {schedule.map((item, index) => {
                                const subjectId = item.active_subject_id || item.active_subject?.id;
                                const hourNumber = item.learning_hour?.hour_number || (index + 1);
                                const className = item.active_class?.grade?.name || item.active_class?.kelas?.name || item.active_class?.name || 'Kelas';

                                return (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Hour Badge */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex flex-col items-center justify-center shadow-md shadow-indigo-500/20">
                                                <span className="text-[10px] font-semibold uppercase leading-none opacity-80">Jam</span>
                                                <span className="text-base font-black leading-tight">{hourNumber}</span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                                    {item.active_subject?.mapel?.name || 'Mata Pelajaran'}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60">
                                                        {className}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        {item.learning_hour?.start_time || '-'} - {item.learning_hour?.end_time || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                            <Link
                                                href={route('journals.create', {
                                                    active_subject_id: subjectId,
                                                    jam_ke: hourNumber,
                                                })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                <FilePenLine className="w-4 h-4" />
                                                <span>Isi Jurnal & Absensi</span>
                                            </Link>
                                            <Link
                                                href={route('assessments.index', { active_subject_id: subjectId })}
                                                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors active:scale-95 shrink-0"
                                                title="Input Nilai Mapel Ini"
                                            >
                                                <GraduationCap className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-border bg-card/60 text-center space-y-2">
                            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-sm text-foreground">Tidak Ada Jadwal Mengajar Hari Ini</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Hari ini Anda tidak memiliki jam KBM terjadwal. Anda dapat memanfaatkan waktu luang untuk evaluasi nilai atau melengkapi silabus.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 3. PINTASAN MENU CEPAT (Super App 4-Column Grid di Mobile) */}
            {showQuickActions && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-foreground">Akses Cepat Fitur</h3>
                            <p className="text-xs text-muted-foreground">Pintasan menu prioritas pengajar</p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-sm">
                        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
                            
                            {/* 1. Absensi & Jurnal */}
                            {(allowedWidgets.shortcut_journals ?? true) && can('view_journals') && canViewAcademic && (
                                <Link
                                    href={route('journals.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-amber-600 transition-colors">
                                        Absensi
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Jurnal KBM</span>
                                </Link>
                            )}

                            {/* 2. Input Nilai */}
                            {(allowedWidgets.shortcut_grades ?? true) && can('view_assessments') && canViewAcademic && (
                                <Link
                                    href={route('assessments.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        Nilai
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Akademik</span>
                                </Link>
                            )}

                            {/* 3. Jadwal Pelajaran */}
                            {(allowedWidgets.shortcut_calendar ?? true) && can('view_academic_schedules') && canViewAcademic && (
                                <Link
                                    href={route('academic.schedules.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        Jadwal
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Semua Kelas</span>
                                </Link>
                            )}

                            {/* 4. Silabus & RPP */}
                            {(allowedWidgets.shortcut_silabus ?? true) && can('view_silabus') && canViewAcademic && (
                                <Link
                                    href={route('silabus.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-cyan-600 transition-colors">
                                        Silabus
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Materi KBM</span>
                                </Link>
                            )}

                            {/* 5. Penilaian Tahfidz */}
                            {(allowedWidgets.shortcut_tahfidz ?? true) && can('menu_tahfidz') && (
                                <Link
                                    href={route('tahfidz.assessments.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <Book className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-teal-600 transition-colors">
                                        Tahfidz
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Hafalan</span>
                                </Link>
                            )}

                            {/* 6. Ikhtabir Nafsi (Tes AI) */}
                            {(allowedWidgets.shortcut_ikhtabir !== false) && (
                                <Link
                                    href={route('ikhtabir-nafsi.index')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-rose-600 transition-colors">
                                        Tes AI
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Ikhtabir Nafsi</span>
                                </Link>
                            )}

                            {/* 7. Data Santri */}
                            {can('view_students') && canViewAcademic && (
                                <Link
                                    href={route('students.index', { my_students: 1, status: 'Aktif' })}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-purple-600 transition-colors">
                                        Santri
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Biodata</span>
                                </Link>
                            )}

                            {/* 8. Profil Saya */}
                            {(allowedWidgets.shortcut_profile ?? true) && (
                                <Link
                                    href={route('profile.edit')}
                                    className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                >
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-slate-500/25 mb-2 group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 group-hover:text-slate-600 transition-colors">
                                        Profil
                                    </span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Akun Saya</span>
                                </Link>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* 4. STATISTIK BEBAN MENGAJAR (2 Kolom di Mobile, Warna Tajam) */}
            {showStats && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-foreground">Ringkasan Beban Ajar</h3>
                            <p className="text-xs text-muted-foreground">Statistik pengajaran semester aktif</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* 1. Kelas Diampu */}
                        {can('view_active_classes') && canViewAcademic && (
                            <Link href={route('active-classes.index', { my_classes: 1 })} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-4 sm:p-5 shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <Users className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Kelas</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <Users className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_classes || 0}</div>
                                        <p className="text-[11px] text-indigo-100 font-medium truncate mt-0.5">
                                            {stats.my_class_list?.length ? stats.my_class_list.join(', ') : 'Kelas diampu'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 2. Total Santri Ajar */}
                        {can('view_students') && canViewAcademic && (
                            <Link href={route('students.index', { my_students: 1, status: 'Aktif' })} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <GraduationCap className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Santri Ajar</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <GraduationCap className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_students || 0}</div>
                                        <p className="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                                            Santri terdaftar aktif
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 3. Mapel Diampu */}
                        {can('view_silabus') && canViewAcademic && (
                            <Link href={route('silabus.index')} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 sm:p-5 shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <BookOpen className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">Mata Pelajaran</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <BookOpen className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_subjects || 0}</div>
                                        <p className="text-[11px] text-amber-100 font-medium truncate mt-0.5">
                                            {stats.my_subject_list?.length ? stats.my_subject_list.join(', ') : 'Mapel diampu'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 4. Skrining Hafalan */}
                        <Link href={route('tahfidz.pantau-skrining')} className="block group">
                            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white p-4 sm:p-5 shadow-lg shadow-violet-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                    <Sparkles className="w-16 h-16 -mr-4 -mt-4" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">Skrining</span>
                                    <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                        <Book className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl sm:text-3xl font-black">{stats.skrining_today || 0}</div>
                                    <p className="text-[11px] text-violet-100 font-medium truncate mt-0.5">
                                        Aktivitas hari ini
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
