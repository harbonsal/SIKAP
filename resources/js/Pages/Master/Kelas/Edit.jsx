import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function Edit({ kelas, jenjangs }) {
    const { data, setData, put, processing, errors } = useForm({
        name: kelas.name,
        jenjang_id: kelas.jenjang_id,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('kelas.update', kelas.id));
    };

    return (
        <MainLayout>
            <Head title="Edit Kelas" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('kelas.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Kelas</h2>
                        <p className="text-muted-foreground">Perbarui informasi kelas.</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="jenjang_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Jenjang Pendidikan <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="jenjang_id"
                                value={data.jenjang_id}
                                onChange={(e) => setData('jenjang_id', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="">Pilih Jenjang</option>
                                {jenjangs.map((jenjang) => (
                                    <option key={jenjang.id} value={jenjang.id}>
                                        {jenjang.name}
                                    </option>
                                ))}
                            </select>
                            {errors.jenjang_id && <p className="text-sm text-destructive">{errors.jenjang_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nama Kelas <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Contoh: Kelas 1"
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
