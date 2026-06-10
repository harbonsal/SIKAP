import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ArrowLeft, Plus, Search, Pencil, Trash2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';

export default function Index({ templates, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    // Create/Edit State
    const [isEdit, setIsEdit] = useState(false);
    const [open, setOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        id: '',
        message: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('health.description-templates.index'), { search });
    };

    const openCreate = () => {
        setIsEdit(false);
        reset();
        setOpen(true);
    };

    const openEdit = (template) => {
        setIsEdit(true);
        setData({
            id: template.id,
            message: template.message
        });
        setOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('health.description-templates.update', data.id), {
                onSuccess: () => setOpen(false)
            });
        } else {
            post(route('health.description-templates.store'), {
                onSuccess: () => setOpen(false)
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Hapus template ini?')) {
            router.delete(route('health.description-templates.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Keterangan Kesehatan" />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('health.records.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Template Keterangan</h1>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari template..."
                            className="pl-10"
                        />
                    </form>
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Template
                    </Button>
                </div>

                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.data.length > 0 ? (
                                templates.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.message}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                                    <Pencil className="h-4 w-4 text-orange-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                                        Belum ada data template.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEdit ? 'Edit Template' : 'Tambah Template'}</DialogTitle>
                            <DialogDescription>Masukkan kalimat keterangan yang sering digunakan.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Isi Keterangan</Label>
                                <Textarea
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    placeholder="Contoh: Perlu istirahat di asrama selama 1 hari."
                                    required
                                    rows={4}
                                />
                                {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={processing}><Save className="mr-2 h-4 w-4" /> Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
