import React, { useState, useEffect, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { 
    Clock, 
    MessageSquare, 
    Moon, 
    Search, 
    Filter, 
    Save, 
    CheckCircle2, 
    AlertCircle, 
    Minus,
    Plus,
    UserCheck,
    RotateCcw,
    FileSpreadsheet,
    Building2,
    GraduationCap,
    Sparkles,
    ShieldCheck,
    ArrowLeft
} from 'lucide-react';

export default function OswanIndex({ 
    students = [], 
    existingRecords = {}, 
    kamars = [], 
    classes = [], 
    filters = {}, 
    academicYear, 
    semester,
    oswanSection = 'all',
    isSectionLocked = false
}) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(filters.week_number || 1);
    const [selectedKamar, setSelectedKamar] = useState(filters.active_kamar_id || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Mode tampilan tab bagian jika user koordinator / admin
    const [activeSectionTab, setActiveSectionTab] = useState(oswanSection !== 'all' ? oswanSection : (filters.section || 'all'));

    // Form data: { [student_id]: { student_id, ibadah_count: 0, bahasa_count: 0, tidur_count: 0, notes: '' } }
    const [records, setRecords] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

    // Refs untuk navigasi keyboard cell tabel
    const inputRefs = useRef({});

    const months = [
        { id: 1, name: 'Januari' }, { id: 2, name: 'Februari' }, { id: 3, name: 'Maret' },
        { id: 4, name: 'April' }, { id: 5, name: 'Mei' }, { id: 6, name: 'Juni' },
        { id: 7, name: 'Juli' }, { id: 8, name: 'Agustus' }, { id: 9, name: 'September' },
        { id: 10, name: 'Oktober' }, { id: 11, name: 'November' }, { id: 12, name: 'Desember' }
    ];

    // Konfigurasi Tema Qismu
    const sectionConfigs = {
        bahasa: {
            title: 'Qismu Lughoh (Bahasa)',
            badge: 'Divisi Bahasa',
            subtitle: 'Pencatatan Mukholafah Bahasa Arab & Inggris',
            gradient: 'from-purple-600 via-indigo-600 to-teal-700',
            accentColor: 'text-purple-600 dark:text-purple-400',
            bgCard: 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
            icon: MessageSquare,
            field: 'bahasa_count',
            fieldName: 'Mukholafah Bahasa',
        },
        ibadah: {
            title: 'Qismu Ibadah',
            badge: 'Divisi Ibadah',
            subtitle: 'Pencatatan Keterlambatan Salat & Jamaah',
            gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            bgCard: 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
            icon: Clock,
            field: 'ibadah_count',
            fieldName: 'Telat Salat',
        },
        tandzim: {
            title: 'Qismu Tandzim (Ketertiban)',
            badge: 'Divisi Ketertiban',
            subtitle: 'Pencatatan Jam Tidur & Ketertiban Santri',
            gradient: 'from-blue-600 via-indigo-600 to-slate-800',
            accentColor: 'text-blue-600 dark:text-blue-400',
            bgCard: 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
            icon: Moon,
            field: 'tidur_count',
            fieldName: 'Jam Tidur / Tertib',
        },
        all: {
            title: 'Jurnal Ketertiban OSWAN (Semua Bagian)',
            badge: 'Koordinator OSWAN',
            subtitle: 'Rekapitulasi Gabungan: Bahasa (Kedisiplinan), Ibadah (Ibadah), dan Jam Tidur (Kepatuhan)',
            gradient: 'from-slate-800 via-emerald-800 to-teal-900',
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            bgCard: 'bg-muted/40 border-border',
            icon: FileSpreadsheet,
            field: null,
            fieldName: 'Semua Bidang',
        }
    };

    const currentConfig = sectionConfigs[activeSectionTab] || sectionConfigs.all;
    const HeaderIcon = currentConfig.icon;

    // Inisialisasi data dari existingRecords
    useEffect(() => {
        const initial = {};
        students.forEach(s => {
            const rec = existingRecords[s.id];
            initial[s.id] = {
                student_id: s.id,
                ibadah_count: rec ? Number(rec.ibadah_count) : 0,
                bahasa_count: rec ? Number(rec.bahasa_count) : 0,
                tidur_count: rec ? Number(rec.tidur_count) : 0,
                notes: rec?.notes || '',
            };
        });
        setRecords(initial);
        setHasUnsavedChanges(false);
    }, [students, existingRecords]);

    // Keyboard shortcut Ctrl+S untuk simpan cepat
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [records, selectedYear, selectedMonth, selectedWeek, activeSectionTab]);

    const handleFilterChange = (updates = {}) => {
        const query = {
            month: updates.month !== undefined ? updates.month : selectedMonth,
            year: updates.year !== undefined ? updates.year : selectedYear,
            week_number: updates.week_number !== undefined ? updates.week_number : selectedWeek,
            active_kamar_id: updates.active_kamar_id !== undefined ? updates.active_kamar_id : selectedKamar,
            active_class_id: updates.active_class_id !== undefined ? updates.active_class_id : selectedClass,
            search: updates.search !== undefined ? updates.search : searchQuery,
            section: !isSectionLocked ? (updates.section !== undefined ? updates.section : activeSectionTab) : undefined,
        };

        router.get(route('care.oswan.index'), query, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    const handleInputChange = (studentId, field, rawValue) => {
        const val = rawValue === '' ? 0 : Math.max(0, parseInt(rawValue, 10) || 0);
        setRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                student_id: studentId,
                [field]: val
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Tombol Cepat: Stepper +/- & +1
    const handleStep = (studentId, field, delta) => {
        setRecords(prev => {
            const currentVal = Number(prev[studentId]?.[field]) || 0;
            const nextVal = Math.max(0, currentVal + delta);
            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    student_id: studentId,
                    [field]: nextVal
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleNotesChange = (studentId, rawValue) => {
        setRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                student_id: studentId,
                notes: rawValue
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Navigasi keyboard Excel-like (Enter / Arrow keys)
    const handleCellKeyDown = (e, rowIndex, colIndex) => {
        const totalRows = students.length;
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextRow = Math.min(totalRows - 1, rowIndex + 1);
            inputRefs.current[`${nextRow}-${colIndex}`]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevRow = Math.max(0, rowIndex - 1);
            inputRefs.current[`${prevRow}-${colIndex}`]?.focus();
        }
    };

    const handleClearAllInView = () => {
        if (!confirm('Apakah antum yakin ingin mengosongkan seluruh angka pelanggaran di tabel yang tampil saat ini?')) {
            return;
        }

        setRecords(prev => {
            const nextRecords = { ...prev };
            students.forEach(s => {
                if (activeSectionTab === 'bahasa') {
                    nextRecords[s.id] = { ...nextRecords[s.id], bahasa_count: 0 };
                } else if (activeSectionTab === 'ibadah') {
                    nextRecords[s.id] = { ...nextRecords[s.id], ibadah_count: 0 };
                } else if (activeSectionTab === 'tandzim') {
                    nextRecords[s.id] = { ...nextRecords[s.id], tidur_count: 0 };
                } else {
                    nextRecords[s.id] = {
                        student_id: s.id,
                        ibadah_count: 0,
                        bahasa_count: 0,
                        tidur_count: 0,
                        notes: ''
                    };
                }
            });
            return nextRecords;
        });
        setHasUnsavedChanges(true);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        setIsSaving(true);

        const payload = {
            year: selectedYear,
            month: selectedMonth,
            week_number: selectedWeek,
            section: activeSectionTab,
            records: Object.values(records)
        };

        router.post(route('care.oswan.store'), payload, {
            onSuccess: () => {
                setIsSaving(false);
                setHasUnsavedChanges(false);
                setSaveSuccessMessage(true);
                setTimeout(() => setSaveSuccessMessage(false), 4000);
            },
            onError: () => {
                setIsSaving(false);
            }
        });
    };

    // Total pelanggaran santri yang sedang tampil di tabel
    const totalViolationsInView = students.reduce((sum, s) => {
        const r = records[s.id] || {};
        if (activeSectionTab === 'bahasa') return sum + (Number(r.bahasa_count) || 0);
        if (activeSectionTab === 'ibadah') return sum + (Number(r.ibadah_count) || 0);
        if (activeSectionTab === 'tandzim') return sum + (Number(r.tidur_count) || 0);
        return sum + (Number(r.ibadah_count) || 0) + (Number(r.bahasa_count) || 0) + (Number(r.tidur_count) || 0);
    }, 0);

    const totalStudentsViolating = students.filter(s => {
        const r = records[s.id] || {};
        if (activeSectionTab === 'bahasa') return (Number(r.bahasa_count) || 0) > 0;
        if (activeSectionTab === 'ibadah') return (Number(r.ibadah_count) || 0) > 0;
        if (activeSectionTab === 'tandzim') return (Number(r.tidur_count) || 0) > 0;
        return (Number(r.ibadah_count) || 0) + (Number(r.bahasa_count) || 0) + (Number(r.tidur_count) || 0) > 0;
    }).length;

    return (
        <MainLayout>
            <Head title={`Input ${currentConfig.title} - OSWAN`} />

            <div className="space-y-4 pb-28 max-w-7xl mx-auto px-2 sm:px-4">
                {/* ── 1. HEADER BANNER QISMU ─────────────────────────────────────────── */}
                <div className={`bg-gradient-to-r ${currentConfig.gradient} rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden transition-all duration-300`}>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/20">
                                <HeaderIcon className="h-3 w-3" />
                                <span>{currentConfig.badge}</span>
                                <span>•</span>
                                <span>OSWAN SIKAP</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                                <HeaderIcon className="h-6 w-6 shrink-0" />
                                <span>{currentConfig.title}</span>
                            </h1>
                            <p className="text-white/85 text-xs max-w-2xl leading-relaxed">
                                {currentConfig.subtitle}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                                <span className="opacity-75 block text-[10px]">Tahun / Semester</span>
                                <span className="font-bold">{academicYear?.name || '-'} ({semester?.name || '-'})</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="h-4 w-4 text-emerald-600" />
                                <span>{isSaving ? 'Menyimpan...' : 'Simpan (Ctrl+S)'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── 2. TAB SWITCHER BAGIAN (Hanya untuk Koordinator / Admin) ───────── */}
                {!isSectionLocked && (
                    <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-2xl border overflow-x-auto scrollbar-thin">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase px-2 shrink-0">
                            Pilih Divisi:
                        </span>
                        {[
                            { key: 'all', label: '🌟 Semua Bagian (3 Kolom)', icon: FileSpreadsheet },
                            { key: 'bahasa', label: '🗣️ Qismu Lughoh (Bahasa)', icon: MessageSquare },
                            { key: 'ibadah', label: '🕌 Qismu Ibadah (Salat)', icon: Clock },
                            { key: 'tandzim', label: '📋 Qismu Tandzim (Ketertiban)', icon: Moon },
                        ].map(tab => {
                            const isActive = activeSectionTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveSectionTab(tab.key);
                                        handleFilterChange({ section: tab.key });
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        isActive
                                            ? 'bg-background text-foreground shadow-xs ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── 3. FILTER UTAMA: BULAN, PEKAN, KELAS, & SEARCH ─────────────────── */}
                <div className="bg-card rounded-2xl border p-3.5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Bulan Selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Bulan:
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSelectedMonth(val);
                                    handleFilterChange({ month: val });
                                }}
                                className="text-xs sm:text-sm font-semibold rounded-xl border border-input bg-background px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                            >
                                {months.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} {selectedYear}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pekan Selector */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
                                Pekan:
                            </span>
                            {[1, 2, 3, 4, 5].map(w => (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => {
                                        setSelectedWeek(w);
                                        handleFilterChange({ week_number: w });
                                    }}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                                        selectedWeek === w
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border'
                                    }`}
                                >
                                    Pekan {w}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative min-w-[200px] flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari Nama / NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleFilterChange({ search: searchQuery });
                                    }
                                }}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Quick Kamar & Kelas Selector */}
                    <div className="pt-2 border-t">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                                Pilih Kamar Santri:
                            </span>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedClass(val);
                                    handleFilterChange({ active_class_id: val });
                                }}
                                className="text-xs rounded-lg border border-input bg-background px-2 py-1 text-muted-foreground"
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedKamar('');
                                    handleFilterChange({ active_kamar_id: '' });
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                                    selectedKamar === ''
                                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                                        : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                }`}
                            >
                                Semua Kamar ({kamars.length})
                            </button>
                            {kamars.map(k => (
                                <button
                                    key={k.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedKamar(k.id);
                                        handleFilterChange({ active_kamar_id: k.id });
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                                        String(selectedKamar) === String(k.id)
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-background hover:bg-muted text-foreground border-border'
                                    }`}
                                >
                                    {k.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Indikator Status & Quick Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Menampilkan: <strong className="text-foreground">{students.length} santri</strong></span>
                            <span>•</span>
                            <span>Pelanggaran: <strong className="text-amber-600 dark:text-amber-400">{totalViolationsInView} kasus</strong></span>
                            <span>•</span>
                            <span>Santri Melanggar: <strong className="text-foreground">{totalStudentsViolating} anak</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClearAllInView}
                                className="text-xs text-muted-foreground hover:text-red-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Kosongkan angka di tampilan saat ini"
                            >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset Tampilan</span>
                            </button>
                            {hasUnsavedChanges && (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-semibold animate-pulse text-xs">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Belum disimpan
                                </span>
                            )}
                            {saveSuccessMessage && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs animate-bounce">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Tersimpan!
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 4. SPREADSHEET TABLE INPUT MASSAL ──────────────────────────────── */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-h-[350px]">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/70 text-muted-foreground text-[11px] uppercase tracking-wider font-bold border-b select-none">
                                    <tr>
                                        <th className="px-3 py-3 w-10 text-center">No</th>
                                        <th className="px-4 py-3 min-w-[180px]">Nama Santri</th>
                                        <th className="px-3 py-3 min-w-[90px]">Kamar</th>
                                        <th className="px-3 py-3 min-w-[80px]">Kelas</th>

                                        {/* KOLOM KHUSUS / TERISOLASI BERDASARKAN BAGIAN */}
                                        {(activeSectionTab === 'all' || activeSectionTab === 'ibadah') && (
                                            <th className="px-3 py-3 text-center min-w-[140px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>Telat Salat (Ibadah)</span>
                                                </div>
                                            </th>
                                        )}

                                        {(activeSectionTab === 'all' || activeSectionTab === 'bahasa') && (
                                            <th className="px-3 py-3 text-center min-w-[140px] bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    <span>Bahasa (Kedisiplinan)</span>
                                                </div>
                                            </th>
                                        )}

                                        {(activeSectionTab === 'all' || activeSectionTab === 'tandzim') && (
                                            <th className="px-3 py-3 text-center min-w-[140px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Moon className="h-3.5 w-3.5" />
                                                    <span>Jam Tidur (Kepatuhan)</span>
                                                </div>
                                            </th>
                                        )}

                                        {activeSectionTab === 'all' && (
                                            <th className="px-3 py-3 text-center w-16">Total</th>
                                        )}

                                        <th className="px-4 py-3 min-w-[200px]">Catatan Kasus (Opsional)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={activeSectionTab === 'all' ? 9 : 7} className="px-6 py-14 text-center text-muted-foreground">
                                                <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                                                <p className="font-semibold text-sm text-foreground">Tidak ada santri di filter ini</p>
                                                <p className="text-xs mt-0.5">Pilih kamar lain atau sesuaikan kata kunci pencarian antum.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, rowIndex) => {
                                            const rec = records[student.id] || { ibadah_count: 0, bahasa_count: 0, tidur_count: 0, notes: '' };
                                            const subTotal = (rec.ibadah_count || 0) + (rec.bahasa_count || 0) + (rec.tidur_count || 0);
                                            const sectionVal = activeSectionTab === 'bahasa' 
                                                ? (rec.bahasa_count || 0) 
                                                : (activeSectionTab === 'ibadah' 
                                                    ? (rec.ibadah_count || 0) 
                                                    : (activeSectionTab === 'tandzim' ? (rec.tidur_count || 0) : subTotal));

                                            const hasViolation = sectionVal > 0;

                                            return (
                                                <tr 
                                                    key={student.id} 
                                                    className={`transition-colors hover:bg-muted/40 ${
                                                        hasViolation ? 'bg-amber-50/25 dark:bg-amber-950/15' : ''
                                                    }`}
                                                >
                                                    {/* No */}
                                                    <td className="px-3 py-2 text-center text-muted-foreground font-mono">
                                                        {rowIndex + 1}
                                                    </td>

                                                    {/* Nama Santri */}
                                                    <td className="px-4 py-2">
                                                        <div className="font-semibold text-foreground text-xs leading-snug">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            NIS: {student.nis}
                                                        </div>
                                                    </td>

                                                    {/* Kamar */}
                                                    <td className="px-3 py-2 text-muted-foreground">
                                                        <span className="truncate block max-w-[120px]" title={student.kamar}>
                                                            {student.kamar}
                                                        </span>
                                                    </td>

                                                    {/* Kelas */}
                                                    <td className="px-3 py-2 text-muted-foreground">
                                                        <span className="truncate block max-w-[100px]" title={student.kelas}>
                                                            {student.kelas}
                                                        </span>
                                                    </td>

                                                    {/* Input Ibadah */}
                                                    {(activeSectionTab === 'all' || activeSectionTab === 'ibadah') && (
                                                        <td className="px-2 py-1.5 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                                                            <div className="inline-flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'ibadah_count', -1)}
                                                                    disabled={(rec.ibadah_count || 0) <= 0}
                                                                    className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center disabled:opacity-30 cursor-pointer text-xs"
                                                                    title="Kurangi 1"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    ref={el => inputRefs.current[`${rowIndex}-ibadah`] = el}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    value={rec.ibadah_count === 0 ? '' : rec.ibadah_count}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleInputChange(student.id, 'ibadah_count', e.target.value)}
                                                                    onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 'ibadah')}
                                                                    className={`w-12 h-7 text-center font-bold text-xs rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                                                                        (rec.ibadah_count || 0) > 0 
                                                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200' 
                                                                            : 'bg-background border-input text-muted-foreground focus:text-foreground'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'ibadah_count', 1)}
                                                                    className="w-6 h-6 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                                                                    title="Tambah 1"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* Input Bahasa */}
                                                    {(activeSectionTab === 'all' || activeSectionTab === 'bahasa') && (
                                                        <td className="px-2 py-1.5 text-center bg-purple-50/20 dark:bg-purple-950/10">
                                                            <div className="inline-flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'bahasa_count', -1)}
                                                                    disabled={(rec.bahasa_count || 0) <= 0}
                                                                    className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center disabled:opacity-30 cursor-pointer text-xs"
                                                                    title="Kurangi 1"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    ref={el => inputRefs.current[`${rowIndex}-bahasa`] = el}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    value={rec.bahasa_count === 0 ? '' : rec.bahasa_count}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleInputChange(student.id, 'bahasa_count', e.target.value)}
                                                                    onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 'bahasa')}
                                                                    className={`w-12 h-7 text-center font-bold text-xs rounded-lg border focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${
                                                                        (rec.bahasa_count || 0) > 0 
                                                                            ? 'bg-purple-50 border-purple-400 text-purple-800 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-200' 
                                                                            : 'bg-background border-input text-muted-foreground focus:text-foreground'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'bahasa_count', 1)}
                                                                    className="w-6 h-6 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                                                                    title="Tambah 1"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* Input Jam Tidur / Ketertiban */}
                                                    {(activeSectionTab === 'all' || activeSectionTab === 'tandzim') && (
                                                        <td className="px-2 py-1.5 text-center bg-blue-50/20 dark:bg-blue-950/10">
                                                            <div className="inline-flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'tidur_count', -1)}
                                                                    disabled={(rec.tidur_count || 0) <= 0}
                                                                    className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center disabled:opacity-30 cursor-pointer text-xs"
                                                                    title="Kurangi 1"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <input
                                                                    ref={el => inputRefs.current[`${rowIndex}-tidur`] = el}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    value={rec.tidur_count === 0 ? '' : rec.tidur_count}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleInputChange(student.id, 'tidur_count', e.target.value)}
                                                                    onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 'tidur')}
                                                                    className={`w-12 h-7 text-center font-bold text-xs rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                                                                        (rec.tidur_count || 0) > 0 
                                                                            ? 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200' 
                                                                            : 'bg-background border-input text-muted-foreground focus:text-foreground'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStep(student.id, 'tidur_count', 1)}
                                                                    className="w-6 h-6 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 flex items-center justify-center cursor-pointer font-bold text-xs"
                                                                    title="Tambah 1"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* Total Live (Khusus Mode 'all') */}
                                                    {activeSectionTab === 'all' && (
                                                        <td className="px-3 py-2 text-center">
                                                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                                                                hasViolation
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                    : 'text-muted-foreground/40'
                                                            }`}>
                                                                {subTotal}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {/* Catatan Ringkas */}
                                                    <td className="px-3 py-1.5">
                                                        <input
                                                            ref={el => inputRefs.current[`${rowIndex}-notes`] = el}
                                                            type="text"
                                                            placeholder="Catatan..."
                                                            value={rec.notes || ''}
                                                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                                            className="w-full h-7 text-xs rounded-lg border border-input bg-background px-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── 5. BOTTOM FLOATING BAR (SIMPAN CEPAT) ───────────────────────── */}
                    <div className="fixed bottom-4 left-0 right-0 z-40 px-3 sm:px-4">
                        <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-4">
                            <div className="text-xs">
                                <span className="font-bold block text-foreground">
                                    Pekan {selectedWeek} • {months.find(m => m.id === selectedMonth)?.name} {selectedYear}
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                    {totalViolationsInView} pelanggaran • {students.length} santri di tampilan
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
