import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { BarChart3, TrendingDown, TrendingUp, AlertTriangle, Loader2, BookOpen, VolumeX, Headphones, EyeOff, Eye } from 'lucide-react';
import axios from 'axios';

const RECITERS = [
    { id: 'Alafasy_128kbps', name: 'Mishary Rashid Al-Afasy' },
    { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit Abd us-Samad (Murattal)' },
    { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit Abd us-Samad (Mujawwad)' },
    { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
    { id: 'Minshawi_Murattal_128kbps', name: 'Mohamed Siddiq El-Minshawi' },
    { id: 'Muhammad_Jibreel_128kbps', name: 'Muhammad Jibreel' },
    { id: 'Maher_AlMuaiqly_128kbps', name: 'Maher Al-Muaiqly' },
    { id: 'Saood_ash-Shuraym_128kbps', name: 'Saood Ash-Shuraym (Saud Al-Shuraim)' },
    { id: 'Hani_Rifai_192kbps', name: 'Hani Ar-Rifai' },
    { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Ash-Shaatree' },
    { id: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', name: 'Abdullah Awad Al-Juhani' },
    { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser Ad-Dussary' },
    { id: 'f.jaleel', name: 'Fares Abbad (Al-Jaleel)' },
    { id: 'Nasser_Alqatami_128kbps', name: 'Nasser Al-Qatami' },
    { id: 'Ibrahim_Al-Akhdar_128kbps', name: 'Ibrahim Al-Akhdar' },
];

export default function AnalyticsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const [localHiddenQoris, setLocalHiddenQoris] = useState([]);

    useEffect(() => {
        axios.get(route('api.tahfidz.skrining.analytics'))
            .then(res => {
                setData(res.data);
                setLocalHiddenQoris(res.data.hidden_qoris || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Gagal memuat data analitik.');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
                <p>Memuat data analitik skrining...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center border border-red-200">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <p>{error}</p>
            </div>
        );
    }

    const { top_mistakes, avg_mistakes_per_juz, monthly_trend, qari_stats, qari_errors } = data;

    const toggleHideQari = (qariId, currentHidden) => {
        const action = currentHidden ? 'show' : 'hide';
        axios.post('/quran/hide-qari', { qari_id: qariId, action })
            .then(res => {
                if (res.data.success) {
                    setLocalHiddenQoris(res.data.hidden_qori_ids);
                }
            })
            .catch(err => console.error("Failed to toggle qari visibility", err));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Kesalahan Ayat */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                            Peta Ayat Sulit (Mutasyabihat)
                        </CardTitle>
                        <CardDescription>10 ayat yang paling sering salah diucapkan oleh santri</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {top_mistakes && top_mistakes.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {top_mistakes.map((mistake, idx) => (
                                    <li key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center text-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{mistake.surah}</div>
                                                <div className="text-sm text-gray-500">Ayat ke-{mistake.ayat_number}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-900">{mistake.total_errors}</div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">Kesalahan</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-gray-500">Belum ada data kesalahan.</div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Indeks Kualitas Mutqan */}
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                Rata-rata Kesalahan per Juz
                            </CardTitle>
                            <CardDescription>Menunjukkan juz mana yang dirasa paling sulit</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {avg_mistakes_per_juz && avg_mistakes_per_juz.length > 0 ? (
                                    avg_mistakes_per_juz.map((juz, idx) => {
                                        // Calculate a rough percentage relative to a max threshold (e.g. 50 mistakes = 100% bar)
                                        const percentage = Math.min(100, (juz.avg_mistakes / 50) * 100);
                                        return (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-16 font-semibold text-gray-700 text-sm">Juz {juz.juz_number}</div>
                                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${juz.avg_mistakes > 20 ? 'bg-red-400' : juz.avg_mistakes > 10 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-20 text-right font-mono text-sm font-medium">
                                                    {Number(juz.avg_mistakes).toFixed(1)} <span className="text-xs text-gray-400">kali</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-gray-500">Belum ada data laporan juz.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tren Kesalahan Seiring Waktu */}
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-emerald-500" />
                                Tren Kualitas Hafalan
                            </CardTitle>
                            <CardDescription>Rata-rata kesalahan per bulan (semakin rendah semakin baik)</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                             {monthly_trend && monthly_trend.length > 0 ? (
                                <div className="flex items-end gap-2 h-40 pt-4">
                                    {monthly_trend.map((trend, idx) => {
                                        // Max height reference (e.g. 30 mistakes is max height)
                                        const heightPercent = Math.min(100, (trend.avg_mistakes / 30) * 100);
                                        // Format month
                                        const dateObj = new Date(trend.month + "-01");
                                        const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                                        
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-gray-800 text-white rounded py-1 px-2 mb-2 whitespace-nowrap">
                                                    {Number(trend.avg_mistakes).toFixed(1)} Kesalahan
                                                </div>
                                                <div 
                                                    className="w-full max-w-[40px] bg-violet-200 hover:bg-violet-400 rounded-t-sm transition-all"
                                                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                                ></div>
                                                <div className="text-[10px] text-gray-500 mt-2 font-medium">{monthName}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                             ) : (
                                <div className="text-center text-gray-500 py-8">Belum ada data bulanan yang cukup.</div>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Qari Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Qaris */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Headphones className="h-5 w-5 text-indigo-500" />
                            Peringkat Qari Terpopuler
                        </CardTitle>
                        <CardDescription>Qari yang paling banyak dipilih santri</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {qari_stats && qari_stats.length > 0 ? (
                            <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {qari_stats.map((stat, idx) => {
                                    const qariInfo = RECITERS.find(r => r.id === stat.qari_id);
                                    return (
                                        <li key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{qariInfo ? qariInfo.name : stat.qari_id}</div>
                                                    <div className="text-sm text-gray-500">{stat.total_users} santri menjadikan favorit</div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-gray-500">Belum ada data penggunaan Qari.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Qari Errors & Blocking */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <VolumeX className="h-5 w-5 text-red-500" />
                            Laporan Error Audio Qari
                        </CardTitle>
                        <CardDescription>Qari yang file audionya rusak/kosong dari pusat</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {qari_errors && qari_errors.length > 0 ? (
                            <ul className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {qari_errors.map((err, idx) => {
                                    const qariInfo = RECITERS.find(r => r.id === err.qari_id);
                                    const isHidden = localHiddenQoris.includes(err.qari_id);
                                    return (
                                        <li key={idx} className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isHidden ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-sm">
                                                    <VolumeX className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                        {qariInfo ? qariInfo.name : err.qari_id}
                                                        {isHidden && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded uppercase font-bold tracking-wider">Disembunyikan</span>}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{err.total_errors} laporan gagal dimuat</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toggleHideQari(err.qari_id, isHidden)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                                                    isHidden 
                                                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' 
                                                    : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                                }`}
                                            >
                                                {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                                {isHidden ? 'Tampilkan' : 'Sembunyikan'}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                    <Headphones className="h-6 w-6" />
                                </div>
                                <p className="font-medium text-gray-800">Semua Audio Lancar</p>
                                <p className="text-sm mt-1">Belum ada laporan kerusakan file audio dari santri.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2 h-fit">
                    <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900">Tips Analisis</h4>
                    <p className="text-sm text-blue-800 mt-1">Gunakan Peta Ayat Sulit di atas untuk menentukan materi *Muraja'ah* bersama. Ayat yang berada di peringkat teratas (warna merah) adalah ayat *Mutasyabihat* atau ayat panjang yang terbukti paling menantang bagi mayoritas santri.</p>
                </div>
            </div>
        </div>
    );
}
