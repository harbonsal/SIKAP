import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ClipboardList, CheckCircle } from 'lucide-react';

export default function Index({ supervisions }) {
    return (
        <MainLayout>
            <Head title="Angket Evaluasi Pembelajaran" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Angket Evaluasi</h2>
                    <p className="text-muted-foreground">Daftar angket evaluasi pembelajaran yang perlu antum isi.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {supervisions.length > 0 ? (
                        supervisions.map((supervision) => (
                            <Card key={supervision.id} className={supervision.is_filled ? 'opacity-70 bg-slate-50' : ''}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">{supervision.active_subject?.mapel?.name || 'Mapel'}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {supervision.active_subject?.active_class?.kelas?.name || '-'}
                                            </CardDescription>
                                        </div>
                                        {supervision.is_filled && (
                                            <span className="text-green-600">
                                                <CheckCircle className="h-5 w-5" />
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-1 text-sm text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Ustadz:</span>
                                            <span className="font-medium text-slate-900">{supervision.teacher?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tanggal:</span>
                                            <span>{new Date(supervision.date).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>

                                    {supervision.is_filled ? (
                                        <Button variant="outline" className="w-full" disabled>
                                            Sudah Diisi
                                        </Button>
                                    ) : (
                                        <Link href={route('student.supervisions.show', supervision.id)} className="block">
                                            <Button className="w-full gap-2">
                                                <ClipboardList className="h-4 w-4" />
                                                Isi Angket
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <p>Tidak ada angket yang perlu diisi saat ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
