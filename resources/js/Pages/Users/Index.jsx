
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Download, Upload, KeyRound } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import Checkbox from '@/Components/Checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';

export default function Index({ users, filters, userLevels, total_count }) {
    const [params, setParams] = useState({
        search: filters.search || '',
        user_level_id: filters.user_level_id || '',
        status: filters.status || 'Aktif',
        category: filters.category || '',
        biodata_status: filters.biodata_status || '',
    });
    const [debouncedSearch] = useDebounce(params.search, 300);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                route('users.index'),
                { ...params, search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    const updateParams = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(users.data.map(user => user.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} user yang dipilih?`)) {
            router.delete(route('users.bulk-destroy'), {
                data: { ids: selectedIds },
                onSuccess: () => setSelectedIds([]),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
            router.delete(route('users.destroy', id));
        }
    };

    const getLevelColor = (levelName) => {
        switch (levelName) {
            case 'Administrator': return 'bg-red-50 text-red-700 ring-red-600/20';
            case 'Kepala Sekolah': return 'bg-purple-50 text-purple-700 ring-purple-600/20';
            case 'Wali Kelas': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case 'Guru': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            case 'Musrif Asrama': return 'bg-orange-50 text-orange-700 ring-orange-600/20';
            case 'Santri': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            default: return 'bg-gray-50 text-gray-600 ring-gray-500/20';
        }
    };

    return (
        <MainLayout>
            <Head title="Daftar Pengguna" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Daftar Pengguna</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Total Data: <span className="font-semibold text-foreground">{total_count}</span> |
                            Data Tampil: <span className="font-semibold text-foreground">{users.total}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus ({selectedIds.length}) Terpilih
                            </button>
                        )}
                        <Link
                            href={route('users.create')}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pengguna
                        </Link>
                    </div>
                </div>

                <div className="flex gap-2 justify-end mb-4">
                    <a
                        href={route('students.export-template-missing')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-yellow-50 text-yellow-700 px-4 py-2 text-sm font-medium shadow-sm hover:bg-yellow-100"
                        title="Unduh Template berisi User yang belum punya biodata"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Unduh Template
                    </a>
                    <Link
                        href={route('students.import')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Impor / Unggah CSV
                    </Link>
                </div>

                {/* Filters Section */}
                <Card className="border-none shadow-none bg-accent/20">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, NIS, atau email..."
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={params.search}
                                    onChange={(e) => updateParams('search', e.target.value)}
                                />
                            </div>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={params.user_level_id}
                                onChange={(e) => {
                                    updateParams('user_level_id', e.target.value);
                                    router.get(route('users.index'), { ...params, user_level_id: e.target.value }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="">Semua Level</option>
                                {userLevels.map((level) => (
                                    <option key={level.id} value={level.id}>{level.name}</option>
                                ))}
                            </select>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={params.category}
                                onChange={(e) => {
                                    updateParams('category', e.target.value);
                                    router.get(route('users.index'), { ...params, category: e.target.value }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="">Semua Kategori</option>
                                <option value="Siswa">Siswa</option>
                                <option value="Askar">Askar (Pegawai)</option>
                            </select>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={params.biodata_status}
                                onChange={(e) => {
                                    updateParams('biodata_status', e.target.value);
                                    router.get(route('users.index'), { ...params, biodata_status: e.target.value }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="">Status Biodata...</option>
                                <option value="completed">Sudah Lengkap</option>
                                <option value="incomplete">Belum Lengkap</option>
                            </select>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={params.status}
                                onChange={(e) => {
                                    updateParams('status', e.target.value);
                                    router.get(route('users.index'), { ...params, status: e.target.value }, { preserveState: true, replace: true });
                                }}
                            >
                                <option value="Aktif">Status Aktif</option>
                                <option value="Tidak Aktif">Non-Aktif</option>
                                <option value="Semua">Semua Status</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Card */}
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow>
                                    <TableHead className="w-[40px] pl-4">
                                        <Checkbox
                                            checked={users.data.length > 0 && selectedIds.length === users.data.length}
                                            onChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Identitas</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Level & Status</TableHead>
                                    <TableHead className="text-right pr-4">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length > 0 ? (
                                    users.data.map((user, index) => (
                                        <TableRow key={user.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="pl-4">
                                                <Checkbox
                                                    checked={selectedIds.includes(user.id)}
                                                    onChange={() => handleSelect(user.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{(users.from || 1) + index}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.nomor_induk || 'Belum ada NIP/NIS'}</span>
                                                    {user.nama_arab && <span className="text-xs text-muted-foreground font-arabic mt-0.5">{user.nama_arab}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col space-y-0.5">
                                                    <span className="text-sm font-medium">{user.no_hp || '-'}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={user.email}>{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1.5 direction-col">
                                                    {/* Primary Level */}
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getLevelColor(user.user_level?.name)}`}>
                                                        {user.user_level?.name || 'User'}
                                                    </span>

                                                    {/* Additional Levels */}
                                                    {user.additional_levels && user.additional_levels.map(level => (
                                                        <span key={level.id} className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getLevelColor(level.name)}`}>
                                                            {level.name}
                                                        </span>
                                                    ))}

                                                    {/* Status Badge */}
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${user.status === 'Aktif'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}>
                                                        {user.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex justify-end gap-2">
                                                    {usePage().props.auth.user.user_level.name === 'Administrator' && user.id !== usePage().props.auth.user.id && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Login sebagai ${user.name}?`)) {
                                                                    router.post(route('users.impersonate', user.id));
                                                                }
                                                            }}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-100 transition-colors"
                                                            title="Login Sebagai User Ini"
                                                        >
                                                            <KeyRound className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={route('users.edit', { user: user.id, ...params, page: users.current_page })}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-muted hover:text-accent-foreground transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/20 bg-background text-sm font-medium text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="text-muted-foreground">Tidak ada pengguna ditemukan</div>
                                                <p className="text-xs text-muted-foreground/60">Coba ubah filter pencarian Anda</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Pagination links={users.links} />
                </div>
            </div>
        </MainLayout>
    );
}
