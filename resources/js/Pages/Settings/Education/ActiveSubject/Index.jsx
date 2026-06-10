import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import EmptyState from '@/Components/EmptyState';

export default function Index({ grades, activeYearId, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || activeYearId || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('active-subjects.index'), {
            search,
            academic_year_id: selectedYear
        }, { preserveState: true });
    };

    const handleYearChange = (e) => {
        const yearId = e.target.value;
        setSelectedYear(yearId);
        router.get(route('active-subjects.index'), {
            search,
            academic_year_id: yearId
        }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Mapel Aktif" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Mapel Aktif</h2>
                        <p className="text-muted-foreground">Kelola distribusi mata pelajaran dan guru pengampu per jenjang kelas.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Cari nama kelas..."
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>Kelas</TableHead>
                                    <TableHead className="text-center">Jumlah Mapel</TableHead>
                                    <TableHead className="text-center w-[150px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.data.length > 0 ? (
                                    grades.data.map((grade, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="text-center font-medium">
                                                {(grades.current_page - 1) * grades.per_page + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-lg">
                                                    {grade.kelas_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                                    {grade.active_subjects_count} Mapel
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {grade.id ? (
                                                    <Link
                                                        href={route('active-subjects.show', grade.id)}
                                                        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                                                    >
                                                        <BookOpen className="mr-2 h-4 w-4" />
                                                        Kelola
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Tidak Aktif</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <EmptyState
                                                title="Belum ada data kelas aktif"
                                                description="Silakan tambahkan kelas aktif terlebih dahulu."
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Pagination links={grades.links} />
            </div>
        </MainLayout>
    );
}
