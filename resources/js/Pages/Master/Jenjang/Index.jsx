import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, GraduationCap, School } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

export default function Index({ jenjangs }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus jenjang ini?')) {
            destroy(route('jenjangs.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Jenjang Pendidikan" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Jenjang Pendidikan</h2>
                        <p className="text-muted-foreground">Kelola data jenjang pendidikan dan kepala sekolah.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('jenjangs.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Jenjang
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Daftar Jenjang</CardTitle>
                        <CardDescription>
                            Menampilkan semua jenjang pendidikan yang terdaftar di sistem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead>Nama Jenjang</TableHead>
                                        <TableHead>Kepala Sekolah</TableHead>
                                        <TableHead>Nama Arab</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jenjangs.data.length > 0 ? (
                                        jenjangs.data.map((jenjang, index) => (
                                            <TableRow key={jenjang.id} className="hover:bg-muted/10">
                                                <TableCell className="text-center">
                                                    {(jenjangs.current_page - 1) * jenjangs.per_page + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 rounded-full bg-primary/10 text-primary hidden sm:flex">
                                                            <School className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium">{jenjang.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {jenjang.headmaster ? (
                                                        <div className="flex items-center gap-2">
                                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{jenjang.headmaster.name}</span>
                                                                {jenjang.headmaster_title && (
                                                                    <span className="text-xs text-muted-foreground">{jenjang.headmaster_title}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground font-normal italic">
                                                            Belum diset
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-arabic text-lg leading-none py-2">
                                                    {jenjang.nama_arab || <span className="text-muted-foreground font-sans text-sm italic">-</span>}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {jenjang.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                            <Link href={route('jenjangs.edit', jenjang.id)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(jenjang.id)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <School className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>Belum ada data jenjang pendidikan.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4">
                            <Pagination links={jenjangs.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
