import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function Import() {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('tambah');

    // Form untuk import baru
    const { data: dataAdd, setData: setDataAdd, post: postAdd, processing: processingAdd, errors: errorsAdd } = useForm({ file: null });

    // Form untuk update massal
    const { data: dataUpdate, setData: setDataUpdate, post: postUpdate, processing: processingUpdate, errors: errorsUpdate } = useForm({ file: null });

    const handleSubmitAdd = (e) => {
        e.preventDefault();
        postAdd(route('students.import.process'));
    };

    const handleSubmitUpdate = (e) => {
        e.preventDefault();
        postUpdate(route('students.import.update'));
    };

    const tabs = [
        { id: 'tambah', label: 'Import Biodata Baru', icon: Upload },
        { id: 'update', label: 'Update Biodata Massal', icon: RefreshCw },
    ];

    return (
        <MainLayout>
            <Head title="Import Data Siswa" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('students.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Import Data Siswa</h2>
                        <p className="text-muted-foreground">Upload file CSV untuk input atau update data siswa secara massal.</p>
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

                {/* Tabs */}
                <div className="flex border-b">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB: Import Baru */}
                {activeTab === 'tambah' && (
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Panduan Import Biodata Baru:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Format file <strong>.CSV</strong> (43 kolom).</li>
                                    <li>Kolom: <strong>Nama, NIS, NISN, NIK, L/P, Tempat Lahir, Tgl Lahir, Alamat, ...</strong></li>
                                    <li>Baris pertama (Header) akan diabaikan.</li>
                                    <li>Jika NIS sudah ada di sistem, baris akan dilewati.</li>
                                    <li>Password akun default = <strong>NIS</strong>.</li>
                                </ul>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitAdd} className="space-y-6">
                            <FileDropzone
                                file={dataAdd.file}
                                onChange={(f) => setDataAdd('file', f)}
                                error={errorsAdd.file}
                            />
                            <div className="flex flex-wrap justify-end gap-3">
                                <a
                                    href={route('students.export-template-missing')}
                                    className="inline-flex items-center gap-2 rounded-md border border-input bg-yellow-50 text-yellow-700 px-4 py-2 text-sm font-medium shadow-sm hover:bg-yellow-100"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Template (User Belum Ada Biodata)
                                </a>
                                <button
                                    type="submit"
                                    disabled={processingAdd || !dataAdd.file}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <Upload className="h-4 w-4" />
                                    {processingAdd ? 'Memproses...' : 'Proses Import'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: Update Massal */}
                {activeTab === 'update' && (
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Panduan Update Biodata Massal:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Kolom pertama <strong>NIS</strong> wajib diisi — digunakan sebagai kunci pencarian.</li>
                                    <li>Kolom yang <strong>kosong</strong> tidak akan mengubah data yang sudah ada.</li>
                                    <li>Download template terlebih dahulu, isi kolom yang ingin diubah, lalu upload.</li>
                                    <li>Format file <strong>.CSV</strong>.</li>
                                </ul>
                                <p className="mt-2 font-semibold text-amber-900">
                                    ⚠️ Data yang diisi akan menimpa (overwrite) data lama.
                                </p>
                            </div>
                        </div>

                        {/* Alur */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">1</span>
                            <span>Download template</span>
                            <span className="mx-1">→</span>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">2</span>
                            <span>Edit di Excel/Spreadsheet</span>
                            <span className="mx-1">→</span>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">3</span>
                            <span>Simpan sebagai CSV</span>
                            <span className="mx-1">→</span>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">4</span>
                            <span>Upload di sini</span>
                        </div>

                        <form onSubmit={handleSubmitUpdate} className="space-y-6">
                            <FileDropzone
                                file={dataUpdate.file}
                                onChange={(f) => setDataUpdate('file', f)}
                                error={errorsUpdate.file}
                            />
                            <div className="flex flex-wrap justify-end gap-3">
                                <a
                                    href={route('students.export-update-template')}
                                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Download Template (Data Santri Aktif)
                                </a>
                                <button
                                    type="submit"
                                    disabled={processingUpdate || !dataUpdate.file}
                                    className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {processingUpdate ? 'Memproses...' : 'Proses Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

function FileDropzone({ file, onChange, error }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
                Pilih File CSV <span className="text-destructive">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500">
                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Format CSV (Max. 5MB)</p>
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
                    accept=".csv"
                    onChange={e => onChange(e.target.files[0])}
                />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
