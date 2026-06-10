import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Search, Plus, Trash2, Users, Edit, Copy } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function Index({ activeKamars, availableKamars, musrifs, academicYear, systemAcademicYear, preparationSourceYears = [], filters }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.user_level?.name === 'Administrator';
    const isPlanningMode = systemAcademicYear && academicYear && String(systemAcademicYear.id) !== String(academicYear.id);

    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingKamar, setEditingKamar] = useState(null);
    const [sourceYearId, setSourceYearId] = useState(preparationSourceYears[0]?.id ? String(preparationSourceYears[0].id) : '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        academic_year_id: academicYear?.id,
        kamar_id: '',
        musrif_id: '',
        name: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('active-kamars.index'), { search }, { preserveState: true });
    };

    const openCreateModal = () => {
        reset();
        setData('academic_year_id', academicYear?.id);
        setIsCreateOpen(true);
    };

    const openEditModal = (activeKamar) => {
        setEditingKamar(activeKamar);
        setData({
            musrif_id: activeKamar.musrif_id || '',
            name: activeKamar.name || '',
        });
        setIsEditOpen(true);
    };

    const handleSubmitCreate = (e) => {
        e.preventDefault();
        post(route('active-kamars.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Kamar berhasil diaktifkan',
                    showConfirmButton: false,
                    timer: 1500
                });
            },
        });
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        put(route('active-kamars.update', editingKamar.id), {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data kamar aktif berhasil diperbarui',
                    showConfirmButton: false,
                    timer: 1500
                });
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Apakah anda yakin?',
            text: "Kamar akan dinonaktifkan dari tahun ajaran ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, nonaktifkan!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('active-kamars.destroy', id), {
                    onSuccess: () => {
                        Swal.fire(
                            'Berhasil!',
                            'Kamar telah dinonaktifkan.',
                            'success'
                        )
                    }
                });
            }
        })
    };

    const handleCopyFromYear = () => {
        if (!sourceYearId) {
            Swal.fire({
                icon: 'warning',
                title: 'Pilih Tahun Sumber',
                text: 'Pilih tahun sumber sebelum menyalin kamar aktif.',
            });
            return;
        }

        Swal.fire({
            title: 'Salin Kamar Aktif?',
            text: `Struktur kamar aktif untuk ${academicYear?.name} akan diperbarui dari tahun sumber yang dipilih.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, salin',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (!result.isConfirmed) return;

            router.post(route('active-kamars.copy'), {
                source_year_id: sourceYearId,
            }, {
                preserveScroll: true,
            });
        });
    };

    return (
        <MainLayout>
            <Head title="Kamar Aktif" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kamar Aktif</h2>
                        <p className="text-muted-foreground">
                            Tahun Ajaran: {academicYear ? academicYear.name : 'Tidak ada yang dipilih'}
                        </p>
                    </div>
                    {isAdmin && (
                        <Button onClick={openCreateModal} disabled={!academicYear}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Kamar Aktif
                        </Button>
                    )}
                </div>

                {isAdmin && (
                    <div className={`rounded-2xl border p-4 ${isPlanningMode ? 'border-amber-300 bg-amber-50/70' : 'border-blue-200 bg-blue-50/60'}`}>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div className="space-y-1">
                                <div className="font-semibold text-foreground">Konteks asrama: {academicYear?.name}</div>
                                <p className="text-sm text-muted-foreground">
                                    {isPlanningMode
                                        ? `Anda sedang menyiapkan pembagian asrama ${academicYear?.name}. Tahun aktif sekolah tetap ${systemAcademicYear?.name || '-'} sampai nanti diaktifkan secara global.`
                                        : 'Anda sedang membuka tahun aktif sistem. Pindah ke tahun berikutnya dari switcher header bila ingin menyiapkan asrama lebih awal.'}
                                </p>
                            </div>

                            {preparationSourceYears.length > 0 && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div className="sm:w-56">
                                        <label className="text-sm font-medium">Tahun Sumber</label>
                                        <select
                                            value={sourceYearId}
                                            onChange={(e) => setSourceYearId(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">Pilih Tahun Sumber</option>
                                            {preparationSourceYears.map((year) => (
                                                <option key={year.id} value={year.id}>
                                                    {year.name}{year.is_active ? ' (Aktif Sistem)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <Button variant="outline" onClick={handleCopyFromYear} disabled={!sourceYearId}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Salin Kamar Aktif
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari kamar..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Kamar</TableHead>
                                <TableHead>Gedung</TableHead>
                                <TableHead>Kapasitas</TableHead>
                                <TableHead>Musrif</TableHead>
                                <TableHead>Jumlah Santri</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeKamars.data.length > 0 ? (
                                activeKamars.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.name || item.kamar.name}
                                            {item.name && <span className="text-xs text-muted-foreground block">({item.kamar.name})</span>}
                                        </TableCell>
                                        <TableCell>{item.kamar.building}</TableCell>
                                        <TableCell>{item.kamar.capacity}</TableCell>
                                        <TableCell>{item.musrif ? item.musrif.name : '-'}</TableCell>
                                        <TableCell>{item.members.length} Santri</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={route('kamar-members.index', { active_kamar: item.id })}>
                                                    <Button variant="outline" size="icon" title="Lihat Anggota">
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {isAdmin && (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Belum ada kamar aktif.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination links={activeKamars.links} />

                {/* Create Modal */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Kamar Aktif</DialogTitle>
                            <DialogDescription>
                                Pilih kamar untuk diaktifkan pada tahun ajaran ini.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kamar</label>
                                <Select onValueChange={(val) => setData('kamar_id', val)} value={data.kamar_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kamar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableKamars.map((kamar) => (
                                            <SelectItem key={kamar.id} value={kamar.id.toString()}>
                                                {kamar.name} ({kamar.building})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.kamar_id && <p className="text-sm text-destructive">{errors.kamar_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Musrif (Opsional)</label>
                                <Select onValueChange={(val) => setData('musrif_id', val)} value={data.musrif_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Musrif" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {musrifs.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.musrif_id && <p className="text-sm text-destructive">{errors.musrif_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nama Khusus (Opsional)</label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Asrama Putra 1"
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={processing}>Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Kamar Aktif</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitEdit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Musrif</label>
                                <Select onValueChange={(val) => setData('musrif_id', val)} value={data.musrif_id}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Musrif" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {musrifs.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.musrif_id && <p className="text-sm text-destructive">{errors.musrif_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nama Khusus</label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Asrama Putra 1"
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={processing}>Simpan Perubahan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
