import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Textarea } from '@/Components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Activity, Thermometer, Plus, Search, Calendar as CalendarIcon, Filter, X, Save, Settings, FileText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Checkbox } from '@/Components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Index({ records, filters, stats, complaints, descriptionTemplates = [], activeKamars = [] }) {
    const [search, setSearch] = useState(filters.search || '');
    // const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]); // Removed redundant state
    const firstRender = useRef(true);

    // Status Toggle Logic
    const toggleStatus = (record) => {
        if (confirm(`Ubah status ${record.student.user.name} menjadi ${record.status === 'Sakit' ? 'Sembuh' : 'Sakit'}?`)) {
            router.patch(route('health.records.toggle-status', record.id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Toast handled by flash message usually
                }
            });
        }
    };

    // Auto-search debounce
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        // Prevent redundant search if search term hasn't changed from what's potentially in URL
        if (search === (filters.search || '')) {
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('health.records.index'),
                {
                    ...filters,
                    search: search
                },
                { preserveState: true, replace: true }
            );
        }, 500); // Increased debounce slightly
        return () => clearTimeout(timeout);
    }, [search]); // Only trigger on search change

    return (
        <MainLayout>
            <Head title="Pantauan Kesehatan" />
            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        className={cn("bg-red-50 border-red-100 cursor-pointer transition-all hover:shadow-md hover:border-red-300", filters.status === 'Sakit' && "ring-2 ring-red-500")}
                        onClick={() => {
                            router.get(route('health.records.index'), {
                                ...filters, // Keep existing like search? Or reset? Usually reset for these shortcuts
                                start_date: new Date().toISOString().split('T')[0],
                                end_date: new Date().toISOString().split('T')[0],
                                status: 'Sakit',
                                complaint_id: '' // Clear complaint filter
                            }, { preserveState: true, preserveScroll: true });
                        }}
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
                    <Card
                        className={cn("bg-blue-50 border-blue-100 cursor-pointer transition-all hover:shadow-md hover:border-blue-300", filters.complaint_id && "ring-2 ring-blue-500")}
                        onClick={() => {
                            if (stats.most_common?.id) {
                                // Date range 30 days back
                                const end = new Date();
                                const start = new Date();
                                start.setDate(start.getDate() - 30);

                                router.get(route('health.records.index'), {
                                    ...filters,
                                    start_date: start.toISOString().split('T')[0],
                                    end_date: end.toISOString().split('T')[0],
                                    complaint_id: stats.most_common.id,
                                    status: '' // Clear status filter
                                }, { preserveState: true, preserveScroll: true });
                            }
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Keluhan Terbanyak</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">{stats.most_common?.name || '-'}</div>
                            <p className="text-xs text-blue-600">30 Hari Terakhir</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 space-y-3">
                            <div className="flex gap-2">
                                <Button variant="outline" className="w-1/2" asChild>
                                    <Link href={route('health.complaints.index')}>
                                        <Settings className="mr-2 h-4 w-4" /> Atur Keluhan
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-1/2" asChild>
                                    <Link href={route('health.description-templates.index')}>
                                        <FileText className="mr-2 h-4 w-4" /> Atur Keterangan
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="flex flex-col md:flex-row gap-6 items-start">

                    {/* Filters & Table */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari santri..."
                                    className="pl-10"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-sm text-gray-500">Tanggal:</span>
                                <Input
                                    type="date"
                                    value={filters.start_date || new Date().toISOString().split('T')[0]} // Fallback to today
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        router.get(route('health.records.index'), { ...filters, start_date: newStart, end_date: filters.end_date || newStart }, { preserveState: true, replace: true });
                                    }}
                                    className="w-32"
                                />
                                <span className="text-sm text-gray-500">-</span>
                                <Input
                                    type="date"
                                    value={filters.end_date || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        router.get(route('health.records.index'), { ...filters, end_date: e.target.value }, { preserveState: true, replace: true });
                                    }}
                                    className="w-32"
                                />
                                <Button variant="outline" size="icon" onClick={() => { setSearch(''); router.get(route('health.records.index')); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Santri</TableHead>
                                        <TableHead>Keluhan</TableHead>
                                        <TableHead>Terapi</TableHead>
                                        <TableHead>Ket</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.data.length > 0 ? (
                                        records.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {format(new Date(record.date), 'dd MMM yyyy', { locale: id })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold">{record.student?.user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{record.student?.latest_class_member?.active_class?.kelas?.name || '-'}</div>
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
                                                <TableCell className="max-w-[200px] truncate" title={record.therapy}>
                                                    {record.therapy || '-'}
                                                </TableCell>
                                                <TableCell className="max-w-[250px] truncate text-muted-foreground" title={record.description}>
                                                    {record.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        className={cn(
                                                            "cursor-pointer hover:opacity-80",
                                                            record.status === 'Sakit' ? 'bg-red-600' :
                                                                record.status === 'Sembuh' ? 'bg-green-600' :
                                                                    'bg-gray-600'
                                                        )}
                                                        onClick={() => toggleStatus(record)}
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Tidak ada data kesehatan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {records.links && records.links.length > 0 && (
                            <div className="flex justify-center mt-4 gap-1">
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
        </MainLayout>
    );
}
