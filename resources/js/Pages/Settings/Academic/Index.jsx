import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

export default function Index({ academicYears, semesters, activeAcademicYearId, activeSemesterId }) {
    const { data, setData, post, processing, errors } = useForm({
        academic_year_id: activeAcademicYearId || '',
        semester_id: activeSemesterId || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.academic.store'));
    };

    return (
        <MainLayout>
            <Head title="Pengaturan TP & Semester Aktif" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan Sistem (Global)</h2>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm max-w-2xl">
                    <div className="border-b bg-amber-50/50 p-4">
                        <p className="text-sm text-amber-600 font-medium">
                            ⚠️ Perhatian: Pengaturan ini mengubah tahun aktif untuk SELURUH SEKOLAH.
                            Gunakan hanya saat pergantian tahun ajaran/semester baru.
                        </p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="academic_year_id">
                                    Tahun Pelajaran Aktif
                                </label>
                                <select
                                    id="academic_year_id"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.academic_year_id}
                                    onChange={(e) => setData('academic_year_id', e.target.value)}
                                >
                                    <option value="">Pilih Tahun Pelajaran</option>
                                    {academicYears.map((tp) => (
                                        <option key={tp.id} value={tp.id}>
                                            {tp.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.academic_year_id && <p className="text-sm text-destructive">{errors.academic_year_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="semester_id">
                                    Semester Aktif
                                </label>
                                <div className="flex gap-4">
                                    {semesters.map((sem) => (
                                        <div key={sem.id} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id={`semester-${sem.id}`}
                                                name="semester_id"
                                                value={sem.id}
                                                checked={String(data.semester_id) === String(sem.id)}
                                                onChange={(e) => setData('semester_id', e.target.value)}
                                                className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <label
                                                htmlFor={`semester-${sem.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {sem.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.semester_id && <p className="text-sm text-destructive">{errors.semester_id}</p>}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
