import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, BookOpen, FileText, Upload, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import Pagination from '@/Components/Pagination';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";

export default function Index({ silabuses, mapels, jenjangs, kelas, filters }) {
    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedMapel, setSelectedMapel] = useState(filters.mapel_id || '');
    const [selectedJenjang, setSelectedJenjang] = useState(filters.jenjang_id || '');
    const [selectedKelas, setSelectedKelas] = useState(filters.kelas_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || '');

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data silabus ini?')) {
            destroy(route('silabus.destroy', id));
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

        if (key === 'mapel_id') { setSelectedMapel(value); newMapel = value; }
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

    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({
        file: null,
    });

    const [isImportOpen, setIsImportOpen] = useState(false);

    const handleImportSubmit = (e) => {
        e.preventDefault();
        postImport(route('silabus.import'), {
            onSuccess: () => {
                setIsImportOpen(false);
                resetImport();
            },
        });
    };

    return (
        <MainLayout>
            <Head title="Silabus & Kurikulum" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Silabus & Kurikulum</h2>
                        <p className="text-muted-foreground">Kelola standar kompetensi dan materi pembelajaran.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild>
                            <a href="#">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Panduan
                            </a>
                        </Button>

                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import CSV
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Import Silabus</DialogTitle>
                                    <DialogDescription>
                                        Unggah file CSV untuk menambahkan silabus secara massal. Pastikan format sesuai template.
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
                                            {importProcessing ? 'Mengunggah...' : 'Import'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <Button asChild>
                            <Link href={route('silabus.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Silabus
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="bg-muted/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filter Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <form onSubmit={handleSearch}>
                                    <Input
                                        type="text"
                                        placeholder="Cari kompetensi..."
                                        className="pl-9 bg-background"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedSemester}
                                    onChange={(e) => handleFilterChange('semester', e.target.value)}
                                >
                                    <option value="">Semua Semester</option>
                                    <option value="1">Ganjil</option>
                                    <option value="2">Genap</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedMapel}
                                    onChange={(e) => handleFilterChange('mapel_id', e.target.value)}
                                >
                                    <option value="">Semua Mapel</option>
                                    {mapels.map((mapel) => (
                                        <option key={mapel.id} value={mapel.id}>{mapel.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedJenjang}
                                    onChange={(e) => handleFilterChange('jenjang_id', e.target.value)}
                                >
                                    <option value="">Semua Jenjang</option>
                                    {jenjangs.map((jenjang) => (
                                        <option key={jenjang.id} value={jenjang.id}>{jenjang.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedKelas}
                                    onChange={(e) => handleFilterChange('kelas_id', e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {kelas.map((k) => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center pl-4">No</TableHead>
                                        <TableHead className="text-center w-[100px]">Pekan</TableHead>
                                        <TableHead>Mapel & Jenjang</TableHead>
                                        <TableHead>Kelas</TableHead>
                                        <TableHead className="min-w-[200px]">Materi Pokok</TableHead>
                                        <TableHead className="min-w-[200px]">Standar Kompetensi</TableHead>
                                        <TableHead className="min-w-[200px]">Kompetensi Dasar (KD)</TableHead>
                                        <TableHead className="text-center w-[100px] pr-4">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {silabuses.data.length > 0 ? (
                                        silabuses.data.map((silabus, index) => (
                                            <TableRow key={silabus.id} className="hover:bg-muted/10">
                                                <TableCell className="text-center align-top py-4 pl-4">
                                                    {(silabuses.current_page - 1) * silabuses.per_page + index + 1}
                                                </TableCell>
                                                <TableCell className="align-top py-4">
                                                    <Input
                                                        type="number"
                                                        className="h-8 w-16 mx-auto text-center"
                                                        defaultValue={silabus.pekan || ''}
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
                                                </TableCell>
                                                <TableCell className="align-top py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-foreground">{silabus.mapel.name}</span>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Badge variant="outline" className="text-[10px] h-5">{silabus.jenjang.name}</Badge>
                                                            <span>{silabus.semester}</span>
                                                        </div>
                                                        <div className="mt-1">
                                                            <Badge variant="secondary" className="text-[10px] font-normal">{silabus.kurikulum}</Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top py-4">
                                                    {silabus.kelas ? (
                                                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                                            {silabus.kelas.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top py-4 font-medium">
                                                    {silabus.materi}
                                                </TableCell>
                                                <TableCell className="align-top py-4 text-sm text-muted-foreground">
                                                    {silabus.standar_kompetensi || <span className="italic opacity-50">-</span>}
                                                </TableCell>
                                                <TableCell className="align-top py-4 font-mono text-sm">
                                                    {silabus.kode ? (
                                                        <div className="flex items-start gap-2">
                                                            <Badge variant="outline" className="font-mono">{silabus.kode}</Badge>
                                                            <span>{silabus.kompetensi}</span>
                                                        </div>
                                                    ) : (
                                                        silabus.kompetensi
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center align-top py-4 pr-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:text-primary">
                                                            <Link href={route('silabus.edit', silabus.id)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(silabus.id)}
                                                            className="h-8 w-8 hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                    <p>Belum ada data silabus yang ditemukan.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={silabuses.links} />
                </div>
            </div>
        </MainLayout>
    );
}
