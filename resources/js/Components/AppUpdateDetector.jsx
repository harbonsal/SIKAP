import { useState, useEffect, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { RefreshCw, Sparkles, ArrowUpCircle, X } from 'lucide-react';

export default function AppUpdateDetector() {
    const { app_version } = usePage().props;
    const clientBuildTime = app_version?.build_time || null;

    const [isTargetDevice, setIsTargetDevice] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [serverData, setServerData] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const lastCheckRef = useRef(0);

    // Deteksi apakah perangkat adalah Android / Mobile
    useEffect(() => {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
            const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
            const isAndroid = ua.includes('android');
            const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
            setIsTargetDevice(isAndroid || isMobile);
        }
    }, []);

    const checkServerVersion = useCallback(async () => {
        // Hanya jalankan jika di Android/Mobile
        if (typeof navigator === 'undefined') return;
        const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
        const isDeviceAllowed = ua.includes('android') || /android|iphone|ipad|ipod|mobile/i.test(ua);
        if (!isDeviceAllowed) return;

        // Prevent spamming checks within 10 seconds
        const now = Date.now();
        if (now - lastCheckRef.current < 10000) return;
        lastCheckRef.current = now;

        try {
            const res = await fetch(`/api/app-version?_t=${now}`, {
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!res.ok) return;
            const data = await res.json();

            if (data && data.build_time) {
                const serverBuild = Number(data.build_time);
                const clientBuild = Number(clientBuildTime || 0);
                const installedBuild = Number(localStorage.getItem('sikap_installed_build') || 0);
                const dismissedBuild = Number(localStorage.getItem('sikap_dismissed_build') || 0);

                // Build efektif yang saat ini sedang aktif di klien
                const currentBuild = Math.max(clientBuild, installedBuild);

                // 1. Jika sudah uptodate (versi klien >= versi server), JANGAN tampilkan reminder
                if (currentBuild > 0 && serverBuild <= currentBuild) {
                    setUpdateAvailable(false);
                    return;
                }

                // 2. Jika user sudah pernah menutup/mengabaikan build versi ini, JANGAN tampilkan reminder lagi
                if (dismissedBuild && dismissedBuild >= serverBuild) {
                    setUpdateAvailable(false);
                    return;
                }

                // 3. Tampilkan hanya jika ada versi server yang benar-benar lebih baru dan belum pernah diabaikan
                if (serverBuild > currentBuild) {
                    setServerData(data);
                    setUpdateAvailable(true);
                }
            }
        } catch (e) {
            // Silently fail if offline or network error
        }
    }, [clientBuildTime]);

    useEffect(() => {
        // Jangan pasang interval jika bukan Android / Mobile
        if (!isTargetDevice) return;

        // Initial check after 4 seconds
        const initialTimer = setTimeout(() => {
            checkServerVersion();
        }, 4000);

        // Periodic check every 5 minutes
        const intervalTimer = setInterval(() => {
            checkServerVersion();
        }, 300000);

        // Check when tab becomes visible or gains focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkServerVersion();
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.update().catch(() => {});
                    });
                }
            }
        };

        const handleFocus = () => {
            checkServerVersion();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        // Service Worker update detection
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                checkServerVersion();
                            }
                        });
                    }
                });
            }).catch(() => {});
        }

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isTargetDevice, checkServerVersion]);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            if (serverData?.build_time) {
                localStorage.setItem('sikap_installed_build', String(serverData.build_time));
                localStorage.setItem('sikap_dismissed_build', String(serverData.build_time));
            }

            // 1. Clear browser caches
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }

            // 2. Notify & update service workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    await reg.update().catch(() => {});
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            }

            // 3. Force hard reload with timestamp cache-buster
            const targetUrl = new URL(window.location.href);
            targetUrl.searchParams.set('v', Date.now().toString());
            window.location.href = targetUrl.toString();
        } catch (err) {
            console.error('Update failed, performing direct reload:', err);
            window.location.reload(true);
        }
    };

    const handleDismiss = () => {
        setUpdateAvailable(false);
        if (serverData?.build_time) {
            localStorage.setItem('sikap_dismissed_build', String(serverData.build_time));
        }
    };

    // Jika bukan perangkat Android/Mobile atau tidak ada update, jangan render apapun
    if (!isTargetDevice || !updateAvailable) return null;

    return (
        <div className="fixed inset-x-4 bottom-20 sm:bottom-6 sm:left-auto sm:right-6 z-[9999] sm:max-w-md w-auto pointer-events-auto">
            {/* Outer Glass Card Halo with Pesantren Identity Halo */}
            <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-red-600 via-amber-500 via-emerald-500 to-blue-600 shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                {/* Internal Container */}
                <div className="relative bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-[15px] p-4 text-white overflow-hidden">
                    {/* Top Pesantren Ribbon Strip */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 via-emerald-500 to-blue-600">
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>

                    {/* Ambient Glows */}
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

                    {/* Content Header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5 pt-1">
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-400/30 text-amber-400">
                                <ArrowUpCircle className="w-5 h-5 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <span>Versi Baru Tersedia!</span>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                </h3>
                                <p className="text-[10px] text-slate-400 font-mono">
                                    Rilis: {serverData?.last_update || 'Terbaru'}
                                </p>
                            </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                            title="Tutup pembaruan"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
                        Pembaruan sistem SIKAP telah dirilis dengan perbaikan fitur, data, dan peningkatan performa terbaru. Perbarui sekarang untuk pengalaman optimal.
                    </p>

                    {/* 4 Identity Color Dots Indicator */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5" title="Harmoni 4 Warna Pesantren">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-[10px] text-slate-400 ml-1 font-medium">SIKAP System</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDismiss}
                                disabled={isUpdating}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Nanti
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="relative px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 rounded-lg shadow-md shadow-emerald-900/40 border border-emerald-400/30 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-75 disabled:cursor-wait overflow-hidden group"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                <span>{isUpdating ? 'Memperbarui...' : 'Perbarui Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
