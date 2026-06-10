import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Search, Eye } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { useState } from 'react';

export default function Index({ activeClasses, academicYear, semester }) {
    const [search, setSearch] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('recap.class.index'), { search }, { preserveState: true });
        }
    };

    return (
        <MainLayout>
            <Head title="Rekap Nilai Kelas" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Rekap Nilai Kelas</h2>
                        <p className="text-muted-foreground">
                            Tahun Ajaran {academicYear?.name} - Semester {semester?.name}
                        </p>
                    </div>
                    <Link
                        href={route('recap.ijazah.index')}
                        className={buttonVariants({ variant: "default" })}
                    >
                        Rekap Nilai Ijazah Global
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari kelas..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>Kelas</TableHead>
                                    <TableHead>Wali Kelas</TableHead>
                                    <TableHead className="text-center w-[150px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeClasses.data.length > 0 ? (
                                    activeClasses.data.map((activeClass, index) => (
                                        <TableRow key={activeClass.id}>
                                            <TableCell className="text-center">
                                                {(activeClasses.current_page - 1) * activeClasses.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {activeClass.kelas.name} {activeClass.kelas_paralel?.name}
                                            </TableCell>
                                            <TableCell>
                                                {activeClass.teacher?.name || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Link
                                                        href={route('recap.class.show', activeClass.id)}
                                                        className={buttonVariants({ variant: "outline", size: "sm" })}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Rekap
                                                    </Link>
                                                    <Link
                                                        href={route('recap.ledger.show', activeClass.id)}
                                                        className={buttonVariants({ variant: "default", size: "sm" })}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ledger
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Tidak ada data kelas aktif ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={activeClasses.links} />
                </div>
            </div>
        </MainLayout>
    );
}
