import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Textarea } from '@/Components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import {
    Activity, Thermometer, Plus, Search, X, Save, Settings, FileText,
    Pencil, Trash2, Check, HeartPulse, AlertCircle, ChevronDown, Filter
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Checkbox } from '@/Components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Index({ records, stillSick = [], filters, stats, complaints, descriptionTemplates = [], activeKamars = [] }) {
    const { auth } = usePage().props;
    // Hanya Bagian Kesehatan (yang punya create_health_record) yang bisa kelola data
    const canManage = auth.user?.permissions?.includes('create_health_record') ||
                      auth.user?.permissions?.includes('*');

    const [search, setSearch]           = useState(filters.search || '');
    const [editRecord, setEditRecord]   = useState(null);   // record yang sedang diedit
    const [showComplaintStats, setShowComplaintStats] = useState(false);
    const firstRender = useRef(true);

    // ── Edit Form ──────────────────────────────────────────────────────────
    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        date:          '',
        complaint_ids: [],
        therapy:       '',
        description:   '',
        status:        'Sakit',
    });

    const openEdit = (record) => {
        setEditRecord(record);
        setEditData({
            date:          record.date ? record.date.substring(0, 10) : '',
            complaint_ids: record.complaints.map(c => c.id),
            therapy:       record.therapy || '',
            description:   record.description || '',
            status:        record.status,
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route('health.records.update', editRecord.id), {
            onSuccess: () => { setEditRecord(null); resetEdit(); },
        });
    };

    const toggleEditComplaint = (id) => {
        const ids = [...editData.complaint_ids];
        setEditData('complaint_ids', ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
    };

    // ── Toggle Status (Sembuh) ─────────────────────────────────────────────
    const toggleStatus = (record) => {
        const next = record.status === 'Sakit' ? 'Sembuh' : 'Sakit';
        if (confirm(`Ubah status ${record.student?.user?.name} menjadi ${next}?`)) {
            router.patch(route('health.records.toggle-status', record.id), {}, { preserveScroll: true });
        }
    };

    // ── Hapus ──────────────────────────────────────────────────────────────
    const handleDelete = (record) => {
        if (confirm(`Hapus catatan kesehatan ${record.student?.user?.name}?`)) {
            router.delete(route('health.records.destroy', record.id), { preserveScroll: true });
        }
    };

    // ── Auto-search debounce ───────────────────────────────────────────────
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        if (search === (filters.search || '')) return;
        const timeout = setTimeout(() => {
            router.get(route('health.records.index'), { ...filters, search }, { preserveState: true, replace: true });
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const daysSince = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return Math.floor((today - d) / 86400000);
    };

    return (
        <MainLayout>
            <Head title="Pantauan Kesehatan" />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* ── Stats Cards ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sakit Hari Ini */}
                    <Card
                        className={cn("bg-red-50 border-red-100 cursor-pointer transition-all hover:shadow-md hover:border-red-300", filters.status === 'Sakit' && "ring-2 ring-red-500")}
                        onClick={() => router.get(route('health.records.index'), { ...filters, start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(new Date(), 'yyyy-MM-dd'), status: 'Sakit', complaint_id: '' }, { preserveState: true, preserveScroll: true })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">Sakit Hari Ini</CardTitle>
                            <Thermometer className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900">{stats.sick_today}</div>
                            <p className="text-xs text-red-600">Santri perlu dipantau</p>
                        </CardContent>
                    </Card>

                    {/* Masih Belum Sembuh */}
                    <Card className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => document.getElementById('still-sick-section')?.scrollIntoView({ behavior: 'smooth' })}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800">Belum Sembuh</CardTitle>
                            <HeartPulse className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-900">{stats.still_sick_count}</div>
                            <p className="text-xs text-orange-600">Status sakit belum diubah</p>
                        </CardContent>
                    </Card>

                    {/* Keluhan Terbanyak */}
                    <Card
                        className={cn("bg-blue-50 border-blue-100 cursor-pointer transition-all hover:shadow-md hover:border-blue-300", filters.complaint_id && "ring-2 ring-blue-500")}
                        onClick={() => {
                            if (stats.most_common?.id) {
                                const end = new Date(), start = new Date();
                                start.setDate(start.getDate() - 30);
                                router.get(route('health.records.index'), { ...filters, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0], complaint_id: stats.most_common.id, status: '' }, { preserveState: true, preserveScroll: true });
                            }
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Keluhan Terbanyak</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-blue-900">{stats.most_common?.name || '-'}</div>
                            <p className="text-xs text-blue-600">30 Hari Terakhir</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tombol aksi (hanya Bagian Kesehatan) ─────────────── */}
                <div className="flex flex-wrap gap-2 justify-between items-center">
                    {canManage && (
                        <div className="flex gap-2">
                            <Button asChild>
                                <Link href={route('health.records.create')}>
                                    <Plus className="mr-2 h-4 w-4" /> Input Data Sakit
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('health.complaints.index')}>
                                    <Settings className="mr-2 h-4 w-4" /> Atur Keluhan
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('health.description-templates.index')}>
                                    <FileText className="mr-2 h-4 w-4" /> Atur Keterangan
                                </Link>
                            </Button>
                        </div>
                    )}
                    {/* Rekap keluhan 30 hari */}
                    <button
                        type="button"
                        className="text-sm text-blue-600 underline flex items-center gap-1"
                        onClick={() => setShowComplaintStats(v => !v)}
                    >
                        Rekap Keluhan 30 Hari <ChevronDown className={cn("h-4 w-4 transition-transform", showComplaintStats && "rotate-180")} />
                    </button>
                </div>

                {/* Rekap Keluhan (collapsible) */}
                {showComplaintStats && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Top Keluhan — 30 Hari Terakhir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {(stats.complaint_stats || []).map(c => (
                                    <div key={c.id} className="flex items-center gap-3">
                                        <div className="text-sm font-medium w-40 truncate">{c.name}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${Math.min((c.records_count / (stats.complaint_stats[0]?.records_count || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-blue-700 w-8 text-right">{c.records_count}x</span>
                                    </div>
                                ))}
                                {(stats.complaint_stats || []).length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-2">Belum ada data keluhan 30 hari terakhir.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Santri Masih Sakit ───────────────────────────────────── */}
                <div id="still-sick-section">
                    <div className="rounded-xl border border-orange-200 bg-orange-50 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-3 bg-orange-100 border-b border-orange-200">
                            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            <h2 className="font-semibold text-orange-800">
                                Santri Masih Sakit
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold w-5 h-5">
                                    {stillSick.length}
                                </span>
                            </h2>
                            <p className="text-xs text-orange-600 ml-auto">Belum dinyatakan sembuh</p>
                        </div>

                        {stillSick.length === 0 ? (
                            <div className="py-6 text-center text-green-700 text-sm font-medium">
                                ✅ Semua santri dalam kondisi sehat!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-orange-700 text-xs border-b border-orange-200 bg-orange-50/80">
                                            <th className="px-4 py-2 font-semibold">Santri</th>
                                            <th className="px-4 py-2 font-semibold">Kamar</th>
                                            <th className="px-4 py-2 font-semibold">Keluhan</th>
                                            <th className="px-4 py-2 font-semibold">Sejak</th>
                                            <th className="px-4 py-2 font-semibold">Hari</th>
                                            {canManage && <th className="px-4 py-2 font-semibold text-center">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stillSick.map((record) => {
                                            const days = daysSince(record.date);
                                            return (
                                                <tr key={record.id} className="border-b border-orange-100 hover:bg-orange-50/60 bg-white">
                                                    <td className="px-4 py-2">
                                                        <div className="font-semibold text-gray-800">{record.student?.user?.name}</div>
                                                        <div className="text-xs text-gray-500">{record.student?.kelas_name || '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 text-xs">
                                                        {record.student?.kamar_name || '-'}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1">
                                                            {record.complaints.map(c => (
                                                                <Badge key={c.id} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                                    {c.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap text-xs">
                                                        {format(new Date(record.date), 'dd MMM yyyy', { locale: id })}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Badge className={cn(
                                                            "text-xs",
                                                            days === 0 ? "bg-yellow-100 text-yellow-700" :
                                                            days <= 3  ? "bg-orange-100 text-orange-700" :
                                                                         "bg-red-100 text-red-700"
                                                        )}>
                                                            {days === 0 ? 'Hari ini' : `${days} hari`}
                                                        </Badge>
                                                    </td>
                                                    {canManage && (
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                onClick={() => toggleStatus(record)}
                                                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                                            >
                                                                <Check className="h-3 w-3" /> Sembuh
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Riwayat Catatan (Tabel Utama) ─────────────────────── */}
                <div className="space-y-4">
                    {/* Filter bar */}
                    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                            {/* Search */}
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari santri..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Filter Kamar */}
                            <select
                                className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={filters.active_kamar_id || ''}
                                onChange={(e) => router.get(route('health.records.index'), { ...filters, active_kamar_id: e.target.value }, { preserveState: true, replace: true })}
                            >
                                <option value="">Semua Kamar</option>
                                {activeKamars.map(k => (
                                    <option key={k.id} value={k.id}>{k.kamar?.name} {k.name ? `(${k.name})` : ''}</option>
                                ))}
                            </select>

                            {/* Filter Status */}
                            <select
                                className="border border-gray-300 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={filters.status || ''}
                                onChange={(e) => router.get(route('health.records.index'), { ...filters, status: e.target.value }, { preserveState: true, replace: true })}
                            >
                                <option value="">Semua Status</option>
                                <option value="Sakit">Sakit</option>
                                <option value="Sembuh">Sembuh</option>
                            </select>

                            {/* Tanggal */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 whitespace-nowrap">Tgl:</span>
                                <Input
                                    type="date"
                                    value={filters.start_date || ''}
                                    onChange={(e) => router.get(route('health.records.index'), { ...filters, start_date: e.target.value, end_date: filters.end_date || e.target.value }, { preserveState: true, replace: true })}
                                    className="w-32"
                                />
                                <span className="text-gray-400">–</span>
                                <Input
                                    type="date"
                                    value={filters.end_date || ''}
                                    onChange={(e) => router.get(route('health.records.index'), { ...filters, end_date: e.target.value }, { preserveState: true, replace: true })}
                                    className="w-32"
                                />
                            </div>

                            <Button variant="outline" size="icon" title="Reset Filter" onClick={() => { setSearch(''); router.get(route('health.records.index')); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Tabel Riwayat */}
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-800">Riwayat Catatan Kesehatan</h2>
                            <span className="text-xs text-gray-500">{records.total} catatan</span>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Santri</TableHead>
                                    <TableHead>Kamar</TableHead>
                                    <TableHead>Keluhan</TableHead>
                                    <TableHead>Terapi</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    {canManage && <TableHead className="text-center">Aksi</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.data.length > 0 ? (
                                    records.data.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium whitespace-nowrap text-xs">
                                                {format(new Date(record.date), 'dd MMM yyyy', { locale: id })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-sm">{record.student?.user?.name}</div>
                                                <div className="text-xs text-muted-foreground">{record.student?.kelas_name || '-'}</div>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {record.student?.latest_kamar_member?.active_kamar?.kamar?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {record.complaints.map(c => (
                                                        <Badge key={c.id} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                            {c.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate text-xs" title={record.therapy}>
                                                {record.therapy || '-'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={record.description}>
                                                {record.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={cn(
                                                        "text-xs",
                                                        canManage && "cursor-pointer hover:opacity-80",
                                                        record.status === 'Sakit'  ? 'bg-red-600' :
                                                        record.status === 'Sembuh' ? 'bg-green-600' : 'bg-gray-600'
                                                    )}
                                                    onClick={() => canManage && toggleStatus(record)}
                                                >
                                                    {record.status}
                                                </Badge>
                                            </TableCell>
                                            {canManage && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            title="Edit"
                                                            onClick={() => openEdit(record)}
                                                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            title="Hapus"
                                                            onClick={() => handleDelete(record)}
                                                            className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                                            Tidak ada data kesehatan untuk periode ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {records.links && records.links.length > 3 && (
                            <div className="flex justify-center p-4 gap-1 border-t">
                                {records.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        asChild
                                        disabled={!link.url}
                                    >
                                        <Link href={link.url || '#'} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Dialog Edit ─────────────────────────────────────────────── */}
            <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) { setEditRecord(null); resetEdit(); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Catatan Kesehatan</DialogTitle>
                        <DialogDescription>
                            {editRecord?.student?.user?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitEdit} className="space-y-4 py-2">
                        {/* Tanggal */}
                        <div className="space-y-1">
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                value={editData.date}
                                onChange={(e) => setEditData('date', e.target.value)}
                                required
                            />
                            {editErrors.date && <p className="text-xs text-red-500">{editErrors.date}</p>}
                        </div>

                        {/* Status */}
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={editData.status} onValueChange={(v) => setEditData('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sakit">Sakit</SelectItem>
                                    <SelectItem value="Sembuh">Sembuh</SelectItem>
                                    <SelectItem value="Istirahat">Istirahat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Keluhan */}
                        <div className="space-y-1">
                            <Label>Keluhan</Label>
                            <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                                {complaints.map(c => (
                                    <div key={c.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-c-${c.id}`}
                                            checked={editData.complaint_ids.includes(c.id)}
                                            onCheckedChange={() => toggleEditComplaint(c.id)}
                                        />
                                        <label htmlFor={`edit-c-${c.id}`} className="text-sm cursor-pointer">{c.name}</label>
                                    </div>
                                ))}
                            </div>
                            {editErrors.complaint_ids && <p className="text-xs text-red-500">Pilih minimal satu keluhan.</p>}
                        </div>

                        {/* Terapi */}
                        <div className="space-y-1">
                            <Label>Terapi / Tindakan (Opsional)</Label>
                            <Textarea
                                value={editData.therapy}
                                onChange={(e) => setEditData('therapy', e.target.value)}
                                placeholder="Paracetamol, Istirahat, ..."
                                rows={2}
                            />
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-1">
                            <Label>Keterangan (Opsional)</Label>
                            <div className="space-y-2">
                                <Select onValueChange={(v) => setEditData('description', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {descriptionTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.message}>
                                                {t.message.length > 50 ? t.message.substring(0, 50) + '...' : t.message}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData('description', e.target.value)}
                                    placeholder="Atau ketik manual..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setEditRecord(null); resetEdit(); }}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                <Save className="mr-2 h-4 w-4" />
                                {editProcessing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
