import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Search, Printer, FileText, X, Save, FileEdit, Filter } from 'lucide-react';
import { useState } from 'react';
import Pagination from '@/Components/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
// import { Label } from "@/Components/ui/label"; // Removed
// import { Textarea } from "@/Components/ui/textarea"; // Removed
import EmptyState from '@/Components/EmptyState';

export default function Index({ students, activeClasses, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClassId, setSelectedClassId] = useState(filters.active_class_id || '');

    // Search properties
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('reports.index'), { search, active_class_id: selectedClassId, semester: filters.semester, type: filters.type }, { preserveState: true });
    };

    const handleFilterChange = (e) => {
        const classId = e.target.value;
        setSelectedClassId(classId);
        router.get(route('reports.index'), { search, active_class_id: classId, semester: filters.semester, type: filters.type }, { preserveState: true });
    };
    // Note Modal State (Restored)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        student_id: '',
        active_class_id: '',
        note: '',
        semester: '',
    });

    const openNoteModal = (student) => {
        setEditingStudent(student);
        setData({
            student_id: student.id,
            active_class_id: student.active_class_id,
            note: student.note_content || '',
            semester: filters.semester || 'Ganjil',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
        reset();
    };

    const submitNote = (e) => {
        e.preventDefault();
        post(route('reports.store-note'), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
            }
        });
    };

    const currentSemester = filters.semester || 'Ganjil';
    const displaySemester = currentSemester === 'Ganjil' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';

    return (
        <MainLayout>
            <Head title={`Cetak Rapor - ${displaySemester}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {filters.type === 'ijazah' ? 'Cetak Ijazah' : 'Cetak Rapor'} <span className="text-muted-foreground text-xl font-normal"> / {displaySemester}</span>
                        </h2>
                        <p className="text-muted-foreground">Kelola catatan wali kelas dan cetak rapor santri.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari nama atau NIS santri..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        />
                    </div>
                    <div className="w-full sm:w-[250px] relative">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedClassId}
                            onChange={handleFilterChange}
                        >
                            <option value="">Semua Kelas</option>
                            {activeClasses.map(activeClass => (
                                <option key={activeClass.id} value={activeClass.id}>
                                    {activeClass.kelas.name} {activeClass.kelas_paralel?.name || ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-[200px] relative">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                            value={filters.semester || 'Ganjil'}
                            onChange={(e) => router.get(route('reports.index'), { ...filters, semester: e.target.value }, { preserveState: true })}
                        >
                            <option value="Ganjil">Semester 1 (Ganjil)</option>
                            <option value="Genap">Semester 2 (Genap)</option>
                        </select>
                    </div>
                </div>

                <Card>
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base font-semibold">Daftar Santri</CardTitle>
                        <CardDescription>
                            Daftar santri aktif di semester ini. Anda dapat menambahkan catatan dan mencetak rapor.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead>Identitas Santri</TableHead>
                                    <TableHead>Kelas</TableHead>
                                    <TableHead className="text-center w-[150px]">Status Catatan</TableHead>
                                    <TableHead className="text-right w-[200px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.data.length > 0 ? (
                                    students.data.map((student, index) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="text-center font-medium">
                                                {(students.current_page - 1) * students.per_page + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{student.name}</span>
                                                    <span className="text-xs text-muted-foreground">NIS: {student.nis}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{student.kelas}</span>
                                                    <span className="text-xs text-muted-foreground">{student.jenjang}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {student.has_note ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                                        Sudah Ada
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground hover:bg-muted">
                                                        Belum Ada
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {filters.type !== 'ijazah' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openNoteModal(student)}
                                                            className="h-8"
                                                        >
                                                            <FileEdit className="mr-2 h-3.5 w-3.5" />
                                                            Catatan
                                                        </Button>
                                                    )}
                                                    <a
                                                        href={route('reports.print', {
                                                            student: student.id,
                                                            semester: currentSemester,
                                                            type: filters.type // Pass type if exists
                                                        })}
                                                        target="_blank"
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                                                    >
                                                        <Printer className="mr-2 h-3.5 w-3.5" />
                                                        {filters.type === 'ijazah' ? 'Cetak Ijazah' : 'Cetak Rapor'}
                                                    </a>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <EmptyState
                                                title="Tidak ada data santri"
                                                description="Tidak ada data santri ditemukan. Coba ubah filter pencarian."
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={students.links} />
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Catatan Wali Kelas</DialogTitle>
                        <DialogDescription>
                            Tambahkan catatan motivasi atau evaluasi untuk <b>{editingStudent?.name}</b>.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitNote} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label htmlFor="note" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Isi Catatan
                            </label>
                            <textarea
                                id="note"
                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Tuliskan catatan motivasi, saran, atau evaluasi perkembangan santri..."
                                value={data.note}
                                onChange={(e) => setData('note', e.target.value)}
                                required
                                autoFocus
                            />
                            {errors.note && <p className="text-sm text-destructive font-medium">{errors.note}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Catatan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
