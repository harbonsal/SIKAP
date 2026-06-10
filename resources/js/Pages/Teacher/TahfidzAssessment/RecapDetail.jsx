import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Download, ChevronLeft, X, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';

export default function RecapDetail({ activeSubject, gradeWeights, students, gradeMatrix, gradeDetails = {}, kkm = 75 }) {

    // State for the mistake-history popup: { studentId, gradeWeightId } or null
    const [popup, setPopup] = useState(null);

    const openPopup = (studentId, gradeWeightId) => {
        const details = gradeDetails?.[studentId]?.[gradeWeightId];
        if (!details || details.length === 0) return; // Nothing to show
        setPopup({ studentId, gradeWeightId });
    };

    const closePopup = () => setPopup(null);

    // Get the details for the currently open popup
    const popupDetails = popup
        ? (gradeDetails?.[popup.studentId]?.[popup.gradeWeightId] ?? [])
        : [];

    const popupStudent = popup ? students.find(s => s.id === popup.studentId) : null;
    const popupGw = popup ? gradeWeights.find(gw => gw.id === popup.gradeWeightId) : null;

    return (
        <MainLayout>
            <Head title={`Rekap Nilai - ${activeSubject.active_class.kelas.name}`} />

            <div className="py-6 max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="outline" asChild>
                                <Link href={route('tahfidz.recap.index')}>
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Kembali ke Daftar Rekap
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mt-2">Rekap Nilai Tahfidz</h1>
                        <p className="text-gray-600 ml-7">
                            Kelas: <span className="font-semibold">{activeSubject.active_class.kelas.name}</span> | Guru: {activeSubject.teacher?.name || '-'} | <span className="text-indigo-600 font-medium">KKM: {kkm}</span>
                        </p>
                        <p className="text-xs text-gray-400 ml-7 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Klik pada nilai untuk melihat histori kesalahan
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Download className="mr-2 h-4 w-4" /> Export / Print
                        </Button>
                    </div>
                </div>

                {/* Table Card */}
                <Card className="shadow-sm border overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center font-bold text-gray-700 border border-gray-200">No</TableHead>
                                        <TableHead className="w-[100px] font-bold text-center text-gray-700 border border-gray-200">NIS</TableHead>
                                        <TableHead className="min-w-[200px] font-bold text-gray-700 border border-gray-200">Nama Santri</TableHead>
                                        {/* Dynamic Columns for Grade Weights */}
                                        {gradeWeights.map(gw => (
                                            <TableHead key={gw.id} className="text-center font-bold text-indigo-700 min-w-[80px] border border-gray-200">
                                                {gw.name}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center font-bold text-gray-900 bg-gray-100 border border-gray-200">Rata-rata</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, index) => {
                                        let totalStore = 0;

                                        return (
                                            <TableRow key={student.id} className="hover:bg-gray-50/50">
                                                <TableCell className="text-center font-medium text-gray-500 border border-gray-200">{index + 1}</TableCell>
                                                <TableCell className="text-center text-gray-500 border border-gray-200">{student.nomor_induk || student.nisn || '-'}</TableCell>
                                                <TableCell className="font-medium text-gray-900 border border-gray-200">{student.name}</TableCell>

                                                {/* Grades */}
                                                {gradeWeights.map(gw => {
                                                    const score = gradeMatrix[student.id]?.[gw.id] ?? null;
                                                    const hasDetails = gradeDetails?.[student.id]?.[gw.id]?.length > 0;

                                                    // Accumulate for average (Weighted)
                                                    if (score !== null) {
                                                        const weight = gw.weight ? parseFloat(gw.weight) : 0;
                                                        totalStore += parseFloat(score) * (weight / 100);
                                                    }

                                                    return (
                                                        <TableCell key={gw.id} className="text-center border border-gray-200 p-1">
                                                            {score !== null ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openPopup(student.id, gw.id)}
                                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-semibold text-sm transition-colors ${parseFloat(score) < kkm
                                                                            ? 'text-red-600 hover:bg-red-50'
                                                                            : 'text-green-600 hover:bg-green-50'
                                                                        } ${hasDetails ? 'cursor-pointer underline decoration-dotted' : 'cursor-default'}`}
                                                                    title={hasDetails ? 'Klik untuk melihat histori kesalahan' : ''}
                                                                >
                                                                    {parseFloat(parseFloat(score).toFixed(1))}
                                                                    {hasDetails && (
                                                                        <BookOpen className="h-3 w-3 opacity-60" />
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}

                                                {/* Average (Accumulated Weighted Score) */}
                                                <TableCell className="text-center font-bold bg-gray-50 border border-gray-200">
                                                    {totalStore > 0 ? parseFloat(totalStore.toFixed(1)) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Popup Modal: Mistake History */}
            {popup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={closePopup}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-4 border-b">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                    Histori Kesalahan – {popupGw?.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {popupStudent?.name}
                                </p>
                            </div>
                            <button
                                onClick={closePopup}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {popupDetails.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 italic">Tidak ada detail soal.</p>
                            ) : (
                                <table className="min-w-full text-sm divide-y divide-gray-200 rounded-md border border-gray-200 overflow-hidden">
                                    <thead className="bg-indigo-50 text-gray-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold w-10">No</th>
                                            <th className="px-3 py-2 text-left font-semibold">Surat &amp; Ayat</th>
                                            <th className="px-3 py-2 text-center font-semibold w-20">Salah</th>
                                            <th className="px-3 py-2 text-right font-semibold w-20">Nilai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {popupDetails.map((detail) => {
                                            const qScore = Math.max(0, 10 - detail.mistakes) * 10;
                                            return (
                                                <tr key={detail.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-center text-gray-500">{detail.question_number}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium text-gray-900">{detail.surah_name || '-'}</div>
                                                        {detail.verse_start && (
                                                            <div className="text-xs text-gray-500">Ayat: {detail.verse_start}</div>
                                                        )}
                                                        {detail.notes && (
                                                            <div className="text-xs text-red-500 mt-0.5 italic">Note: {detail.notes}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${detail.mistakes === 0
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {detail.mistakes}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono text-gray-700">{qScore}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t flex justify-end">
                            <Button variant="outline" size="sm" onClick={closePopup}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
