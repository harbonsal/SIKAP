import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

/**
 * Global loading overlay for Inertia navigation
 * Shows when page is loading/navigating
 */
export default function LoadingOverlay() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleStart = () => setIsLoading(true);
        const handleFinish = () => setIsLoading(false);

        // router.on() returns a cleanup function (Inertia v1 & v2 compatible)
        const removeStart = router.on('start', handleStart);
        const removeFinish = router.on('finish', handleFinish);

        return () => {
            if (typeof removeStart === 'function') removeStart();
            if (typeof removeFinish === 'function') removeFinish();
        };
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop blur */}
            <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
            
            {/* Loading indicator */}
            <div className="absolute top-4 right-4 bg-background border border-border rounded-lg shadow-lg p-3 flex items-center gap-2 pointer-events-auto">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Memuat...</span>
            </div>
        </div>
    );
}
