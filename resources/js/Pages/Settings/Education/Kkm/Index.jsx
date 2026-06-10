import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Save, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import EmptyState from '@/Components/EmptyState';

export default function Index({ kkms, academicYears, mapels, kelases, classesSummary, selectedYearId, activeYearId, filters }) {
    const [selectedClassId, setSelectedClassId] = useState(filters?.kelas_id || '');
    const [kkmValues, setKkmValues] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        academic_year_id: selectedYearId,
        kelas_id: selectedClassId,
        kkms: {},
    });

    // Sync state with props when filters change
    useEffect(() => {
        setSelectedClassId(filters?.kelas_id || '');
    }, [filters?.kelas_id]);

    // Initialize KKM values
    useEffect(() => {
        if (selectedClassId && mapels.length > 0) {
            const classKkms = kkms[selectedClassId] || [];
            const initialValues = {};
            mapels.forEach(mapel => {
                const existingKkm = classKkms.find(k => k.mapel_id === mapel.id);
                initialValues[mapel.id] = existingKkm ? existingKkm.kkm_value : '';
            });
            setKkmValues(initialValues);
            setData(prev => ({
                ...prev,
                kelas_id: selectedClassId,
                kkms: initialValues
            }));
        } else {
            setKkmValues({});
        }
    }, [selectedClassId, kkms, mapels]);

    const handleYearChange = (e) => {
        router.get(route('kkms.index'), {
            academic_year_id: e.target.value,
            kelas_id: selectedClassId
        }, { preserveState: true });
    };

    const handleClassChange = (e) => {
        const newClassId = e.target.value;
        setSelectedClassId(newClassId);
        router.get(route('kkms.index'), {
            academic_year_id: selectedYearId,
            kelas_id: newClassId
        }, { preserveState: true });
    };

    const handleSelectClass = (classId) => {
        setSelectedClassId(classId);
        router.get(route('kkms.index'), {
            academic_year_id: selectedYearId,
            kelas_id: classId
        }, { preserveState: true });
    };

    const handleKkmChange = (mapelId, value) => {
        const newValues = { ...kkmValues, [mapelId]: value };
        setKkmValues(newValues);
        setData('kkms', newValues);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('kkms.store'), {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: show toast
            },
        });
    };

    return (
        <MainLayout>
            <Head title="KKM" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kriteria Ketuntasan Minimal</h2>
                        <p className="text-muted-foreground">Atur standar nilai minimal per mata pelajaran dan kelas.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-64">
                        <label className="text-sm font-medium mb-1.5 block">Tahun Pelajaran</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

                    <div className="w-full sm:w-64">
                        <label className="text-sm font-medium mb-1.5 block">Pilih Kelas</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedClassId}
                            onChange={handleClassChange}
                        >
                            <option value="">-- Lihat Ringkasan --</option>
                            {kelases.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.name} - {kelas.jenjang?.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedClassId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Input KKM: {kelases.find(k => k.id == selectedClassId)?.name}</CardTitle>
                            <CardDescription>
                                Masukkan nilai KKM (0-100) untuk setiap mata pelajaran.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px] text-center">No</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead className="text-center w-[150px]">Nilai KKM</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mapels.length > 0 ? (
                                                mapels.map((mapel, index) => (
                                                    <TableRow key={mapel.id}>
                                                        <TableCell className="text-center font-medium">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {mapel.name}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-center shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                value={kkmValues[mapel.id] || ''}
                                                                onChange={(e) => handleKkmChange(mapel.id, e.target.value)}
                                                                placeholder="0"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-64 text-center">
                                                        <EmptyState
                                                            title="Belum ada mata pelajaran"
                                                            description="Belum ada mata pelajaran aktif untuk kelas ini."
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan Input KKM</CardTitle>
                            <CardDescription>
                                Daftar status pengisian KKM untuk semua kelas per jenjang.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead>Kelas</TableHead>
                                        <TableHead>Jenjang</TableHead>
                                        <TableHead className="text-center">Progress Mapel</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center w-[120px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classesSummary && classesSummary.length > 0 ? (
                                        classesSummary.map((summary, index) => (
                                            <TableRow key={summary.id}>
                                                <TableCell className="text-center font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    {summary.name}
                                                </TableCell>
                                                <TableCell>
                                                    {summary.jenjang}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">
                                                        {summary.filled_kkm} / {summary.total_mapel}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {summary.is_complete ? (
                                                        <div className="inline-flex items-center rounded-full border border-transparent bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                                                            Lengkap
                                                        </div>
                                                    ) : summary.filled_kkm > 0 ? (
                                                        <div className="inline-flex items-center rounded-full border border-transparent bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-600">
                                                            Sebagian
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center rounded-full border border-transparent bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                                            Belum Ada
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <button
                                                        onClick={() => handleSelectClass(summary.id)}
                                                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    >
                                                        Atur KKM
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <EmptyState
                                                    title="Tidak ada data kelas"
                                                    description="Belum ada kelas yang terdaftar untuk jenjang ini."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
