import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Check, X, Trophy, AlertTriangle, Filter, Search, Download } from 'lucide-react';

export default function Index({ gradeWeights, allData, error, kkm = 75 }) {
    const formatScore = (val) => {
        if (val === null || val === undefined) return '-';
        const num = parseFloat(val);
        if (isNaN(num)) return '-';
        if (num === 100) return '100';
        return num.toFixed(1);
    };

    const [selectedExamId, setSelectedExamId] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClass, setSelectedClass] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all"); // all, done, not_done

    // Extract Unique Classes
    const uniqueClasses = useMemo(() => {
        if (!allData) return [];
        const classes = allData.map(row => row.class_name);
        return [...new Set(classes)].sort();
    }, [allData]);

    // Derived Logic for Filtering and Sorting
    const { processedData, topStudents, belowKkmStudents } = useMemo(() => {
        if (!allData) return { processedData: [], topStudents: [], belowKkmStudents: [] };

        // 1. Initial Map & Filter
        const filtered = allData.filter(row => {
            // Filter by Search Query (Name or NIS)
            const matchesSearch = row.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (row.nis && row.nis.includes(searchQuery));

            // Filter by Class
            const matchesClass = selectedClass === "all" || row.class_name === selectedClass;

            return matchesSearch && matchesClass;
        });

        // 2. Map data to include the relevant "display score" AND Check Status Filter
        const mapped = filtered.map(row => {
            let score = 0;
            let filled = false;

            if (selectedExamId === "all") {
                score = row.average;
                filled = row.filled_count > 0;
            } else {
                // Get raw score for specific exam
                score = row.scores ? (row.scores[selectedExamId] || 0) : 0;
                filled = score > 0;
            }

            return {
                ...row,
                displayScore: score, // This is what we sort/filter by
                isFilled: filled
            };
        }).filter(row => {
            // Filter by Status (Done / Not Done) based on the selected context
            if (statusFilter === 'done') return row.isFilled;
            if (statusFilter === 'not_done') return !row.isFilled;
            return true;
        });

        // 3. Top 10 (From Filtered Results)
        // Filter only those who have a score/filled
        const withScores = mapped.filter(r => r.isFilled);
        const sortedTop = [...withScores].sort((a, b) => b.displayScore - a.displayScore).slice(0, 10);

        // 4. Below KKM (From Filtered Results)
        // Filter: filled AND score < kkm
        const below = mapped.filter(r => r.isFilled && r.displayScore < kkm)
            .sort((a, b) => a.displayScore - b.displayScore); // Lowest first

        return {
            processedData: mapped,
            topStudents: sortedTop,
            belowKkmStudents: below
        };
    }, [allData, selectedExamId, searchQuery, selectedClass, statusFilter, kkm]);

    const handleDownload = () => {
        if (!processedData || processedData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }

        // 1. Define Headers
        let headers = ["Nama Santri", "NIS", "Kelas", "Penguji"];

        // Dynamic Headers for Exams
        if (selectedExamId === 'all') {
            gradeWeights.forEach(gw => headers.push(gw.name));
            headers.push("Nilai Rapor");
        } else {
            const examName = gradeWeights.find(g => String(g.id) === selectedExamId)?.name || 'Nilai';
            headers.push(examName);
        }

        // 2. Build Rows
        const rows = processedData.map(row => {
            const basicInfo = [
                `"${row.student_name}"`, // Quote to handle commas in names
                `"${row.nis || ''}"`,
                `"${row.class_name}"`,
                `"${row.tester_name || '-'}"`
            ];

            const scores = [];
            if (selectedExamId === 'all') {
                gradeWeights.forEach(gw => {
                    // Check if exam taken (true/false) or show score if available
                    // For status overview, maybe just 'V' or 'X'? Or the score?
                    // Let's show the score if exists, else 0/Empty
                    const score = row.scores ? (row.scores[gw.id] || 0) : 0;
                    scores.push(score > 0 ? formatScore(score) : 0);
                });
                scores.push(row.displayScore > 0 ? formatScore(row.displayScore) : 0); // Nilai Rapor
            } else {
                // For specific exam
                const score = row.scores ? (row.scores[selectedExamId] || 0) : 0;
                scores.push(score > 0 ? formatScore(score) : 0);
            }

            return [...basicInfo, ...scores].join(",");
        });

        // 3. Combine and Download
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `analisa_tahfidz_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (error) {
        return (
            <MainLayout>
                <Head title="Analisa Tahfidz" />
                <div className="p-6">
                    <Card><CardContent className="p-6 text-red-500 font-medium">{error}</CardContent></Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title="Analisa Tahfidz" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Analisa Tahfidz</h2>
                        <p className="text-muted-foreground">Monitor perkembangan hafalan, peringkat santri, dan evaluasi remedial.</p>
                    </div>

                    {/* FILTERS CONTAINER */}
                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background border rounded-lg shadow-sm">
                        {/* SEARCH */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama santri atau NIS..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* CLASS FILTER */}
                        <div className="w-full md:w-[200px]">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Semua Kelas" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {uniqueClasses.map(cls => (
                                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* STATUS FILTER */}
                        <div className="w-full md:w-[200px]">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status Ujian" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="done">Sudah Ujian</SelectItem>
                                    <SelectItem value="not_done">Belum Ujian</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* EXAM TYPE FILTER */}
                        <div className="w-full md:w-[200px]">
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Jenis Ujian" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Ujian (Nilai Rapor)</SelectItem>
                                    {gradeWeights.map(gw => (
                                        <SelectItem key={gw.id} value={String(gw.id)}>{gw.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* DOWNLOAD BUTTON */}
                        <div className="md:w-auto">
                            <Button onClick={handleDownload} variant="outline" className="w-full md:w-auto flex gap-2">
                                <Download className="w-4 h-4" />
                                Download Data
                            </Button>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="status" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-4">
                        <TabsTrigger value="status">Status Ujian</TabsTrigger>
                        <TabsTrigger value="top10">Top 10 Santri</TabsTrigger>
                        <TabsTrigger value="remedial">Di Bawah KKM</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: STATUS UJIAN */}
                    <TabsContent value="status">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Kelengkapan {selectedExamId !== 'all' ? `(${gradeWeights.find(g => String(g.id) === selectedExamId)?.name})` : 'Ujian'}</CardTitle>
                                <CardDescription>Daftar santri dan status keikutsertaan ujian Tahfidz.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Santri</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Penguji</TableHead>

                                                {/* CONDITIONAL COLUMNS */}
                                                {selectedExamId === 'all' ? (
                                                    gradeWeights.map(gw => (
                                                        <TableHead key={gw.id} className="text-center">{gw.name}</TableHead>
                                                    ))
                                                ) : (
                                                    // Show only selected column
                                                    <TableHead className="text-center">
                                                        {gradeWeights.find(g => String(g.id) === selectedExamId)?.name}
                                                    </TableHead>
                                                )}

                                                <TableHead className="text-right">
                                                    {selectedExamId === 'all' ? 'Nilai Rapor' : 'Nilai'}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {processedData.map((row) => (
                                                <TableRow key={row.student_id}>
                                                    <TableCell className="font-medium">
                                                        <div>{row.student_name}</div>
                                                        <div className="text-xs text-muted-foreground">{row.nis}</div>
                                                    </TableCell>
                                                    <TableCell>{row.class_name}</TableCell>
                                                    <TableCell className="text-xs">{row.tester_name}</TableCell>

                                                    {/* CONDITIONAL CELLS */}
                                                    {selectedExamId === 'all' ? (
                                                        gradeWeights.map(gw => (
                                                            <TableCell key={gw.id} className="text-center">
                                                                {row.scores && row.scores[gw.id] > 0 ? (
                                                                    <span className={`font-semibold ${row.scores[gw.id] < kkm ? 'text-red-600' : 'text-green-600'}`}>
                                                                        {formatScore(row.scores[gw.id])}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </TableCell>
                                                        ))
                                                    ) : (
                                                        <TableCell className="text-center">
                                                            {row.scores && row.scores[selectedExamId] > 0 ? (
                                                                <span className={`font-semibold ${row.scores[selectedExamId] < kkm ? 'text-red-600' : 'text-green-600'}`}>
                                                                    {formatScore(row.scores[selectedExamId])}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    )}

                                                    <TableCell className="text-right font-bold">
                                                        {row.displayScore > 0 ? formatScore(row.displayScore) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {processedData.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={10} className="h-24 text-center">
                                                        Data santri tidak ditemukan.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: TOP 10 SANTRI */}
                    <TabsContent value="top10">
                        <Card className="border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/20">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    <CardTitle>Top 10 Santri {selectedExamId !== 'all' ? `(${gradeWeights.find(g => String(g.id) === selectedExamId)?.name})` : 'Terbaik'}</CardTitle>
                                </div>
                                <CardDescription>Santri dengan nilai tertinggi.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topStudents.map((student, index) => (
                                        <div key={student.student_id} className="flex items-center justify-between p-4 bg-background border rounded-lg shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    flex items-center justify-center w-8 h-8 rounded-full font-bold
                                                    ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : ''}
                                                    ${index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-300' : ''}
                                                    ${index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-300' : ''}
                                                    ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                                                `}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{student.student_name}</div>
                                                    <div className="text-sm text-muted-foreground">{student.class_name} • {student.tester_name}</div>
                                                </div>
                                            </div>
                                            <div className="text-xl font-bold text-primary">
                                                {formatScore(student.displayScore)}
                                            </div>
                                        </div>
                                    ))}
                                    {topStudents.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">Belum ada data nilai yang masuk.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: REMEDIAL (BELOW KKM) */}
                    <TabsContent value="remedial">
                        <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    <CardTitle>Di Bawah KKM</CardTitle>
                                </div>
                                <CardDescription>Daftar santri yang nilainya &lt; KKM Target.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border bg-background">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Santri</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Target KKM</TableHead>
                                                <TableHead className="text-right">Nilai</TableHead>
                                                <TableHead className="text-right">Selisih</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {belowKkmStudents.map((row) => (
                                                <TableRow key={row.student_id}>
                                                    <TableCell className="font-medium">
                                                        <div>{row.student_name}</div>
                                                    </TableCell>
                                                    <TableCell>{row.class_name}</TableCell>
                                                    <TableCell><Badge variant="outline">{row.kkm}</Badge></TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">
                                                        {formatScore(row.displayScore)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-500 text-xs">
                                                        -{parseFloat((row.kkm - row.displayScore).toFixed(2))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {belowKkmStudents.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-green-600 font-medium">
                                                        Alhamdulillah, tidak ada santri di bawah KKM.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
