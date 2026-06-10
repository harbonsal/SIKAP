import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

export default function StudentDetail({ student, monthlyData, categories, academicYear, year }) {

    const months = [
        { value: 1, label: "Januari" },
        { value: 2, label: "Februari" },
        { value: 3, label: "Maret" },
        { value: 4, label: "April" },
        { value: 5, label: "Mei" },
        { value: 6, label: "Juni" },
        { value: 7, label: "Juli" },
        { value: 8, label: "Agustus" },
        { value: 9, label: "September" },
        { value: 10, label: "Oktober" },
        { value: 11, label: "November" },
        { value: 12, label: "Desember" },
    ];

    const getMonthName = (m) => months.find(x => x.value === m)?.label || '-';

    return (
        <MainLayout>
            <Head title={`Detail Nilai Akhlak - ${student.user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between no-print">
                    <div>
                        <Link
                            href={student.active_kamar ? route('assessments.character.recap.show', student.active_kamar.id) : route('assessments.character.recap.index')}
                            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Kembali ke Rekap Kamar
                        </Link>
                        <h2 className="text-2xl font-bold tracking-tight">Detail Nilai Akhlak Santri</h2>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Laporan
                    </Button>
                </div>

                {/* Student Info */}
                <Card className="no-print">
                    <CardHeader>
                        <CardTitle>Identitas Santri</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Nama Lengkap</div>
                            <div className="font-medium">{student.user.name}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">NIS</div>
                            <div className="font-medium">{student.user.nomor_induk}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Kamar</div>
                            <div className="font-medium">{student.active_kamar?.kamar?.name || '-'}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Kelas</div>
                            <div className="font-medium">{student.active_class?.class?.name || '-'}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Header for Print */}
                <div className="hidden print:block bg-white p-4 rounded-md border text-sm space-y-1 mb-4">
                    <h3 className="font-bold text-center text-lg uppercase mb-4">Laporan Perkembangan Karakter Santri</h3>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Nama</span>
                        <span>: {student.user.name}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">NIS</span>
                        <span>: {student.user.nomor_induk}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Tahun</span>
                        <span>: {year} (TP: {academicYear?.name})</span>
                    </div>
                </div>

                <Card>
                    <CardHeader className="no-print">
                        <CardTitle>Riwayat Penilaian (Bulanan)</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Menampilkan data penilaian yang telah masuk pada tahun {year}.
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px] font-bold text-black border">Bulan</TableHead>
                                    {categories.map((cat) => (
                                        <TableHead key={cat} className="text-center font-bold text-black border bg-gray-50">{cat}</TableHead>
                                    ))}
                                    <TableHead className="min-w-[200px] font-bold text-black border">Catatan Musrif</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.keys(monthlyData).length > 0 ? (
                                    Object.keys(monthlyData).map((m) => {
                                        const data = monthlyData[m];
                                        return (
                                            <TableRow key={m}>
                                                <TableCell className="font-medium border">{getMonthName(parseInt(m))}</TableCell>
                                                {categories.map((cat) => {
                                                    const score = data.scores[cat];
                                                    let colorClass = "";
                                                    if (score !== null) {
                                                        if (score >= 90) colorClass = "text-green-600 font-bold";
                                                        else if (score < 75) colorClass = "text-red-500 font-bold";
                                                    }
                                                    return (
                                                        <TableCell key={cat} className={`text-center border ${colorClass}`}>
                                                            {score !== null ? score : '-'}
                                                        </TableCell>
                                                    )
                                                })}
                                                <TableCell className="border text-xs italic text-muted-foreground whitespace-pre-wrap">
                                                    {data.comment || '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={categories.length + 2} className="h-24 text-center text-muted-foreground border">
                                            Belum ada data penilaian di tahun {year}.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>



            </div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </MainLayout >
    );
}
