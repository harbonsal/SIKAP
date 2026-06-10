import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';

export default function IjazahCandidatesIndex({ candidates }) {
    const [editingStudent, setEditingStudent] = useState(null);
    const { data, setData, post, processing, reset } = useForm({
        birth_place_ar: '',
        nama_arab: ''
    });

    const openEditModal = (student) => {
        setEditingStudent(student);
        setData({
            birth_place_ar: student.birth_place_ar || '',
            nama_arab: student.nama_arab || ''
        });
    };

    const handleUpdateBiodata = (e) => {
        e.preventDefault();
        post(route('settings.education.ijazah.biodata.update', editingStudent.id), {
            onSuccess: () => {
                setEditingStudent(null);
                reset();
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Manajemen Ijazah" />
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold">Manajemen Ijazah</h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                            href={route('settings.education.ijazah.collective-biodata')}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Edit Biodata Kolektif
                        </a>
                        <a
                            href={route('settings.education.ijazah.collective')}
                            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                            Input Nilai Kolektif
                        </a>
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle>Daftar Calon Lulusan (Kelas 3 Tsanawy)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="p-4 font-medium">No</th>
                                        <th className="p-4 font-medium">Nama Siswa / Arab</th>
                                        <th className="p-4 font-medium">Tempat Lahir Arab</th>
                                        <th className="p-4 font-medium">Kelas</th>
                                        <th className="p-4 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates && candidates.length > 0 ? (
                                        candidates.map((student, i) => (
                                            <tr key={student.id} className="border-t hover:bg-muted/50">
                                                <td className="p-4">{i + 1}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold">{student.name}</div>
                                                    <div className="text-xs text-muted-foreground" dir="rtl">{student.nama_arab || '-'}</div>
                                                </td>
                                                <td className="p-4" dir="rtl">
                                                    {student.birth_place_ar || '-'}
                                                </td>
                                                <td className="p-4">{student.class_name}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditModal(student)}
                                                        >
                                                            Edit Biodata
                                                        </Button>
                                                        <a
                                                            href={route('settings.education.ijazah.manual-grades', student.id)}
                                                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
                                                        >
                                                            Input Nilai
                                                        </a>
                                                        <a
                                                            href={route('settings.education.ijazah.print', student.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                                                        >
                                                            Cetak
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                Tidak ada siswa kelas 3 Tsanawy ditemukan pada tahun ajaran aktif.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Biodata Arab</DialogTitle>
                        </DialogHeader>
                        {editingStudent && (
                            <form onSubmit={handleUpdateBiodata} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Arab</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={data.nama_arab}
                                        onChange={e => setData('nama_arab', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tempat Lahir (Arab)</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={data.birth_place_ar}
                                        onChange={e => setData('birth_place_ar', e.target.value)}
                                        placeholder="Contoh: بيكاسي"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
