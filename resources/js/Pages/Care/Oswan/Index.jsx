import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
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
    ChevronLeft, 
    ChevronRight,
    Minus,
    Plus,
    UserCheck,
    RotateCcw
} from 'lucide-react';

export default function OswanIndex({ 
    students = [], 
    existingRecords = {}, 
    kamars = [], 
    classes = [], 
    filters = {}, 
    academicYear, 
    semester 
}) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(filters.week_number || 1);
    const [selectedKamar, setSelectedKamar] = useState(filters.active_kamar_id || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Form data: { [student_id]: { ibadah_count: 0, bahasa_count: 0, tidur_count: 0, notes: '' } }
    const [records, setRecords] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const months = [
        { id: 1, name: 'Januari' }, { id: 2, name: 'Februari' }, { id: 3, name: 'Maret' },
        { id: 4, name: 'April' }, { id: 5, name: 'Mei' }, { id: 6, name: 'Juni' },
        { id: 7, name: 'Juli' }, { id: 8, name: 'Agustus' }, { id: 9, name: 'September' },
        { id: 10, name: 'Oktober' }, { id: 11, name: 'November' }, { id: 12, name: 'Desember' }
    ];

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

    const handleFilterChange = (updates = {}) => {
        const query = {
            month: updates.month !== undefined ? updates.month : selectedMonth,
            year: updates.year !== undefined ? updates.year : selectedYear,
            week_number: updates.week_number !== undefined ? updates.week_number : selectedWeek,
            active_kamar_id: updates.active_kamar_id !== undefined ? updates.active_kamar_id : selectedKamar,
            active_class_id: updates.active_class_id !== undefined ? updates.active_class_id : selectedClass,
            search: updates.search !== undefined ? updates.search : searchQuery,
        };

        router.get(route('care.oswan.index'), query, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    const updateCount = (studentId, field, delta) => {
        setRecords(prev => {
            const currentVal = Number(prev[studentId]?.[field] || 0);
            const newVal = Math.max(0, currentVal + delta);
            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    student_id: studentId,
                    [field]: newVal
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleInputChange = (studentId, field, value) => {
        const num = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
        setRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                student_id: studentId,
                [field]: num
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleNotesChange = (studentId, value) => {
        setRecords(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                student_id: studentId,
                notes: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        setIsSaving(true);

        const payload = {
            year: selectedYear,
            month: selectedMonth,
            week_number: selectedWeek,
            records: Object.values(records)
        };

        router.post(route('care.oswan.store'), payload, {
            onSuccess: () => {
                setIsSaving(false);
                setHasUnsavedChanges(false);
            },
            onError: () => {
                setIsSaving(false);
            }
        });
    };

    // Hitung total pelanggaran yang diinput pada form saat ini
    const totalRecordedThisWeek = Object.values(records).reduce((sum, r) => {
        return sum + (Number(r.ibadah_count) || 0) + (Number(r.bahasa_count) || 0) + (Number(r.tidur_count) || 0);
    }, 0);

    return (
        <MainLayout>
            <Head title="Jurnal Ketertiban Santri - OSWAN" />

            <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-white/20">
                                <span>OSWAN</span>
                                <span>•</span>
                                <span>Biro Pengasuhan Santri</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Jurnal Ketertiban Santri</h1>
                            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
                                Pencatatan rekapitulasi keterlambatan salat, pelanggaran bahasa Arab, dan ketertiban tidur malam santri setiap pekan.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-right">
                                <span className="text-xs text-emerald-100 block">Tahun Ajaran / Semester</span>
                                <span className="font-semibold text-sm">
                                    {academicYear?.name || '-'} ({semester?.name || '-'})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Periode Bar */}
                <div className="bg-card rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Pilih Bulan */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Bulan
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSelectedMonth(val);
                                    handleFilterChange({ month: val });
                                }}
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                                {months.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pilih Pekan */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Pekan Evaluasi
                            </label>
                            <div className="grid grid-cols-5 gap-1">
                                {[1, 2, 3, 4, 5].map(w => (
                                    <button
                                        key={w}
                                        type="button"
                                        onClick={() => {
                                            setSelectedWeek(w);
                                            handleFilterChange({ week_number: w });
                                        }}
                                        className={`py-2 text-xs font-bold rounded-xl transition-all border ${
                                            selectedWeek === w
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border'
                                        }`}
                                    >
                                        P{w}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Kamar */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Filter Kamar
                            </label>
                            <select
                                value={selectedKamar}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedKamar(val);
                                    handleFilterChange({ active_kamar_id: val });
                                }}
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Semua Kamar</option>
                                {kamars.map(k => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Kelas */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Filter Kelas
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedClass(val);
                                    handleFilterChange({ active_class_id: val });
                                }}
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pencarian Santri */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Cari Santri
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Nama / NIS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleFilterChange({ search: searchQuery });
                                        }
                                    }}
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Filter & Quick Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Total Santri: {students.length} anak</span>
                            <span>•</span>
                            <span>Pekan ke-{selectedWeek} ({months.find(m => m.id === selectedMonth)?.name} {selectedYear})</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-medium">Dicatat Pekan Ini: {totalRecordedThisWeek} pelanggaran</span>
                        </div>
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-semibold animate-pulse">
                                <AlertCircle className="h-4 w-4" />
                                Ada perubahan yang belum disimpan!
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Input Pelanggaran Santri */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {students.length === 0 ? (
                        <div className="bg-card rounded-2xl border p-12 text-center text-muted-foreground">
                            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30 text-emerald-500" />
                            <p className="font-semibold text-base text-foreground">Tidak Ada Data Santri</p>
                            <p className="text-sm mt-1">Coba sesuaikan filter kamar, kelas, atau kata kunci pencarian Anda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {students.map((student, idx) => {
                                const rec = records[student.id] || { ibadah_count: 0, bahasa_count: 0, tidur_count: 0, notes: '' };
                                const subTotal = (rec.ibadah_count || 0) + (rec.bahasa_count || 0) + (rec.tidur_count || 0);

                                return (
                                    <div 
                                        key={student.id} 
                                        className={`bg-card rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                                            subTotal > 0 ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10' : 'border-border'
                                        }`}
                                    >
                                        {/* Info Santri */}
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                        #{idx + 1} • NIS: {student.nis}
                                                    </span>
                                                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate mt-0.5">
                                                        {student.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        <span className="bg-muted px-2 py-0.5 rounded-md font-medium">
                                                            {student.kamar}
                                                        </span>
                                                        <span className="bg-muted px-2 py-0.5 rounded-md font-medium">
                                                            {student.kelas}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Badge Total Pekan Ini */}
                                                <div className="text-right shrink-0">
                                                    <div className={`px-2 py-1 rounded-xl text-xs font-bold ${
                                                        subTotal > 0 
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    }`}>
                                                        {subTotal} Kasus
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Evaluasi 3 Aspek */}
                                            <div className="space-y-3 mt-4 pt-3 border-t">
                                                {/* 1. Keterlambatan Ibadah */}
                                                <div className="flex items-center justify-between gap-2 bg-muted/20 p-2 rounded-xl">
                                                    <div className="flex items-center gap-2 text-xs font-medium">
                                                        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                                            <Clock className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold">Keterlambatan Salat</span>
                                                            <span className="text-[10px] text-muted-foreground">Subuh/Maghrib/Isya</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'ibadah_count', -1)}
                                                            className="w-7 h-7 rounded-lg bg-card border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={rec.ibadah_count || 0}
                                                            onChange={(e) => handleInputChange(student.id, 'ibadah_count', e.target.value)}
                                                            className="w-10 text-center font-bold text-sm bg-background border border-input rounded-lg py-1 focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'ibadah_count', 1)}
                                                            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center active:scale-95 transition-transform"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 2. Ketertiban Berbahasa */}
                                                <div className="flex items-center justify-between gap-2 bg-muted/20 p-2 rounded-xl">
                                                    <div className="flex items-center gap-2 text-xs font-medium">
                                                        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold">Pelanggaran Bahasa</span>
                                                            <span className="text-[10px] text-muted-foreground">Tidak berbahasa Arab</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'bahasa_count', -1)}
                                                            className="w-7 h-7 rounded-lg bg-card border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={rec.bahasa_count || 0}
                                                            onChange={(e) => handleInputChange(student.id, 'bahasa_count', e.target.value)}
                                                            className="w-10 text-center font-bold text-sm bg-background border border-input rounded-lg py-1 focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'bahasa_count', 1)}
                                                            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center active:scale-95 transition-transform"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 3. Ketertiban Jam Tidur */}
                                                <div className="flex items-center justify-between gap-2 bg-muted/20 p-2 rounded-xl">
                                                    <div className="flex items-center gap-2 text-xs font-medium">
                                                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                            <Moon className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold">Ketertiban Tidur</span>
                                                            <span className="text-[10px] text-muted-foreground">Begadang / lewat batas</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'tidur_count', -1)}
                                                            className="w-7 h-7 rounded-lg bg-card border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            value={rec.tidur_count || 0}
                                                            onChange={(e) => handleInputChange(student.id, 'tidur_count', e.target.value)}
                                                            className="w-10 text-center font-bold text-sm bg-background border border-input rounded-lg py-1 focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCount(student.id, 'tidur_count', 1)}
                                                            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center active:scale-95 transition-transform"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Catatan Ringkas */}
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Catatan tambahan santri (opsional)..."
                                                        value={rec.notes || ''}
                                                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                                                        className="w-full text-xs rounded-xl border border-input bg-background px-3 py-1.5 focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom Floating Save Button Bar */}
                    <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
                        <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-4">
                            <div className="text-xs">
                                <span className="font-semibold block text-foreground">
                                    Rekap Pekan {selectedWeek} • {months.find(m => m.id === selectedMonth)?.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {totalRecordedThisWeek} pelanggaran tercatat
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Rekap Pekan Ini'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
