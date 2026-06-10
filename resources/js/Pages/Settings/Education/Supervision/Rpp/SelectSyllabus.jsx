import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Search, ArrowRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import debounce from 'lodash/debounce';

export default function SelectSyllabus({ auth, silabuses, filters }) {
    const [search, setSearch] = useState('');

    // Helper to handle filter changes
    const handleFilterChange = (key, value) => {
        router.get(
            route('supervision-rpps.create'),
            { ...route().params, [key]: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = debounce((value) => {
        handleFilterChange('search', value);
    }, 500);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Pilih Materi (Silabus)</h2>}
        >
            <Head title="Pilih Silabus" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filters */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Mata Pelajaran</Label>
                                    <Select onValueChange={(val) => handleFilterChange('mapel_id', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Mapel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Mapel</SelectItem>
                                            {filters.mapels.map((m) => (
                                                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Kelas</Label>
                                    <Select onValueChange={(val) => handleFilterChange('kelas_id', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kelas</SelectItem>
                                            {filters.kelas.map((k) => (
                                                <SelectItem key={k.id} value={k.id.toString()}>{k.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cari Materi / KD</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari..."
                                            className="pl-8"
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <div className="grid grid-cols-1 gap-4">
                        {silabuses.data.length > 0 ? (
                            silabuses.data.map((item) => (
                                <Card key={item.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                                                        {item.mapel?.name}
                                                    </span>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                                        Kelas {item.kelas?.name}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-lg text-gray-900">{item.materi}</h4>
                                                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    <div>
                                                        <span className="font-bold block text-xs uppercase text-gray-400 mb-1">Standar Kompetensi</span>
                                                        <p className="line-clamp-2">{item.standar_kompetensi}</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block text-xs uppercase text-gray-400 mb-1">Kompetensi Dasar</span>
                                                        <p className="line-clamp-2">{item.kompetensi}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="lg" className="shrink-0 h-full py-8" asChild>
                                                <Link href={route('supervision-rpps.create', { silabus_id: item.id })}>
                                                    Buat RPP
                                                    <ArrowRight className="ml-2 w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Tidak ada silabus ditemukan</h3>
                                <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
