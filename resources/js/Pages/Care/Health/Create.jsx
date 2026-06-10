import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Search, Save, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Create({ complaints, descriptionTemplates = [], activeKamars = [] }) {
    // Form
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        complaint_ids: [],
        therapy: '',
        description: '',
    });

    // Student Search Logic
    const [selectedKamar, setSelectedKamar] = useState('all');
    const [studentQuery, setStudentQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Fetch students
    useEffect(() => {
        const shouldFetch = studentQuery.length > 2 || (selectedKamar !== 'all' && selectedKamar !== '');

        if (shouldFetch) {
            setSearching(true);
            const timeout = setTimeout(() => {
                fetch(route('health.students.search', {
                    query: studentQuery,
                    active_kamar_id: selectedKamar === 'all' ? '' : selectedKamar
                }))
                    .then(res => res.json())
                    .then(data => {
                        setStudents(data);
                        setSearching(false);
                    });
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setStudents([]);
        }
    }, [studentQuery, selectedKamar]);

    const handleSelectStudent = (s) => {
        setSelectedStudent(s);
        setData('student_id', s.id);
        setStudents([]);
        setStudentQuery('');

        // Auto-select Kamar
        if (s.kamar_members && s.kamar_members.length > 0) {
            const latestKamar = s.kamar_members[s.kamar_members.length - 1];
            if (latestKamar && latestKamar.active_kamar_id) {
                setSelectedKamar(String(latestKamar.active_kamar_id));
            }
        }
    };

    const toggleComplaint = (id) => {
        const ids = [...data.complaint_ids];
        if (ids.includes(id)) {
            setData('complaint_ids', ids.filter(i => i !== id));
        } else {
            setData('complaint_ids', [...ids, id]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('health.records.store'), {
            onSuccess: () => {
                if (confirm('Data berhasil disimpan. Input data lagi?')) {
                    reset('student_id', 'complaint_ids', 'therapy', 'description');
                    setSelectedStudent(null);
                    setStudentQuery('');
                    // Keep date and kamar for convenience
                } else {
                    // Redirect is handled by backend usually, but here we might want to go to index
                    // Actually backend currently redirects back.
                    // If we are on a separate page, we might want to redirect to Index.
                    // Let's rely on standard Inertia behavior, maybe add a "Selesai" button.
                }
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Input Data Kesehatan" />
            <div className="py-6 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-4">
                    <Button variant="ghost" asChild>
                        <Link href={route('health.records.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Pantauan
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Input Data Kesehatan</CardTitle>
                        <CardDescription>Catat keluhan dan tindakan untuk santri sakit.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Date */}
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <Input
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Asrama Selection */}
                            <div className="space-y-2">
                                <Label>Asrama (Opsional)</Label>
                                <Select value={selectedKamar} onValueChange={(val) => {
                                    setSelectedKamar(val);
                                    setStudentQuery('');
                                    setStudents([]);
                                    setSelectedStudent(null);
                                    setData('student_id', '');
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Asrama / Kamar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Santri</SelectItem>
                                        {activeKamars.map(k => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                {k.kamar.name} {k.name ? `(${k.name})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Student Search */}
                            <div className="space-y-2">
                                <Label>Nama Santri</Label>
                                {selectedStudent ? (
                                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                                        <div>
                                            <div className="font-bold text-indigo-900">{selectedStudent?.user?.name}</div>
                                            <div className="text-xs text-indigo-700">
                                                {selectedStudent?.kamar_members?.length > 0
                                                    ? selectedStudent.kamar_members[0].active_kamar?.kamar?.name
                                                    : 'Belum ada kamar'}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            type="button"
                                            variant="ghost"
                                            onClick={() => { setSelectedStudent(null); setData('student_id', ''); }}
                                        >
                                            Ganti
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Ketik nama (min 3 huruf)..."
                                            autoComplete="off"
                                            className="pl-10"
                                            value={studentQuery}
                                            onChange={e => setStudentQuery(e.target.value)}
                                        />
                                        {students.length > 0 && (
                                            <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-xl max-h-48 overflow-y-auto">
                                                {students.map(s => (
                                                    <div
                                                        key={s.id}
                                                        className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0"
                                                        onClick={() => handleSelectStudent(s)}
                                                    >
                                                        <div className="font-medium">{s.user?.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {s.user?.nomor_induk || s.nisn || '-'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {searching && <div className="text-xs text-gray-500 mt-1">Mencari...</div>}
                                    </div>
                                )}
                                {errors.student_id && <p className="text-sm text-red-500">Pilih santri terlebih dahulu.</p>}
                            </div>

                            {/* Complaints */}
                            <div className="space-y-2">
                                <Label>Keluhan</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-4 bg-gray-50 max-h-48 overflow-y-auto">
                                    {complaints.map(c => (
                                        <div key={c.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`c-${c.id}`}
                                                checked={data.complaint_ids.includes(c.id)}
                                                onCheckedChange={() => toggleComplaint(c.id)}
                                            />
                                            <label
                                                htmlFor={`c-${c.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {c.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.complaint_ids && <p className="text-sm text-red-500">Pilih minimal satu keluhan.</p>}
                            </div>

                            {/* Therapy */}
                            <div className="space-y-2">
                                <Label>Terapi / Tindakan (Opsional)</Label>
                                <Textarea
                                    placeholder="Contoh: Paracetamol, Istirahat, Minum air hangat..."
                                    value={data.therapy}
                                    onChange={e => setData('therapy', e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label>Keterangan (Opsional)</Label>
                                <div className="space-y-2">
                                    <Select onValueChange={(val) => setData('description', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Template Keterangan..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {descriptionTemplates.map(t => (
                                                <SelectItem key={t.id} value={t.message}>
                                                    {t.message.length > 50 ? t.message.substring(0, 50) + '...' : t.message}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Textarea
                                        placeholder="Atau ketik keterangan manual..."
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Batal</Button>
                            <Button type="submit" disabled={processing || !data.student_id}>
                                <Save className="mr-2 h-4 w-4" /> Simpan Data
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
