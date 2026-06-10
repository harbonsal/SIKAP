import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Save, User as UserIcon, BookOpen, Upload, Camera, HelpCircle, AlertCircle, Info } from 'lucide-react';
import Select from 'react-select';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function Edit({ supervision, details, teachers, questions, categories }) {
    // Transform details into mappings
    const initialNotes = useMemo(() => details.reduce((acc, d) => ({ ...acc, [d.supervision_question_id]: d.notes || '' }), {}), [details]);
    const initialScores = useMemo(() => details.reduce((acc, d) => ({ ...acc, [d.supervision_question_id]: d.score }), {}), [details]);
    const initialChecks = useMemo(() => details.reduce((acc, d) => ({ ...acc, [d.supervision_question_id]: d.checked_items || [] }), {}), [details]);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        teacher_id: supervision.teacher_id,
        date: supervision.date,
        hour: supervision.lesson_hours || '',
        // We keep these for schedule checking, but they might be read-only or pre-filled
        active_subject_id: supervision.active_subject_id,
        supervisor_note: supervision.notes || '',
        notes: initialNotes,
        scores: initialScores,
        checked_items: initialChecks,
        proof_file: null,
    });

    const [scheduleInfo, setScheduleInfo] = useState({ mapel: '', kelas: '', pekan: '', topic: '', syllabus: null, available_weeks: [] });
    const [isChecking, setIsChecking] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const [showSyllabus, setShowSyllabus] = useState(false);
    const [selectedPekan, setSelectedPekan] = useState('');

    // Load initial schedule info if revision is needed
    // For Edit, we might want to run checkSchedule once on mount to populate the syllabus info based on saved data
    useEffect(() => {
        if (data.teacher_id && data.date && data.hour) {
            const checkSchedule = async () => {
                setIsChecking(true);
                try {
                    const response = await axios.post(route('supervisions.check-schedule'), {
                        teacher_id: data.teacher_id,
                        date: data.date,
                        hour: data.hour
                    });

                    if (response.data.found) {
                        setScheduleInfo({
                            mapel: response.data.mapel_name,
                            kelas: response.data.class_name,
                            pekan: response.data.pekan,
                            topic: response.data.topic,
                            syllabus: response.data.syllabus,
                            available_weeks: response.data.available_weeks || []
                        });
                        setSelectedPekan(response.data.pekan || '');

                        // In Edit mode, we don't auto-overwrite active_subject_id unless user changes inputs context significantly?
                        // Actually, if they edit date/hour, we SHOULD update active_subject_id.
                        setData(prev => ({
                            ...prev,
                            active_subject_id: response.data.active_subject_id,
                        }));
                    } else {
                        setScheduleInfo({ mapel: '', kelas: '', pekan: '', topic: '', syllabus: null, available_weeks: [] });
                        setSelectedPekan('');
                    }
                } catch (error) {
                    console.error("Failed to check schedule", error);
                } finally {
                    setIsChecking(false);
                }
            };

            // Initial run or debounce run
            checkSchedule();
        }
    }, [data.teacher_id, data.date, data.hour]); // Dependency array ensures it runs when these change

    const handlePekanChange = (e) => {
        const newPekan = e.target.value;
        setSelectedPekan(newPekan);

        const weekData = scheduleInfo.available_weeks.find(w => w.pekan === newPekan);
        if (weekData) {
            setScheduleInfo(prev => ({
                ...prev,
                syllabus: {
                    materi: weekData.materi,
                    sk: weekData.sk,
                    kd: weekData.kd
                }
            }));
        }
    };

    const teacherOptions = teachers.map(t => ({ value: t.id, label: t.name }));

    const groupedQuestions = useMemo(() => questions.reduce((acc, q) => {
        if (!acc[q.category]) acc[q.category] = [];
        acc[q.category].push(q);
        return acc;
    }, {}), [questions]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('proof_file', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateScore = (qId, newCheckedItems) => {
        const question = questions.find(q => q.id === parseInt(qId) || q.id === qId);
        if (!question) return 0;
        if (!newCheckedItems || newCheckedItems.length === 0) return 0;

        const checkedScores = [];
        newCheckedItems.forEach(itemDesc => {
            const rubric = question.rubrics.find(r => r.description === itemDesc);
            if (rubric) checkedScores.push(parseInt(rubric.score));
        });

        if (checkedScores.length === 0) return 0;

        if (checkedScores.includes(1)) return 1;
        if (checkedScores.includes(2)) return 2;

        const totalLevel3Items = question.rubrics.filter(r => parseInt(r.score) === 3).length;
        const checkedLevel3Count = checkedScores.filter(s => s === 3).length;

        if (checkedLevel3Count === totalLevel3Items) {
            return 3;
        } else {
            return 2;
        }
    };

    const handleCheck = (questionId, itemDescription) => {
        const currentChecks = data.checked_items[questionId] || [];
        const question = questions.find(q => q.id === parseInt(questionId) || q.id === questionId);
        let conflictingItems = [];

        if (question) {
            const rubricsByScore = { 3: [], 2: [], 1: [] };
            question.rubrics.forEach(r => {
                if (rubricsByScore[r.score]) rubricsByScore[r.score].push(r);
            });

            let currentScore = null;
            let currentIndex = -1;

            for (const [s, list] of Object.entries(rubricsByScore)) {
                const idx = list.findIndex(r => r.description === itemDescription);
                if (idx !== -1) {
                    currentScore = parseInt(s);
                    currentIndex = idx;
                    break;
                }
            }

            if (currentScore !== null && currentIndex !== -1) {
                [3, 2, 1].forEach(s => {
                    if (s !== currentScore) {
                        const otherItem = rubricsByScore[s][currentIndex];
                        if (otherItem) {
                            conflictingItems.push(otherItem.description);
                        }
                    }
                });
            }
        }

        let newChecks;
        if (currentChecks.includes(itemDescription)) {
            newChecks = currentChecks.filter(c => c !== itemDescription);
        } else {
            newChecks = [...currentChecks.filter(c => !conflictingItems.includes(c)), itemDescription];
        }

        const newScore = calculateScore(questionId, newChecks);

        setData(prev => ({
            ...prev,
            checked_items: { ...prev.checked_items, [questionId]: newChecks },
            scores: { ...prev.scores, [questionId]: newScore }
        }));
    };

    const handleNoteChange = (questionId, text) => {
        setData('notes', { ...data.notes, [questionId]: text });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('supervisions.update', supervision.id), {
            forceFormData: true,
        });
    };

    const answeredCount = Object.keys(data.scores).length;
    const totalQuestions = questions.length;
    const progress = Math.round((answeredCount / totalQuestions) * 100);
    // Fix: Parse to integer for calculation
    const currentTotalScore = Object.values(data.scores).reduce((a, b) => parseInt(a, 10) + parseInt(b, 10), 0);
    const maxPossibleScore = totalQuestions * 3;

    let currentStatus = 'Kurang';
    let statusColor = 'text-red-600';
    if (categories && categories.length > 0) {
        const matched = categories.find(c => currentTotalScore >= c.min_score && currentTotalScore <= c.max_score);
        if (matched) {
            currentStatus = matched.name;
            statusColor = matched.color_class;
        }
    }

    return (
        <MainLayout>
            <Head title="Edit Penilaian Supervisi" />

            {/* Guide Modal - Same as Create */}
            <Modal show={showGuide} onClose={() => setShowGuide(false)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Panduan Penilaian Supervisi
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>Tutup</Button>
                    </div>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* GUIDE CONTENT - Copied from Create.jsx with Unggul fix */}
                        <section>
                            <h4 className="font-bold text-slate-800 mb-2 border-l-4 border-primary pl-2">I. Dasar Penilaian & Skala</h4>
                            <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
                                <div>
                                    <span className="font-bold text-green-700">Skor 3: Unggul</span>
                                    <p className="text-muted-foreground">Melebihi standar minimal. Kompetensi inti terpenuhi + kualitas istimewa/teladan.</p>
                                </div>
                                <div>
                                    <span className="font-bold text-blue-700">Skor 2: Memadai</span>
                                    <p className="text-muted-foreground">Memenuhi standar dasar. Kewajiban formal terpenuhi, masih ada ruang perbaikan.</p>
                                </div>
                                <div>
                                    <span className="font-bold text-red-700">Skor 1: Perlu Bimbingan</span>
                                    <p className="text-muted-foreground">Belum memenuhi standar minimal. Butuh intervensi mendesak.</p>
                                </div>
                            </div>
                        </section>
                        <section>
                            <h4 className="font-bold text-slate-800 mb-2 border-l-4 border-primary pl-2">II. Prinsip Penilaian Holistik</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                                <li><strong>Untuk Skor 3 (Unggul):</strong> WAJIB memenuhi <strong>SEMUA</strong> kriteria level 3. Jika ada SATU saja meleset, turun ke skor 2.</li>
                                <li><strong>Untuk Skor 2 (Memadai):</strong> Memenuhi semua kriteria level 2, ATAU memenuhi sebagian besar level 3 tapi ada satu yang level 2. Jika ada yang level 1, otomatis turun ke skor 1.</li>
                                <li><strong>Untuk Skor 1 (Perlu Bimbingan):</strong> Ada satu kriteria level 1, atau mayoritas masih level 2 kebawah.</li>
                            </ul>
                        </section>
                        {/* ... Rest of guide ... */}
                    </div>
                </div>
            </Modal>

            <div className="space-y-6 max-w-5xl mx-auto pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Penilaian Supervisi</h2>
                            <Button variant="outline" size="sm" onClick={() => setShowGuide(true)} className="gap-2 text-primary border-primary/20 hover:bg-primary/5">
                                <HelpCircle className="h-4 w-4" />
                                Panduan
                            </Button>
                        </div>
                        <p className="text-muted-foreground mt-1">Perbarui data penilaian supervisi.</p>
                    </div>
                    {answeredCount > 0 && (
                        <div className="bg-card border rounded-lg p-3 px-6 shadow-sm flex items-center gap-6">
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Skor</span>
                                <div className="text-2xl font-bold">{currentTotalScore} <span className="text-sm text-muted-foreground">/ {maxPossibleScore}</span></div>
                            </div>
                            <div className="h-10 w-px bg-border"></div>
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Kategori</span>
                                <div className={`text-xl font-bold ${statusColor}`}>{currentStatus}</div>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Identity Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserIcon className="h-5 w-5" /> Biodata Observasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Guru yang Dinilai</Label>
                                <Select
                                    options={teacherOptions}
                                    defaultValue={teacherOptions.find(t => t.value == data.teacher_id)} // Loose equality to handle string/int mismatch
                                    onChange={opt => setData('teacher_id', opt.value)}
                                    placeholder="Pilih Guru..."
                                    className="text-sm"
                                />
                                {errors.teacher_id && <p className="text-sm text-red-500">{errors.teacher_id}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tanggal Observasi</Label>
                                    <Input
                                        type="date"
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                    />
                                    {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Jam Ke-</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={data.hour}
                                        onChange={e => setData('hour', e.target.value)}
                                        placeholder="Contoh: 1"
                                    />
                                </div>
                            </div>

                            {/* Learning Info (Auto-detected) */}
                            <div className="col-span-2 p-4 bg-muted/20 rounded-lg border border-dashed relative group hover:bg-muted/30 transition-colors">
                                {isChecking && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-3 gap-4 mb-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Mata Pelajaran</Label>
                                        <div className="font-medium text-slate-800">{scheduleInfo.mapel || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Kelas</Label>
                                        <div className="font-medium text-slate-800">{scheduleInfo.kelas || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Pekan</Label>
                                        <div className="font-medium text-slate-800">{scheduleInfo.pekan || '-'}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground italic">
                                    *Data silabus otomatis terdeteksi berdasarkan jadwal.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions Iteration - Same as Create.jsx */}
                    {Object.entries(groupedQuestions).map(([category, qs], idx) => (
                        <Card key={idx} className="overflow-hidden mb-6 border-l-4 border-l-slate-400">
                            <CardHeader className="bg-slate-50 border-b py-4">
                                <CardTitle className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                                    {category}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {qs.map((q) => {
                                        const rubricsByScore = { 3: [], 2: [], 1: [] };
                                        q.rubrics.forEach(r => {
                                            if (rubricsByScore[r.score]) rubricsByScore[r.score].push(r);
                                        });
                                        const currentScore = data.scores[q.id];
                                        const checkedList = data.checked_items[q.id] || [];

                                        return (
                                            <div key={q.id} className="p-3 md:p-6 bg-white border-b border-slate-100 last:border-0">
                                                <div className="mb-3 md:mb-5">
                                                    <h4 className="font-bold text-base md:text-xl text-slate-800 mb-1 md:mb-2 flex items-start gap-2">
                                                        <span className="bg-slate-200 text-slate-600 text-xs md:text-sm font-bold px-2 py-1 rounded shrink-0 mt-0.5">{q.number}</span>
                                                        <span className="leading-tight">{q.aspect}</span>
                                                    </h4>
                                                </div>

                                                <div className="space-y-3 md:space-y-4">
                                                    {/* Score 3 */}
                                                    <div className={`relative rounded-lg md:rounded-xl p-3 md:p-5 transition-all duration-300 border overflow-hidden group ${currentScore === 3
                                                        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500 shadow-sm md:shadow-lg ring-1 md:ring-2 ring-emerald-300/50'
                                                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10'
                                                        }`}>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                                <div className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full font-bold shadow-sm transition-colors text-xs md:text-base shrink-0 ${currentScore === 3 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>3</div>
                                                                <h5 className={`font-bold text-sm md:text-lg ${currentScore === 3 ? 'text-emerald-900' : 'text-slate-700'}`}>Unggul (Wajib Semua)</h5>
                                                            </div>
                                                            <div className="space-y-1 md:pl-1">
                                                                {rubricsByScore[3].map((r) => (
                                                                    <label key={r.id} className="flex items-start gap-2 text-xs md:text-sm cursor-pointer hover:bg-black/5 p-1 md:p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                                                        <input type="checkbox" checked={checkedList.includes(r.description)} onChange={() => handleCheck(q.id, r.description)} className="mt-0.5 rounded border-2 border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 md:h-5 md:w-5 shrink-0" />
                                                                        <span className={`${checkedList.includes(r.description) ? 'text-emerald-900 font-bold' : 'text-slate-700 font-medium'} leading-tight`}>{r.description}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score 2 */}
                                                    <div className={`relative rounded-lg md:rounded-xl p-3 md:p-5 transition-all duration-300 border overflow-hidden group ${currentScore === 2
                                                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 shadow-sm md:shadow-lg ring-1 md:ring-2 ring-blue-300/50'
                                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/10'
                                                        }`}>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                                <div className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full font-bold shadow-sm transition-colors text-xs md:text-base shrink-0 ${currentScore === 2 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}>2</div>
                                                                <h5 className={`font-bold text-sm md:text-lg ${currentScore === 2 ? 'text-blue-900' : 'text-slate-700'}`}>Memadai</h5>
                                                            </div>
                                                            <div className="space-y-1 md:pl-1">
                                                                {rubricsByScore[2].map((r) => (
                                                                    <label key={r.id} className="flex items-start gap-2 text-xs md:text-sm cursor-pointer hover:bg-black/5 p-1 md:p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                                                        <input type="checkbox" checked={checkedList.includes(r.description)} onChange={() => handleCheck(q.id, r.description)} className="mt-0.5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 md:h-5 md:w-5 shrink-0" />
                                                                        <span className={`${checkedList.includes(r.description) ? 'text-blue-900 font-bold' : 'text-slate-700 font-medium'} leading-tight`}>{r.description}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score 1 */}
                                                    <div className={`relative rounded-lg md:rounded-xl p-3 md:p-5 transition-all duration-300 border overflow-hidden group ${currentScore === 1
                                                        ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-500 shadow-sm md:shadow-lg ring-1 md:ring-2 ring-rose-300/50'
                                                        : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/10'
                                                        }`}>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                                                                <div className={`flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full font-bold shadow-sm transition-colors text-xs md:text-base shrink-0 ${currentScore === 1 ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'}`}>1</div>
                                                                <h5 className={`font-bold text-sm md:text-lg ${currentScore === 1 ? 'text-rose-900' : 'text-slate-700'}`}>Perlu Bimbingan</h5>
                                                            </div>
                                                            <div className="space-y-1 md:pl-1">
                                                                {rubricsByScore[1].map((r) => (
                                                                    <label key={r.id} className="flex items-start gap-2 text-xs md:text-sm cursor-pointer hover:bg-black/5 p-1 md:p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                                                                        <input type="checkbox" checked={checkedList.includes(r.description)} onChange={() => handleCheck(q.id, r.description)} className="mt-0.5 rounded border-2 border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4 md:h-5 md:w-5 shrink-0" />
                                                                        <span className={`${checkedList.includes(r.description) ? 'text-rose-900 font-bold' : 'text-slate-700 font-medium'} leading-tight`}>{r.description}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-2">
                                                        <span className="bg-slate-200 p-1 rounded">Catatan Supervisor</span>
                                                        Ulasan Spesifik & Temuan Lapangan
                                                    </Label>
                                                    <Textarea
                                                        placeholder={`Tuliskan kekuatan yang perlu dipertahankan atau kelemahan yang perlu diperbaiki untuk aspek ${q.aspect}...`}
                                                        value={data.notes[q.id] || ''}
                                                        onChange={e => handleNoteChange(q.id, e.target.value)}
                                                        className="bg-white border-slate-200 focus:border-primary focus:ring-primary/20 resize-none min-h-[120px] text-base shadow-sm p-3"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Evidence & Closing */}
                    <Card className="border-l-4 border-l-purple-500 mb-24 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b py-4">
                            <CardTitle className="text-xl font-bold flex items-center gap-3 text-purple-900">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Upload className="h-6 w-6 text-purple-600" />
                                </div>
                                Bukti & Kesimpulan Akhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-10 p-8">
                            <div>
                                <Label className="mb-3 block font-bold text-slate-700 text-lg">Upload Foto Bukti Observasi</Label>
                                <div className="group border-2 border-dashed border-purple-200 rounded-2xl p-8 text-center hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer relative bg-slate-50/50">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                    />
                                    {photoPreview ? (
                                        <div className="relative">
                                            <div className="absolute -top-4 -right-4 z-20">
                                                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Foto Baru Terpilih</span>
                                            </div>
                                            <img src={photoPreview} alt="Preview" className="mx-auto max-h-64 rounded-xl shadow-lg transform group-hover:scale-[1.02] transition-transform" />
                                            <p className="text-sm text-purple-600 mt-3 font-medium">Klik area ini untuk mengganti foto</p>
                                        </div>
                                    ) : supervision.proof_url ? (
                                        <div className="relative">
                                            <div className="absolute -top-4 -right-4 z-20">
                                                <span className="bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Foto Saat Ini</span>
                                            </div>
                                            <img src={`/storage/${supervision.proof_url}`} alt="Current Proof" className="mx-auto max-h-64 rounded-xl shadow-lg" />
                                            <p className="text-sm text-purple-600 mt-3 font-medium">Klik area ini untuk mengubah foto</p>
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            <div className="h-24 w-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                                                <Camera className="h-12 w-12 text-purple-600" />
                                            </div>
                                            <p className="text-xl font-bold text-slate-700">Ambil Foto / Upload</p>
                                            <p className="text-base text-slate-500 mt-2">Format JPG/PNG, Maks 10MB</p>
                                        </div>
                                    )}
                                </div>
                                {errors.proof_file && <p className="text-base text-red-500 mt-2 font-bold flex items-center gap-1"><AlertCircle className="h-5 w-5" /> {errors.proof_file}</p>}
                            </div>
                            <div className="space-y-4">
                                <Label className="font-bold text-slate-700 block text-lg">Komentar Menyeluruh & Rekomendasi</Label>
                                <div className="relative">
                                    <Textarea
                                        value={data.supervisor_note}
                                        onChange={e => setData('supervisor_note', e.target.value)}
                                        placeholder="Berikan ringkasan kinerja, apresiasi, serta rekomendasi tindak lanjut yang konkret..."
                                        className="min-h-[280px] p-5 text-lg leading-relaxed bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-200 rounded-xl shadow-sm"
                                    />
                                    <div className="absolute bottom-4 right-4 text-sm text-slate-400 pointer-events-none">
                                        Min. 1 kalimat
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:pl-64 z-40 flex items-center justify-between pb-6 md:pb-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-600 mb-1">
                                Kelengkapan: {answeredCount} <span className="text-xs font-normal">/ {totalQuestions}</span>
                            </span>
                            <div className="w-32 md:w-48 h-3 bg-secondary rounded-full overflow-hidden border border-slate-200">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={processing || answeredCount < totalQuestions}
                            size="lg"
                            className="gap-2 shadow-lg hover:shadow-xl transition-all font-bold text-base px-6 h-12"
                        >
                            <Save className="h-5 w-5" />
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
