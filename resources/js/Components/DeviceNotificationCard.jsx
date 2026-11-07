import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Bell, BellRing, Smartphone, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Send, XCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';

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

export default function DeviceNotificationCard({ compact = false, className = '' }) {
    const { app_settings } = usePage().props;
    const vapidPublicKey = app_settings?.vapid_public_key;

    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        checkSupportAndSubscription();
    }, []);

    const checkSupportAndSubscription = async () => {
        setLoading(true);
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (!supported) {
            setLoading(false);
            return;
        }

        setPermission(Notification.permission);

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                setIsSubscribed(true);
            } else {
                setIsSubscribed(false);
            }
        } catch (err) {
            console.warn('Gagal memeriksa status subscription push:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async () => {
        const keyToUse = vapidPublicKey || 'BEhkKkxBnEBGsPHG9JotYMCqLp-MEJdboXXFVuea84QhBvtzl_7JmSzISgVCm5Z_G5uKqppYQDp_iJmvbVvKbtU';
        if (!keyToUse) {
            Swal.fire({
                icon: 'error',
                title: 'Konfigurasi Belum Siap',
                text: 'Kunci VAPID push notification belum terpasang di sistem.',
            });
            return;
        }

        setActionLoading(true);

        try {
            // 1. Minta izin notifikasi browser
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setActionLoading(false);
                Swal.fire({
                    icon: 'warning',
                    title: 'Izin Ditolak',
                    text: 'Izin notifikasi browser belum diberikan. Silakan aktifkan izin notifikasi di setelan peramban / HP Anda.',
                });
                return;
            }

            // 2. Registrasi Service Worker & Push Subscription
            const reg = await navigator.serviceWorker.ready;
            const applicationServerKey = urlBase64ToUint8Array(keyToUse);

            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey,
                });
            }

            // 3. Simpan langganan ke database SIKAP
            const response = await axios.post('/push-subscriptions', sub.toJSON());

            setIsSubscribed(true);
            setDeviceName(response.data?.device_name || 'Perangkat Ini');

            Swal.fire({
                icon: 'success',
                title: 'Pengingat HP Aktif! 🎉',
                text: 'Perangkat ini telah terdaftar. Notifikasi pengingat nilai santri dan agenda tugas akan langsung muncul di layar HP Anda.',
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'Alhamdulillah',
            });
        } catch (err) {
            console.error('Error subscribing push:', err);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengaktifkan',
                text: err.response?.data?.message || err.message || 'Terjadi kesalahan saat mendaftarkan pengingat.',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        const confirm = await Swal.fire({
            title: 'Nonaktifkan Pengingat di HP ini?',
            text: 'Anda tidak akan menerima notifikasi pop-up langsung di perangkat ini lagi.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Nonaktifkan',
            cancelButtonText: 'Batal',
        });

        if (!confirm.isConfirmed) return;

        setActionLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();

            if (sub) {
                await axios.post('/push-subscriptions/unsubscribe', {
                    endpoint: sub.endpoint,
                });
                await sub.unsubscribe();
            }

            setIsSubscribed(false);
            Swal.fire({
                icon: 'info',
                title: 'Notifikasi Dinonaktifkan',
                text: 'Pengingat untuk perangkat ini telah dinonaktifkan.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error('Error unsubscribing:', err);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Terjadi kendala saat menonaktifkan notifikasi.',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleTestNotification = async () => {
        setTestLoading(true);
        try {
            const res = await axios.post('/push-subscriptions/test');
            Swal.fire({
                icon: 'success',
                title: 'Tes Terkirim! 📲',
                text: 'Sinyal pengingat telah dikirim ke HP Anda. Periksa bilah notifikasi HP Anda (disertai suara & getar).',
                timer: 3500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
            });
        } catch (err) {
            console.error('Test notification error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengirim Tes',
                text: err.response?.data?.message || 'Pastikan notifikasi di HP aktif dan perangkat terhubung ke internet.',
            });
        } finally {
            setTestLoading(false);
        }
    };

    if (!isSupported) {
        if (compact) return null;
        return (
            <div className={`p-4 rounded-2xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 flex items-start gap-3 ${className}`}>
                <Smartphone className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold">Notifikasi HP Belum Didukung di Browser Ini</p>
                    <p className="mt-0.5 opacity-90">
                        Untuk menerima pengingat langsung di HP, pastikan Anda membuka website menggunakan browser Google Chrome (Android) atau Safari (iOS 16.4+) dengan protokol HTTPS.
                    </p>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className={`flex items-center justify-between px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-2xs ${className}`}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                        <BellRing className={`w-3.5 h-3.5 ${isSubscribed ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                        REMINDER
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        • Pengingat HP
                    </span>
                </div>
                <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-black tracking-wider ${isSubscribed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {isSubscribed ? 'ON' : 'OFF'}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isSubscribed}
                        disabled={actionLoading || loading}
                        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                            isSubscribed ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        } ${(actionLoading || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`Klik untuk ${isSubscribed ? 'mematikan (OFF)' : 'mengaktifkan (ON)'} pengingat di HP ini`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                isSubscribed ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                        {isSubscribed ? <BellRing className="w-6 h-6 animate-pulse" /> : <Smartphone className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-foreground">Pengingat Notifikasi Perangkat (HP)</h3>
                            {isSubscribed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <CheckCircle className="w-3 h-3" /> Aktif di Perangkat Ini
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    <AlertTriangle className="w-3 h-3" /> Belum Diaktifkan
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Menerima sinyal pengingat langsung di layar HP (disertai dering/getar) untuk batas input nilai akademik, ujian tahfidz, dan jadwal pertemuan musyrif tarbiyah.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1.5 border border-border/50">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Keunggulan Pengingat Langsung:
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li>Tetap berbunyi & muncul di layar HP meski browser/aplikasi sedang ditutup.</li>
                    <li>Satu akun asatidzah bisa aktif di beberapa HP sekaligus secara bersamaan.</li>
                    <li>Sentuh notifikasi untuk langsung membuka halaman pengisian yang bersangkutan.</li>
                </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                {isSubscribed ? (
                    <>
                        <Button
                            type="button"
                            onClick={handleTestNotification}
                            disabled={testLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-md shadow-emerald-600/20"
                        >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            {testLoading ? 'Mengirim Sinyal...' : 'Tes Notifikasi (Bunyi & Getar)'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleUnsubscribe}
                            disabled={actionLoading}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 h-9 rounded-xl font-medium"
                        >
                            Nonaktifkan di HP Ini
                        </Button>
                    </>
                ) : (
                    <Button
                        type="button"
                        onClick={handleSubscribe}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-md shadow-emerald-600/20"
                    >
                        <Bell className="w-3.5 h-3.5 mr-1.5" />
                        {actionLoading ? 'Mendaftarkan Perangkat...' : 'Aktifkan Pengingat HP (Wajib - Jangan Diblokir)'}
                    </Button>
                )}
            </div>
        </div>
    );
}

