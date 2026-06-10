
import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';

export default function History({ activeSubject, student, grades, semester, academicYear }) {
    // State to track expanded assessment items
    const [expandedGrades, setExpandedGrades] = useState({});

    const toggleExpand = (gradeId) => {
        setExpandedGrades(prev => ({
            ...prev,
            [gradeId]: !prev[gradeId]
        }));
    };

    return (
        <MainLayout>
            <Head title={`Histori Tahfidz - ${student.user.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">

                        {/* Header */}
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center gap-4 mb-4">
                                <Link
                                    href={route('tahfidz.assessments.show', {
                                        active_subject: activeSubject.id
                                    })}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                >
                                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                                </Link>
                                <div>
                                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                        Histori Penilaian Tahfidz
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {student.user.name} - {activeSubject.active_class.kelas.name} {activeSubject.active_class.kelas_paralel.name}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-blue-50 p-3 rounded-md">
                                    <span className="block text-gray-500 text-xs">Tahun Ajaran</span>
                                    <span className="font-semibold">{academicYear.name}</span>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-md">
                                    <span className="block text-gray-500 text-xs">Semester</span>
                                    <span className="font-semibold">{semester.name}</span>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-md">
                                    <span className="block text-gray-500 text-xs">Mata Pelajaran</span>
                                    <span className="font-semibold">{activeSubject.mapel?.name || 'Tahfidz'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline / List of Assessments */}
                        <div className="p-6 bg-gray-50 min-h-screen">
                            {grades.length === 0 ? (
                                <div className="text-center p-10 text-gray-500 bg-white rounded-lg shadow-sm">
                                    Belum ada data penilaian untuk semester ini.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {grades.map((grade) => (
                                        <div key={grade.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                            {/* Card Header (Clickable) */}
                                            <div
                                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleExpand(grade.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {expandedGrades[grade.id] ?
                                                        <ChevronDown className="w-5 h-5 text-indigo-500" /> :
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    }
                                                    <div>
                                                        <h3 className="font-bold text-lg text-indigo-700">
                                                            {grade.grade_weight?.name || 'Penilaian'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            Selesai dinilai pada: {new Date(grade.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-2xl font-bold text-gray-800">{grade.score}</span>
                                                    <span className="text-xs text-gray-500 uppercase">Nilai Akhir</span>
                                                </div>
                                            </div>

                                            {/* Card Details (Expanded) */}
                                            {expandedGrades[grade.id] && (
                                                <div className="border-t border-gray-100 p-4 bg-gray-50">

                                                    {/* Reading Quality Section */}
                                                    {grade.reading_quality && (
                                                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`p-2 rounded-full ${grade.reading_quality === 'bagus' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {grade.reading_quality === 'bagus' ?
                                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                                        :
                                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900">Keterangan Bacaan: <span className="capitalize">{grade.reading_quality}</span></h4>

                                                                    {grade.reading_quality === 'kurang' && grade.reading_deficiencies && grade.reading_deficiencies.length > 0 ? (
                                                                        <div className="mt-2">
                                                                            <p className="text-sm font-semibold text-gray-700 mb-1">Catatan Kekurangan:</p>
                                                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                                                                {grade.reading_deficiencies.map((def, idx) => (
                                                                                    <li key={idx}>{def}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : (grade.reading_quality === 'kurang' && (
                                                                        <p className="text-sm text-gray-500 italic mt-1">Tidak ada catatan spesifik.</p>
                                                                    ))}

                                                                    {grade.reading_quality === 'bagus' && (
                                                                        <p className="text-sm text-green-600 mt-1">Alhamdulillah, bacaan sudah lancar dan baik.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Detail Kesalahan per Soal</h4>

                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full text-sm divide-y divide-gray-200 bg-white rounded-md border border-gray-200">
                                                            <thead className="bg-gray-100 text-gray-700">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left font-medium w-16">No</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Surat & Ayat</th>
                                                                    <th className="px-4 py-2 text-center font-medium w-24">Salah</th>
                                                                    <th className="px-4 py-2 text-right font-medium w-24">Nilai</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {grade.tahfidz_details && grade.tahfidz_details.length > 0 ? (
                                                                    grade.tahfidz_details.map((detail, idx) => {
                                                                        // Calculate score per question: (10 - mistakes) * 10
                                                                        const qScore = Math.max(0, 10 - detail.mistakes) * 10;
                                                                        return (
                                                                            <tr key={detail.id}>
                                                                                <td className="px-4 py-2 text-center text-gray-500">{detail.question_number}</td>
                                                                                <td className="px-4 py-2">
                                                                                    <div className="font-medium text-gray-900">{detail.surah_name || '-'}</div>
                                                                                    {detail.verse_start && (
                                                                                        <div className="text-xs text-gray-500">Ayat: {detail.verse_start}</div>
                                                                                    )}
                                                                                    {detail.notes && (
                                                                                        <div className="text-xs text-red-500 mt-1 italic">Note: {detail.notes}</div>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-center">
                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${detail.mistakes === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                                        {detail.mistakes}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right font-mono text-gray-700">
                                                                                    {qScore}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="4" className="px-4 py-3 text-center text-gray-500 italic">
                                                                            Tidak ada detail soal.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
