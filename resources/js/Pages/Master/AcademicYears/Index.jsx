import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export default function Index({ academicYears, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    useEffect(() => {
        const serverSearch = filters?.search || '';
        if (debouncedSearch !== serverSearch) {
            router.get(
                route('academic-years.index'),
                { search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus Tahun Pelajaran ini?')) {
            router.delete(route('academic-years.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Tahun Pelajaran" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Tahun Pelajaran</h2>
                    <Link
                        href={route('academic-years.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah TP
                    </Link>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari TP..."
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tahun Pelajaran</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status Sistem</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status TP</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {academicYears.data.length > 0 ? (
                                    academicYears.data.map((tp) => (
                                        <tr key={tp.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{tp.name}</td>
                                            <td className="p-4 align-middle">
                                                {tp.is_active ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-green-600 text-white shadow hover:bg-green-700">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                        Tidak Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {tp.status === 'active' ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-700">
                                                        SIAP
                                                    </span>
                                                ) : tp.status === 'draft' ? (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-amber-500 text-white shadow hover:bg-amber-600">
                                                        DRAFT
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-transparent bg-slate-500 text-white shadow hover:bg-slate-600">
                                                        ARSIP
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route('academic-years.edit', tp.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(tp.id)}
                                                        disabled={tp.is_active}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-8 w-8 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                            Tidak ada data Tahun Pelajaran.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4">
                    <Pagination links={academicYears.links} />
                </div>
            </div>
        </MainLayout>
    );
}
