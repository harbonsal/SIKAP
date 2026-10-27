import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, BookOpen, FileText, Upload, Download, Sparkles, CheckCircle2, Clock, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import Pagination from '@/Components/Pagination';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";

export default function Index({ silabuses, mapels, jenjangs, kelas, filters, is_teacher, accessible_pairs }) {
    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMapel, setSelectedMapel] = useState(filters.mapel_id || '');
    const [selectedJenjang, setSelectedJenjang] = useState(filters.jenjang_id || '');
    const [selectedKelas, setSelectedKelas] = useState(filters.kelas_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || '');

    // Modal Edit State & Form
    const [editingSilabus, setEditingSilabus] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const editForm = useForm({
        mapel_id: '',
        jenjang_id: '',
        kelas_id: '',
        kurikulum: 'Merdeka',
        semester: 'Ganjil',
        kode: '',
        standar_kompetensi: '',
        kompetensi: '',
        materi: '',
        alokasi_waktu: '',
        pekan: '',
    });

    // Modal Add State & Form
    const [isAddOpen, setIsAddOpen] = useState(false);
    const addForm = useForm({
        mapel_id: '',
        jenjang_id: '',
        kelas_id: '',
        kurikulum: 'Merdeka',
        semester: 'Ganjil',
        kode: '',
        standar_kompetensi: '',
        kompetensi: '',
        materi: '',
        alokasi_waktu: '2 JP',
        pekan: '',
    });

    // Modal Import State
    const [isImportOpen, setIsImportOpen] = useState(false);
    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({
        file: null,
    });

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus baris silabus ini?')) {
            destroy(route('silabus.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters(search, selectedMapel, selectedJenjang, selectedKelas, selectedSemester);
    };

    const handleFilterChange = (key, value) => {
        let newMapel = selectedMapel;
        let newJenjang = selectedJenjang;
        let newKelas = selectedKelas;
        let newSemester = selectedSemester;

        if (key === 'mapel_id') { 
            setSelectedMapel(value); 
            newMapel = value; 
            // Jika ganti mapel dan ada kelas pasangan di accessible_pairs, sinkronkan kelasnya
            if (accessible_pairs && accessible_pairs.length > 0) {
                const pair = accessible_pairs.find(p => String(p.mapel_id) === String(value));
                if (pair) {
                    setSelectedKelas(String(pair.kelas_id));
                    newKelas = String(pair.kelas_id);
                }
            }
        }
        if (key === 'jenjang_id') { setSelectedJenjang(value); newJenjang = value; }
        if (key === 'kelas_id') { setSelectedKelas(value); newKelas = value; }
        if (key === 'semester') { setSelectedSemester(value); newSemester = value; }

        applyFilters(search, newMapel, newJenjang, newKelas, newSemester);
    };

    const applyFilters = (s, mapel, jenjang, kls, sem) => {
        router.get(route('silabus.index'), {
            search: s,
            mapel_id: mapel,
            jenjang_id: jenjang,
            kelas_id: kls,
            semester: sem
        }, { preserveState: true, preserveScroll: true });
    };

    // Buka Modal Edit
    const handleOpenEdit = (silabus) => {
        setEditingSilabus(silabus);
        editForm.setData({
            mapel_id: silabus.mapel_id || '',
            jenjang_id: silabus.jenjang_id || '',
            kelas_id: silabus.kelas_id || '',
            kurikulum: silabus.kurikulum || 'Merdeka',
            semester: silabus.semester || 'Ganjil',
            kode: silabus.kode || '',
            standar_kompetensi: silabus.standar_kompetensi || '',
            kompetensi: silabus.kompetensi || '',
            materi: silabus.materi || '',
            alokasi_waktu: silabus.alokasi_waktu || '',
            pekan: silabus.pekan !== null && silabus.pekan !== undefined ? silabus.pekan : '',
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingSilabus) return;
        editForm.put(route('silabus.update', editingSilabus.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setEditingSilabus(null);
            }
        });
    };

    // Buka Modal Add (Pre-filled dengan filter yang aktif)
    const handleOpenAdd = () => {
        const curMapel = selectedMapel || (mapels[0]?.id || '');
        const curKelas = selectedKelas || (kelas[0]?.id || '');
        const activeKelasObj = kelas.find(k => String(k.id) === String(curKelas));
        const curJenjang = selectedJenjang || (activeKelasObj?.jenjang_id || jenjangs[0]?.id || '');
        const semName = (selectedSemester === '2' || selectedSemester === 'Genap') ? 'Genap' : 'Ganjil';

        // Hitung perkiraan pekan berikutnya
        const maxPekan = silabuses.data.reduce((max, s) => {
            const num = parseInt(s.pekan);
            return !isNaN(num) && num > max ? num : max;
        }, 0);

        addForm.setData({
            mapel_id: String(curMapel),
            jenjang_id: String(curJenjang),
            kelas_id: String(curKelas),
            kurikulum: 'Merdeka',
            semester: semName,
            kode: '',
            standar_kompetensi: '',
            kompetensi: '',
            materi: '',
            alokasi_waktu: '2 JP',
            pekan: maxPekan > 0 ? String(maxPekan + 1) : '1',
        });
        setIsAddOpen(true);
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addForm.post(route('silabus.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddOpen(false);
                addForm.reset();
            }
        });
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        postImport(route('silabus.import'), {
            onSuccess: () => {
                setIsImportOpen(false);
                resetImport();
            },
        });
    };

    // Label Info Mapel & Kelas yang sedang aktif dilihat
    const activeMapelObj = mapels.find(m => String(m.id) === String(selectedMapel));
    const activeKelasObj = kelas.find(k => String(k.id) === String(selectedKelas));

    return (
        <MainLayout>
            <Head title="Silabus Pembelajaran" />

            <div className="space-y-6">
                {/* Header Utama */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Silabus Pembelajaran</h2>
                            {is_teacher && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                                    Mapel Pengampu
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Kelola alur materi, pekan pembelajaran, dan capaian kompetensi tanpa harus berpindah halaman.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tombol Import CSV */}
                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Upload className="mr-1.5 h-4 w-4" />
                                    Import CSV
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Import Silabus Massal</DialogTitle>
                                    <DialogDescription>
                                        Unggah file CSV untuk mengunggah silabus secara sekaligus.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleImportSubmit} className="space-y-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="template">Template</Label>
                                        <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                                            <a href={route('silabus.template')}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Unduh Template CSV
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="file">File CSV</Label>
                                        <Input
                                            id="file"
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={(e) => setImportData('file', e.target.files[0])}
                                        />
                                        {importErrors.file && (
                                            <p className="text-sm text-destructive">{importErrors.file}</p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={importProcessing}>
                                            {importProcessing ? 'Mengunggah...' : 'Import Sekarang'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Tombol Quick Add (Modal Langsung) */}
                        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Tambah Pekan / Materi
                        </Button>
                    </div>
                </div>

                {/* Info Bar Khusus Guru (Menampilkan Mapel & Kelas Terpilih) */}
                {activeMapelObj && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground font-medium">Mata Pelajaran & Kelas Aktif:</div>
                                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <span>{activeMapelObj.name}</span>
                                    {activeKelasObj && (
                                        <Badge variant="outline" className="bg-white/80 dark:bg-slate-800 font-semibold border-emerald-300 text-emerald-800 dark:text-emerald-300">
                                            Kelas {activeKelasObj.name}
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                        Semester {selectedSemester === '2' || selectedSemester === 'Genap' ? 'Genap' : 'Ganjil'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                            Total {silabuses.total || silabuses.data.length} pertemuan/pekan terdaftar
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <Card className="bg-muted/30 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                        <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Saring & Cari Silabus</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <form onSubmit={handleSearch}>
                                    <Input
                                        type="text"
                                        placeholder="Cari materi / KD..."
                                        className="pl-9 bg-background"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                            </div>

                            {/* Semester */}
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    value={selectedSemester}
                                    onChange={(e) => handleFilterChange('semester', e.target.value)}
                                >
                                    <option value="1">Semester Ganjil</option>
                                    <option value="2">Semester Genap</option>
                                </select>
                            </div>

                            {/* Mapel */}
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 font-medium"
                                    value={selectedMapel}
                                    onChange={(e) => handleFilterChange('mapel_id', e.target.value)}
                                >
                                    {!is_teacher && <option value="">Semua Mata Pelajaran</option>}
                                    {mapels.map((mapel) => (
                                        <option key={mapel.id} value={mapel.id}>{mapel.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Kelas */}
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    value={selectedKelas}
                                    onChange={(e) => handleFilterChange('kelas_id', e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {kelas.map((k) => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Jenjang */}
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    value={selectedJenjang}
                                    onChange={(e) => handleFilterChange('jenjang_id', e.target.value)}
                                >
                                    <option value="">Semua Jenjang</option>
                                    {jenjangs.map((jenjang) => (
                                        <option key={jenjang.id} value={jenjang.id}>{jenjang.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabel Data Silabus */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                                    <TableRow>
                                        <TableHead className="w-[60px] text-center pl-4 font-semibold">Pekan</TableHead>
                                        <TableHead className="w-[100px] text-center font-semibold">Waktu</TableHead>
                                        <TableHead className="min-w-[240px] font-semibold">Materi Pokok Pembelajaran</TableHead>
                                        <TableHead className="min-w-[240px] font-semibold">Kompetensi Dasar (KD / Capaian)</TableHead>
                                        <TableHead className="w-[120px] font-semibold">Mapel & Kelas</TableHead>
                                        <TableHead className="text-center w-[90px] pr-4 font-semibold">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {silabuses.data.length > 0 ? (
                                        silabuses.data.map((silabus, index) => (
                                            <TableRow key={silabus.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Pekan (Inline editable onBlur) */}
                                                <TableCell className="align-top py-3.5 pl-4 text-center">
                                                    <div className="inline-flex items-center justify-center">
                                                        <Input
                                                            type="number"
                                                            title="Ketik nomor pekan dan klik di luar untuk simpan instan"
                                                            className="h-8 w-14 text-center font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 rounded-lg p-0"
                                                            defaultValue={silabus.pekan !== null ? silabus.pekan : ''}
                                                            onBlur={(e) => {
                                                                const val = e.target.value;
                                                                if (val != silabus.pekan) {
                                                                    router.put(route('silabus.update', silabus.id), {
                                                                        pekan: val
                                                                    }, { preserveScroll: true, preserveState: true });
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    e.target.blur();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </TableCell>

                                                {/* Alokasi Waktu */}
                                                <TableCell className="align-top py-3.5 text-center">
                                                    <Badge variant="outline" className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
                                                        {silabus.alokasi_waktu || '2 JP'}
                                                    </Badge>
                                                </TableCell>

                                                {/* Materi Pokok */}
                                                <TableCell className="align-top py-3.5">
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                                                            {silabus.materi}
                                                        </div>
                                                        {silabus.standar_kompetensi && (
                                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                                <span className="font-medium text-slate-500">Standar:</span> {silabus.standar_kompetensi}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Kompetensi Dasar / Capaian */}
                                                <TableCell className="align-top py-3.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                    {silabus.kode ? (
                                                        <div className="flex items-start gap-2">
                                                            <Badge variant="secondary" className="font-mono text-[11px] h-5 px-1.5 shrink-0 bg-slate-200 dark:bg-slate-700">
                                                                {silabus.kode}
                                                            </Badge>
                                                            <span>{silabus.kompetensi}</span>
                                                        </div>
                                                    ) : (
                                                        silabus.kompetensi
                                                    )}
                                                </TableCell>

                                                {/* Mapel & Kelas */}
                                                <TableCell className="align-top py-3.5">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{silabus.mapel?.name}</span>
                                                        <div className="flex items-center gap-1">
                                                            {silabus.kelas && (
                                                                <Badge variant="outline" className="text-[10px] h-4.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                                                                    {silabus.kelas.name}
                                                                </Badge>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground">{silabus.semester}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Aksi: Quick Edit Modal & Hapus */}
                                                <TableCell className="align-top py-3.5 pr-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* Tombol Quick Edit (Membuka Modal di Halaman yang sama) */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Edit Cepat Silabus"
                                                            onClick={() => handleOpenEdit(silabus)}
                                                            className="h-8 w-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        {/* Tombol Hapus */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Hapus Baris"
                                                            onClick={() => handleDelete(silabus.id)}
                                                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                    <p className="font-medium text-sm">Belum ada rincian silabus untuk kriteria ini.</p>
                                                    <Button size="sm" onClick={handleOpenAdd} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        <Plus className="mr-1.5 h-4 w-4" />
                                                        Mulai Tambah Silabus Pekan 1
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Paginasi */}
                {silabuses.links && silabuses.links.length > 3 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Menampilkan {silabuses.from || 0} - {silabuses.to || 0} dari {silabuses.total || 0} silabus
                        </div>
                        <Pagination links={silabuses.links} />
                    </div>
                )}
            </div>

            {/* ================= MODAL QUICK EDIT (TIDAK PERLU PINDAH HALAMAN) ================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                            <Pencil className="h-5 w-5" />
                            Edit Cepat Silabus
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui rincian materi dan kompetensi tanpa harus meninggalkan halaman silabus.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        {/* Baris 1: Pekan & Alokasi Waktu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_pekan">Pekan Ke- <span className="text-destructive">*</span></Label>
                                <Input
                                    id="edit_pekan"
                                    type="number"
                                    placeholder="Contoh: 1"
                                    value={editForm.data.pekan}
                                    onChange={(e) => editForm.setData('pekan', e.target.value)}
                                    required
                                />
                                {editForm.errors.pekan && <p className="text-xs text-destructive">{editForm.errors.pekan}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_alokasi">Alokasi Waktu (JP)</Label>
                                <Input
                                    id="edit_alokasi"
                                    type="text"
                                    placeholder="Contoh: 2 JP"
                                    value={editForm.data.alokasi_waktu}
                                    onChange={(e) => editForm.setData('alokasi_waktu', e.target.value)}
                                />
                                {editForm.errors.alokasi_waktu && <p className="text-xs text-destructive">{editForm.errors.alokasi_waktu}</p>}
                            </div>
                        </div>

                        {/* Baris 2: Materi Pokok */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_materi">Materi Pokok Pembelajaran <span className="text-destructive">*</span></Label>
                            <textarea
                                id="edit_materi"
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Tuliskan topik / judul materi pembelajaran..."
                                value={editForm.data.materi}
                                onChange={(e) => editForm.setData('materi', e.target.value)}
                                required
                            />
                            {editForm.errors.materi && <p className="text-xs text-destructive">{editForm.errors.materi}</p>}
                        </div>

                        {/* Baris 3: Kompetensi Dasar / Capaian Pembelajaran */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="edit_kompetensi">Kompetensi Dasar (KD / Capaian) <span className="text-destructive">*</span></Label>
                                <span className="text-[11px] text-muted-foreground">Deskripsi spesifik terukur</span>
                            </div>
                            <textarea
                                id="edit_kompetensi"
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Uraian kompetensi yang diharapkan dikuasai santri/siswa..."
                                value={editForm.data.kompetensi}
                                onChange={(e) => editForm.setData('kompetensi', e.target.value)}
                                required
                            />
                            {editForm.errors.kompetensi && <p className="text-xs text-destructive">{editForm.errors.kompetensi}</p>}
                        </div>

                        {/* Baris 4: Standar Kompetensi / Capaian Umum (Opsional) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_standar">Standar Kompetensi / Capaian Umum (Opsional)</Label>
                            <textarea
                                id="edit_standar"
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Capaian umum pembelajaran (bila ada)..."
                                value={editForm.data.standar_kompetensi}
                                onChange={(e) => editForm.setData('standar_kompetensi', e.target.value)}
                            />
                        </div>

                        {/* Baris 5: Kode KD & Kurikulum */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kode">Kode KD / CP</Label>
                                <Input
                                    id="edit_kode"
                                    type="text"
                                    placeholder="Contoh: 3.1 atau CP.01"
                                    value={editForm.data.kode}
                                    onChange={(e) => editForm.setData('kode', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kurikulum">Kurikulum</Label>
                                <select
                                    id="edit_kurikulum"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    value={editForm.data.kurikulum}
                                    onChange={(e) => editForm.setData('kurikulum', e.target.value)}
                                >
                                    <option value="Merdeka">Kurikulum Merdeka</option>
                                    <option value="K13">Kurikulum 2013</option>
                                    <option value="KTSP">KTSP</option>
                                    <option value="Pesantren">Kurikulum Pesantren</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL QUICK ADD (PRE-FILLED, CEPAT & PRAKTIS) ================= */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                            <Plus className="h-5 w-5" />
                            Tambah Pekan / Materi Silabus
                        </DialogTitle>
                        <DialogDescription>
                            Tambahkan rencana pertemuan pembelajaran baru ke dalam silabus.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                        {/* Info Mapel & Kelas Target */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                                <span className="text-muted-foreground block">Mapel:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {mapels.find(m => String(m.id) === String(addForm.data.mapel_id))?.name || 'Pilih Mapel'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Kelas:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {kelas.find(k => String(k.id) === String(addForm.data.kelas_id))?.name || 'Pilih Kelas'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Semester:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {addForm.data.semester}
                                </span>
                            </div>
                        </div>

                        {/* Baris 1: Pekan & Alokasi Waktu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="add_pekan">Pekan Ke- <span className="text-destructive">*</span></Label>
                                <Input
                                    id="add_pekan"
                                    type="number"
                                    placeholder="Contoh: 1"
                                    value={addForm.data.pekan}
                                    onChange={(e) => addForm.setData('pekan', e.target.value)}
                                    required
                                />
                                {addForm.errors.pekan && <p className="text-xs text-destructive">{addForm.errors.pekan}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="add_alokasi">Alokasi Waktu (JP)</Label>
                                <Input
                                    id="add_alokasi"
                                    type="text"
                                    placeholder="Contoh: 2 JP"
                                    value={addForm.data.alokasi_waktu}
                                    onChange={(e) => addForm.setData('alokasi_waktu', e.target.value)}
                                />
                                {addForm.errors.alokasi_waktu && <p className="text-xs text-destructive">{addForm.errors.alokasi_waktu}</p>}
                            </div>
                        </div>

                        {/* Baris 2: Materi Pokok */}
                        <div className="space-y-1.5">
                            <Label htmlFor="add_materi">Materi Pokok Pembelajaran <span className="text-destructive">*</span></Label>
                            <textarea
                                id="add_materi"
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Tuliskan topik / judul materi pembelajaran..."
                                value={addForm.data.materi}
                                onChange={(e) => addForm.setData('materi', e.target.value)}
                                required
                            />
                            {addForm.errors.materi && <p className="text-xs text-destructive">{addForm.errors.materi}</p>}
                        </div>

                        {/* Baris 3: Kompetensi Dasar / Capaian Pembelajaran */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="add_kompetensi">Kompetensi Dasar (KD / Capaian) <span className="text-destructive">*</span></Label>
                                <span className="text-[11px] text-muted-foreground">Deskripsi spesifik terukur</span>
                            </div>
                            <textarea
                                id="add_kompetensi"
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Uraian kompetensi yang diharapkan dikuasai santri/siswa..."
                                value={addForm.data.kompetensi}
                                onChange={(e) => addForm.setData('kompetensi', e.target.value)}
                                required
                            />
                            {addForm.errors.kompetensi && <p className="text-xs text-destructive">{addForm.errors.kompetensi}</p>}
                        </div>

                        {/* Baris 4: Standar Kompetensi / Capaian Umum (Opsional) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="add_standar">Standar Kompetensi / Capaian Umum (Opsional)</Label>
                            <textarea
                                id="add_standar"
                                rows={2}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                placeholder="Capaian umum pembelajaran (bila ada)..."
                                value={addForm.data.standar_kompetensi}
                                onChange={(e) => addForm.setData('standar_kompetensi', e.target.value)}
                            />
                        </div>

                        {/* Baris 5: Kode KD & Kurikulum */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="add_kode">Kode KD / CP (Opsional)</Label>
                                <Input
                                    id="add_kode"
                                    type="text"
                                    placeholder="Contoh: 3.1 atau CP.01"
                                    value={addForm.data.kode}
                                    onChange={(e) => addForm.setData('kode', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="add_kurikulum">Kurikulum</Label>
                                <select
                                    id="add_kurikulum"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    value={addForm.data.kurikulum}
                                    onChange={(e) => addForm.setData('kurikulum', e.target.value)}
                                >
                                    <option value="Merdeka">Kurikulum Merdeka</option>
                                    <option value="K13">Kurikulum 2013</option>
                                    <option value="KTSP">KTSP</option>
                                    <option value="Pesantren">Kurikulum Pesantren</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={addForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {addForm.processing ? 'Menyimpan...' : 'Simpan Silabus'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

