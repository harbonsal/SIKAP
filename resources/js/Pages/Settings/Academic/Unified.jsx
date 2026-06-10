import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Save, Plus, Pencil, Trash2, Copy, Calendar, Settings, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import Pagination from '@/Components/Pagination';
import { useDebounce } from 'use-debounce';

export default function Unified({ 
    academicYears, 
    allAcademicYears = [],
    semesters, 
    activeAcademicYearId, 
    activeSemesterId,
    scheduleData,
    filters = {}
}) {
    const [activeTab, setActiveTab] = useState('list');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    // Tab 1: List Tahun Pelajaran
    const [searchTermList, setSearchTermList] = useState(filters?.search || '');
    const [debouncedSearchList] = useDebounce(searchTermList, 300);

    useState(() => {
        const serverSearch = filters?.search || '';
        if (debouncedSearchList !== serverSearch) {
            router.get(
                route('settings.academic.index'),
                { search: debouncedSearchList },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearchList]);

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus Tahun Pelajaran ini?')) {
            router.delete(route('academic-years.destroy', id));
        }
    };

    // Tab 2: Pengaturan Aktif
    const { data: activeData, setData: setActiveData, post: activePost, processing: activeProcessing, errors: activeErrors } = useForm({
        academic_year_id: activeAcademicYearId || '',
        semester_id: activeSemesterId || '',
    });

    const submitActive = (e) => {
        e.preventDefault();
        activePost(route('settings.academic.store'));
    };

    // Tab 3: Persiapan Tahun
    const [preparationSourceId, setPreparationSourceId] = useState(scheduleData?.preparationSourceYears?.[0]?.id ? String(scheduleData.preparationSourceYears[0].id) : '');
    const [preparingAction, setPreparingAction] = useState(null);

    const runPreparationCopy = (routeName) => {
        if (!preparationSourceId) {
            alert('Pilih Tahun Sumber terlebih dahulu');
            return;
        }

        if (!confirm('Apakah Anda yakin ingin menyalin data? Data yang ada akan ditimpar.')) {
            return;
        }

        setPreparingAction(routeName);
        router.post(route(routeName), {
            source_year_id: preparationSourceId,
        }, {
            preserveScroll: true,
            onFinish: () => setPreparingAction(null),
        });
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Tahun Pelajaran" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan Tahun Pelajaran</h2>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Daftar TP
                        </TabsTrigger>
                        <TabsTrigger value="active" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            TP Aktif
                        </TabsTrigger>
                        <TabsTrigger value="preparation" className="flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            Persiapan
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Daftar Tahun Pelajaran */}
                    <TabsContent value="list" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Cari TP..."
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={searchTermList}
                                    onChange={(e) => setSearchTermList(e.target.value)}
                                />
                            </div>
                            <Link
                                href={route('academic-years.create')}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah TP
                            </Link>
                        </div>

                        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tahun Pelajaran</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status Sistem</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status TP</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {academicYears?.data?.length > 0 ? (
                                            academicYears.data.map((tp) => (
                                                <tr key={tp.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle font-medium">{tp.name}</td>
                                                    <td className="p-4 align-middle">
                                                        {tp.is_active ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-green-600 text-white">
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                                                                Tidak Aktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        {tp.status === 'active' ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-emerald-600 text-white">
                                                                SIAP
                                                            </span>
                                                        ) : tp.status === 'draft' ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-amber-500 text-white">
                                                                DRAFT
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-slate-500 text-white">
                                                                ARSIP
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={route('academic-years.edit', tp.id)}
                                                                className="inline-flex items-center justify-center rounded-md text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(tp.id)}
                                                                disabled={tp.is_active}
                                                                className="inline-flex items-center justify-center rounded-md text-sm border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-8 w-8 disabled:opacity-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                                    Tidak ada data Tahun Pelajaran.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {academicYears?.links && (
                            <div className="mt-4">
                                <Pagination links={academicYears.links} />
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab 2: TP & Semester Aktif */}
                    <TabsContent value="active" className="space-y-4">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm max-w-2xl">
                            <div className="border-b bg-amber-50/50 p-4">
                                <p className="text-sm text-amber-600 font-medium">
                                    ⚠️ Perhatian: Pengaturan ini mengubah tahun aktif untuk SELURUH SEKOLAH.
                                    Gunakan hanya saat pergantian tahun ajaran/semester baru.
                                </p>
                            </div>
                            <div className="p-6">
                                <form onSubmit={submitActive} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="academic_year_id">
                                            Tahun Pelajaran Aktif
                                        </label>
                                        <select
                                            id="academic_year_id"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={activeData.academic_year_id}
                                            onChange={(e) => setActiveData('academic_year_id', e.target.value)}
                                        >
                                            <option value="">Pilih Tahun Pelajaran</option>
                                            {allAcademicYears.map((tp) => (
                                                <option key={tp.id} value={tp.id}>
                                                    {tp.name}
                                                </option>
                                            ))}
                                        </select>
                                        {activeErrors.academic_year_id && <p className="text-sm text-destructive">{activeErrors.academic_year_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="semester_id">
                                            Semester Aktif
                                        </label>
                                        <div className="flex gap-4">
                                            {semesters?.map((sem) => (
                                                <div key={sem.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id={`semester-${sem.id}`}
                                                        name="semester_id"
                                                        value={sem.id}
                                                        checked={String(activeData.semester_id) === String(sem.id)}
                                                        onChange={(e) => setActiveData('semester_id', e.target.value)}
                                                        className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    />
                                                    <label
                                                        htmlFor={`semester-${sem.id}`}
                                                        className="text-sm font-medium leading-none"
                                                    >
                                                        {sem.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        {activeErrors.semester_id && <p className="text-sm text-destructive">{activeErrors.semester_id}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={activeProcessing}
                                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Pengaturan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Persiapan Tahun */}
                    <TabsContent value="preparation" className="space-y-4">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Salin Data dari Tahun Lain</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Persiapkan tahun pelajaran baru dengan menyalin data dari tahun yang sudah ada.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="sm:w-64">
                                            <label className="text-sm font-medium mb-1 block">Tahun Sumber</label>
                                            <select
                                                value={preparationSourceId}
                                                onChange={(e) => setPreparationSourceId(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="">Pilih Tahun Sumber</option>
                                                {scheduleData?.preparationSourceYears?.map((year) => (
                                                    <option key={year.id} value={year.id}>
                                                        {year.name}{year.is_active ? ' (Aktif Sistem)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-muted-foreground sm:max-w-xs">
                                            Salin data dasar untuk mempercepat persiapan, lalu lanjutkan penyesuaian manual seperlunya.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-classes')}
                                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Kelas
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-subjects')}
                                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Mapel & Plotting
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-teacher-settings')}
                                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Kuota & Jam Off
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <Link
                                        href={route('settings.education.schedules.index')}
                                        className="inline-flex items-center text-sm text-primary hover:underline"
                                    >
                                        Buka Jadwal & Pengaturan Lengkap →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
