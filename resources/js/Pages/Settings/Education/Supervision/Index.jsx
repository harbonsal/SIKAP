import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';
import { Plus, Eye, Trash2, TrendingUp, Users, Award, AlertTriangle, CheckCircle, ClipboardList, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import { router } from '@inertiajs/react';
import Pagination from '@/Components/Pagination';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Select from 'react-select';
import { useMemo } from 'react';

export default function Index({ supervisions, metrics, teachers = [], filters = {}, canViewAll = false, latestSupervision = null }) {
    const { total, average, categories } = metrics;

    const handleToggleQuestionnaire = (id) => {
        router.put(route('supervisions.toggle-questionnaire', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Swal.fire('Berhasil', 'Status angket diperbarui.', 'success'); // Optional toast
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus Data Supervisi?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('supervisions.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success')
                });
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'text-green-600 bg-green-50 border-green-200';
            case 'Baik': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Cukup': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-red-600 bg-red-50 border-red-200';
        }
    };

    const categoryColors = {
        'Sangat Baik': 'bg-green-500',
        'Baik': 'bg-blue-500',
        'Cukup': 'bg-yellow-500',
        'Kurang': 'bg-red-500',
    };

    // Helper for Row Number
    const getRowNumber = (index) => {
        return (supervisions.current_page - 1) * supervisions.per_page + index + 1;
    };

    const teacherOptions = useMemo(() => [
        { value: '', label: 'Semua Guru' },
        ...teachers.map(t => ({ value: t.id.toString(), label: t.name }))
    ], [teachers]);

    const currentTeacherOption = teacherOptions.find(opt => opt.value === (filters.teacher_id?.toString() || ''));

    return (
        <MainLayout>
            <Head title="Supervisi Akademik" />

            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Supervisi Akademik</h2>
                        <p className="text-muted-foreground">Monitoring kualitas pembelajaran dan penilaian guru (Format Baru).</p>
                    </div>
                    {canViewAll && (
                        <Link href={route('supervisions.create')}>
                            <Button className="gap-2 shadow-sm">
                                <Plus className="h-4 w-4" /> Input Supervisi Baru
                            </Button>
                        </Link>
                    )}
                </div>

                {canViewAll && (
                    <Card className="p-4 bg-muted/20 border-dashed">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">Filter Guru:</span>
                            <div className="w-72">
                                <Select
                                    options={teacherOptions}
                                    value={currentTeacherOption}
                                    onChange={(option) => {
                                        router.visit(route('supervisions.index', { ...filters, teacher_id: option.value }), {
                                            preserveState: true,
                                            preserveScroll: true,
                                        });
                                    }}
                                    className="text-sm"
                                    placeholder="Cari Guru..."
                                    isSearchable={true}
                                />
                            </div>
                        </div>
                    </Card>
                )}

                {(!canViewAll && latestSupervision) || (canViewAll && filters.teacher_id && latestSupervision) ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Link href={route('supervisions.show', latestSupervision.id)} className="block group md:col-span-1 h-full">
                                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 h-full transition-all duration-200 group-hover:shadow-md group-hover:border-indigo-300 cursor-pointer">
                                    <CardContent>
                                        <div className="flex items-end gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Skor</p>
                                                <div className="text-5xl font-bold text-indigo-700">
                                                    {latestSupervision.total_score}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href={route('supervisions.show', latestSupervision.id)} className="block group md:col-span-1 h-full">
                                <Card className="border-l-4 border-l-amber-400 h-full transition-all duration-200 group-hover:shadow-md group-hover:bg-amber-50/10 cursor-pointer">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 group-hover:text-amber-800 transition-colors">
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            Catatan / Rekomendasi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {latestSupervision.notes ? (
                                                <div className="p-3 bg-amber-50 rounded-md text-sm text-amber-900 italic border border-amber-100 group-hover:bg-amber-100/50 transition-colors">
                                                    <span className="font-bold not-italic text-xs block mb-1">Catatan Supervisor:</span>
                                                    "{latestSupervision.notes}"
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground italic">Tidak ada catatan khusus.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                ) : (
                    (!latestSupervision && filters.teacher_id) ? (
                        <Card className="p-8 text-center text-muted-foreground bg-muted/20 border-dashed">
                            <p>Belum ada data supervisi untuk guru ini.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Supervisi</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{total}</div>
                                    <p className="text-xs text-muted-foreground">Periode Aktif</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Rata-rata Skor</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{average}</div>
                                    <p className="text-xs text-muted-foreground">Poin (Raw)</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Sangat Baik</CardTitle>
                                    <Award className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{categories['Sangat Baik'] || 0}</div>
                                    <p className="text-sm text-muted-foreground">Guru Berprestasi</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-medium">Perlu Pembinaan</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">{categories['Kurang'] || 0}</div>
                                    <p className="text-sm text-muted-foreground">Prioritas Tindak Lanjut</p>
                                </CardContent>
                            </Card>
                        </div>
                    )
                )}

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Distribusi Kategori</CardTitle>
                            <CardDescription>Sebaran hasil penilaian guru</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center p-0 pb-6">
                            {/* Interactive Pie Chart */}
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(categories).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            onClick={(data) => {
                                                const category = data.name;
                                                const newCategory = filters.category === category ? '' : category;
                                                router.visit(route('supervisions.index', { ...filters, category: newCategory }), {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                });
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {Object.entries(categories).map(([name, value], index) => {
                                                const colorMap = {
                                                    'Sangat Baik': '#10b981', // green-500
                                                    'Baik': '#3b82f6', // blue-500
                                                    'Cukup': '#eab308', // yellow-500
                                                    'Kurang': '#ef4444', // red-500
                                                };
                                                const isActive = !filters.category || filters.category === name;
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={colorMap[name] || '#94a3b8'}
                                                        opacity={isActive ? 1 : 0.3}
                                                        stroke={isActive ? 'none' : '#fff'}
                                                    />
                                                );
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name, props) => [`${value} Guru`, name]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            content={({ payload }) => (
                                                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mt-2">
                                                    {payload.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-1 cursor-pointer"
                                                            onClick={() => {
                                                                const category = entry.value;
                                                                const newCategory = filters.category === category ? '' : category;
                                                                router.visit(route('supervisions.index', { ...filters, category: newCategory }), {
                                                                    preserveState: true,
                                                                    preserveScroll: true,
                                                                });
                                                            }}
                                                        >
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                            <span className={filters.category === entry.value ? 'font-bold text-foreground' : ''}>{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {filters.category && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit(route('supervisions.index', { ...filters, category: '' }))}
                                    className="mt-[-15px] gap-2 h-8 border-dashed text-muted-foreground hover:text-foreground hover:border-foreground"
                                >
                                    <RefreshCcw className="h-3 w-3" />
                                    Reset Filter ({filters.category})
                                </Button>
                            )}
                        </CardContent>
                    </Card>


                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Analisis Per Aspek Penilaian</CardTitle>
                            <CardDescription>Rata-rata skor untuk setiap aspek kompetensi (Skor 1.00 - 3.00)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {metrics.aspects && metrics.aspects.map((aspect) => (
                                    <div key={aspect.id} className="space-y-1">
                                        <div className="flex justify-between text-base">
                                            <span className="font-medium truncate pr-4" title={aspect.aspect}>
                                                {aspect.number}. {aspect.aspect}
                                            </span>
                                            <span className={`font-bold ${aspect.avg_score < 2 ? 'text-red-500' : aspect.avg_score < 2.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {aspect.avg_score}
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${aspect.avg_score < 2 ? 'bg-red-500' : aspect.avg_score < 2.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${(aspect.avg_score / 3) * 100}%` }}
                                                title={`Rata-rata: ${aspect.avg_score}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!metrics.aspects || metrics.aspects.length === 0) && (
                                    <p className="text-center text-muted-foreground py-4">Belum ada data analisis.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Riwayat Supervisi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto mb-4">
                                <table className="w-full text-base text-left min-w-[600px]">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 w-12 text-center">No</th>
                                            <th className="px-4 py-3">Tanggal</th>
                                            <th className="px-4 py-3">Guru</th>
                                            <th className="px-4 py-3">Mata Pelajaran</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-center">Skor</th>
                                            {canViewAll && <th className="px-4 py-3 text-center w-32">Angket Santri</th>}
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {supervisions.data.length > 0 ? (
                                            supervisions.data.map((item, index) => (
                                                <tr key={item.id} className="hover:bg-muted/5">
                                                    <td className="px-4 py-3 text-center text-muted-foreground text-sm">
                                                        {getRowNumber(index)}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                        {new Date(item.date).toLocaleDateString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-base">{item.teacher?.name}</div>
                                                        <div className="text-sm text-muted-foreground">{item.active_subject?.active_class?.kelas?.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {item.active_subject?.mapel?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Badge variant="outline" className={`font-medium px-3 py-1 ${getStatusColor(item.status)}`}>
                                                                {item.status || 'Draft'}
                                                            </Badge>
                                                            {!item.is_published && (
                                                                <Badge variant="secondary" className="text-[10px] h-5 bg-slate-200 text-slate-600">
                                                                    Draft
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-lg">
                                                        {item.total_score}
                                                    </td>
                                                    {canViewAll && (
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Switch
                                                                    checked={!!item.is_student_questionnaire_open}
                                                                    onCheckedChange={() => handleToggleQuestionnaire(item.id)}
                                                                />
                                                                <span className={`text-xs font-medium ${item.is_student_questionnaire_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                    {item.is_student_questionnaire_open ? 'Buka' : 'Tutup'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={route('supervisions.show', item.id)}>
                                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50">
                                                                    <Eye className="h-5 w-5" />
                                                                </Button>
                                                            </Link>
                                                            {canViewAll && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleDelete(item.id)}
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">
                                                    Belum ada data supervisi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination links={supervisions.links} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
