import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Show({ monitoring }) {
    const [expandedMusyrif, setExpandedMusyrif] = useState(null);

    // Group member attendances by musyrif_id for easy display
    const santriAttByMusyrif = {};
    if (monitoring.memberAttendances) {
        monitoring.memberAttendances.forEach(ma => {
            if (ma.musyrif_id) {
                if (!santriAttByMusyrif[ma.musyrif_id]) {
                    santriAttByMusyrif[ma.musyrif_id] = [];
                }
                santriAttByMusyrif[ma.musyrif_id].push(ma);
            }
        });
    }

    return (
        <MainLayout>
            <Head title="Detail Pantauan Halaqoh" />

            <div className="py-6 max-w-5xl mx-auto px-4">
                <div className="mb-4">
                    <Link href={route('tahfidz.monitoring.index')} className="text-indigo-600 hover:text-indigo-800 flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Riwayat
                    </Link>
                </div>

                <div className="bg-white overflow-hidden shadow-lg sm:rounded-lg mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Detail Laporan - {new Date(monitoring.recorded_at).toLocaleString('id-ID')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Petugas</p>
                                <p className="font-semibold text-lg">{monitoring.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Sesi</p>
                                <p className="font-semibold text-lg">{monitoring.session?.name || '-'}</p>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <p className="text-gray-500">Keterangan Umum</p>
                                <p className="bg-gray-50 p-3 rounded text-gray-800 italic">{monitoring.general_note || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Violations */}
                {monitoring.violations && monitoring.violations.length > 0 && (
                    <div className="bg-red-50 overflow-hidden shadow-sm sm:rounded-lg mb-6 border border-red-200">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Pelanggaran Tercatat
                            </h3>
                            <ul className="space-y-3">
                                {monitoring.violations.map((vio) => (
                                    <li key={vio.id} className="bg-white p-3 rounded shadow-sm border border-red-100">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-red-700">{vio.musyrif?.student ? vio.musyrif.student.name : (vio.musyrif?.user ? vio.musyrif.user.name + ' (Ustadz)' : '-')}</span>
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">{vio.violation_type}</span>
                                        </div>
                                        {vio.note && <p className="text-gray-600 text-sm mt-1">"{vio.note}"</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Attendance */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-green-600" />
                            Kehadiran Musyrif & Santri
                        </h3>
                        <div className="space-y-3">
                            {monitoring.attendances && monitoring.attendances.map((att, index) => {
                                const mId = att.musyrif_id;
                                const isExpanded = expandedMusyrif === mId;
                                const hasSantri = santriAttByMusyrif[mId] && santriAttByMusyrif[mId].length > 0;

                                return (
                                    <div key={att.id} className="border rounded-lg overflow-hidden">
                                        {/* Header Accordion */}
                                        <div 
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${att.status === 'Hadir' ? (isExpanded ? 'bg-green-100 border-b border-green-200' : 'bg-green-50 hover:bg-green-100') : 'bg-red-50 hover:bg-red-100 border-red-200'}`}
                                            onClick={() => setExpandedMusyrif(isExpanded ? null : mId)}
                                        >
                                            <div className="flex items-center">
                                                {att.status === 'Hadir' ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                                )}
                                                <div>
                                                    <p className="font-semibold text-sm">
                                                        {index + 1}. {att.musyrif?.student ? att.musyrif.student.name : (att.musyrif?.user ? att.musyrif.user.name + ' (Ustadz)' : '-')}
                                                    </p>
                                                    <p className={`text-xs ${att.status === 'Hadir' ? 'text-green-700' : 'text-red-700'}`}>{att.status}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-400">
                                                {hasSantri && (
                                                    <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border">
                                                        {santriAttByMusyrif[mId].length} Santri
                                                    </span>
                                                )}
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        {/* Santri Table */}
                                        {isExpanded && (
                                            <div className="p-4 bg-gray-50">
                                                {hasSantri ? (
                                                    <div className="overflow-x-auto border rounded-lg bg-white">
                                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                            <thead className="bg-gray-100">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-600 w-12">No</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">NIS</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Nama Santri</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Kehadiran</th>
                                                                    <th className="px-4 py-2 text-left font-medium text-gray-600">Catatan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                                {santriAttByMusyrif[mId].map((sAtt, i) => (
                                                                    <tr key={sAtt.id}>
                                                                        <td className="px-4 py-2 text-gray-500 text-center">{i + 1}</td>
                                                                        <td className="px-4 py-2 text-gray-500">{sAtt.student?.user?.nomor_induk || '-'}</td>
                                                                        <td className="px-4 py-2 font-medium text-gray-900">{sAtt.student?.name}</td>
                                                                        <td className="px-4 py-2">
                                                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                                ${sAtt.status === 'Hadir' ? 'bg-green-100 text-green-800' : 
                                                                                  sAtt.status === 'Sakit' ? 'bg-yellow-100 text-yellow-800' :
                                                                                  sAtt.status === 'Izin' ? 'bg-blue-100 text-blue-800' :
                                                                                  'bg-red-100 text-red-800'}`}>
                                                                                {sAtt.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 italic text-xs">
                                                                            {sAtt.note || '-'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-500 py-4">
                                                        Tidak ada data kehadiran santri untuk halaqoh ini.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
