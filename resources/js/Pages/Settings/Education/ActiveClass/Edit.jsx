import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function Edit({ activeClass, academicYears, kelas, kelasParalels, teachers, filters }) {
    const { data, setData, put, processing, errors } = useForm({
        academic_year_id: activeClass.academic_year_id,
        kelas_id: activeClass.kelas_id,
        kelas_paralel_id: activeClass.kelas_paralel_id,
        teacher_id: activeClass.teacher_id || '',
        name: activeClass.name || '',
        total_hours_per_week: activeClass.total_hours_per_week || 35,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('active-classes.update', { active_class: activeClass.id, ...filters }));
    };

    return (
        <MainLayout>
            <Head title="Edit Kelas Aktif" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('active-classes.index', filters)}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Kelas Aktif</h2>
                        <p className="text-muted-foreground">Perbarui data rombongan belajar.</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Tahun Pelajaran <span className="text-destructive">*</span></label>
                            <select
                                value={data.academic_year_id}
                                onChange={(e) => setData('academic_year_id', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                            >
                                <option value="">Pilih Tahun Pelajaran</option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}{year.semester ? ` - ${year.semester}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_year_id && <p className="text-sm text-destructive">{errors.academic_year_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Tingkat Kelas <span className="text-destructive">*</span></label>
                                <select
                                    value={data.kelas_id}
                                    onChange={(e) => setData('kelas_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">Pilih Tingkat</option>
                                    {kelas.map((k) => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                                {errors.kelas_id && <p className="text-sm text-destructive">{errors.kelas_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Paralel</label>
                                <select
                                    value={data.kelas_paralel_id}
                                    onChange={(e) => setData('kelas_paralel_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">Tanpa Paralel</option>
                                    {kelasParalels.map((kp) => (
                                        <option key={kp.id} value={kp.id}>{kp.name}</option>
                                    ))}
                                </select>
                                {errors.kelas_paralel_id && <p className="text-sm text-destructive">{errors.kelas_paralel_id}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Wali Kelas</label>
                            <select
                                value={data.teacher_id}
                                onChange={(e) => setData('teacher_id', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Pilih Wali Kelas</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name} ({teacher.nomor_induk})
                                    </option>
                                ))}
                            </select>
                            {errors.teacher_id && <p className="text-sm text-destructive">{errors.teacher_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Nama Khusus (Opsional)</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Contoh: 7A Unggulan"
                            />
                            <p className="text-xs text-muted-foreground">Biarkan kosong jika ingin menggunakan nama standar (misal: 7 A).</p>
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Total Jam per Pekan</label>
                            <input
                                type="number"
                                value={data.total_hours_per_week}
                                onChange={(e) => setData('total_hours_per_week', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Contoh: 35"
                            />
                            <p className="text-xs text-muted-foreground">Default: 35 jam (Jika kosong)</p>
                            {errors.total_hours_per_week && <p className="text-sm text-destructive">{errors.total_hours_per_week}</p>}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
