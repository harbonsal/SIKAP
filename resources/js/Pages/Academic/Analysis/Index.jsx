import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import EmptyState from '@/Components/EmptyState';
import { Badge } from '@/Components/ui/badge';
import Pagination from '@/Components/Pagination';
import { Popover, PopoverTrigger, PopoverContent } from '@/Components/ui/popover';
import { Checkbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';

// Helper Functions
const formatScore = (val) => {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    // Ensure it's a number
    const num = parseFloat(val);
    if (isNaN(num)) return '-';

    // Rule: Nilai 100 tanpa digit belakang koma
    if (Math.abs(num - 100) < 0.001) return '100';

    // Rule: Nilai lain 1 digit saja
    return num.toFixed(1);
};

const getScoreColor = (val, kkm) => {
    if (val === null || val === undefined || val === '' || val === '-') return 'text-muted-foreground';
    const num = parseFloat(val);
    const kkmNum = parseFloat(kkm);
    if (isNaN(num) || isNaN(kkmNum)) return 'text-foreground';

    // Rule: Nilai 100 warna biru
    if (Math.abs(num - 100) < 0.001) return 'text-blue-600 font-bold';

    // Rule: Nilai dibawah KKM warna merah
    if (num < kkmNum) return 'text-red-600 font-bold';

    // Rule: Nilai aman (>= KKM) berwarna hijau
    return 'text-green-600 font-bold';
};

export default function Index({
    top10 = [],
    bottom20 = [],
    failures = {},
    missingGrades = {},
    studentGradesList = [],
    safetyTargets = [],
    weightCategories = [],
    filters = {},
    jenjangs = [],
    kelases = [],
    isSem2 = false,
    weightComponents = [],
    paginatedStudents = null,
    allWeightComponents = [],
    server_patch_check = '',
    allSemesters = [],
    selectedSemesterId = null,
    activeSemesterName = '',
}) {
    const [activeTab, setActiveTab] = useState('ranking');
    
    // Local state for filters (no auto-load)
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        jenjang_id: filters.jenjang_id || '',
        kelas_id: filters.kelas_id || '',
        kelas_filter_type: filters.kelas_filter_type || 'include',
        safety_status: filters.safety_status || '',
        exam_types: filters.exam_types || '',
        exam_filter_type: filters.exam_filter_type || 'include',
        include_sem1: filters.include_sem1 === undefined || filters.include_sem1 === true || filters.include_sem1 === 'true' || filters.include_sem1 === '1',
        semester_id: filters.semester_id || selectedSemesterId || '',
    });

    const selectedKelas = localFilters.kelas_id ? (Array.isArray(localFilters.kelas_id) ? localFilters.kelas_id : localFilters.kelas_id.toString().split(',')) : [];
    const kelasFilterType = localFilters.kelas_filter_type || 'include';
    const selectedExams = localFilters.exam_types ? localFilters.exam_types.split(',') : [];
    const examFilterType = localFilters.exam_filter_type || 'include';

    const handleKelasChange = (kId) => {
        let newSelected = [...selectedKelas];
        const strId = kId.toString();
        if (newSelected.includes(strId)) {
            newSelected = newSelected.filter(id => id !== strId);
        } else {
            newSelected.push(strId);
        }
        setLocalFilters({ ...localFilters, kelas_id: newSelected.join(',') });
    };

    const handleKelasFilterTypeChange = (type) => {
        setLocalFilters({ ...localFilters, kelas_filter_type: type });
    };

    const handleExamTypeChange = (name) => {
        let newSelected = [...selectedExams];
        if (newSelected.includes(name)) {
            newSelected = newSelected.filter(id => id !== name);
        } else {
            newSelected.push(name);
        }
        setLocalFilters({ ...localFilters, exam_types: newSelected.join(',') });
    };

    const handleExamFilterTypeChange = (type) => {
        setLocalFilters({ ...localFilters, exam_filter_type: type });
    };

    const handleApplyFilters = () => {
        router.get(route('analysis.index'), localFilters, { preserveState: false, preserveScroll: false });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Analisis Akademik</h2>
                        <p className="text-muted-foreground">Analisis performa siswa dan target nilai.</p>
                    </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                    {/* ... (Same Filters Code) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Input
                            placeholder="Cari Nama / NIS..."
                            value={localFilters.search}
                            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
                            className="bg-background"
                        />
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={localFilters.jenjang_id || ''}
                            onChange={(e) => {
                                setLocalFilters({ ...localFilters, jenjang_id: e.target.value, kelas_id: '' });
                            }}
                        >
                            <option value="">Semua Jenjang</option>
                            {(jenjangs || []).map(j => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                        </select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`w-full justify-between h-10 px-3 py-2 font-normal ${selectedKelas.length > 0 ? 'text-primary border-primary' : 'text-muted-foreground'}`}>
                                    <span className="truncate">
                                        {selectedKelas.length > 0 
                                            ? `${selectedKelas.length} Kelas Dipilih (${kelasFilterType === 'exclude' ? 'Kecuali' : 'Sertakan'})` 
                                            : 'Semua Kelas'}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Tipe Filter</Label>
                                        <select 
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={kelasFilterType}
                                            onChange={(e) => handleKelasFilterTypeChange(e.target.value)}
                                        >
                                            <option value="include">Hanya Pilih Kelas Berikut</option>
                                            <option value="exclude">Sembunyikan Kelas Berikut</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Daftar Kelas</Label>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {(kelases || [])
                                                .filter(k => k && (!filters.jenjang_id || k.jenjang_id == filters.jenjang_id))
                                                .map(k => (
                                                    <div key={k.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`kelas-${k.id}`} 
                                                            checked={selectedKelas.includes(k.id.toString())}
                                                            onCheckedChange={() => handleKelasChange(k.id)}
                                                        />
                                                        <Label htmlFor={`kelas-${k.id}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {k.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            {(kelases || []).filter(k => k && (!filters.jenjang_id || k.jenjang_id == filters.jenjang_id)).length === 0 && (
                                                <p className="text-sm text-muted-foreground">Tidak ada kelas tersedia.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={localFilters.safety_status || ''}
                            onChange={(e) => {
                                setLocalFilters({ ...localFilters, safety_status: e.target.value });
                            }}
                        >
                            <option value="">Semua Status (Target)</option>
                            <option value="aman">Aman / Lulus</option>
                            <option value="perlu_perhatian">Perlu Perhatian (Ada Nilai &lt; KKM)</option>
                            <option value="tidak_aman">Tidak Aman / Tidak Lulus</option>
                        </select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={`w-full justify-between h-10 px-3 py-2 font-normal ${selectedExams.length > 0 ? 'text-primary border-primary' : 'text-muted-foreground'}`}>
                                    <span className="truncate">
                                        {selectedExams.length > 0 
                                            ? `${selectedExams.length} Jenis Ujian (${examFilterType === 'exclude' ? 'Kecuali' : 'Sertakan'})` 
                                            : 'Semua Jenis Ujian'}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="start">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Tipe Filter Ujian</Label>
                                        <select 
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={examFilterType}
                                            onChange={(e) => handleExamFilterTypeChange(e.target.value)}
                                        >
                                            <option value="include">Hanya Gunakan Ujian Berikut</option>
                                            <option value="exclude">Gunakan Semua Kecuali Berikut</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Daftar Jenis Ujian</Label>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {(allWeightComponents || []).filter(name => name !== 'Validasi').map(name => (
                                                <div key={name} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`exam-${name}`} 
                                                        checked={selectedExams.includes(name)}
                                                        onCheckedChange={() => handleExamTypeChange(name)}
                                                    />
                                                    <Label htmlFor={`exam-${name}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {name}
                                                    </Label>
                                                </div>
                                            ))}
                                            {(allWeightComponents || []).length === 0 && (
                                                <p className="text-sm text-muted-foreground">Tidak ada jenis ujian ditemukan.</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic mt-2 border-t pt-2">
                                        * Mempengaruhi perhitungan Rata-rata, Peringkat, dan Status Aman.
                                    </p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* Semester Selector */}
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
                            Sedang melihat: <strong>{activeSemesterName}</strong>
                        </span>
                    </div>

                    {isSem2 && (
                        <div className="flex items-center space-x-2 pt-2 border-t mt-2">
                            <Checkbox
                                id="include_sem1"
                                checked={localFilters.include_sem1}
                                onCheckedChange={(checked) => {
                                    setLocalFilters({ ...localFilters, include_sem1: checked });
                                }}
                            />
                            <Label htmlFor="include_sem1" className="text-sm font-medium cursor-pointer">
                                Sertakan Akumulasi Nilai Semester Ganjil (Hitung Rapor)
                            </Label>
                        </div>
                    )}
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
                        onClick={() => setActiveTab('remedial')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'remedial' ? 'border-red-500 text-red-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Siswa Remedial
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
                    <button
                        onClick={() => setActiveTab('safety_targets')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'safety_targets' ? 'border-purple-500 text-purple-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Target Nilai Aman
                    </button>
                </div>

                {/* Tab Content: Ranking */}
                {activeTab === 'ranking' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200 text-sm">
                            <p className="font-semibold mb-1">ℹ️ Informasi Perhitungan Rata-rata Peringkat</p>
                            <p>
                                Nilai <strong>Rata-rata</strong> Peringkat yang tampil di sini dihitung dengan cara yang persis sama dengan rekapitulasi buku Rapor / Rekap Nilai Kelas: 
                                <strong> mengalikan setiap kategori ujian dengan bobot persentase aslinya (UH, UTS, UAS, dll) untuk menghasilkan Nilai Akhir Mapel.</strong> 
                                Rata-rata peringkat ini didapat dari total Nilai Akhir Mapel dibagi dengan jumlah seluruh mata pelajaran wajib di kelas tersebut. 
                                Jika sedang berada di Semester Genap, nilai ini juga akan menghitung akumulasi dengan nilai Semester Ganjil.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top 10 */}
                        <Card className="border-green-200">
                            <CardHeader className="bg-green-50/50 pb-3 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-green-700 flex items-center gap-2 text-lg">
                                    <span>🏆</span> Peringkat Teratas
                                </CardTitle>
                                <select 
                                    className="h-8 text-sm rounded-md border border-green-200 bg-white px-2 text-green-700 focus:ring-green-500"
                                    value={filters.top_limit || '10'}
                                    onChange={(e) => {
                                        router.get(route('analysis.index'), {
                                            ...filters,
                                            top_limit: e.target.value
                                        }, { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    <option value="10">Top 10</option>
                                    <option value="20">Top 20</option>
                                    <option value="50">Top 50</option>
                                    <option value="100">Top 100</option>
                                    <option value="Semua">Semua Siswa</option>
                                </select>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px] text-center">Rank</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Kelas</TableHead>
                                            <TableHead className="text-right">Rata-rata</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(top10 && top10.length > 0) ? (
                                            top10.map((student, idx) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="text-center font-bold text-muted-foreground w-12">#{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">{student.student_name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{student.class_name}</TableCell>
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
                                <select 
                                    className="h-8 text-sm rounded-md border border-red-200 bg-white px-2 text-red-700 focus:ring-red-500"
                                    value={filters.bottom_limit || '20'}
                                    onChange={(e) => {
                                        router.get(route('analysis.index'), {
                                            ...filters,
                                            bottom_limit: e.target.value
                                        }, { preserveState: true, preserveScroll: true });
                                    }}
                                >
                                    <option value="10">Bottom 10</option>
                                    <option value="20">Bottom 20</option>
                                    <option value="50">Bottom 50</option>
                                    <option value="100">Bottom 100</option>
                                    <option value="Semua">Semua Siswa</option>
                                </select>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px] text-center">Rank</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Kelas</TableHead>
                                            <TableHead className="text-right">Rata-rata</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(bottom20 && bottom20.length > 0) ? (
                                            bottom20.map((student, idx) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="text-center font-bold text-muted-foreground w-12">#{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">{student.student_name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{student.class_name}</TableCell>
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

                {/* Tab Content: Remedial */}
                {activeTab === 'remedial' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FailureCard label="1 Nilai Merah" data={failures['1']} count={1} />
                            <FailureCard label="2 Nilai Merah" data={failures['2']} count={2} />
                            <FailureCard label="3 Nilai Merah" data={failures['3']} count={3} />
                            <FailureCard label=">3 Nilai Merah" data={failures['>3']} count={4} />
                        </div>
                    </div>
                )}

                {/* Tab Content: Missing Inputs */}
                {activeTab === 'missing' && (
                    <div className="space-y-6">
                        {Object.entries(missingGrades || {})
                            .filter(([category]) => category !== 'Validasi')
                            .map(([category, subjects]) => (
                            <Card key={category} className="border-orange-200">
                                <CardHeader className="bg-orange-50/50 pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                                        <span>⚠️</span> Belum Input Nilai: {category}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                        {subjects.length} Mapel
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-0 max-h-96 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Guru</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(subjects && subjects.length > 0) ? subjects.map(subject => (
                                                <TableRow key={subject.id || Math.random()}>
                                                    <TableCell className="font-medium">{subject.mapel?.name || '-'}</TableCell>
                                                    <TableCell>{subject.active_class?.kelas?.name || '-'} {subject.active_class?.kelas_paralel?.name || ''}</TableCell>
                                                    <TableCell className="text-muted-foreground">{subject.teacher?.name || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                                            {category} Kosong
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                            <span className="text-sm">Semua mapel sudah menginput nilai {category}.</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Tab Content: List Nilai Santri */}
                {activeTab === 'grades_list' && (
                    <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50/50 pb-3">
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <span>📋</span> List Nilai Santri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center border-r">No</TableHead>
                                            <TableHead className="border-r">Jenjang & Kelas</TableHead>
                                            <TableHead className="border-r">Nama Siswa & NIS</TableHead>
                                            <TableHead className="border-r">Mata Pelajaran</TableHead>
                                            <TableHead className="text-center border-r w-16">KKM</TableHead>
                                            {/* Dynamic Grade Columns */}
                                            {weightComponents?.filter(cat => cat !== 'Validasi').map(cat => (
                                                <TableHead key={cat} className="text-center border-r">{cat}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(studentGradesList && studentGradesList.length > 0) ? (
                                            studentGradesList.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-center border-r font-medium">{idx + 1}</TableCell>
                                                    <TableCell className="border-r">
                                                        <div className="flex flex-col">
                                                            <span>{row.jenjang_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.class_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{row.student_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.nis}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r">{row.subject_name}</TableCell>
                                                    <TableCell className="text-center border-r font-semibold">{row.kkm}</TableCell>
                                                    {/* Dynamic Grade Columns */}
                                                    {(weightComponents || []).filter(cat => cat !== 'Validasi').map(cat => (
                                                        <TableCell
                                                            key={cat}
                                                            className={`text-center border-r ${getScoreColor(row.scores?.[cat], row.kkm)}`}
                                                        >
                                                            {formatScore(row.scores?.[cat])}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6 + (weightComponents?.length || 0)} className="h-64 text-center">
                                                    <EmptyState
                                                        title="Belum ada data nilai"
                                                        description="Tidak ada data nilai yang ditemukan untuk filter ini."
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

                {/* Tab Content: Target Nilai Aman */}
                {activeTab === 'safety_targets' && (
                    <Card className="border-purple-200">
                        <CardHeader className="bg-purple-50/50 pb-3">
                            <CardTitle className="text-purple-700 flex items-center gap-2">
                                <span>🎯</span> Target Nilai Aman (Prediksi Kelulusan)
                            </CardTitle>
                            <CardDescription className="text-purple-600/80">
                                Menampilkan target nilai yang harus dicapai pada setiap ujian agar nilai akhir memenuhi KKM.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center border-r">No</TableHead>
                                            <TableHead className="border-r min-w-[200px]">Nama Siswa & NIS</TableHead>
                                            <TableHead className="border-r min-w-[120px]">Jenjang & Kelas</TableHead>
                                            <TableHead className="border-r min-w-[150px]">Mata Pelajaran</TableHead>
                                            <TableHead className="text-center border-r w-[60px]">KKM</TableHead>

                                            {/* Dynamic Columns */}
                                            {isSem2 && (
                                                <>
                                                    <TableHead className="text-center border-r bg-gray-50 text-gray-700 min-w-[80px]">
                                                        Rapor Sem 1
                                                    </TableHead>
                                                    <TableHead className="text-center border-r bg-purple-50 text-purple-700 min-w-[80px]" title="Target nilai Rapor Semester 2 agar lulus">
                                                        Rapor Sem 2
                                                    </TableHead>
                                                </>
                                            )}

                                            {weightComponents?.filter(comp => comp !== 'Validasi').map((comp, i) => (
                                                <TableHead key={i} className="text-center border-r min-w-[80px]">{comp}</TableHead>
                                            ))}

                                            <TableHead className="text-center border-r min-w-[100px]">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safetyTargets && safetyTargets?.length > 0 ? (
                                            safetyTargets.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-center border-r font-medium">{idx + 1}</TableCell>
                                                    <TableCell className="border-r">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{row.student_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.nis}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{row.jenjang_name}</span>
                                                            <span className="text-xs text-muted-foreground">{row.class_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="border-r">{row.subject_name}</TableCell>
                                                    <TableCell className="text-center border-r font-semibold">{row.kkm}</TableCell>

                                                    {/* Sem 1 & Target Sem 2 Score */}
                                                    {isSem2 && (
                                                        <>
                                                            <TableCell className={`text-center border-r bg-gray-50 ${getScoreColor(row.sem1_score, row.kkm)}`}>
                                                                {formatScore(row.sem1_score)}
                                                            </TableCell>
                                                            <TableCell className="text-center border-r bg-purple-50/30 italic font-medium text-purple-700" title="Target prediksi aman">
                                                                {row.target_rapor_sem2 > 100 ? '>100' : formatScore(row.target_rapor_sem2)}
                                                            </TableCell>
                                                        </>
                                                    )}

                                                    {/* Components */}
                                                    {(weightComponents || []).filter(comp => comp !== 'Validasi').map((comp, i) => {
                                                        const data = row.components?.[comp];
                                                        const isPredicted = data?.is_predicted;
                                                        const value = data?.value;

                                                        // Styling Logic
                                                        let cellClass = "text-center border-r ";
                                                        const scoreColor = getScoreColor(value, row.kkm);

                                                        // Apply Prediction styling (optional: merge with score color or keep separate)
                                                        // User requested specific colors for values. 
                                                        // I will prioritize score color, but maybe keep italic for prediction?
                                                        if (isPredicted) {
                                                            cellClass += " italic bg-purple-50/30 "; // Subtle background for prediction
                                                        }
                                                        cellClass += scoreColor;

                                                        return (
                                                            <TableCell key={i} className={cellClass}>
                                                                {isPredicted ? (
                                                                    <span title={`Target (${data.weight}%)`}>{formatScore(value)}</span>
                                                                ) : (
                                                                    <span>{formatScore(value)}</span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}

                                                    <TableCell className="text-center border-r">
                                                        <Badge variant="outline" className={`${row.status === 'Aman'
                                                            ? 'bg-green-100 text-green-800 border-green-200'
                                                            : row.status === 'Perlu Perhatian'
                                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                                : 'bg-red-100 text-red-800 border-red-200'
                                                            }`}>
                                                            {row.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={isSem2 ? 8 + weightComponents.length : 6 + weightComponents.length} className="h-64 text-center">
                                                    <EmptyState
                                                        title="Tidak ada data"
                                                        description="Tidak ada data untuk ditampilkan. Pastikan filter sesuai."
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
                {/* Tab Content: Target Nilai Aman */}
                {/* ... (Existing Content) ... */}
                {/* Pagination */}
                {/* Pagination - Only show for lists that are paginated */}
                {paginatedStudents && (activeTab === 'grades_list' || activeTab === 'safety_targets') && (
                    <div className="mt-8">
                        <Pagination links={paginatedStudents.links} />
                        <div className="text-center text-sm text-muted-foreground mt-2">
                            Menampilkan {paginatedStudents.from} sampai {paginatedStudents.to} dari {paginatedStudents.total} Siswa
                        </div>
                    </div>
                )}
            </div>
        </MainLayout >
    );
}

function FailureCard({ label, data, count }) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{label}</h4>
                <div className="text-3xl font-bold mb-1">
                    {data ? data.length : 0}
                </div>
                <p className="text-xs text-muted-foreground">Siswa</p>
            </CardContent>
        </Card>
    );
}
