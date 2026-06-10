import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Clock, CalendarDays, BookOpen, GraduationCap, School, User, Wallet, Calendar, Home, AlertTriangle, Check, BookOpenCheck, ClipboardCheck, Book, HeartPulse, Activity } from 'lucide-react';

export default function StudentDashboard({ stats, schedule, allowedWidgets = {} }) {
    const { auth } = usePage().props;
    const notScreenedJuz = Array.isArray(stats?.not_screened_juz) ? stats.not_screened_juz : [];
    const hasTahfidzTarget = (stats?.memorized_juz_count ?? 0) > 0;
    const hasPendingSkrining = notScreenedJuz.length > 0;
    const visiblePendingJuz = notScreenedJuz.slice(0, 4);
    const remainingPendingJuz = Math.max(notScreenedJuz.length - visiblePendingJuz.length, 0);

    // Defaults if allowedWidgets is empty (backward compatibility)
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showClassInfo = allowedWidgets.class_info ?? true;
    const showSchedule = allowedWidgets.schedule_today ?? true;

    return (
        <div className="space-y-8">
            {/* Welcome Card */}
            {showWelcome && (
                <Card className="border-none bg-gradient-to-r from-emerald-600 to-teal-700 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>

                    <CardContent className="p-8 relative z-10">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                                Assalamualaikum, {auth.user.name} 👋
                            </h2>
                            <p className="text-emerald-100 text-lg max-w-2xl">
                                Selamat belajar! Jangan lupa cek jadwal dan tugas hari ini.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Class Info */}
            {showClassInfo && (
                stats && stats.class_name ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Class Info */}
                        <Card className="group hover:shadow-lg transition-all border-none bg-white shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Kelas Aktif
                                </CardTitle>
                                <School className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-800">{stats.class_name}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Wali Kelas: {stats.homeroom_teacher}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Kamar Info */}
                        <Card className="group hover:shadow-lg transition-all border-none bg-white shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Kamar Aktif
                                </CardTitle>
                                <Home className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-800">{stats.kamar_name || 'Belum Masuk Asrama'}</div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Musyrif: {stats.musrif_name || '-'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-sm">
                        Anda belum terdaftar di kelas manapun untuk semester ini.
                    </div>
                )
            )}

            {/* UNIFIED WIDGETS SECTION */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {/* 1. Nilai Akademik (Shortcut) */}
                {(allowedWidgets.shortcut_grades ?? true) && (
                    <Link href={route('students.grades.index')} className="block h-full">
                        <Card className="border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group bg-gradient-to-br from-emerald-500 to-teal-600 text-white h-full flex flex-col hover:-translate-y-1 duration-300">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <GraduationCap className="w-20 h-20 -mr-4 -mt-4 text-white" />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-white" />
                                    Nilai Akademik
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 flex-1 flex flex-col justify-end">
                                <div className="text-2xl font-bold text-white drop-shadow-sm">Cek Rapor</div>
                                <div className="text-xs text-emerald-100 mt-1">Lihat nilai akademik & tahfidz.</div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {/* 2. Pantauan Tahfidz */}
                {allowedWidgets.widget_tahfidz_monitoring && (
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BookOpenCheck className="w-20 h-20 -mr-4 -mt-4 text-emerald-600" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <BookOpenCheck className="h-4 w-4 text-emerald-600" />
                                Progres Tahfidz
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-full">
                            {stats.latest_tahfidz ? (
                                <div>
                                    <div className="text-3xl font-bold text-gray-800">{stats.latest_tahfidz.score}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${stats.latest_tahfidz.score >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {stats.latest_tahfidz.predicate}
                                        </span>
                                        <span className="text-xs text-gray-400">Setoran Terakhir</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">Belum ada nilai semester ini.</div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* 3. Skrining Hafalan */}
                <Link href={route('tahfidz.pantau-skrining')} className="block h-full">
                    <Card className={`border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer h-full flex flex-col hover:-translate-y-1 duration-300 ${
                        hasPendingSkrining
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                            : hasTahfidzTarget
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                    }`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            {hasPendingSkrining ? (
                                <AlertTriangle className="w-20 h-20 -mr-4 -mt-4 text-white" />
                            ) : (
                                <BookOpen className="w-20 h-20 -mr-4 -mt-4 text-white" />
                            )}
                        </div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${
                                hasPendingSkrining ? 'text-amber-100' : 'text-white/80'
                            }`}>
                                {hasPendingSkrining ? (
                                    <AlertTriangle className="h-4 w-4 text-white" />
                                ) : (
                                    <BookOpen className="h-4 w-4 text-white" />
                                )}
                                Skrining Mandiri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 flex-1 flex flex-col justify-between gap-3">
                            {hasPendingSkrining ? (
                                <>
                                    <div>
                                        <div className="text-3xl font-bold text-white drop-shadow-sm">
                                            {stats.not_screened_juz_count ?? notScreenedJuz.length}
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-amber-50">
                                            Juz belum skrining
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                                            Perlu perhatian
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {visiblePendingJuz.map((juz) => (
                                                <span
                                                    key={juz}
                                                    className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                                                >
                                                    Juz {juz}
                                                </span>
                                            ))}
                                            {remainingPendingJuz > 0 && (
                                                <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                                                    +{remainingPendingJuz} lagi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : hasTahfidzTarget ? (
                                <>
                                    <div>
                                        <div className="text-2xl font-bold text-white drop-shadow-sm">Selesai</div>
                                        <div className="mt-1 text-sm text-emerald-50">
                                            Semua juz target hafalan sudah diskrining.
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-emerald-100 font-medium bg-emerald-700/40 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                            Siap ditinjau
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <div className="text-2xl font-bold text-white drop-shadow-sm">Belum Ada Target</div>
                                        <div className="mt-1 text-sm text-violet-100">
                                            Target hafalan selesai akan muncul di sini untuk dipantau skriningnya.
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-violet-100 font-medium bg-violet-700/50 inline-block px-2 py-0.5 rounded-full backdrop-blur-sm">
                                            Menunggu target
                                        </span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Link>

                {/* 4. Analisis Nilai / Info Akademik (<70) */}
                {allowedWidgets.widget_grade_analysis && (
                    <Card className={`border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group h-full ${stats.low_grades?.length > 0 ? 'bg-red-50' : 'bg-white'}`}>
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertTriangle className={`w-20 h-20 -mr-4 -mt-4 ${stats.low_grades?.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <AlertTriangle className={`h-4 w-4 ${stats.low_grades?.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                                Info Akademik
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-full">
                            {stats.low_grades?.length > 0 ? (
                                <div>
                                    <div className="text-red-600 font-bold mb-1 flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        {stats.low_grades.length} Mapel Bth Perhatian
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {stats.low_grades.slice(0, 3).map((g, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded border border-red-200">
                                                {g.subject} ({g.score})
                                            </span>
                                        ))}
                                        {stats.low_grades.length > 3 && (
                                            <span className="text-[10px] text-red-500 font-medium">+{stats.low_grades.length - 3} lainnya</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                                        <Check className="h-5 w-5" />
                                        Aman Terkendali
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Tidak ada nilai di bawah 70.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* 5. Status Kesehatan */}
                <Card className={`border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group h-full ${stats.latest_health_status?.is_sick ? 'bg-rose-50' : 'bg-white'}`}>
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        {stats.latest_health_status?.is_sick ? (
                            <Activity className="w-20 h-20 -mr-4 -mt-4 text-rose-600" />
                        ) : (
                            <HeartPulse className="w-20 h-20 -mr-4 -mt-4 text-emerald-600" />
                        )}
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <HeartPulse className={`h-4 w-4 ${stats.latest_health_status?.is_sick ? 'text-rose-600' : 'text-emerald-600'}`} />
                            Kesehatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                        {stats.latest_health_status ? (
                            <div>
                                <div className={`text-xl font-bold ${stats.latest_health_status.is_sick ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {stats.latest_health_status.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {stats.latest_health_status.date} - {stats.latest_health_status.description}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-xl font-bold text-gray-800">Sehat</div>
                                <p className="text-xs text-gray-500 mt-1">Tidak ada riwayat sakit baru.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 6. Info Keuangan */}
                {allowedWidgets.widget_finance_monitoring && (
                    <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all relative overflow-hidden group h-full">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wallet className="w-20 h-20 -mr-4 -mt-4 text-rose-600" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-rose-600" />
                                Info Keuangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-full">
                            <div className="text-2xl font-bold text-gray-800">{stats.finance_status || 'Aman'}</div>
                            <p className="text-xs text-gray-500 mt-1">Status Pembayaran</p>
                        </CardContent>
                    </Card>
                )}

                {/* 7. Akun Profil (Shortcut) */}
                {allowedWidgets.shortcut_profile && (
                    <Link href={route('profile.edit')} className="block h-full">
                        <Card className="border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group bg-gradient-to-br from-indigo-50 to-blue-50 cursor-pointer h-full flex flex-col hover:-translate-y-1 duration-300">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <User className="w-20 h-20 -mr-4 -mt-4 text-indigo-600" />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                                    <User className="h-4 w-4 text-indigo-600" />
                                    Profil Pribadi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 flex-1 flex flex-col justify-end">
                                <div className="text-xl font-bold text-indigo-950">Biodata Santri</div>
                                <div className="text-xs text-indigo-700/70 mt-1">Pengaturan & Edit akun.</div>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                {/* 8. Angket (Hanya Muncul Jika Ada Yg Aktif) */}
                {stats.active_angket_count > 0 && (
                    <Link href={route('student.supervisions.index')} className="block h-full">
                        <Card className="border-none shadow-md hover:shadow-lg transition-all relative overflow-hidden group bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer h-full flex flex-col hover:-translate-y-1 duration-300 animate-in fade-in zoom-in-95 duration-500">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ClipboardCheck className="w-20 h-20 -mr-4 -mt-4 text-white" />
                            </div>
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-white" />
                                    Angket Evaluasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 flex-1 flex flex-col justify-end">
                                <div className="text-3xl font-bold text-white drop-shadow-sm flex items-center gap-2">
                                    {stats.active_angket_count} <span className="text-sm font-normal text-amber-100">Menunggu</span>
                                </div>
                                <div className="text-xs text-amber-100 mt-1">Bantu nilai guru Anda sekarang!</div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>

            {/* Schedule */}
            {
                showSchedule && (
                    <Card className="col-span-full border-none shadow-md bg-white flex flex-col h-full">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-gray-800">Jadwal Hari Ini</CardTitle>
                                    <CardDescription className="text-gray-500">Agenda pelajaran Anda.</CardDescription>
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
                                                        {item.teacher?.name || 'Guru Belum Ditentukan'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {item.learning_hour?.start_time} - {item.learning_hour?.end_time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <div className="p-4 bg-white rounded-full mb-3 shadow-sm">
                                        <Clock className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium text-gray-500">Tidak ada jadwal pelajaran hari ini</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
