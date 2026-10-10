import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AbsensiLayout from '@/Layouts/AbsensiLayout';
import axios from 'axios';
import { Settings, HeartPulse, FileText, ShieldCheck, Check, Loader2, AlertCircle } from 'lucide-react';

export default function JournalAttendanceSettings({ attendanceSettings = { teacher_can_set_sick: false, teacher_can_set_permission: false } }) {
    const [form, setForm] = useState({
        teacher_can_set_sick: !!attendanceSettings?.teacher_can_set_sick,
        teacher_can_set_permission: !!attendanceSettings?.teacher_can_set_permission,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await axios.post(route('journals.settings.attendance'), form);
            setSuccessMessage(response.data.message || 'Pengaturan hak absensi guru berhasil disimpan.');
            setTimeout(() => {
                setSuccessMessage('');
            }, 4000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setErrorMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Absensi & Jurnal', href: route('journals.index') },
        { label: 'Pengaturan Absensi', href: route('journals.settings') },
    ];

    return (
        <AbsensiLayout breadcrumbItems={breadcrumbItems}>
            <Head title="Pengaturan Hak Absensi Guru" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Information */}
                <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-foreground">
                                Pengaturan Hak Absensi Guru
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                Kelola sinkronisasi wewenang pengisian absensi siswa antara Guru Pengajar di kelas dengan bagian Poskestren (Kesehatan) & Bagian Pengasuhan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feedback Alerts */}
                {successMessage && (
                    <div className="p-4 text-sm rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in">
                        <Check className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                )}

                {errorMessage && (
                    <div className="p-4 text-sm rounded-xl bg-destructive/15 text-destructive border border-destructive/30 flex items-center gap-3 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                )}

                {/* Form Settings */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm divide-y divide-border overflow-hidden">
                        
                        {/* Toggle 1: Sakit */}
                        <div className="p-6 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex items-start gap-3.5 pr-2">
                                    <div className="p-2.5 rounded-xl bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400 shrink-0 mt-0.5">
                                        <HeartPulse className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-semibold text-foreground">
                                            Izinkan Guru Memberikan Status "Sakit"
                                        </h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            Jika <span className="font-semibold text-foreground underline decoration-red-400">OFF (Nonaktif)</span>, guru tidak dapat memilih status Sakit secara mandiri saat mengisi jurnal kelas. Status Sakit hanya akan terisi secara otomatis apabila santri terdata sakit oleh Bagian Kesehatan (Poskestren).
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center pt-1 self-end sm:self-start">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.teacher_can_set_sick}
                                            onChange={(e) => setForm(prev => ({ ...prev, teacher_can_set_sick: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Toggle 2: Izin */}
                        <div className="p-6 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex items-start gap-3.5 pr-2">
                                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 shrink-0 mt-0.5">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-semibold text-foreground">
                                            Status "Izin" Santri di Kelas
                                        </h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            Status Izin otomatis tersinkronisasi jika telah diisi oleh pihak Pengasuhan (Perizinan Santri). Selain itu, pengajar dan bagian pendidikan yang memiliki role juga berhak memberikan status Izin secara langsung di absensi kelas.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center pt-1 self-end sm:self-start">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.teacher_can_set_permission}
                                            onChange={(e) => setForm(prev => ({ ...prev, teacher_can_set_permission: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Security notice */}
                    <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 flex items-start gap-3 text-xs sm:text-sm text-blue-900 dark:text-blue-300">
                        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <p className="leading-relaxed">
                            Administrator, Kepala Sekolah, dan Manager memiliki wewenang penuh untuk memantau serta memperbarui status absensi kapan saja bila diperlukan.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Pengaturan
                        </button>
                    </div>
                </form>
            </div>
        </AbsensiLayout>
    );
}
