import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { BookOpen, MapPin, Clock, CalendarDays, CheckCircle2, ShieldAlert, Heart, HeartHandshake, BookOpenCheck, Flame } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentHolidayDashboard({ stats }) {
    const { auth } = usePage().props;
    const holiday = stats.active_holiday;

    // Countdown Logic
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        if (!holiday || !holiday.end_time) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(holiday.end_time).getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft('Waktu Habis');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days} Hari ${hours} Jam ${minutes} Menit`);
        }, 1000);

        return () => clearInterval(timer);
    }, [holiday]);

    const notScreenedJuz = Array.isArray(stats?.not_screened_juz) ? stats.not_screened_juz : [];
    const hasPendingSkrining = notScreenedJuz.length > 0;
    const totalJuzTarget = stats?.memorized_juz_count || 0;
    const progress = totalJuzTarget > 0 ? Math.round(((totalJuzTarget - notScreenedJuz.length) / totalJuzTarget) * 100) : 100;

    const defaultMessages = [
        { icon: <Heart className="w-4 h-4 text-rose-500" />, text: "Jaga Shalat 5 Waktu berjamaah." },
        { icon: <HeartHandshake className="w-4 h-4 text-amber-500" />, text: "Berbakti dan bantu pekerjaan orang tua." },
        { icon: <BookOpen className="w-4 h-4 text-emerald-500" />, text: "Istiqomah murojaah hafalan Al-Qur'an." },
        { icon: <ShieldAlert className="w-4 h-4 text-indigo-500" />, text: "Gunakan HP/gadget dengan bijak." }
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Hero Section */}
            <Card className="border-none bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md">
                            Selamat Berlibur, {auth.user.name.split(' ')[0]}! 🌴
                        </h2>
                        <p className="text-orange-50 text-lg md:text-xl font-medium max-w-2xl drop-shadow-sm">
                            Sampaikan salam rindu dari pesantren untuk keluarga di rumah.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                            {stats?.class_name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-white text-sm font-medium border border-white/20 backdrop-blur-sm shadow-sm">
                                    <BookOpen className="w-4 h-4" /> {stats.class_name}
                                </span>
                            )}
                            {stats?.kamar_name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-white text-sm font-medium border border-white/20 backdrop-blur-sm shadow-sm">
                                    <MapPin className="w-4 h-4" /> Asrama {stats.kamar_name}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg text-center min-w-[250px]">
                        <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">Sisa Waktu Liburan</p>
                        <div className="text-2xl font-black text-white font-mono tracking-tight drop-shadow-md">
                            {timeLeft || 'Menghitung...'}
                        </div>
                        <p className="text-white/70 text-xs mt-2 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> Batas: {new Date(holiday.end_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Main Quest: Skrining (Col 8) */}
                <Card className="md:col-span-8 border-none shadow-xl bg-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                        <BookOpenCheck className="w-64 h-64 -mt-10 -mr-10" />
                    </div>
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                                <Flame className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-gray-800">Misi Utama Liburan</CardTitle>
                                <CardDescription className="text-gray-500 font-medium">Skrining & Murojaah Hafalan Al-Qur'an</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {totalJuzTarget > 0 ? (
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Circular Progress */}
                                <div className="relative flex items-center justify-center w-40 h-40 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-100"
                                            strokeDasharray="100, 100"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="text-emerald-500 transition-all duration-1000 ease-out"
                                            strokeDasharray={`${progress}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-black text-gray-800">{progress}%</span>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Selesai</span>
                                    </div>
                                </div>

                                {/* Detail Target */}
                                <div className="flex-1 w-full">
                                    {hasPendingSkrining ? (
                                        <>
                                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                                                Kamu memiliki {notScreenedJuz.length} Juz yang belum di-skrining
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {notScreenedJuz.map((juz) => (
                                                    <span key={juz} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold shadow-sm">
                                                        Juz {juz}
                                                    </span>
                                                ))}
                                            </div>
                                            <Link href={route('quran.skrining')} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                                Mulai Skrining Sekarang
                                            </Link>
                                        </>
                                    ) : (
                                        <div className="text-center md:text-left">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-800 mb-2">Alhamdulillah! 🎉</h4>
                                            <p className="text-gray-500">
                                                Kamu sudah menyelesaikan semua target skrining untuk liburan ini. Tetap pertahankan murojaahmu ya!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-lg">Belum ada target hafalan yang tercatat untukmu.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Side Column (Col 4) */}
                <div className="md:col-span-4 space-y-6">
                    {/* Pesan Pesantren */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                                <HeartHandshake className="w-5 h-5 text-rose-500" />
                                Pesan Cinta Pesantren
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {holiday.description ? (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {holiday.description}
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {defaultMessages.map((msg, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <div className="mt-0.5 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                                                {msg.icon}
                                            </div>
                                            <span className="leading-snug">{msg.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Perizinan Info */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                                <MapPin className="w-5 h-5 text-indigo-500" />
                                Detail Perizinan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                    {holiday.name} (Di Luar Pesantren)
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Waktu Keluar</p>
                                <p className="text-sm text-gray-800 font-medium">
                                    {new Date(holiday.exit_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
