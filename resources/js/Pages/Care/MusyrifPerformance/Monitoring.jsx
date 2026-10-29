import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { 
    Users, 
    Calendar, 
    Download, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Search, 
    Building2, 
    FileSpreadsheet, 
    TrendingUp, 
    ShieldCheck, 
    Filter,
    ChevronLeft,
    ChevronRight,
    Info,
    RotateCcw
} from 'lucide-react';

export default function Monitoring({ 
    date, 
    formattedDate, 
    duties = [], 
    matrix = [], 
    summary = {} 
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKamar, setSelectedKamar] = useState('');

    const handleDateChange = (newDate) => {
        router.get(route('care.musyrif-performance.monitoring'), { date: newDate }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Filter musyrif berdasarkan search & kamar
    const filteredMatrix = matrix.filter((item) => {
        const matchName = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(item.nomor_induk).toLowerCase().includes(searchQuery.toLowerCase());
        const matchKamar = selectedKamar ? item.kamar === selectedKamar : true;
        return matchName && matchKamar;
    });

    // Daftar kamar unik untuk dropdown filter
    const uniqueKamars = Array.from(new Set(matrix.map(m => m.kamar).filter(k => k && k !== '-')));

    return (
        <MainLayout>
            <Head title={`Monitoring Kinerja Musyrif - ${formattedDate}`} />

            <div className="space-y-4 max-w-7xl mx-auto pb-24 px-2 sm:px-4">
                {/* ── 1. HEADER BANNER MONITORING ────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 text-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>PJ Kemusyrifan & Pengasuhan</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                                <span>Monitoring Kinerja & Kepatuhan Musyrif</span>
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                Pantau kedisiplinan dan checklist tugas harian musyrif asrama secara real-time.
                            </p>
                        </div>

                        {/* Tombol Ekspor Excel */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <a
                                href={route('care.musyrif-performance.export', { date })}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh Rekap Excel (.xlsx)</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── 2. STATS CARDS RINGKASAN ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Musyrif Terdaftar</span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-foreground mt-2">
                            {summary.total_musyrif || 0}
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">Staff pengasuhan aktif</span>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Rata-rata Kepatuhan</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                            {summary.avg_score || 0}%
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">Kepatuhan tugas hari ini</span>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Tepat Waktu</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-foreground mt-2">
                            {summary.total_completed || 0}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Sesi hadir tepat waktu</span>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">Terlambat</span>
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                            {summary.total_late || 0}
                        </div>
                        <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">Sesi tugas terlambat</span>
                    </div>
                </div>

                {/* ── 3. FILTER TANGGAL, KAMAR, & PENCARIAN ───────────────────────────── */}
                <div className="bg-card rounded-2xl border p-3.5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Selector Tanggal */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Tanggal:
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="text-xs sm:text-sm font-semibold rounded-xl border border-input bg-background px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                ({formattedDate})
                            </span>
                        </div>

                        {/* Search Bar & Filter Kamar */}
                        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
                            {uniqueKamars.length > 0 && (
                                <select
                                    value={selectedKamar}
                                    onChange={(e) => setSelectedKamar(e.target.value)}
                                    className="text-xs rounded-xl border border-input bg-background px-2.5 py-1.5 text-muted-foreground"
                                >
                                    <option value="">Semua Kamar</option>
                                    {uniqueKamars.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            )}

                            <div className="relative flex-1 min-w-[160px]">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari Musyrif..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 4. LIVE MATRIKS MONITORING (TABEL) ──────────────────────────────── */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto min-h-[380px]">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/70 text-muted-foreground text-[11px] uppercase tracking-wider font-bold border-b select-none">
                                <tr>
                                    <th className="px-3 py-3 w-10 text-center">No</th>
                                    <th className="px-4 py-3 min-w-[180px]">Nama Musyrif</th>
                                    <th className="px-3 py-3 min-w-[100px]">Kamar</th>

                                    {/* Kolom Setiap Sesi Tugas Hari Ini */}
                                    {duties.map((duty) => (
                                        <th key={duty.id} className="px-3 py-3 text-center min-w-[110px]">
                                            <div className="truncate max-w-[130px]" title={duty.title}>
                                                {duty.title}
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground font-normal block mt-0.5">
                                                {duty.time_range}
                                            </span>
                                        </th>
                                    ))}

                                    <th className="px-3 py-3 text-center w-16 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                                        Hadir
                                    </th>
                                    <th className="px-3 py-3 text-center w-16 bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                                        Telat
                                    </th>
                                    <th className="px-3 py-3 text-center w-20">
                                        Skor Kepatuhan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredMatrix.length === 0 ? (
                                    <tr>
                                        <td colSpan={duties.length + 6} className="px-6 py-14 text-center text-muted-foreground">
                                            <Users className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                                            <p className="font-semibold text-sm text-foreground">Tidak ada data musyrif yang cocok</p>
                                            <p className="text-xs mt-0.5">Sesuaikan filter atau kata kunci pencarian antum.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMatrix.map((item, rowIndex) => {
                                        return (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2 text-center text-muted-foreground font-mono">
                                                    {rowIndex + 1}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="font-bold text-foreground text-xs leading-snug">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        NI: {item.nomor_induk}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-emerald-600" />
                                                        {item.kamar}
                                                    </span>
                                                </td>

                                                {/* Status Setiap Tugas */}
                                                {duties.map((duty) => {
                                                    const dutyData = item.duties[duty.id] || { status: 'pending' };
                                                    const status = dutyData.status;

                                                    return (
                                                        <td key={duty.id} className="px-2 py-2 text-center">
                                                            {status === 'completed' && (
                                                                <span 
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-bold text-[10px]"
                                                                    title={dutyData.notes ? `Catatan: ${dutyData.notes}` : `Tepat waktu: ${dutyData.checked_at || '-'}`}
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    <span>{dutyData.checked_at || 'Hadir'}</span>
                                                                </span>
                                                            )}
                                                            {status === 'late' && (
                                                                <span 
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg font-bold text-[10px]"
                                                                    title={dutyData.notes ? `Catatan: ${dutyData.notes}` : `Terlambat: ${dutyData.checked_at || '-'}`}
                                                                >
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    <span>{dutyData.checked_at || 'Telat'}</span>
                                                                </span>
                                                            )}
                                                            {status === 'excused' && (
                                                                <span 
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg font-bold text-[10px]"
                                                                    title={dutyData.notes ? `Catatan: ${dutyData.notes}` : 'Izin'}
                                                                >
                                                                    <Info className="w-3 h-3" />
                                                                    <span>Izin</span>
                                                                </span>
                                                            )}
                                                            {status === 'pending' && (
                                                                <span className="text-[10px] text-muted-foreground/40 font-mono">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Rekap Angka */}
                                                <td className="px-3 py-2 text-center font-bold text-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10">
                                                    {item.completed}
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold text-amber-600 bg-amber-50/20 dark:bg-amber-950/10">
                                                    {item.late}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-md font-extrabold text-xs ${
                                                        item.score >= 90
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : (item.score >= 70
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300')
                                                    }`}>
                                                        {item.score}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

