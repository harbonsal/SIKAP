import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import Select from 'react-select';
import { Button } from '@/Components/ui/button';
import { 
    Save, 
    Loader2, 
    CheckCircle2, 
    RotateCcw, 
    Search, 
    BookOpen, 
    Layers, 
    Sparkles, 
    CheckCheck,
    AlertCircle,
    Info,
    ArrowUpDown,
    Smartphone,
    Monitor,
    Zap
} from 'lucide-react';
import axios from 'axios';

// Helper: Kalkulasi nomor halaman Mushaf Madinah untuk setiap Juz (1 - 30)
const getJuzPageInfo = (juzNumber) => {
    const j = parseInt(juzNumber, 10);
    if (j === 1) {
        return { startPage: 1, totalPages: 21, endPage: 21 };
    }
    if (j === 30) {
        return { startPage: 582, totalPages: 23, endPage: 604 };
    }
    const startPage = 22 + (j - 2) * 20;
    return { startPage, totalPages: 20, endPage: startPage + 19 };
};

export default function MassInputTab({ musyrifs = [], defaultMusyrifId = '' }) {
    // Inisialisasi musyrif terpilih dari defaultMusyrifId jika ada
    const [selectedMusyrif, setSelectedMusyrif] = useState(() => {
        if (defaultMusyrifId) {
            const found = musyrifs.find(m => m.id.toString() === defaultMusyrifId.toString());
            if (found) return found.id.toString();
        }
        return musyrifs.length === 1 ? musyrifs[0].id.toString() : '';
    });

    const [selectedType, setSelectedType] = useState('sabaq'); // 'sabaq', 'sabqi', 'manzil'
    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);
    const [batchJuz, setBatchJuz] = useState('30');
    const [sortMode, setSortMode] = useState('mutabaah'); // 'mutabaah', 'name', 'nis', 'progress'
    const [viewMode, setViewMode] = useState('auto'); // 'auto', 'card', 'table'

    // Fetch data ketika musyrif atau tipe setoran berubah
    const fetchMassData = async () => {
        if (!selectedMusyrif || selectedMusyrif === 'all') {
            setStudentsData([]);
            return;
        }

        setLoading(true);
        setNotification(null);
        try {
            const response = await axios.get(route('tahfidz.achievements.mass-input.data'), {
                params: { 
                    musyrif_id: selectedMusyrif,
                    type: selectedType
                }
            });
            
            const rawData = response.data || [];
            
            // Format data santri
            const formatted = rawData.map(s => {
                const currentJuz = s.current_juz || 30;
                const pageInfo = getJuzPageInfo(currentJuz);
                const memsByJuz = s.mems_by_juz || {};
                const halfByJuz = s.half_pages_by_juz || {};
                
                let completed = s.completed_pages || [];
                if (memsByJuz[currentJuz]?.completed_pages) {
                    completed = memsByJuz[currentJuz].completed_pages;
                }

                let half = s.half_pages || [];
                if (halfByJuz[currentJuz]) {
                    half = halfByJuz[currentJuz];
                }

                return {
                    ...s,
                    current_juz: currentJuz,
                    start_page: pageInfo.startPage,
                    total_pages: pageInfo.totalPages,
                    completed_pages: completed,
                    half_pages: half,
                    mems_by_juz: memsByJuz,
                    half_pages_by_juz: halfByJuz
                };
            });

            setStudentsData(formatted);
        } catch (error) {
            console.error("Gagal memuat data input massal:", error);
            setNotification({
                type: 'error',
                message: 'Gagal memuat data santri halaqoh. Silakan coba lagi.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMassData();
    }, [selectedMusyrif, selectedType]);

    // Handle Perubahan Juz per Santri
    const handleStudentJuzChange = (studentId, newJuzStr) => {
        const newJuz = parseInt(newJuzStr, 10);
        const pageInfo = getJuzPageInfo(newJuz);

        setStudentsData(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            // Simpan state juz sebelumnya ke dictionary
            const updatedMemsByJuz = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: student.completed_pages || [],
                    is_completed: (student.completed_pages?.length || 0) >= student.total_pages
                }
            };
            const updatedHalfByJuz = {
                ...(student.half_pages_by_juz || {}),
                [student.current_juz]: student.half_pages || []
            };

            const newCompletedPages = updatedMemsByJuz[newJuz]?.completed_pages || [];
            const newHalfPages = updatedHalfByJuz[newJuz] || [];

            return {
                ...student,
                current_juz: newJuz,
                start_page: pageInfo.startPage,
                total_pages: pageInfo.totalPages,
                completed_pages: newCompletedPages,
                half_pages: newHalfPages,
                mems_by_juz: updatedMemsByJuz,
                half_pages_by_juz: updatedHalfByJuz
            };
        }));
    };

    // Handle Tri-State Klik Halaman per Santri:
    // Status 0: Belum -> Klik 1x: Setor 1/2 Halaman (half)
    // Status 0.5: Setor 1/2 Halaman -> Klik 2x: Setor Penuh 1 Halaman (full)
    // Status 1: Setor Penuh -> Klik 3x: Kosongkan (0)
    const handlePageClick = (studentId, pageNumber) => {
        setStudentsData(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const isFull = (student.completed_pages || []).includes(pageNumber);
            const isHalf = (student.half_pages || []).includes(pageNumber);

            let newCompleted = [...(student.completed_pages || [])];
            let newHalf = [...(student.half_pages || [])];

            if (!isFull && !isHalf) {
                // 0 -> Setor 1/2 Halaman
                newHalf.push(pageNumber);
            } else if (isHalf) {
                // 1/2 -> Setor Penuh 1 Halaman
                newHalf = newHalf.filter(p => p !== pageNumber);
                newCompleted.push(pageNumber);
            } else {
                // 1 -> Reset/Kosongkan
                newCompleted = newCompleted.filter(p => p !== pageNumber);
                newHalf = newHalf.filter(p => p !== pageNumber);
            }

            const updatedMems = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: newCompleted,
                    is_completed: newCompleted.length >= student.total_pages
                }
            };
            const updatedHalfByJuz = {
                ...(student.half_pages_by_juz || {}),
                [student.current_juz]: newHalf
            };

            return {
                ...student,
                completed_pages: newCompleted,
                half_pages: newHalf,
                mems_by_juz: updatedMems,
                half_pages_by_juz: updatedHalfByJuz
            };
        }));
    };

    // Aksi Cepat per Santri: Centang Semua Halaman (1 Juz Penuh)
    const handleCheckAllForStudent = (studentId) => {
        setStudentsData(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const pageInfo = getJuzPageInfo(student.current_juz);
            const allPages = [];
            for (let p = pageInfo.startPage; p <= pageInfo.endPage; p++) {
                allPages.push(p);
            }

            const updatedMems = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: allPages,
                    is_completed: true
                }
            };
            const updatedHalfByJuz = {
                ...(student.half_pages_by_juz || {}),
                [student.current_juz]: []
            };

            return {
                ...student,
                completed_pages: allPages,
                half_pages: [],
                mems_by_juz: updatedMems,
                half_pages_by_juz: updatedHalfByJuz
            };
        }));
    };

    // Aksi Cepat per Santri: Kosongkan Centang
    const handleResetForStudent = (studentId) => {
        setStudentsData(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            const updatedMems = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: [],
                    is_completed: false
                }
            };
            const updatedHalfByJuz = {
                ...(student.half_pages_by_juz || {}),
                [student.current_juz]: []
            };

            return {
                ...student,
                completed_pages: [],
                half_pages: [],
                mems_by_juz: updatedMems,
                half_pages_by_juz: updatedHalfByJuz
            };
        }));
    };

    // Aksi Massal: Terapkan Juz ke Seluruh Santri di Tabel
    const handleApplyBatchJuz = () => {
        const targetJuz = parseInt(batchJuz, 10);
        const pageInfo = getJuzPageInfo(targetJuz);

        setStudentsData(prev => prev.map(student => {
            const updatedMemsByJuz = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: student.completed_pages || [],
                    is_completed: (student.completed_pages?.length || 0) >= student.total_pages
                }
            };
            const updatedHalfByJuz = {
                ...(student.half_pages_by_juz || {}),
                [student.current_juz]: student.half_pages || []
            };

            const existingPages = updatedMemsByJuz[targetJuz]?.completed_pages || [];
            const existingHalf = updatedHalfByJuz[targetJuz] || [];

            return {
                ...student,
                current_juz: targetJuz,
                start_page: pageInfo.startPage,
                total_pages: pageInfo.totalPages,
                completed_pages: existingPages,
                half_pages: existingHalf,
                mems_by_juz: updatedMemsByJuz,
                half_pages_by_juz: updatedHalfByJuz
            };
        }));
    };

    // Aksi Massal: Centang Semua Santri Sekaligus
    const handleCheckAllStudents = () => {
        if (!window.confirm("Yakin ingin mencentang penuh (khatam) seluruh santri yang tampil?")) return;

        setStudentsData(prev => prev.map(student => {
            const pageInfo = getJuzPageInfo(student.current_juz);
            const allPages = [];
            for (let p = pageInfo.startPage; p <= pageInfo.endPage; p++) {
                allPages.push(p);
            }

            return {
                ...student,
                completed_pages: allPages,
                half_pages: [],
                mems_by_juz: {
                    ...student.mems_by_juz,
                    [student.current_juz]: {
                        completed_pages: allPages,
                        is_completed: true
                    }
                },
                half_pages_by_juz: {
                    ...(student.half_pages_by_juz || {}),
                    [student.current_juz]: []
                }
            };
        }));
    };

    // Simpan Capaian ke Server
    const handleSave = async () => {
        if (studentsData.length === 0) return;

        setSaving(true);
        setNotification(null);

        const payload = studentsData.map(s => ({
            student_id: s.id,
            juz: s.current_juz,
            completed_pages: s.completed_pages || [],
            half_pages: s.half_pages || []
        }));

        try {
            const res = await axios.post(route('tahfidz.achievements.mass-input.store'), {
                type: selectedType,
                inputs: payload
            });

            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setNotification({
                type: 'success',
                message: `Alhamdulillah! Data setoran ${selectedType.toUpperCase()} berhasil disimpan pada pukul ${timeStr} WIB.`
            });
        } catch (error) {
            console.error("Gagal menyimpan data hafalan massal:", error);
            setNotification({
                type: 'error',
                message: error.response?.data?.message || 'Gagal menyimpan data hafalan massal. Periksa koneksi Anda.'
            });
        } finally {
            setSaving(false);
        }
    };

    // Filter & Sorting Santri
    const processedStudents = useMemo(() => {
        let list = [...studentsData];

        // 1. Filter Pencarian
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) || 
                (s.nis && s.nis.toLowerCase().includes(q)) ||
                (s.class_name && s.class_name.toLowerCase().includes(q))
            );
        }

        // 2. Sorting
        list.sort((a, b) => {
            if (sortMode === 'mutabaah') {
                // Urutan sesuai buku mutabaah: Kelas lalu Nama Santri
                if ((a.class_name || '') !== (b.class_name || '')) {
                    return (a.class_name || '').localeCompare(b.class_name || '');
                }
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortMode === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortMode === 'nis') {
                return (a.nis || '').localeCompare(b.nis || '');
            } else if (sortMode === 'progress') {
                const progA = (a.completed_pages?.length || 0) + ((a.half_pages?.length || 0) * 0.5);
                const progB = (b.completed_pages?.length || 0) + ((b.half_pages?.length || 0) * 0.5);
                return progB - progA;
            }
            return 0;
        });

        return list;
    }, [studentsData, searchQuery, sortMode]);

    // Maksimal kolom halaman yang ditampilkan di tabel desktop (20 - 23)
    const maxColumns = useMemo(() => {
        let max = 20;
        processedStudents.forEach(s => {
            if (s.total_pages > max) max = s.total_pages;
        });
        return max;
    }, [processedStudents]);

    // Hitung total halaman tercentang
    const totalPagesChecked = useMemo(() => {
        return processedStudents.reduce((acc, s) => {
            const full = s.completed_pages?.length || 0;
            const half = (s.half_pages?.length || 0) * 0.5;
            return acc + full + half;
        }, 0);
    }, [processedStudents]);

    // Render Tombol Halaman (Desktop & Mobile)
    const renderPageButton = (student, pageNumber, relativePage, isLargeMobile = false) => {
        const isFull = (student.completed_pages || []).includes(pageNumber);
        const isHalf = (student.half_pages || []).includes(pageNumber);

        let stateClass = "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-slate-50";
        if (isFull) {
            stateClass = "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold hover:bg-emerald-700";
        } else if (isHalf) {
            stateClass = "bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400/70 font-extrabold hover:bg-amber-200";
        }

        return (
            <button
                type="button"
                key={pageNumber}
                onClick={() => handlePageClick(student.id, pageNumber)}
                className={`transition-all active:scale-90 select-none flex flex-col items-center justify-center rounded-lg border cursor-pointer ${stateClass} ${
                    isLargeMobile 
                        ? 'h-12 w-full p-1' 
                        : 'w-9 h-9 min-w-[36px] mx-auto'
                }`}
                title={`Hal ${pageNumber} (ke-${relativePage} Juz ${student.current_juz}) - Klik: Kosong -> 1/2 Hal -> Penuh`}
            >
                <div className="flex items-center justify-center gap-0.5 leading-none">
                    {isFull && <span className="text-xs">✔</span>}
                    {isHalf && <span className="text-xs font-black text-amber-800">½</span>}
                    <span className={`${isLargeMobile ? 'text-xs font-bold' : 'text-[11px] font-semibold'} ${isFull ? 'text-white' : ''}`}>
                        {isLargeMobile ? pageNumber : relativePage}
                    </span>
                </div>
                {isLargeMobile && (
                    <span className="text-[9px] opacity-80 leading-none mt-1">
                        {isFull ? '1 Penuh' : isHalf ? '1/2 Hal' : `Hal ${pageNumber}`}
                    </span>
                )}
            </button>
        );
    };

    return (
        <Card className="bg-white border shadow-sm">
            <CardHeader className="border-b bg-slate-50/70 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                                <BookOpen className="w-5 h-5" />
                            </span>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Input Hafalan Manual / Massal</CardTitle>
                                <CardDescription className="text-xs text-slate-500 mt-0.5">
                                    Pencatatan setoran per halaman fleksibel & cepat, mendukung layar HP & PC
                                </CardDescription>
                            </div>
                        </div>
                    </div>

                    {/* PILAR TAHFIDZ SELECTOR */}
                    <div className="flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner w-fit">
                        {[
                            { key: 'sabaq', label: 'Sabaq (Baru)', color: 'bg-emerald-600 text-white shadow-xs' },
                            { key: 'sabqi', label: 'Sabqi (Kemarin)', color: 'bg-blue-600 text-white shadow-xs' },
                            { key: 'manzil', label: 'Manzil (Lama)', color: 'bg-purple-600 text-white shadow-xs' },
                        ].map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setSelectedType(t.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedType === t.key 
                                        ? t.color 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
                {/* NOTIFIKASI HASIL SIMPAN */}
                {notification && (
                    <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                            <span>{notification.message}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-2 font-bold">×</button>
                    </div>
                )}

                {/* ── BARIS KONTROL INPUT (DIBESARKAN & USER-FRIENDLY) ──────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* PILIH MUSYRIF */}
                    <div className="sm:col-span-5">
                        <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Pilih Musyrif / Halaqoh
                        </label>
                        <Select 
                            options={musyrifs.map(m => ({ value: m.id.toString(), label: m.name }))}
                            value={selectedMusyrif ? { 
                                value: selectedMusyrif, 
                                label: musyrifs.find(m => m.id.toString() === selectedMusyrif)?.name || 'Pilih Musyrif' 
                            } : null}
                            onChange={(opt) => setSelectedMusyrif(opt ? opt.value : '')}
                            placeholder="Cari atau pilih nama Musyrif..."
                            isClearable
                            isSearchable
                            className="text-sm font-medium"
                        />
                    </div>

                    {/* SEARCH SANTRI */}
                    <div className="sm:col-span-4">
                        <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Cari Santri
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Ketik nama atau kelas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 h-[38px] text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                            />
                        </div>
                    </div>

                    {/* URUTKAN (SORT BY MUTABAAH DLL) */}
                    <div className="sm:col-span-3">
                        <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Urutan Santri</span>
                        </label>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                            className="w-full h-[38px] px-3 text-xs font-semibold border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="mutabaah">📋 Sesuai Mutabaah (Kelas & Nama)</option>
                            <option value="name">🔤 Nama Santri (A - Z)</option>
                            <option value="nis">🔢 Nomor Induk (NIS)</option>
                            <option value="progress">⭐ Capaian Tertinggi</option>
                        </select>
                    </div>
                </div>

                {/* ── BARIS AKSI MASSAL, STATS & PANDUAN WARNA ─────────────────── */}
                {studentsData.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                        {/* Kiri: Stats Ringkas */}
                        <div className="flex flex-wrap items-center gap-3 text-slate-700">
                            <span>
                                Total Santri: <strong className="text-slate-900">{studentsData.length}</strong>
                            </span>
                            {searchQuery && (
                                <span>
                                    Hasil Filter: <strong className="text-indigo-600">{processedStudents.length}</strong>
                                </span>
                            )}
                            <span className="border-l border-indigo-200 pl-3">
                                Total Setoran: <strong className="text-emerald-700 font-bold">{totalPagesChecked}</strong> hal
                            </span>
                        </div>

                        {/* Kanan: Panduan Tri-State & Aksi Cepat */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Legend Panduan Tri-State */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] shadow-2xs">
                                <span className="text-slate-400 font-medium">Panduan:</span>
                                <span className="inline-flex items-center gap-0.5 font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                                    ½ Setengah
                                </span>
                                <span className="inline-flex items-center gap-0.5 font-bold text-white bg-emerald-600 px-1.5 py-0.2 rounded text-[10px]">
                                    ✔ Penuh
                                </span>
                            </div>

                            {/* Batch Set Juz */}
                            <div className="flex items-center gap-1">
                                <select
                                    value={batchJuz}
                                    onChange={(e) => setBatchJuz(e.target.value)}
                                    className="h-8 px-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                                    title="Pilih Juz Serentak"
                                >
                                    {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => (
                                        <option key={j} value={j}>Juz {j}</option>
                                    ))}
                                </select>
                                <Button 
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleApplyBatchJuz}
                                    className="h-8 text-xs px-2.5 bg-white border-slate-300 hover:bg-slate-100"
                                    title="Terapkan Juz ini ke seluruh santri"
                                >
                                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                    Set Juz
                                </Button>
                            </div>

                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleCheckAllStudents}
                                className="h-8 text-xs px-2.5 bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold"
                            >
                                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                                Centang Semua
                            </Button>

                            {/* Tombol Simpan Mengambang Utama */}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                                className="h-8 text-xs px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs active:scale-95"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                                Simpan Setoran
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── KONTEN UTAMA: SPREADSHEET (PC) & CARD VIEW (HP) ───────────── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                        <span className="text-sm font-semibold text-slate-600">Memuat data halaqoh santri...</span>
                    </div>
                ) : !selectedMusyrif ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-base font-bold text-slate-700">Pilih Musyrif Terlebih Dahulu</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Silakan pilih musyrif halaqoh pada kolom di atas untuk menampilkan daftar santri dan mulai penginputan.
                        </p>
                    </div>
                ) : processedStudents.length === 0 ? (
                    <div className="py-14 text-center border border-slate-200 rounded-2xl bg-slate-50">
                        <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">Tidak ada santri yang cocok</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            {studentsData.length === 0 
                                ? 'Belum ada anggota santri yang diplotkan ke dalam halaqoh musyrif ini.' 
                                : 'Tidak ditemukan santri dengan kata kunci pencarian tersebut.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* ── 1. TAMPILAN MOBILE: KARTU SANTRI TOUCH-FRIENDLY (HP) ─── */}
                        <div className="block md:hidden space-y-4">
                            {processedStudents.map((student, index) => {
                                const pageInfo = getJuzPageInfo(student.current_juz);
                                const totalPages = pageInfo.totalPages;
                                const fullCount = student.completed_pages?.length || 0;
                                const halfCount = (student.half_pages?.length || 0) * 0.5;
                                const progressVal = fullCount + halfCount;
                                const isKhatam = fullCount >= totalPages;

                                return (
                                    <div 
                                        key={student.id} 
                                        className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                                    >
                                        {/* Header Kartu: Nama, Kelas, Status */}
                                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                        #{index + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                                        {student.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                    <span>{student.class_name}</span>
                                                    <span>•</span>
                                                    <span>NIS: {student.nis}</span>
                                                </div>
                                            </div>

                                            {/* Badge Status */}
                                            <div className="text-right shrink-0">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                    isKhatam 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : progressVal > 0 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {progressVal} / {totalPages} hal
                                                </span>
                                                {student.is_accelerated && (
                                                    <div className="text-[9px] text-amber-700 font-bold mt-0.5">
                                                        ⚡ Akselerasi
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Kontrol Juz & Aksi Cepat */}
                                        <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-1.5 flex-1">
                                                <label className="text-[11px] font-bold text-slate-700">Juz:</label>
                                                <select
                                                    value={student.current_juz}
                                                    onChange={(e) => handleStudentJuzChange(student.id, e.target.value)}
                                                    className="h-8 px-2 py-1 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 flex-1"
                                                >
                                                    {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => (
                                                        <option key={j} value={j}>
                                                            Juz {j}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCheckAllForStudent(student.id)}
                                                    className="h-8 text-[11px] px-2 bg-emerald-50 text-emerald-700 border-emerald-300"
                                                    title="Centang 1 Juz"
                                                >
                                                    1 Juz ✔
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleResetForStudent(student.id)}
                                                    className="h-8 text-[11px] px-2 bg-slate-100 text-slate-600"
                                                    title="Reset"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* GRID TOMBOL HALAMAN MOBILE (5 Kolom per Baris, Touch Target 48px) */}
                                        <div className="pt-1">
                                            <div className="text-[11px] font-bold text-slate-600 mb-2 flex justify-between">
                                                <span>Pilih Halaman Disetor (Tap untuk 1/2 atau Penuh):</span>
                                                <span className="text-slate-400 font-normal">Hal {pageInfo.startPage} - {pageInfo.endPage}</span>
                                            </div>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {Array.from({ length: totalPages }).map((_, i) => {
                                                    const pageNumber = student.start_page + i;
                                                    return renderPageButton(student, pageNumber, i + 1, true);
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── 2. TAMPILAN DESKTOP: SPREADSHEET CELL BESAR (PC) ──────── */}
                        <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                            <div className="overflow-x-auto max-h-[640px] relative custom-scrollbar">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold sticky top-0 z-30 border-b shadow-2xs">
                                            <th className="px-3 py-3.5 border-r text-center w-12 bg-slate-100 sticky left-0 z-40">
                                                No.
                                            </th>
                                            <th className="px-4 py-3.5 border-r min-w-[220px] bg-slate-100 sticky left-12 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                                Nama Santri & Kelas
                                            </th>
                                            <th className="px-3 py-3.5 border-r text-center w-28 bg-slate-100">
                                                Pilih Juz
                                            </th>
                                            <th className="px-2 py-3.5 border-r text-center w-20 bg-slate-100">
                                                Aksi
                                            </th>
                                            {/* KOLOM HALAMAN 1 S/D MAX */}
                                            {Array.from({ length: maxColumns }).map((_, i) => (
                                                <th 
                                                    key={i} 
                                                    className="px-1 py-2.5 border-r text-center min-w-[42px] bg-slate-100 text-slate-800"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-[11px]">{i + 1}</span>
                                                        <span className="text-[9px] font-normal text-slate-400 leading-tight">hal</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedStudents.map((student, index) => {
                                            const pageInfo = getJuzPageInfo(student.current_juz);
                                            const totalPages = pageInfo.totalPages;
                                            const fullCount = student.completed_pages?.length || 0;
                                            const halfCount = (student.half_pages?.length || 0) * 0.5;
                                            const progressVal = fullCount + halfCount;
                                            const isKhatam = fullCount >= totalPages;

                                            return (
                                                <tr key={student.id} className="border-b hover:bg-indigo-50/30 group transition-colors">
                                                    {/* NO */}
                                                    <td className="px-3 py-2.5 border-r text-center text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-20 font-mono font-semibold">
                                                        {index + 1}
                                                    </td>

                                                    {/* NAMA SANTRI & KELAS */}
                                                    <td className="px-4 py-2.5 border-r sticky left-12 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                                                            {student.name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                                            <span>{student.class_name}</span>
                                                            <span>•</span>
                                                            <span className={isKhatam ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}>
                                                                {progressVal}/{totalPages} hal
                                                            </span>
                                                            {isKhatam && (
                                                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                                                    Khatam
                                                                </span>
                                                            )}
                                                            {student.is_accelerated && (
                                                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                                                                    ⚡ Akselerasi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* DROPDOWN JUZ PER SANTRI */}
                                                    <td className="px-2 py-2.5 border-r text-center bg-white group-hover:bg-slate-50">
                                                        <select
                                                            value={student.current_juz}
                                                            onChange={(e) => handleStudentJuzChange(student.id, e.target.value)}
                                                            className="w-full h-8 px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                                                        >
                                                            {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => (
                                                                <option key={j} value={j}>
                                                                    Juz {j}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* TOMBOL AKSI CEPAT (PENUH / RESET) */}
                                                    <td className="px-1.5 py-2.5 border-r text-center bg-white group-hover:bg-slate-50 whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                title="Centang 1 Juz Penuh"
                                                                onClick={() => handleCheckAllForStudent(student.id)}
                                                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                            >
                                                                <CheckCheck className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Kosongkan Centang Juz Ini"
                                                                onClick={() => handleResetForStudent(student.id)}
                                                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* TOMBOL KOTAK CELL BESAR PER HALAMAN (TRI-STATE) */}
                                                    {Array.from({ length: maxColumns }).map((_, i) => {
                                                        const relativePage = i + 1;
                                                        const isApplicable = relativePage <= totalPages;
                                                        const absolutePage = student.start_page + i;

                                                        if (!isApplicable) {
                                                            return (
                                                                <td 
                                                                    key={i} 
                                                                    className="px-1 py-1.5 text-center border-r border-slate-100 bg-slate-50/50 cursor-not-allowed"
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <td 
                                                                key={i} 
                                                                className="px-1 py-1.5 text-center border-r border-slate-100"
                                                            >
                                                                {renderPageButton(student, absolutePage, relativePage, false)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FOOTER AKSI SIMPAN */}
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="text-xs text-slate-600">
                                Menampilkan <strong>{processedStudents.length}</strong> santri halaqoh. Klik tombol Simpan untuk memperbarui capaian.
                            </div>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full sm:w-auto h-11 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs active:scale-95 text-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Semua Capaian
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
