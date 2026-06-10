import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { BookOpen, FileText } from 'lucide-react';

export default function Show({ activeSubject, gradeWeights }) {
    return (
        <MainLayout>
            <Head title={`Penilaian ${activeSubject?.active_class?.kelas?.name ?? 'Kelas ?'}`} />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeSubject?.active_class?.kelas?.name || 'Kelas ?'} {activeSubject?.active_class?.kelas_paralel?.name || ''}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Pilih jenis ujian untuk mulai menilai.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gradeWeights.length > 0 ? (
                        gradeWeights.map((weight) => (
                            <Link
                                key={weight.id}
                                href={route('tahfidz.assessments.students', {
                                    active_subject: activeSubject.id,
                                    grade_weight: weight.id
                                })}
                            >
                                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-bold text-indigo-700">
                                            {weight.name}
                                        </CardTitle>
                                        <FileText className="h-4 w-4 text-gray-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-gray-900">{weight.weight}%</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Bobot penilaian
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                            Belum ada jenis ujian Tahfidz yang diatur. Silakan aturan Bobot Nilai kategori 'tahfidz'.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
