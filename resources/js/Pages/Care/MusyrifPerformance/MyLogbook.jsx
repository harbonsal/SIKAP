import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Building2, 
    MessageSquare, 
    Sparkles, 
    Check, 
    RotateCcw,
    ShieldCheck,
    Coffee,
    Moon,
    Sun,
    Activity,
    Info,
    CalendarCheck
} from 'lucide-react';

export default function MyLogbook({ 
    date, 
    isToday, 
    formattedDate, 
    duties = [], 
    myKamar = 'Kamar Asrama', 
    stats = {}, 
    sevenDaysHistory = [] 
}) {
    const [activeNotes, setActiveNotes] = useState({});
    const [submittingId, setSubmittingId] = useState(null);

    // Filter tanggal
    const handleDateChange = (newDate) => {
        router.get(route('care.musyrif-performance.my-logbook'), { date: newDate }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    // Aksi Checklist Cepat
    const handleCheck = (dutyId, status) => {
        setSubmittingId(dutyId);
        const currentNote = activeNotes[dutyId] !== undefined 
            ? activeNotes[dutyId] 
            : (duties.find(d => d.id === dutyId)?.notes || '');

        router.post(route('care.musyrif-performance.check'), {
            duty_template_id: dutyId,
            date: date,
            status: status,
            notes: currentNote
        }, {
            preserveScroll: true,
            onFinish: () => setSubmittingId(null)
        });
    };

    // Simpan Catatan Khusus
    const handleSaveNote = (dutyId) => {
        setSubmittingId(dutyId);
        const currentDuty = duties.find(d => d.id === dutyId);
        const status = currentDuty?.status === 'pending' ? 'completed' : currentDuty?.status;

        router.post(route('care.musyrif-performance.check'), {
            duty_template_id: dutyId,
            date: date,
            status: status,
            notes: activeNotes[dutyId] || ''
        }, {
            preserveScroll: true,
            onFinish: () => setSubmittingId(null)
        });
    };

    // Helper Kategori Icon & Warna
    const getCategoryBadge = (cat) => {
        switch (cat) {
            case 'Ibadah':
                return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Sun };
            case 'Makan':
                return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300', icon: Coffee };
            case 'Asrama':
                return { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300', icon: Moon };
            case 'Piket Khusus':
                return { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300', icon: Sparkles };
            default:
                return { bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300', icon: Activity };
        }
    };

    const completionPercent = stats.compliance_rate || 0;

    return (
        <MainLayout>
            <Head title={`Logbook Tugas Musyrif - ${formattedDate}`} />

            <div className="space-y-4 max-w-4xl mx-auto pb-24 px-2 sm:px-4">
                {/* ── 1. HERO BANNER MUSYRIF ─────────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{myKamar}</span>
                                <span>•</span>
                                <span>Biro Pengasuhan</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                                Digital Logbook Tugas Asrama 📋
                            </h1>
                            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                                Rekapitulasi real-time pendampingan ibadah, makan, dan ketertiban kamar santri.
                            </p>
                        </div>

                        {/* Progress Meter Ringkas */}
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 shrink-0 text-center sm:min-w-[140px]">
                            <span className="text-[11px] font-medium text-emerald-100 block">Kepatuhan Hari Ini</span>
                            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                                {completionPercent}%
                            </div>
                            <span className="text-[10px] text-emerald-200 block mt-0.5">
                                {stats.completed || 0} dari {stats.total || 0} Tugas
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar Strip */}
                    <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-3">
                        <div className="flex-1 bg-black/20 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, completionPercent)}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-emerald-100">
                            {stats.completed || 0}/{stats.total || 0}
                        </span>
                    </div>
                </div>

                {/* ── 2. SWIPEABLE 7-HARI NAVIGASI TANGGAL ───────────────────────────── */}
                <div className="bg-card rounded-2xl border p-2.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-2 px-1">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            {formattedDate}
                        </span>
                        {!isToday && (
                            <button
                                type="button"
                                onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            >
                                Kembali ke Hari Ini
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center">
                        {sevenDaysHistory.map((item) => (
                            <button
                                key={item.date}
                                type="button"
                                onClick={() => handleDateChange(item.date)}
                                className={`p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                    item.is_selected
                                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs scale-102'
                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                }`}
                            >
                                <span className="block text-[10px] uppercase font-bold opacity-80">{item.day_name}</span>
                                <span className="block text-sm font-extrabold mt-0.5">{item.date.split('-')[2]}</span>
                                <div className="mt-1 flex justify-center">
                                    <span className={`w-2 h-2 rounded-full ${
                                        item.rate === 100 
                                            ? 'bg-emerald-400' 
                                            : (item.rate > 0 ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600')
                                    }`} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── 3. TIMELINE DAFTAR TUGAS MUSYRIF ──────────────────────────────── */}
                <div className="space-y-3">
                    {duties.length === 0 ? (
                        <div className="bg-card rounded-2xl border p-12 text-center text-muted-foreground">
                            <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-600" />
                            <h3 className="text-base font-bold text-foreground">Tidak Ada Jadwal Tugas</h3>
                            <p className="text-xs mt-1">Tidak ada jadwal tugas musyrif yang tercatat pada hari ini.</p>
                        </div>
                    ) : (
                        duties.map((duty, idx) => {
                            const cat = getCategoryBadge(duty.category);
                            const CatIcon = cat.icon;
                            const isCurrent = duty.is_current_session;
                            const isDone = duty.status === 'completed';
                            const isLate = duty.status === 'late';
                            const isExcused = duty.status === 'excused';
                            const isChecked = isDone || isLate || isExcused;
                            const isSubmitting = submittingId === duty.id;

                            return (
                                <div
                                    key={duty.id}
                                    className={`bg-card rounded-2xl border p-4 sm:p-5 transition-all shadow-xs relative overflow-hidden ${
                                        isCurrent 
                                            ? 'ring-2 ring-emerald-500 shadow-md border-emerald-300 dark:border-emerald-700 bg-emerald-50/15 dark:bg-emerald-950/10' 
                                            : ''
                                    } ${
                                        isChecked ? 'bg-muted/20' : ''
                                    }`}
                                >
                                    {/* Indikator Sesi Berjalan Sekarang */}
                                    {isCurrent && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider mb-2 animate-pulse">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Sesi Berjalan Sekarang</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        {/* Kiri: Jam & Rincian Tugas */}
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Jam Tugas */}
                                                <span className="inline-flex items-center gap-1 text-xs font-black font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                                    {duty.start_time} - {duty.end_time} WIB
                                                </span>

                                                {/* Badge Kategori */}
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cat.bg}`}>
                                                    <CatIcon className="w-3 h-3" />
                                                    {duty.category}
                                                </span>

                                                {/* Status Centang */}
                                                {isDone && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Hadir ({duty.checked_at})
                                                    </span>
                                                )}
                                                {isLate && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-lg">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Terlambat ({duty.checked_at})
                                                    </span>
                                                )}
                                                {isExcused && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-lg">
                                                        <Info className="w-3 h-3" />
                                                        Izin / Berhalangan
                                                    </span>
                                                )}
                                            </div>

                                            <h2 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                                                {duty.title}
                                            </h2>

                                            {duty.target_description && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {duty.target_description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Kanan: Tombol Fast Action 1-Tap */}
                                        <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                                            {!isChecked ? (
                                                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                                    {/* Tombol Utama: Hadir / Selesai */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheck(duty.id, 'completed')}
                                                        disabled={isSubmitting}
                                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>Selesai</span>
                                                    </button>

                                                    {/* Tombol Opsi: Terlambat */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheck(duty.id, 'late')}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                                        title="Tandai Terlambat"
                                                    >
                                                        <span>Telat</span>
                                                    </button>

                                                    {/* Tombol Opsi: Izin */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheck(duty.id, 'excused')}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs rounded-xl border transition-all cursor-pointer"
                                                        title="Tandai Izin"
                                                    >
                                                        <span>Izin</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheck(duty.id, 'uncheck')}
                                                        disabled={isSubmitting}
                                                        className="text-[11px] text-muted-foreground hover:text-red-600 inline-flex items-center gap-1 px-2 py-1 rounded-lg border hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                        title="Batalkan status tugas ini"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        <span>Batal Centang</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Kolom Catatan Kejadian Asrama / Santri Sakit */}
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Catatan kendala/santri kamar (opsional)..."
                                                value={activeNotes[duty.id] !== undefined ? activeNotes[duty.id] : (duty.notes || '')}
                                                onChange={(e) => setActiveNotes({ ...activeNotes, [duty.id]: e.target.value })}
                                                onBlur={() => {
                                                    if (activeNotes[duty.id] !== undefined && activeNotes[duty.id] !== duty.notes) {
                                                        handleSaveNote(duty.id);
                                                    }
                                                }}
                                                className="flex-1 text-xs rounded-xl border border-input bg-background/50 px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            />
                                            {activeNotes[duty.id] !== undefined && activeNotes[duty.id] !== duty.notes && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveNote(duty.id)}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                                                >
                                                    Simpan
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

