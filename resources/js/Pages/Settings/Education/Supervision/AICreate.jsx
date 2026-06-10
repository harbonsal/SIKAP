import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Cpu, Save, Play, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function AICreate({ teachers, questions, categories, context }) {
    const [step, setStep] = useState(1); // 1: Log, 2: Review
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Log State
    const [logs, setLogs] = useState([{ id: 1, timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), text: '' }]);

    // Supervision Form Data
    const { data, setData, post, processing, errors } = useForm({
        teacher_id: '',
        date: new Date().toISOString().split('T')[0],
        lesson_hours: '',
        semester_id: context?.semester?.id || '',
        academic_year_id: context?.academic_year?.id || '',
        active_subject_id: null,
        supervisor_note: '',
        notes: {}, // { question_id: note }
        scores: {}, // { question_id: score }
        ai_reasoning: {}, // { question_id: reason_string }
        checked_items: {},
        proof_file: null,
    });

    const [teacherOptions] = useState(teachers.map(t => ({ value: t.id, label: t.name })));
    const logsEndRef = useRef(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const addLog = () => {
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLogs([...logs, { id: Date.now(), timestamp: time, text: '' }]);
    };

    const updateLog = (id, field, value) => {
        setLogs(logs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };

    const removeLog = (id) => {
        if (logs.length > 1) {
            setLogs(logs.filter(log => log.id !== id));
        }
    };

    // Calculate Dynamic Score (Ported from Create.jsx)
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
        const question = questions.find(q => q.id === parseInt(questionId) || q.id === qId);
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

    // Auto-Detect Schedule
    useEffect(() => {
        if (data.teacher_id && data.date && data.lesson_hours) {
            const checkSchedule = async () => {
                // Parse hour: "1-2" -> 1. "1" -> 1.
                const hourInt = parseInt(data.lesson_hours.toString().split(/[^\d]/)[0]);
                if (!hourInt) return;

                setIsChecking(true);
                try {
                    const response = await axios.post(route('supervisions.check-schedule'), {
                        teacher_id: data.teacher_id,
                        date: data.date,
                        hour: hourInt
                    });

                    if (response.data.found) {
                        setData(prev => ({
                            ...prev,
                            active_subject_id: response.data.active_subject_id,
                            topic: response.data.topic || prev.topic,
                        }));
                    }
                } catch (error) {
                    console.error("Schedule check failed", error);
                } finally {
                    setIsChecking(false);
                }
            };

            const timer = setTimeout(() => {
                checkSchedule();
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [data.teacher_id, data.date, data.lesson_hours]);

    const [inputMode, setInputMode] = useState('realtime'); // 'realtime' | 'manual'
    const [duration, setDuration] = useState(60); // Default 60 minutes for manual mode
    const [manualNote, setManualNote] = useState(''); // Big text for manual mode

    const handleAnalyze = async () => {
        if (!data.teacher_id) {
            Swal.fire('Error', 'Pilih Guru terlebih dahulu.', 'error');
            return;
        }

        let payload = {};
        if (inputMode === 'realtime') {
            if (logs.some(l => !l.text.trim())) {
                Swal.fire('Warning', 'Isi semua catatan log atau hapus yang kosong.', 'warning');
                return;
            }
            payload = { mode: 'realtime', notes: logs };
        } else {
            if (!manualNote.trim()) {
                Swal.fire('Warning', 'Isi catatan narasi terlebih dahulu.', 'warning');
                return;
            }
            if (!duration || duration <= 0) {
                Swal.fire('Warning', 'Durasi harus diisi valid.', 'warning');
                return;
            }
            payload = { mode: 'manual', notes: manualNote, duration: duration };
        }

        setIsAnalyzing(true);
        try {
            const response = await axios.post(route('supervisions.ai.analyze'), payload);
            const results = response.data;

            const newScores = {};
            const newReasoning = {};
            const newCheckedItems = {};

            Object.entries(results).forEach(([qId, res]) => {
                newScores[qId] = res.score;
                newReasoning[qId] = res.reasoning;

                // AUTO-CHECK LOGIC FOR CHECKBOXES
                const question = questions.find(q => q.id === parseInt(qId) || q.id === qId);
                if (question) {
                    const scoreInt = parseInt(res.score);
                    const rubricsForScore = question.rubrics.filter(r => parseInt(r.score) === scoreInt);
                    newCheckedItems[qId] = rubricsForScore.map(r => r.description);
                }
            });

            setData(prev => ({
                ...prev,
                scores: newScores,
                ai_reasoning: newReasoning,
                checked_items: newCheckedItems
            }));

            let combinedLogs = '';
            if (inputMode === 'realtime') {
                combinedLogs = logs.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
            } else {
                combinedLogs = `[Mode Manual - Durasi: ${duration} Menit]\n${manualNote}`;
            }

            setData('supervisor_note', combinedLogs);

            setStep(2);
            Swal.fire({
                title: 'Analisa Selesai',
                text: 'AI telah mengisi checklist dan skor. Silakan verifikasi dan sesuaikan jika perlu.',
                icon: 'success',
                timer: 3000
            });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Gagal melakukan analisa AI. Coba lagi.', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Calculation Logic for UI
    const maxPossibleScore = questions.length * 3;
    const currentTotalScore = Object.values(data.scores).reduce((a, b) => a + (parseInt(b) || 0), 0);
    const scorePercentage = maxPossibleScore > 0 ? (currentTotalScore / maxPossibleScore) * 100 : 0;

    let currentStatus = 'Perlu Bimbingan';
    let statusColor = 'text-rose-600';
    if (scorePercentage >= 90) {
        currentStatus = 'Profesional (Sangat Baik)';
        statusColor = 'text-emerald-600';
    } else if (scorePercentage >= 75) {
        currentStatus = 'Memadai (Baik)';
        statusColor = 'text-blue-600';
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('supervisions.store'), {
            onSuccess: () => {
                Swal.fire('Berhasil', 'Data supervisi berhasil disimpan.', 'success');
            },
            onError: (errors) => {
                console.error(errors);
                Swal.fire('Error', 'Gagal menyimpan. Cek kembali inputan.', 'error');
            }
        });
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto pb-32 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Cpu className="h-8 w-8 text-indigo-600" />
                            Supervisi AI Assistant
                        </h2>
                        <p className="text-muted-foreground">Catat observasi, biarkan AI membantu menilai.</p>
                    </div>
                    <div className="flex gap-2">
                        {step === 1 && (
                            <div className="flex bg-slate-100 p-1 rounded-lg border">
                                <button onClick={() => setInputMode('realtime')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${inputMode === 'realtime' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Realtime Log</button>
                                <button onClick={() => setInputMode('manual')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${inputMode === 'manual' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Input Manual</button>
                            </div>
                        )}
                        {step === 2 && (
                            <Button variant="outline" onClick={() => setStep(1)} size="sm">Kembali ke Input</Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                        {isChecking && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-md">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                <span className="text-xs text-indigo-700 font-medium">Cek Jadwal...</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Guru</Label>
                            <Select options={teacherOptions} onChange={opt => setData('teacher_id', opt.value)} isDisabled={step === 2} placeholder="Pilih Guru..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={data.date} onChange={e => setData('date', e.target.value)} disabled={step === 2} /></div>
                            <div className="space-y-2"><Label>Jam Ke-</Label><Input type="text" value={data.lesson_hours} onChange={e => setData('lesson_hours', e.target.value)} disabled={step === 2} placeholder="Contoh: 1-2" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Materi / Topik Pembelajaran</Label>
                            <Input placeholder="Contoh: Operasi Hitung" value={data.topic} onChange={e => setData('topic', e.target.value)} disabled={step === 2} />
                        </div>
                    </CardContent>
                </Card>

                {step === 1 && (
                    <>
                        {inputMode === 'realtime' ? (
                            <Card className="border-indigo-100 shadow-md">
                                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100"><CardTitle>Log Observasi Kelas ({logs.length})</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
                                        {logs.map((log, idx) => (
                                            <div key={log.id} className="flex gap-2">
                                                <div className="w-20 shrink-0"><Input value={log.timestamp} onChange={(e) => updateLog(log.id, 'timestamp', e.target.value)} className="text-xs text-center" /></div>
                                                <div className="grow relative group">
                                                    <Textarea value={log.text} onChange={(e) => updateLog(log.id, 'text', e.target.value)} placeholder="Catat kejadian..." className="min-h-[60px] resize-none" autoFocus={idx === logs.length - 1} />
                                                    <Button variant="ghost" size="icon" onClick={() => removeLog(log.id)} className="absolute top-1 right-1 h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                    <div className="p-4 border-t bg-white flex justify-between items-center">
                                        <Button variant="outline" onClick={addLog}><Plus className="h-4 w-4" /> Tambah</Button>
                                        <Button onClick={handleAnalyze} className="bg-indigo-600 gap-2" disabled={isAnalyzing}>
                                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
                                            {isAnalyzing ? 'Menganalisa...' : 'Analisa dengan AI'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-indigo-100 shadow-md">
                                <CardHeader className="bg-indigo-50/50 border-b border-indigo-100"><CardTitle>Input Manual</CardTitle></CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2"><Label>Durasi (Menit)</Label><Input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="max-w-[150px]" min="10" /></div>
                                    <div className="space-y-2"><Label>Narasi</Label><Textarea value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="Ceritakan jalannya kelas..." className="min-h-[300px]" /></div>
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleAnalyze} className="bg-indigo-600 gap-2" disabled={isAnalyzing}>
                                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
                                            {isAnalyzing ? 'Menganalisa...' : 'Analisa dengan AI'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-20">
                            <div><span className="text-xs uppercase font-bold text-muted-foreground">Skor AI</span><div className="text-2xl font-bold">{currentTotalScore} <span className="text-base text-slate-400">/ {maxPossibleScore}</span></div></div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div><span className="text-xs uppercase font-bold text-muted-foreground">Prediksi</span><div className={`text-xl font-bold ${statusColor}`}>{currentStatus}</div></div>
                            <div className="ml-auto"><Button onClick={handleSubmit} disabled={processing} className="gap-2"><Save className="h-4 w-4" /> Simpan Hasil</Button></div>
                        </div>

                        {questions.map((q) => {
                            const currentScore = data.scores[q.id];
                            const aiReason = data.ai_reasoning[q.id];
                            const checkedList = data.checked_items[q.id] || [];
                            const rubricsByScore = { 3: [], 2: [], 1: [] };
                            q.rubrics.forEach(r => { if (rubricsByScore[r.score]) rubricsByScore[r.score].push(r); });

                            return (
                                <Card key={q.id} className={`border-l-4 ${currentScore ? 'border-l-indigo-500' : 'border-l-slate-200'}`}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-lg text-slate-800 flex gap-2">
                                                <span className="bg-slate-100 px-2 rounded text-sm content-center h-fit">{q.number}</span>
                                                {q.aspect}
                                            </h4>
                                        </div>
                                        {aiReason && (
                                            <div className="mb-4 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-3">
                                                <Cpu className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-700 block mb-1">AI Reasoning</span>
                                                    <p className="text-sm text-indigo-900 leading-relaxed italic">"{aiReason}"</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {[3, 2, 1].map(scoreLevel => (
                                                <div key={scoreLevel} className={`rounded-lg border p-4 transition-all ${currentScore === scoreLevel ? (scoreLevel === 3 ? 'bg-emerald-50 border-emerald-500' : scoreLevel === 2 ? 'bg-blue-50 border-blue-500' : 'bg-rose-50 border-rose-500') : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentScore === scoreLevel ? 'bg-white shadow' : 'bg-slate-100'}`}>{scoreLevel}</div>
                                                        <span className="font-bold text-sm">{scoreLevel === 3 ? 'Profesional' : scoreLevel === 2 ? 'Memadai' : 'Perlu Bimbingan'}</span>
                                                    </div>
                                                    <div className="space-y-1 pl-8">
                                                        {rubricsByScore[scoreLevel]?.map(r => (
                                                            <label key={r.id} className="flex items-start gap-2 text-sm cursor-pointer hover:bg-black/5 p-1 rounded">
                                                                <input type="checkbox" checked={checkedList.includes(r.description)} onChange={() => handleCheck(q.id, r.description)} className={`mt-0.5 rounded border-2 h-4 w-4 ${scoreLevel === 3 ? 'text-emerald-600' : scoreLevel === 2 ? 'text-blue-600' : 'text-rose-600'}`} />
                                                                <span className={checkedList.includes(r.description) ? 'font-bold' : ''}>{r.description}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4"><Input value={data.notes[q.id] || ''} onChange={e => setData(prev => ({ ...prev, notes: { ...prev.notes, [q.id]: e.target.value } }))} placeholder="Catatan manual..." className="text-sm" /></div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        <div className="flex justify-end pt-6"><Button onClick={handleSubmit} disabled={processing} size="lg" className="w-full md:w-auto gap-2"><Save className="h-5 w-5" /> Simpan Hasil Supervisi</Button></div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
