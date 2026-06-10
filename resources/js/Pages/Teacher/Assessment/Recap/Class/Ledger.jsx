import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, FileSpreadsheet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import React, { useRef } from 'react';

export default function Ledger({ activeClass, activeSubjects, gradeWeights, studentRecaps, academicYear, semester, kkms }) {

    const tableRef = useRef(null);

    const handlePrint = () => {
        window.print();
    };

    const formatScore = (score) => {
        if (score === null || score === undefined || score === '-') return '-';
        const num = Number(score);
        if (isNaN(num)) return score;
        if (num === 0) return '0';
        return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    };

    const isBelowKkm = (score, mapelId) => {
        if (score === null || score === undefined || score === '-' || score === 0 || score === '0') return false;
        const num = Number(score);
        if (isNaN(num)) return false;

        const kkmValue = kkms && kkms[mapelId] ? Number(kkms[mapelId].kkm) : 70; // Default 70 if not set
        return num < kkmValue;
    };

    return (
        <MainLayout>
            <Head title={`Ledger Kelas ${activeClass.kelas.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('recap.class.index')}
                            className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                Ledger Kelas {activeClass.kelas.name} {activeClass.kelas_paralel?.name || ''}
                            </h2>
                            <p className="text-muted-foreground">
                                Tahun Ajaran {academicYear?.name} - Semester {semester?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak
                        </Button>
                        <Button variant="default" disabled title="Export Excel (Coming Soon)">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="print:hidden">
                    <Tabs defaultValue="ledger" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="rekap" asChild>
                                <Link href={route('recap.class.show', activeClass.id)}>
                                    Rekap Nilai
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger value="ledger">
                                Ledger
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200 text-sm hidden print:hidden md:block">
                    <p className="font-semibold mb-1">ℹ️ Informasi Perhitungan Ledger Nilai Kelas</p>
                    <p>
                        Setiap kolom <strong>NA</strong> (Nilai Akhir) didapat dari perkalian persentase bobot tiap kategori ujian (UH, UTS, UAS).<br/>
                        <strong>Jumlah:</strong> Hasil penjumlahan seluruh NA yang dimiliki siswa pada mapel yang ada.<br/>
                        <strong>Rerata:</strong> Jumlah skor dibagi dengan total keseluruhan mapel wajib pada kelas ini tanpa mengecualikan mapel kosong.<br/>
                        {semester?.name === 'Genap' && <span><strong>*Semester Genap:</strong> Rerata akhir menggabungkan nilai Sem Ganjil menggunakan rumus: (Ganjil + (2 &times; Genap)) / 3.</span>}
                    </p>
                </div>

                <Card className="print:shadow-none print:border-none">
                    <CardHeader className="hidden print:block text-center pb-8 border-b border-black">
                        <CardTitle className="text-2xl font-bold uppercase">
                            LEDGER NILAI AKADEMIK
                        </CardTitle>
                        <CardDescription className="text-black text-lg mt-2">
                            KELAS: {activeClass.kelas.name} {activeClass.kelas_paralel?.name || ''} <br />
                            SEMESTER: {semester?.name} TAHUN AJARAN: {academicYear?.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto print:overflow-visible">
                        <div className="w-full inline-block min-w-max p-4 print:p-0">
                            <Table className="border-collapse border border-gray-300 w-full" ref={tableRef}>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead rowSpan={2} className="border border-gray-300 text-center w-[50px] font-bold text-foreground print:text-black print:border-black">No</TableHead>
                                        <TableHead rowSpan={2} className="border border-gray-300 min-w-[200px] font-bold text-foreground print:text-black print:border-black">Nama & NIS</TableHead>

                                        {activeSubjects.map((subject) => (
                                            <TableHead key={subject.id} colSpan={gradeWeights.filter(w => w.name !== 'Validasi').length + 1} className="border border-gray-300 text-center font-bold text-foreground whitespace-nowrap px-4 py-2 print:text-black print:border-black">
                                                {subject.mapel?.name || 'Mapel'}
                                            </TableHead>
                                        ))}

                                        <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 print:text-black print:border-black">Jumlah</TableHead>
                                        <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 print:text-black print:border-black">Rerata</TableHead>
                                        <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 print:text-black print:border-black">Peringkat</TableHead>
                                    </TableRow>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        {activeSubjects.map((subject) => (
                                            <React.Fragment key={subject.id}>
                                                {gradeWeights.filter(w => w.name !== 'Validasi').map((weight) => (
                                                    <TableHead key={weight.id} className="border border-gray-300 text-center text-xs px-2 py-1 print:text-black print:border-black">
                                                        {weight.name}
                                                    </TableHead>
                                                ))}
                                                <TableHead className="border border-gray-300 text-center font-bold bg-muted/50 text-xs px-2 py-1 print:text-black print:border-black print:bg-gray-100">
                                                    NA
                                                </TableHead>
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentRecaps.length > 0 ? (
                                        studentRecaps.map((recap, index) => (
                                            <TableRow key={recap.student_id} className="hover:bg-muted/10 print:break-inside-avoid">
                                                <TableCell className="border border-gray-300 text-center py-2 print:border-black print:py-1">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="border border-gray-300 font-medium py-2 print:border-black print:py-1">
                                                    <div className="flex flex-col">
                                                        <span>{recap.name}</span>
                                                        <span className="text-xs text-muted-foreground print:text-gray-600">{recap.nomor_induk}</span>
                                                    </div>
                                                </TableCell>

                                                {activeSubjects.map((subject) => {
                                                    const subjectData = recap.subjects[subject.id];
                                                    const mapelId = subject.mapel_id;

                                                    return (
                                                        <React.Fragment key={subject.id}>
                                                            {gradeWeights.filter(w => w.name !== 'Validasi').map((weight) => {
                                                                const s = subjectData ? subjectData.weights[weight.id] : '-';
                                                                const isRed = s !== '-' && isBelowKkm(s, mapelId);
                                                                return (
                                                                    <TableCell
                                                                        key={weight.id}
                                                                        className={`border border-gray-300 text-center py-2 print:border-black print:py-1 ${isRed ? 'text-red-600 font-bold' : ''}`}
                                                                        style={isRed ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                                    >
                                                                        {formatScore(s)}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell
                                                                className={`border border-gray-300 text-center font-semibold bg-muted/10 py-2 print:border-black print:bg-gray-50 print:py-1 ${subjectData && isBelowKkm(subjectData.final_score, mapelId) ? 'text-red-600 font-bold' : ''}`}
                                                                style={subjectData && isBelowKkm(subjectData.final_score, mapelId) ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                            >
                                                                {subjectData ? formatScore(subjectData.final_score) : '-'}
                                                            </TableCell>
                                                        </React.Fragment>
                                                    );
                                                })}

                                                <TableCell className="border border-gray-300 text-center font-bold py-2 print:border-black print:py-1">
                                                    {formatScore(recap.total_score)}
                                                </TableCell>
                                                <TableCell className="border border-gray-300 text-center font-bold py-2 print:border-black print:py-1">
                                                    {formatScore(recap.average_score)}
                                                </TableCell>
                                                <TableCell className="border border-gray-300 text-center font-bold py-2 text-primary print:border-black print:py-1">
                                                    {recap.rank}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={activeSubjects.length * (gradeWeights.filter(w => w.name !== 'Validasi').length + 1) + 5} className="h-24 text-center text-muted-foreground border border-gray-300 print:border-black">
                                                Belum ada data nilai atau santri di kelas ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 1cm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    nav, aside, header, footer {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>
        </MainLayout>
    );
}
