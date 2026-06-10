import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { ArrowLeft, Printer, Award, Lightbulb, User as UserIcon, Calendar, ImageIcon, Eye, EyeOff, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ASPECT_LABELS = {
    A: 'A. PERSIAPAN & PENGUASAAN MATERI',
    B: 'B. PEMBUKAAN PEMBELAJARAN',
    C: 'C. METODE & INTERAKSI PEMBELAJARAN',
    D: 'D. MANAJEMEN KELAS & WAKTU',
    E: 'E. PENUTUPAN PEMBELAJARAN',
    F: 'F. PROFESIONALISME GURU',
    G: 'G. PERTANYAAN KUNCI (HIGH-SIGNAL)',
};

export default function Show({ supervision, details }) {
    const { auth } = usePage().props;
    const userRole = auth.user?.user_level?.name;

    // Permission Logic
    const isManagementRole = ['Administrator', 'Manager', 'Manager Tahfidz'].includes(userRole);

    // Determine color based on status string from DB
    const getStatusColor = (status) => {
        switch (status) {
            case 'Sangat Baik': return 'text-green-600 bg-green-50 border-green-200';
            case 'Baik': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Cukup': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-red-600 bg-red-50 border-red-200';
        }
    };

    // Group details by category
    const groupedDetails = details.reduce((acc, d) => {
        if (!acc[d.category]) acc[d.category] = [];
        acc[d.category].push(d);
        return acc;
    }, {});

    // Collect recommendations
    const lowScoreItems = details.filter(d => d.score < 3);

    // Form for publishing & toggling
    const { patch: patchPublish, processing: processingPublish } = useForm();
    const { put: putToggle, processing: processingToggle } = useForm();

    const handlePublish = () => {
        if (confirm('Apakah Anda yakin ingin menampilkan hasil ini ke guru? Guru akan dapat melihat nilai dan catatan supervisi ini.')) {
            patchPublish(route('supervisions.publish', supervision.id));
        }
    };

    const handleToggleQuestionnaire = () => {
        putToggle(route('supervisions.toggle-questionnaire', supervision.id));
    };

    // Calculate Student Questionnaire Stats
    const studentResponses = supervision.student_questionnaire_responses || [];
    const totalRespondents = new Set(studentResponses.map(r => r.student_id)).size;

    // Group responses by question
    const questionStats = [];
    if (studentResponses.length > 0) {
        const questionMap = new Map();
        studentResponses.forEach(r => {
            if (!questionMap.has(r.question_id)) {
                questionMap.set(r.question_id, {
                    id: r.question_id,
                    question: r.question?.question,
                    order: r.question?.order,
                    type: r.question?.type, // Added type tracking
                    aspect: r.question?.aspect, // Aspect tracking
                    ya: 0,
                    tidak: 0,
                    total: 0,
                    sumScore: 0,
                    average: 0
                });
            }
            const stat = questionMap.get(r.question_id);
            stat.total++;

            if (stat.type === 'boolean') {
                if (r.answer === 'Ya') stat.ya++;
                else stat.tidak++;
            } else if (stat.type === 'rating' || stat.type === 'scale_1_3') {
                stat.sumScore += parseInt(r.answer) || 0;
                stat.average = (stat.sumScore / stat.total).toFixed(1);
            }
        });

        questionMap.forEach(v => questionStats.push(v));
        questionStats.sort((a, b) => a.order - b.order);
    }

    // Group scale_1_3 stats by aspect
    const statsByAspect = questionStats.reduce((acc, stat) => {
        if (stat.type === 'scale_1_3' && stat.aspect) {
            if (!acc[stat.aspect]) {
                acc[stat.aspect] = { 
                    questions: [], 
                    name: ASPECT_LABELS[stat.aspect] || `Aspek ${stat.aspect}`,
                    totalAvg: 0
                };
            }
            acc[stat.aspect].questions.push(stat);
        }
        return acc;
    }, {});

    // Calculate aspect averages
    Object.keys(statsByAspect).forEach(aspect => {
        const group = statsByAspect[aspect];
        const sumAvg = group.questions.reduce((sum, q) => sum + parseFloat(q.average || 0), 0);
        group.totalAvg = group.questions.length > 0 ? (sumAvg / group.questions.length).toFixed(1) : 0;
    });

    // Helper to format numbered text into a list
    const renderFormattedNotes = (text) => {
        if (!text) return null;

        // Split by pattern like "1. ", "2. ", etc. (using lookahead to keep the number in the next segment)
        // We search for a space followed by a number and a dot, OR start of string followed by number and dot
        const segments = text.split(/(?=\d+\.\s)/g);

        if (segments.length <= 1) return text;

        return (
            <div className="space-y-1.5">
                {segments.map((segment, idx) => {
                    const trimmed = segment.trim();
                    if (!trimmed) return null;
                    return (
                        <div key={idx} className="flex gap-1">
                            <span className="leading-relaxed">{trimmed}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title={`Detail Supervisi - ${supervision.teacher.name}`} />

            <style>
                {`
                    @media print {
                        @page { size: auto; margin: 10mm; }
                        body * { visibility: hidden; }
                        #printable-area, #printable-area * { visibility: visible; }
                        #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                        .no-print { display: none !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                `}
            </style>

            <div id="printable-area" className="space-y-6 pb-20 max-w-5xl mx-auto">
                {/* Header Navigation */}
                <div className="flex items-center justify-between no-print">
                    <Link href={route('supervisions.index')}>
                        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" /> Cetak Laporan
                        </Button>

                        {isManagementRole && (
                            <Link href={route('supervisions.edit', supervision.id)}>
                                <Button variant="default" className="gap-2">
                                    <Edit2 className="h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* status & Control Panel (Admin/Supervisor Only) */}
                {isManagementRole && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                        {/* 1. Visibility / Publish Status */}
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Laporan</span>
                                <div className="flex items-center gap-2">
                                    {supervision.is_published ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1 pl-1 pr-2 py-0.5 text-xs">
                                            <Eye className="w-3 h-3" /> Terpublikasi
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 gap-1 pl-1 pr-2 py-0.5 text-xs hover:bg-slate-200">
                                            <EyeOff className="w-3 h-3" /> Draft
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {!supervision.is_published && (
                                <Button
                                    onClick={handlePublish}
                                    disabled={processingPublish}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                                >
                                    Publish
                                </Button>
                            )}
                        </div>

                        {/* 2. Questionnaire Control */}
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Angket Santri</span>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`${supervision.is_student_questionnaire_open ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'} gap-1 pl-1 pr-2 py-0.5 text-xs`}
                                    >
                                        {supervision.is_student_questionnaire_open ? 'Menerima Respon' : 'Ditutup'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">({totalRespondents} Respon)</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleToggleQuestionnaire}
                                disabled={processingToggle}
                                size="sm"
                                variant={supervision.is_student_questionnaire_open ? "outline" : "default"}
                                className={supervision.is_student_questionnaire_open ? "border-red-200 text-red-600 hover:bg-red-50 h-8" : "bg-emerald-600 hover:bg-emerald-700 h-8"}
                            >
                                {supervision.is_student_questionnaire_open ? "Tutup Angket" : "Buka Angket"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Score Card Banner & Metadata Combined */}
                <div className={`rounded-xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${getStatusColor(supervision.status)}`}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-4 bg-white/80 rounded-full shadow-sm backdrop-blur-sm shrink-0">
                            <Award className="h-8 w-8" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 w-full">
                            <div className="col-span-1 md:col-span-2">
                                <h2 className="text-2xl font-bold">{supervision.teacher.name}</h2>
                            </div>

                            {/* Column 1: Teaching Details */}
                            <div className="space-y-1 text-sm opacity-90">
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-24">Hari, Tanggal</span>
                                    : {new Date(supervision.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-24">Mata Pelajaran</span>
                                    : {supervision.active_subject?.mapel?.name || '-'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-24">Kelas</span>
                                    : {supervision.active_subject?.active_class?.kelas?.name || '-'}{supervision.active_subject?.active_class?.kelas_paralel ? ` ${supervision.active_subject?.active_class?.kelas_paralel?.name}` : ''}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-24">Materi/Topik</span>
                                    : {supervision.topic || '-'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-24">Jam Ke-</span>
                                    : {supervision.lesson_hours || '-'}
                                </p>
                            </div>

                            {/* Column 2: Metadata (Supervisor, Year, etc) */}
                            <div className="space-y-1 text-sm opacity-90 border-t md:border-t-0 md:border-l border-slate-200/20 pt-2 md:pt-0 md:pl-6">
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-28">Supervisor</span>
                                    : {supervision.supervisor?.name || '-'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-28">Tahun Akademik</span>
                                    : {supervision.academic_year?.name || supervision.academic_year_id}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-28">Semester</span>
                                    : {supervision.semester?.name || supervision.semester_id}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-semibold w-28">Dicetak pada</span>
                                    : {new Date().toLocaleDateString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center md:text-right shrink-0">
                        <div className="text-4xl font-extrabold tracking-tight">{supervision.status || 'Belum Dinilai'}</div>
                        <div className="text-sm font-medium uppercase tracking-wider opacity-80">Total Skor: {supervision.total_score}</div>
                    </div>
                </div>

                {/* Supervisor Notes */}
                <Card className="bg-blue-50/50 border-blue-100 shadow-sm print:shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                            Catatan & Kesimpulan Supervisor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-white rounded-lg border border-blue-100 text-slate-700 text-base leading-relaxed whitespace-pre-line shadow-sm">
                            {renderFormattedNotes(supervision.notes) || (
                                <span className="text-muted-foreground italic">Tidak ada catatan tambahan dari supervisor.</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* FULL WIDTH LAYOUT (No Sidebar) */}
                <div className="space-y-6">
                    {/* Evidence Photo */}
                    {supervision.proof_url && (
                        <Card className="overflow-hidden print:break-inside-avoid">
                            <CardHeader className="py-3 bg-muted/30 flex flex-row items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold text-sm">Bukti Observasi</span>
                            </CardHeader>
                            <CardContent className="p-0">
                                <img
                                    src={supervision.proof_url}
                                    alt="Bukti Supervisi"
                                    className="w-full max-h-96 object-contain bg-slate-100"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {Object.entries(groupedDetails).map(([cat, items]) => (
                        <Card key={cat} className="print:break-inside-avoid">
                            <CardHeader className="py-4 bg-muted/30">
                                <CardTitle className="text-base font-semibold">{cat}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {items.map((item) => {
                                        // Gap Analysis Logic
                                        const level3Rubrics = item.rubrics?.filter(r => parseInt(r.score) === 3) || [];
                                        const level3Descriptions = level3Rubrics.map(r => r.description);
                                        const checkedTexts = item.checked_items || [];

                                        const achievedLevel3 = level3Descriptions.filter(desc => checkedTexts.includes(desc));
                                        const missingLevel3 = level3Descriptions.filter(desc => !checkedTexts.includes(desc));

                                        const isNearMiss = item.score < 3 && achievedLevel3.length > 0;

                                        return (
                                            <div key={item.question_number} className="p-4 transition-colors hover:bg-slate-50/50">
                                                <div className="flex items-start gap-4">
                                                    <div className={`
                                                    h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow-sm
                                                    ${item.score >= 3 ? 'bg-green-100 text-green-700 border-green-200' :
                                                            item.score === 2 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-red-100 text-red-700 border-red-200'}
                                                `}>
                                                        {item.score}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-medium text-slate-900 leading-snug">{item.aspect}</p>
                                                        </div>

                                                        {/* Progress/Score Bar */}
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${item.score >= 3 ? 'bg-green-500' : item.score === 2 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                                style={{ width: `${(item.score / 3) * 100}%` }}
                                                            />
                                                        </div>

                                                        {/* Checked Items List */}
                                                        {item.checked_items && item.checked_items.length > 0 && (
                                                            <div className="mt-3 space-y-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                                {item.checked_items.map((check, idx) => {
                                                                    const matchedRubric = item.rubrics?.find(r => r.description === check);
                                                                    const score = matchedRubric ? parseInt(matchedRubric.score) : 3;

                                                                    let iconColor = "bg-emerald-100 text-emerald-600 border-emerald-200";
                                                                    if (score === 2) iconColor = "bg-blue-100 text-blue-600 border-blue-200";
                                                                    if (score === 1) iconColor = "bg-red-100 text-red-600 border-red-200";

                                                                    return (
                                                                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                                                            <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${iconColor}`}>
                                                                                ✓
                                                                            </div>
                                                                            <span className="text-xs leading-relaxed">{check}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Specific Note */}
                                                        {item.notes && (
                                                            <div className="bg-amber-50 border border-amber-100 rounded-md p-4 text-sm text-amber-900 mt-2 italic whitespace-pre-line relative overflow-hidden">
                                                                <div className="relative z-10">
                                                                    {renderFormattedNotes(item.notes)}
                                                                </div>
                                                                <span className="absolute top-0 left-1 text-4xl text-amber-200/50 font-serif leading-none select-none">"</span>
                                                            </div>
                                                        )}

                                                        {/* Feedback / Gap Analysis */}
                                                        {item.score < 3 && (
                                                            <div className={`mt-3 border rounded-md p-3 ${achievedLevel3.length > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                                                                <div className="flex gap-2 items-start">
                                                                    <Lightbulb className={`h-4 w-4 mt-0.5 shrink-0 ${achievedLevel3.length > 0 ? 'text-indigo-600' : 'text-orange-600'}`} />
                                                                    <div className="space-y-1">
                                                                        <p className={`text-sm font-semibold ${achievedLevel3.length > 0 ? 'text-indigo-900' : 'text-orange-900'}`}>
                                                                            {achievedLevel3.length > 0 ? 'Hampir mencapai Unggul!' : 'Target Perbaikan Menuju Unggul'}
                                                                        </p>
                                                                        <p className={`text-xs leading-relaxed ${achievedLevel3.length > 0 ? 'text-indigo-800' : 'text-orange-800'}`}>
                                                                            {achievedLevel3.length > 0
                                                                                ? <span>Anda telah memenuhi <b>{achievedLevel3.length}</b> kriteria Unggul, namun belum maksimal karena:</span>
                                                                                : <span>Untuk mencapai skor maksimal (Level 3), Anda perlu memenuhi kriteria berikut:</span>
                                                                            }
                                                                        </p>
                                                                        <ul className="list-disc pl-4 space-y-1 mt-1">
                                                                            {missingLevel3.map((miss, mi) => (
                                                                                <li key={mi} className={`text-xs italic ${achievedLevel3.length > 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                                                                                    Belum memenuhi: "{miss}"
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                        <p className={`text-xs mt-1 font-medium ${achievedLevel3.length > 0 ? 'text-indigo-800' : 'text-orange-800'}`}>
                                                                            Tingkatkan poin di atas untuk naik ke Level 3.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Student Questionnaire Section */}
                <div className="space-y-6 print:break-inside-avoid">
                    <Card>
                        <CardHeader className="bg-slate-100 flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <UserIcon className="h-5 w-5" />
                                    Hasil Angket Santri
                                </CardTitle>
                                <CardDescription>
                                    Respon dari {totalRespondents} siswa
                                </CardDescription>
                            </div>

                            {/* Hide Toggle if not management */}
                            {isManagementRole && (
                                <div className="flex items-center gap-2 no-print">
                                    <span className="text-sm text-slate-600">Status Angket:</span>
                                    <Button
                                        onClick={handleToggleQuestionnaire}
                                        disabled={processingToggle}
                                        variant={supervision.is_student_questionnaire_open ? "default" : "outline"}
                                        size="sm"
                                        className={supervision.is_student_questionnaire_open ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {supervision.is_student_questionnaire_open ? "Dibuka - Menerima Respon" : "Ditutup"}
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            {questionStats.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Scale 1-3 Stats (Grouped by Aspect) */}
                                    {Object.keys(statsByAspect).length > 0 && (
                                        <div className="space-y-6 mb-8">
                                            <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-widest border-b pb-2">Hasil Evaluasi (Skala 1-3)</h4>
                                            {Object.keys(statsByAspect).sort().map(aspect => (
                                                <div key={aspect} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                                                    <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex justify-between items-center">
                                                        <h5 className="font-bold text-indigo-900 text-sm">{statsByAspect[aspect].name}</h5>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-indigo-700 font-medium">Rata-rata:</span>
                                                            <span className="bg-indigo-600 text-white font-bold text-xs px-2 py-1 rounded-full">
                                                                {statsByAspect[aspect].totalAvg} / 3.0
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        {statsByAspect[aspect].questions.map((stat) => (
                                                            <div key={stat.id} className="space-y-1.5 border-b last:border-0 pb-3 last:pb-0">
                                                                <div className="flex justify-between items-start text-sm gap-4">
                                                                    <span className="text-slate-800 flex-1 leading-snug">{stat.order}. {stat.question}</span>
                                                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                                                                        Avg: {stat.average > 0 ? stat.average : '-'}
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${stat.average >= 2.5 ? 'bg-green-500' : stat.average >= 2.0 ? 'bg-blue-500' : stat.average >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                        style={{ width: `${(stat.average / 3) * 100}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>1 (Tdk Pernah)</span>
                                                                    <span>3 (Sering)</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rubric Stats */}
                                    {questionStats.filter(s => s.type === 'rating').length > 0 && (
                                        <div className="space-y-4 mb-8">
                                            <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-widest border-b pb-2">Hasil Rubrik (Skala 1-4)</h4>
                                            {questionStats.filter(s => s.type === 'rating').map((stat) => (
                                                <div key={stat.id} className="space-y-1">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-slate-800 flex-1">{stat.order}. {stat.question}</span>
                                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded ml-4 text-xs">
                                                            Avg: {stat.average > 0 ? stat.average : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${stat.average >= 3.5 ? 'bg-green-500' : stat.average >= 2.5 ? 'bg-blue-500' : stat.average >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${(stat.average / 4) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-400">
                                                        <span>1 (Kurang)</span>
                                                        <span>4 (Baik)</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Boolean Stats */}
                                    {questionStats.filter(s => s.type === 'boolean').length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-widest border-b pb-2">Hasil Umum (Ya/Tidak)</h4>
                                            {questionStats.filter(s => s.type === 'boolean').map((stat) => (
                                                <div key={stat.id} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-slate-800">{stat.order}. {stat.question}</span>
                                                    </div>
                                                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                        <div
                                                            className="h-full bg-green-500 flex items-center justify-center text-[10px] text-white font-bold"
                                                            style={{ width: `${(stat.ya / stat.total) * 100}%` }}
                                                        >
                                                            {stat.ya > 0 && `${Math.round((stat.ya / stat.total) * 100)}%`}
                                                        </div>
                                                        <div
                                                            className="h-full bg-red-500 flex items-center justify-center text-[10px] text-white font-bold"
                                                            style={{ width: `${(stat.tidak / stat.total) * 100}%` }}
                                                        >
                                                            {stat.tidak > 0 && `${Math.round((stat.tidak / stat.total) * 100)}%`}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>Ya: {stat.ya}</span>
                                                        <span>Tidak: {stat.tidak}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500 italic">
                                    Belum ada data angket santri.
                                    <br />Pastikan akses angket dibuka (tombol di kanan atas) dan siswa telah mengisi.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
