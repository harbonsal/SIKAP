import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Filter, RefreshCcw, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import Pagination from '@/Components/Pagination';
import { useState } from 'react';

export default function Index({ ijazahSubjects = [], students = { data: [] }, filters = {}, kelasList = [], paralelList = [], academicYear }) {
    const [search, setSearch] = useState(filters.search || '');
    const [kelasId, setKelasId] = useState(filters.kelas_id || '');
    const [paralelId, setParalelId] = useState(filters.paralel_id || '');

    const handleFilter = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        router.get(route('recap.ijazah.index'), {
            search,
            kelas_id: kelasId,
            paralel_id: paralelId
        }, { preserveState: true });
    };

    const handleReset = () => {
        setSearch('');
        setKelasId('');
        setParalelId('');
        router.get(route('recap.ijazah.index'));
    };

    const formatScore = (score) => {
        if (score === null || score === undefined || score === 0) return '-';
        return score;
    };

    return (
        <MainLayout>
            <Head title="Rekap Nilai Ijazah Global" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Rekap Nilai Ijazah Global</h2>
                        <p className="text-muted-foreground">
                            Peringkat Keseluruhan Santri - Tahun Ajaran {academicYear?.name}
                        </p>
                    </div>
                    <Button onClick={() => window.print()} className="print:hidden">
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak
                    </Button>
                </div>

                {/* Filter Card */}
                <Card className="print:hidden bg-muted/30">
                    <CardContent className="p-4">
                        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-1 w-full">
                                <label className="text-sm font-medium">Pencarian Nama</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama santri..."
                                        className="pl-9"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1 w-full sm:w-48">
                                <label className="text-sm font-medium">Kelas</label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={kelasId}
                                    onChange={(e) => setKelasId(e.target.value)}
                                >
                                    <option value="">-- Semua Kelas --</option>
                                    {kelasList.map(k => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1 w-full sm:w-48">
                                <label className="text-sm font-medium">Paralel</label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={paralelId}
                                    onChange={(e) => setParalelId(e.target.value)}
                                >
                                    <option value="">-- Semua Paralel --</option>
                                    {paralelList.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                <Button type="submit" className="w-full sm:w-auto">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Terapkan
                                </Button>
                                <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Table Data */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse w-full text-sm">
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[50px] text-center border-r font-bold">Rank</TableHead>
                                        <TableHead className="w-[100px] border-r">NIS</TableHead>
                                        <TableHead className="min-w-[200px] border-r">Nama Siswa</TableHead>
                                        <TableHead className="min-w-[100px] border-r">Kelas</TableHead>
                                        {ijazahSubjects.map((subject, idx) => (
                                            <TableHead key={idx} className="text-center min-w-[80px] border-r px-2" title={subject.name || subject.mapel_name}>
                                                <div className="font-bold text-xs rotate-0 md:-rotate-45 max-w-[80px] origin-bottom-left truncate md:overflow-visible">
                                                    {subject.name || subject.mapel_name}
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-center w-[80px] border-r font-bold bg-amber-50 text-amber-700">Total</TableHead>
                                        <TableHead className="text-center w-[80px] border-r font-bold bg-amber-50 text-amber-700">Rerata</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.data && students.data.length > 0 ? (
                                        students.data.map((student) => (
                                            <TableRow key={student.student_id} className="hover:bg-muted/30">
                                                <TableCell className="text-center font-bold bg-amber-100/50 border-r text-amber-900">{student.rank}</TableCell>
                                                <TableCell className="border-r text-muted-foreground">{student.nomor_induk}</TableCell>
                                                <TableCell className="border-r font-medium whitespace-nowrap">{student.name}</TableCell>
                                                <TableCell className="border-r text-muted-foreground text-xs whitespace-nowrap">{student.kelas_name}</TableCell>
                                                {ijazahSubjects.map((subject, idx) => {
                                                    const score = student.subjects[idx]?.final_score;
                                                    return (
                                                        <TableCell 
                                                            key={idx} 
                                                            className="text-center border-r px-1 text-xs"
                                                        >
                                                            {formatScore(score)}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center font-bold bg-amber-50 border-r">
                                                    {formatScore(student.total_score)}
                                                </TableCell>
                                                <TableCell className="text-center font-bold bg-amber-50 border-r">
                                                    {/* Ensure average score uses 2 decimal places as requested */}
                                                    {Number(student.average_score).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={ijazahSubjects.length + 6} className="h-24 text-center text-muted-foreground">
                                                Tidak ada data santri ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4 print:hidden">
                    <Pagination links={students.links || []} />
                </div>
            </div>
        </MainLayout>
    );
}
