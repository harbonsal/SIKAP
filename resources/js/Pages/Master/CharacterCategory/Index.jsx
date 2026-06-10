import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import Pagination from '@/Components/Pagination';
// import { useToast } from '@/Components/ui/use-toast';

export default function Index({ categories, filters }) {
    // const { toast } = useToast();
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Search Handler
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('master.character-categories.index'), { search }, { preserveState: true });
    };

    // Forms
    const createForm = useForm({
        name: '',
        type: 'rubric',
        description: '',
        min_score: '',
        max_score: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        type: 'rubric',
        description: '',
        min_score: '',
        max_score: '',
        is_active: true,
    });

    // Create Handler
    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('master.character-categories.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                // toast({ title: "Berhasil", description: "Kategori berhasil ditambahkan." });
            },
        });
    };

    // Edit Handler
    const openEdit = (category) => {
        setEditingCategory(category);
        editForm.setData({
            name: category.name,
            type: category.type || 'rubric',
            description: category.description || '',
            min_score: category.min_score || '',
            max_score: category.max_score || '',
            is_active: Boolean(category.is_active),
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!editingCategory) return;
        editForm.put(route('master.character-categories.update', editingCategory.id), {
            onSuccess: () => {
                setEditingCategory(null);
                // toast({ title: "Berhasil", description: "Kategori berhasil diperbarui." });
            },
        });
    };

    // Delete Handler
    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            router.delete(route('master.character-categories.destroy', id), {
                // onSuccess: () => toast({ title: "Berhasil", description: "Kategori berhasil dihapus." }),
            });
        }
    };

    return (
        <MainLayout>
            <Head title="Master Penilaian Akhlak" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Master Penilaian Akhlak</h2>
                        <p className="text-muted-foreground">
                            Kelola kategori penilaian akhlak santri.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Tambah Kategori</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Kategori Akhlak</DialogTitle>
                                <DialogDescription>
                                    Tambahkan item penilaian baru untuk laporan akhlak.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Kategori</Label>
                                    <Input
                                        id="name"
                                        value={createForm.data.name}
                                        onChange={e => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Ibadah"
                                        required
                                    />
                                    {createForm.errors.name && <p className="text-sm text-red-500">{createForm.errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipe</Label>
                                    <select
                                        id="type"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={createForm.data.type}
                                        onChange={e => createForm.setData('type', e.target.value)}
                                    >
                                        <option value="rubric">Rubrik Komentar</option>
                                        <option value="dimension">Dimensi Penilaian</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min">Min Nilai</Label>
                                        <Input
                                            id="min"
                                            type="number"
                                            value={createForm.data.min_score}
                                            onChange={e => createForm.setData('min_score', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max">Max Nilai</Label>
                                        <Input
                                            id="max"
                                            type="number"
                                            value={createForm.data.max_score}
                                            onChange={e => createForm.setData('max_score', e.target.value)}
                                            placeholder="100"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Deskripsi (Opsional)</Label>
                                    <Input
                                        id="desc"
                                        value={createForm.data.description}
                                        onChange={e => createForm.setData('description', e.target.value)}
                                        placeholder="Keterangan tambahan..."
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={createForm.data.is_active}
                                        onCheckedChange={val => createForm.setData('is_active', val)}
                                    />
                                    <Label htmlFor="active">Aktif</Label>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createForm.processing}>
                                        {createForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <form onSubmit={handleSearch} className="flex w-full gap-2">
                                <Input
                                    type="text"
                                    placeholder="Cari kategori..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">No</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Range Nilai</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.data.length > 0 ? (
                                        categories.data.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1 + categories.from - 1}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="max-w-xs truncate" title={item.description}>{item.description || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs border ${item.type === 'dimension' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                                        {item.type === 'dimension' ? 'Dimensi' : 'Rubrik'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {item.min_score !== null && item.max_score !== null ? (
                                                        <span className="font-mono text-xs">{item.min_score} - {item.max_score}</span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                Tidak ada data ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4">
                            <Pagination links={categories.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Kategori</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nama Kategori</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Ibadah"
                                    required
                                />
                                {editForm.errors.name && <p className="text-sm text-red-500">{editForm.errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type">Tipe</Label>
                                <select
                                    id="edit-type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={editForm.data.type}
                                    onChange={e => editForm.setData('type', e.target.value)}
                                >
                                    <option value="rubric">Rubrik Komentar</option>
                                    <option value="dimension">Dimensi Penilaian</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-min">Min Nilai</Label>
                                    <Input
                                        id="edit-min"
                                        type="number"
                                        value={editForm.data.min_score}
                                        onChange={e => editForm.setData('min_score', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-max">Max Nilai</Label>
                                    <Input
                                        id="edit-max"
                                        type="number"
                                        value={editForm.data.max_score}
                                        onChange={e => editForm.setData('max_score', e.target.value)}
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-desc">Deskripsi</Label>
                                <Input
                                    id="edit-desc"
                                    value={editForm.data.description}
                                    onChange={e => editForm.setData('description', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="edit-active"
                                    checked={editForm.data.is_active}
                                    onCheckedChange={val => editForm.setData('is_active', val)}
                                />
                                <Label htmlFor="edit-active">Aktif</Label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout >
    );
}
