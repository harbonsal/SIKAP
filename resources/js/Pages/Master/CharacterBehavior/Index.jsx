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
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

export default function Index({ behaviors, categories }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBehavior, setEditingBehavior] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const createForm = useForm({
        name: '',
        type: 'positive',
        point: 1,
        character_category_id: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        type: 'positive',
        point: 1,
        character_category_id: '',
        is_active: true,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('settings.master.character-behaviors.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (behavior) => {
        setEditingBehavior(behavior);
        editForm.setData({
            name: behavior.name,
            type: behavior.type,
            point: behavior.point,
            character_category_id: behavior.character_category_id ? String(behavior.character_category_id) : '',
            is_active: Boolean(behavior.is_active),
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        if (!editingBehavior) return;
        editForm.put(route('settings.master.character-behaviors.update', editingBehavior.id), {
            onSuccess: () => setEditingBehavior(null),
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus perilaku ini?')) {
            router.delete(route('settings.master.character-behaviors.destroy', id));
        }
    };

    const filteredBehaviors = behaviors.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <Head title="Master Perilaku Akhlak" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Master Aktualisasi Akhlak</h2>
                        <p className="text-muted-foreground">
                            Kelola daftar perilaku (amalan/pelanggaran) untuk penilaian harian.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Tambah Perilaku</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Perilaku Baru</DialogTitle>
                                <DialogDescription>
                                    Input item perilaku positif (amalan) atau negatif (pelanggaran).
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Perilaku</Label>
                                    <Input
                                        id="name"
                                        value={createForm.data.name}
                                        onChange={e => createForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Sholat Dhuha / Terlambat ke Masjid"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Tipe</Label>
                                        <Select value={createForm.data.type} onValueChange={v => createForm.setData('type', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="positive">Positif (Amalan)</SelectItem>
                                                <SelectItem value="negative">Negatif (Pelanggaran)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="point">Poin</Label>
                                        <Input
                                            id="point"
                                            type="number"
                                            value={createForm.data.point}
                                            onChange={e => createForm.setData('point', e.target.value)}
                                            placeholder="Contoh: 5 or -5"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori Akhlak (Opsional)</Label>
                                    <Select value={createForm.data.character_category_id} onValueChange={v => createForm.setData('character_category_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Dimensi (Opsional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                        <div className="w-full max-w-sm">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari perilaku..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Perilaku</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Poin</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBehaviors.length > 0 ? (
                                        filteredBehaviors.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.type === 'positive' ? 'default' : 'destructive'}>
                                                        {item.type === 'positive' ? 'Positif' : 'Negatif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.point}</TableCell>
                                                <TableCell>{item.category ? item.category.name : '-'}</TableCell>
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
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                Tidak ada data perilaku.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={!!editingBehavior} onOpenChange={(open) => !open && setEditingBehavior(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Perilaku</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nama Perilaku</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={e => editForm.setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipe</Label>
                                    <Select value={editForm.data.type} onValueChange={v => editForm.setData('type', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="positive">Positif (Amalan)</SelectItem>
                                            <SelectItem value="negative">Negatif (Pelanggaran)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-point">Poin</Label>
                                    <Input
                                        id="edit-point"
                                        type="number"
                                        value={editForm.data.point}
                                        onChange={e => editForm.setData('point', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Kategori Akhlak</Label>
                                <Select value={editForm.data.character_category_id} onValueChange={v => editForm.setData('character_category_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Dimensi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
        </MainLayout>
    );
}
