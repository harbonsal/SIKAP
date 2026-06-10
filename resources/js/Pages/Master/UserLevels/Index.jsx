import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

export default function Index({ userLevels, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    useEffect(() => {
        const serverSearch = filters?.search || '';
        if (debouncedSearch !== serverSearch) {
            router.get(
                route('user-levels.index'),
                { search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus User Level ini?')) {
            router.delete(route('user-levels.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="User Level" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">User Level</h2>
                    <Link
                        href={route('user-levels.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Level
                    </Link>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari Level..."
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
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nama Level</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kategori</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {userLevels.data.length > 0 ? (
                                    userLevels.data.map((level) => (
                                        <tr key={level.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{level.name}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${level.category === 'Ustadz' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                    level.category === 'Santri' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                                    }`}>
                                                    {level.category}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route('user-levels.edit', level.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(level.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-muted-foreground">
                                            Tidak ada data User Level.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4">
                    <Pagination links={userLevels.links} />
                </div>
            </div>
        </MainLayout>
    );
}
