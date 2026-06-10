import React, { useState, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import Modal from '@/Components/Modal';
import { Plus, Edit, Trash2, Home, CheckCircle2, ListChecks } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

const ASPECT_LABELS = {
    A: 'A. PERSIAPAN & PENGUASAAN MATERI',
    B: 'B. PEMBUKAAN PEMBELAJARAN',
    C: 'C. METODE & INTERAKSI PEMBELAJARAN',
    D: 'D. MANAJEMEN KELAS & WAKTU',
    E: 'E. PENUTUPAN PEMBELAJARAN',
    F: 'F. PROFESIONALISME GURU',
    G: 'G. PERTANYAAN KUNCI (HIGH-SIGNAL)',
};

const SCALE_1_3_LABELS = {
    1: 'Tidak pernah/Hampir tidak terjadi',
    2: 'Kadang terjadi',
    3: 'Sering/Selalu terjadi',
};

export default function Index({ questions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [activeTab, setActiveTab] = useState('scale_1_3'); // 'scale_1_3' or 'rating'

    const { data, setData, post, put, reset, errors, processing } = useForm({
        question: '',
        order: '',
        is_active: true,
        type: 'scale_1_3',
        aspect: '',
        options: {},
    });

    const filteredQuestions = questions.filter(q => q.type === activeTab);

    // Group questions by aspect
    const groupedQuestions = useMemo(() => {
        if (activeTab !== 'scale_1_3') return null;
        const groups = {};
        filteredQuestions.forEach(q => {
            const aspect = q.aspect || 'other';
            if (!groups[aspect]) {
                groups[aspect] = [];
            }
            groups[aspect].push(q);
        });
        return groups;
    }, [filteredQuestions, activeTab]);

    const openModal = (question = null) => {
        if (question) {
            setEditingQuestion(question);
            setData({
                question: question.question,
                order: question.order,
                is_active: question.is_active,
                type: question.type,
                aspect: question.aspect || '',
                options: question.options || {},
            });
        } else {
            setEditingQuestion(null);
            reset();
            // Auto suggest order based on filtered list
            const maxOrder = filteredQuestions.length > 0 ? Math.max(...filteredQuestions.map(q => q.order)) : 0;
            setData({
                question: '',
                order: maxOrder + 1,
                is_active: true,
                type: activeTab,
                aspect: '',
                options: {},
            });
        }
        setIsModalOpen(true);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (editingQuestion) {
            put(route('supervision-settings.student-questionnaires.update', editingQuestion.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('supervision-settings.student-questionnaires.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const deleteQuestion = (question) => {
        if (confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) {
            router.delete(route('supervision-settings.student-questionnaires.destroy', question.id));
        }
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Angket Santri" />

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Angket Santri</h2>
                        <p className="text-muted-foreground">Kelola pertanyaan yang akan muncul di angket evaluasi santri.</p>
                    </div>
                    <Link href={route('supervision-settings.index')}>
                        <Button variant="outline" className="gap-2">
                            Kembali ke Pengaturan Utama
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="scale_1_3" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Skala 1-3
                            </TabsTrigger>
                            <TabsTrigger value="rating" className="gap-2">
                                <ListChecks className="h-4 w-4" />
                                Rubrik (Skala 1-4)
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">
                                            {activeTab === 'scale_1_3' ? 'Pertanyaan Skala 1-3' : 'Pertanyaan Rubrik (Skala 1-4)'}
                                        </CardTitle>
                                        <CardDescription>
                                            {activeTab === 'scale_1_3'
                                                ? 'Siswa akan memberikan penilaian dengan skala 1 (Tidak pernah) s/d 3 (Sering/Selalu terjadi).'
                                                : 'Siswa akan memberikan penilaian dengan skala 1 (Sangat Kurang) s/d 4 (Sangat Baik).'}
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus className="h-4 w-4" /> Tambah Pertanyaan
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activeTab === 'scale_1_3' && groupedQuestions ? (
                                            Object.keys(groupedQuestions).sort().map((aspect) => (
                                                <div key={aspect} className="space-y-3">
                                                    <div className="bg-indigo-50 border-l-4 border-indigo-500 px-4 py-2 rounded-r-lg">
                                                        <h4 className="font-semibold text-indigo-900">{ASPECT_LABELS[aspect] || `Aspek ${aspect}`}</h4>
                                                    </div>
                                                    {groupedQuestions[aspect].map((q) => (
                                                        <div key={q.id} className="flex items-start gap-4 p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors ml-4">
                                                            <div className="flex-shrink-0 bg-slate-100 h-8 w-8 flex items-center justify-center rounded-full font-bold text-slate-600">
                                                                {q.order}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-slate-800 text-base">{q.question}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {q.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                                    </span>
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                                        Skala 1-3
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button variant="ghost" size="icon" onClick={() => openModal(q)}>
                                                                    <Edit className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteQuestion(q)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {groupedQuestions[aspect].length === 0 && (
                                                        <div className="text-center py-8 text-slate-500 italic ml-4">
                                                            Belum ada pertanyaan untuk aspek ini.
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : activeTab === 'rating' && filteredQuestions.length > 0 ? (
                                            filteredQuestions.map((q) => (
                                                <div key={q.id} className="flex items-start gap-4 p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                                    <div className="flex-shrink-0 bg-slate-100 h-8 w-8 flex items-center justify-center rounded-full font-bold text-slate-600">
                                                        {q.order}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-800 text-base">{q.question}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {q.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                                Rubrik (1-4)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openModal(q)}>
                                                            <Edit className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteQuestion(q)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-slate-500 italic border-2 border-dashed rounded-lg">
                                                Belum ada pertanyaan tipe {activeTab === 'scale_1_3' ? '"Skala 1-3"' : '"Rubrik"'} dibuat.
                                                <br />Klik tombol "Tambah Pertanyaan" untuk membuat baru.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </Tabs>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipe Pertanyaan</Label>
                            <Input value={data.type === 'scale_1_3' ? 'Skala 1-3' : 'Rubrik (Skala 1-4)'} disabled className="bg-slate-100" />
                            <p className="text-xs text-muted-foreground">Tipe pertanyaan menyesuaikan tab yang sedang aktif.</p>
                        </div>

                        {data.type === 'scale_1_3' && (
                            <div className="space-y-2">
                                <Label htmlFor="aspect">Aspek <span className="text-red-500">*</span></Label>
                                <Select value={data.aspect} onValueChange={(value) => setData('aspect', value)}>
                                    <SelectTrigger id="aspect">
                                        <SelectValue placeholder="Pilih aspek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ASPECT_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.aspect && <span className="text-red-500 text-xs">{errors.aspect}</span>}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Urutan</Label>
                            <Input type="number" value={data.order} onChange={e => setData('order', e.target.value)} required />
                            {errors.order && <span className="text-red-500 text-xs">{errors.order}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Pertanyaan</Label>
                            <Textarea
                                value={data.question}
                                onChange={e => setData('question', e.target.value)}
                                placeholder="Contoh: Apakah guru menjelaskan materi dengan jelas?"
                                required
                                className="min-h-[100px]"
                            />
                            {errors.question && <span className="text-red-500 text-xs">{errors.question}</span>}
                        </div>

                        {data.type === 'scale_1_3' && (
                            <div className="space-y-3 border-l-2 border-indigo-200 pl-4 py-2 bg-indigo-50/50 rounded-r-lg">
                                <Label className="text-indigo-700">Deskripsi Skala (Tetap)</Label>
                                <p className="text-xs text-muted-foreground mb-2">Skala penilaian untuk pertanyaan ini:</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex gap-2">
                                        <span className="font-semibold w-6">1:</span>
                                        <span className="text-slate-600">{SCALE_1_3_LABELS[1]}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-semibold w-6">2:</span>
                                        <span className="text-slate-600">{SCALE_1_3_LABELS[2]}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-semibold w-6">3:</span>
                                        <span className="text-slate-600">{SCALE_1_3_LABELS[3]}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {data.type === 'rating' && (
                            <div className="space-y-4 border-l-2 border-indigo-200 pl-4 py-2 bg-indigo-50/50 rounded-r-lg">
                                <Label className="text-indigo-700">Deskripsi Pilihan Jawaban (Opsional)</Label>
                                <p className="text-xs text-muted-foreground mb-2">Kosongkan jika ingin menggunakan label default (Sangat Kurang, Kurang, Baik, Sangat Baik).</p>

                                <div className="grid gap-3">
                                    {[1, 2, 3, 4].map(score => (
                                        <div key={score} className="space-y-1">
                                            <Label htmlFor={`option-${score}`} className="text-xs">Skala {score}</Label>
                                            <Input
                                                id={`option-${score}`}
                                                value={data.options?.[score] || ''}
                                                onChange={e => setData('options', { ...data.options, [score]: e.target.value })}
                                                placeholder={`Deskripsi untuk skala ${score}`}
                                                className="h-8 text-sm bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">Aktifkan Pertanyaan ini</Label>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </MainLayout>
    );
}
