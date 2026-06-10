import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Pencil, Trash2, Plus, GripVertical } from 'lucide-react';

export default function Index({ questions }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        question: '',
        order: 0,
        is_active: true,
    });

    const openCreate = () => {
        setEditingQuestion(null);
        reset();
        setData('order', questions.length + 1);
        clearErrors();
        setIsCreateOpen(true);
    };

    const openEdit = (q) => {
        setEditingQuestion(q);
        setData({
            question: q.question,
            order: q.order,
            is_active: Boolean(q.is_active),
        });
        clearErrors();
        setIsCreateOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingQuestion) {
            put(route('supervision-settings.student-questionnaires.update', editingQuestion.id), {
                onSuccess: () => setIsCreateOpen(false),
            });
        } else {
            post(route('supervision-settings.student-questionnaires.store'), {
                onSuccess: () => setIsCreateOpen(false),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
            router.delete(route('supervision-settings.student-questionnaires.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Angket Santri" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Angket Santri</h2>
                    <p className="text-muted-foreground">Kelola daftar pertanyaan untuk kuesioner evaluasi pembelajaran oleh santri.</p>
                </div>

                <div className="flex justify-end">
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Pertanyaan
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Urutan</TableHead>
                                    <TableHead>Pertanyaan</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.length > 0 ? (
                                    questions.map((q) => (
                                        <TableRow key={q.id}>
                                            <TableCell>{q.order}</TableCell>
                                            <TableCell className="font-medium">{q.question}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${q.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                                    {q.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(q.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Belum ada pertanyaan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="question">Pertanyaan</Label>
                                <Input
                                    id="question"
                                    value={data.question}
                                    onChange={(e) => setData('question', e.target.value)}
                                    placeholder="Contoh: Apakah ustadz hadir tepat waktu?"
                                />
                                {errors.question && <p className="text-sm text-red-500">{errors.question}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="order">Urutan</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={data.order}
                                        onChange={(e) => setData('order', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Label>Status Aktif</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={processing}>{editingQuestion ? 'Simpan Perubahan' : 'Simpan'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
