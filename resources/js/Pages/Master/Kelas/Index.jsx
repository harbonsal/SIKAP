import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Home } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';

export default function Index({ kelas }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
            destroy(route('kelas.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Data Kelas" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Data Kelas</h2>
                        <p className="text-muted-foreground">Kelola daftar kelas dan jenjang pendidikan.</p>
                    </div>
                    <Link
                        href={route('kelas.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kelas
                    </Link>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>Nama Kelas</TableHead>
                                    <TableHead>Jenjang</TableHead>
                                    <TableHead className="text-center w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kelas.data.length > 0 ? (
                                    kelas.data.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="text-center font-medium">
                                                {(kelas.current_page - 1) * kelas.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {item.name}
                                            </TableCell>
                                            <TableCell>
                                                {item.jenjang ? (
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                        {item.jenjang.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={route('kelas.edit', item.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center py-6">
                                                <div className="rounded-full bg-muted/30 p-4 mb-3">
                                                    <Home className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="font-medium">Belum ada data kelas.</p>
                                                <p className="text-sm mt-1">Silakan tambahkan kelas baru.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={kelas.links} />
                </div>
            </div>
        </MainLayout>
    );
}
