import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Filter } from 'lucide-react';
import { useState } from 'react';
import Pagination from '@/Components/Pagination';

export default function Index({ students, activeClasses, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('recap.student.index'), { search, active_class_id: selectedClass }, { preserveState: true });
    };

    const handleClassChange = (e) => {
        const classId = e.target.value;
        setSelectedClass(classId);
        router.get(route('recap.student.index'), { search, active_class_id: classId }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Rekap Nilai Santri" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Rekap Nilai Santri</h2>
                        <p className="text-muted-foreground">
                            Cari santri untuk melihat detail nilai.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <form onSubmit={handleSearch}>
                                    <input
                                        type="search"
                                        placeholder="Cari nama atau NIS..."
                                        className="flex h-9 w-full rounded-md border border-input bg-background pl-9 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </form>
                            </div>
                            <div className="relative w-full max-w-xs">
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                >
                                    <option value="">Semua Kelas</option>
                                    {activeClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.kelas.name} {cls.kelas_paralel?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">No</th>
                                        <th className="px-6 py-3 font-medium">NIS</th>
                                        <th className="px-6 py-3 font-medium">Nama Santri</th>
                                        <th className="px-6 py-3 font-medium">Kelas Saat Ini</th>
                                        <th className="px-6 py-3 font-medium text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students.data.length > 0 ? (
                                        students.data.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4">{(students.current_page - 1) * students.per_page + index + 1}</td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {student.nomor_induk}
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.class_members?.[0]?.active_class
                                                        ? `${student.class_members[0].active_class.kelas.name} ${student.class_members[0].active_class.kelas_paralel?.name || ''}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={route('recap.student.show', student.id)}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Nilai
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                                                Tidak ada data santri ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6">
                            <Pagination links={students.links} />
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
