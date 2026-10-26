<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>SIKAP {{ \App\Models\SchoolInfo::first()?->name ?? 'Alwan' }}</title>
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon-96x96.png') }}">
    <link rel="icon" type="image/x-icon" href="{{ \App\Models\Setting::where('key', 'app_favicon')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_favicon')->value('value')) : (\App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : asset('favicon-96x96.png')) }}">

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
    <link rel="apple-touch-icon" href="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : asset('apple-touch-icon.png') }}">

    <script>
        // Deteksi PWA / Standalone mode sedini mungkin agar tidak muncul splash screen ganda
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            document.documentElement.classList.add('is-standalone-pwa');
        }
    </script>

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    <!-- Custom Splash Screen (Hanya tampil saat initial load browser biasa, disembunyikan di PWA karena OS sudah punya splash) -->
    <div id="app-splash" style="position: fixed; inset: 0; z-index: 9999; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.3s ease-out; font-family: 'Figtree', sans-serif; padding: 16px; box-sizing: border-box; overflow: hidden;">
        <div style="text-align: center; max-width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <!-- Iconic Multi-colored Text (Responsive clamp) -->
            <h1 style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.5rem, 5.5vw, 2.3rem); font-weight: 800; margin: 0 0 20px 0; letter-spacing: 1.5px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; text-transform: uppercase; line-height: 1.2;">
                <!-- SIKAP: Kuning Keemasan -->
                <span style="text-shadow: 0 0 15px rgba(234, 179, 8, 0.4); color: #ca8a04;">SIKAP</span>

                <!-- Dynamic School Name -->
                <span style="color: #059669; text-shadow: 0 0 10px rgba(5, 150, 105, 0.3);">
                    {{ \App\Models\SchoolInfo::first()?->name ?? 'Alwan' }}
                </span>
            </h1>

            <!-- Logo (Aman dari terpotong dengan object-contain dan safe padding) -->
            <div style="width: 120px; height: 120px; max-width: 35vw; max-height: 35vw; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
                <img src="{{ \App\Models\Setting::where('key', 'app_logo')->value('value') ? asset('storage/' . \App\Models\Setting::where('key', 'app_logo')->value('value')) : asset('images/logo.png') }}" alt="Logo SIKAP" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));">
            </div>

            <!-- Description & Elegant Emerald Progress Bar -->
            <div style="max-width: 320px; margin: 0 auto; padding: 0 10px;">
                <p style="font-size: 0.85rem; color: #64748b; font-weight: 500; line-height: 1.4; margin: 0 0 16px 0;">
                    Sistem Informasi Akademik Pesantren<br>
                    <span style="color: #047857; font-weight: 700;">{{ \App\Models\SchoolInfo::first()?->name ?? 'Alwan' }}</span>
                </p>
                <div style="display: flex; justify-content: center;">
                    <div style="width: 48px; height: 4px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: #059669; animation: loading 1.2s infinite ease-in-out; transform-origin: left;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .is-standalone-pwa #app-splash {
            display: none !important;
        }

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
        // Logika penghapusan Splash Screen secara mulus & instan tanpa delay ganda
        const hideSplash = () => {
            const splash = document.getElementById('app-splash');
            if (!splash) return;
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.remove();
            }, 300);
        };

        if (document.readyState === 'complete') {
            hideSplash();
        } else {
            window.addEventListener('load', hideSplash);
        }
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