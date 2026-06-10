import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Users, Building, School, Plus, Pencil, Trash2, Search, Upload, Download, Eye, Loader2 } from 'lucide-react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import Pagination from '@/Components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import MainLayout from '@/Layouts/MainLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import ResponsiveTable from '@/Components/ResponsiveTable';
import axios from 'axios';
import { confirmDelete } from '@/lib/sweetalert';

export default function Index({ students, filters, total_count, mode = 'management', searchStats, classes, kamars }) {
    const { auth } = usePage().props;
    const [status, setStatus] = useState(filters.status || 'Aktif');
    const [search, setSearch] = useState(filters.search || '');
    const [originRegion, setOriginRegion] = useState(filters.origin_region || 'Semua');
    const [classId, setClassId] = useState(filters.class_id || 'Semua');
    const [kamarId, setKamarId] = useState(filters.kamar_id || 'Semua');

    // Group Modal State
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isGroupLoading, setIsGroupLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchGroupMembers = async (type, id) => {
        setIsGroupLoading(true);
        try {
            const response = await axios.get(route('students.group_members', { type, id }));
            setSelectedGroup(response.data);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Failed to fetch group members:", error);
            // Show explicit error to user if development
            alert("Gagal memuat data anggota. " + (error.response?.data?.message || error.message));
        } finally {
            setIsGroupLoading(false);
        }
    };

    const handleSearch = (newSearch, newStatus, newRegion, newClassId, newKamarId) => {
        router.get(
            route('students.index'),
            {
                search: newSearch ?? search,
                status: newStatus ?? status,
                origin_region: newRegion ?? originRegion,
                class_id: newClassId ?? classId,
                kamar_id: newKamarId ?? kamarId,
                mode: mode // Persist mode
            },
            { preserveState: true, replace: true }
        );
    };

    // ... (Handlers kept same)

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        handleSearch(undefined, newStatus, undefined, undefined, undefined);
    };

    const handleRegionChange = (e) => {
        const newRegion = e.target.value;
        setOriginRegion(newRegion);
        handleSearch(undefined, undefined, newRegion, undefined, undefined);
    };

    const handleClassChange = (e) => {
        const newClass = e.target.value;
        setClassId(newClass);
        handleSearch(undefined, undefined, undefined, newClass, undefined);
    };

    const handleKamarChange = (e) => {
        const newKamar = e.target.value;
        setKamarId(newKamar);
        handleSearch(undefined, undefined, undefined, undefined, newKamar);
    };

    const handleSearchInput = (e) => {
        setSearch(e.target.value);
    };

    const onSearchSubmit = (e) => {
        e.preventDefault();
        handleSearch(search, undefined, undefined, undefined, undefined);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({
            title: 'Hapus Data Santri?',
            text: 'Data santri yang dihapus tidak dapat dikembalikan!',
            confirmButtonText: 'Ya, Hapus!',
        });

        if (confirmed) {
            router.delete(route('students.destroy', id));
        }
    };

    const userRole = auth.user?.user_level?.name;
    const isAdmin = userRole === 'Administrator';

    const renderStudentTable = () => (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <p className="text-sm text-muted-foreground mr-auto shrink-0">
                    Total Data: <span className="font-semibold text-foreground">{total_count}</span> |
                    Tampil: <span className="font-semibold text-foreground">{students.total}</span>
                </p>
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row flex-1 sm:justify-end gap-2 w-full">
                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <option value="Semua">Semua Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Pindah">Pindah</option>
                    </select>
                    
                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={classId}
                        onChange={handleClassChange}
                    >
                        <option value="Semua">Semua Kelas</option>
                        {classes && classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.kelas?.level} {c.kelas?.name} {c.kelas_paralel?.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={kamarId}
                        onChange={handleKamarChange}
                    >
                        <option value="Semua">Semua Asrama</option>
                        {kamars && kamars.map(k => (
                            <option key={k.id} value={k.id}>
                                {k.kamar?.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={originRegion}
                        onChange={handleRegionChange}
                    >
                        <option value="Semua">Semua Domisili</option>
                        <option value="Jawa">Jawa</option>
                        <option value="Luar Jawa">Luar Jawa</option>
                        <option value="Belum Diisi">Belum Diisi</option>
                    </select>

                    <div className="relative w-full sm:max-w-xs">
                        <form onSubmit={onSearchSubmit} className="flex w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Cari Nama/NIS..."
                                className="pl-9 h-10"
                                value={search}
                                onChange={handleSearchInput}
                            />
                        </form>
                    </div>
                </div>
            </div>

            <ResponsiveTable className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px] pl-6">No</TableHead>
                            <TableHead>Identitas</TableHead>
                            <TableHead>Kelas</TableHead>
                            <TableHead>Asrama</TableHead>
                            <TableHead>Domisili</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            {mode !== 'search' && <TableHead className="text-right pr-6">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.data.length > 0 ? (
                            students.data.map((student, index) => (
                                <TableRow key={student.id} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="pl-6 align-top py-4">
                                        <span className="text-muted-foreground font-medium">
                                            {(students.current_page - 1) * students.per_page + index + 1}
                                        </span>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="flex flex-col gap-1">
                                            <Link href={route('students.show', student.id)} className="font-semibold text-foreground hover:underline hover:text-primary transition-colors">
                                                {student.user?.name}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {student.user?.nomor_induk && <span className="bg-secondary px-1 rounded">NIP: {student.user.nomor_induk}</span>}
                                                {student.nisn && <span>NISN: {student.nisn}</span>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        {student.class_members?.[0] ? (
                                            <span className="text-sm">{student.class_members[0].active_class?.kelas?.name} {student.class_members[0].active_class?.kelas_paralel?.name}</span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        {student.kamar_members?.[0] ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{student.kamar_members[0].active_kamar?.kamar?.name}</span>
                                                <span className="text-xs text-muted-foreground">{student.kamar_members[0].active_kamar?.name}</span>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="text-sm">{student.origin_region || '-'}</div>
                                    </TableCell>
                                    <TableCell className="align-top py-4 text-center">
                                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${student.user?.status === 'Aktif'
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                            : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                            }`}>
                                            {student.user?.status || 'Aktif'}
                                        </span>
                                    </TableCell>
                                    {mode !== 'search' && (
                                        <TableCell className="align-top py-4 text-right pr-6">
                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={route('students.show', student.id)} className="mr-2"><Eye className="w-4 h-4" /></Link>
                                                {isAdmin && <button onClick={() => handleDelete(student.id)}><Trash2 className="w-4 h-4 text-destructive" /></button>}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="text-center py-6">Tidak ada data.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ResponsiveTable>
            <div className="mt-4">
                <Pagination links={students.links} />
            </div>
        </>
    );

    return (
        <MainLayout>
            <Head title={mode === 'search' ? "Pusat Pencarian" : "Data Siswa"} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{mode === 'search' ? 'Pusat Informasi & Pencarian' : 'Data Siswa'}</h2>
                        <p className="text-muted-foreground">{mode === 'search' ? 'Cari santri, cek kapasitas asrama, dan info kelas.' : 'Kelola data induk siswa (Biodata).'}</p>
                    </div>
                    {mode !== 'search' && isAdmin && (
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={route('students.export', { status, search, origin_region: originRegion, class_id: classId, kamar_id: kamarId })}
                                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </a>
                            <Link
                                href={route('students.import')}
                                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                Import / Update Massal
                            </Link>
                            <Link
                                href={route('students.create')}
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Santri
                            </Link>
                        </div>
                    )}
                </div>

                {mode === 'search' && searchStats ? (
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                            <TabsTrigger value="list">Lis Biodata</TabsTrigger>
                            <TabsTrigger value="dorms">Data Asrama</TabsTrigger>
                            <TabsTrigger value="classes">Data Kelas</TabsTrigger>
                        </TabsList>

                        {/* Tab 1: List (Replaces Composition) */}
                        <TabsContent value="list" className="mt-4">
                            {renderStudentTable()}
                        </TabsContent>

                        {/* Tab 2: Dorms */}
                        <TabsContent value="dorms" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {searchStats.dorms_summary.map((dorm) => (
                                    <Card
                                        key={dorm.id}
                                        className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                                        onClick={() => fetchGroupMembers('kamar', dorm.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-lg">{dorm.kamar?.name}</h3>
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{dorm.members_count} Santri</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <Building className="h-3 w-3 inline mr-1" />
                                                Musrif: {dorm.musrif?.name || '-'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Tab 3: Classes */}
                        <TabsContent value="classes" className="mt-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {searchStats.classes_summary.map((cls) => (
                                    <Card
                                        key={cls.id}
                                        className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                                        onClick={() => fetchGroupMembers('kelas', cls.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-lg">{cls.kelas?.level} - {cls.kelas?.name} {cls.kelas_paralel?.name}</h3>
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{cls.class_members_count} Siswa</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <School className="h-3 w-3 inline mr-1" />
                                                Wali Kelas: {cls.teacher?.name || '-'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    // Default Management View
                    renderStudentTable()
                )}
            </div>

            {/* Member List Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedGroup?.title || 'Daftar Anggota'}</DialogTitle>
                        <DialogDescription>
                            {selectedGroup?.subtitle || ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Nama Santri</TableHead>
                                    <TableHead>NISN</TableHead>
                                    <TableHead>NIP</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedGroup?.members && selectedGroup.members.length > 0 ? (
                                    selectedGroup.members.map((member, index) => (
                                        <TableRow key={member.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                <Link href={route('students.show', member.id)} className="hover:underline hover:text-primary">
                                                    {member.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{member.nisn || '-'}</TableCell>
                                            <TableCell>{member.nomor_induk || '-'}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${member.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {member.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                            Tidak ada anggota.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

        </MainLayout>
    );
}
