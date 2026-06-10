import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Database, Download, Trash2, ShieldCheck, Mail, Clock, Info, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';

export default function SystemBackup({ auth, backups, backup_email, last_backup_run, last_backup_status, mail_mailer }) {
    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        backup_email: backup_email || '',
    });

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isTestingEmail, setIsTestingEmail] = useState(false);

    const handleManualBackup = () => {
        if (confirm('Mulai pencadangan database ke server sekarang?')) {
            setIsBackingUp(true);
            router.post(route('settings.system.backup.run'), {}, {
                onFinish: () => setIsBackingUp(false),
            });
        }
    };

    const handleTestEmail = () => {
        if (confirm('Jalankan proses backup dan kirim langsung ke email sekarang?')) {
            setIsTestingEmail(true);
            router.post(route('settings.system.backup.test-email'), {}, {
                onFinish: () => setIsTestingEmail(false),
            });
        }
    };

    const handleDelete = (filename) => {
        if (confirm(`Hapus file backup ${filename}? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(route('settings.system.backup.destroy', filename));
        }
    };

    const submitSettings = (e) => {
        e.preventDefault();
        post(route('settings.system.backup.settings'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Backup & Pemulihan Sistem</h2>}
        >
            <Head title="System Backup" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Diagnostic / Status Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white shadow sm:rounded-lg border-b-4 border-indigo-500">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Jadwal Otomatis</h3>
                            </div>
                            <p className="text-2xl font-black text-gray-900">Mingguan</p>
                            <p className="mt-1 text-xs text-gray-500 italic">Setiap hari Minggu, 00:00 WIB</p>
                        </div>

                        <div className="p-6 bg-white shadow sm:rounded-lg border-b-4 border-emerald-500">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Terakhir Berhasil</h3>
                            </div>
                            <p className="text-xl font-black text-gray-900 truncate" title={last_backup_run}>{last_backup_run || '-'}</p>
                            <p className="mt-1 text-xs text-gray-500 italic truncate">Status: {last_backup_status || 'Belum ada data'}</p>
                        </div>

                        <div className={`p-6 bg-white shadow sm:rounded-lg border-b-4 ${mail_mailer === 'log' ? 'border-amber-500' : 'border-blue-500'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <Mail className={`w-5 h-5 ${mail_mailer === 'log' ? 'text-amber-500' : 'text-blue-500'}`} />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Koneksi Email</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {mail_mailer === 'log' ? (
                                    <>
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        <p className="text-lg font-bold text-amber-700 uppercase">LOG MODE</p>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        <p className="text-lg font-bold text-blue-700 uppercase">SMTP AKTIF</p>
                                    </>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500 italic">Siap mengirim lampiran backup.</p>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-indigo-600">
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Send className="w-5 h-5 text-indigo-600" />
                                Backup Manual
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Gunakan tombol di samping untuk segera melakukan pencadangan tanpa menunggu jadwal otomatis.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleManualBackup}
                                disabled={isBackingUp || isTestingEmail}
                                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 transition-colors ${
                                    isBackingUp ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                                }`}
                            >
                                {isBackingUp ? <Clock className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Database className="-ml-1 mr-2 h-4 w-4" />}
                                Simpan ke Server (Lokal)
                            </button>
                            <button
                                onClick={handleTestEmail}
                                disabled={isBackingUp || isTestingEmail}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                                    isTestingEmail ? 'bg-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {isTestingEmail ? <Clock className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Mail className="-ml-1 mr-2 h-4 w-4" />}
                                Backup & Kirim ke Email
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Backup List */}
                            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                                <header className="mb-6">
                                    <h2 className="text-lg font-medium text-gray-900">Riwayat Backup (7 Hari Terakhir)</h2>
                                    <p className="mt-1 text-sm text-gray-600">Daftar file cadangan yang tersedia di server.</p>
                                </header>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama File</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ukuran</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {backups.length > 0 ? backups.map((backup) => (
                                                <tr key={backup.filename} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                            {backup.filename}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.created_at}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                                        <a 
                                                            href={route('settings.system.backup.download', backup.filename)}
                                                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        <button 
                                                            onClick={() => handleDelete(backup.filename)}
                                                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500 italic">
                                                        Belum ada file backup yang tersedia.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Guide */}
                        <div className="space-y-6">
                            <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Penerima</h3>
                                <form onSubmit={submitSettings} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="backup_email" value="Email Tujuan" />
                                        <TextInput
                                            id="backup_email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.backup_email}
                                            onChange={(e) => setData('backup_email', e.target.value)}
                                            placeholder="admin@email.com"
                                        />
                                        <p className="mt-2 text-[10px] text-gray-500">Email ini akan menerima lampiran file setiap hari Minggu jam 00:00.</p>
                                        <InputError className="mt-2" message={errors.backup_email} />
                                    </div>
                                    <PrimaryButton disabled={processing}>Simpan Email</PrimaryButton>
                                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                        <p className="text-sm text-gray-600">Tersimpan.</p>
                                    </Transition>
                                </form>
                            </div>

                            <div className="p-4 sm:p-8 bg-blue-50 border border-blue-100 shadow sm:rounded-lg">
                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">Penyimpanan</h3>
                                <ul className="text-[10px] text-blue-800 space-y-2 list-disc pl-4 italic">
                                    <li>Maksimal penyimpanan adalah 7 file terakhir.</li>
                                    <li>File lama akan otomatis dihapus oleh sistem untuk menghemat memori server.</li>
                                    <li>Pastikan kuota email Bapak cukup untuk menerima lampiran sekitar 1-5 MB tiap minggu.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
