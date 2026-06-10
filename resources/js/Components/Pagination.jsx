import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links }) {
    return (
        <div className="flex flex-wrap justify-center gap-1">
            {links.map((link, key) => (
                link.url === null ? (
                    <div
                        key={key}
                        className="mb-1 mr-1 px-4 py-2 text-sm leading-4 text-muted-foreground border rounded bg-muted/50 opacity-50 cursor-not-allowed"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <Link
                        key={key}
                        className={cn(
                            "mb-1 mr-1 px-4 py-2 text-sm leading-4 border rounded hover:bg-accent hover:text-accent-foreground focus:border-primary focus:text-primary",
                            link.active ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "bg-background text-foreground"
                        )}
                        href={link.url}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    );
}
