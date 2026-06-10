import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { BookOpen, Calendar, ArrowRight, Table } from 'lucide-react';

export default function RecapList({ activeSubjects, academicYear, semester }) {
    return (
        <MainLayout>
            <Head title="Rekap Nilai Tahfidz" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Rekap Nilai Tahfidz</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih kelas untuk melihat rekapitulasi nilai perolehan (UH, UTS, UAS)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        <div className="text-sm">
                            <span className="font-medium text-gray-900">{academicYear?.name || '-'}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-gray-500">Semester {semester?.name || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSubjects.length > 0 ? (
                        activeSubjects.map((subject) => (
                            <Link
                                key={subject.id}
                                href={route('tahfidz.recap.show', subject.id)}
                            >
                                <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500 cursor-pointer group">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 text-xs font-semibold bg-purple-50 text-purple-700 rounded-md">
                                                        {subject.active_class.kelas.name}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                                                    {subject.active_class.kelas_paralel?.name || subject.active_class.kelas.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3" />
                                                    {subject.mapel?.name || 'Tahfidz Al-Quran'}
                                                </p>
                                            </div>
                                            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                                <Table className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500">
                                            Lihat Rekap
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                            <BookOpen className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                            <p>Tidak ada kelas Tahfidz yang aktif untuk Anda saat ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
