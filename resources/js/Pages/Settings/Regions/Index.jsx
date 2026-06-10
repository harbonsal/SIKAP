import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Database, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function Index({ counts, flash }) {
    const { post, processing } = useForm();

    const handleSync = (e) => {
        e.preventDefault();
        if (confirm('Proses ini akan mengunduh data wilayah seluruh Indonesia. Ini mungkin memakan waktu beberapa menit. Lanjutkan?')) {
            post(route('settings.regions.sync'));
        }
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Wilayah" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Master Data Wilayah</h2>
                    <p className="text-muted-foreground">Kelola data wilayah administratif Indonesia (Provinsi, Kota/Kab, Kecamatan, Kelurahan).</p>
                </div>

                {flash.success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
                        <CheckCircle className="h-5 w-5" />
                        <span className="block sm:inline">{flash.success}</span>
                    </div>
                )}

                {flash.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
                        <AlertCircle className="h-5 w-5" />
                        <span className="block sm:inline">{flash.error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-col space-y-1.5">
                            <h3 className="font-semibold leading-none tracking-tight">Provinsi</h3>
                        </div>
                        <div className="p-0 pt-4">
                            <div className="text-2xl font-bold">{counts.provinces}</div>
                            <p className="text-xs text-muted-foreground">Data Tersimpan</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-col space-y-1.5">
                            <h3 className="font-semibold leading-none tracking-tight">Kota/Kabupaten</h3>
                        </div>
                        <div className="p-0 pt-4">
                            <div className="text-2xl font-bold">{counts.regencies}</div>
                            <p className="text-xs text-muted-foreground">Data Tersimpan</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-col space-y-1.5">
                            <h3 className="font-semibold leading-none tracking-tight">Kecamatan</h3>
                        </div>
                        <div className="p-0 pt-4">
                            <div className="text-2xl font-bold">{counts.districts}</div>
                            <p className="text-xs text-muted-foreground">Data Tersimpan</p>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <div className="flex flex-col space-y-1.5">
                            <h3 className="font-semibold leading-none tracking-tight">Kelurahan/Desa</h3>
                        </div>
                        <div className="p-0 pt-4">
                            <div className="text-2xl font-bold">{counts.villages}</div>
                            <p className="text-xs text-muted-foreground">Data Tersimpan</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-col space-y-1.5 mb-4">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Sinkronisasi Data
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Unduh data wilayah terbaru dari server pusat (emsifa.com). Pastikan Anda terhubung ke internet.
                        </p>
                    </div>

                    <form onSubmit={handleSync}>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sedang Mengunduh... (Mohon Tunggu)
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Data Wilayah
                                </>
                            )}
                        </button>
                    </form>
                    <div className="mt-4 text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        <strong>Catatan:</strong> Proses ini mungkin memakan waktu cukup lama (5-10 menit) karena banyaknya data desa/kelurahan di seluruh Indonesia. Jangan tutup halaman ini sampai proses selesai.
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
