import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Input } from "@/Components/ui/input";
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function Index({ activeKamars, totalMembers, academicYear, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('search.active-kamars.index'), { search }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Lis Kamar Aktif" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Lis Kamar Aktif</h2>
                        <p className="text-muted-foreground">
                            Tahun Ajaran: {academicYear ? academicYear.name : 'Tidak ada yang aktif'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari kamar..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-4 py-2 font-medium w-16 text-center">No</TableHead>
                                <TableHead className="px-4 py-2 font-medium">Nama Kamar</TableHead>
                                <TableHead className="px-4 py-2 font-medium">Gedung</TableHead>
                                <TableHead className="px-4 py-2 font-medium">Kapasitas</TableHead>
                                <TableHead className="px-4 py-2 font-medium">Musrif</TableHead>
                                <TableHead className="px-4 py-2 font-medium">Jumlah Santri</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeKamars.length > 0 ? (
                                activeKamars.map((item, index) => (
                                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="px-4 py-2 text-center text-xs">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            <div className="font-medium text-sm">
                                                {item.name || item.kamar.name}
                                            </div>
                                            {item.name && <div className="text-[10px] text-muted-foreground">({item.kamar.name})</div>}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{item.kamar.building}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{item.kamar.capacity}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{item.musrif ? item.musrif.name : '-'}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm">{item.members.length} Santri</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Belum ada kamar aktif.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Total */}
                <div className="flex items-center justify-end bg-muted/40 p-4 rounded-lg border">
                    <div className="text-lg font-medium">
                        Total Seluruh Santri: <span className="font-bold text-primary text-xl ml-2">{totalMembers}</span>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
