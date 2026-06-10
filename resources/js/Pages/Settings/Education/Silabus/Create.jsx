import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function Create({ mapels, jenjangs, kelas }) {
    const { data, setData, post, processing, errors } = useForm({
        mapel_id: '',
        jenjang_id: '',
        kelas_id: '',
        kurikulum: 'Merdeka',
        semester: 'Ganjil',
        kode: '',
        standar_kompetensi: '',
        kompetensi: '',
        materi: '',
        alokasi_waktu: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('silabus.store'));
    };

    return (
        <MainLayout>
            <Head title="Tambah Silabus" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('silabus.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tambah Silabus</h2>
                        <p className="text-muted-foreground">Input standar kompetensi dan materi pembelajaran.</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Mata Pelajaran <span className="text-destructive">*</span></label>
                                <select
                                    value={data.mapel_id}
                                    onChange={(e) => setData('mapel_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">Pilih Mapel</option>
                                    {mapels.map((mapel) => (
                                        <option key={mapel.id} value={mapel.id}>{mapel.name}</option>
                                    ))}
                                </select>
                                {errors.mapel_id && <p className="text-sm text-destructive">{errors.mapel_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Jenjang <span className="text-destructive">*</span></label>
                                <select
                                    value={data.jenjang_id}
                                    onChange={(e) => setData('jenjang_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">Pilih Jenjang</option>
                                    {jenjangs.map((jenjang) => (
                                        <option key={jenjang.id} value={jenjang.id}>{jenjang.name}</option>
                                    ))}
                                </select>
                                {errors.jenjang_id && <p className="text-sm text-destructive">{errors.jenjang_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Kelas <span className="text-destructive">*</span></label>
                                <select
                                    value={data.kelas_id}
                                    onChange={(e) => setData('kelas_id', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="">Pilih Kelas</option>
                                    {kelas
                                        .filter(k => !data.jenjang_id || k.jenjang_id == data.jenjang_id)
                                        .map((k) => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                </select>
                                {errors.kelas_id && <p className="text-sm text-destructive">{errors.kelas_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Kurikulum <span className="text-destructive">*</span></label>
                                <select
                                    value={data.kurikulum}
                                    onChange={(e) => setData('kurikulum', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="Merdeka">Kurikulum Merdeka</option>
                                    <option value="K13">Kurikulum 2013</option>
                                    <option value="KTSP">KTSP</option>
                                </select>
                                {errors.kurikulum && <p className="text-sm text-destructive">{errors.kurikulum}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Semester <span className="text-destructive">*</span></label>
                                <select
                                    value={data.semester}
                                    onChange={(e) => setData('semester', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                                {errors.semester && <p className="text-sm text-destructive">{errors.semester}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Materi Pokok <span className="text-destructive">*</span></label>
                            <textarea
                                value={data.materi}
                                onChange={(e) => setData('materi', e.target.value)}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Rincian materi..."
                                required
                            />
                            {errors.materi && <p className="text-sm text-destructive">{errors.materi}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Standar Kompetensi (Capaian Umum)</label>
                            <textarea
                                value={data.standar_kompetensi}
                                onChange={(e) => setData('standar_kompetensi', e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Deskripsi standar kompetensi / capaian umum..."
                            />
                            {errors.standar_kompetensi && <p className="text-sm text-destructive">{errors.standar_kompetensi}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Kompetensi Dasar (Capaian Spesifik Terukur) <span className="text-destructive">*</span></label>
                            <textarea
                                value={data.kompetensi}
                                onChange={(e) => setData('kompetensi', e.target.value)}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Deskripsi kompetensi dasar / capaian spesifik..."
                                required
                            />
                            {errors.kompetensi && <p className="text-sm text-destructive">{errors.kompetensi}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Kode Kompetensi (KD/CP)</label>
                            <input
                                type="text"
                                value={data.kode}
                                onChange={(e) => setData('kode', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Contoh: 3.1 atau CP.1"
                            />
                            {errors.kode && <p className="text-sm text-destructive">{errors.kode}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Alokasi Waktu</label>
                            <input
                                type="text"
                                value={data.alokasi_waktu}
                                onChange={(e) => setData('alokasi_waktu', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Contoh: 2 JP"
                            />
                            {errors.alokasi_waktu && <p className="text-sm text-destructive">{errors.alokasi_waktu}</p>}
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
