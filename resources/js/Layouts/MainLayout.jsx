import { useState, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { Menu, X, CheckCircle, XCircle, AlertTriangle, Info, Home, BookOpen, GraduationCap, User, Download, CalendarDays, Settings, LogOut, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import Sidebar from '@/Components/Sidebar';
import Dropdown from '@/Components/Dropdown';
import AcademicYearSwitcher from '@/Components/AcademicYearSwitcher';
import SmartSearchBar from '@/Components/SmartSearchBar';
import LoadingOverlay from '@/Components/LoadingOverlay';
import Breadcrumb from '@/Components/Breadcrumb';
import { cn } from '@/lib/utils';

const flashConfig = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-400',
        btnBg: 'bg-green-50 hover:bg-green-100',
        btnText: 'text-green-500',
        ring: 'focus:ring-green-600 focus:ring-offset-green-50',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: XCircle,
        iconColor: 'text-red-400',
        btnBg: 'bg-red-50 hover:bg-red-100',
        btnText: 'text-red-500',
        ring: 'focus:ring-red-600 focus:ring-offset-red-50',
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: AlertTriangle,
        iconColor: 'text-yellow-400',
        btnBg: 'bg-yellow-50 hover:bg-yellow-100',
        btnText: 'text-yellow-500',
        ring: 'focus:ring-yellow-600 focus:ring-offset-yellow-50',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: Info,
        iconColor: 'text-blue-400',
        btnBg: 'bg-blue-50 hover:bg-blue-100',
        btnText: 'text-blue-500',
        ring: 'focus:ring-blue-600 focus:ring-offset-blue-50',
    },
};

function FlashMessage({ type, message, errors, onDismiss }) {
    const config = flashConfig[type];
    if (!config || !message) return null;
    const Icon = config.icon;

    return (
        <div className={cn('mb-4 rounded-md p-4 border', config.bg, config.border)}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1">
                    <p className={cn('text-sm font-medium', config.text)}>{message}</p>
                    {errors && errors.length > 0 && (
                        <div className={cn('mt-2 text-sm', config.text)}>
                            <ul className="list-disc pl-5 space-y-1">
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            onClick={onDismiss}
                            type="button"
                            className={cn(
                                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                                config.btnBg,
                                config.btnText,
                                config.ring,
                            )}
                        >
                            <span className="sr-only">Tutup</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MainLayout({ children, breadcrumbItems = null, showBreadcrumb = true }) {
    const { auth, flash, app_settings } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissedTypes, setDismissedTypes] = useState({});
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const standalone = (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) || (typeof navigator !== 'undefined' && navigator.standalone);
        setIsStandalone(!!standalone);
    }, []);

    const handleInstallClick = async () => {
        if (window.deferredPWAInstallPrompt) {
            window.deferredPWAInstallPrompt.prompt();
            const { outcome } = await window.deferredPWAInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredPWAInstallPrompt = null;
            }
            return;
        }
        if (isStandalone) {
            Swal.fire({
                icon: 'success',
                title: 'Aplikasi Sudah Terpasang',
                text: 'Aplikasi SIKAP sudah terpasang dan sedang berjalan langsung di perangkat Anda.',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (isIOS) {
            Swal.fire({
                icon: 'info',
                title: 'Pasang di iPhone / iPad',
                html: '<div style="text-align: left; font-size: 14px; line-height: 1.6;">1. Ketuk tombol <b>Bagikan (Share)</b> 📤 di bilah navigasi Safari.<br/><br/>2. Gulir ke bawah lalu pilih menu <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b> ➕.<br/><br/>3. Ketuk <b>Tambah</b> di pojok kanan atas.</div>',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        Swal.fire({
            icon: 'info',
            title: 'Pasang Aplikasi SIKAP',
            html: '<div style="text-align: left; font-size: 14px; line-height: 1.6;">Untuk memasang aplikasi SIKAP secara langsung:<br/><br/>1. Ketuk ikon <b>titik tiga (⋮)</b> di pojok kanan atas browser Chrome.<br/><br/>2. Pilih menu <b>"Instal aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.<br/><br/>Aplikasi akan otomatis muncul di menu aplikasi HP Anda.</div>',
            confirmButtonColor: '#4f46e5'
        });
    };

    // Auto-close sidebar on navigation (mobile)
    useEffect(() => {
        const handleStart = () => setSidebarOpen(false);
        const removeStart = router.on('start', handleStart);
        return () => {
            if (typeof removeStart === 'function') removeStart();
        };
    }, []);

    // Close sidebar on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [sidebarOpen]);

    // Prevent body scroll when sidebar open (mobile)
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    // Reset dismissed state whenever flash changes (new page navigation)
    useEffect(() => {
        setDismissedTypes({});

        const types = ['success', 'error', 'warning', 'info'];
        const timers = types
            .filter((t) => flash?.[t])
            .map((t) =>
                setTimeout(() => setDismissedTypes((prev) => ({ ...prev, [t]: true })), 5000),
            );

        return () => timers.forEach(clearTimeout);
    }, [flash]);

    const dismissFlash = (type) => setDismissedTypes((prev) => ({ ...prev, [type]: true }));

    return (
        <div className="h-[100dvh] max-h-[100dvh] w-full bg-background font-sans antialiased flex overflow-hidden">
            <LoadingOverlay />
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Drawer */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 h-full transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-full print:hidden shrink-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                {/* Header - Fixed top in flex flow, shrink-0, stationary during scrolling */}
                <header className="shrink-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 print:hidden select-none">
                    <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
                        {/* Left: Brand Identity (Iconic Logo + Name) */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Link href={route('dashboard')} className="flex items-center gap-2 active:scale-95 transition-transform">
                                <img
                                    src={app_settings?.app_logo || "/images/logo.png"}
                                    alt="Logo"
                                    className="h-8 w-8 object-contain rounded-lg shadow-2xs"
                                />
                                <span className="font-black text-sm tracking-tight text-foreground truncate max-w-[120px] sm:max-w-none">
                                    {app_settings?.app_name || "SIKAP"}
                                </span>
                            </Link>
                        </div>

                        {/* Center: Smart Search Bar (Desktop only) */}
                        <div className="flex-1 max-w-md hidden sm:block mx-4">
                            <SmartSearchBar />
                        </div>

                        {/* Right: Iconic Action Controls (Clean, minimal text) */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                            <AcademicYearSwitcher />

                            {!isStandalone && (
                                <button
                                    onClick={handleInstallClick}
                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 transition-all active:scale-95 flex items-center justify-center shadow-2xs"
                                    title="Pasang Aplikasi (PWA)"
                                    aria-label="Pasang Aplikasi (PWA)"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
                            )}

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center p-0.5 rounded-full hover:bg-muted/70 transition-colors active:scale-95 ring-2 ring-primary/20" title={user?.name}>
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                            {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                                        </div>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right" width="56" contentClasses="py-1 bg-white dark:bg-zinc-950 border border-border shadow-xl rounded-xl">
                                    <div className="px-3.5 py-2.5 border-b border-border/60 bg-muted/20 text-xs">
                                        <p className="font-bold text-foreground truncate">{user?.name}</p>
                                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
                                            {user?.user_level?.name || user?.email}
                                        </span>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-2.5 text-xs py-2">
                                        <User className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Profil Saya</span>
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route('academic-calendar.index')} className="flex items-center gap-2.5 text-xs py-2">
                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                        <span>Kalender Akademik</span>
                                    </Dropdown.Link>
                                    <div className="border-t border-border/50 my-1"></div>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-2.5 text-xs py-2 text-red-600 hover:text-red-700">
                                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                                        <span>Keluar</span>
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Page Content with isolated scroll container */}
                <main scroll-region="true" className="flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-4 lg:p-6 pb-4 lg:pb-6">
                    <div className="print:hidden">
                        {['success', 'error', 'warning', 'info'].map((type) =>
                            flash?.[type] && !dismissedTypes[type] ? (
                                <FlashMessage
                                    key={type}
                                    type={type}
                                    message={flash[type]}
                                    errors={type === 'warning' || type === 'error' ? flash?.errors_import : null}
                                    onDismiss={() => dismissFlash(type)}
                                />
                            ) : null,
                        )}
                        
                        {/* Breadcrumb */}
                        {showBreadcrumb && <Breadcrumb items={breadcrumbItems} />}
                    </div>
                    
                    <div className="w-full max-w-full">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation Dock (Thumb Zone) - Stationary Fixed in flex flow */}
                <nav className="lg:hidden shrink-0 z-30 bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] print:hidden select-none">
                    <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
                        {/* 1. Beranda */}
                        <Link
                            href={route('dashboard')}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95",
                                route().current('dashboard')
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Home className={cn("h-5 w-5 mb-0.5", route().current('dashboard') && "stroke-[2.5px]")} />
                            <span className="text-[10px] leading-tight font-medium">Beranda</span>
                        </Link>

                        {/* 2. Jadwal */}
                        <Link
                            href={route('academic.schedules.index')}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95",
                                route().current('academic.schedules.*')
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CalendarDays className={cn("h-5 w-5 mb-0.5", route().current('academic.schedules.*') && "stroke-[2.5px]")} />
                            <span className="text-[10px] leading-tight font-medium">Jadwal</span>
                        </Link>

                        {/* 3. Jurnal KBM */}
                        <Link
                            href={route('journals.index')}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95",
                                route().current('journals.*')
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen className={cn("h-5 w-5 mb-0.5", route().current('journals.*') && "stroke-[2.5px]")} />
                            <span className="text-[10px] leading-tight font-medium">Jurnal</span>
                        </Link>

                        {/* 4. Nilai */}
                        <Link
                            href={route('assessments.index')}
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 active:scale-95",
                                route().current('assessments.*')
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <GraduationCap className={cn("h-5 w-5 mb-0.5", route().current('assessments.*') && "stroke-[2.5px]")} />
                            <span className="text-[10px] leading-tight font-medium">Nilai</span>
                        </Link>

                        {/* 5. Menu / Lainnya */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95"
                        >
                            <Menu className="h-5 w-5 mb-0.5" />
                            <span className="text-[10px] leading-tight font-medium">Menu</span>
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
}
