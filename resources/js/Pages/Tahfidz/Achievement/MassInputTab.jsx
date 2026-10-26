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
    Info
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
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
    const [batchJuz, setBatchJuz] = useState('30');

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
                
                // Pastikan completed_pages terisi dari mems_by_juz jika ada
                let completed = s.completed_pages || [];
                if (memsByJuz[currentJuz]?.completed_pages) {
                    completed = memsByJuz[currentJuz].completed_pages;
                }

                return {
                    ...s,
                    current_juz: currentJuz,
                    start_page: pageInfo.startPage,
                    total_pages: pageInfo.totalPages,
                    completed_pages: completed,
                    mems_by_juz: memsByJuz
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

            // Simpan state juz sebelumnya ke dalam dictionary mems_by_juz
            const updatedMemsByJuz = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: student.completed_pages,
                    is_completed: student.completed_pages.length >= student.total_pages
                }
            };

            // Muat completed_pages untuk juz baru dari mems_by_juz jika ada
            const newCompletedPages = updatedMemsByJuz[newJuz]?.completed_pages || [];

            return {
                ...student,
                current_juz: newJuz,
                start_page: pageInfo.startPage,
                total_pages: pageInfo.totalPages,
                completed_pages: newCompletedPages,
                mems_by_juz: updatedMemsByJuz
            };
        }));
    };

    // Handle Toggle Checkbox Halaman per Santri
    const handleCheckboxChange = (studentId, pageNumber) => {
        setStudentsData(prev => prev.map(student => {
            if (student.id !== studentId) return student;

            let newCompleted;
            if (student.completed_pages.includes(pageNumber)) {
                newCompleted = student.completed_pages.filter(p => p !== pageNumber);
            } else {
                newCompleted = [...student.completed_pages, pageNumber];
            }

            // Sync ke mems_by_juz juga
            const updatedMems = {
                ...student.mems_by_juz,
                [student.current_juz]: {
                    completed_pages: newCompleted,
                    is_completed: newCompleted.length >= student.total_pages
                }
            };

            return {
                ...student,
                completed_pages: newCompleted,
                mems_by_juz: updatedMems
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

            return {
                ...student,
                completed_pages: allPages,
                mems_by_juz: updatedMems
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

            return {
                ...student,
                completed_pages: [],
                mems_by_juz: updatedMems
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
                    completed_pages: student.completed_pages,
                    is_completed: student.completed_pages.length >= student.total_pages
                }
            };

            const existingPages = updatedMemsByJuz[targetJuz]?.completed_pages || [];

            return {
                ...student,
                current_juz: targetJuz,
                start_page: pageInfo.startPage,
                total_pages: pageInfo.totalPages,
                completed_pages: existingPages,
                mems_by_juz: updatedMemsByJuz
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
                mems_by_juz: {
                    ...student.mems_by_juz,
                    [student.current_juz]: {
                        completed_pages: allPages,
                        is_completed: true
                    }
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
            completed_pages: s.completed_pages
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

    // Filter Santri berdasarkan pencarian teks
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return studentsData;
        const q = searchQuery.toLowerCase();
        return studentsData.filter(s => 
            s.name.toLowerCase().includes(q) || 
            (s.nis && s.nis.toLowerCase().includes(q)) ||
            (s.class_name && s.class_name.toLowerCase().includes(q))
        );
    }, [studentsData, searchQuery]);

    // Maksimal kolom halaman yang ditampilkan di tabel (biasanya 20 - 23)
    const maxColumns = useMemo(() => {
        let max = 20;
        filteredStudents.forEach(s => {
            if (s.total_pages > max) max = s.total_pages;
        });
        return max;
    }, [filteredStudents]);

    // Hitung total halaman tercentang
    const totalPagesChecked = useMemo(() => {
        return filteredStudents.reduce((acc, s) => acc + (s.completed_pages?.length || 0), 0);
    }, [filteredStudents]);

    return (
        <Card className="bg-white border shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <BookOpen className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-lg text-slate-800">Input Hafalan Manual / Massal</CardTitle>
                        </div>
                        <CardDescription className="mt-1 text-slate-600">
                            Pencatatan setoran per halaman secara fleksibel dan cepat untuk seluruh anggota halaqoh.
                        </CardDescription>
                    </div>

                    {/* PILAR TAHFIDZ SELECTOR */}
                    <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-inner w-fit">
                        {[
                            { key: 'sabaq', label: 'Sabaq (Baru)', color: 'bg-emerald-600 text-white' },
                            { key: 'sabqi', label: 'Sabqi (Kemarin)', color: 'bg-blue-600 text-white' },
                            { key: 'manzil', label: 'Manzil (Murojaah)', color: 'bg-purple-600 text-white' }
                        ].map(t => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setSelectedType(t.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    selectedType === t.key
                                        ? `${t.color} shadow-sm`
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
                {/* NOTIFIKASI BANNER */}
                {notification && (
                    <div className={`p-4 rounded-xl flex items-center justify-between border ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setNotification(null)}
                            className="text-xs underline hover:opacity-80 ml-4 font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                )}

                {/* BARIS FILTER & KONTROL */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* SELECT MUSYRIF */}
                    <div className="md:col-span-5">
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
                            className="text-sm"
                        />
                    </div>

                    {/* SEARCH SANTRI */}
                    <div className="md:col-span-4">
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
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* AKSI MASSAL SET JUZ */}
                    <div className="md:col-span-3">
                        <label className="block mb-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Set Juz Serentak
                        </label>
                        <div className="flex gap-1.5">
                            <select
                                value={batchJuz}
                                onChange={(e) => setBatchJuz(e.target.value)}
                                className="w-24 px-2 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => (
                                    <option key={j} value={j}>Juz {j}</option>
                                ))}
                            </select>
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={handleApplyBatchJuz}
                                disabled={studentsData.length === 0}
                                className="text-xs px-2.5 py-2 border-slate-300 hover:bg-slate-100 flex-1 whitespace-nowrap"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                Terapkan
                            </Button>
                        </div>
                    </div>
                </div>

                {/* STATS BAR & QUICK BUTTONS */}
                {studentsData.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border rounded-xl text-xs text-slate-600">
                        <div className="flex items-center gap-4">
                            <span>
                                Total Anggota: <strong className="text-slate-900">{studentsData.length}</strong> santri
                            </span>
                            {searchQuery && (
                                <span>
                                    Hasil Filter: <strong className="text-indigo-600">{filteredStudents.length}</strong>
                                </span>
                            )}
                            <span className="hidden sm:inline border-l pl-4">
                                Total Halaman Terceklis: <strong className="text-emerald-700 font-bold">{totalPagesChecked}</strong> hal
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleCheckAllStudents}
                                className="text-[11px] h-7 px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                                Centang Semua Santri
                            </Button>
                        </div>
                    </div>
                )}

                {/* LOADING SPINNER */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="animate-spin text-indigo-600 w-9 h-9" />
                        <span className="text-sm font-medium text-slate-500">Memuat data halaqoh santri...</span>
                    </div>
                ) : !selectedMusyrif ? (
                    <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">Pilih Musyrif Terlebih Dahulu</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            Silakan pilih musyrif halaqoh pada kolom di atas untuk menampilkan daftar santri dan mulai penginputan.
                        </p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="py-12 text-center border border-slate-200 rounded-xl bg-slate-50">
                        <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="text-sm font-semibold text-slate-700">Tidak ada santri yang cocok</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            {studentsData.length === 0 
                                ? 'Belum ada anggota santri yang diplotkan ke dalam halaqoh musyrif ini.' 
                                : 'Tidak ditemukan santri dengan kata kunci pencarian tersebut.'}
                        </p>
                    </div>
                ) : (
                    /* TABEL SPREADSHEET MASSAL */
                    <div className="border rounded-xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto max-h-[620px] relative">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                                        <th className="px-2.5 py-3 border-b border-r text-center w-10 bg-slate-100 sticky left-0 z-40">
                                            No.
                                        </th>
                                        <th className="px-3.5 py-3 border-b border-r min-w-[210px] bg-slate-100 sticky left-10 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                            Nama Santri
                                        </th>
                                        <th className="px-3 py-3 border-b border-r text-center w-28 bg-slate-100">
                                            Pilih Juz
                                        </th>
                                        <th className="px-2 py-3 border-b border-r text-center w-20 bg-slate-100">
                                            Aksi
                                        </th>
                                        {/* KOLOM HALAMAN 1 S/D MAX */}
                                        {Array.from({ length: maxColumns }).map((_, i) => (
                                            <th 
                                                key={i} 
                                                className="px-1.5 py-2.5 border-b border-r text-center min-w-[38px] bg-slate-100 text-slate-800"
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
                                    {filteredStudents.map((student, index) => {
                                        const pageInfo = getJuzPageInfo(student.current_juz);
                                        const totalPages = pageInfo.totalPages;
                                        const isKhatam = (student.completed_pages?.length || 0) >= totalPages;

                                        return (
                                            <tr key={student.id} className="border-b hover:bg-indigo-50/40 group transition-colors">
                                                {/* NO */}
                                                <td className="px-2.5 py-2 border-r text-center text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-20 font-mono">
                                                    {index + 1}
                                                </td>

                                                {/* NAMA SANTRI & KELAS */}
                                                <td className="px-3.5 py-2 border-r sticky left-10 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                                                    <div className="font-semibold text-slate-900 truncate max-w-[190px]">
                                                        {student.name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                                        <span>{student.class_name}</span>
                                                        <span>•</span>
                                                        <span className={isKhatam ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                                                            {student.completed_pages?.length || 0}/{totalPages} hal
                                                        </span>
                                                        {isKhatam && (
                                                            <span className="px-1 py-0.2 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">
                                                                Khatam
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* DROPDOWN JUZ PER SANTRI */}
                                                <td className="px-2 py-2 border-r text-center bg-white group-hover:bg-slate-50">
                                                    <select
                                                        value={student.current_juz}
                                                        onChange={(e) => handleStudentJuzChange(student.id, e.target.value)}
                                                        className="w-full px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/60 border border-indigo-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                                                    >
                                                        {Array.from({ length: 30 }, (_, i) => 30 - i).map(j => (
                                                            <option key={j} value={j}>
                                                                Juz {j}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* TOMBOL AKSI CEPAT (PENUH / RESET) */}
                                                <td className="px-1.5 py-2 border-r text-center bg-white group-hover:bg-slate-50 whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            title="Centang 1 Juz Penuh"
                                                            onClick={() => handleCheckAllForStudent(student.id)}
                                                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                        >
                                                            <CheckCheck className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Kosongkan Centang Juz Ini"
                                                            onClick={() => handleResetForStudent(student.id)}
                                                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* CHECKBOX HALAMAN */}
                                                {Array.from({ length: maxColumns }).map((_, i) => {
                                                    const relativePage = i + 1;
                                                    const isApplicable = relativePage <= totalPages;
                                                    const absolutePage = student.start_page + i;
                                                    const isChecked = student.completed_pages?.includes(absolutePage);

                                                    return (
                                                        <td 
                                                            key={i} 
                                                            className={`px-1.5 py-1.5 text-center border-r border-slate-100 ${
                                                                !isApplicable 
                                                                    ? 'bg-slate-50/60 cursor-not-allowed' 
                                                                    : isChecked 
                                                                        ? 'bg-emerald-50/50' 
                                                                        : 'bg-white group-hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {isApplicable ? (
                                                                <label 
                                                                    className="inline-flex items-center justify-center w-full h-full cursor-pointer p-1"
                                                                    title={`Hal ${absolutePage} (Urutan ke-${relativePage} Juz ${student.current_juz})`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600 transition-transform active:scale-95"
                                                                        checked={isChecked}
                                                                        onChange={() => handleCheckboxChange(student.id, absolutePage)}
                                                                    />
                                                                </label>
                                                            ) : (
                                                                <div className="w-3.5 h-3.5 mx-auto bg-slate-200/50 rounded-xs" />
                                                            )}
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
                )}

                {/* BOTTOM ACTION BAR */}
                {studentsData.length > 0 && !loading && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
                        <div className="text-xs text-slate-500">
                            💡 <em>Tips: Mengganti juz santri akan memuat data centang juz tersebut secara otomatis tanpa kehilangan data.</em>
                        </div>

                        <Button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[170px] shadow-sm font-semibold"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Capaian ({selectedType.toUpperCase()})
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
