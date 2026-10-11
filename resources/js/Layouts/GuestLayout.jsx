import { Link, usePage } from '@inertiajs/react';
import AppUpdateDetector from '@/Components/AppUpdateDetector';

export default function GuestLayout({ children }) {
    const { app_settings } = usePage().props;
    const schoolName = app_settings?.app_name?.replace('SIKAP ', '') || 'Pesantren Alwan';

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950 font-sans selection:bg-amber-500 selection:text-white"
            style={{
                backgroundImage: `url(${app_settings?.login_background || '/masjid_login.webp'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* 1. Deep Atmospheric Dual-Tone Overlay (Emerald Zamrud + Midnight Navy Blue) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-emerald-950/85 to-blue-950/90 backdrop-blur-[2px]"></div>

            {/* 2. Soft Ambient Color Glows (4 Identity Color Spotlights) */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute top-12 right-1/4 w-48 h-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none"></div>

            {/* 3. Subtle Islamic Geometric Star Pattern (Arabesque Watermark) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l7.5 12.5L50 5l-7.5 17.5L60 30l-17.5 7.5L50 55l-12.5-7.5L30 60l-7.5-12.5L10 55l7.5-17.5L0 30l17.5-7.5L10 5l12.5 7.5z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px',
                }}
            ></div>

            {/* 4. Center Content Wrapper */}
            <div className="relative z-10 w-full sm:max-w-md my-auto">
                {/* Outer Glass Card Halo */}
                <div className="rounded-[28px] p-[1.5px] bg-gradient-to-b from-white/30 via-amber-400/20 to-emerald-500/20 shadow-2xl shadow-black/60">
                    <div className="w-full overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[26px]">
                        {/* 4-Color Identity Ribbon (Merah -> Kuning-Oranye -> Hijau Daun -> Biru) */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 via-emerald-500 to-blue-600 relative overflow-hidden shadow-xs">
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>

                        {/* Top Branding Section */}
                        <div className="pt-6 pb-3 px-5 sm:px-8 text-center border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/30">
                            {/* Logo */}
                            <div className="flex justify-center mb-2.5">
                                <Link href="/" className="group inline-block transition-transform active:scale-95">
                                    <div className="relative p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-amber-400/30 border border-slate-100 dark:border-slate-700">
                                        <img
                                            src={app_settings?.app_logo || "/images/logo.png"}
                                            alt="Logo Pesantren"
                                            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
                                        />
                                    </div>
                                </Link>
                            </div>

                            {/* Name & Clean Tagline */}
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                                    <span>SIKAP</span>
                                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-base sm:text-lg">
                                        {schoolName}
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-0.5">
                                    Sistem Akademik Pesantren
                                </p>
                            </div>
                        </div>

                        {/* Card Body (Forms & Actions) */}
                        <div className="px-5 py-5 sm:px-8 sm:py-6">
                            {children}
                        </div>
                    </div>
                </div>
            </div>

            {/* App Update Detector */}
            <AppUpdateDetector />
        </div>
    );
}
