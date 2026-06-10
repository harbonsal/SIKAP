import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Save, X, Clock } from 'lucide-react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';

export default function Index({ learningHours }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        hour_number: '',
        start_time: '',
        end_time: '',
    });

    const openModal = (hour = null) => {
        clearErrors();
        if (hour) {
            setEditingId(hour.id);
            setData({
                hour_number: hour.hour_number,
                start_time: hour.start_time.substring(0, 5), // Format HH:mm
                end_time: hour.end_time.substring(0, 5),
            });
        } else {
            setEditingId(null);
            // Auto-increment hour number suggestion
            const nextHour = learningHours.length > 0
                ? Math.max(...learningHours.map(h => h.hour_number)) + 1
                : 1;
            setData({
                hour_number: nextHour,
                start_time: '',
                end_time: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setEditingId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('learning-hours.update', editingId), {
                onSuccess: closeModal,
            });
        } else {
            post(route('learning-hours.store'), {
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus jam belajar ini?')) {
            router.delete(route('learning-hours.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Jam Belajar" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Jam Belajar</h2>
                        <p className="text-muted-foreground">Atur jadwal jam pelajaran sekolah.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Jam
                    </button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">No</TableHead>
                                    <TableHead className="text-center w-[100px]">Jam Ke-</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead className="text-center w-[120px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {learningHours.length > 0 ? (
                                    learningHours.map((hour, index) => (
                                        <TableRow key={hour.id}>
                                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                            <TableCell className="text-center font-bold text-lg">{hour.hour_number}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-secondary/50 rounded-full">
                                                        <Clock className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-mono text-base font-medium">
                                                        {hour.start_time.substring(0, 5)} - {hour.end_time.substring(0, 5)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openModal(hour)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(hour.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Belum ada data jam belajar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-background rounded-xl shadow-lg flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">
                                {editingId ? 'Edit Jam Belajar' : 'Tambah Jam Belajar'}
                            </h3>
                            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Jam Ke- <span className="text-destructive">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.hour_number}
                                    onChange={(e) => setData('hour_number', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                />
                                {errors.hour_number && <p className="text-sm text-destructive">{errors.hour_number}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Waktu Mulai <span className="text-destructive">*</span></label>
                                    <input
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                    {errors.start_time && <p className="text-sm text-destructive">{errors.start_time}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Waktu Selesai <span className="text-destructive">*</span></label>
                                    <input
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                    {errors.end_time && <p className="text-sm text-destructive">{errors.end_time}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
