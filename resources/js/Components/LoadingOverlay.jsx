import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Global loading overlay for Inertia page navigation
 * Displays a centered modal featuring the school/app logo with a pulsing animation
 * and an elegant emerald green spinner ring.
 */
export default function LoadingOverlay() {
    const [isLoading, setIsLoading] = useState(false);
    const { props } = usePage();
    const appSettings = props?.app_settings;
    const logoUrl = appSettings?.app_logo || '/images/logo.png';
    const appName = appSettings?.app_name || 'SIKAP';

    useEffect(() => {
        let timer;
        const handleStart = () => {
            // Memberikan sedikit debounce (60ms) agar navigasi super kilat tidak berkedip kasar
            timer = setTimeout(() => {
                setIsLoading(true);
            }, 60);
        };

        const handleFinish = () => {
            if (timer) clearTimeout(timer);
            setIsLoading(false);
        };

        // router.on() returns a cleanup function (Inertia v1 & v2 compatible)
        const removeStart = router.on('start', handleStart);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            if (timer) clearTimeout(timer);
            if (typeof removeStart === 'function') removeStart();
            if (typeof removeFinish === 'function') removeFinish();
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none pointer-events-auto"
            aria-live="assertive"
            role="status"
        >
            {/* Backdrop blur halus */}
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Kartu Loading di Tengah Layar */}
            <div className="relative z-10 flex flex-col items-center justify-center px-8 py-7 rounded-3xl bg-white/95 dark:bg-slate-900/95 shadow-2xl border border-emerald-500/20 backdrop-blur-md animate-in zoom-in-95 duration-200">
                {/* Spinner & Pulsing Logo Container (Lega & Proporsional) */}
                <div className="relative flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36">
                    {/* Ambient Glow emerald di belakang */}
                    <div className="absolute inset-2 rounded-full bg-emerald-500/15 blur-xl animate-pulse" />

                    {/* Cincin Luar: Spinner Gradasi Emerald & Teal */}
                    <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/15 border-t-emerald-600 border-r-teal-400 animate-spin" />

                    {/* Cincin Aksen Halus: Berputar Berlawanan Arah */}
                    <div 
                        className="absolute inset-2 rounded-full border-[2px] border-transparent border-b-emerald-400/30 border-l-teal-500/30 animate-spin"
                        style={{ animationDirection: 'reverse', animationDuration: '4s' }}
                    />

                    {/* Wadah Logo Bulat Bersih di Tengah - Memberikan ruang lega agar logo tidak terpotong */}
                    <div className="relative flex items-center justify-center w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-slate-800 shadow-sm p-2.5 border border-emerald-500/15">
                        <img
                            src={logoUrl}
                            alt={appName}
                            className="w-full h-full object-contain animate-pulse drop-shadow-xs"
                            onError={(e) => {
                                e.currentTarget.src = '/images/logo.png';
                            }}
                        />
                    </div>
                </div>

                {/* Teks Status Memuat & Indikator Titik */}
                <div className="mt-4 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-300">
                        Memuat Data
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
}

