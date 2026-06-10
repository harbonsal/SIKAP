import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react'; // Add Link and router import
import { Plus, Search, Eye } from 'lucide-react';
import { useState } from 'react';

export default function Index({ kamars, permissions, filters }) {
    const [selectedKamarId, setSelectedKamarId] = useState(filters.active_kamar_id || '');

    const handleKamarChange = (e) => {
        const kamarId = e.target.value;
        setSelectedKamarId(kamarId);
        router.get(route('permissions.index'), { active_kamar_id: kamarId }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Manajemen Perizinan" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Perizinan</h2>
                        <p className="text-muted-foreground">Kelola perizinan keluar/masuk santri (Pesiar, Izin Sakit, dll).</p>
                    </div>
                    <Link
                        href={route('permissions.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Izin Baru
                    </Link>
                </div>

                {/* Filter Section */}
                <div className="bg-card rounded-xl border shadow-sm p-4">
                    <div className="max-w-sm">
                        <label className="block text-sm font-medium mb-1">Filter Kamar</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedKamarId}
                            onChange={handleKamarChange}
                        >
                            <option value="">-- Semua Kamar --</option>
                            {kamars.map(kamar => (
                                <option key={kamar.id} value={kamar.id}>
                                    {kamar.name} (Musrif: {kamar.musrif})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Permissions List */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nama Izin</th>
                                    <th className="px-6 py-3 font-medium">Kamar</th>
                                    <th className="px-6 py-3 font-medium">Waktu Mulai</th>
                                    <th className="px-6 py-3 font-medium">Waktu Akhir</th>
                                    <th className="px-6 py-3 font-medium text-center">Jumlah Santri</th>
                                    <th className="px-6 py-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {permissions.data.length > 0 ? (
                                    permissions.data.map((permission) => (
                                        <tr key={permission.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium">{permission.name}</td>
                                            <td className="px-6 py-4">{permission.kamar}</td>
                                            <td className="px-6 py-4">{permission.start_time}</td>
                                            <td className="px-6 py-4">{permission.end_time}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                    {permission.student_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={route('permissions.show', permission.id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada data perizinan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
