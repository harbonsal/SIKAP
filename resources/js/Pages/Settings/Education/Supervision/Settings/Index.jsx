import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import Modal from '@/Components/Modal';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';

export default function Index({ categories, questions }) {
    const [activeTab, setActiveTab] = useState('categories');

    // --- CATEGORIES STATE ---
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const { data: catData, setData: setCatData, post: postCat, put: putCat, delete: delCat, reset: resetCat, errors: catErrors, processing: catProcessing } = useForm({
        name: '',
        min_score: '',
        max_score: '',
        color_class: 'text-slate-600',
        description: '',
    });

    const openCategoryModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCatData({
                name: category.name,
                min_score: category.min_score,
                max_score: category.max_score,
                color_class: category.color_class || 'text-slate-600',
                description: category.description || '',
            });
        } else {
            setEditingCategory(null);
            resetCat();
        }
        setIsCategoryModalOpen(true);
    };

    const submitCategory = (e) => {
        e.preventDefault();
        if (editingCategory) {
            putCat(route('supervision-settings.categories.update', editingCategory.id), {
                onSuccess: () => setIsCategoryModalOpen(false),
            });
        } else {
            postCat(route('supervision-settings.categories.store'), {
                onSuccess: () => setIsCategoryModalOpen(false),
            });
        }
    };

    const deleteCategory = (category) => {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            router.delete(route('supervision-settings.categories.destroy', category.id));
        }
    };

    // --- QUESTIONS STATE ---
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    // Rubrics managed locally in form before submit or separate? 
    // For simplicity, let's manage question basic info here. 
    // Rubrics might need a nested UI or a separate modal. 
    // Let's keep it simple: Create Question first, then Manage Rubrics in line or via specific UI?
    // Actually, user wants to edit points.

    // Let's support editing rubrics inside the question modal or expand row.
    // Simplifying: Question Modal creates the question. Rubrics are managed in the list view (expandable) or separate modal.
    // Let's do nested management in modal for better UX.

    const { data: qData, setData: setQData, post: postQ, put: putQ, delete: delQ, reset: resetQ, errors: qErrors, processing: qProcessing } = useForm({
        number: '',
        category: '',
        aspect: '',
    });

    const openQuestionModal = (question = null) => {
        if (question) {
            setEditingQuestion(question);
            setQData({
                number: question.number,
                category: question.category,
                aspect: question.aspect,
            });
        } else {
            setEditingQuestion(null);
            resetQ();
            // Auto-suggest number
            const maxNum = questions.length > 0 ? Math.max(...questions.map(q => q.number)) : 0;
            setQData('number', maxNum + 1);
        }
        setIsQuestionModalOpen(true);
    };

    const submitQuestion = (e) => {
        e.preventDefault();
        if (editingQuestion) {
            putQ(route('supervision-settings.questions.update', editingQuestion.id), {
                onSuccess: () => setIsQuestionModalOpen(false),
            });
        } else {
            postQ(route('supervision-settings.questions.store'), {
                onSuccess: () => setIsQuestionModalOpen(false),
            });
        }
    };

    const deleteQuestion = (question) => {
        if (confirm('Hapus pertanyaan ini beserta rubriknya?')) {
            router.delete(route('supervision-settings.questions.destroy', question.id));
        }
    };

    // --- RUBRIC MANAGEMENT (Row Based) ---
    // Helper to group rubrics into rows (by index in their score group)
    const getRubricRows = (rubrics) => {
        if (!rubrics) return [];
        const r3 = rubrics.filter(r => parseInt(r.score) === 3).sort((a, b) => a.id - b.id);
        const r2 = rubrics.filter(r => parseInt(r.score) === 2).sort((a, b) => a.id - b.id);
        const r1 = rubrics.filter(r => parseInt(r.score) === 1).sort((a, b) => a.id - b.id);

        const maxLen = Math.max(r3.length, r2.length, r1.length);
        const rows = [];

        for (let i = 0; i < maxLen; i++) {
            rows.push({
                r3: r3[i] || null,
                r2: r2[i] || null,
                r1: r1[i] || null,
            });
        }
        return rows;
    };

    const [addingRubricTo, setAddingRubricTo] = useState(null); // Question ID
    const { data: rData, setData: setRData, post: postR, reset: resetR, processing: rProcessing } = useForm({
        score_3: '',
        score_2: '',
        score_1: '',
    });

    const addRubricRow = (questionId) => {
        postR(route('supervision-settings.rubrics.store-row', questionId), {
            onSuccess: () => {
                resetR();
                setAddingRubricTo(null);
            }
        });
    };

    const deleteRubricRow = (row) => {
        if (confirm('Hapus baris checklist ini? Item pada skor 3, 2, dan 1 akan dihapus.')) {
            const idsToDelete = [];
            if (row.r3) idsToDelete.push(row.r3.id);
            if (row.r2) idsToDelete.push(row.r2.id);
            if (row.r1) idsToDelete.push(row.r1.id);

            router.post(route('supervision-settings.rubrics.destroy-row'), { ids: idsToDelete }, {
                preserveScroll: true,
            });
        }
    };

    // Inline Edit Rubric State
    const [editingRubricId, setEditingRubricId] = useState(null);
    const { data: editRData, setData: setEditRData, put: putR, processing: rEditProcessing } = useForm({
        description: '',
        score: '',
    });

    const startEditingRubric = (rubric) => {
        setEditingRubricId(rubric.id);
        setEditRData({
            description: rubric.description,
            score: rubric.score,
        });
    };

    const cancelEditingRubric = () => {
        setEditingRubricId(null);
        setEditRData({ description: '', score: '' });
    };

    const updateRubric = (rubricId) => {
        putR(route('supervision-settings.rubrics.update', rubricId), {
            onSuccess: () => cancelEditingRubric(),
        });
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Supervisi" />

            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan Supervisi</h2>
                    <p className="text-muted-foreground">Kelola kategori penilaian dan poin-poin checklist supervisi.</p>
                </div>

                <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="categories">Kategori Penilaian</TabsTrigger>
                        <TabsTrigger value="questions">Pertanyaan & Checklist</TabsTrigger>
                    </TabsList>

                    {/* CATEGORIES TAB */}
                    <TabsContent value="categories" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => openCategoryModal()} className="gap-2">
                                <Plus className="h-4 w-4" /> Tambah Kategori
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {categories.map((cat) => (
                                <Card key={cat.id} className="relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${cat.color_class.replace('text-', 'bg-')}`}></div>
                                    <CardHeader className="pb-2 pl-6">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className={`text-xl ${cat.color_class}`}>{cat.name}</CardTitle>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => openCategoryModal(cat)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => deleteCategory(cat)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="font-bold text-slate-700">
                                            Skor: {cat.min_score} - {cat.max_score}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-6 text-sm text-muted-foreground">
                                        {cat.description || '-'}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* QUESTIONS TAB */}
                    <TabsContent value="questions" className="space-y-6">
                        <div className="flex justify-end">
                            <Button onClick={() => openQuestionModal()} className="gap-2">
                                <Plus className="h-4 w-4" /> Tambah Aspek / Pertanyaan
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q) => (
                                <Card key={q.id} className="overflow-hidden border-l-4 border-l-slate-400">
                                    <CardHeader className="bg-slate-50 border-b py-3 px-6 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-sm">No. {q.number}</span>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{q.aspect}</h3>
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{q.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openQuestionModal(q)}>
                                                <Edit className="h-4 w-4" /> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteQuestion(q)}>
                                                <Trash2 className="h-4 w-4" /> Hapus
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="p-4">
                                            <div className="space-y-4">
                                                {getRubricRows(q.rubrics).map((row, index) => (
                                                    <div key={index} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                                        {/* Score 3 */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="text-xs font-bold text-emerald-600 mb-1">Poin 3 (Sangat Baik)</div>
                                                            {row.r3 ? (
                                                                editingRubricId === row.r3.id ? (
                                                                    <div className="space-y-2">
                                                                        <Textarea
                                                                            value={editRData.description}
                                                                            onChange={e => setEditRData('description', e.target.value)}
                                                                            className="min-h-[60px] text-sm"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button size="sm" onClick={() => updateRubric(row.r3.id)} disabled={rEditProcessing} className="h-7 text-xs">Simpan</Button>
                                                                            <Button size="sm" variant="ghost" onClick={cancelEditingRubric} className="h-7 text-xs">Batal</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="text-sm text-slate-700 bg-emerald-50/50 p-2 rounded border border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors"
                                                                        onClick={() => startEditingRubric(row.r3)}
                                                                        title="Klik untuk edit"
                                                                    >
                                                                        {row.r3.description}
                                                                        <div className="mt-1 text-xs text-slate-400 text-right opacity-0 group-hover:opacity-100">Klik untuk edit</div>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="text-sm italic text-slate-400 bg-slate-50 p-2 rounded">- Kosong -</div>
                                                            )}
                                                        </div>

                                                        {/* Score 2 */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="text-xs font-bold text-blue-600 mb-1">Poin 2 (Baik)</div>
                                                            {row.r2 ? (
                                                                editingRubricId === row.r2.id ? (
                                                                    <div className="space-y-2">
                                                                        <Textarea
                                                                            value={editRData.description}
                                                                            onChange={e => setEditRData('description', e.target.value)}
                                                                            className="min-h-[60px] text-sm"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button size="sm" onClick={() => updateRubric(row.r2.id)} disabled={rEditProcessing} className="h-7 text-xs">Simpan</Button>
                                                                            <Button size="sm" variant="ghost" onClick={cancelEditingRubric} className="h-7 text-xs">Batal</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="text-sm text-slate-700 bg-blue-50/50 p-2 rounded border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors"
                                                                        onClick={() => startEditingRubric(row.r2)}
                                                                        title="Klik untuk edit"
                                                                    >
                                                                        {row.r2.description}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="text-sm italic text-slate-400 bg-slate-50 p-2 rounded">- Kosong -</div>
                                                            )}
                                                        </div>

                                                        {/* Score 1 */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="text-xs font-bold text-rose-600 mb-1">Poin 1 (Cukup/Kurang)</div>
                                                            {row.r1 ? (
                                                                editingRubricId === row.r1.id ? (
                                                                    <div className="space-y-2">
                                                                        <Textarea
                                                                            value={editRData.description}
                                                                            onChange={e => setEditRData('description', e.target.value)}
                                                                            className="min-h-[60px] text-sm"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button size="sm" onClick={() => updateRubric(row.r1.id)} disabled={rEditProcessing} className="h-7 text-xs">Simpan</Button>
                                                                            <Button size="sm" variant="ghost" onClick={cancelEditingRubric} className="h-7 text-xs">Batal</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="text-sm text-slate-700 bg-rose-50/50 p-2 rounded border border-rose-100 cursor-pointer hover:border-rose-300 transition-colors"
                                                                        onClick={() => startEditingRubric(row.r1)}
                                                                        title="Klik untuk edit"
                                                                    >
                                                                        {row.r1.description}
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="text-sm italic text-slate-400 bg-slate-50 p-2 rounded">- Kosong -</div>
                                                            )}
                                                        </div>

                                                        <div className="w-10 flex items-center justify-center pt-6">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-red-600"
                                                                onClick={() => deleteRubricRow(row)}
                                                                title="Hapus baris ini (semua Poin)"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add New Rubric Row Form */}
                                            {addingRubricTo === q.id ? (
                                                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded animate-in slide-in-from-top-2">
                                                    <h4 className="font-bold text-sm mb-3">Tambah Baris Checklist Baru</h4>
                                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-emerald-700">Deskripsi Poin 3</Label>
                                                            <Textarea placeholder="Indikator sangat baik..." value={rData.score_3} onChange={e => setRData('score_3', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-blue-700">Deskripsi Poin 2</Label>
                                                            <Textarea placeholder="Indikator baik..." value={rData.score_2} onChange={e => setRData('score_2', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-rose-700">Deskripsi Poin 1</Label>
                                                            <Textarea placeholder="Indikator cukup/kurang..." value={rData.score_1} onChange={e => setRData('score_1', e.target.value)} className="text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" onClick={() => setAddingRubricTo(null)}>Batal</Button>
                                                        <Button onClick={() => addRubricRow(q.id)} disabled={rProcessing}>Simpan Baris</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 text-center">
                                                    <Button variant="outline" size="sm" className="w-full border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary" onClick={() => {
                                                        resetR();
                                                        setAddingRubricTo(q.id);
                                                    }}>
                                                        <Plus className="h-4 w-4 mr-2" /> Tambah Baris Checklist
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* CATEGORY MODAL */}
            <Modal show={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                    <form onSubmit={submitCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Kategori</Label>
                            <Input value={catData.name} onChange={e => setCatData('name', e.target.value)} placeholder="Contoh: Sangat Baik" required />
                            {catErrors.name && <span className="text-red-500 text-xs">{catErrors.name}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Skor</Label>
                                <Input type="number" value={catData.min_score} onChange={e => setCatData('min_score', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Skor</Label>
                                <Input type="number" value={catData.max_score} onChange={e => setCatData('max_score', e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Warna (Tailwind Class)</Label>
                            <Input value={catData.color_class} onChange={e => setCatData('color_class', e.target.value)} placeholder="text-green-600" />
                            <p className="text-xs text-muted-foreground">Gunakan kelas warna teks Tailwind (contoh: text-red-600)</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi / Label Laporan</Label>
                            <Input value={catData.description} onChange={e => setCatData('description', e.target.value)} placeholder="Contoh: Memadai" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={catProcessing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* QUESTION MODAL */}
            <Modal show={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} maxWidth="lg">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h3>
                    <form onSubmit={submitQuestion} className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>No.</Label>
                                <Input type="number" value={qData.number} onChange={e => setQData('number', e.target.value)} required />
                                {qErrors.number && <span className="text-red-500 text-xs">{qErrors.number}</span>}
                            </div>
                            <div className="space-y-2 col-span-3">
                                <Label>Kategori Aspek</Label>
                                <Input value={qData.category} onChange={e => setQData('category', e.target.value)} placeholder="Contoh: KEGIATAN PENDAHULUAN" required />
                                {qErrors.category && <span className="text-red-500 text-xs">{qErrors.category}</span>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Aspek Penilaian</Label>
                            <Textarea value={qData.aspect} onChange={e => setQData('aspect', e.target.value)} placeholder="Deskripsi aspek yang dinilai..." required />
                            {qErrors.aspect && <span className="text-red-500 text-xs">{qErrors.aspect}</span>}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={qProcessing}>Simpan</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </MainLayout>
    );
}
