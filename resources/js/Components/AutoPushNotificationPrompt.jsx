import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { BellRing, Smartphone, CheckCircle, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function AutoPushNotificationPrompt() {
    const { auth, app_settings } = usePage().props;
    const user = auth?.user;
    const vapidPublicKey = app_settings?.vapid_public_key;

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Khusus Asatidzah / Staf (Bukan Santri)
        if (!user || user.user_level?.name === 'Santri') {
            return;
        }

        if (typeof window === 'undefined') return;

        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        if (!isSupported || !vapidPublicKey) return;

        const currentPerm = Notification.permission;

        // 1. KASUS SUDAH GRANTED: Lakukan Silent Auto-Sync di latar belakang tanpa mengganggu
        if (currentPerm === 'granted') {
            handleSilentSync();
            return;
        }

        // 2. KASUS DEFAULT (Belum Diizinkan): Wajib dimunculkan untuk asatidzah
        if (currentPerm === 'default') {
            const dismissKey = `sikap_push_dismissed_${user.id}`;
            const dismissedAt = localStorage.getItem(dismissKey);

            // Munculkan kembali jika belum pernah ditanggapi atau sudah lewat 1 hari
            if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 1 * 24 * 60 * 60 * 1000) {
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 1200);

                return () => clearTimeout(timer);
            }
        }
    }, [user, vapidPublicKey]);

    /**
     * Silent Background Registration jika izin browser sudah 'granted'
     */
    const handleSilentSync = async () => {
        try {
            const lastSyncKey = `sikap_push_synced_${user.id}`;
            const lastSync = localStorage.getItem(lastSyncKey);

            if (lastSync && Date.now() - parseInt(lastSync, 10) < 24 * 60 * 60 * 1000) {
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            let sub = await reg.pushManager.getSubscription();

            if (!sub) {
                const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey,
                });
            }

            if (sub) {
                await axios.post('/push-subscriptions', sub.toJSON());
                localStorage.setItem(lastSyncKey, Date.now().toString());
            }
        } catch (err) {
            console.warn('Silent push sync exception:', err);
        }
    };

    /**
     * Asatidzah menekan tombol "Izinkan Sekarang (Jangan Blokir)"
     */
    const handleAccept = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const reg = await navigator.serviceWorker.ready;
                const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey,
                    });
                }

                await axios.post('/push-subscriptions', sub.toJSON());
                localStorage.setItem(`sikap_push_synced_${user.id}`, Date.now().toString());

                setIsOpen(false);

                Swal.fire({
                    icon: 'success',
                    title: 'Pengingat HP Telah Aktif! 🎉',
                    text: 'Alhamdulillah, HP antum telah terhubung ke sistem pengingat SIKAP. Notifikasi tugas dan jadwal akan otomatis masuk ke HP ini.',
                    confirmButtonColor: '#16a34a',
                    confirmButtonText: 'Alhamdulillah',
                    timer: 4000,
                });
            } else {
                setIsOpen(false);
                localStorage.setItem(`sikap_push_dismissed_${user.id}`, Date.now().toString());

                Swal.fire({
                    icon: 'warning',
                    title: 'Peringatan: Notifikasi Jangan Diblokir!',
                    html: 'Pengingat HP terdeteksi <b>DIBLOKIR / DITOLAK</b>.<br><br>Fitur ini wajib bagi Asatidzah. Mohon klik ikon gembok/setelan situs di samping alamat web <b>sikap.sinawang.my.id</b>, lalu ubah izin Notifikasi menjadi <b>"Izinkan" (Allow)</b> agar agenda santri tidak terlewat.',
                    confirmButtonColor: '#d97706',
                    confirmButtonText: 'Saya Mengerti',
                });
            }
        } catch (err) {
            console.error('Push activation error:', err);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
        if (user?.id) {
            localStorage.setItem(`sikap_push_dismissed_${user.id}`, Date.now().toString());
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md p-6 rounded-3xl border-border bg-card shadow-2xl">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-bounce">
                        <BellRing className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 mb-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                            Instruksi Wajib Khusus Asatidzah
                        </span>
                        <DialogTitle className="text-xl font-black text-foreground tracking-tight leading-snug">
                            Wajib Aktifkan Pengingat Notifikasi di HP
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-foreground/90 leading-relaxed font-medium">
                        Assalamu’alaikum Warahmatullahi Wabarakatuh. Seluruh <b>Asatidzah</b> diwajibkan mengaktifkan izin pengingat di HP masing-masing dan <b>jangan diblokir</b>, agar agenda penting kepesantrenan tidak terlewatkan.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        PENTING: Pilih "Izinkan" / "Allow"
                    </div>
                    <ul className="space-y-1.5 pl-0.5 leading-relaxed">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><b>Wajib diizinkan</b> saat pop-up browser muncul. <b>Jangan pilih blokir</b>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Pengingat batas input nilai santri, ujian tahfidz, dan mutaba'ah santri asuh akan berbunyi & bergetar di HP meski aplikasi sedang ditutup.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Khusus agenda resmi asatidzah SIKAP, aman dan bebas dari spam.</span>
                        </li>
                    </ul>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2.5 sm:gap-2 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDismiss}
                        disabled={loading}
                        className="text-xs text-muted-foreground hover:text-foreground rounded-xl h-10 order-2 sm:order-1"
                    >
                        Ingatkan Nanti
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAccept}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl h-10 shadow-lg shadow-emerald-600/30 flex-1 order-1 sm:order-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Menghubungkan HP...
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <BellRing className="w-4 h-4" />
                                Izinkan Sekarang (Jangan Diblokir)
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
