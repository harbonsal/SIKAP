import React, { useRef } from 'react';
import { Head } from '@inertiajs/react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/Components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';

export default function Print({ student, stats, recentSetoran, schoolName, printDate }) {
    const componentRef = useRef(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Rapor_Tahfidz_${student.name.replace(/\s+/g, '_')}`,
        pageStyle: `
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                }
                @page {
                    size: A4;
                    margin: 15mm;
                }
            }
        `
    });

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <Head title={`Rapor Tahfidz - ${student.name}`} />
            
            {/* Header Actions */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
                <Button 
                    variant="outline" 
                    onClick={() => window.history.back()}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Printer className="w-4 h-4 mr-2" /> Cetak Dokumen
                </Button>
            </div>

            {/* Print Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden" ref={componentRef}>
                <div className="p-10 text-slate-800">
                    
                    {/* Report Header */}
                    <div className="text-center border-b-4 border-indigo-900 pb-6 mb-8">
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-indigo-900">Rapor Pencapaian Tahfidz</h1>
                        <h2 className="text-xl font-semibold mt-2">{schoolName}</h2>
                        <p className="text-sm text-slate-500 mt-1">Laporan Perkembangan Hafalan Al-Qur'an Santri</p>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm bg-slate-50 p-6 rounded-lg border border-slate-100">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-600">Nama Lengkap</span>
                            <span className="font-bold">{student.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-600">NIS</span>
                            <span className="font-bold">{student.nis}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-600">Kelas</span>
                            <span className="font-bold">{student.class_name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-600">Musyrif Halaqoh</span>
                            <span className="font-bold">{student.musyrif_name}</span>
                        </div>
                    </div>

                    {/* Achievement Summary */}
                    <div className="mb-10">
                        <h3 className="text-lg font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3 mb-4">Ringkasan Pencapaian</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Total Hafalan</p>
                                <p className="text-2xl font-bold text-indigo-900">{stats.total_juz} <span className="text-sm font-medium">Juz</span></p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-lg text-center border border-emerald-100">
                                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Halaman</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats.total_pages} <span className="text-sm font-medium">Hal</span></p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">Kecepatan</p>
                                <p className="text-2xl font-bold text-orange-900">{stats.avg_speed} <span className="text-sm font-medium">Hal/Bln</span></p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Prediksi Khatam</p>
                                <p className="text-lg font-bold text-blue-900 flex items-center justify-center h-8">{stats.predicted_date}</p>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm border border-slate-200">
                            <p><span className="font-semibold">Juz yang telah selesai & divalidasi:</span> {stats.completed_juz_list}</p>
                        </div>
                    </div>

                    {/* Recent Details Table */}
                    <div className="mb-12">
                        <h3 className="text-lg font-bold text-indigo-900 border-l-4 border-indigo-500 pl-3 mb-4">Riwayat Setoran Terakhir</h3>
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700">
                                    <th className="py-3 px-4 border border-slate-200 font-semibold w-32">Tanggal</th>
                                    <th className="py-3 px-4 border border-slate-200 font-semibold text-center w-16">Juz</th>
                                    <th className="py-3 px-4 border border-slate-200 font-semibold text-center w-24">Halaman</th>
                                    <th className="py-3 px-4 border border-slate-200 font-semibold">Surat / Ayat</th>
                                    <th className="py-3 px-4 border border-slate-200 font-semibold text-center w-24">Status</th>
                                    <th className="py-3 px-4 border border-slate-200 font-semibold text-center w-24">Kesalahan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSetoran.length > 0 ? (
                                    recentSetoran.map((item, idx) => (
                                        <tr key={idx} className="even:bg-slate-50 text-slate-700">
                                            <td className="py-2 px-4 border border-slate-200">{item.date}</td>
                                            <td className="py-2 px-4 border border-slate-200 text-center">{item.juz}</td>
                                            <td className="py-2 px-4 border border-slate-200 text-center font-medium">{item.page_number}</td>
                                            <td className="py-2 px-4 border border-slate-200 truncate max-w-[200px]">{item.surah}</td>
                                            <td className="py-2 px-4 border border-slate-200 text-center">
                                                {item.status === 'full' ? 'Lulus' : 'Belum Lulus'}
                                            </td>
                                            <td className="py-2 px-4 border border-slate-200 text-center text-red-600 font-semibold">
                                                {item.mistakes > 0 ? item.mistakes : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-6 px-4 border border-slate-200 text-center text-slate-500 italic">
                                            Belum ada riwayat setoran hafalan yang tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end mt-20 pt-8 border-t-2 border-slate-200">
                        <div className="text-center w-48">
                            <p className="mb-16 text-sm text-slate-600">Mengetahui,<br/>Orang Tua / Wali</p>
                            <div className="border-b border-slate-400"></div>
                        </div>
                        <div className="text-center w-48">
                            <p className="mb-16 text-sm text-slate-600">Dicetak pada {printDate}<br/>Musyrif Halaqoh</p>
                            <p className="font-semibold text-slate-800">{student.musyrif_name}</p>
                            <div className="border-b border-slate-400 mt-1"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
