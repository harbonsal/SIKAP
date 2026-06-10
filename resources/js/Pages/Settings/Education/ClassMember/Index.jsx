import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Users, Search, Filter, Eye } from 'lucide-react';
import { useState } from 'react';

export default function Index({ activeClasses, totalStudents, activeYearId, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || activeYearId || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('class-members.index'), {
            search,
            academic_year_id: selectedYear
        }, { preserveState: true });
    };

    const handleYearChange = (e) => {
        const yearId = e.target.value;
        setSelectedYear(yearId);
        router.get(route('class-members.index'), {
            search,
            academic_year_id: yearId
        }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Anggota Kelas" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Anggota Kelas</h2>
                        <p className="text-muted-foreground">Kelola siswa dalam rombongan belajar.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Cari nama kelas..."
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-2 font-medium w-16 text-center">No</th>
                                    <th className="px-4 py-2 font-medium">Kelas</th>
                                    <th className="px-4 py-2 font-medium">Wali Kelas</th>
                                    <th className="px-4 py-2 font-medium text-center">Jumlah Siswa</th>
                                    <th className="px-4 py-2 font-medium text-center w-[120px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {activeClasses.length > 0 ? (
                                    activeClasses.map((activeClass, index) => (
                                        <tr key={activeClass.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-2 text-center text-xs">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-sm">
                                                    {activeClass.kelas?.name} {activeClass.kelas_paralel?.name}
                                                </div>
                                                {activeClass.name && (
                                                    <div className="text-[10px] text-muted-foreground">{activeClass.name}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                {activeClass.teacher ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                                            {activeClass.teacher.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">{activeClass.teacher.name}</div>
                                                            <div className="text-[10px] text-muted-foreground">{activeClass.teacher.nomor_induk}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-xs">Belum ditentukan</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                                    {activeClass.class_members_count} Siswa
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Link
                                                    href={route('class-members.show', activeClass.id)}
                                                    className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                                    Lihat
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                                            Belum ada data kelas aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Total */}
                <div className="flex items-center justify-end bg-muted/40 p-4 rounded-lg border">
                    <div className="text-lg font-medium">
                        Total Seluruh Santri: <span className="font-bold text-primary text-xl ml-2">{totalStudents}</span>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
