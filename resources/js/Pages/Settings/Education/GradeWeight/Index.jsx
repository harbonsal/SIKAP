import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Percent, Save, Trash2, Plus, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Index({ weights, academicYears, selectedYearId, activeYearId, activeSemester }) {
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        academic_year_id: selectedYearId,
        category: 'pengetahuan',
        name: '',
        weight: '',
        semester: 'All', // Default for new items
    });

    // States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editWeight, setEditWeight] = useState('');
    const [selectedSemester, setSelectedSemester] = useState(activeSemester || 'Ganjil'); // View mode

    // Handlers
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('grade-weights.store'), {
            onSuccess: () => {
                reset('name', 'weight', 'semester');
                setIsAddModalOpen(false);
            },
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus bobot ini?')) {
            destroy(route('grade-weights.destroy', id));
        }
    };

    const startEditing = (weight) => {
        setEditingId(weight.id);
        setEditWeight(weight.weight);
    };

    const saveEditing = (id) => {
        router.put(route('grade-weights.update', id), {
            weight: editWeight,
            semester: weights.find(w => w.id === id)?.semester || 'All' // Preserve existing semester or pass explicitly if needed
        }, {
            onSuccess: () => setEditingId(null),
        });
    };

    const handleYearChange = (e) => {
        router.get(route('grade-weights.index'), {
            academic_year_id: e.target.value
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getDisplayName = (name) => {
        if (name.toUpperCase() === 'UAS/UKK' || name.toUpperCase() === 'UAS / UKK') {
            return selectedSemester?.toLowerCase().includes('genap') ? 'UKK' : 'UAS';
        }
        return name;
    };

    const renderCategory = (title, categoryKey) => {
        const allCategoryWeights = weights[categoryKey] || [];

        // Filter based on selected view semester
        const displayedWeights = allCategoryWeights.filter(w => {
            const wSem = w.semester?.toLowerCase() || 'all';
            const selSem = selectedSemester.toLowerCase();
            return wSem === 'all' || wSem === 'semua' || wSem === selSem;
        });

        const totalWeight = displayedWeights.reduce((sum, w) => sum + w.weight, 0);

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className={`text-sm font-medium ${totalWeight === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                        Total Bobot ({selectedSemester}): {totalWeight}%
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nama Komponen</th>
                                <th className="px-6 py-3 font-medium">Semester</th>
                                <th className="px-6 py-3 font-medium w-32">Bobot (%)</th>
                                <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayedWeights.length > 0 ? (
                                displayedWeights.map((weight) => (
                                    <tr key={weight.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            {getDisplayName(weight.name)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            <span className={`px-2 py-1 rounded-full ${weight.semester === 'All' || weight.semester === 'Semua' ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                                                {weight.semester}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === weight.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editWeight}
                                                        onChange={(e) => setEditWeight(e.target.value)}
                                                        className="flex h-8 w-20 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        min="1"
                                                        max="100"
                                                    />
                                                    <button onClick={() => saveEditing(weight.id)} className="text-green-600 hover:text-green-700"><Save className="h-4 w-4" /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-700"><X className="h-4 w-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between group">
                                                    <span>{weight.weight}%</span>
                                                    <button
                                                        onClick={() => startEditing(weight)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary text-xs underline"
                                                    >
                                                        Ubah
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(weight.id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                                        Belum ada bobot nilai untuk semester ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title="Persen Nilai (Bobot)" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Persen Nilai (Bobot)</h2>
                        <p className="text-muted-foreground">Atur bobot penilaian per semester.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Bobot
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-64">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tahun Ajaran</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedYearId || ''}
                            onChange={handleYearChange}
                        >
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.name} - {year.semester} {year.id === activeYearId ? '(Aktif)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Lihat Semester</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                        >
                            <option value="Ganjil">Semester Ganjil</option>
                            <option value="Genap">Semester Genap</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {renderCategory('Komponen Nilai Rapor', 'pengetahuan')}
                    {/* {renderCategory('Aspek Keterampilan (KI-4)', 'keterampilan')} */}
                </div>
            </div>

            {/* Add Weight Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-background rounded-xl shadow-lg flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Tambah Komponen Nilai</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Hidden Category Input - Default to 'pengetahuan' */}
                            <input type="hidden" value="pengetahuan" />

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Nama Komponen <span className="text-destructive">*</span></label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Contoh: UH1, UTS, UAS"
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Berlaku Untuk <span className="text-destructive">*</span></label>
                                <select
                                    value={data.semester}
                                    onChange={(e) => setData('semester', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="All">Semua Semester</option>
                                    <option value="Ganjil">Hanya Semester Ganjil</option>
                                    <option value="Genap">Hanya Semester Genap</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Bobot (%) <span className="text-destructive">*</span></label>
                                <input
                                    type="number"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Contoh: 20"
                                    min="1"
                                    max="100"
                                    required
                                />
                                {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
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
