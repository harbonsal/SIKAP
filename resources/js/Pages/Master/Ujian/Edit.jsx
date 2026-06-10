import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function Edit({ ujian }) {
    const { data, setData, put, processing, errors } = useForm({
        name: ujian.name,
        semester: ujian.semester || 'all',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('ujians.update', ujian.id));
    };

    return (
        <MainLayout>
            <Head title="Edit Jenis Ujian" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('ujians.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Jenis Ujian</h2>
                        <p className="text-muted-foreground">Perbarui informasi jenis ujian.</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nama Ujian <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Contoh: PH 1"
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="semester" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Berlaku Untuk <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="semester"
                                value={data.semester}
                                onChange={(e) => setData('semester', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="all">Semua Semester (Ganjil & Genap)</option>
                                <option value="ganjil">Semester Ganjil Saja</option>
                                <option value="genap">Semester Genap Saja</option>
                            </select>
                            {errors.semester && <p className="text-sm text-destructive">{errors.semester}</p>}
                            <p className="text-xs text-muted-foreground">
                                Pilih "Semua Semester" jika ujian ini ada di kedua semester (misal: PH, PTS).
                                Pilih Ganjil/Genap jika hanya ada di satu semester (misal: UAS/PAS hanya Ganjil, UKK/PAT hanya Genap).
                            </p>
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
