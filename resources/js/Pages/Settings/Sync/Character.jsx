import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react'; // Import Link if needed
import { Button } from "@/Components/ui/button";
import { Upload, Database, AlertCircle, Check } from 'lucide-react';
import axios from 'axios';

export default function Character() {
    const { data, setData, post, processing, errors } = useForm({
        file: null,
        file_path: '',
    });

    const [analysis, setAnalysis] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const handleUpload = (e) => {
        e.preventDefault();

        const formData = new FormData();
        // Priority: If path is set, use it and IGNORE the file object to avoid 413
        if (data.file_path) {
            formData.append('file_path', data.file_path);
        } else if (data.file) {
            formData.append('file', data.file);
        }

        // Custom axios post since we want to handle JSON response for analysis first
        axios.post(route('settings.sync.akhlak.upload'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(response => {
                setAnalysis(response.data);
                setMessage(response.data.message);
            })
            .catch(error => {
                console.error(error);
                alert('Upload failed: ' + (error.response?.data?.message || error.message));
            });
    };

    const handleSync = () => {
        if (!confirm('Are you sure you want to sync this data?')) return;

        router.post(route('settings.sync.akhlak.sync'), {}, {
            onSuccess: () => alert('Sync started/completed!')
        });
    };

    return (
        <MainLayout>
            <Head title="Sinkronisasi Nilai Akhlak Lama" />

            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sinkronisasi Nilai Akhlak (Legacy)</h2>
                    <p className="text-muted-foreground">Import data nilai akhlak dari database lama (format SQL Dump).</p>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="space-y-4 border-b pb-4">
                            <label className="block text-sm font-medium">Opsi 1: Upload SQL File (Maksimal 2MB)</label>
                            <input type="file" onChange={handleFileChange} accept=".sql,.txt" className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-violet-50 file:text-violet-700
                                hover:file:bg-violet-100
                              "/>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Opsi 2: Path File Lokal (Untuk File Besar)</label>
                            <p className="text-xs text-muted-foreground">Jika upload gagal (Error 413), simpan file di folder proyek (misal: <code>C:/xampp/htdocs/SIKAP/sim_utf8.sql</code>) dan masukkan path lengkapnya di sini.</p>
                            <input
                                type="text"
                                value={data.file_path}
                                onChange={e => setData('file_path', e.target.value)}
                                placeholder="C:\xampp\htdocs\SIKAP\sim_utf8.sql"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <Button type="submit" disabled={!data.file && !data.file_path}>
                            <Upload className="mr-2 h-4 w-4" />
                            Analisis File
                        </Button>
                    </form>

                    {analysis && (
                        <div className="mt-6 space-y-4 border-t pt-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <Check className="h-5 w-5" />
                                <span className="font-bold">{analysis.message}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-muted-foreground">Tabel Terdeteksi</span>
                                    <span className="font-mono font-bold text-lg">{analysis.table_name}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-muted-foreground">Total Baris</span>
                                    <span className="font-mono font-bold text-lg">{analysis.total_rows}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-sm">Contoh Data (Baris Pertama)</h3>
                                <div className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                                    <pre className="text-xs font-mono">
                                        {JSON.stringify(analysis.sample_row, null, 2)}
                                    </pre>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    **Silakan berikan informasi urutan kolom berdasarkan contoh di atas kepada developer untuk pemetaan yang tepat.**
                                </p>
                            </div>

                            <div className="space-y-2 mt-4">
                                <h3 className="font-bold text-sm text-red-500">DEBUG: File Content Snippet</h3>
                                <div className="bg-gray-100 p-2 rounded text-xs break-all h-40 overflow-y-auto font-mono">
                                    {analysis.file_snippet || 'No snippet available'}
                                </div>
                            </div>

                            {/* Sync Button hidden for now until logic implemented or confirmed */}
                            {/* 
                            <Button onClick={handleSync} variant="default" className="w-full">
                                <Database className="mr-2 h-4 w-4" />
                                Jalankan Sinkronisasi
                            </Button>
                            */}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
