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
import { BellRing, Smartphone, CheckCircle, ShieldCheck, X } from 'lucide-react';

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
        // Hanya jalankan untuk staf/guru/musyrif (bukan santri) dan jika user telah login
        if (!user || user.user_level?.name === 'Santri') {
            return;
        }

        if (typeof window === 'undefined') return;

        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        if (!isSupported || !vapidPublicKey) return;

        const currentPerm = Notification.permission;

        // 1. KASUS SUDAH GRANTED: Lakukan Silent Auto-Sync di latar belakang
        if (currentPerm === 'granted') {
            handleSilentSync();
            return;
        }

        // 2. KASUS DEFAULT (Belum Pernah Ditanya / Belum Aktif):
        if (currentPerm === 'default') {
            const dismissKey = `sikap_push_dismissed_${user.id}`;
            const dismissedAt = localStorage.getItem(dismissKey);

            // Jika belum pernah ditolak atau sudah lewat 3 hari sejak klik "Nanti Saja"
            if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > 3 * 24 * 60 * 60 * 1000) {
                // Tampilkan popup dengan sedikit delay agar halaman dashboard ter-render dengan mulus
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 1500);

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

            // Sync minimal sekali tiap 24 jam untuk memastikan token tetap valid di server
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
     * User menekan tombol "Izinkan Notifikasi Sekarang"
     */
    const handleAccept = async () => {
        setLoading(true);
        try {
            // Minta izin resmi browser/HP
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
                    title: 'Pengingat HP Aktif! 🎉',
                    text: 'Alhamdulillah, HP Anda telah terdaftar. Pengingat deadline nilai dan tugas akan berdering langsung di layar HP Anda.',
                    confirmButtonColor: '#16a34a',
                    confirmButtonText: 'Syukron',
                    timer: 4000,
                });
            } else {
                setIsOpen(false);
                localStorage.setItem(`sikap_push_dismissed_${user.id}`, Date.now().toString());
            }
        } catch (err) {
            console.error('Push activation error:', err);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    /**
     * User menekan tombol "Nanti Saja" (tunda 3 hari)
     */
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
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-bounce">
                        <BellRing className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 mb-1.5">
                            <Smartphone className="w-3.5 h-3.5" /> Pengingat Otomatis di HP
                        </span>
                        <DialogTitle className="text-xl font-black text-foreground tracking-tight">
                            Aktifkan Notifikasi di HP Anda
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        Assalamu’alaikum, Ustadz/Ustadzah. Aktifkan pengingat agar info deadline input nilai akademik, jadwal ujian tahfidz, dan agenda santri asuh langsung berbunyi di layar HP Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        Keuntungan Pengingat HP:
                    </div>
                    <ul className="space-y-1.5 pl-1">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Muncul & bergetar di layar HP meski aplikasi sedang ditutup.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Aman dan bebas spam — hanya memuat agenda resmi pesantren SIKAP.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Cukup klik pop-up notifikasi untuk langsung masuk ke halaman input nilai.</span>
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
                        Nanti Saja
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAccept}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 shadow-lg shadow-emerald-600/25 flex-1 order-1 sm:order-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Memproses...
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <BellRing className="w-4 h-4" />
                                Izinkan Notifikasi Sekarang
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
