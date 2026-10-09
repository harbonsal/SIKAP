import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Save, ArrowLeft, History, UsersRound, Pencil, Trash2, X, Check } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function GroupLog({ logs, isAdmin, currentUserId }) {

    // ── Form tambah baru ────────────────────────────────────────────────────
    const { data, setData, post, processing, errors, reset } = useForm({
        date: new Date().toISOString().split('T')[0],
        location: '',
        topic: '',
        notes: '',
        students: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('musyrif-tarbiyah.group.store'), {
            onSuccess: () => reset('location', 'topic', 'notes', 'students'),
        });
    };

    // ── Form edit inline ────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState(null);
    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        date: '',
        location: '',
        topic: '',
        notes: '',
    });

    const startEdit = (log) => {
        setEditingId(log.id);
        setEditData({
            date: log.date,
            location: log.location || '',
            topic: log.topic || '',
            notes: log.notes || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetEdit();
    };

    const submitEdit = (e, logId) => {
        e.preventDefault();
        put(route('musyrif-tarbiyah.group.update', logId), {
            onSuccess: () => {
                setEditingId(null);
                resetEdit();
            },
        });
    };

    // ── Hapus ───────────────────────────────────────────────────────────────
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = (logId) => {
        if (!confirm('Yakin ingin menghapus catatan ini?')) return;
        setDeletingId(logId);
        router.delete(route('musyrif-tarbiyah.group.destroy', logId), {
            onFinish: () => setDeletingId(null),
        });
    };

    // Cek hak akses edit/hapus (pakai == untuk toleransi int vs string)
    const canModify = (log) => isAdmin || log.user_id == currentUserId;

    return (
        <MainLayout>
            <Head title="Jurnal Kelompok (Halaqoh)" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('musyrif-tarbiyah.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white shadow-sm hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Jurnal Kelompok (Halaqoh)</h1>
                        <p className="text-sm text-gray-500">
                            Catat pertemuan atau pendampingan yang dilakukan secara berkelompok.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
                    {/* ── Form Tambah Baru ── */}
                    <div className="rounded-xl border bg-white shadow-sm p-6 h-fit">
                        <h2 className="text-lg font-semibold border-b pb-4 mb-4">Input Pertemuan Baru</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="date" value="Tanggal Pertemuan" />
                                <input
                                    type="date"
                                    id="date"
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="location" value="Tempat/Lokasi" />
                                <input
                                    type="text"
                                    id="location"
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Contoh: Masjid, Kamar Asrama..."
                                />
                                <InputError message={errors.location} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="topic" value="Topik Bahasan / Agenda" />
                                <input
                                    type="text"
                                    id="topic"
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    value={data.topic}
                                    onChange={(e) => setData('topic', e.target.value)}
                                    placeholder="Contoh: Adab Makan, Evaluasi Hafalan..."
                                />
                                <InputError message={errors.topic} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Catatan / Kesimpulan" />
                                <textarea
                                    id="notes"
                                    rows={4}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Tuliskan jalannya pertemuan atau hal-hal penting..."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-800">
                                <strong>Catatan:</strong> Input santri yang hadir untuk Jurnal Kelompok saat ini sedang dalam pengembangan UI.
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Jurnal Kelompok
                            </button>
                        </form>
                    </div>

                    {/* ── Riwayat ── */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-semibold text-lg text-gray-800 flex items-center">
                                <History className="mr-2 h-5 w-5 text-gray-500" />
                                Riwayat Pertemuan Kelompok
                            </h2>
                        </div>
                        <div className="p-4">
                            {logs.length > 0 ? (
                                <div className="space-y-4">
                                    {logs.map((log) =>
                                        editingId === log.id ? (
                                            /* ── Form Edit Inline ── */
                                            <form
                                                key={log.id}
                                                onSubmit={(e) => submitEdit(e, log.id)}
                                                className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50 space-y-3"
                                            >
                                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                                    ✏️ Mode Edit
                                                </p>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <InputLabel value="Tanggal" className="text-xs" />
                                                        <input
                                                            type="date"
                                                            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            value={editData.date}
                                                            onChange={(e) => setEditData('date', e.target.value)}
                                                            required
                                                        />
                                                        <InputError message={editErrors.date} className="mt-1" />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Lokasi" className="text-xs" />
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            value={editData.location}
                                                            onChange={(e) => setEditData('location', e.target.value)}
                                                            placeholder="Lokasi..."
                                                        />
                                                        <InputError message={editErrors.location} className="mt-1" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <InputLabel value="Topik" className="text-xs" />
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        value={editData.topic}
                                                        onChange={(e) => setEditData('topic', e.target.value)}
                                                        placeholder="Topik bahasan..."
                                                    />
                                                    <InputError message={editErrors.topic} className="mt-1" />
                                                </div>

                                                <div>
                                                    <InputLabel value="Catatan" className="text-xs" />
                                                    <textarea
                                                        rows={3}
                                                        className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        value={editData.notes}
                                                        onChange={(e) => setEditData('notes', e.target.value)}
                                                        placeholder="Catatan pertemuan..."
                                                    />
                                                    <InputError message={editErrors.notes} className="mt-1" />
                                                </div>

                                                <div className="flex gap-2 justify-end pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                        Batal
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={editProcessing}
                                                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Simpan Perubahan
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            /* ── Tampilan Normal ── */
                                            <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-blue-700 text-lg">
                                                            {log.topic || 'Tanpa Topik'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {log.date} • {log.location || 'Lokasi Tidak Ditentukan'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-3 shrink-0">
                                                        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                                                            <UsersRound className="w-3 h-3 mr-1" />
                                                            {log.attendances?.length || 0} Hadir
                                                        </div>
                                                        {canModify(log) && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEdit(log)}
                                                                    title="Edit catatan"
                                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(log.id)}
                                                                    disabled={deletingId === log.id}
                                                                    title="Hapus catatan"
                                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-3 bg-gray-100 p-3 rounded-md">
                                                    {log.notes || <span className="italic text-gray-400">Tidak ada catatan spesifik.</span>}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-gray-500 border-2 border-dashed rounded-xl">
                                    Belum ada riwayat pertemuan kelompok.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
