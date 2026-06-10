import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    Play, 
    Link as LinkIcon, 
    Shield, 
    Activity, 
    Clock, 
    Key, 
    Zap, 
    AlertCircle, 
    CheckCircle2,
    Copy,
    ChevronDown,
    Settings2,
    Code2
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

export default function Tester({ apiKeys, defaultInternalUrl }) {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [activeTab, setActiveTab] = useState('parameters');
    const [selectedKeyId, setSelectedKeyId] = useState('');
    
    // Quick Test Generator states
    const [testNis, setTestNis] = useState('25020497');
    const [testSemester, setTestSemester] = useState('Genap');
    const [testTahunAjaran, setTestTahunAjaran] = useState('2025/2026');

    const { data, setData, post, processing, errors } = useForm({
        api_key: '',
        endpoint: defaultInternalUrl,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        body: {},
    });

    const runTest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponse(null);

        try {
            const res = await axios.post(route('settings.api-keys.tester.run'), data);
            setResponse(res.data);
        } catch (err) {
            setResponse(err.response?.data || { 
                status: 500, 
                status_text: 'Error', 
                message: 'Gagal menghubungi server tester.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeySelect = (key) => {
        setData('api_key', key.key);
        setSelectedKeyId(key.id);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    };

    const getDisplayResponse = (res) => {
        if (!res) return null;
        if (typeof res.body !== 'undefined' && res.body !== null && res.body !== '') return res.body;
        if (typeof res.message !== 'undefined' && res.message !== null && res.message !== '') {
            return { message: res.message };
        }
        return res;
    };

    return (
        <MainLayout>
            <Head title="API Key Tester" />
            
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
                            <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
                            API Key Tester
                        </h2>
                        <p className="text-muted-foreground text-lg">Uji validitas dan respons endpoint API Anda secara real-time.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Panel: Configuration */}
                    <div className="lg:col-span-7 space-y-6 animate-in slide-in-from-left-4 duration-700">
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md dark:bg-gray-800/80 ring-1 ring-black/5">
                            <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-indigo-500" />
                                    <CardTitle className="text-lg">Konfigurasi Request</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* API Key Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Key className="h-4 w-4" /> API Key
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {apiKeys.map(key => (
                                            <button
                                                key={key.id}
                                                type="button"
                                                onClick={() => handleKeySelect(key)}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all border",
                                                    selectedKeyId === key.id 
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200" 
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600"
                                                )}
                                            >
                                                {key.name}
                                            </button>
                                        ))}
                                    </div>
                                    <Input 
                                        type="text" 
                                        value={data.api_key} 
                                        onChange={e => setData('api_key', e.target.value)}
                                        placeholder="Ketik manual atau pilih dari daftar di atas..."
                                        className="font-mono text-sm bg-gray-50 dark:bg-gray-900 border-gray-200"
                                    />
                                </div>

                                {/* Endpoint & Method */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">Method</label>
                                        <select 
                                            value={data.method}
                                            onChange={e => setData('method', e.target.value)}
                                            className="w-full rounded-md border-gray-200 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        >
                                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-9">
                                        <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">Target Endpoint</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={data.endpoint}
                                                onChange={e => setData('endpoint', e.target.value)}
                                                className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 focus:ring-indigo-500"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Parameter Builder */}
                                <div className="space-y-3 pt-4 border-t border-dashed">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                                        <Zap className="h-4 w-4" /> Quick Test Generator
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">NIS Santri</label>
                                            <Input 
                                                value={testNis}
                                                onChange={e => setTestNis(e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-900"
                                                placeholder="Contoh: 25020497"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Semester</label>
                                            <select 
                                                value={testSemester}
                                                onChange={e => setTestSemester(e.target.value)}
                                                className="w-full h-8 px-2 text-sm rounded-md border-gray-200 bg-white dark:bg-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="Ganjil">Ganjil</option>
                                                <option value="Genap">Genap</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Tahun Ajaran</label>
                                            <Input 
                                                value={testTahunAjaran}
                                                onChange={e => setTestTahunAjaran(e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-gray-900"
                                                placeholder="2025/2026"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', defaultInternalUrl)}
                                            className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            Internal Ping
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', `${window.location.origin}/api/v1/student/${testNis}/info`)}
                                            className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Info Santri
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', `${window.location.origin}/api/v1/student/${testNis}/${testSemester.toLowerCase()}/grades?tahunAjaran=${testTahunAjaran}`)}
                                            className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Nilai Akademik
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', `${window.location.origin}/api/v1/student/${testNis}/${testSemester.toLowerCase()}/character?tahunAjaran=${testTahunAjaran}`)}
                                            className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Nilai Akhlak
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', `${window.location.origin}/api/v1/student/${testNis}/${testSemester.toLowerCase()}/character/monthly?tahunAjaran=${testTahunAjaran}`)}
                                            className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Akhlak Bulanan
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('endpoint', `${window.location.origin}/api/v1/student/${testNis}/${testSemester.toLowerCase()}/tahfidz?tahunAjaran=${testTahunAjaran}`)}
                                            className="text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Nilai Hafalan
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs for advanced config */}
                                <div className="pt-4 border-t border-dashed">
                                    <div className="flex gap-4 border-b">
                                        {['parameters', 'headers', 'body'].map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveTab(tab)}
                                                className={cn(
                                                    "pb-2 text-sm font-medium transition-colors border-b-2",
                                                    activeTab === tab 
                                                        ? "border-indigo-600 text-indigo-600" 
                                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                                )}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="py-4">
                                        {activeTab === 'headers' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-gray-400">Current Headers (JSON)</label>
                                                <textarea 
                                                    className="w-full font-mono text-xs p-3 bg-gray-900 text-green-400 rounded-md h-24 border-none"
                                                    value={JSON.stringify(data.headers, null, 2)}
                                                    onChange={e => {
                                                        try { setData('headers', JSON.parse(e.target.value)); } catch(err) {}
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {activeTab === 'body' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-gray-400">Request Body (JSON)</label>
                                                <textarea
                                                    className="w-full font-mono text-xs p-3 bg-gray-900 text-green-400 rounded-md h-32 border-none"
                                                    value={JSON.stringify(data.body, null, 2)}
                                                    onChange={e => {
                                                        try { setData('body', JSON.parse(e.target.value)); } catch(err) {}
                                                    }}
                                                    placeholder='{"contents":[{"parts":[{"text":"Hello"}]}]}'
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setData('body', { contents: [{ parts: [{ text: 'Tes koneksi, balas singkat: OK' }] }] })}
                                                    className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                                >
                                                    Isi Contoh Body Gemini
                                                </button>
                                            </div>
                                        )}
                                        {activeTab === 'parameters' && (
                                            <div className="flex flex-col items-center justify-center h-24 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 text-gray-400 italic text-sm">
                                                <AlertCircle className="h-5 w-5 mb-2" />
                                                Gunakan Query Strings langsung pada URL endpoint.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button 
                                    className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                                    onClick={runTest}
                                    disabled={loading || !data.api_key || !data.endpoint}
                                >
                                    {loading ? (
                                        <Activity className="h-6 w-6 animate-spin mr-2" />
                                    ) : (
                                        <Play className="h-6 w-6 mr-2 fill-white" />
                                    )}
                                    Jalankan Test
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="lg:col-span-5 animate-in slide-in-from-right-4 duration-700 delay-100">
                        <Card className="border-none shadow-2xl bg-indigo-950 text-white min-h-[500px] flex flex-col overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="bg-indigo-900/50 border-b border-indigo-800 flex flex-row justify-between items-center py-4">
                                <div className="flex items-center gap-2">
                                    <Code2 className="h-5 w-5 text-indigo-400" />
                                    <CardTitle className="text-md">Response Result</CardTitle>
                                </div>
                                {response && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => copyToClipboard(response)}
                                            className="p-1.5 hover:bg-indigo-800 rounded text-indigo-300 transition-colors"
                                            title="Copy Full JSON"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col">
                                {!response && !loading && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-indigo-300/60">
                                        <Zap className="h-16 w-16 mb-4 opacity-10 animate-pulse" />
                                        <p className="text-sm font-medium">Klik "Jalankan Test" untuk melihat respons API.</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                                        <div className="relative">
                                            <div className="h-20 w-20 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
                                            <Activity className="absolute inset-0 m-auto h-8 w-8 text-indigo-400 animate-pulse" />
                                        </div>
                                        <p className="mt-4 text-indigo-300 font-medium tracking-widest text-xs uppercase animate-pulse">Requesting Data...</p>
                                    </div>
                                )}

                                {response && (
                                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                                        {/* Status Header */}
                                        <div className={cn(
                                            "px-6 py-4 flex items-center justify-between border-b border-white/5",
                                            response.status >= 200 && response.status < 300 ? "bg-green-500/10" : "bg-red-500/10"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-3 w-3 rounded-full animate-pulse",
                                                    response.status >= 200 && response.status < 300 ? "bg-green-500" : "bg-red-500"
                                                )} />
                                                <span className="text-2xl font-black">{response.status}</span>
                                                <span className="text-sm font-bold opacity-70 uppercase tracking-wider">{response.status_text || 'UNKNOWN'}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] opacity-40 uppercase font-black tracking-tighter">Time</div>
                                                <div className="text-xs font-mono text-indigo-300">{response.duration || 'N/A'}</div>
                                            </div>
                                        </div>

                                        {/* JSON Body / Message */}
                                        <div className="flex-1 overflow-auto p-4 bg-[#0d0e1b]">
                                            <pre className="text-[13px] font-mono leading-relaxed text-indigo-100 custom-scrollbar">
                                                <code>
                                                    {JSON.stringify(getDisplayResponse(response), null, 2)}
                                                </code>
                                            </pre>
                                        </div>

                                        {/* Info Footer */}
                                        <div className="p-4 bg-indigo-900/30 border-t border-white/5 flex items-center gap-4">
                                            {response.status >= 200 && response.status < 300 ? (
                                                <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    API Key Valid & Endpoint Aktif
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                                                    <AlertCircle className="h-4 w-4" />
                                                    Autentikasi Gagal atau Endpoint Bermasalah
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Documentation Tip */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 dark:bg-amber-900/20 dark:border-amber-900/30 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Tips:</span> Pastikan API Key yang Anda buat memiliki status <strong>Aktif</strong> agar dapat digunakan. Jika mencoba endpoint internal SIKAP, header <code>X-Api-Key</code> akan ditambahkan secara otomatis oleh sistem tester ini.
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </MainLayout>
    );
}
