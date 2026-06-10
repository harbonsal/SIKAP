import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Home } from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    // Auto Logout Logic
    const IDLE_TIMEOUT = 60 * 60 * 1000; // 60 Minutes
    const timeoutRef = useRef(null);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const now = Date.now();
        localStorage.setItem('lastActivity', now.toString()); // Sync tabs

        timeoutRef.current = setTimeout(() => {
            // Force reload to trigger server-side auth check
            // If session expired, Laravel redirects to login + remembers current URL
            window.location.reload();
        }, IDLE_TIMEOUT);
    };

    const checkActivityOnFocus = () => {
        const lastActivityStr = localStorage.getItem('lastActivity');
        const now = Date.now();

        if (lastActivityStr) {
            const lastActivity = parseInt(lastActivityStr);
            if (!isNaN(lastActivity) && now - lastActivity > IDLE_TIMEOUT) {
                window.location.reload();
                return;
            }
        }

        // Still valid or fresh session, just reset local timer
        resetTimer();
    };

    useEffect(() => {
        // Initial setup
        resetTimer();

        // Activity listeners
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const handleActivity = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Visibility/Focus listener (Handle "Nyala Kembali"/Wake Up)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkActivityOnFocus();
            }
        };
        window.document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', checkActivityOnFocus);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            window.document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', checkActivityOnFocus);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                                {usePage().props.dashboard_type === 'Teacher' && (
                                    <NavLink
                                        href={route('ikhtabir-nafsi.index')}
                                        active={route().current('ikhtabir-nafsi.*')}
                                    >
                                        Ikhtabir Nafsi
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            {/* Dashboard Switcher */}
                            {usePage().props.available_dashboards && usePage().props.available_dashboards.length > 1 && (
                                <div className="relative ms-3">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium leading-4 text-indigo-700 transition duration-150 ease-in-out hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none"
                                                >
                                                    View: {usePage().props.dashboard_type === 'Teacher' ? 'Guru' : (usePage().props.dashboard_type === 'Student' ? 'Santri' : 'Admin')}
                                                    <svg
                                                        className="-me-0.5 ms-2 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            {usePage().props.available_dashboards.map((dash) => (
                                                <Dropdown.Link
                                                    key={dash.type}
                                                    href={route('dashboard', { view_as: dash.type })}
                                                >
                                                    Lihat sebagai {dash.label}
                                                </Dropdown.Link>
                                            ))}
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            )}

                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:hidden">
                            {/* Home Button */}
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center justify-center rounded-lg p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md"
                                aria-label="Home"
                            >
                                <Home className="h-5 w-5" />
                            </Link>
                            
                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-lg p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                <svg
                                    className="h-5 w-5"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        {usePage().props.dashboard_type === 'Teacher' && (
                            <ResponsiveNavLink
                                href={route('ikhtabir-nafsi.index')}
                                active={route().current('ikhtabir-nafsi.*')}
                            >
                                Ikhtabir Nafsi
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-full px-3 sm:px-4 py-4 sm:py-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="w-full max-w-full overflow-x-auto">
                {children}
            </main>
        </div>
    );
}
