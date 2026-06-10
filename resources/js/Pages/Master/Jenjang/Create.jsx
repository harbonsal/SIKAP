import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function Create({ staffUsers }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        nama_arab: '',
        description: '',
        headmaster_user_id: '',
        headmaster_title: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('jenjangs.store'));
    };

    return (
        <MainLayout>
            <Head title="Tambah Jenjang" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('jenjangs.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tambah Jenjang</h2>
                        <p className="text-muted-foreground">Tambahkan jenjang pendidikan baru.</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nama Jenjang <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Contoh: Ibtida'i"
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="nama_arab" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nama Arab (Untuk Rapor)
                            </label>
                            <input
                                id="nama_arab"
                                type="text"
                                value={data.nama_arab}
                                onChange={(e) => setData('nama_arab', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-arabic text-right"
                                placeholder="Contoh: للمرحلة الإبتدائية"
                                dir="rtl"
                            />
                            {errors.nama_arab && <p className="text-sm text-destructive">{errors.nama_arab}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Keterangan
                            </label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Keterangan tambahan (opsional)"
                            />
                            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="headmaster_user_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Kepala Sekolah (Untuk Tanda Tangan Rapor)
                            </label>
                            <select
                                id="headmaster_user_id"
                                value={data.headmaster_user_id}
                                onChange={(e) => setData('headmaster_user_id', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">-- Pilih Kepala Sekolah (Opsional) --</option>
                                {staffUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {errors.headmaster_user_id && <p className="text-sm text-destructive">{errors.headmaster_user_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="headmaster_title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Jabatan Kepala Sekolah (Contoh: Kepala Mutawassith)
                            </label>
                            <input
                                id="headmaster_title"
                                type="text"
                                value={data.headmaster_title}
                                onChange={(e) => setData('headmaster_title', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Contoh: Kepala Madrasah Tsanawiyah"
                            />
                            {errors.headmaster_title && <p className="text-sm text-destructive">{errors.headmaster_title}</p>}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
