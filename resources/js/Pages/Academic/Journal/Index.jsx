import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Calendar, BookOpen, Clock } from 'lucide-react';
import Pagination from '@/Components/Pagination';

import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

export default function Index({ journals, filters = {}, classes = [], mapels = [] }) {
    const [searchFilters, setSearchFilters] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        active_class_id: filters.active_class_id || '',
        mapel_id: filters.mapel_id || '',
        ...filters
    });

    // Debounced update for date inputs to avoid too many requests while typing? 
    // Usually date pickers are direct. Creating a common handler.

    const handleFilterChange = (key, value) => {
        const newFilters = { ...searchFilters, [key]: value };
        setSearchFilters(newFilters);

        router.get(route('journals.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };
    return (
        <MainLayout>
            <Head title="Absensi & Jurnal Kelas" />

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Absensi & Jurnal</h2>
                        <p className="text-muted-foreground">Catat aktivitas pembelajaran dan kehadiran siswa.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Link
                            href={route('journals.create')}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Input Jurnal
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Dari Tanggal</label>
                            <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchFilters.start_date || ''}
                                onChange={e => handleFilterChange('start_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Sampai Tanggal</label>
                            <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchFilters.end_date || ''}
                                onChange={e => handleFilterChange('end_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Kelas</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchFilters.active_class_id || ''}
                                onChange={e => handleFilterChange('active_class_id', e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Mata Pelajaran</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchFilters.mapel_id || ''}
                                onChange={e => handleFilterChange('mapel_id', e.target.value)}
                            >
                                <option value="">Semua Mapel</option>
                                {mapels.map((mapel) => (
                                    <option key={mapel.id} value={mapel.id}>{mapel.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setSearchFilters({});
                                router.get(route('journals.index'));
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            Reset Filter
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Tanggal/Waktu</th>
                                    <th className="px-6 py-3 font-medium">Kelas & Mapel</th>
                                    <th className="px-6 py-3 font-medium">Materi</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {journals.data.length > 0 ? (
                                    journals.data.map((journal) => (
                                        <tr key={journal.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {new Date(journal.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Jam ke-{journal.jam_ke}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">
                                                    {journal.active_subject?.mapel?.name ?? '-'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {journal.active_subject?.active_class?.kelas?.name ?? '-'} {journal.active_subject?.active_class?.kelas_paralel?.name ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="line-clamp-2" title={journal.topic}>
                                                    {journal.topic}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25">
                                                    Selesai
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={route('journals.edit', journal.id)}
                                                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada jurnal yang diinput.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={journals.links} />
            </div>
        </MainLayout>
    );
}
