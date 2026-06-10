import React, { useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ArrowLeft, Save, ListChecks, CheckCircle2 } from 'lucide-react';

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

export default function Show({ supervision, questions }) {
    // Initialize form with empty values or pre-fill?
    // Since it's a fresh submission, initialize empty.
    const initialValues = {};
    questions.forEach(q => {
        initialValues[q.id] = '';
    });

    const { data, setData, post, processing, errors } = useForm({
        answers: initialValues
    });

    // Group scale_1_3 questions by aspect
    const scaleQuestions = useMemo(() => {
        const filtered = questions.filter(q => q.type === 'scale_1_3');
        const groups = {};
        filtered.forEach(q => {
            const aspect = q.aspect || 'other';
            if (!groups[aspect]) {
                groups[aspect] = [];
            }
            groups[aspect].push(q);
        });
        return groups;
    }, [questions]);

    const ratingQuestions = questions.filter(q => q.type === 'rating');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Filter out empty answers
        const filledAnswers = Object.entries(data.answers).filter(([k, v]) => v !== '');

        // Validation: At least answer ONE question from ANY type
        if (filledAnswers.length === 0) {
            alert("Mohon isi setidaknya salah satu bagian angket (Rubrik atau Ya/Tidak).");
            return;
        }

        // Optional: Warn if a tab is partially filled? Or just submit what is there.
        // Current requirement: "choose one or both". implies if I choose Rubric, I fill Rubric. If I choose Scale, I fill Scale.
        // Let's check based on types.
        const rubricIds = questions.filter(q => q.type === 'rating').map(q => q.id);
        const scaleIds = questions.filter(q => q.type === 'scale_1_3').map(q => q.id);

        const hasRubricAnswer = rubricIds.some(id => data.answers[id]);
        const hasScaleAnswer = scaleIds.some(id => data.answers[id]);

        // Specific Validation: If started a section, should probably finish it?
        // Or pure optional question by question? User said "Select one or both".
        // Let's enforce: If you answer ANY rubric question, you must answer ALL rubric questions.
        // If you answer ANY scale question, you must answer ALL scale questions.
        // AND you must answer at least one section.

        if (hasRubricAnswer) {
            const allRubricFilled = rubricIds.every(id => data.answers[id]);
            if (!allRubricFilled) {
                alert("Anda telah mulai mengisi bagian Rubrik. Mohon lengkapi semua pertanyaan di bagian tersebut.");
                return;
            }
        }

        if (hasScaleAnswer) {
            const allScaleFilled = scaleIds.every(id => data.answers[id]);
            if (!allScaleFilled) {
                alert("Anda telah mulai mengisi bagian Skala 1-3. Mohon lengkapi semua pertanyaan di bagian tersebut.");
                return;
            }
        }

        if (!hasRubricAnswer && !hasScaleAnswer) {
            alert("Mohon isi salah satu bagian angket.");
            return;
        }

        post(route('student.supervisions.store', supervision.id));
    };

    return (
        <MainLayout>
            <Head title={`Isi Angket - ${supervision.active_subject?.mapel?.name}`} />

            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <Link href={route('student.supervisions.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Isi Angket Evaluasi</h2>
                        <p className="text-muted-foreground text-sm">
                            {supervision.active_subject?.mapel?.name} - {supervision.teacher?.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="scale_1_3" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
                            <TabsTrigger value="scale_1_3" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Skala 1-3
                            </TabsTrigger>
                            <TabsTrigger value="rubric" className="gap-2">
                                <ListChecks className="h-4 w-4" />
                                Rubrik (Skala 1-4)
                            </TabsTrigger>
                        </TabsList>

                        {/* SCALE 1-3 QUESTIONS TAB */}
                        <TabsContent value="scale_1_3">
                            <Card>
                                <CardHeader className="bg-muted/30 pb-4">
                                    <CardTitle className="text-base font-medium flex justify-between items-center">
                                        <span>Pertanyaan Evaluasi (Skala 1-3)</span>
                                        <span className="text-sm font-normal text-muted-foreground">{questions.filter(q => q.type === 'scale_1_3').length} Pertanyaan</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    {/* Scale Legend */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm font-semibold text-blue-900 mb-2">Keterangan Skala:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-blue-700">1:</span>
                                                <span className="text-blue-800">{SCALE_1_3_LABELS[1]}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-blue-700">2:</span>
                                                <span className="text-blue-800">{SCALE_1_3_LABELS[2]}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-bold text-blue-700">3:</span>
                                                <span className="text-blue-800">{SCALE_1_3_LABELS[3]}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {Object.keys(scaleQuestions).length > 0 ? (
                                                Object.keys(scaleQuestions).sort().map((aspect) => (
                                                    <div key={aspect} className="mb-6">
                                                        <div className="bg-indigo-50 border-l-4 border-indigo-500 px-4 py-2 rounded-r-lg mb-4">
                                                            <h4 className="font-semibold text-indigo-900">{ASPECT_LABELS[aspect] || `Aspek ${aspect}`}</h4>
                                                        </div>
                                                        <div className="divide-y">
                                                            {scaleQuestions[aspect].map((question, index) => (
                                                                <div key={question.id} className="py-6 first:pt-4 last:pb-2">
                                                                    <div className="space-y-4">
                                                                        <div className="flex gap-4">
                                                                            <span className="flex-none font-semibold text-slate-500 w-6 text-right">
                                                                                {index + 1}.
                                                                            </span>
                                                                            <p className="flex-1 font-medium text-slate-900 leading-normal">
                                                                                {question.question}
                                                                            </p>
                                                                        </div>

                                                                        <div className="pl-14">
                                                                            <RadioGroup
                                                                                value={data.answers[question.id]}
                                                                                onValueChange={(val) => setData('answers', { ...data.answers, [question.id]: val })}
                                                                                className="flex gap-2 sm:gap-6"
                                                                            >
                                                                                {[1, 2, 3].map((score) => (
                                                                                    <div key={score} className="flex flex-col items-center gap-2 flex-1">
                                                                                        <div className="flex flex-col items-center space-y-2 w-full">
                                                                                            <RadioGroupItem value={score.toString()} id={`q${question.id}-${score}`} className="h-6 w-6" />
                                                                                            <Label htmlFor={`q${question.id}-${score}`} className="font-normal cursor-pointer flex flex-col items-center text-center w-full">
                                                                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg mb-2 ${Number(data.answers[question.id]) === score
                                                                                                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                                                                                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                                                                    }`}>
                                                                                                    {score}
                                                                                                </div>
                                                                                                <span className="text-xs text-slate-600 leading-snug px-1">
                                                                                                    {SCALE_1_3_LABELS[score]}
                                                                                                </span>
                                                                                            </Label>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </RadioGroup>
                                                                            {errors[`answers.${question.id}`] && (
                                                                                <p className="text-sm text-red-500 mt-2">Mohon pilih jawaban.</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                    ) : (
                                        <div className="py-8 text-center text-muted-foreground italic">
                                            Tidak ada pertanyaan skala 1-3.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* RUBRIC QUESTIONS TAB */}
                        <TabsContent value="rubric">
                            <Card>
                                <CardHeader className="bg-muted/30 pb-4">
                                    <CardTitle className="text-base font-medium flex justify-between items-center">
                                        <span>Pertanyaan Evaluasi (Skala 1-4)</span>
                                        <span className="text-sm font-normal text-muted-foreground">{ratingQuestions.length} Pertanyaan</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y pt-2">
                                    {ratingQuestions.map((question, index) => (
                                        <div key={question.id} className="py-6 first:pt-4 last:pb-2">
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <span className="flex-none font-semibold text-slate-500 w-6 text-right">
                                                        {index + 1}.
                                                    </span>
                                                    <p className="flex-1 font-medium text-slate-900 leading-normal">
                                                        {question.question}
                                                    </p>
                                                </div>

                                                <div className="pl-14">
                                                    <RadioGroup
                                                        value={data.answers[question.id]}
                                                        onValueChange={(val) => setData('answers', { ...data.answers, [question.id]: val })}
                                                        className="flex gap-2 sm:gap-6"
                                                    >
                                                        {[1, 2, 3, 4].map((score) => (
                                                            <div key={score} className="flex flex-col items-center gap-2 flex-1">
                                                                <div className="flex flex-col items-center space-y-2 w-full">
                                                                    <RadioGroupItem value={score.toString()} id={`q${question.id}-${score}`} className="h-6 w-6" />
                                                                    <Label htmlFor={`q${question.id}-${score}`} className="font-normal cursor-pointer flex flex-col items-center text-center w-full">
                                                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg mb-2 ${Number(data.answers[question.id]) === score
                                                                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                                                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                                            }`}>
                                                                            {score}
                                                                        </div>
                                                                        {question.options && question.options[score] ? (
                                                                            <span className="text-xs text-slate-600 leading-snug px-1">
                                                                                {question.options[score]}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                                {score === 1 && 'Sgt Kurang'}
                                                                                {score === 2 && 'Kurang'}
                                                                                {score === 3 && 'Baik'}
                                                                                {score === 4 && 'Sgt Baik'}
                                                                            </span>
                                                                        )}
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                    {errors[`answers.${question.id}`] && (
                                                        <p className="text-sm text-red-500 mt-2">Mohon pilih jawaban.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {ratingQuestions.length === 0 && (
                                        <div className="py-8 text-center text-muted-foreground italic">
                                            Tidak ada pertanyaan rubrik.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 text-center sm:text-left">
                            <strong>Perhatian:</strong> Pastikan Anda telah mengisi semua pertanyaan di <strong>kedua Tab</strong> (Skala 1-3 & Rubrik) sebelum mengirim.
                        </p>
                        <Button type="submit" size="lg" disabled={processing} className="gap-2 w-full sm:w-auto">
                            <Save className="h-4 w-4" />
                            Kirim Jawaban
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
