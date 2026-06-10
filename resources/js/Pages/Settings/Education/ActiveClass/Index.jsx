import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, Filter, UserCog, Users } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import EmptyState from '@/Components/EmptyState';

export default function Index({ activeClasses, academicYears, activeYearId, filters }) {
    const { auth } = usePage().props;
    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || activeYearId || '');

    const isGuru = auth.user?.user_level?.name === 'Guru';

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kelas aktif ini?')) {
            destroy(route('active-classes.destroy', id));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('active-classes.index'), {
            search,
            academic_year_id: selectedYear
        }, { preserveState: true });
    };

    const handleYearChange = (e) => {
        const yearId = e.target.value;
        setSelectedYear(yearId);
        router.get(route('active-classes.index'), {
            search,
            academic_year_id: yearId
        }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Kelas Aktif" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kelas Aktif</h2>
                        <p className="text-muted-foreground">Kelola rombongan belajar per tahun pelajaran.</p>
                    </div>
                    <div>
                        {!isGuru && (
                            <Link
                                href={route('active-classes.create')}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Kelas
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Cari nama kelas atau wali kelas..."
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>
                    <div className="w-full sm:w-64">
                        <div className="relative">
                            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedYear}
                                onChange={handleYearChange}
                            >
                                <option value="">Semua Tahun Pelajaran</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name} - {year.semester} {year.id === activeYearId ? '(Aktif)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                    <TableHead>Tahun Pelajaran</TableHead>
                                    <TableHead className="text-center">Jam/Pekan</TableHead>
                                    <TableHead className="text-center w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeClasses.data.length > 0 ? (
                                    activeClasses.data.map((activeClass, index) => (
                                        <TableRow key={activeClass.id}>
                                            <TableCell className="text-center font-medium">
                                                {(activeClasses.current_page - 1) * activeClasses.per_page + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-lg text-foreground">
                                                    {activeClass.kelas.name} {activeClass.kelas_paralel?.name || ''}
                                                </div>
                                                {activeClass.name && (
                                                    <div className="text-xs text-muted-foreground">{activeClass.name}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {activeClass.teacher ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                            {activeClass.teacher.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-foreground">{activeClass.teacher.name}</div>
                                                            <div className="text-xs text-muted-foreground">{activeClass.teacher.nomor_induk}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Belum ditentukan</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${activeClass.academic_year_id === activeYearId
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}>
                                                    {activeClass.academic_year.name}{activeClass.academic_year.semester ? ` - ${activeClass.academic_year.semester}` : ''}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {activeClass.total_hours_per_week ? (
                                                    <span className="font-mono font-medium">{activeClass.total_hours_per_week}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!isGuru && (
                                                        <>
                                                            <Link
                                                                href={route('active-classes.edit', {
                                                                    active_class: activeClass.id,
                                                                    ...filters,
                                                                    page: activeClasses.current_page
                                                                })}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(activeClass.id)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <Link
                                                        href={route('subject-teachers.show', activeClass.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        title="Plotting Guru / Mata Pelajaran"
                                                    >
                                                        <UserCog className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={route('class-members.show', activeClass.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        title="Lihat Anggota Kelas"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <EmptyState
                                                title="Belum ada kelas aktif"
                                                description="Silakan tambahkan kelas aktif baru untuk tahun ajaran ini."
                                            />
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
        </MainLayout >
    );
}
