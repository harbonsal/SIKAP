import { useState, useEffect, useRef } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Search, Loader2, X, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import axios from 'axios';

export default function SmartSearchBar() {
    const { auth } = usePage().props;
    const userRole = auth.user?.user_level?.name || '';

    // Sembunyikan untuk santri
    if (['Santri', 'Siswa'].includes(userRole)) return null;

    const [open, setOpen]       = useState(false);
    const [query, setQuery]     = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult]   = useState(null);
    const inputRef              = useRef(null);

    // Ctrl+K shortcut
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
    useEffect(() => { if (!open) { setQuery(''); setResult(null); } }, [open]);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) { setResult(null); return; }
        const t = setTimeout(() => doSearch(query), 600);
        return () => clearTimeout(t);
    }, [query]);

    const doSearch = async (q) => {
        setLoading(true);
        try {
            const res = await axios.post(route('smart-search.query'), { q }, {
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content }
            });
            setResult(res.data);
        } catch {
            setResult({ type: 'error', answer: 'Pencarian gagal. Coba lagi.', results: [], links: [] });
        } finally {
            setLoading(false);
        }
    };

    const columns = result?.columns?.length
        ? result.columns
        : result?.results?.[0] ? Object.keys(result.results[0]) : [];

    const rows = result?.results ?? [];

    return (
        <>
            {/* Trigger */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 bg-muted/50 hover:bg-muted border border-input rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors w-full max-w-sm"
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">Cari apa saja...</span>
                <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center rounded border bg-background text-[10px] font-medium text-muted-foreground">
                    Ctrl K
                </kbd>
            </button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">

                    {/* Input */}
                    <div className="flex items-center border-b px-4 py-3 gap-3">
                        {loading
                            ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />
                            : <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                        }
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Cari santri, nilai, hafalan, kelas, guru..."
                            className="border-0 focus-visible:ring-0 text-base px-0"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="max-h-[70vh] overflow-y-auto">

                        {/* Empty state */}
                        {!query && !result && (
                            <div className="py-16 text-center text-muted-foreground text-sm">
                                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Ketik untuk mulai mencari</p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="py-16 text-center text-muted-foreground text-sm">
                                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                                <p>Sedang mencari...</p>
                            </div>
                        )}

                        {/* Result */}
                        {!loading && result && (
                            <div className="p-4 space-y-4">

                                {/* AI Answer */}
                                {result.answer && (
                                    <div className="text-sm text-foreground bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                                        {result.answer}
                                    </div>
                                )}

                                {/* Data Table */}
                                {rows.length > 0 && columns.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 border-b">
                                                    <tr>
                                                        {columns.map(col => (
                                                            <th key={col} className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((row, i) => (
                                                        <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                                                            {columns.map(col => (
                                                                <td key={col} className="px-4 py-2 whitespace-nowrap">
                                                                    {row[col] ?? '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Links */}
                                {result.links?.length > 0 && (
                                    <div className="space-y-1">
                                        {result.links.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm group"
                                            >
                                                <span>{link.label}</span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* No result */}
                                {rows.length === 0 && !result.links?.length && result.type !== 'error' && (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                        Tidak ada hasil ditemukan.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                        <span>Esc untuk tutup</span>
                        <span>AI-powered</span>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
