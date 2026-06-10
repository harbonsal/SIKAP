import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, BookOpen, Filter, ClipboardList, GraduationCap, Download, Clock } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import EmptyState from '@/Components/EmptyState';
import { Badge } from '@/Components/ui/badge';

export default function Index({ activeSubjects, filters, academicYear, semester, classes, mapels, teachers }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || '');
    const [selectedMapel, setSelectedMapel] = useState(filters.mapel_id || '');
    const [selectedTeacher, setSelectedTeacher] = useState(filters.teacher_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters(search, selectedClass, selectedMapel, selectedTeacher);
    };

    const handleFilterChange = (key, value) => {
        let newClass = selectedClass;
        let newMapel = selectedMapel;
        let newTeacher = selectedTeacher;

        if (key === 'class') { setSelectedClass(value); newClass = value; }
        if (key === 'mapel') { setSelectedMapel(value); newMapel = value; }
        if (key === 'teacher') { setSelectedTeacher(value); newTeacher = value; }

        applyFilters(search, newClass, newMapel, newTeacher);
    };

    const applyFilters = (s, c, m, t) => {
        router.get(route('assessments.index'), {
            search: s,
            active_class_id: c,
            mapel_id: m,
            teacher_id: t
        }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Input Nilai Guru" />

            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Input Nilai</h2>
                        <Button variant="outline" asChild className="shadow-sm">
                            <Link
                                href={route('assessments.export-excel', {
                                    search,
                                    active_class_id: selectedClass,
                                    mapel_id: selectedMapel,
                                    teacher_id: selectedTeacher
                                })}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export Excel
                            </Link>
                        </Button>
                    </div>
                    <p className="text-muted-foreground">
                        Daftar mata pelajaran yang Anda ampu untuk Tahun Ajaran {academicYear?.name} Semester {semester?.name}.
                    </p>
                </div >

                <Card className="bg-muted/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filter Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`grid grid-cols-1 md:grid-cols-${teachers && teachers.length > 0 ? '4' : '3'} gap-4`}>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <form onSubmit={handleSearch}>
                                    <Input
                                        type="text"
                                        placeholder="Cari mapel atau kelas..."
                                        className="pl-9 bg-background"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedClass}
                                    onChange={(e) => handleFilterChange('class', e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.kelas?.name} {c.kelas_paralel?.name || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedMapel}
                                    onChange={(e) => handleFilterChange('mapel', e.target.value)}
                                >
                                    <option value="">Semua Mapel</option>
                                    {mapels.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            {teachers && teachers.length > 0 && (
                                <div>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedTeacher}
                                        onChange={(e) => handleFilterChange('teacher', e.target.value)}
                                    >
                                        <option value="">Semua Guru</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-base font-medium">Daftar Mata Pelajaran</CardTitle>
                        <CardDescription>Pilih mata pelajaran untuk mulai menginput nilai.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center pl-6">No</TableHead>
                                    <TableHead>Kelas</TableHead>
                                    <TableHead>Mata Pelajaran</TableHead>
                                    <TableHead>Guru Pengampu</TableHead>
                                    <TableHead>Terakhir Diupdate</TableHead>
                                    <TableHead className="text-center w-[140px] pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeSubjects.data.length > 0 ? (
                                    activeSubjects.data.map((subject, index) => (
                                        <TableRow key={subject.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="text-center font-medium pl-6">
                                                {(activeSubjects.current_page - 1) * activeSubjects.per_page + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground shadow-sm">
                                                        {subject.active_class.kelas.name.split(' ')[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">
                                                            {subject.active_class.kelas.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {subject.active_class.kelas_paralel?.name || 'Reguler'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium flex items-center gap-2">
                                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                        {subject.mapel.name}
                                                    </span>
                                                    <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                                        KKM: {subject.kkm || '-'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                                                        {(subject.teacher?.name || '?').substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm">{subject.teacher?.name || <span className="text-muted-foreground italic">Belum ada guru</span>}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    {subject.student_grades_max_updated_at ? (
                                                        <span>
                                                            {new Date(subject.student_grades_max_updated_at).toLocaleString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="italic">Belum ada nilai</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center pr-6">
                                                <Button size="sm" asChild className="shadow-sm">
                                                    <Link
                                                        href={route('assessments.show', {
                                                            id: subject.id,
                                                            ...filters,
                                                            page: activeSubjects.current_page
                                                        })}
                                                    >
                                                        <ClipboardList className="mr-2 h-3.5 w-3.5" />
                                                        Input Nilai
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <EmptyState
                                                icon={BookOpen}
                                                title="Tidak ada mata pelajaran"
                                                description="Anda belum memiliki jadwal mengajar atau belum ditambahkan ke kelas manapun."
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={activeSubjects.links} />
                </div>
            </div >
        </MainLayout >
    );
}
