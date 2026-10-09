import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, ArrowLeft, History, CheckCircle, AlertTriangle } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function IndividualLog({ student, logs }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: student.id,
        date: new Date().toISOString().split('T')[0],
        academic_problem: '',
        academic_solution: '',
        academic_trend: 'Netral',
        academic_action: 'Pantau',
        ibadah_problem: '',
        ibadah_solution: '',
        personal_problem: '',
        personal_solution: '',
        social_problem: '',
        social_solution: '',
        comfort_problem: '',
        comfort_solution: '',
        family_problem: '',
        family_solution: '',
        health_problem: '',
        health_solution: '',
        akhlak_trend: 'Netral',
        akhlak_action: 'Pantau',
        public_notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('musyrif-tarbiyah.individual.store'), {
            onSuccess: () => reset('academic_problem', 'academic_solution', 'ibadah_problem', 'ibadah_solution', 'personal_problem', 'personal_solution', 'social_problem', 'social_solution', 'comfort_problem', 'comfort_solution', 'family_problem', 'family_solution', 'health_problem', 'health_solution', 'public_notes'),
        });
    };

    return (
        <MainLayout>
            <Head title={`Jurnal Individu - ${student.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('musyrif-tarbiyah.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white shadow-sm hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Form Pendampingan Individu</h1>
                        <p className="text-sm text-gray-500">
                            Anak Asuh: <span className="font-semibold">{student.name}</span> ({student.user.nomor_induk})
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                    {/* Form */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <form onSubmit={submit} className="divide-y divide-gray-100">
                            
                            {/* General */}
                            <div className="p-6 bg-gray-50/50">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="date" value="Tanggal Pendampingan" />
                                        <input
                                            type="date"
                                            id="date"
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.date} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Academic */}
                            <div className="p-6">
                                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">1</span>
                                    Catatan Akademik
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <InputLabel value="Permasalahan Akademik" />
                                        <textarea
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                            rows={3}
                                            value={data.academic_problem}
                                            onChange={(e) => setData('academic_problem', e.target.value)}
                                            placeholder="Tuliskan jika ada kendala belajar..."
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Kesepakatan Solusi" />
                                        <textarea
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                            rows={3}
                                            value={data.academic_solution}
                                            onChange={(e) => setData('academic_solution', e.target.value)}
                                            placeholder="Tuliskan solusi dari musyrif/santri..."
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Trend Akademik" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                            value={data.academic_trend}
                                            onChange={(e) => setData('academic_trend', e.target.value)}
                                        >
                                            <option value="Positif">Meningkat (Positif)</option>
                                            <option value="Netral">Tetap (Netral)</option>
                                            <option value="Negatif">Menurun (Negatif)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel value="Tindak Lanjut" />
                                        <select
                                            className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                            value={data.academic_action}
                                            onChange={(e) => setData('academic_action', e.target.value)}
                                        >
                                            <option value="Selesai">Selesai</option>
                                            <option value="Pantau">Terus Dipantau</option>
                                            <option value="Eskalasi">Eskalasi (Butuh Penanganan Lanjut)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Akhlak & Karakter */}
                            <div className="p-6">
                                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">2</span>
                                    Catatan Akhlak & Karakter
                                </h3>
                                
                                <div className="space-y-6">
                                    {/* Ibadah */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Ibadah (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.ibadah_problem} onChange={(e) => setData('ibadah_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Ibadah (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.ibadah_solution} onChange={(e) => setData('ibadah_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Personal */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Kemandirian & Kebersihan (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.personal_problem} onChange={(e) => setData('personal_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Kemandirian & Kebersihan (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.personal_solution} onChange={(e) => setData('personal_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Social */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Interaksi Sosial (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.social_problem} onChange={(e) => setData('social_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Interaksi Sosial (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.social_solution} onChange={(e) => setData('social_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Comfort */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Kenyamanan & Keamanan (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.comfort_problem} onChange={(e) => setData('comfort_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Kenyamanan & Keamanan (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.comfort_solution} onChange={(e) => setData('comfort_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Family */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Keluarga/Lainnya (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.family_problem} onChange={(e) => setData('family_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Keluarga/Lainnya (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.family_solution} onChange={(e) => setData('family_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Health */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Kesehatan Jasmani (Kendala)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.health_problem} onChange={(e) => setData('health_problem', e.target.value)} />
                                        </div>
                                        <div>
                                            <InputLabel value="Kesehatan Jasmani (Solusi)" />
                                            <textarea className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" rows={2} value={data.health_solution} onChange={(e) => setData('health_solution', e.target.value)} />
                                        </div>
                                    </div>
                                    
                                    <hr />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel value="Trend Akhlak Secara Umum" />
                                            <select
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                                value={data.akhlak_trend}
                                                onChange={(e) => setData('akhlak_trend', e.target.value)}
                                            >
                                                <option value="Positif">Meningkat (Positif)</option>
                                                <option value="Netral">Tetap (Netral)</option>
                                                <option value="Negatif">Menurun (Negatif)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel value="Tindak Lanjut Akhlak" />
                                            <select
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm text-sm"
                                                value={data.akhlak_action}
                                                onChange={(e) => setData('akhlak_action', e.target.value)}
                                            >
                                                <option value="Selesai">Selesai</option>
                                                <option value="Pantau">Terus Dipantau</option>
                                                <option value="Eskalasi">Eskalasi (Butuh Penanganan Lanjut)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Public */}
                            <div className="p-6 bg-yellow-50/50">
                                <h3 className="font-semibold text-lg text-yellow-800 mb-4 flex items-center">
                                    <span className="bg-yellow-200 text-yellow-800 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">3</span>
                                    Catatan Publik (Dapat Dilihat Wali)
                                </h3>
                                <div>
                                    <InputLabel value="Pesan untuk Wali Santri" />
                                    <textarea
                                        className="mt-1 block w-full border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-md shadow-sm text-sm bg-white"
                                        rows={4}
                                        value={data.public_notes}
                                        onChange={(e) => setData('public_notes', e.target.value)}
                                        placeholder="Tuliskan laporan positif atau hal yang perlu diketahui wali santri di aplikasi..."
                                    />
                                    <p className="text-xs text-yellow-700 mt-1">Hanya bagian ini yang akan ditampilkan di aplikasi Wali Santri. Sisanya adalah rahasia Musyrif.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Jurnal Individu
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar / History */}
                    <div className="space-y-4">
                        <div className="rounded-xl border bg-white shadow-sm">
                            <div className="p-4 border-b flex items-center gap-2 font-semibold">
                                <History className="h-4 w-4 text-gray-500" /> Riwayat Pendampingan
                            </div>
                            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <div key={log.id} className="border rounded-lg p-3 text-sm relative">
                                            <div className="font-semibold text-blue-600 mb-1">{log.date}</div>
                                            <div className="space-y-1 mb-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Akademik:</span>
                                                    <span className={`font-medium ${log.academic_trend === 'Positif' ? 'text-green-600' : log.academic_trend === 'Negatif' ? 'text-red-600' : 'text-gray-600'}`}>{log.academic_trend}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Akhlak:</span>
                                                    <span className={`font-medium ${log.akhlak_trend === 'Positif' ? 'text-green-600' : log.akhlak_trend === 'Negatif' ? 'text-red-600' : 'text-gray-600'}`}>{log.akhlak_trend}</span>
                                                </div>
                                            </div>
                                            {(log.academic_action === 'Eskalasi' || log.akhlak_action === 'Eskalasi') && (
                                                <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md mb-2 flex items-center">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Membutuhkan Eskalasi
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                        Belum ada riwayat pendampingan untuk santri ini.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
