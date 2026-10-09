import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { 
    AlertTriangle, CheckCircle, Info, BookOpen, UserCheck, 
    ArrowLeft, Plus, Calendar, AlertOctagon, TrendingDown, BookMarked
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

export default function Profile({ 
    student, careViolations, individualLogs, grades, 
    memorizations, tahfidzViolations, analytics, academicNotes
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showViolationModal, setShowViolationModal] = useState(false);

    const { auth } = usePage().props;
    const userRoles = auth?.user?.roles || [];
    
    // Check if user has permission to input violation
    const canInputViolation = userRoles.some(role => 
        ['Administrator', 'Kepala Sekolah', 'Manager', 'Sekretaris Divisi', 'Wakil Kepala Sekolah'].includes(role)
    );

    const { data, setData, post, processing, reset, errors } = useForm({
        date: new Date().toISOString().split('T')[0],
        violation_type: 'Ringan',
        description: '',
        punishment: '',
        points: 0
    });

    const submitViolation = (e) => {
        e.preventDefault();
        post(route('musyrif-tarbiyah.profile.violation.store', student.id), {
            onSuccess: () => {
                setShowViolationModal(false);
                reset();
            }
        });
    };

    const radarData = [
        { subject: 'Akademik', A: analytics.scores.akademik, fullMark: 100 },
        { subject: 'Tahfidz', A: analytics.scores.tahfidz, fullMark: 100 },
        { subject: 'Kedisiplinan', A: analytics.scores.kedisiplinan, fullMark: 100 },
        { subject: 'Karakter/Adab', A: analytics.scores.karakter, fullMark: 100 },
    ];

    const trafficColorMap = {
        'green': 'bg-green-100 border-green-200 text-green-800',
        'yellow': 'bg-yellow-100 border-yellow-200 text-yellow-800',
        'red': 'bg-red-100 border-red-200 text-red-800',
    };

    const trafficIconMap = {
        'green': <CheckCircle className="h-10 w-10 text-green-600" />,
        'yellow': <AlertTriangle className="h-10 w-10 text-yellow-600" />,
        'red': <AlertOctagon className="h-10 w-10 text-red-600" />,
    };

    return (
        <MainLayout>
            <Head title={`Profil Holistik - ${student.name}`} />

            <div className="space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('musyrif-tarbiyah.index')} className="p-2 rounded-full hover:bg-gray-200 transition">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profil Holistik Santri</h1>
                            <p className="text-sm text-gray-500">{student.nomor_induk} - {student.name}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:mt-1">
                        <Link href={route('musyrif-tarbiyah.individual.index', student.id)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 shadow-sm">
                            <Plus className="h-4 w-4 mr-2" /> Jurnal Pribadi
                        </Link>
                        <Link href={route('musyrif-tarbiyah.group.index')} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 h-9 px-4 shadow-sm">
                            <Plus className="h-4 w-4 mr-2" /> Jurnal Kelompok
                        </Link>
                    </div>
                </div>

                {/* Status Alert */}
                <div className={`p-4 rounded-xl border flex items-start gap-4 shadow-sm ${trafficColorMap[analytics.trafficColor]}`}>
                    <div className="shrink-0 mt-1">
                        {trafficIconMap[analytics.trafficColor]}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Status: {analytics.trafficLight}</h3>
                        <p className="text-sm mt-1">{analytics.summaryText}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Overview & Analisa
                        </button>
                        <button
                            onClick={() => setActiveTab('kedisiplinan')}
                            className={`${activeTab === 'kedisiplinan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Catatan Pengasuhan & Pelanggaran
                        </button>
                        <button
                            onClick={() => setActiveTab('akademik')}
                            className={`${activeTab === 'akademik' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Akademik & Tahfidz
                        </button>
                    </nav>
                </div>

                {/* Tab Content: Overview */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Keseimbangan Dimensi (Radar)</h3>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Skor Santri" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-center">
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Metrik Peringatan Dini</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <TrendingDown className="h-5 w-5 text-red-500" />
                                        <span className="font-medium text-red-900">Nilai di Bawah KKM</span>
                                    </div>
                                    <span className="text-lg font-bold text-red-600">{analytics.metrics.below_kkm} Mapel</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <BookMarked className="h-5 w-5 text-orange-500" />
                                        <span className="font-medium text-orange-900">Bolos Halaqoh</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-600">{analytics.metrics.bolos_halaqoh} Kali</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        <span className="font-medium text-yellow-900">Pelanggaran Pengasuhan</span>
                                    </div>
                                    <span className="text-lg font-bold text-yellow-600">{analytics.metrics.total_violations} Kasus</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <UserCheck className="h-5 w-5 text-blue-500" />
                                        <span className="font-medium text-blue-900">Catatan Jurnal Bermasalah</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">{analytics.metrics.problems_noted} Catatan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Kedisiplinan */}
                {activeTab === 'kedisiplinan' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-lg text-gray-800">Catatan Pelanggaran Pengasuhan</h3>
                                {canInputViolation && (
                                    <button 
                                        onClick={() => setShowViolationModal(true)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2 shadow-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Input Pelanggaran
                                    </button>
                                )}
                            </div>
                            <div className="p-0">
                                {careViolations.length > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Tanggal</th>
                                                <th className="px-6 py-3">Jenis</th>
                                                <th className="px-6 py-3">Keterangan</th>
                                                <th className="px-6 py-3">Hukuman/Poin</th>
                                                <th className="px-6 py-3">Pelapor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {careViolations.map((v) => (
                                                <tr key={v.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">{v.date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            v.violation_type === 'Berat' ? 'bg-red-100 text-red-800' :
                                                            v.violation_type === 'Sedang' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {v.violation_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">{v.description}</td>
                                                    <td className="px-6 py-4">
                                                        {v.punishment && <div>Hukuman: {v.punishment}</div>}
                                                        {v.points > 0 && <div>Poin: {v.points}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">{v.user?.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 italic">
                                        Belum ada catatan pelanggaran pengasuhan. Alhamdulillah.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-4 border-b bg-gray-50/50">
                                <h3 className="font-bold text-lg text-gray-800">Timeline Jurnal Individu (Musyrif)</h3>
                            </div>
                            <div className="p-6">
                                {individualLogs.length > 0 ? (
                                    <div className="space-y-6">
                                        {individualLogs.map((log) => (
                                            <div key={log.id} className="relative pl-6 border-l-2 border-blue-200 pb-2">
                                                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-2 border-2 border-white"></div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                    <div>
                                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{log.date}</span>
                                                        <h4 className="font-semibold text-gray-800 mt-2">Ditulis oleh: {log.user?.name}</h4>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                                                    {log.personal_problem && (
                                                        <div className="mb-2"><strong>Masalah Kepribadian:</strong> {log.personal_problem}</div>
                                                    )}
                                                    {log.worship_problem && (
                                                        <div className="mb-2"><strong>Masalah Ibadah:</strong> {log.worship_problem}</div>
                                                    )}
                                                    <div><strong>Catatan/Solusi:</strong> {log.notes}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 italic">
                                        Belum ada catatan jurnal individu.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content: Akademik & Tahfidz */}
                {activeTab === 'akademik' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="p-4 border-b bg-gray-50/50">
                                <h3 className="font-bold text-lg text-gray-800">Catatan Akademik</h3>
                            </div>
                            <div className="p-0">
                                {grades.length > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Mata Pelajaran</th>
                                                <th className="px-4 py-3">Nilai</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grades.map((g) => {
                                                const isBelowKKM = g.final_score < (g.subject?.kkm ?? 75);
                                                return (
                                                    <tr key={g.id} className="bg-white border-b hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{g.subject?.name}</td>
                                                        <td className="px-4 py-3 font-bold">{g.final_score}</td>
                                                        <td className="px-4 py-3">
                                                            {isBelowKKM ? (
                                                                <span className="text-red-600 font-semibold text-xs flex items-center"><TrendingDown className="w-3 h-3 mr-1"/> Di Bawah KKM</span>
                                                            ) : (
                                                                <span className="text-green-600 font-semibold text-xs flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Aman</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 italic">Data nilai belum diinput.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mt-6">
                            <div className="p-4 border-b bg-gray-50/50">
                                <h3 className="font-bold text-lg text-gray-800">Catatan & Kehadiran dari Guru Kelas (Jurnal KBM)</h3>
                                <p className="text-xs text-gray-500 mt-1">Rekap data Alpa, Terlambat, dan Catatan Khusus dari guru di kelas akademik.</p>
                            </div>
                            <div className="p-0">
                                {academicNotes && academicNotes.length > 0 ? (
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Tanggal / Mapel</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Catatan Tambahan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {academicNotes.map((note) => (
                                                <tr key={note.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-gray-800">{note.date}</div>
                                                        <div className="text-xs text-gray-500">{note.subject}</div>
                                                        <div className="text-xs text-blue-600">{note.teacher}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            note.status === 'Alpa' ? 'bg-red-100 text-red-800' :
                                                            note.status === 'Terlambat' ? 'bg-orange-100 text-orange-800' :
                                                            note.status === 'Izin' || note.status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {note.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {note.note ? note.note : <span className="text-gray-400 italic">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 italic">Belum ada catatan atau masalah kehadiran di kelas akademik.</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            
                            {/* Tahfidz Target Tracking */}
                            {analytics?.tahfidzTargets && (
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    <div className="p-4 border-b bg-gray-50/50">
                                        <h3 className="font-bold text-lg text-gray-800">Ketercapaian Target Tahfidz (Minggu Ini)</h3>
                                        <p className="text-xs text-gray-500 mt-1">Pemantauan target harian terakumulasi selama seminggu terakhir.</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {['sabaq', 'sabqi', 'manzil'].map((type) => {
                                                const targetData = analytics.tahfidzTargets.weekly?.[type];
                                                if (!targetData) return null;
                                                
                                                const isMet = targetData.is_met;
                                                
                                                return (
                                                    <div key={type} className={`p-3 rounded-lg border ${isMet ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                        <div className="text-xs font-bold uppercase text-gray-600 mb-1">{type}</div>
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <div className="text-xl font-bold text-gray-800">{targetData.achieved} <span className="text-sm font-normal text-gray-500">halaman</span></div>
                                                                <div className="text-xs text-gray-500 mt-1">Target: {targetData.target} hal</div>
                                                            </div>
                                                            <div>
                                                                {isMet ? (
                                                                    <span className="text-green-600 text-xs font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Tercapai</span>
                                                                ) : (
                                                                    <span className="text-red-600 text-xs font-bold flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> Kurang {targetData.deficit} hal</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="font-bold text-lg text-gray-800">Capaian Tahfidz Terakhir</h3>
                                </div>
                                <div className="p-6">
                                    {memorizations.length > 0 ? (
                                        <div className="space-y-4">
                                            {memorizations.map((m) => (
                                                <div key={m.id} className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <div className="font-semibold text-blue-900">
                                                        Juz {m.juz} - Surah {m.surah_name} 
                                                    </div>
                                                    <div className="text-sm text-blue-700 mt-1">
                                                        Ayat: {m.start_verse} s.d {m.end_verse}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 italic">Belum ada data setoran tahfidz.</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4 border-b bg-gray-50/50">
                                    <h3 className="font-bold text-lg text-gray-800">Catatan Pelanggaran Tahfidz (Halaqoh)</h3>
                                </div>
                                <div className="p-0">
                                    {tahfidzViolations.length > 0 ? (
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3">Tanggal</th>
                                                    <th className="px-4 py-3">Jenis</th>
                                                    <th className="px-4 py-3">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tahfidzViolations.map((tv) => (
                                                    <tr key={tv.id} className="bg-white border-b hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">{tv.date}</td>
                                                        <td className="px-4 py-3 font-medium text-orange-600">{tv.violation_type}</td>
                                                        <td className="px-4 py-3">{tv.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 italic">Tidak ada catatan membolos atau pelanggaran di tahfidz.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Input Pelanggaran */}
            {showViolationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-red-800 flex items-center">
                                <AlertTriangle className="h-5 w-5 mr-2" /> Input Pelanggaran Pengasuhan
                            </h3>
                            <button onClick={() => setShowViolationModal(false)} className="text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={submitViolation}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                        <input 
                                            type="date" 
                                            value={data.date} 
                                            onChange={e => setData('date', e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Pelanggaran</label>
                                        <select 
                                            value={data.violation_type} 
                                            onChange={e => setData('violation_type', e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                        >
                                            <option value="Ringan">Ringan</option>
                                            <option value="Sedang">Sedang</option>
                                            <option value="Berat">Berat</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Kronologi</label>
                                        <textarea 
                                            value={data.description} 
                                            onChange={e => setData('description', e.target.value)}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" 
                                            rows="3"
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tindak Lanjut/Hukuman</label>
                                            <input 
                                                type="text" 
                                                value={data.punishment} 
                                                onChange={e => setData('punishment', e.target.value)}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Poin (Jika ada)</label>
                                            <input 
                                                type="number" 
                                                value={data.points} 
                                                onChange={e => setData('points', e.target.value)}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" 
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowViolationModal(false)}
                                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Pelanggaran'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
