import { Link, usePage } from '@inertiajs/react';
import AppUpdateDetector from '@/Components/AppUpdateDetector';

export default function GuestLayout({ children }) {
    const { app_settings } = usePage().props;
    const schoolName = app_settings?.app_name?.replace('SIKAP ', '') || 'Pesantren Alwan';
    const cardBackground = app_settings?.login_card_background;

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

            {/* 3b. Flowing Brand Colors Wave Backdrop (Merah, Kuning, Hijau, Biru) */}
            <div className="absolute -bottom-1 inset-x-0 pointer-events-none overflow-hidden h-44 sm:h-64 select-none z-0">
                <svg 
                    className="w-full h-full opacity-40 dark:opacity-30" 
                    viewBox="0 0 1440 240" 
                    preserveAspectRatio="none" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="bg-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.8" />
                            <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.75" />
                            <stop offset="65%" stopColor="#10B981" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="bg-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.65" />
                            <stop offset="45%" stopColor="#059669" stopOpacity="0.75" />
                            <stop offset="80%" stopColor="#2563EB" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="bg-wave-3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.7" />
                            <stop offset="40%" stopColor="#D97706" stopOpacity="0.6" />
                            <stop offset="70%" stopColor="#047857" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    <path d="M0,130 C300,210 460,80 760,140 C1060,200 1240,90 1440,150 L1440,240 L0,240 Z" fill="url(#bg-wave-3)" />
                    <path d="M0,165 C340,95 560,200 880,130 C1140,75 1300,175 1440,160 L1440,240 L0,240 Z" fill="url(#bg-wave-2)" />
                    <path d="M0,195 C260,155 500,220 780,175 C1060,130 1260,195 1440,185 L1440,240 L0,240 Z" fill="url(#bg-wave-1)" />
                </svg>
            </div>

            {/* 4. Center Content Wrapper */}
            <div className="relative z-10 w-full sm:max-w-md my-auto">
                {/* Outer Glass Card Halo */}
                <div className="rounded-[28px] p-[1.5px] bg-gradient-to-b from-white/60 via-slate-200/50 to-slate-300/30 dark:from-slate-700/60 dark:via-slate-800/50 dark:to-slate-900/30 shadow-2xl shadow-black/40">
                    <div className={`w-full overflow-hidden ${cardBackground ? 'bg-slate-900/5' : 'bg-white/95 dark:bg-slate-900/95'} backdrop-blur-xl rounded-[26px] relative shadow-inner`}>
                        {/* Custom Kotak Login Background Image with Soft Frosted Glass Shield */}
                        {cardBackground && (
                            <div 
                                className="absolute inset-0 pointer-events-none bg-cover bg-center -z-0"
                                style={{ backgroundImage: `url(${cardBackground})` }}
                            >
                                {/* Frosted Glass Overlay: image is vibrant and clearly visible, while form inputs & buttons stay 100% sharp */}
                                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/75 backdrop-blur-[0.5px]"></div>
                            </div>
                        )}

                        {/* Elegant Flowing 4-Color Wave Crown (Merah, Kuning, Hijau, Biru) */}
                        <div className="relative z-10 w-full h-7 sm:h-8 overflow-hidden select-none">
                            <svg 
                                className="w-full h-full block" 
                                viewBox="0 0 500 32" 
                                preserveAspectRatio="none" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="card-wave-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#DC2626" />
                                        <stop offset="28%" stopColor="#EA580C" />
                                        <stop offset="55%" stopColor="#F59E0B" />
                                        <stop offset="80%" stopColor="#10B981" />
                                        <stop offset="100%" stopColor="#2563EB" />
                                    </linearGradient>
                                    <linearGradient id="card-wave-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.75" />
                                        <stop offset="30%" stopColor="#FBBF24" stopOpacity="0.85" />
                                        <stop offset="65%" stopColor="#34D399" stopOpacity="0.9" />
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
                                    </linearGradient>
                                    <linearGradient id="card-wave-3" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.4" />
                                        <stop offset="35%" stopColor="#D97706" stopOpacity="0.5" />
                                        <stop offset="70%" stopColor="#059669" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.65" />
                                    </linearGradient>
                                </defs>
                                {/* Layer 1: Back Wave */}
                                <path 
                                    d="M0,0 L500,0 L500,18 C410,28 340,6 250,16 C160,26 90,8 0,22 Z" 
                                    fill="url(#card-wave-3)" 
                                />
                                {/* Layer 2: Middle Wave */}
                                <path 
                                    d="M0,0 L500,0 L500,13 C420,5 310,24 210,12 C130,2 60,18 0,10 Z" 
                                    fill="url(#card-wave-2)" 
                                />
                                {/* Layer 3: Front Crest Wave */}
                                <path 
                                    d="M0,0 L500,0 L500,9 C370,22 290,3 170,14 C100,20 40,5 0,14 Z" 
                                    fill="url(#card-wave-1)" 
                                />
                            </svg>
                            {/* Subtle Shimmer highlight bar on top edge */}
                            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-red-400 via-amber-300 via-emerald-300 to-blue-400 opacity-85"></div>
                        </div>

                        {/* Top Branding Section */}
                        <div className="relative z-10 pt-5 pb-3 px-5 sm:px-8 text-center bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/30">
                            {/* Logo with 4-Color Wave Ambient Glow */}
                            <div className="flex justify-center mb-2.5">
                                <Link href="/" className="group inline-block transition-transform active:scale-95">
                                    <div className="relative p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-amber-400/35 border border-slate-100 dark:border-slate-700">
                                        {/* Subtle Quad-Color Ambient Aura */}
                                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-red-500/20 via-amber-400/25 via-emerald-500/25 to-blue-500/20 blur-sm pointer-events-none -z-10 group-hover:blur-md transition-all"></div>
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

                        {/* Wave Decorative Divider Line (Merah, Kuning, Hijau, Biru) */}
                        <div className="relative z-10 h-[2px] w-full bg-gradient-to-r from-red-500/40 via-amber-400/60 via-emerald-500/60 to-blue-500/40"></div>

                        {/* Card Body (Forms & Actions) */}
                        <div className="relative z-10 px-5 py-5 sm:px-8 sm:py-6">
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
