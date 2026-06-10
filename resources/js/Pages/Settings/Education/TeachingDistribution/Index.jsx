import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { Search, AlertCircle, CheckCircle, Clock, Users, School, ChevronRight, Calculator } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import EmptyState from '@/Components/EmptyState';

export default function Index({ teachers, activeClasses, summary, filters, academicYear }) {
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(search, 300);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'distribution'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'incomplete', 'missing_teacher'

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                route('teaching-distribution.index'),
                { search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

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

    const filteredClasses = activeClasses.filter(ac => {
        if (filterStatus === 'incomplete') return !ac.is_complete;
        if (filterStatus === 'missing_teacher') return ac.missing_teacher_count > 0;
        return true;
    });

    return (
        <MainLayout>
            <Head title="Analisa & Distribusi Mengajar" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Distribusi Mengajar</h2>
                        <p className="text-muted-foreground">
                            Analisis beban kerja guru dan kelengkapan jam mengajar Tahun {academicYear?.name || '-'}.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menyinkronkan data jatah mengajar dari database lama? Data yang ada akan diperbarui.')) {
                                    router.post(route('teaching-distribution.sync'), {}, {
                                        preserveScroll: true,
                                    });
                                }
                            }}
                            className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                            Sinkronisasi Jatah Mengajar
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.visit(route('active-classes.index'))}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_classes}</div>
                            <p className="text-xs text-muted-foreground">Rombongan belajar aktif</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:bg-accent/50 ${filterStatus === 'incomplete' && activeTab === 'analysis' ? 'ring-2 ring-primary bg-accent/20' : ''}`}
                        onClick={() => { setFilterStatus('incomplete'); setActiveTab('analysis'); }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kurang Jam</CardTitle>
                            <Clock className={`h-4 w-4 ${summary.incomplete_hours_count > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.incomplete_hours_count > 0 ? 'text-destructive' : ''}`}>
                                {summary.incomplete_hours_count}
                            </div>
                            <p className="text-xs text-muted-foreground">Kelas belum penuhi target</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`cursor-pointer transition-all hover:bg-accent/50 ${filterStatus === 'missing_teacher' && activeTab === 'analysis' ? 'ring-2 ring-primary bg-accent/20' : ''}`}
                        onClick={() => { setFilterStatus('missing_teacher'); setActiveTab('analysis'); }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mapel Tanpa Guru</CardTitle>
                            <Users className={`h-4 w-4 ${summary.missing_teacher_count > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.missing_teacher_count > 0 ? 'text-orange-500' : ''}`}>
                                {summary.missing_teacher_count}
                            </div>
                            <p className="text-xs text-muted-foreground">Kelas dengan mapel kosong</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sisa Jam Alokasi</CardTitle>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_unallocated_hours}</div>
                            <p className="text-xs text-muted-foreground">Total jam belum terisi</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Navigation */}
                <div className="flex space-x-1 rounded-xl bg-muted p-1 w-fit">
                    <button
                        onClick={() => { setActiveTab('analysis'); setFilterStatus('all'); }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${activeTab === 'analysis'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                            }`}
                    >
                        <School className="h-4 w-4" />
                        Analisa Kelas
                    </button>
                    <button
                        onClick={() => setActiveTab('distribution')}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${activeTab === 'distribution'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Jatah & Kuota Guru
                    </button>
                </div>

                {/* TAB CONTENT: Analysis */}
                {activeTab === 'analysis' && (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead>Kelas</TableHead>
                                        <TableHead>Wali Kelas</TableHead>
                                        <TableHead className="text-center">Target Jam</TableHead>
                                        <TableHead className="text-center">Terisi</TableHead>
                                        <TableHead className="text-center">Sisa Target</TableHead>
                                        <TableHead className="text-center">Guru Kosong</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClasses.length > 0 ? (
                                        filteredClasses.map((ac, index) => (
                                            <TableRow key={ac.id}>
                                                <TableCell className="text-center font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {ac.full_name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ac.teacher?.name || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {ac.target_hours}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {ac.assigned_hours}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {ac.remaining_hours > 0 ? (
                                                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                                            -{ac.remaining_hours} Jam
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                            OK
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {ac.missing_teacher_count > 0 ? (
                                                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                            {ac.missing_teacher_count} Mapel
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {ac.is_complete && ac.missing_teacher_count === 0 ? (
                                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                            <CheckCircle className="h-3.5 w-3.5" /> Lengkap
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                                            <AlertCircle className="h-3.5 w-3.5" /> Belum Sesuai
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={route('subject-teachers.show', ac.id)}
                                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline hover:text-primary/80"
                                                    >
                                                        Kelola Guru <ChevronRight className="h-4 w-4" />
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="9" className="h-64 text-center">
                                                <EmptyState
                                                    title="Tidak ada data kelas"
                                                    description="Tidak ada data kelas yang sesuai dengan filter yang dipilih."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT: Distribution */}
                {activeTab === 'distribution' && (
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Daftar Beban Mengajar Guru</CardTitle>
                                    <CardDescription>
                                        Pantau dan sesuaikan kuota jam mengajar setiap guru.
                                    </CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nama guru..."
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
                                        <TableHead>Nama Guru</TableHead>
                                        <TableHead>Level User</TableHead>
                                        <TableHead className="text-center">Kuota (Jam)</TableHead>
                                        <TableHead className="text-center">Terjadwal</TableHead>
                                        <TableHead className="text-center">Total Beban</TableHead>
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
                                                <TableCell className="font-medium">
                                                    {teacher.name}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                                                        {teacher.user_level?.name}
                                                    </span>
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
                                                <TableCell className="text-center font-bold text-foreground">
                                                    {teacher.assigned_hours}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-muted-foreground text-xs">
                                                        {Math.round((teacher.assigned_hours / (teacher.max_hours || 1)) * 100)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {teacher.assigned_hours > teacher.max_hours ? (
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                            Overload (+{teacher.assigned_hours - teacher.max_hours})
                                                        </div>
                                                    ) : teacher.assigned_hours === teacher.max_hours ? (
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                            Penuh
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                            Tersedia ({teacher.max_hours - teacher.assigned_hours})
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="7" className="h-64 text-center">
                                                <EmptyState
                                                    title="Tidak ada data guru"
                                                    description="Belum ada data guru yang terdaftar."
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
                )}
            </div>
        </MainLayout>
    );
}
