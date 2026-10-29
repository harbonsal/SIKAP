import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { 
    MessageSquare, 
    Clock, 
    Moon, 
    FileSpreadsheet, 
    TrendingUp, 
    Users, 
    Building2, 
    ChevronRight, 
    PlusCircle, 
    AlertTriangle, 
    CheckCircle2, 
    Sparkles, 
    BookOpen,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

export default function OswanDashboard({ stats = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};

    const section = stats?.oswan_section || 'all'; // 'bahasa' | 'ibadah' | 'tandzim' | 'all'

    // Konfigurasi Tema Qismu
    const qismuConfig = {
        bahasa: {
            title: 'Qismu Lughoh (Bahasa)',
            badge: 'Divisi Bahasa',
            subtitle: 'Pencatatan Mukholafah Bahasa Arab & Inggris',
            gradient: 'from-purple-600 via-indigo-600 to-teal-700',
            accentColor: 'text-purple-600 dark:text-purple-400',
            bgAccent: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
            btnGradient: 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
            icon: MessageSquare,
            inputUrl: route('care.oswan.index', { section: 'bahasa' }),
            unitName: 'Kasus Bahasa',
        },
        ibadah: {
            title: 'Qismu Ibadah',
            badge: 'Divisi Ibadah',
            subtitle: 'Pencatatan Keterlambatan Salat & Ibadah Jamaah',
            gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            bgAccent: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
            icon: Clock,
            inputUrl: route('care.oswan.index', { section: 'ibadah' }),
            unitName: 'Kasus Ibadah',
        },
        tandzim: {
            title: 'Qismu Tandzim (Ketertiban)',
            badge: 'Divisi Ketertiban',
            subtitle: 'Pencatatan Pelanggaran Jam Tidur, Kepatuhan & Asrama',
            gradient: 'from-blue-600 via-indigo-600 to-slate-800',
            accentColor: 'text-blue-600 dark:text-blue-400',
            bgAccent: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
            btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
            icon: Moon,
            inputUrl: route('care.oswan.index', { section: 'tandzim' }),
            unitName: 'Kasus Ketertiban',
        },
        all: {
            title: 'Koordinator OSWAN',
            badge: 'Pengurus Pusat OSWAN',
            subtitle: 'Rekapitulasi Seluruh Divisi: Bahasa, Ibadah, & Ketertiban',
            gradient: 'from-slate-800 via-emerald-800 to-teal-900',
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            bgAccent: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
            btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
            icon: FileSpreadsheet,
            inputUrl: route('care.oswan.index'),
            unitName: 'Total Pelanggaran',
        }
    };

    const currentQismu = qismuConfig[section] || qismuConfig.all;
    const MainIcon = currentQismu.icon;

    const weekViolations = stats?.total_violations_week ?? 0;
    const monthViolations = stats?.total_violations_month ?? 0;
    const studentViolating = stats?.total_students_violating ?? 0;
    const currentWeek = stats?.current_week ?? 1;

    return (
        <div className="space-y-4 max-w-7xl mx-auto pb-6">
            {/* ── 1. HERO BANNER & IDENTITAS QISMU ───────────────────────────────── */}
            <div className={`bg-gradient-to-r ${currentQismu.gradient} rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/20 shadow-xs">
                            <MainIcon className="w-3.5 h-3.5" />
                            <span>{currentQismu.badge}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                            Ahlan wa Sahlan, {user.name || 'Pengurus OSWAN'} 👋
                        </h1>
                        <p className="text-white/85 text-xs sm:text-sm max-w-2xl leading-relaxed">
                            {currentQismu.subtitle}. Data mukholafah yang antum catat akan langsung mengurangi nilai akhlak santri di akun musyrif.
                        </p>
                    </div>

                    {/* Tombol Utama Akses Cepat */}
                    <div className="shrink-0 flex flex-col sm:flex-row gap-2.5">
                        <Link
                            href={currentQismu.inputUrl}
                            className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer group`}
                        >
                            <PlusCircle className="w-5 h-5 text-emerald-600 group-hover:rotate-90 transition-transform" />
                            <span>Input Jurnal Sekarang</span>
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── 2. METRIK RINGKAS (3 KARTU MINI CEPAT) ───────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Metrik 1: Pekan Ini */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Pekan Ke-{currentWeek} Ini
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                            {weekViolations}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {currentQismu.unitName}
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>

                {/* Metrik 2: Santri Terlibat */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Santri Melanggar
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                            {studentViolating}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Anak tercatat pekan ini
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                {/* Metrik 3: Bulan Berjalan */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Total Bulan Ini
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                            {monthViolations}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Akumulasi pengurangan nilai
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* ── 3. FAST MENU LAUNCHER (Tombol Pintas Super Cepat) ─────────────── */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Fast Menu OSWAN
                    </h2>
                    <span className="text-[11px] text-slate-400">1-Klik Akses Langsung</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Kartu 1: Input Jurnal Mukholafah */}
                    <Link
                        href={currentQismu.inputUrl}
                        className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    Input Jurnal Mukholafah
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    Catat per kamar / kelas pekan ke-{currentWeek}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>

                    {/* Kartu 2: Rekapitulasi & Monitoring */}
                    <Link
                        href={route('care.oswan.monitor')}
                        className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    Rekap & Riwayat Bulanan
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    Lihat akumulasi poin pelanggaran santri
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>

                    {/* Kartu 3: Al-Qur'an Digital */}
                    <Link
                        href={route('quran.index')}
                        className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-teal-500 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30 group-hover:scale-105 transition-transform">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                    Al-Qur'an Digital
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    Mushaf tilawah & murajaah santri
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                </div>
            </div>

            {/* ── 4. PANDUAN PENGURUS RINGKAS ───────────────────────────────────── */}
            <div className="bg-amber-500/10 border border-amber-300/40 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-amber-950 dark:text-amber-100">
                        Petunjuk Pencatatan Mukholafah {currentQismu.title}:
                    </p>
                    <p className="text-amber-900/85 dark:text-amber-200/90 leading-relaxed">
                        Setiap santri memiliki modal awal <strong>100 poin</strong> pada penilaian akhlak Musyrif. Catatan mukholafah yang antum input di sini akan <strong>otomatis mengurangi poin</strong> santri tersebut pada bulan berjalan (Contoh: 5x melanggar = nilai menjadi 95).
                    </p>
                </div>
            </div>
        </div>
    );
}

