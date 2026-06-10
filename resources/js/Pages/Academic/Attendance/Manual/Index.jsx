import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Edit } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { buttonVariants } from '@/Components/ui/button';
import { useState } from 'react';

export default function Index({ activeClasses, academicYear, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('journals.manual.index'), { search }, { preserveState: true });
        }
    };

    return (
        <MainLayout>
            <Head title="Input Absensi Manual" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Input Absensi Manual</h2>
                        <p className="text-muted-foreground">
                            Pilih kelas untuk input absensi manual.
                        </p>
                    </div>
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
                                                {activeClass.effective_teacher_name || activeClass.teacher?.name || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link
                                                    href={route('journals.manual.show', activeClass.id)}
                                                    className={buttonVariants({ variant: "outline", size: "sm" })}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Input
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Tidak ada data kelas ditemukan (atau Anda tidak memiliki akses).
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
