import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

export default function Import() {
    const { flash } = usePage().props;

    // Form untuk import baru
    const { data, setData, post, processing, errors } = useForm({ file: null });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('users.import.process'));
    };

    return (
        <MainLayout>
            <Head title="Import Data User Umum" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('users.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Import Data User Umum</h2>
                        <p className="text-muted-foreground">Upload file Excel (.xlsx) untuk input data Guru / Karyawan secara massal.</p>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{flash.success}</p>
                    </div>
                )}
                {flash?.warning && (
                    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">{flash.warning}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium">{flash.error}</p>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1">Panduan Import User Baru:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Gunakan format file <strong>.xlsx (Excel)</strong> dari template yang disediakan.</li>
                                <li>Kolom yang wajib diisi: <strong>Nama Lengkap, NIP/NIK/ID, Level User</strong>.</li>
                                <li>Baris pertama (Header) akan diabaikan.</li>
                                <li>Jika NIP/ID sudah terdaftar di sistem, baris tersebut akan dilewati.</li>
                                <li>Password default untuk akun yang baru dibuat adalah <strong>NIP/ID</strong> yang bersangkutan.</li>
                            </ul>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FileDropzone
                            file={data.file}
                            onChange={(f) => setData('file', f)}
                            error={errors.file}
                        />
                        <div className="flex flex-wrap justify-end gap-3">
                            <a
                                href={route('users.export-template')}
                                className="inline-flex items-center gap-2 rounded-md border border-input bg-yellow-50 text-yellow-700 px-4 py-2 text-sm font-medium shadow-sm hover:bg-yellow-100"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Unduh Template User
                            </a>
                            <button
                                type="submit"
                                disabled={processing || !data.file}
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Upload className="h-4 w-4" />
                                {processing ? 'Memproses...' : 'Proses Import'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}

function FileDropzone({ file, onChange, error }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
                Pilih File Excel <span className="text-destructive">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500">
                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Format Excel / .xlsx (Max. 5MB)</p>
                    {file && (
                        <div className="mt-3 flex items-center gap-2 text-primary font-medium bg-primary/10 px-3 py-1 rounded-full text-sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            {file.name}
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv"
                    onChange={e => onChange(e.target.files[0])}
                />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
