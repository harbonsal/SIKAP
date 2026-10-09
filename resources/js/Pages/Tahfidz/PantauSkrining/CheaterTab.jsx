import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { AlertCircle, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function CheaterTab() {
    const [cheaters, setCheaters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchCheaters = () => {
        setLoading(true);
        axios.get('/api/anulir-cheat-preview', { params: { date: filterDate } })
            .then(res => {
                const sortedData = res.data.sort((a, b) => {
                    const nameCompare = a.name.localeCompare(b.name);
                    if (nameCompare !== 0) return nameCompare;
                    return a.juz - b.juz;
                });
                setCheaters(sortedData);
                setSelectedIds(sortedData.map(c => c.id));
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCheaters();
    }, [filterDate]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(cheaters.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleAnulir = () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Anda yakin ingin menganulir ${selectedIds.length} progress skrining ini? Santri harus mengulang kembali.`)) return;

        setIsSubmitting(true);
        axios.post('/api/anulir-cheat-confirm', { progress_ids: selectedIds })
            .then(res => {
                if (res.data.success) {
                    alert(res.data.message);
                    fetchCheaters();
                    router.reload({ preserveScroll: true });
                } else {
                    alert("Gagal: " + res.data.message);
                }
            })
            .catch(err => {
                alert("Terjadi kesalahan.");
                console.error(err);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="space-y-4">
            <Card className="border-red-200 shadow-sm overflow-hidden bg-red-50/30">
                <CardHeader className="pb-3 border-b border-red-100 bg-white flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" /> Analisa Potensi Kecurangan
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Sistem mendeteksi santri-santri berikut menyelesaikan 1 Juz namun jumlah pemutaran ayatnya di bawah batas wajar (kurang dari 40 ayat). 
                            Silakan review dan centang santri yang terbukti <strong>Nembak Halaman Terakhir</strong> untuk dianulir kelulusannya.
                        </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Filter Tanggal:</label>
                        <input 
                            type="date" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"
                        />
                        {filterDate && (
                            <button 
                                onClick={() => setFilterDate('')}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                Semua Waktu
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-red-400 mb-2" />
                            <p className="text-sm">Menganalisa data...</p>
                        </div>
                    ) : cheaters.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-red-200">
                                <thead className="bg-red-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider w-8">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                checked={selectedIds.length === cheaters.length && cheaters.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Santri</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Juz</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-red-800 uppercase tracking-wider">Waktu Mulai</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-red-800 uppercase tracking-wider">Waktu Selesai</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-red-800 uppercase tracking-wider">Durasi</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-red-800 uppercase tracking-wider">Jumlah Ayat</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cheaters.map((row) => (
                                        <tr key={row.id} className="hover:bg-red-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                    checked={selectedIds.includes(row.id)}
                                                    onChange={() => handleSelect(row.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                                                <div className="text-xs text-gray-500">ID Progress: {row.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Juz {row.juz}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">{row.start}</td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">{row.end}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${row.durasi < 15 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {row.durasi} Menit
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-red-600 font-bold text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {row.ayat_count} Ayat
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    Mencentang <span className="font-bold">{selectedIds.length}</span> dari {cheaters.length} santri terindikasi curang.
                                </div>
                                <button 
                                    onClick={handleAnulir}
                                    disabled={selectedIds.length === 0 || isSubmitting}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                                    Anulir Kelulusan ({selectedIds.length})
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                            <h3 className="text-lg font-bold text-emerald-700">Alhamdulillah!</h3>
                            <p className="text-sm text-emerald-600 mt-1 text-center max-w-md">
                                Tidak ada indikasi kecurangan (pemutaran kurang dari 40 ayat) pada progress yang sudah selesai saat ini.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
