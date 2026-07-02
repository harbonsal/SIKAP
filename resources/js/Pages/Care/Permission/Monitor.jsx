import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertCircle, Clock, ShieldCheck, Activity, CheckCircle, Wallet, Package, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

export default function Monitor({ pending_permissions = [], active_permissions = [], returned_permissions = [], late_returns = [], summary = { total_uang_saku: 0 } }) {
    const barangTitipanList = returned_permissions.filter(p => p.barang_titipan);
    const catatanList = returned_permissions.filter(p => p.keterangan);

    const { auth } = usePage().props;
    const userRole = auth?.user?.user_level?.name;
    const canManagePermissions = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager'].includes(userRole);

    const [searchQuery, setSearchQuery] = useState('');

    const filterByName = (item) => {
        if (!searchQuery) return true;
        return item.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const filteredPending = pending_permissions.filter(filterByName);
    const filteredActive = active_permissions.filter(filterByName);
    const filteredReturned = returned_permissions.filter(filterByName);

    const handleManualUpdate = (permission, action) => {
        const actionText = action === 'keluar' ? 'KELUAR' : 'KEMBALI';
        if (confirm(`Apakah Anda yakin ingin menandai santri ${permission.student_name} sudah ${actionText} secara manual?`)) {
            router.post(route('permissions.student.manual', permission.id), {
                action: action
            }, {
                preserveScroll: true
            });
        }
    };

    return (
        <MainLayout>
            <Head title="Pantauan Perizinan" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Pantauan & Analisa Perizinan</h2>
                        <p className="text-muted-foreground">Monitor santri yang sedang di luar dan riwayat keterlambatan.</p>
                    </div>
                </div>

                {/* Tabs / Navigation */}
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-max mb-6">
                    <Link
                        href={route('rfid.scan')}
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                    >
                        Pos Scanner
                    </Link>
                    {canManagePermissions && (
                        <Link
                            href={route('permissions.index')}
                            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                        >
                            Daftar Perizinan
                        </Link>
                    )}
                    <Link
                        href={route('permissions.monitor')}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-background shadow-sm text-foreground transition-all"
                    >
                        Pantauan Real-time
                    </Link>
                </div>

                <div className="relative max-w-md w-full mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Cari nama santri..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Santri Belum Keluar */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50 pb-4">
                            <CardTitle className="text-lg flex items-center text-slate-800">
                                <Clock className="w-5 h-5 mr-2" />
                                Belum Keluar ({filteredPending.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                            {filteredPending.length > 0 ? (
                                <ul className="divide-y">
                                    {filteredPending.map(p => (
                                        <li 
                                            key={p.id} 
                                            className="p-4 flex flex-col gap-1 hover:bg-muted/30 cursor-pointer transition-colors"
                                            onClick={() => handleManualUpdate(p, 'keluar')}
                                            title="Klik untuk menandai santri ini KELUAR secara manual"
                                        >
                                            <span className="font-semibold text-foreground">{p.student_name}</span>
                                            <p className="text-xs text-muted-foreground">{p.kamar} • {p.group_name}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Semua jadwal hari ini sudah keluar atau kosong.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sedang Keluar */}
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader className="bg-blue-50/50 pb-4">
                            <CardTitle className="text-lg flex items-center text-blue-800">
                                <Activity className="w-5 h-5 mr-2" />
                                Sedang di Luar ({filteredActive.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                            {filteredActive.length > 0 ? (
                                <ul className="divide-y">
                                    {filteredActive.map(p => (
                                        <li 
                                            key={p.id} 
                                            className={`p-4 flex flex-col gap-1 ${p.is_overdue ? 'bg-red-50/50' : 'hover:bg-muted/30'} cursor-pointer transition-colors`}
                                            onClick={() => handleManualUpdate(p, 'kembali')}
                                            title="Klik untuk menandai santri ini KEMBALI secara manual"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-foreground">{p.student_name}</span>
                                                    <p className="text-xs text-muted-foreground">{p.kamar} • {p.group_name}</p>
                                                </div>
                                                {p.is_overdue && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        Terlambat
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-sm mt-2 text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Keluar: {p.exit_at}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" /> Batas: {p.end_time}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Tidak ada santri yang sedang di luar saat ini.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sudah Kembali */}
                    <Card className="border-emerald-100 shadow-sm">
                        <CardHeader className="bg-emerald-50/50 pb-4">
                            <CardTitle className="text-lg flex items-center text-emerald-800">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Sudah Kembali ({filteredReturned.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                            {filteredReturned.length > 0 ? (
                                <ul className="divide-y">
                                    {filteredReturned.map(p => (
                                        <li key={p.id} className="p-4 flex flex-col gap-1 hover:bg-muted/30">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-foreground">{p.student_name}</span>
                                                    <p className="text-xs text-muted-foreground">{p.kamar} • {p.group_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-sm mt-2 text-muted-foreground">
                                                <div className="flex items-center gap-1 text-emerald-700">
                                                    <ShieldCheck className="w-3.5 h-3.5" /> Kembali: {p.return_at}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Belum ada santri yang kembali hari ini.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Riwayat Keterlambatan */}
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader className="bg-red-50/50 pb-4">
                            <CardTitle className="text-lg flex items-center text-red-800">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Keterlambatan ({late_returns.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                            {late_returns.length > 0 ? (
                                <ul className="divide-y">
                                    {late_returns.map(p => (
                                        <li key={p.id} className="p-4 hover:bg-muted/30">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-foreground">{p.student_name}</span>
                                                <p className="text-xs text-muted-foreground">{p.kamar} • {p.group_name}</p>
                                                
                                                <div className="mt-2 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                                    <div className="font-medium flex items-center gap-1">
                                                        <Clock className="w-4 h-4" /> Kembali: {p.return_at}
                                                    </div>
                                                    <div className="mt-1 opacity-90">{p.keterangan}</div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Belum ada catatan keterlambatan terbaru.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Titipan Keuangan & Barang */}
                    <Card className="border-amber-100 shadow-sm">
                        <CardHeader className="bg-amber-50/50 pb-4">
                            <CardTitle className="text-lg flex items-center text-amber-800">
                                <Wallet className="w-5 h-5 mr-2" />
                                Titipan (Uang & Barang)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="text-center p-4 bg-amber-100/50 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-800 font-medium mb-1">Total Uang Saku Terkumpul</p>
                                <h3 className="text-3xl font-bold text-amber-900">
                                    Rp {new Intl.NumberFormat('id-ID').format(summary.total_uang_saku)}
                                </h3>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Daftar Barang Titipan ({barangTitipanList.length})
                                </h4>
                                {barangTitipanList.length > 0 ? (
                                    <ul className="space-y-2 max-h-48 overflow-auto">
                                        {barangTitipanList.map(p => (
                                            <li key={p.id} className="text-sm p-2 rounded bg-muted/50 border border-border">
                                                <div className="font-semibold">{p.student_name}</div>
                                                <div className="text-muted-foreground mt-0.5">{p.barang_titipan}</div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Belum ada barang titipan.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daftar Catatan */}
                    <Card className="border-indigo-100 shadow-sm">
                        <CardHeader className="bg-indigo-50/50 pb-4">
                            <CardTitle className="text-lg flex items-center text-indigo-800">
                                <FileText className="w-5 h-5 mr-2" />
                                Daftar Catatan Kedatangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-auto">
                            {catatanList.length > 0 ? (
                                <ul className="divide-y">
                                    {catatanList.map(p => (
                                        <li key={p.id} className="p-4 hover:bg-muted/30">
                                            <div className="font-semibold text-foreground text-sm">{p.student_name}</div>
                                            <div className="mt-1 text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100">
                                                {p.keterangan}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Belum ada catatan kedatangan.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
