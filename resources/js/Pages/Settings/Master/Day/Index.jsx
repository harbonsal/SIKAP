import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';

export default function Index({ days }) {
    const handleUpdate = (day, field, value) => {
        router.put(route('days.update', day.id), {
            ...day,
            [field]: value,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: Show toast
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Master Hari" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Master Hari</h2>
                    <p className="text-muted-foreground">
                        Atur hari aktif dan jumlah jam belajar per hari.
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Nama Hari</TableHead>
                                    <TableHead className="text-center w-[150px]">Jumlah Jam</TableHead>
                                    <TableHead className="text-center w-[150px]">Status Aktif</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {days.map((day) => (
                                    <TableRow key={day.id}>
                                        <TableCell className="font-medium">{day.name}</TableCell>
                                        <TableCell className="text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-20 rounded-md border border-input bg-transparent px-2 py-1 text-sm text-center shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                defaultValue={day.total_hours}
                                                onBlur={(e) => handleUpdate(day, 'total_hours', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={day.is_active}
                                                onChange={(e) => handleUpdate(day, 'is_active', e.target.checked)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
