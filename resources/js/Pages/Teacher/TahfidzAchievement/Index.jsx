import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Trophy, ChevronRight } from 'lucide-react';

export default function Index({ activeSubjects }) {
    return (
        <MainLayout>
            <Head title="Perolehan Tahfidz" />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Perolehan Tahfidz</h1>
                        <p className="text-sm text-gray-500 mt-1">Rekap perolehan hafalan santri per halaqoh.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {activeSubjects.length > 0 ? (
                        activeSubjects.map((subject) => (
                            <div key={subject.id} className="relative group">
                                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {subject.active_class?.kelas?.name} {subject.active_class?.kelas_paralel?.name}
                                        </CardTitle>
                                        <Trophy className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{subject.active_class?.name}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Total Santri: {subject.active_class?.class_members?.length || 0}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            {/* Button to input progress */}
                                            <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 w-full" onClick={() => alert('Fitur Input Progress sedang dikembangkan')}>
                                                Input Hafalan
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
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
