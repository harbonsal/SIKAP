import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Shield, HeartPulse, FileText, Check, X, Loader2 } from 'lucide-react';

export default function AttendanceSettingsModal({ isOpen, onClose, settings, onSaved }) {
    if (!isOpen) return null;

    const [form, setForm] = useState({
        teacher_can_set_sick: !!settings?.teacher_can_set_sick,
        teacher_can_set_permission: !!settings?.teacher_can_set_permission,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const res = await axios.post(route('journals.settings.attendance'), form);
            setSuccessMessage(res.data.message || 'Pengaturan berhasil disimpan');
            if (onSaved) {
                onSaved(res.data.settings);
            }
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err) {
            console.error('Error updating attendance settings:', err);
            setErrorMessage(err.response?.data?.message || 'Gagal menyimpan pengaturan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between bg-muted/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Pengaturan Hak Absensi Guru</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Sinkronisasi hak wewenang Pengasuhan & Kesehatan (Poskestren)
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    {successMessage && (
                        <div className="p-3 text-xs rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{successMessage}</span>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="p-3 text-xs rounded-lg bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Switch Sakit */}
                        <div className="flex items-start justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-start gap-3 pr-4">
                                <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mt-0.5">
                                    <HeartPulse className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Izinkan Guru Memberikan Status "Sakit"
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Jika <span className="font-semibold text-foreground">OFF (Nonaktif)</span>, guru tidak dapat memilih status Sakit secara mandiri. Status Sakit hanya akan terisi otomatis apabila santri terdata sakit oleh Bagian Kesehatan (Poskestren).
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                <input
                                    type="checkbox"
                                    checked={form.teacher_can_set_sick}
                                    onChange={(e) => setForm(prev => ({ ...prev, teacher_can_set_sick: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Switch Izin */}
                        <div className="flex items-start justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-start gap-3 pr-4">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mt-0.5">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Izinkan Guru Memberikan Status "Izin"
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Jika <span className="font-semibold text-foreground">OFF (Nonaktif)</span>, guru tidak dapat memilih status Izin secara mandiri. Status Izin hanya akan terisi otomatis berdasarkan surat/catatan perizinan dari Bagian Pengasuhan.
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                                <input
                                    type="checkbox"
                                    checked={form.teacher_can_set_permission}
                                    onChange={(e) => setForm(prev => ({ ...prev, teacher_can_set_permission: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                        <Shield className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <p>
                            Administrator, Kepala Sekolah, dan Manager tetap memiliki wewenang penuh untuk mengubah status absensi kapan saja bila diperlukan.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow transition-colors disabled:opacity-50"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Pengaturan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
