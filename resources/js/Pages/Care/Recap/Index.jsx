import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import Pagination from '@/Components/Pagination';

export default function Index({ activeKamars, academicYear, semester }) {
    const { data, setData, get, processing } = useForm({
        search: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('assessments.character.recap.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <MainLayout>
            <Head title="Rekap Nilai Akhlak" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Rekap Nilai Akhlak</h2>
                    <p className="text-muted-foreground">
                        Tahun Ajaran: {academicYear?.name || '-'}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Kamar</CardTitle>
                        <CardDescription>Pilih kamar untuk melihat rekap nilai akhlak.</CardDescription>
                        <div className="flex w-full max-w-sm items-center space-x-2 pt-4">
                            <form onSubmit={handleSearch} className="flex w-full gap-2">
                                <Input
                                    type="text"
                                    placeholder="Cari kamar..."
                                    value={data.search}
                                    onChange={e => setData('search', e.target.value)}
                                />
                                <Button type="submit" variant="secondary" disabled={processing}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Nama Kamar</TableHead>
                                            <TableHead>Musrif</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeKamars.data.length > 0 ? (
                                            activeKamars.data.map((item, index) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{index + 1 + (activeKamars.from || 1) - 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.kamar?.name}
                                                    </TableCell>
                                                    <TableCell>{item.musrif?.name || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={route('assessments.character.recap.show', { id: item.id, semester: semester })}>
                                                            <Button size="sm" variant="outline">Lihat Rekap</Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    Tidak ada data kamar ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4">
                                <Pagination links={activeKamars.links} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
