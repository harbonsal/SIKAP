import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Index({ kamars, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('kamars.index'), { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data kamar ini?')) {
            router.delete(route('kamars.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Data Kamar" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Data Kamar</h2>
                    <Link
                        href={route('kamars.create')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kamar
                    </Link>
                </div>

                <div className="flex items-center space-x-2">
                    <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                        <input
                            type="text"
                            placeholder="Cari kamar atau gedung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </form>
                </div>

                <div className="rounded-md border">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nama Kamar</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gedung</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kapasitas</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Jenis</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kelas Penghuni</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {kamars.data.length > 0 ? (
                                    kamars.data.map((kamar) => (
                                        <tr key={kamar.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">{kamar.name}</td>
                                            <td className="p-4 align-middle">{kamar.building}</td>
                                            <td className="p-4 align-middle">{kamar.capacity}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${kamar.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                                    }`}>
                                                    {kamar.gender === 'L' ? 'Putra' : 'Putri'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-1">
                                                    {kamar.classes_info ? (
                                                        kamar.classes_info === '-' ? <span className="text-muted-foreground">-</span> :
                                                            kamar.classes_info.split(', ').map((cls, idx) => (
                                                                <span key={idx} className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                                    {cls}
                                                                </span>
                                                            ))
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route('kamars.edit', kamar.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(kamar.id)}
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
                                        <td colSpan="6" className="p-4 text-center text-muted-foreground">
                                            Tidak ada data kamar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {kamars.links && kamars.links.length > 3 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        {kamars.links.map((link, key) => (
                            <Link
                                key={key}
                                href={link.url || '#'}
                                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${link.active ? 'bg-accent text-accent-foreground' : ''
                                    } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
