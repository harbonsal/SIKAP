import MainLayout from '@/Layouts/MainLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { BookOpen, CircleCheck, TriangleAlert } from 'lucide-react';
import EmptyState from '@/Components/EmptyState';
import { cn } from '@/lib/utils';

export default function Index({ filters, filterOptions, teacherCompliance, problemStudents, journalAnalysis }) {
    const [localFilters, setLocalFilters] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        teacher_id: filters.teacher_id || '',
        mapel_id: filters.mapel_id || '',
        kelas_id: filters.kelas_id || '',
        status: filters.status || '',
        problem_type: filters.problem_type || '',
    });
    
    const [activeTab, setActiveTab] = useState('compliance');

    const handleApplyFilters = () => {
        router.get(route('academic.monitoring.journals'), localFilters, { preserveState: true, preserveScroll: true });
    };

    return (
        <MainLayout>
            <Head title="Pantauan Jurnal KBM" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pantauan Jurnal KBM</h2>
                    <p className="text-muted-foreground">Monitoring kepatuhan guru, rekap ketidakhadiran santri, dan analisa jurnal.</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-end">
                        <div className="space-y-2 w-full sm:w-auto">
                            <Label>Dari Tanggal</Label>
                            <Input
                                type="date"
                                value={localFilters.start_date}
                                onChange={(e) => setLocalFilters({ ...localFilters, start_date: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-2 w-full sm:w-auto">
                            <Label>Sampai Tanggal</Label>
                            <Input
                                type="date"
                                value={localFilters.end_date}
                                onChange={(e) => setLocalFilters({ ...localFilters, end_date: e.target.value })}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-2 w-full sm:w-auto min-w-[200px]">
                            <Label>Guru</Label>
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={localFilters.teacher_id}
                                onChange={(e) => setLocalFilters({ ...localFilters, teacher_id: e.target.value })}
                            >
                                <option value="">Semua Guru</option>
                                {filterOptions?.teachers?.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 w-full sm:w-auto min-w-[150px]">
                            <Label>Mata Pelajaran</Label>
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={localFilters.mapel_id}
                                onChange={(e) => setLocalFilters({ ...localFilters, mapel_id: e.target.value })}
                            >
                                <option value="">Semua Mapel</option>
                                {filterOptions?.mapels?.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 w-full sm:w-auto min-w-[150px]">
                            <Label>Kelas</Label>
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={localFilters.kelas_id}
                                onChange={(e) => setLocalFilters({ ...localFilters, kelas_id: e.target.value })}
                            >
                                <option value="">Semua Kelas</option>
                                {filterOptions?.kelas?.map(k => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                            </select>
                        </div>
                        {activeTab === 'analisa' && (
                            <div className="space-y-2 w-full sm:w-auto min-w-[150px]">
                                <Label>Status Sinkronisasi</Label>
                                <select
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={localFilters.status}
                                    onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="sinkron">Sinkron (Sesuai Target)</option>
                                    <option value="tidak_sinkron">Tidak Sinkron / Ada Catatan</option>
                                </select>
                            </div>
                        )}
                        {activeTab === 'students' && (
                            <div className="space-y-2 w-full sm:w-auto min-w-[150px]">
                                <Label>Jenis Masalah</Label>
                                <select
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={localFilters.problem_type}
                                    onChange={(e) => setLocalFilters({ ...localFilters, problem_type: e.target.value })}
                                >
                                    <option value="">Semua Masalah</option>
                                    <option value="Alpa">Alpa</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Seragam">Seragam Tdk Sesuai</option>
                                </select>
                            </div>
                        )}
                        <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary/90 h-9">
                            Terapkan Filter
                        </Button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b gap-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={cn("pb-2 font-medium transition-colors border-b-2", activeTab === 'compliance' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
                    >
                        Pantauan Jurnal
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={cn("pb-2 font-medium transition-colors border-b-2", activeTab === 'students' ? 'border-red-500 text-red-600' : 'border-transparent text-muted-foreground hover:text-foreground')}
                    >
                        Santri Bermasalah
                    </button>
                    <button
                        onClick={() => setActiveTab('analisa')}
                        className={cn("pb-2 font-medium transition-colors border-b-2", activeTab === 'analisa' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-muted-foreground hover:text-foreground')}
                    >
                        Analisa Jurnal
                    </button>
                </div>

                {/* Tab Content: Teacher Compliance */}
                {activeTab === 'compliance' && (
                    <Card className="border-blue-200">
                        <CardHeader className="bg-blue-50/50 pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <span>👨‍🏫</span> Rekap Pengisian Jurnal (Berdasarkan Jadwal)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center border-r">No</TableHead>
                                        <TableHead className="border-r">Nama Guru</TableHead>
                                        <TableHead className="text-center border-r">Ekspektasi (Jadwal)</TableHead>
                                        <TableHead className="text-center border-r">Disubmit</TableHead>
                                        <TableHead className="text-center border-r">Persentase</TableHead>
                                        <TableHead>Jadwal Terlewat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(teacherCompliance && teacherCompliance.length > 0) ? (
                                        teacherCompliance.map((item, idx) => (
                                            <TableRow key={item.teacher_id}>
                                                <TableCell className="text-center border-r font-medium">{idx + 1}</TableCell>
                                                <TableCell className="border-r font-medium">{item.teacher_name}</TableCell>
                                                <TableCell className="text-center border-r font-semibold">{item.expected}</TableCell>
                                                <TableCell className="text-center border-r font-semibold text-green-600">{item.submitted}</TableCell>
                                                <TableCell className="text-center border-r">
                                                    <Badge className={
                                                        item.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                                        item.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }>
                                                        {item.percentage}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {item.missed && item.missed.length > 0 ? (
                                                        <ul className="list-disc pl-4 text-xs text-red-600 space-y-1">
                                                            {item.missed.slice(0, 3).map((m, mIdx) => (
                                                                <li key={mIdx}>{m.date} ({m.day}) - {m.mapel} {m.kelas}</li>
                                                            ))}
                                                            {item.missed.length > 3 && (
                                                                <li className="text-muted-foreground">+ {item.missed.length - 3} lainnya</li>
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-xs text-green-600 font-medium">Lengkap ✓</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48">
                                                <EmptyState
                                                    title="Tidak Ada Data"
                                                    description="Tidak ditemukan jadwal/jurnal pada rentang tanggal tersebut."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Tab Content: Problem Students */}
                {activeTab === 'students' && (
                    <Card className="border-red-200">
                        <CardHeader className="bg-red-50/50 pb-3">
                            <CardTitle className="text-red-700 flex items-center gap-2">
                                <span>⚠️</span> Daftar Santri Bermasalah (Alpa, Sakit, Izin, Terlambat, Seragam)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center border-r">No</TableHead>
                                        <TableHead className="border-r">Nama Santri</TableHead>
                                        <TableHead className="text-center border-r">Total Masalah</TableHead>
                                        <TableHead className="text-center border-r">Alpa</TableHead>
                                        <TableHead className="text-center border-r">Sakit</TableHead>
                                        <TableHead className="text-center border-r">Izin</TableHead>
                                        <TableHead className="text-center border-r">Terlambat</TableHead>
                                        <TableHead className="text-center border-r">Seragam</TableHead>
                                        <TableHead>Catatan / Rincian Terakhir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(problemStudents && problemStudents.length > 0) ? (
                                        problemStudents.map((student, idx) => (
                                            <TableRow key={student.student_id}>
                                                <TableCell className="text-center border-r font-medium">{idx + 1}</TableCell>
                                                <TableCell className="border-r font-medium">{student.student_name}</TableCell>
                                                <TableCell className="text-center border-r font-bold text-red-600">{student.total_issues}</TableCell>
                                                <TableCell className="text-center border-r">{student.alpa_count > 0 ? <span className="text-red-500 font-bold">{student.alpa_count}</span> : '-'}</TableCell>
                                                <TableCell className="text-center border-r">{student.sakit_count > 0 ? <span className="text-orange-500">{student.sakit_count}</span> : '-'}</TableCell>
                                                <TableCell className="text-center border-r">{student.izin_count > 0 ? <span className="text-blue-500">{student.izin_count}</span> : '-'}</TableCell>
                                                <TableCell className="text-center border-r">{student.terlambat_count > 0 ? <span className="text-yellow-600">{student.terlambat_count}</span> : '-'}</TableCell>
                                                <TableCell className="text-center border-r">{student.seragam_count > 0 ? <span className="text-purple-600">{student.seragam_count}</span> : '-'}</TableCell>
                                                <TableCell>
                                                    <ul className="list-disc pl-4 text-xs space-y-1">
                                                        {student.details.slice(0, 3).map((d, dIdx) => (
                                                            <li key={dIdx}>
                                                                <span className="font-semibold">{d.date} (Jam {d.jam_ke}) - {d.mapel}</span>: 
                                                                <Badge variant="outline" className="ml-1 px-1 py-0 h-4 text-[10px]">{d.status}</Badge>
                                                                {d.note && <span className="text-muted-foreground ml-1 italic">"{d.note}"</span>}
                                                            </li>
                                                        ))}
                                                        {student.details.length > 3 && (
                                                            <li className="text-muted-foreground">+ {student.details.length - 3} catatan lainnya</li>
                                                        )}
                                                    </ul>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-48">
                                                <EmptyState
                                                    title="Alhamdulillah"
                                                    description="Tidak ada catatan ketidakhadiran bermasalah pada rentang tanggal ini."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Tab 3: Analisa Jurnal */}
                {activeTab === 'analisa' && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Analisa Target Silabus & Realisasi Jurnal</h2>
                        </div>
                        
                        {(!journalAnalysis || journalAnalysis.length === 0) ? (
                            <div className="text-center py-10 text-slate-500 bg-white rounded-lg border border-slate-200">
                                Tidak ada data jurnal pada rentang tanggal ini.
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="w-[50px] text-center">No</TableHead>
                                                <TableHead className="w-[120px]">Tanggal</TableHead>
                                                <TableHead className="w-[180px]">Guru</TableHead>
                                                <TableHead className="w-[180px]">Mapel & Kelas</TableHead>
                                                <TableHead className="w-[100px] text-center">Pekan</TableHead>
                                                <TableHead className="w-[250px]">Target Silabus</TableHead>
                                                <TableHead>Realisasi & Catatan Guru</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {journalAnalysis.map((journal, index) => (
                                                <TableRow key={journal.id} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="text-center font-medium text-slate-500">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-slate-700">{journal.date}</div>
                                                        <div className="text-xs text-slate-500 mt-1">Jam ke-{journal.jam_ke}</div>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-700">
                                                        {journal.teacher_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-slate-700">{journal.mapel}</div>
                                                        <div className="text-xs text-slate-500 mt-1">{journal.kelas}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {journal.pekan}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {journal.topic ? (
                                                            <span className="text-slate-800">{journal.topic}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Tidak ada target / topic</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                    {journal.description ? (
                                                        <div className="flex flex-col space-y-1">
                                                            <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                                                                <TriangleAlert className="w-3 h-3 mr-1" />
                                                                Tidak Sinkron / Ada Catatan
                                                            </span>
                                                            <span className="text-gray-700">{journal.description}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                            <CircleCheck className="w-3 h-3 mr-1" />
                                                            Sinkron (Sesuai Target)
                                                        </span>
                                                    )}
                                                </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
