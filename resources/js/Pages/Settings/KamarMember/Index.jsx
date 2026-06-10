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
} from "@/Components/ui/dialog";
import { Search, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select'; // Using react-select for searchable dropdown

export default function Index({ activeKamar, members, availableStudents, filters }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.user_level?.name === 'Administrator';
    const [search, setSearch] = useState(filters.search || '');
    const [isAddOpen, setIsAddOpen] = useState(false);

    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const cleanLocationValue = (value) => {
        const normalized = String(value || '').trim();
        return normalized && normalized !== '-' ? normalized : '';
    };

    const isJawaProvince = (province) => {
        const p = normalizeText(province);
        if (!p) return false;

        const jawaKeywords = [
            'jawa tengah',
            'jateng',
            'jawa barat',
            'jabar',
            'jawa timur',
            'jatim',
            'dki jakarta',
            'jakarta',
            'banten',
            'di yogyakarta',
            'd.i. yogyakarta',
            'daerah istimewa yogyakarta',
            'diy',
            'yogyakarta',
        ];

        return jawaKeywords.some((keyword) => p.includes(keyword));
    };

    const getAsalDaerah = (student) => {
        const province = cleanLocationValue(student?.province);
        if (province) {
            return isJawaProvince(province) ? 'Pulau Jawa' : 'Luar Jawa';
        }

        const originRegion = normalizeText(student?.origin_region);
        if (!originRegion || originRegion === '-') return '-';
        if (originRegion.includes('luar jawa')) return 'Luar Jawa';
        if (originRegion.includes('jawa')) return 'Pulau Jawa';
        return student?.origin_region || '-';
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        active_kamar_id: activeKamar.id,
        student_id: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('kamar-members.index', { active_kamar: activeKamar.id }), { search }, { preserveState: true });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kamar-members.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Santri berhasil ditambahkan',
                    showConfirmButton: false,
                    timer: 1500
                });
            },
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Apakah anda yakin?',
            text: "Santri akan dikeluarkan dari kamar ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, keluarkan!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('kamar-members.destroy', id), {
                    onSuccess: () => {
                        Swal.fire(
                            'Berhasil!',
                            'Santri telah dikeluarkan.',
                            'success'
                        )
                    }
                });
            }
        })
    };

    const studentOptions = availableStudents.map(s => ({
        value: s.id,
        label: `${s.name} (${s.nis})`
    }));

    return (
        <MainLayout>
            <Head title={`Anggota Kamar - ${activeKamar.name || activeKamar.kamar.name}`} />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('active-kamars.index')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {activeKamar.name || activeKamar.kamar.name}
                        </h2>
                        <p className="text-muted-foreground">
                            Musrif: {activeKamar.musrif ? activeKamar.musrif.name : '-'} | Kapasitas: {activeKamar.kamar.capacity}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari santri..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            />
                        </div>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => setIsAddOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Santri
                        </Button>
                    )}
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NIS</TableHead>
                                <TableHead>Nama Santri</TableHead>
                                <TableHead>Kelas</TableHead>
                                <TableHead>Kab/Kota & Provinsi</TableHead>
                                <TableHead>Asal Daerah</TableHead>
                                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.data.length > 0 ? (
                                members.data.map((item) => {
                                    // Find active class for the current academic year if possible, or just take the latest
                                    // Ideally we should filter classMembers by the same academic year as the activeKamar
                                    const classInfo = item.student.class_members?.find(cm => cm.active_class?.academic_year_id === activeKamar.academic_year_id)?.active_class;
                                    const className = classInfo ? `${classInfo.kelas?.name || ''} ${classInfo.kelas_paralel?.name || ''}` : '-';
                                    const city = cleanLocationValue(item.student.city);
                                    const province = cleanLocationValue(item.student.province);
                                    const locationText = [city, province].filter(Boolean).join(', ') || '-';
                                    const asalDaerah = getAsalDaerah(item.student);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.student.nomor_induk}</TableCell>
                                            <TableCell className="font-medium">{item.student.name}</TableCell>
                                            <TableCell>{className}</TableCell>
                                            <TableCell>{locationText}</TableCell>
                                            <TableCell>{asalDaerah}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                                        Belum ada santri di kamar ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Add Member Modal */}
                {isAdmin && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Tambah Santri ke Kamar</DialogTitle>
                                <DialogDescription>
                                    Cari dan pilih santri untuk ditambahkan.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Pilih Santri</label>
                                    <Select
                                        options={studentOptions}
                                        onChange={(option) => setData('student_id', option.value)}
                                        placeholder="Cari nama atau NIS..."
                                        isClearable
                                        isSearchable
                                        className="text-sm"
                                    />
                                    {errors.student_id && <p className="text-sm text-destructive">{errors.student_id}</p>}
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={processing}>Simpan</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </MainLayout>
    );
}
