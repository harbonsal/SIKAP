import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Info, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function UhInput({ activeSubject, semester, uhType, quizCount, quizScores, participationScores, previousParams }) {
    const { post: postAdd } = useForm();
    const { delete: deleteQuiz } = useForm();

    const [localQuiz, setLocalQuiz] = useState(quizScores || {});
    const [localPart, setLocalPart] = useState(participationScores || {});
    const [isSaving, setIsSaving] = useState(false);

    const members = activeSubject?.active_class?.class_members || [];

    const handleQuizChange = (studentId, num, value) => {
        setLocalQuiz(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [num]: value
            }
        }));
    };

    const handlePartChange = (studentId, value) => {
        setLocalPart(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handlePasteQuiz = (e, startIndex, num) => {
        const pasteData = e.clipboardData.getData('text');
        if (!pasteData) return;
        
        const values = pasteData.split(/\r\n|\n|\r/).map(v => v.trim()).filter(v => v !== '');
        if (values.length === 0) return;
        
        // Only intercept if we have multiple values (like a column paste)
        if (values.length > 1) {
            e.preventDefault();
            
            setLocalQuiz(prev => {
                const next = { ...prev };
                let pasteIndex = 0;
                
                for (let i = startIndex; i < members.length; i++) {
                    if (pasteIndex >= values.length) break;
                    
                    const studentId = members[i].student.id;
                    let val = values[pasteIndex].replace(',', '.'); // Handle comma decimal
                    
                    if (!isNaN(parseFloat(val))) {
                        // Ensure it's between 0 and 100
                        val = Math.min(100, Math.max(0, parseFloat(val)));
                        next[studentId] = {
                            ...(next[studentId] || {}),
                            [num]: val.toString()
                        };
                    }
                    pasteIndex++;
                }
                return next;
            });
        }
    };

    const handlePastePart = (e, startIndex) => {
        const pasteData = e.clipboardData.getData('text');
        if (!pasteData) return;
        
        const values = pasteData.split(/\r\n|\n|\r/).map(v => v.trim()).filter(v => v !== '');
        if (values.length === 0) return;
        
        if (values.length > 1) {
            e.preventDefault();
            
            setLocalPart(prev => {
                const next = { ...prev };
                let pasteIndex = 0;
                
                for (let i = startIndex; i < members.length; i++) {
                    if (pasteIndex >= values.length) break;
                    
                    const studentId = members[i].student.id;
                    let val = values[pasteIndex].replace(',', '.');
                    
                    if (!isNaN(parseFloat(val))) {
                        val = Math.min(100, Math.max(0, parseFloat(val)));
                        next[studentId] = val.toString();
                    }
                    pasteIndex++;
                }
                return next;
            });
        }
    };

    const getRawAvgQuiz = (studentId) => {
        const studentQuizzes = localQuiz[studentId] || {};
        let total = 0;
        let count = 0;
        for (let i = 1; i <= quizCount; i++) {
            if (studentQuizzes[i] !== undefined && studentQuizzes[i] !== '') {
                total += parseFloat(studentQuizzes[i] || 0);
                count++;
            }
        }
        return count > 0 ? (total / count) : null;
    };

    const calcAvgQuiz = (studentId) => {
        const raw = getRawAvgQuiz(studentId);
        return raw !== null ? raw.toFixed(1) : '-';
    };

    const calcFinal = (studentId) => {
        const rawAvg = getRawAvgQuiz(studentId);
        const partStr = localPart[studentId];
        const hasPart = partStr !== undefined && partStr !== '';
        
        if (rawAvg === null || !hasPart) return '-';

        const part = parseFloat(partStr);
        return ((rawAvg * 0.5) + (part * 0.5)).toFixed(1);
    };

    const saveAll = async () => {
        setIsSaving(true);
        const qPayload = [];
        const pPayload = [];

        members.forEach(m => {
            for (let i = 1; i <= quizCount; i++) {
                qPayload.push({
                    student_id: m.student.id,
                    quiz_number: i,
                    score: localQuiz[m.student.id]?.[i] ?? ''
                });
            }
            pPayload.push({
                student_id: m.student.id,
                score: localPart[m.student.id] ?? ''
            });
        });

        try {
            await axios.post(route('uh.quiz.store', [activeSubject.id, uhType.toLowerCase()]), { grades: qPayload });
            await axios.post(route('uh.participation.store', [activeSubject.id, uhType.toLowerCase()]), { grades: pPayload });
            
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menyimpan data.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <MainLayout>
            <Head title={`Input ${uhType} - ${activeSubject.mapel.name}`} />

            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild className="h-9 w-9">
                            <Link href={route('assessments.show', [activeSubject.id])}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                Input Sub-Komponen {uhType}
                                <span className="text-muted-foreground font-normal text-lg hidden sm:inline">|</span>
                                <span className="text-primary text-xl hidden sm:inline">{activeSubject.mapel.name}</span>
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {activeSubject.active_class.kelas.name} {activeSubject.active_class.kelas_paralel?.name} • Semester {semester?.name}
                            </p>
                        </div>
                    </div>
                    <Button onClick={saveAll} disabled={isSaving} className="min-w-[150px] shadow-sm">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800 flex items-start gap-3">
                    <Info className="h-5 w-5 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900">Formula Nilai {uhType}</h4>
                        <p className="text-sm mt-1">
                            Nilai {uhType} diambil dari <strong>50% Rata-rata Penilaian Pemahaman</strong> + <strong>50% Nilai Partisipasi</strong>.<br/>
                            Anda bisa menambah kolom penilaian sesuai jumlah pertemuan. Nilai final akan otomatis disinkronkan ke halaman Input Nilai utama.<br/>
                            <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded inline-block mt-1">💡 Tips: Anda bisa <strong>Copy-Paste</strong> data langsung dari Microsoft Excel. Klik di kolom pertama, lalu Paste (Ctrl+V).</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* PENILAIAN PEMAHAMAN */}
                    <Card className="shadow-md border-none">
                        <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Bagian 1: Pemahaman (50%)</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => postAdd(route('uh.quiz.add', [activeSubject.id, uhType.toLowerCase()]), { preserveScroll: true })}>
                                    <Plus className="h-4 w-4 mr-1"/> Tambah Penilaian
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-r sticky left-0 bg-gray-50">Siswa</th>
                                        {Array.from({ length: quizCount }).map((_, i) => (
                                            <th key={i} className="px-2 py-3 border-b border-r text-center min-w-[80px]">
                                                <div className="flex items-center justify-center gap-1">
                                                    Penilaian {i + 1}
                                                    {i > 0 && i === quizCount - 1 && (
                                                        <Trash2 className="h-3 w-3 text-red-500 cursor-pointer hover:text-red-700" onClick={() => deleteQuiz(route('uh.quiz.remove', [activeSubject.id, uhType.toLowerCase(), i + 1]), { preserveScroll: true })}/>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-2 py-3 border-b text-center bg-blue-50/50">Rata-rata</th>
                                    </tr>
                                </thead>
                                        <tbody>
                                    {members.map((m, mIndex) => (
                                        <tr key={m.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2 border-r sticky left-0 bg-white truncate max-w-[250px]" title={m.student.name}>
                                                <span className="text-gray-400 text-xs w-4 inline-block">{mIndex + 1}.</span>
                                                <span className="text-gray-500 text-xs ml-1 mr-2">{m.student.nis}</span>
                                                <span className="font-medium">{m.student.name}</span>
                                            </td>
                                            {Array.from({ length: quizCount }).map((_, i) => (
                                                <td key={i} className="p-1 border-r">
                                                    <Input type="number" min="0" max="100" step="0.01"
                                                        className="h-8 w-full text-center font-bold px-1"
                                                        value={localQuiz[m.student.id]?.[i+1] ?? ''}
                                                        onChange={e => handleQuizChange(m.student.id, i+1, e.target.value)}
                                                        onPaste={e => handlePasteQuiz(e, mIndex, i+1)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-2 py-2 text-center font-bold bg-blue-50/50 text-blue-700">
                                                {calcAvgQuiz(m.student.id)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* PARTISIPASI & FINAL */}
                    <Card className="shadow-md border-none">
                        <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Bagian 2: Partisipasi & Final</h3>
                        </div>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-r sticky left-0 bg-gray-50">Siswa</th>
                                        <th className="px-4 py-3 border-b border-r text-center w-[120px]">Partisipasi<br/>(50%)</th>
                                        <th className="px-4 py-3 border-b text-center bg-blue-50 text-blue-800 w-[120px]">NILAI {uhType} FINAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m, mIndex) => (
                                        <tr key={m.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2 border-r sticky left-0 bg-white truncate max-w-[250px]">
                                                <span className="text-gray-400 text-xs w-4 inline-block">{mIndex + 1}.</span>
                                                <span className="text-gray-500 text-xs ml-1 mr-2">{m.student.nis}</span>
                                                <span className="font-medium">{m.student.name}</span>
                                            </td>
                                            <td className="p-1 border-r">
                                                <Input type="number" min="0" max="100" step="0.01"
                                                    className="h-8 w-full text-center font-bold px-1"
                                                    value={localPart[m.student.id] ?? ''}
                                                    onChange={e => handlePartChange(m.student.id, e.target.value)}
                                                    onPaste={e => handlePastePart(e, mIndex)}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center font-extrabold bg-blue-50 text-blue-700 text-lg">
                                                {calcFinal(m.student.id)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
