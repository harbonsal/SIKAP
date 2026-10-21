import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { 
    Clock, 
    MessageSquare, 
    Moon, 
    Search, 
    FileSpreadsheet, 
    Users, 
    ShieldAlert, 
    Award, 
    Info, 
    ChevronDown, 
    ChevronUp,
    ExternalLink,
    Filter
} from 'lucide-react';

export default function OswanMonitor({
    students = [],
    kamars = [],
    classes = [],
    filters = {},
    academicYear,
    semester,
    userRoleInfo = {}
}) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
    const [selectedKamar, setSelectedKamar] = useState(filters.active_kamar_id || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // State untuk toggle rincian pekan per santri
    const [expandedStudentId, setExpandedStudentId] = useState(null);

    const months = [
        { id: 1, name: 'Januari' }, { id: 2, name: 'Februari' }, { id: 3, name: 'Maret' },
        { id: 4, name: 'April' }, { id: 5, name: 'Mei' }, { id: 6, name: 'Juni' },
        { id: 7, name: 'Juli' }, { id: 8, name: 'Agustus' }, { id: 9, name: 'September' },
        { id: 10, name: 'Oktober' }, { id: 11, name: 'November' }, { id: 12, name: 'Desember' }
    ];

    const handleFilterChange = (updates = {}) => {
        const query = {
            month: updates.month !== undefined ? updates.month : selectedMonth,
            year: updates.year !== undefined ? updates.year : selectedYear,
            active_kamar_id: updates.active_kamar_id !== undefined ? updates.active_kamar_id : selectedKamar,
            active_class_id: updates.active_class_id !== undefined ? updates.active_class_id : selectedClass,
            search: updates.search !== undefined ? updates.search : searchQuery,
        };

        router.get(route('care.oswan.monitor'), query, { 
            preserveState: true,
            preserveScroll: true 
        });
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams({
            month: selectedMonth,
            year: selectedYear,
            active_kamar_id: selectedKamar,
            active_class_id: selectedClass,
            search: searchQuery
        }).toString();

        window.open(route('care.oswan.export') + '?' + params, '_blank');
    };

    // Statistik Ringkasan Bulan Ini
    const totalIbadahAll = students.reduce((sum, s) => sum + (s.total_ibadah || 0), 0);
    const totalBahasaAll = students.reduce((sum, s) => sum + (s.total_bahasa || 0), 0);
    const totalTidurAll = students.reduce((sum, s) => sum + (s.total_tidur || 0), 0);
    const totalKasusAll = totalIbadahAll + totalBahasaAll + totalTidurAll;

    return (
        <MainLayout>
            <Head title="Pemantauan Ketertiban Santri - Pengasuhan" />

            <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-white/10">
                                <span>Pengasuhan & Tarbiyah</span>
                                <span>•</span>
                                <span>Monitoring Terpadu</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pemantauan Ketertiban Santri</h1>
                            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                                Rekapitulasi catatan ketertiban mingguan dari OSWAN terintegrasi otomatis dengan rekomendasi penilaian akhlak santri.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>Export Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-card rounded-2xl border p-4 shadow-sm flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-muted-foreground block">Telat Salat</span>
                            <span className="text-xl sm:text-2xl font-bold text-foreground">{totalIbadahAll}</span>
                            <span className="text-[10px] text-muted-foreground block">kasus bulan ini</span>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-sm flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-muted-foreground block">Pelanggaran Bahasa</span>
                            <span className="text-xl sm:text-2xl font-bold text-foreground">{totalBahasaAll}</span>
                            <span className="text-[10px] text-muted-foreground block">kasus bulan ini</span>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-sm flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                            <Moon className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-muted-foreground block">Jam Tidur</span>
                            <span className="text-xl sm:text-2xl font-bold text-foreground">{totalTidurAll}</span>
                            <span className="text-[10px] text-muted-foreground block">kasus bulan ini</span>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-sm flex items-center gap-3.5">
                        <div className="p-3 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-muted-foreground block">Total Pelanggaran</span>
                            <span className="text-xl sm:text-2xl font-bold text-foreground">{totalKasusAll}</span>
                            <span className="text-[10px] text-muted-foreground block">{students.length} santri terpantau</span>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card rounded-2xl border p-4 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Pilih Bulan */}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                Periode Bulan
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setSelectedMonth(val);
                                    handleFilterChange({ month: val });
                                }}
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary font-medium"
                            >
                                {months.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} {selectedYear}</option>
                                ))}
                            </select>
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
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
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
                                className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pencarian */}
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
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Pemantauan & Rekomendasi Rapor Akhlak */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/10">
                        <div>
                            <h2 className="font-bold text-base text-foreground">Rekapitulasi Pelanggaran Santri</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Rumus Rekomendasi Rapor: Nilai = Max(70, 100 - Pelanggaran Bulan Ini). Klik santri untuk melihat breakdown Pekan 1-5.
                            </p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            Menampilkan {students.length} santri
                        </span>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                                    <th className="px-4 py-3.5 min-w-[200px]">Nama Santri</th>
                                    <th className="px-4 py-3.5 min-w-[120px]">Kamar</th>
                                    <th className="px-4 py-3.5 min-w-[100px]">Kelas</th>
                                    <th className="px-3 py-3.5 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                                        Ibadah
                                    </th>
                                    <th className="px-3 py-3.5 text-center bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                                        Bahasa
                                    </th>
                                    <th className="px-3 py-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                                        Tidur
                                    </th>
                                    <th className="px-3 py-3.5 text-center font-bold">Total</th>
                                    <th className="px-4 py-3.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 min-w-[180px]">
                                        Rekomendasi Rapor Akhlak
                                    </th>
                                    <th className="px-4 py-3.5 text-center w-16">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-12 text-center text-muted-foreground">
                                            Tidak ada data santri yang ditemukan pada filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student, idx) => {
                                        const isExpanded = expandedStudentId === student.id;

                                        return (
                                            <React.Fragment key={student.id}>
                                                <tr className={`hover:bg-muted/40 transition-colors ${
                                                    student.total_pelanggaran > 0 ? 'bg-amber-50/5 dark:bg-amber-950/5' : ''
                                                }`}>
                                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        <div className="font-semibold text-foreground">{student.name}</div>
                                                        <div className="text-[11px] text-muted-foreground">NIS: {student.nis}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {student.kamar}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {student.kelas}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-semibold text-xs text-blue-700 dark:text-blue-300">
                                                        {student.total_ibadah > 0 ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 font-bold">
                                                                {student.total_ibadah}x
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/60">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-semibold text-xs text-purple-700 dark:text-purple-300">
                                                        {student.total_bahasa > 0 ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 font-bold">
                                                                {student.total_bahasa}x
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/60">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-semibold text-xs text-indigo-700 dark:text-indigo-300">
                                                        {student.total_tidur > 0 ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 font-bold">
                                                                {student.total_tidur}x
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/60">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-bold text-xs">
                                                        {student.total_pelanggaran > 0 ? (
                                                            <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                                                                {student.total_pelanggaran}
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-600 font-medium">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                                                            <span 
                                                                title="Nilai Rekomendasi Aspek Ibadah"
                                                                className={`px-2 py-0.5 rounded-md border ${
                                                                    student.score_ibadah < 100 
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}
                                                            >
                                                                I: {student.score_ibadah}
                                                            </span>
                                                            <span 
                                                                title="Nilai Rekomendasi Aspek Kedisiplinan"
                                                                className={`px-2 py-0.5 rounded-md border ${
                                                                    student.score_kedisiplinan < 100 
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}
                                                            >
                                                                D: {student.score_kedisiplinan}
                                                            </span>
                                                            <span 
                                                                title="Nilai Rekomendasi Aspek Kepatuhan"
                                                                className={`px-2 py-0.5 rounded-md border ${
                                                                    student.score_kepatuhan < 100 
                                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}
                                                            >
                                                                K: {student.score_kepatuhan}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                                                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Lihat rincian pekan 1-5"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Breakdown Pekan 1-5 */}
                                                {isExpanded && (
                                                    <tr className="bg-muted/30">
                                                        <td colSpan="10" className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                                                                    Rincian Mingguan: {student.name}
                                                                </span>
                                                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                                                                    {[1, 2, 3, 4, 5].map(w => {
                                                                        const wData = student.weeks?.[w] || { ibadah: 0, bahasa: 0, tidur: 0, notes: '' };
                                                                        const sumW = (wData.ibadah || 0) + (wData.bahasa || 0) + (wData.tidur || 0);

                                                                        return (
                                                                            <div key={w} className="bg-card rounded-xl border p-2.5 text-xs">
                                                                                <div className="flex items-center justify-between font-bold border-b pb-1 mb-1.5">
                                                                                    <span>Pekan {w}</span>
                                                                                    <span className={`px-1.5 py-0.2 rounded ${sumW > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                                                        {sumW}x
                                                                                    </span>
                                                                                </div>
                                                                                <div className="space-y-1 text-muted-foreground">
                                                                                    <div className="flex justify-between">
                                                                                        <span>Salat:</span>
                                                                                        <span className="font-semibold text-foreground">{wData.ibadah || 0}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span>Bahasa:</span>
                                                                                        <span className="font-semibold text-foreground">{wData.bahasa || 0}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between">
                                                                                        <span>Tidur:</span>
                                                                                        <span className="font-semibold text-foreground">{wData.tidur || 0}</span>
                                                                                    </div>
                                                                                    {wData.notes && (
                                                                                        <p className="text-[10px] text-foreground italic border-t pt-1 mt-1 truncate" title={wData.notes}>
                                                                                            "{wData.notes}"
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
