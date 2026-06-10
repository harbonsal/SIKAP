import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function Index({ activeSubjects }) {
    return (
        <MainLayout>
            <Head title="Penilaian Tahfidz" />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Penilaian Tahfidz</h1>
                        <p className="text-sm text-gray-500 mt-1">Pilih kelas/halaqoh untuk input nilai ujian tahfidz.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeSubjects.length > 0 ? (
                        activeSubjects.map((subject) => (
                            <Link key={subject.id} href={route('tahfidz.assessments.show', subject.id)}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {subject.active_class?.kelas?.name} {subject.active_class?.kelas_paralel?.name}
                                        </CardTitle>
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{subject.active_class?.name}</div>
                                        <p className="text-xs text-muted-foreground mt-1 text-wrap break-words">
                                            Penguji: {subject.tahfidz_testers && subject.tahfidz_testers.length > 0
                                                ? subject.tahfidz_testers.map(t => t.user.name).join(', ')
                                                : (subject.teacher?.name || '-')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
                            Belum ada kelas Tahfidz yang diampu.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
