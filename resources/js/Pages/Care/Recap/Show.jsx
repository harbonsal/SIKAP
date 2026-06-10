import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

export default function Show({ activeKamar, recap, categories, filters, academicYear, availableMonths, semester }) {
    const [selectedMonth, setSelectedMonth] = useState(filters.month?.toString() || new Date().getMonth() + 1 + "");
    const [selectedYear, setSelectedYear] = useState(filters.year?.toString() || new Date().getFullYear() + "");

    // Use availableMonths from props, fallback to full list if missing (backwards compatibility)
    const months = availableMonths || [
        { value: "1", label: "Januari" },
        { value: "2", label: "Februari" },
        { value: "3", label: "Maret" },
        { value: "4", label: "April" },
        { value: "5", label: "Mei" },
        { value: "6", label: "Juni" },
        { value: "7", label: "Juli" },
        { value: "8", label: "Agustus" },
        { value: "9", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
    ];

    const handleFilterChange = (key, value) => {
        const newFilters = {
            month: key === 'month' ? value : selectedMonth,
            year: key === 'year' ? value : selectedYear,
            semester: semester // Preserve semester
        };

        if (key === 'month') setSelectedMonth(value);
        if (key === 'year') setSelectedYear(value);

        router.get(route('assessments.character.recap.show', activeKamar.id), newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const getMonthName = (m) => {
        if (m === 'all') return 'Semester Ini (Semua Bulan)';
        return months.find(x => x.value == m)?.label || '-';
    };

    return (
        <MainLayout>
            <Head title={`Rekap Akhlak - ${activeKamar.kamar.name}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between no-print">
                    <div>
                        <Link href={route('assessments.character.recap.index', { semester: semester })} className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Kembali ke Daftar Kamar
                        </Link>
                        <h2 className="text-2xl font-bold tracking-tight">Rekap Nilai Akhlak {semester ? `(Semester ${semester})` : ''}</h2>
                    </div>
                    <div className="flex gap-2">
                        <Select value={selectedMonth} onValueChange={(v) => handleFilterChange('month', v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Bulan (Semester)</SelectItem>
                                {months.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={(v) => handleFilterChange('year', v)}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak
                        </Button>
                    </div>
                </div>

                {/* Report Header Info (visible in print) */}
                <div className="bg-white p-4 rounded-md border text-sm space-y-1">
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">TP</span>
                        <span>: {academicYear?.name || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Sem</span>
                        <span>: {academicYear?.semester || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Bulan</span>
                        <span>: {getMonthName(selectedMonth)}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Kamar</span>
                        <span>: {activeKamar.kamar.name}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2">
                        <span className="font-bold">Musyrif</span>
                        <span>: {activeKamar.musrif?.name || '-'}</span>
                    </div>
                </div>

                <Card>
                    <CardHeader className="no-print">
                        <CardTitle>Daftar Santri & Nilai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px] text-center border font-bold text-black">No</TableHead>
                                        <TableHead className="w-[100px] border font-bold text-black">NIS</TableHead>
                                        <TableHead className="min-w-[200px] border font-bold text-black">Nama Lengkap</TableHead>
                                        {categories.map((cat, idx) => (
                                            <TableHead key={idx} className="text-center border font-bold text-black bg-gray-50">{cat}</TableHead>
                                        ))}
                                        <TableHead className="w-[80px] text-center border font-bold text-black bg-amber-100 table-cell">Jumlah</TableHead>
                                        <TableHead className="w-[80px] text-center border font-bold text-black bg-blue-100 table-cell">Rata-rata</TableHead>
                                        <TableHead className="min-w-[250px] border font-bold text-black">Komentar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recap.length > 0 ? (
                                        recap.map((student, index) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="text-center border">{index + 1}</TableCell>
                                                <TableCell className="border">{student.nis}</TableCell>
                                                <TableCell className="font-medium border">
                                                    <Link
                                                        href={route('assessments.character.recap.student', student.id)}
                                                        className="text-primary hover:underline hover:text-primary/80"
                                                        title="Lihat Detail Perkembangan Santri"
                                                    >
                                                        {student.name}
                                                    </Link>
                                                </TableCell>
                                                {categories.map((cat, idx) => {
                                                    const score = student.scores[cat];
                                                    let colorClass = "";
                                                    if (score !== null) {
                                                        if (score >= 90) colorClass = "text-green-600 font-medium";
                                                        else if (score < 70) colorClass = "text-red-500 font-medium";
                                                    }
                                                    return (
                                                        <TableCell key={idx} className={`text-center border ${colorClass}`}>
                                                            {score !== null ? score : '-'}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center border font-bold bg-amber-50">
                                                    {student.total > 0 ? student.total.toFixed(1) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center border font-bold bg-blue-50">
                                                    {student.average > 0 ? student.average : '-'}
                                                </TableCell>
                                                <TableCell className="border text-xs italic text-muted-foreground whitespace-pre-wrap">
                                                    {student.comment || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={categories.length + 4} className="h-24 text-center border">
                                                Belum ada data penilaian untuk periode ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </MainLayout>
    );
}
