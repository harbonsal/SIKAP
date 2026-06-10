import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { Search, BookOpen, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import EmptyState from '@/Components/EmptyState';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { Badge } from "@/Components/ui/badge";

export default function Index({ teachers, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(search, 300);

    const handleQuotaUpdate = (userId, maxHours) => {
        router.put(route('teaching-distribution.update-quota', userId), {
            max_hours: maxHours,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: Show toast
            }
        });
    };

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                route('subject-teachers.index'),
                { search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    return (
        <MainLayout>
            <Head title="Distribusi Pengajar" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Distribusi Pengajar</h2>
                        <p className="text-muted-foreground">
                            Daftar seluruh pengajar terjadwal dan pengaturan jatah mengajar.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('active-classes.index')}>
                            <Button variant="outline" className="gap-2">
                                <Users className="h-4 w-4" />
                                Atur Plotting (Per Kelas)
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Daftar Pengajar</CardTitle>
                                <CardDescription>
                                    Kelola kuota jam dan lihat distribusi mata pelajaran.
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari nama atau NIP/NIS..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>NIP/NIS</TableHead>
                                    <TableHead>Nama Pengajar</TableHead>
                                    <TableHead className="text-center">Jatah Jam</TableHead>
                                    <TableHead className="text-center">Mapel Diajar</TableHead>
                                    <TableHead className="text-center">Total Jam</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.data.length > 0 ? (
                                    teachers.data.map((teacher, index) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell className="text-center font-medium">
                                                {(teachers.current_page - 1) * teachers.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {teacher.nomor_induk || '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{teacher.name}</span>
                                                    <span className="text-xs text-muted-foreground">{teacher.user_level?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-8 w-20 text-center"
                                                        defaultValue={teacher.max_hours}
                                                        onBlur={(e) => handleQuotaUpdate(teacher.id, e.target.value)}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium hover:bg-secondary transition-colors">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            {teacher.active_subjects.length} Mapel
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none mb-3">Mata Pelajaran Diampu</h4>
                                                            {teacher.active_subjects.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {teacher.active_subjects.map((subject) => (
                                                                        <div key={subject.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                                                            <div>
                                                                                <div className="font-medium">{subject.mapel?.name}</div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {subject.active_class?.kelas?.name} {subject.active_class?.kelas_paralel?.name}
                                                                                </div>
                                                                            </div>
                                                                            <Badge variant="outline">{subject.jam} Jam</Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">Belum ada mapel yang diajar.</p>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-foreground">
                                                {teacher.assigned_hours}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {teacher.assigned_hours > teacher.max_hours ? (
                                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        Over (+{teacher.assigned_hours - teacher.max_hours})
                                                    </div>
                                                ) : teacher.assigned_hours === teacher.max_hours ? (
                                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        Pas
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                        Sisa ({teacher.max_hours - teacher.assigned_hours})
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="7" className="h-64 text-center">
                                            <EmptyState
                                                title="Tidak ada data pengajar"
                                                description="Belum ada data pengajar yang terdaftar."
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <div className="p-4 border-t">
                        <Pagination links={teachers.links} />
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
}
