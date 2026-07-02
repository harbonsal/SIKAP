import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, TrendingUp, Calendar, Target, Award, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TahfidzTabs from '@/Components/TahfidzTabs';

export default function TrendDetail({ student, className, trendData, stats }) {
    
    // Formatting tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border rounded-md shadow-md p-3">
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-indigo-600">
                        Penambahan: <span className="font-bold">{payload[0].value} Halaman</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <MainLayout>
            <Head title={`Tren Hafalan - ${student.user?.name}`} />

            <div className="space-y-6">
                <TahfidzTabs activeRoute="analysis" />
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Link href={route('tahfidz.analysis.index')} className="hover:text-indigo-600 hover:underline flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Analisa
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{student.user?.name}</h2>
                        <p className="text-muted-foreground">NIS: {student.user?.nomor_induk || '-'} • Kelas: {className}</p>
                    </div>
                    <div className="flex gap-2">
                        <a 
                            href={route('tahfidz.report.print', student.id)}
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 h-9 px-4 py-2 gap-2 shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Cetak Rapor
                        </a>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Hafalan</p>
                                    <h3 className="text-2xl font-bold text-indigo-900">{stats.total_pages} <span className="text-base font-normal text-indigo-700">Halaman</span></h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Rata-rata Kecepatan</p>
                                    <h3 className="text-2xl font-bold text-emerald-900">{stats.avg_speed} <span className="text-base font-normal text-emerald-700">Hal / Bulan</span></h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-700 rounded-full">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Sisa Target (30 Juz)</p>
                                    <h3 className="text-2xl font-bold text-orange-900">{stats.remaining_pages} <span className="text-base font-normal text-orange-700">Halaman</span></h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar className="w-16 h-16 text-blue-500" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Prediksi Khatam</p>
                                {stats.predicted_months ? (
                                    <>
                                        <h3 className="text-2xl font-bold text-blue-900">{stats.predicted_date}</h3>
                                        <p className="text-sm text-blue-700 font-medium">({stats.predicted_months} bulan lagi)</p>
                                    </>
                                ) : (
                                    <h3 className="text-xl font-bold text-muted-foreground">Belum ada data</h3>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CHART */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Grafik Penambahan Hafalan (6 Bulan Terakhir)</CardTitle>
                        <CardDescription>Visualisasi jumlah halaman baru yang dihafal setiap bulannya.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full mt-4">
                            {trendData && trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6b7280', fontSize: 13 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6b7280', fontSize: 13 }} 
                                            dx={-10}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="pages" 
                                            stroke="#4f46e5" 
                                            strokeWidth={3}
                                            dot={{ r: 6, fill: "#ffffff", stroke: "#4f46e5", strokeWidth: 2 }}
                                            activeDot={{ r: 8, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Belum ada data progres hafalan yang bisa divisualisasikan.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* INSIGHT BOX */}
                {stats.predicted_months && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" /> Insight Sistem
                        </h4>
                        <p className="text-indigo-800 leading-relaxed">
                            Berdasarkan data 6 bulan terakhir, <strong>{student.user?.name}</strong> mampu menghafal rata-rata <strong>{stats.avg_speed} halaman per bulan</strong>. 
                            Jika kecepatan ini dipertahankan secara konsisten, santri diproyeksikan akan menyelesaikan hafalan 30 Juz (khatam) pada <strong>{stats.predicted_date}</strong>.
                            Untuk mempercepat waktu khatam, dorong santri untuk meningkatkan rutinitas murojaah dan menambah minimal 1-2 halaman ekstra setiap bulannya.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
