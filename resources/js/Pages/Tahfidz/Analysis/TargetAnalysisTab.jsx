import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Loader2, AlertTriangle, Filter } from 'lucide-react';
import axios from 'axios';

export default function TargetAnalysisTab({ musyrifId }) {
    const [period, setPeriod] = useState('weekly');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    
    // Mistake Tab state
    const [mistakesLoading, setMistakesLoading] = useState(false);
    const [mistakesData, setMistakesData] = useState([]);
    const [selectedJuz, setSelectedJuz] = useState('all');
    const [selectedSession, setSelectedSession] = useState('all');

    useEffect(() => {
        fetchData();
        fetchMistakes();
    }, [period, musyrifId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('tahfidz.analysis.targets.api'), {
                params: { period, musyrif_id: musyrifId }
            });
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch target data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMistakes = async () => {
        setMistakesLoading(true);
        try {
            const response = await axios.get(route('tahfidz.analysis.mistakes.api'), {
                params: { period, musyrif_id: musyrifId }
            });
            setMistakesData(response.data);
        } catch (error) {
            console.error("Failed to fetch mistakes data", error);
        } finally {
            setMistakesLoading(false);
        }
    };

    const filteredMistakes = mistakesData.filter(m => {
        if (selectedJuz !== 'all' && m.juz.toString() !== selectedJuz) return false;
        if (selectedSession !== 'all' && m.session_type !== selectedSession) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Analisa Setoran & Target</h3>
                    <p className="text-sm text-gray-500">Evaluasi pemenuhan target hafalan (Sabaq, Sabqi, Manzil) & Kesalahan Bacaan</p>
                </div>
                <div className="w-48">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Pekan Ini</SelectItem>
                            <SelectItem value="monthly">Bulan Ini</SelectItem>
                            <SelectItem value="mid_semester">Mid Semester</SelectItem>
                            <SelectItem value="semester">Semester Ini</SelectItem>
                            <SelectItem value="yearly">Tahun Ajaran</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Kepatuhan Setoran</CardTitle>
                    <CardDescription>
                        Daftar santri beserta capaian halamannya dibandingkan dengan target.
                        <br/>(Target disesuaikan dengan jumlah hari aktif KBM)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Nama Santri</TableHead>
                                        <TableHead>Kelas</TableHead>
                                        <TableHead className="text-center">Sabaq<br/><span className="text-xs font-normal text-gray-500">(Target vs Capaian)</span></TableHead>
                                        <TableHead className="text-center">Sabqi<br/><span className="text-xs font-normal text-gray-500">(Target vs Capaian)</span></TableHead>
                                        <TableHead className="text-center">Manzil<br/><span className="text-xs font-normal text-gray-500">(Target vs Capaian)</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map(row => (
                                        <TableRow key={row.student_id}>
                                            <TableCell className="font-medium">{row.name}</TableCell>
                                            <TableCell>{row.class}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={row.sabaq.is_met ? "success" : "destructive"}>
                                                    {row.sabaq.achieved} / {row.sabaq.target} Hal
                                                </Badge>
                                                {!row.sabaq.is_met && <div className="text-xs text-red-500 mt-1">Kurang {row.sabaq.deficit} Hal</div>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={row.sabqi.is_met ? "success" : "destructive"}>
                                                    {row.sabqi.achieved} / {row.sabqi.target} Hal
                                                </Badge>
                                                {!row.sabqi.is_met && <div className="text-xs text-red-500 mt-1">Kurang {row.sabqi.deficit} Hal</div>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={row.manzil.is_met ? "success" : "destructive"}>
                                                    {row.manzil.achieved} / {row.manzil.target} Hal
                                                </Badge>
                                                {!row.manzil.is_met && <div className="text-xs text-red-500 mt-1">Kurang {row.manzil.deficit} Hal</div>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-gray-500">Tidak ada data setoran ditemukan.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Analisa Kesalahan Bacaan</CardTitle>
                    <CardDescription>
                        Rincian kesalahan makhroj, tajwid, atau kelancaran yang dicatat oleh Musyrif.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="w-32">
                            <Select value={selectedJuz} onValueChange={setSelectedJuz}>
                                <SelectTrigger><SelectValue placeholder="Juz" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Juz</SelectItem>
                                    {Array.from({length: 30}, (_, i) => i + 1).map(j => (
                                        <SelectItem key={j} value={j.toString()}>Juz {j}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-40">
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger><SelectValue placeholder="Sesi" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Sesi</SelectItem>
                                    <SelectItem value="sabaq">Sabaq</SelectItem>
                                    <SelectItem value="sabqi">Sabqi</SelectItem>
                                    <SelectItem value="manzil">Manzil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {mistakesLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Nama Santri</TableHead>
                                        <TableHead>Juz & Hal</TableHead>
                                        <TableHead>Surat/Ayat</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Jenis Kesalahan</TableHead>
                                        <TableHead>Waktu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMistakes.map((mistake) => (
                                        <TableRow key={mistake.id}>
                                            <TableCell className="font-medium">{mistake.student_name}</TableCell>
                                            <TableCell>Juz {mistake.juz} Hal {mistake.page_number}</TableCell>
                                            <TableCell>{mistake.verse_key}</TableCell>
                                            <TableCell className="capitalize">{mistake.session_type}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                                                    {mistake.mistake_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">{mistake.time}</TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredMistakes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-6 text-gray-500">Tidak ada data kesalahan ditemukan dengan filter ini.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
