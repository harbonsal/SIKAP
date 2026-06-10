import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({
    icon: Icon = FileQuestion,
    title = "Tidak ada data",
    description = "Belum ada data yang tersedia untuk halaman ini.",
    action,
    className
}) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500", className)}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                {description}
            </p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
}
