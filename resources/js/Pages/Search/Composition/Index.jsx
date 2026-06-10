import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Index({ students, filters, total_students, active_classes, active_kamars }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [kelasFilter, setKelasFilter] = useState(filters.kelas || '');
    const [asramaFilter, setAsramaFilter] = useState(filters.asrama || '');

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (newKelas, newAsrama) => {
        router.get(route('search.composition.index'), {
            search: searchTerm,
            kelas: newKelas !== undefined ? newKelas : kelasFilter,
            asrama: newAsrama !== undefined ? newAsrama : asramaFilter,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleKelasChange = (e) => {
        const val = e.target.value;
        setKelasFilter(val);
        applyFilters(val, undefined);
    }

    const handleAsramaChange = (e) => {
        const val = e.target.value;
        setAsramaFilter(val);
        applyFilters(undefined, val);
    }

    // Debounce search/filter application could be added here for better UX

    return (
        <MainLayout>
            <Head title="Lis Komposisi" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Lis Komposisi</h2>
                        <p className="text-muted-foreground">Data komposisi santri aktif berdasarkan kelas dan asrama.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="w-full sm:w-1/3 space-y-2">
                        <label className="text-sm font-medium">Cari Nama / NIS</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                    </div>

                    <div className="w-full sm:w-1/4 space-y-2">
                        <label className="text-sm font-medium">Filter Kelas</label>
                        <select
                            value={kelasFilter}
                            onChange={handleKelasChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Semua Kelas</option>
                            {active_classes.map((kelas) => (
                                <option key={kelas.id} value={kelas.id}>
                                    {kelas.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-1/4 space-y-2">
                        <label className="text-sm font-medium">Filter Asrama</label>
                        <select
                            value={asramaFilter}
                            onChange={handleAsramaChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Semua Asrama</option>
                            {active_kamars.map((kamar) => (
                                <option key={kamar.id} value={kamar.id}>
                                    {kamar.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={applyFilters}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 h-10 w-full sm:w-auto mt-auto"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Terapkan
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">NIS</th>
                                    <th className="px-6 py-3 font-medium">Nama</th>
                                    <th className="px-6 py-3 font-medium">Kelas</th>
                                    <th className="px-6 py-3 font-medium">Asrama</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students.data.length > 0 ? (
                                    students.data.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {(students.current_page - 1) * students.per_page + index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-mono">{student.nis}</td>
                                            <td className="px-6 py-4 font-medium">{student.name}</td>
                                            <td className="px-6 py-4">{student.kelas}</td>
                                            <td className="px-6 py-4">{student.asrama}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                                            Tidak ada data santri yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        Total Santri: <span className="font-bold text-foreground">{total_students}</span>
                    </div>

                    {students.links && students.links.length > 3 && (
                        <div className="flex items-center space-x-2">
                            {students.links.map((link, key) => (
                                <button
                                    key={key}
                                    onClick={() => link.url && router.get(link.url, { search: searchTerm, kelas: kelasFilter, asrama: asramaFilter }, { preserveState: true, preserveScroll: true })}
                                    disabled={!link.url || link.active}
                                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${link.active ? 'bg-accent text-accent-foreground' : ''
                                        } ${!link.url ? 'opacity-50' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
