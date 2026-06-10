import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Search, Filter, Book, User, MapPin, GraduationCap, Calendar, RefreshCcw, ArrowLeft, ClipboardCheck, X, Loader2, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import axios from 'axios';

export default function Index({ skrinings, reports, rekapData = [], filters, options, is_santri }) {
    const { userLevels, kelasList, kamarList } = options;

    const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'individual' | 'rekap'

    // Manual Bypass States
    const [showBypassModal, setShowBypassModal] = useState(false);
    const [bypassForm, setBypassForm] = useState({ student_id: '', juz_number: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [bypassLoading, setBypassLoading] = useState(false);

    // Rekap in-component filters (for client-side quick filter)
    const [rekapFilter, setRekapFilter] = useState({
        kelas_id: filters.rekap_kelas_id || '',
        kamar_id: filters.rekap_kamar_id || '',
        search: filters.rekap_search || '',
        status: filters.rekap_status || '',
    });

    React.useEffect(() => {
        if (searchTerm.length >= 3) {
            setIsSearching(true);
            axios.get(route('tahfidz.achievements.search-students'), { params: { q: searchTerm } })
                .then(res => { setSearchResults(res.data); })
                .finally(() => setIsSearching(false));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const handleBypassSubmit = (e) => {
        e.preventDefault();
        if (!bypassForm.student_id || !bypassForm.juz_number) return;
        setBypassLoading(true);
        router.post(route('quran.progress.manual-complete'), bypassForm, {
            preserveScroll: true,
            onSuccess: () => {
                setShowBypassModal(false);
                setBypassForm({ student_id: '', juz_number: '' });
                setSearchTerm('');
            },
            onFinish: () => setBypassLoading(false)
        });
    };

    const [filterState, setFilterState] = useState({
        role_category: filters.role_category || '',
        user_level_id: filters.user_level_id || '',
        kelas_id: filters.kelas_id || '',
        kamar_id: filters.kamar_id || '',
        juz_number: filters.juz_number || '',
        search: filters.search || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleFilterChange = (field, value) => {
        setFilterState(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        const params = Object.fromEntries(Object.entries(filterState).filter(([_, v]) => v !== ''));
        router.get(route('tahfidz.pantau-skrining'), params, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setFilterState({ role_category: '', user_level_id: '', kelas_id: '', kamar_id: '', juz_number: '', search: '', start_date: '', end_date: '' });
        router.get(route('tahfidz.pantau-skrining'));
    };

    const applyRekapFilters = () => {
        const params = {
            ...Object.fromEntries(Object.entries(filterState).filter(([_, v]) => v !== '')),
            ...(rekapFilter.kelas_id && { rekap_kelas_id: rekapFilter.kelas_id }),
            ...(rekapFilter.kamar_id && { rekap_kamar_id: rekapFilter.kamar_id }),
            ...(rekapFilter.search && { rekap_search: rekapFilter.search }),
            ...(rekapFilter.status && { rekap_status: rekapFilter.status }),
        };
        router.get(route('tahfidz.pantau-skrining'), params, { preserveState: true, preserveScroll: true });
    };

    const resetRekapFilters = () => {
        setRekapFilter({ kelas_id: '', kamar_id: '', search: '', status: '' });
        router.get(route('tahfidz.pantau-skrining'));
    };

    // Summary stats for rekap
    const rekapStats = React.useMemo(() => {
        const total = rekapData.length;
        const selesai = rekapData.filter(r => r.is_completed).length;
        const belum = total - selesai;
        return { total, selesai, belum };
    }, [rekapData]);

    return (
        <MainLayout>
            <Head title="Pantau Skrining Hafalan" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pantau Skrining Hafalan</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Riwayat skrining mandiri yang dilakukan oleh santri maupun pengurus.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('quran.skrining')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Skrining
                        </Link>
                        {!is_santri && (
                            <button
                                onClick={() => setShowBypassModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                                Lengkapi Manual
                            </button>
                        )}
                    </div>
                </div>

                {/* Bypass Modal */}
                {showBypassModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center px-6 py-4 border-b">
                                <h3 className="text-lg font-bold text-gray-900">Bypass Skrining Manual</h3>
                                <button onClick={() => setShowBypassModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleBypassSubmit} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pilih Santri</label>
                                    <input
                                        type="text"
                                        placeholder="Ketik nama santri (min 3 huruf)..."
                                        className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setBypassForm(prev => ({ ...prev, student_id: '' }));
                                        }}
                                    />
                                    {isSearching && <p className="text-xs text-emerald-600 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Mencari...</p>}
                                    {searchResults.length > 0 && !bypassForm.student_id && (
                                        <ul className="mt-1 max-h-40 overflow-auto border rounded-md shadow-sm bg-white divide-y">
                                            {searchResults.map(s => (
                                                <li key={s.id}
                                                    onClick={() => {
                                                        setBypassForm(prev => ({ ...prev, student_id: s.id }));
                                                        setSearchTerm(s.text);
                                                        setSearchResults([]);
                                                    }}
                                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 text-gray-700">
                                                    {s.text} <span className="text-gray-400 text-xs ml-1">({s.nis})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Pilih Juz</label>
                                    <select
                                        required
                                        className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                        value={bypassForm.juz_number}
                                        onChange={(e) => setBypassForm(prev => ({ ...prev, juz_number: e.target.value }))}
                                    >
                                        <option value="">-- Pilih Juz --</option>
                                        {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>Juz {num}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowBypassModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!bypassForm.student_id || !bypassForm.juz_number || bypassLoading}
                                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {bypassLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                                        Tandai Selesai
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Filter Section - hidden for Santri */}
                {!is_santri && activeTab !== 'rekap' && (
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4 text-violet-600" /> Filter Pencarian
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Kategori</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={filterState.role_category} onChange={(e) => handleFilterChange('role_category', e.target.value)}>
                                        <option value="">Semua Kategori</option>
                                        <option value="Santri">Santri</option>
                                        <option value="Pegawai">Pegawai/Pengurus</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Level/Role</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={filterState.user_level_id} onChange={(e) => handleFilterChange('user_level_id', e.target.value)} disabled={filterState.role_category === 'Santri'}>
                                        <option value="">Semua Level</option>
                                        {userLevels.map(lvl => (<option key={lvl.id} value={lvl.id}>{lvl.name}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Kelas</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={filterState.kelas_id} onChange={(e) => handleFilterChange('kelas_id', e.target.value)}>
                                        <option value="">Semua Kelas</option>
                                        {kelasList.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Asrama/Kamar</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={filterState.kamar_id} onChange={(e) => handleFilterChange('kamar_id', e.target.value)}>
                                        <option value="">Semua Asrama</option>
                                        {kamarList.map(k => (<option key={k.id} value={k.id}>{k.building} - {k.name}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Juz</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={filterState.juz_number} onChange={(e) => handleFilterChange('juz_number', e.target.value)}>
                                        <option value="">Semua Juz</option>
                                        {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (<option key={num} value={num}>Juz {num}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Cari Santri / User</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                                        <input type="text" placeholder="Ketik nama atau NIS..." className="pl-10 w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 h-[38px]" value={filterState.search} onChange={(e) => handleFilterChange('search', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Periode Dari (Mulai Tanggal)</label>
                                    <input type="date" className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 h-[38px]" value={filterState.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Periode Sampai (Akhir Tanggal)</label>
                                    <input type="date" className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 h-[38px]" value={filterState.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={resetFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition">
                                    <RefreshCcw className="h-4 w-4 mr-2" /> Reset
                                </button>
                                <button onClick={applyFilters} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 transition">
                                    <Search className="h-4 w-4 mr-2" /> Terapkan Pencarian
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rekap Filter Panel */}
                {!is_santri && activeTab === 'rekap' && (
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="h-4 w-4 text-violet-600" /> Filter Rekap Skrining
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Kelas</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={rekapFilter.kelas_id} onChange={(e) => setRekapFilter(p => ({ ...p, kelas_id: e.target.value }))}>
                                        <option value="">Semua Kelas</option>
                                        {kelasList.map(k => (<option key={k.id} value={k.id}>{k.name}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Asrama/Kamar</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={rekapFilter.kamar_id} onChange={(e) => setRekapFilter(p => ({ ...p, kamar_id: e.target.value }))}>
                                        <option value="">Semua Asrama</option>
                                        {kamarList.map(k => (<option key={k.id} value={k.id}>{k.building} - {k.name}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Status Skrining</label>
                                    <select className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" value={rekapFilter.status} onChange={(e) => setRekapFilter(p => ({ ...p, status: e.target.value }))}>
                                        <option value="">Semua Status</option>
                                        <option value="selesai">✅ Sudah Selesai (30 Juz)</option>
                                        <option value="belum">⚠️ Belum Selesai</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">Cari Nama / NIS</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                                        <input type="text" placeholder="Ketik nama atau NIS..." className="pl-10 w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 h-[38px]" value={rekapFilter.search} onChange={(e) => setRekapFilter(p => ({ ...p, search: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && applyRekapFilters()} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button onClick={resetRekapFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition">
                                    <RefreshCcw className="h-4 w-4 mr-2" /> Reset
                                </button>
                                <button onClick={applyRekapFilters} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 transition">
                                    <Search className="h-4 w-4 mr-2" /> Terapkan
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tab Switcher */}
                <div className="flex bg-white rounded-lg shadow-sm border p-1 w-fit">
                    <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'reports' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        Laporan per Juz
                    </button>
                    <button onClick={() => setActiveTab('individual')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'individual' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        Riwayat Individu
                    </button>
                    {!is_santri && (
                        <button onClick={() => setActiveTab('rekap')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'rekap' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                            <BarChart3 className="h-4 w-4" />
                            Rekap Status Skrining
                        </button>
                    )}
                </div>

                {/* ── REKAP STATUS TAB ──────────────────────────────────── */}
                {activeTab === 'rekap' && !is_santri && (
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
                                <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{rekapStats.total}</div>
                                    <div className="text-xs text-gray-500">Total Santri</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{rekapStats.selesai}</div>
                                    <div className="text-xs text-gray-500">Selesai Sesuai Target Hafalan</div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-amber-700">{rekapStats.belum}</div>
                                    <div className="text-xs text-gray-500">Belum Selesai</div>
                                </div>
                            </div>
                        </div>

                        {/* Rekap Table */}
                        <Card className="border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Santri</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz Belum Diselesaikan</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rekapData.length > 0 ? (
                                            rekapData.map((row, idx) => (
                                                <tr key={row.student_id} className="hover:bg-violet-50/40 transition-colors">
                                                    <td className="px-6 py-3 text-sm text-gray-400">{idx + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                                                                <User className="h-4 w-4 text-violet-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                                                                <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                                                                    <span className="font-mono">{row.nomor_induk}</span>
                                                                    {row.kelas && (
                                                                        <span className="inline-flex items-center gap-1 text-gray-600">
                                                                            <GraduationCap className="h-3 w-3" /> {row.kelas}
                                                                        </span>
                                                                    )}
                                                                    {row.kamar && (
                                                                        <span className="inline-flex items-center gap-1 text-gray-600">
                                                                            <MapPin className="h-3 w-3" /> {row.kamar}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="text-sm font-bold text-gray-800">{row.total_done}<span className="text-gray-400 font-normal">/{row.total_target}</span></div>
                                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all ${row.is_completed ? 'bg-emerald-500' : (row.total_done / (row.total_target || 1)) >= 0.6 ? 'bg-blue-500' : (row.total_done / (row.total_target || 1)) >= 0.3 ? 'bg-amber-500' : 'bg-red-400'}`}
                                                                    style={{ width: `${row.total_target > 0 ? (row.total_done / row.total_target) * 100 : 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {row.total_target === 0 ? (
                                                            <span className="text-sm text-gray-500 font-medium">Belum ada target hafalan</span>
                                                        ) : row.missing_juz.length === 0 ? (
                                                            <span className="text-sm text-emerald-600 font-medium">— Semua juz selesai ✓</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                                {row.missing_juz.map(j => (
                                                                    <span key={j} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                                        Juz {j}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {row.total_target === 0 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                                                Belum Ada Target
                                                            </span>
                                                        ) : row.is_completed ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                                <AlertCircle className="h-3.5 w-3.5" /> {row.total_missing} Juz Belum
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                                    <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                                    <p className="text-sm">Tidak ada data santri yang ditemukan.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ── LAPORAN / INDIVIDU TABS ───────────────────────────── */}
                {activeTab !== 'rekap' && (
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identitas User</th>
                                        {activeTab === 'individual' ? (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ayat Skrining</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Kesalahan</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juz</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Total Kesalahan</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeTab === 'individual' ? (
                                        skrinings.data.length > 0 ? (
                                            skrinings.data.map((item) => (
                                                <tr key={item.id} className="hover:bg-violet-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap align-top">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1 pl-6">
                                                            {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-violet-100 rounded-full flex items-center justify-center">
                                                                <User className="h-4 w-4 text-violet-600" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{item.user?.name || '-'}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-medium bg-blue-100 text-blue-800">{item.user?.user_level?.name || '-'}</span>
                                                                    {item.user?.user_level?.name === 'Santri' && item.user?.student?.latest_class_member?.active_class?.kelas && (
                                                                        <span className="inline-flex items-center text-gray-600 gap-1"><GraduationCap className="h-3 w-3" />{item.user.student.latest_class_member.active_class.kelas.name}</span>
                                                                    )}
                                                                    {(item.user?.student?.kamar_members?.[0]?.active_kamar?.kamar || item.user?.student?.kamar_members?.[0]?.kamar) && (
                                                                        <span className="inline-flex items-center text-gray-600 gap-1"><MapPin className="h-3 w-3" />{item.user.student.kamar_members[0].active_kamar?.kamar?.name || item.user.student.kamar_members[0].kamar?.name}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="text-sm text-gray-900 font-medium flex items-center gap-1.5">
                                                            <Book className="h-4 w-4 text-emerald-500" />
                                                            Surah {item.surah_number} Ayat {item.ayat_number}
                                                        </div>
                                                        {item.juz_number && (<div className="text-xs text-gray-500 mt-1 pl-5.5">Juz {item.juz_number}</div>)}
                                                        <p className="mt-2 text-sm text-right leading-loose font-arabic text-gray-800 dir-rtl" style={{ direction: 'rtl', fontFamily: "'Amiri Quran', serif" }}>
                                                            {item.full_ayat_text.split(' ').map((word, idx) => {
                                                                const isHighlighted = item.kata_benar.includes(word);
                                                                return (<span key={idx} className={`${isHighlighted ? 'bg-red-100 text-red-700 font-bold px-1 rounded' : ''} mr-1`}>{word}</span>);
                                                            })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                                            <p className="text-xs font-semibold text-red-800 mb-1 border-b border-red-200 pb-1">Hafalan Keliru:</p>
                                                            <p className="text-sm text-red-900 whitespace-pre-wrap">{item.hafalan_salah}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><div className="flex flex-col items-center"><Book className="h-10 w-10 text-gray-300 mb-2" /><p>Belum ada rekaman skrining hafalan individu.</p></div></td></tr>
                                        )
                                    ) : (
                                        reports.data.length > 0 ? (
                                            reports.data.map((report) => (
                                                <tr key={report.id} className="hover:bg-violet-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap align-top">
                                                        <div className="flex items-center text-sm text-gray-900">
                                                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                            {new Date(report.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1 pl-6">
                                                            {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 bg-violet-100 rounded-full flex items-center justify-center">
                                                                <User className="h-4 w-4 text-violet-600" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{report.user?.name || '-'}</div>
                                                                <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm font-medium bg-blue-100 text-blue-800">{report.user?.user_level?.name || '-'}</span>
                                                                    {report.user?.user_level?.name === 'Santri' && report.user?.student?.latest_class_member?.active_class?.kelas && (
                                                                        <span className="inline-flex items-center text-gray-600 gap-1"><GraduationCap className="h-3 w-3" />{report.user.student.latest_class_member.active_class.kelas.name}</span>
                                                                    )}
                                                                    {(report.user?.student?.kamar_members?.[0]?.active_kamar?.kamar || report.user?.student?.kamar_members?.[0]?.kamar) && (
                                                                        <span className="inline-flex items-center text-gray-600 gap-1"><MapPin className="h-3 w-3" />{report.user.student.kamar_members[0].active_kamar?.kamar?.name || report.user.student.kamar_members[0].kamar?.name}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="text-sm text-gray-900 font-medium">Juz {report.juz_number}</div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.total_mistakes === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                            {report.total_mistakes} Kesalahan
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500"><div className="flex flex-col items-center"><Book className="h-10 w-10 text-gray-300 mb-2" /><p>Belum ada laporan juz.</p></div></td></tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {activeTab === 'individual' ? (
                            skrinings.links && skrinings.data.length > 0 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                    <Pagination links={skrinings.links} />
                                </div>
                            )
                        ) : (
                            reports.links && reports.data.length > 0 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                    <Pagination links={reports.links} />
                                </div>
                            )
                        )}
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
