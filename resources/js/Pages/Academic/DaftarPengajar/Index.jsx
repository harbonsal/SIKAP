import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { Search, BookOpen, User, Filter, SlidersHorizontal, Map } from 'lucide-react';
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

export default function Index({ teachers, jenjangs, kelasOptions, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(search, 300);
    const [selectedJenjang, setSelectedJenjang] = useState(filters.jenjang_id || '');
    const [selectedKelas, setSelectedKelas] = useState(filters.kelas_id || '');

    useEffect(() => {
        // Only fetch if parameters changed to avoid infinite loop
        if (debouncedSearch !== (filters.search || '') ||
            selectedJenjang !== (filters.jenjang_id || '') ||
            selectedKelas !== (filters.kelas_id || '')) {
            
            router.get(
                route('daftar-pengajar.index'),
                { 
                    search: debouncedSearch,
                    jenjang_id: selectedJenjang,
                    kelas_id: selectedKelas
                },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch, selectedJenjang, selectedKelas]);

    return (
        <MainLayout>
            <Head title="Daftar Pengajar Aktif" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Daftar Pengajar (Asatidzah)</h2>
                    <p className="text-muted-foreground">
                        Daftar ustadz dan ustadzah yang memiliki jam mengajar pada tahun ajaran aktif.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="col-span-1">
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Pencarian Umum</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari nama pengajar..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="col-span-1">
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Filter Jenjang</label>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedJenjang}
                            onChange={(e) => setSelectedJenjang(e.target.value)}
                        >
                            <option value="">Semua Jenjang</option>
                            {jenjangs.map(j => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Filter Kelas</label>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedKelas}
                            onChange={(e) => setSelectedKelas(e.target.value)}
                        >
                            <option value="">Semua Kelas</option>
                            {kelasOptions.map(k => (
                                (!selectedJenjang || k.jenjang_id == selectedJenjang) && (
                                    <option key={k.id} value={k.id}>{k.name} ({k.jenjang?.name})</option>
                                )
                            ))}
                        </select>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>Asatidzah Aktif Mengajar</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>NIP/NIS</TableHead>
                                    <TableHead>Nama Pengajar</TableHead>
                                    <TableHead className="text-center">Total Jam Diampu</TableHead>
                                    <TableHead className="text-center">Daftar Mapel</TableHead>
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
                                            <TableCell className="text-center font-bold text-foreground">
                                                <Badge variant={teacher.total_jam > 0 ? 'default' : 'secondary'}>
                                                    {teacher.total_jam} Jam
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button disabled={teacher.active_subjects.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            {teacher.active_subjects.length} Mapel
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[340px]">
                                                        <div className="space-y-2">
                                                            <h4 className="font-medium leading-none mb-3">Mata Pelajaran Diampu</h4>
                                                            {teacher.active_subjects.length > 0 ? (
                                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                                    {teacher.active_subjects.map((subject) => (
                                                                        <div key={subject.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                                                                            <div className="flex gap-2">
                                                                                <div className="mt-0.5 text-emerald-600"><Map className="w-3.5 h-3.5" /></div>
                                                                                <div>
                                                                                    <div className="font-medium">{subject.mapel?.name}</div>
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {subject.active_class?.kelas?.jenjang?.name} | {subject.active_class?.kelas?.name} {subject.active_class?.kelas_paralel?.name}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs font-semibold bg-gray-100 px-1.5 rounded text-gray-700 whitespace-nowrap">
                                                                                {subject.jam} Jam
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">Belum ada mapel.</p>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="5" className="h-64 text-center">
                                            <EmptyState
                                                title="Tidak ada data pengajar"
                                                description="Belum ada data pengajar yang sesuai filter atau terjadwal pada tahun ajaran ini."
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
