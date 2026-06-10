import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Printer, ArrowLeft } from 'lucide-react';

export default function Show({ auth, rpp }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail RPP</h2>}
        >
            <Head title={`RPP - ${rpp.topic}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                        <Button variant="outline" asChild>
                            <Link href={route('supervision-rpps.index')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Link>
                        </Button>
                        <div className="flex gap-2">
                            {/* Open Print in new tab */}
                            <a
                                href={route('supervision-rpps.print', rpp.id)}
                                target="_blank"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak PDF
                            </a>
                        </div>
                    </div>

                    {/* 1. IDENTITAS */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>Identitas Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Mata Pelajaran</Label>
                                <div className="p-2 bg-gray-50 rounded border">{rpp.active_subject?.mapel?.name || '-'}</div>
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas / Jenjang</Label>
                                <div className="p-2 bg-gray-50 rounded border">{rpp.active_subject?.active_class?.kelas?.name || '-'}</div>
                            </div>
                            <div className="space-y-2">
                                <Label>Semester / TP</Label>
                                <div className="p-2 bg-gray-50 rounded border">{rpp.semester?.name} / {rpp.academic_year?.name}</div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label>Materi Pokok</Label>
                                <div className="p-2 bg-gray-50 rounded border font-medium">{rpp.topic}</div>
                            </div>

                            <div className="space-y-2">
                                <Label>Standar Kompetensi</Label>
                                <div className="p-2 bg-gray-50 rounded border whitespace-pre-line text-sm">{rpp.sk}</div>
                            </div>
                            <div className="space-y-2">
                                <Label>Kompetensi Dasar</Label>
                                <div className="p-2 bg-gray-50 rounded border whitespace-pre-line text-sm">{rpp.kd}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. TUJUAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>Tujuan Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="p-4 bg-white rounded border whitespace-pre-line">{rpp.objectives}</div>
                        </CardContent>
                    </Card>

                    {/* 3. METODE & MEDIA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-gray-50 border-b border-gray-100">
                                <CardTitle>Metode Pembelajaran</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ul className="list-disc list-inside space-y-1">
                                    {rpp.methods?.map((m, i) => <li key={i}>{m}</li>) || <li className="text-muted-foreground">Tidak ada metode dipilih</li>}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-gray-50 border-b border-gray-100">
                                <CardTitle>Media & Alat</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ul className="list-disc list-inside space-y-1">
                                    {rpp.media?.map((m, i) => <li key={i}>{m}</li>) || <li className="text-muted-foreground">Tidak ada media dipilih</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 5. LANGKAH PEMBELAJARAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>Langkah Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-base">A. Pendahuluan</Label>
                                <div className="p-4 bg-white rounded border whitespace-pre-line">{rpp.activities?.pendahuluan}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-base">B. Kegiatan Inti</Label>
                                <div className="p-4 bg-white rounded border whitespace-pre-line">{rpp.activities?.inti}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-base">C. Penutup</Label>
                                <div className="p-4 bg-white rounded border whitespace-pre-line">{rpp.activities?.penutup}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. PENILAIAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>Penilaian / Asesmen</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ul className="list-disc list-inside space-y-1">
                                {rpp.assessments?.map((a, i) => <li key={i}>{a}</li>) || <li className="text-muted-foreground">Tidak ada penilaian dipilih</li>}
                            </ul>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
