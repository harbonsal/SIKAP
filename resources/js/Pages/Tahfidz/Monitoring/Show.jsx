import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Show({ monitoring }) {
    return (
        <MainLayout>
            <Head title="Detail Pantauan Halaqoh" />

            <div className="py-6 max-w-4xl mx-auto px-4">
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
                                    <li key={vio.id} className="bg-white p-3 rounded shadow-sm">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-red-700">{vio.musyrif?.student?.name}</span>
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
                            <User className="w-5 h-5 mr-2" />
                            Kehadiran Musyrif
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {monitoring.attendances && monitoring.attendances.map((att) => (
                                <div key={att.id} className={`flex items-center p-3 rounded border ${att.status === 'Hadir' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    {att.status === 'Hadir' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-sm">{att.musyrif?.student?.name}</p>
                                        <p className={`text-xs ${att.status === 'Hadir' ? 'text-green-700' : 'text-red-700'}`}>{att.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
