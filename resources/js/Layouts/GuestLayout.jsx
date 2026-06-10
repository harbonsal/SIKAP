import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { app_settings } = usePage().props;
    return (
        <div 
            className="flex min-h-screen flex-col items-center justify-center pt-6 sm:pt-0 relative overflow-hidden"
            style={{
                backgroundImage: `url(${app_settings?.login_background || '/masjid_login.webp'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/30"></div>
            
            <div className="relative z-10 w-full sm:max-w-md px-4">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <img src={app_settings?.app_logo || "/images/logo.png"} alt="Logo" className="h-28 w-auto drop-shadow-2xl" />
                    </Link>
                </div>

                {/* Login Card */}
                <div className="w-full overflow-hidden bg-white/95 backdrop-blur-sm px-6 py-8 shadow-2xl rounded-2xl">
                    {children}
                </div>
            </div>
        </div>
    );
}
