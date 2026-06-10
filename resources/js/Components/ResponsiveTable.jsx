import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Responsive table wrapper with scroll indicators
 * Shows shadows when table can be scrolled left/right
 */
export default function ResponsiveTable({ children, className }) {
    const scrollRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        canScrollLeft: false,
        canScrollRight: false,
    });

    const checkScroll = () => {
        const element = scrollRef.current;
        if (!element) return;

        const { scrollLeft, scrollWidth, clientWidth } = element;
        
        setScrollState({
            canScrollLeft: scrollLeft > 0,
            canScrollRight: scrollLeft < scrollWidth - clientWidth - 1,
        });
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    return (
        <div className={cn('relative', className)}>
            {/* Left shadow indicator */}
            {scrollState.canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            )}

            {/* Right shadow indicator */}
            {scrollState.canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            )}

            {/* Scrollable container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="overflow-x-auto"
            >
                {children}
            </div>

            {/* Mobile scroll hint */}
            {scrollState.canScrollRight && (
                <div className="sm:hidden text-center py-2 text-xs text-muted-foreground">
                    ← Geser untuk melihat lebih banyak →
                </div>
            )}
        </div>
    );
}
