import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import TahfidzTabs from '@/Components/TahfidzTabs';
import { 
    Users, 
    BookOpen, 
    AlertCircle, 
    TrendingUp, 
    Award,
    Clock,
    UserX,
    CheckCircle2
} from 'lucide-react';

export default function Dashboard({ auth, musyrifs, selected_musyrif_id, dashboard_data }) {
    const { belum_setor = [], mistakes = [], leaderboard = [] } = dashboard_data;

    const handleMusyrifChange = (e) => {
        router.get(route('tahfidz.dashboard.index'), { musyrif_id: e.target.value }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Dashboard Tahfidz" />

            <div className="space-y-6">
                <TahfidzTabs activeRoute="dashboard" />
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Tahfidz & Pemantauan Halaqoh</h2>
                    </div>

                    {/* Header Action: Filter Musyrif */}
                    <div className="bg-white p-4 shadow-sm sm:rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-medium text-gray-900">Pilih Musyrif / Halaqoh</h3>
                        </div>
                        <div className="w-64">
                            <select
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                                value={selected_musyrif_id || ''}
                                onChange={handleMusyrifChange}
                            >
                                {musyrifs.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Kolom Kiri: Status Setoran & Kesalahan */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Card: Status Belum Setor */}
                            <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
                                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Belum Setor Hari Ini
                                    </h3>
                                    <span className="bg-red-200 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                        {belum_setor.length} Santri
                                    </span>
                                </div>
                                <div className="p-6">
                                    {belum_setor.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {belum_setor.map((santri) => (
                                                <div key={santri.id} className="flex items-start gap-3 p-3 border border-red-100 rounded-lg bg-red-50/50">
                                                    <div className="mt-0.5"><UserX className="w-5 h-5 text-red-400" /></div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{santri.name}</p>
                                                        <p className="text-xs text-gray-500">{santri.class}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">Alhamdulillah, semua santri halaqoh ini sudah storan hari ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card: Mistake Tracker */}
                            <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                                    <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Log Kesalahan Terbanyak (Mistake Tracker)
                                    </h3>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Fokuskan muraja'ah santri pada ayat/surat berikut karena sering mengalami kesalahan.
                                    </p>
                                </div>
                                <div className="p-6">
                                    {mistakes.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Santri</th>
                                                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                                                        <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Salah</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {mistakes.map((m, idx) => (
                                                        <tr key={idx} className="hover:bg-amber-50/30">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{m.student_name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                                <span className="font-semibold text-gray-700">{m.surah}</span> (Ayat {m.ayat})<br/>
                                                                <span className="text-xs">Juz {m.juz} • Hal {m.page}</span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold">
                                                                    {m.count}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-gray-500 font-medium">Belum ada catatan kesalahan signifikan yang direkam.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Leaderboard */}
                        <div className="lg:col-span-1">
                            <div className="bg-white shadow-sm sm:rounded-lg overflow-hidden h-full">
                                <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
                                    <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        Leaderboard Halaqoh
                                    </h3>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        Peringkat berdasarkan rata-rata halaman baru per santri bulan ini.
                                    </p>
                                </div>
                                <div className="p-0">
                                    {leaderboard.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {leaderboard.map((item, idx) => (
                                                <li key={idx} className={`flex items-center justify-between p-4 ${idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-50' : idx === 2 ? 'bg-orange-50/30' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                                            idx === 0 ? 'bg-yellow-400 text-white' : 
                                                            idx === 1 ? 'bg-gray-400 text-white' : 
                                                            idx === 2 ? 'bg-orange-400 text-white' : 
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{item.musyrif_name}</p>
                                                            <p className="text-xs text-gray-500">Total: {item.total_pages} Hal Baru</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-indigo-600">{item.avg_pages}</div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Avg/Santri</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-gray-500 font-medium">Data leaderboard belum tersedia bulan ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
