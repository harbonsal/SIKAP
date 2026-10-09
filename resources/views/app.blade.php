<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>SIKAP {{ \App\Models\SchoolInfo::first()?->name ?? 'Lembaga Anda' }}</title>
    <link rel="icon" type="image/x-icon" href="{{ \App\Models\Setting::where('key', 'app_favicon')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_favicon')->value('value')) : (\App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png') }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Inter:wght@400;500;600&family=Montserrat:wght@500;600;700;800;900&family=Orbitron:wght@800&display=swap" rel="stylesheet">

    <!-- PWA Settings -->
    <link rel="manifest" href="{{ route('pwa.manifest') }}">
    <meta name="theme-color" content="#ffffff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png' }}">

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    <!-- Custom Splash Screen -->
    <div id="app-splash" style="position: fixed; inset: 0; z-index: 9999; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s ease-out; font-family: 'Figtree', sans-serif;">
        <div style="text-align: center; padding: 20px;">
            <!-- Iconic Multi-colored Text -->
            <h1 style="font-family: 'Orbitron', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 30px; letter-spacing: 2px; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase;">
                <!-- SIKAP: Kuning Keemasan -->
                <span style="text-shadow: 0 0 15px rgba(234, 179, 8, 0.6); color: #ca8a04;">SIKAP</span>

                <!-- Dynamic School Name -->
                <span style="margin-left: 8px; color: #3b82f6; text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);">
                    {{ \App\Models\SchoolInfo::first()?->name ?? 'Lembaga Anda' }}
                </span>
            </h1>

            <!-- Logo -->
            <img src="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : '/images/logo.png' }}" alt="Logo SIKAP" style="width: 120px; height: 120px; object-fit: contain; margin: 0 auto 30px auto; display: block;">

            <!-- Description -->
            <div style="max-width: 300px; margin: 0 auto;">
                <p style="font-size: 0.875rem; color: #64748b; font-weight: 500; line-height: 1.5;">
                    Sistem Informasi Akademik Pesantren<br>
                    <span style="color: #0f172a; font-weight: 700;">{{ \App\Models\SchoolInfo::first()?->name ?? 'Lembaga Anda' }}</span>
                </p>
                <div style="margin-top: 20px; display: flex; justify-content: center;">
                    <div style="width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: #0f172a; animation: loading 1s infinite linear; transform-origin: left;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        @keyframes loading {
            0% {
                transform: scaleX(0);
            }

            50% {
                transform: scaleX(1);
            }

            100% {
                transform: scaleX(0);
                transform-origin: right;
            }
        }
    </style>

    <script>
        // Simple Logic to Remove Splash Screen
        window.addEventListener('load', () => {
            const splash = document.getElementById('app-splash');
            // Ensure it stays for at least a brief moment so user sees the branding
            setTimeout(() => {
                splash.style.opacity = '0';
                setTimeout(() => {
                    splash.remove();
                }, 500);
            }, 800);
        });
        // PWA Global Event Capture
        window.deferredPWAInstallPrompt = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPWAInstallPrompt = e;
            window.dispatchEvent(new Event('pwa-prompt-ready'));
        });

        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    </script>

    @inertia
</body>

</html>