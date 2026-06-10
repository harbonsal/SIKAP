import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react'; // Correct import for Head
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { CheckCircle2, AlertCircle, Upload, FileUp, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function GradeSync() {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { post } = useForm(); // For inertia post if needed, but we use axios for upload to stay on page

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setAnalysis(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('settings.sync.grades.upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setAnalysis(response.data.analysis);
        } catch (error) {
            console.error(error);
            alert('Gagal mengupload file: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSync = () => {
        if (!analysis) return;

        if (!confirm('Apakah Anda yakin ingin menyinkronkan data ini? Proses ini mungkin memakan waktu.')) return;

        setProcessing(true);
        post(route('settings.sync.grades.sync'), {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <MainLayout>
            <Head title="Sinkronisasi Nilai Lama" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sinkronisasi Nilai Lama</h2>
                    <p className="text-muted-foreground">
                        Import data nilai dari backup database lama (SQL).
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload File SQL</CardTitle>
                        <CardDescription>
                            Pilih file `sim_full_backup_final.sql` untuk dianalisis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="sql-file">File SQL</Label>
                            <Input id="sql-file" type="file" accept=".sql" onChange={handleFileChange} />
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleUpload} disabled={!file || loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Analisis File
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {analysis && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle>Hasil Analisis</CardTitle>
                            <CardDescription>
                                Ringkasan data yang ditemukan dalam file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Baris Nilai</CardTitle>
                                        <FileUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analysis.total_rows}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Siswa Ditemukan (Sample)</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analysis.students_found}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Dari sample data yang diperiksa.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Mapel Ditemukan</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analysis.subjects_found}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Kode Mapel yang cocok dengan database sekarang.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Perhatian</AlertTitle>
                                <AlertDescription>
                                    Pastikan data Siswa (NIS) dan Mapel (Kode) sudah sinkron sebelum melanjutkan.
                                    Data nilai yang tidak memiliki pasangan siswa/mapel akan dilewati.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <h3 className="mb-2 font-semibold">Preview Data (5 Baris Pertama)</h3>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tahun</TableHead>
                                                <TableHead>Sem</TableHead>
                                                <TableHead>Mapel</TableHead>
                                                <TableHead>NIS</TableHead>
                                                <TableHead>UH1</TableHead>
                                                <TableHead>UTS</TableHead>
                                                <TableHead>UAS</TableHead>
                                                <TableHead>Rapor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysis.sample.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.kode_tp}</TableCell>
                                                    <TableCell>{row.kode_sem}</TableCell>
                                                    <TableCell>{row.kode_mapel}</TableCell>
                                                    <TableCell>{row.kode_siswa}</TableCell>
                                                    <TableCell>{row.uh1}</TableCell>
                                                    <TableCell>{row.uts}</TableCell>
                                                    <TableCell>{row.uas}</TableCell>
                                                    <TableCell>{row.rapor1}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSync} disabled={processing} size="lg">
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Mulai Sinkronisasi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
