import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import EmptyState from '@/Components/EmptyState';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';

// Helper Functions
const formatScore = (val) => {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    const num = parseFloat(val);
    if (isNaN(num)) return '-';
    if (Math.abs(num - 100) < 0.001) return '100';
    return num.toFixed(1);
};

const getScoreColor = (val, kkm) => {
    if (val === null || val === undefined || val === '' || val === '-') return 'text-muted-foreground';
    const num = parseFloat(val);
    const kkmNum = parseFloat(kkm);
    if (isNaN(num) || isNaN(kkmNum)) return 'text-foreground';

    if (Math.abs(num - 100) < 0.001) return 'text-blue-600 font-bold';
    if (num < kkmNum) return 'text-red-600 font-bold';
    return 'text-green-600 font-bold';
};

export default function Index({
    top10 = [],
    bottom20 = [],
    failures = {},
    missingInputs = {},
    studentGradesList = [],
    categories = [],
    targetMonths = [],
    filters = {},
    jenjangs = [],
    kamars = [],
    paginatedStudents = null,
    allSemesters = [],
    selectedSemesterId = null,
    activeSemesterName = '',
    selectedYear = null,
}) {
    const [activeTab, setActiveTab] = useState('ranking');
    
    // Local state for filters
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        jenjang_id: filters.jenjang_id || '',
        kamar_id: filters.kamar_id || '',
        safety_status: filters.safety_status || '',
        semester_id: selectedSemesterId || '',
    });

    const handleApplyFilters = () => {
        router.get(route('assessments.character.analysis.index'), localFilters, { preserveState: false, preserveScroll: false });
    };


    return (
        <MainLayout>
            <Head title="Analisa Nilai Akhlak" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analisa Nilai Akhlak</h2>
                    <p className="text-muted-foreground">Analisis performa nilai akhlak dan kepribadian santri.</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input
                            placeholder="Cari Nama / NIS..."
                            value={localFilters.search}
                            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                            className="bg-background"
                        />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={localFilters.jenjang_id || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, jenjang_id: e.target.value })}
                        >
                            <option value="">Semua Jenjang</option>
                            {(jenjangs || []).map(j => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                        </select>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={localFilters.kamar_id || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, kamar_id: e.target.value })}
                        >
                            <option value="">Semua Kamar</option>
                            {(kamars || []).map(k => (
                                <option key={k.id} value={k.id}>{k.name}</option>
                            ))}
                        </select>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={localFilters.safety_status || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, safety_status: e.target.value })}
                        >
                            <option value="">Semua Status</option>
                            <option value="aman">Aman (Rata-rata &ge; 70)</option>
                            <option value="perlu_perhatian">Perlu Perhatian (Ada Nilai &lt; 70 / Kosong)</option>
                            <option value="tidak_aman">Tidak Aman (Rata-rata &lt; 70)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t mt-2">
                        <Label className="text-sm font-medium whitespace-nowrap">Semester yang Dianalisis:</Label>
                        <div className="flex gap-2 flex-wrap">
                            {allSemesters.map(sem => (
                                <button
                                    key={sem.id}
                                    onClick={() => setLocalFilters({ ...localFilters, semester_id: sem.id })}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                        (localFilters.semester_id == sem.id)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    {sem.name}
                                    {sem.is_active ? <span className="ml-1 text-xs opacity-75">(Aktif)</span> : ''}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">
                            Tahun: <strong>{selectedYear}</strong> | Bulan Aktif: <strong>{targetMonths.join(', ')}</strong>
                        </span>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary/90">
                            Terapkan Filter
                        </Button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('ranking')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ranking' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Peringkat (Top/Bottom)
                    </button>

                    <button
                        onClick={() => setActiveTab('missing')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'missing' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Kontrol Input Nilai
                    </button>
                    <button
                        onClick={() => setActiveTab('grades_list')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'grades_list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        List Nilai Santri
                    </button>
                </div>

                {/* Tab Content: Ranking */}
                {activeTab === 'ranking' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Top 10 */}
                            <Card className="border-green-200">
                                <CardHeader className="bg-green-50/50 pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-green-700 flex items-center gap-2 text-lg">
                                        <span>🏆</span> Peringkat Teratas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px] text-center">Rank</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Kamar</TableHead>
                                                <TableHead className="text-right">Rata-rata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(top10 && top10.length > 0) ? (
                                                top10.map((student, idx) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="text-center font-bold text-muted-foreground w-12">#{idx + 1}</TableCell>
                                                        <TableCell className="font-medium">{student.student_name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{student.kamar_name}</TableCell>
                                                        <TableCell className="text-right font-bold text-green-600">{formatScore(student.avg_score)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                        Belum ada data nilai.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Bottom 20 */}
                            <Card className="border-red-200">
                                <CardHeader className="bg-red-50/50 pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
                                        <span>📉</span> Peringkat Terbawah
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px] text-center">Rank</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Kamar</TableHead>
                                                <TableHead className="text-right">Rata-rata</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(bottom20 && bottom20.length > 0) ? (
                                                bottom20.map((student, idx) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="text-center font-bold text-muted-foreground w-12">#{idx + 1}</TableCell>
                                                        <TableCell className="font-medium">{student.student_name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{student.kamar_name}</TableCell>
                                                        <TableCell className="text-right font-bold text-red-600">{formatScore(student.avg_score)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                        Tidak ada siswa dengan nilai rendah.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}


                {/* Tab Content: Missing Inputs */}
                {activeTab === 'missing' && (
                    <div className="space-y-6">
                        {Object.entries(missingInputs || {}).map(([month, kamars]) => (
                            <Card key={month} className="border-orange-200">
                                <CardHeader className="bg-orange-50/50 pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                                        <span>⚠️</span> Belum Input Nilai: Bulan {month}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                        {kamars.length} Kamar
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0 max-h-96 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kamar</TableHead>
                                                <TableHead>Musrif / Wali Kamar</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(kamars && kamars.length > 0) ? kamars.map((kamar, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{kamar.kamar_name || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{kamar.musrif_name || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                                            {month} Kosong
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                            <span className="text-sm">Semua kamar sudah menginput nilai {month}.</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                        {Object.keys(missingInputs || {}).length === 0 && (
                            <EmptyState
                                title="Semua Input Lengkap"
                                description="Seluruh kamar telah mengisi nilai akhlak untuk bulan yang aktif."
                            />
                        )}
                    </div>
                )}

                {/* Tab Content: List Nilai Santri */}
                {activeTab === 'grades_list' && (
                    <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50/50 pb-3">
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <span>📋</span> Rekap Detail Nilai Akhlak Santri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center border-r" rowSpan={2}>No</TableHead>
                                            <TableHead className="border-r min-w-[200px]" rowSpan={2}>Nama Santri & NIS</TableHead>
                                            <TableHead className="border-r min-w-[120px]" rowSpan={2}>Kamar & Kelas</TableHead>
                                            <TableHead className="text-center border-r w-16" rowSpan={2}>KKM</TableHead>
                                            <TableHead className="text-center border-r" colSpan={targetMonths.length}>Rata-rata Bulanan</TableHead>
                                            <TableHead className="text-center border-r" colSpan={categories.length}>Rata-rata Kategori</TableHead>
                                            <TableHead className="text-center border-r w-[80px]" rowSpan={2}>Rata-rata Total</TableHead>
                                            <TableHead className="text-center" rowSpan={2}>Status</TableHead>
                                        </TableRow>
                                        <TableRow>
                                            {targetMonths.map(m => (
                                                <TableHead key={`m-${m}`} className="text-center border-r border-t text-xs">{m.substring(0, 3)}</TableHead>
                                            ))}
                                            {categories.map(cat => (
                                                <TableHead key={`c-${cat}`} className="text-center border-r border-t text-xs">{cat}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(studentGradesList && studentGradesList.length > 0) ? (
                                            studentGradesList.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-center border-r font-medium">
                                                        {((paginatedStudents?.current_page || 1) - 1) * (paginatedStudents?.per_page || 25) + idx + 1}
                                                    </TableCell>
                                                    <TableCell className="border-r">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{row.student_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.nis}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{row.kamar_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.class_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center border-r font-semibold">{row.kkm}</TableCell>
                                                    
                                                    {/* Monthly Average Columns */}
                                                    {targetMonths.map(m => (
                                                        <TableCell
                                                            key={`m-${m}`}
                                                            className={`text-center border-r ${getScoreColor(row.monthly_scores?.[m], row.kkm)}`}
                                                        >
                                                            {formatScore(row.monthly_scores?.[m])}
                                                        </TableCell>
                                                    ))}

                                                    {/* Category Average Columns */}
                                                    {categories.map(cat => (
                                                        <TableCell
                                                            key={`c-${cat}`}
                                                            className={`text-center border-r ${getScoreColor(row.category_scores?.[cat], row.kkm)}`}
                                                        >
                                                            {formatScore(row.category_scores?.[cat])}
                                                        </TableCell>
                                                    ))}

                                                    <TableCell className={`text-center border-r text-base ${getScoreColor(row.final_score, row.kkm)}`}>
                                                        {formatScore(row.final_score)}
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                row.status === 'Aman' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                row.status === 'Perlu Perhatian' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                'bg-red-50 text-red-700 border-red-200'
                                                            }
                                                        >
                                                            {row.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6 + targetMonths.length + categories.length} className="h-64 text-center">
                                                    <EmptyState
                                                        title="Belum ada data nilai"
                                                        description="Tidak ada data santri yang ditemukan untuk filter ini."
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {paginatedStudents && paginatedStudents.links && activeTab === 'grades_list' && (
                    <Pagination links={paginatedStudents.links} />
                )}
            </div>
        </MainLayout>
    );
}
