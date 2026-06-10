import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Save, Plus, Trash } from 'lucide-react';
import Swal from 'sweetalert2';

export default function IjazahIndex({ settings, candidates, systemMapels = [], employees = [], ...props }) {
    if (candidates) settings.candidates = candidates;

    const parseSubjects = (json) => {
        try {
            return json ? JSON.parse(json) : [];
        } catch (e) {
            return [];
        }
    };

    const { data, setData, post, processing } = useForm({
        ijazah_school_name_ar: settings.ijazah_school_name_ar || 'معهد اللؤلؤ والمرجان',
        ijazah_mudir_name: settings.ijazah_mudir_name || '',
        ijazah_mudir_niy: settings.ijazah_mudir_niy || '',
        ijazah_body_top: settings.ijazah_body_top || 'قد أتم دراسة المرحلة الثانوية في معهد اللؤلؤ والمرجان بماجيلانج - جاوى الوسطى - إندونيسيا',
        ijazah_body_bottom: settings.ijazah_body_bottom || 'والمعهد إذ يمنح هذه الشهادة يوصيه بتقوى الله تعالى ونفع الناس بالهدى والصلاح وسلوك سبيل العلماء العاملين.',
        ijazah_city_date: settings.ijazah_city_date || 'Magelang, ...',
        ijazah_subjects: parseSubjects(settings.ijazah_subjects),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.education.ijazah.update'), {
            onSuccess: () => Swal.fire('Berhasil', 'Pengaturan disimpan.', 'success'),
            onError: () => Swal.fire('Error', 'Gagal menyimpan.', 'error'),
        });
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Ijazah" />
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Pengaturan Ijazah</h2>
                </div>

                <Card>
                    <CardHeader><CardTitle>Konten Ijazah (Bahasa Arab)</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nama Sekolah (Arab)</Label>
                                <Input dir="rtl" value={data.ijazah_school_name_ar} onChange={e => setData('ijazah_school_name_ar', e.target.value)} />
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-md border">
                                <Label>Data Penandatangan (Mudir)</Label>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Pilih dari Data Pegawai (Otomatis Isi)</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={(employees || []).find(e => e.nomor_induk === data.ijazah_mudir_niy)?.id || ''}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                if (selectedId) {
                                                    const emp = (employees || []).find(x => x.id == selectedId);
                                                    if (emp) {
                                                        setData(prev => ({
                                                            ...prev,
                                                            ijazah_mudir_name: emp.nama_arab || emp.name,
                                                            ijazah_mudir_niy: emp.nomor_induk
                                                        }));
                                                    }
                                                } else {
                                                    setData(prev => ({
                                                        ...prev,
                                                        ijazah_mudir_name: '',
                                                        ijazah_mudir_niy: ''
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">-- Manual / Kosong --</option>
                                            {(employees || []).map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.nomor_induk})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {(data.ijazah_mudir_name || data.ijazah_mudir_niy) && (
                                        <div className="text-sm grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <span className="font-semibold block text-xs text-muted-foreground">Nama di Ijazah (Arab):</span>
                                                <div className="font-arabic text-lg">{data.ijazah_mudir_name || '-'}</div>
                                            </div>
                                            <div>
                                                <span className="font-semibold block text-xs text-muted-foreground">NIY (Untuk File Tanda Tangan):</span>
                                                <div>{data.ijazah_mudir_niy || '-'}</div>
                                                <div className="text-[10px] text-muted-foreground italic">File: public/images/signature/{data.ijazah_mudir_niy}.jpg</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teks Body (Atas - Setelah Data Santri)</Label>
                                    <Textarea dir="rtl" className="min-h-[100px]" value={data.ijazah_body_top} onChange={e => setData('ijazah_body_top', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Contoh: "Telah menyelesaikan studi..."</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Teks Body (Bawah - Doa/Wasiat)</Label>
                                    <Textarea dir="rtl" className="min-h-[100px]" value={data.ijazah_body_bottom} onChange={e => setData('ijazah_body_bottom', e.target.value)} />
                                    <p className="text-xs text-muted-foreground">Contoh: "Maka dengan ini..."</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tempat & Tanggal (Default)</Label>
                                <Input value={data.ijazah_city_date} onChange={e => setData('ijazah_city_date', e.target.value)} placeholder="Contoh: Magelang, 20 Ramadhan 1446 H" />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" /> Simpan Pengaturan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Mata Pelajaran (Ijazah)</CardTitle>
                            <Button type="button" size="sm" onClick={() => {
                                const newSubjects = [...(data.ijazah_subjects || [])];
                                newSubjects.push({ name: '', name_ar: '', min_score: 70, max_score: 100, mapel_id: '' });
                                setData('ijazah_subjects', newSubjects);
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Tambah Mapel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border p-0 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="p-3 font-medium w-12 text-center">No</th>
                                        <th className="p-3 font-medium">Nama Mapel (Indo)</th>
                                        <th className="p-3 font-medium">Sumber Mapel (Sistem)</th>
                                        <th className="p-3 font-medium text-right">Nama Mapel (Arab)</th>
                                        <th className="p-3 font-medium text-center w-16">Min</th>
                                        <th className="p-3 font-medium text-center w-16">Max</th>
                                        <th className="p-3 font-medium w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y relative">
                                    {data.ijazah_subjects && data.ijazah_subjects.length > 0 ? (
                                        data.ijazah_subjects.map((subject, index) => (
                                            <tr key={index} className="hover:bg-muted/30">
                                                <td className="p-3 text-center">{index + 1}</td>
                                                <td className="p-3">
                                                    <Input
                                                        value={subject.name}
                                                        onChange={(e) => {
                                                            const newSubjects = [...data.ijazah_subjects];
                                                            newSubjects[index].name = e.target.value;
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                        placeholder="Nama di Ijazah"
                                                        className="h-9"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={subject.mapel_id || ''}
                                                        onChange={(e) => {
                                                            const newSubjects = [...data.ijazah_subjects];
                                                            newSubjects[index].mapel_id = e.target.value;
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                    >
                                                        <option value="">-- Manual / Tidak Terhubung --</option>
                                                        {systemMapels.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        value={subject.name_ar}
                                                        onChange={(e) => {
                                                            const newSubjects = [...data.ijazah_subjects];
                                                            newSubjects[index].name_ar = e.target.value;
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                        placeholder="Arab"
                                                        dir="rtl"
                                                        className="h-9 font-arabic"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        value={subject.min_score}
                                                        onChange={(e) => {
                                                            const newSubjects = [...data.ijazah_subjects];
                                                            newSubjects[index].min_score = e.target.value;
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                        className="text-center h-9 px-1"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        value={subject.max_score}
                                                        onChange={(e) => {
                                                            const newSubjects = [...data.ijazah_subjects];
                                                            newSubjects[index].max_score = e.target.value;
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                        className="text-center h-9 px-1"
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            const newSubjects = data.ijazah_subjects.filter((_, i) => i !== index);
                                                            setData('ijazah_subjects', newSubjects);
                                                        }}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                Belum ada mapel ijazah diatur. Klik "Tambah Mapel".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSubmit} disabled={processing} className="gap-2">
                                <Save className="h-4 w-4" /> Simpan Pengaturan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
