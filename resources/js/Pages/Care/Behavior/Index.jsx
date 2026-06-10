import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Plus, Calendar as CalendarIcon, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Index({ records, date }) {
    const [selectedDate, setSelectedDate] = useState(date);

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        router.get(route('assessments.behavior.index'), { date: newDate }, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
            router.delete(route('assessments.behavior.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Aktualisasi Akhlak - Log Harian" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Log Aktualisasi Akhlak</h2>
                        <p className="text-muted-foreground">
                            Riwayat pencatatan perilaku harian santri.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                className="border-none p-0 h-auto text-sm focus:ring-0"
                                value={selectedDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <Button asChild>
                            <Link href={route('assessments.behavior.create')}>
                                <Plus className="mr-2 h-4 w-4" /> Catat Perilaku
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Tanggal {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: id })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">No</TableHead>
                                        <TableHead>Nama Santri</TableHead>
                                        <TableHead>Perilaku</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Poin</TableHead>
                                        <TableHead>Catatan</TableHead>
                                        <TableHead>Pencatat</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.data.length > 0 ? (
                                        records.data.map((record, index) => (
                                            <TableRow key={record.id}>
                                                <TableCell>{index + 1 + records.from - 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{record.student?.user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{record.student?.user?.nomor_induk}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={record.behavior?.type === 'positive' ? 'outline' : 'destructive'}>
                                                            {record.behavior?.type === 'positive' ? 'Positif' : 'Negatif'}
                                                        </Badge>
                                                        <span>{record.behavior?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{record.behavior?.category?.name || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={record.behavior?.point >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                        {record.behavior?.point > 0 ? '+' : ''}{record.behavior?.point}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={record.notes}>
                                                    {record.notes || '-'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {record.user?.name || 'Sistem'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(record.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                                Tidak ada catatan perilaku pada tanggal ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Pagination if needed, passed from controller */}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
