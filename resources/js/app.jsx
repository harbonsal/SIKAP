import '../css/app.css';
import './bootstrap';
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined') {
    registerSW({ immediate: true });
}

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'SIKAP';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#10b981', // Green-500 (primary color)
        showSpinner: true,
    },
});

// Handle Inertia session timeout
if (typeof window !== 'undefined') {
    router.on('error', (event) => {
        // Check if error is due to session timeout (401 or 419)
        if (event.detail.response?.status === 401 || event.detail.response?.status === 419) {
            // Save current URL to return after login
            const currentUrl = window.location.pathname + window.location.search;
            sessionStorage.setItem('intended_url', currentUrl);
            
            // Redirect to login
            window.location.href = '/login';
        }
    });
}
