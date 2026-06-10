import { useState, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { Menu, X, CheckCircle, XCircle, AlertTriangle, Info, Home } from 'lucide-react';
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

function FlashMessage({ type, message, onDismiss }) {
    const config = flashConfig[type];
    if (!config || !message) return null;
    const Icon = config.icon;

    return (
        <div className={cn('mb-4 rounded-md p-4 border', config.bg, config.border)}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className={cn('text-sm font-medium', config.text)}>{message}</p>
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
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissedTypes, setDismissedTypes] = useState({});

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
        <div className="min-h-screen bg-background font-sans antialiased flex">
            <LoadingOverlay />
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 print:hidden",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:pl-0 transition-all duration-200">
                {/* Header */}
                <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
                    <div className="flex h-14 items-center gap-2 sm:gap-4 px-2 sm:px-4 lg:px-6 justify-between">
                        {/* Hamburger Menu Button - More Visible */}
                        <button
                            className="lg:hidden p-2 sm:p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        {/* Home Button - Prominent */}
                        <Link
                            href={route('dashboard')}
                            className="lg:hidden p-2 sm:p-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md"
                            aria-label="Home"
                        >
                            <Home className="h-6 w-6" />
                        </Link>

                        {/* Smart Search Bar - Center */}
                        <div className="flex-1 max-w-md hidden sm:block">
                            <SmartSearchBar />
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            <AcademicYearSwitcher />
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                        {user?.name || 'User'}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-3 sm:p-4 lg:p-6">
                    {['success', 'error', 'warning', 'info'].map((type) =>
                        flash?.[type] && !dismissedTypes[type] ? (
                            <FlashMessage
                                key={type}
                                type={type}
                                message={flash[type]}
                                onDismiss={() => dismissFlash(type)}
                            />
                        ) : null,
                    )}
                    
                    {/* Breadcrumb */}
                    {showBreadcrumb && <Breadcrumb items={breadcrumbItems} />}
                    
                    <div className="w-full max-w-full overflow-x-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
