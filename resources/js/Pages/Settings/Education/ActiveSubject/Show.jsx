import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Save, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function Show({ activeClass, subjects, availableMapels, analysis }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.user_level?.name === 'Administrator';

    // Local state for bulk editing
    // We map initial subjects to local state to allow instant updates
    const [localSubjects, setLocalSubjects] = useState(subjects);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setLocalSubjects(subjects);
        setIsDirty(false);
    }, [subjects]);

    // Calculate totals dynamically from local state
    const totalAssignedHours = useMemo(() => {
        return localSubjects.reduce((acc, curr) => acc + (parseInt(curr.jam) || 0), 0);
    }, [localSubjects]);

    const targetHours = activeClass.total_hours_per_week || 35;
    const hourDiff = totalAssignedHours - targetHours;

    // Form for Adding Subject
    const { data, setData, post, processing, errors, reset } = useForm({
        active_class_id: activeClass.id,
        mapel_id: '',
        jam: 1,
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleRemove = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus mapel ini dari kelas?')) {
            router.delete(route('active-subjects.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const handleAddSubject = (e) => {
        e.preventDefault();
        post(route('active-subjects.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset('mapel_id', 'jam');
            },
        });
    };

    // Handle Inline Change
    const handleHourChange = (id, newJam) => {
        const val = parseInt(newJam);
        if (isNaN(val) || val < 0) return;

        setLocalSubjects(prev =>
            prev.map(sub => sub.id === id ? { ...sub, jam: val } : sub)
        );
        setIsDirty(true);
    };

    // Handle Bulk Save
    const handleBulkSave = () => {
        router.post(route('active-subjects.bulk-update'), {
            subjects: localSubjects.map(s => ({ id: s.id, jam: s.jam }))
        }, {
            onSuccess: () => setIsDirty(false),
            preserveScroll: true
        });
    };

    return (
        <MainLayout>
            <Head title={`Mapel Aktif ${activeClass.kelas?.name ?? ''}`} />

            <div className="space-y-6 pb-20"> {/* Add padding bottom for fixed footer */}
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('active-subjects.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                {activeClass.kelas?.name ?? 'Unknown Class'}
                            </h2>
                            <p className="text-muted-foreground">
                                {activeClass.academic_year?.name ?? ''} - {activeClass.academic_year?.semester ?? ''} • Pengaturan berlaku untuk semua kelas paralel
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center justify-center rounded-md bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Mapel
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Mata Pelajaran</th>
                                    <th className="px-6 py-3 font-medium w-32 text-center">Jam / Pekan</th>
                                    {isAdmin && <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {localSubjects.length > 0 ? (
                                    localSubjects.map((subject, index) => (
                                        <tr key={subject.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-center">{index + 1}</td>
                                            <td className="px-6 py-4 font-medium">{subject.mapel?.name ?? 'Unknown Subject'}</td>
                                            <td className="px-6 py-4 text-center">
                                                {isAdmin ? (
                                                    <input
                                                        type="number"
                                                        className="w-20 text-center rounded-md border px-2 py-1 focus:ring-2 focus:ring-primary focus:outline-none"
                                                        value={subject.jam}
                                                        onChange={(e) => handleHourChange(subject.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="inline-flex items-center justify-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                                        {subject.jam} Jam
                                                    </span>
                                                )}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleRemove(subject.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Hapus Mapel"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada mapel di kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Calculation & Validation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                            <Info className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <h4 className="font-semibold mb-1">Informasi Pengaturan Jam</h4>
                                <p>Total jam pelajaran per pekan adalah indikator beban belajar siswa. Standar KBM biasanya adalah <strong>{targetHours} Jam</strong> per pekan.</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">Ringkasan Jam</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                <span className="text-muted-foreground">Target / Standar</span>
                                <span className="font-medium">{targetHours} Jam</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                <span className="text-muted-foreground">Total Terisi</span>
                                <span className="font-bold text-xl">{totalAssignedHours} Jam</span>
                            </div>

                            {/* Status Indicator */}
                            <div className={`p-3 rounded-lg flex items-center gap-3 ${hourDiff === 0
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : hourDiff < 0
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {hourDiff === 0 ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Pas! Sesuai Standar.</span>
                                    </>
                                ) : hourDiff < 0 ? (
                                    <>
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Kurang {Math.abs(hourDiff)} Jam.</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Lebih {hourDiff} Jam.</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Save Footer */}
            {isAdmin && isDirty && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-40 animate-in slide-in-from-bottom">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Anda memiliki perubahan yang belum disimpan.
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setLocalSubjects(subjects);
                                    setIsDirty(false);
                                }}
                                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-accent text-foreground transition-colors"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={handleBulkSave}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subject Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md bg-background rounded-xl shadow-lg flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Tambah Mapel</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubject} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Mata Pelajaran <span className="text-destructive">*</span></label>
                                <select
                                    value={data.mapel_id}
                                    onChange={(e) => setData('mapel_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">Pilih Mapel</option>
                                    {availableMapels.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                {errors.mapel_id && <p className="text-sm text-destructive">{errors.mapel_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Jumlah Jam <span className="text-destructive">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.jam}
                                    onChange={(e) => setData('jam', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                />
                                {errors.jam && <p className="text-sm text-destructive">{errors.jam}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!data.mapel_id || processing}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
