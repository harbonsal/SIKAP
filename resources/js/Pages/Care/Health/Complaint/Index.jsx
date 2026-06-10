import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Search, Plus, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function Index({ complaints, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    // Search
    const handleSearch = (e) => {
        setSearch(e.target.value);
        router.get(
            route('health.complaints.index'),
            { search: e.target.value },
            { preserveState: true, replace: true }
        );
    };

    // Modal State
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    // Form
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const handleCreate = () => {
        setEditing(null);
        reset();
        setOpen(true);
    };

    const handleEdit = (complaint) => {
        setEditing(complaint);
        setData({
            name: complaint.name,
            description: complaint.description || '',
        });
        setOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('health.complaints.update', editing.id), {
                onSuccess: () => setOpen(false),
            });
        } else {
            post(route('health.complaints.store'), {
                onSuccess: () => setOpen(false),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            destroy(route('health.complaints.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Master Keluhan Kesehatan" />
            <div className="py-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Master Keluhan Kesehatan</h1>
                        <p className="text-gray-500">Daftar jenis keluhan, penyakit, atau gejala untuk data kesehatan.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari keluhan..."
                                className="pl-10"
                                value={search}
                                onChange={handleSearch}
                            />
                        </div>
                        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Keluhan
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Keluhan</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complaints.data.length > 0 ? (
                                    complaints.data.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell className="text-gray-500">{c.description || '-'}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                                                    <Edit className="h-4 w-4 text-indigo-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Modal */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Keluhan' : 'Tambah Keluhan'}</DialogTitle>
                            <DialogDescription>
                                {editing ? 'Perbarui informasi keluhan.' : 'Tambahkan jenis keluhan baru ke database.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nama Keluhan</Label>
                                <Input
                                    placeholder="Contoh: Demam, Batuk..."
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Keterangan (Opsional)</Label>
                                <Input
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={processing}>
                                    {editing ? 'Simpan Perubahan' : 'Simpan Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
