import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { AlertCircle, Save } from 'lucide-react';

export default function Create({ auth, silabus, active_subject, academic_year, semester, options }) {
    const { data, setData, post, processing, errors } = useForm({
        silabus_id: silabus.id,
        active_subject_id: active_subject?.id || '',
        semester_id: semester?.id || '',
        academic_year_id: academic_year?.id || '',

        topic: silabus.materi,
        sub_topic: '',
        sk: silabus.standar_kompetensi,
        kd: silabus.kompetensi,
        objectives: '',

        methods: [],
        media: [],
        assessments: [],

        activities: {
            pendahuluan: "1. Guru memberi salam dan mengajak siswa berdoa.\n2. Mengecek kehadiran siswa.\n3. Menyampaikan tujuan pembelajaran dan apersepsi.",
            inti: "1. Eksplorasi: Siswa mengamati materi tentang...\n2. Elaborasi: Siswa berdiskusi mengenai...\n3. Konfirmasi: Guru memberikan penguatan...",
            penutup: "1. Siswa dan Guru menyimpulkan materi.\n2. Refleksi pembelajaran.\n3. Doa penutup dan salam."
        }
    });

    const handleCheckboxChange = (field, value, checked) => {
        if (checked) {
            setData(field, [...data[field], value]);
        } else {
            setData(field, data[field].filter(item => item !== value));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('supervision-rpps.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Generator RPP</h2>}
        >
            <Head title="Buat RPP Baru" />

            <div className="py-12">
                <form onSubmit={submit} className="max-w-5xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Error Summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Terdapat kesalahan pada input:</h3>
                                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                        {Object.values(errors).map((error, idx) => <li key={idx}>{error}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {!active_subject && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                            <p className="text-sm text-yellow-700">
                                <strong>Peringatan context:</strong> Sistem tidak dapat mendeteksi Mapel Aktif Anda secara otomatis untuk silabus ini. Pastikan Anda memiliki jam mengajar (Active Subject) untuk mapel/kelas tersebut.
                            </p>
                        </div>
                    )}

                    {/* 1. IDENTITAS (Read Only) */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>1. Identitas Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Mata Pelajaran</Label>
                                <Input value={silabus.mapel.name} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas</Label>
                                <Input value={silabus.kelas.name} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label>Semester / TP</Label>
                                <Input value={`${semester?.name} / ${academic_year?.name}`} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label>Alokasi Waktu</Label>
                                <Input value={silabus.alokasi_waktu || '2 x 45 Menit'} disabled className="bg-gray-100" />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label>Materi Pokok (Topic)</Label>
                                <Input value={data.topic} onChange={e => setData('topic', e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Standar Kompetensi</Label>
                                <Textarea value={data.sk} disabled className="bg-gray-100 h-24" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kompetensi Dasar</Label>
                                <Textarea value={data.kd} disabled className="bg-gray-100 h-24" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. TUJUAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>2. Tujuan Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                placeholder="Tuliskan tujuan pembelajaran..."
                                className="h-24"
                                value={data.objectives}
                                onChange={e => setData('objectives', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Tip: Gunakan kata kerja operasional (Menjelaskan, Mengidentifikasi, Menganalisis).
                            </p>
                        </CardContent>
                    </Card>

                    {/* 3. METODE & MEDIA (Selector) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="bg-gray-50 border-b border-gray-100">
                                <CardTitle>3. Metode Pembelajaran</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {options.methods.map((method) => (
                                        <div key={method} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`m-${method}`}
                                                checked={data.methods.includes(method)}
                                                onCheckedChange={(checked) => handleCheckboxChange('methods', method, checked)}
                                            />
                                            <label
                                                htmlFor={`m-${method}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {method}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="bg-gray-50 border-b border-gray-100">
                                <CardTitle>4. Media & Alat</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {options.media.map((item) => (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`med-${item}`}
                                                checked={data.media.includes(item)}
                                                onCheckedChange={(checked) => handleCheckboxChange('media', item, checked)}
                                            />
                                            <label
                                                htmlFor={`med-${item}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {item}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 5. LANGKAH PEMBELAJARAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>5. Langkah Pembelajaran</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-base">A. Pendahuluan</Label>
                                <Textarea
                                    className="h-32"
                                    value={data.activities.pendahuluan}
                                    onChange={e => setData('activities', { ...data.activities, pendahuluan: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-base">B. Kegiatan Inti</Label>
                                <Textarea
                                    className="h-48"
                                    value={data.activities.inti}
                                    onChange={e => setData('activities', { ...data.activities, inti: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-base">C. Penutup</Label>
                                <Textarea
                                    className="h-32"
                                    value={data.activities.penutup}
                                    onChange={e => setData('activities', { ...data.activities, penutup: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. PENILAIAN */}
                    <Card>
                        <CardHeader className="bg-gray-50 border-b border-gray-100">
                            <CardTitle>6. Penilaian / Asesmen</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {options.assessments.map((a) => (
                                    <div key={a} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`a-${a}`}
                                            checked={data.assessments.includes(a)}
                                            onCheckedChange={(checked) => handleCheckboxChange('assessments', a, checked)}
                                        />
                                        <label
                                            htmlFor={`a-${a}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {a}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pb-12">
                        <Button variant="outline" asChild>
                            <Link href={route('supervision-rpps.index')}>Batal</Link>
                        </Button>
                        <Button type="submit" size="lg" disabled={processing} className="w-48">
                            <Save className="w-4 h-4 mr-2" />
                            Simpan RPP
                        </Button>
                    </div>

                </form>
            </div>
        </AuthenticatedLayout>
    );
}
