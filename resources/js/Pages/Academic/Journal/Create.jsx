import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, Calendar, Clock, BookOpen, UserCheck, AlertCircle, HeartPulse, FileText, Lock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// Helper normalisasi teks untuk pencocokan materi Arab dan Latin
const cleanArabicText = (str) => {
    if (!str) return '';
    return str
        .replace(/KD:[^\n]*\n?/gi, '')
        .replace(/Materi:\s*/gi, '')
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Harakat
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/[ىئ]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[()（）\[\]{}\-–—.,:;\u060C\u061B\u061F«»“”"'`~]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};

export default function Create({ 
    academicYear, 
    currentPekan, 
    jamKe, 
    activeSubjects, 
    date, 
    selectedSubjectId,
    attendanceSettings = { teacher_can_set_sick: false, teacher_can_set_permission: false },
    userCanManageSettings = false,
    isTeacherOnly = false
}) {
    const { data, setData, post, processing, errors } = useForm({
        active_subject_id: selectedSubjectId || '',
        date: date,
        jam_ke: jamKe,
        pekan_id: currentPekan?.id || '',
        topic: '',
        last_topic: '',
        last_description: '',
        description: '',
        attendances: [],
    });

    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [silabuses, setSilabuses] = useState([]);
    const [settings] = useState(attendanceSettings);

    const enrichedSilabuses = useMemo(() => {
        if (!silabuses || silabuses.length === 0) return [];

        const hasServerMarking = silabuses.some(s => s.is_last_delivered || s.is_next_material);
        if (hasServerMarking) {
            return silabuses;
        }

        if (!data.last_topic) return silabuses;

        const cleanLast = cleanArabicText(data.last_topic);
        if (!cleanLast) return silabuses;

        let matchedId = null;
        let bestScore = 0;

        silabuses.forEach(s => {
            const cleanM = cleanArabicText(s.materi);
            if (!cleanM) return;

            if (cleanM === cleanLast) {
                matchedId = s.id;
                bestScore = 99999;
                return;
            }

            if (cleanLast.includes(cleanM) || cleanM.includes(cleanLast)) {
                const score = Math.min(cleanM.length, cleanLast.length) * 10;
                if (score > bestScore) {
                    bestScore = score;
                    matchedId = s.id;
                }
            } else {
                const wordsLast = cleanLast.split(' ').filter(w => w.length >= 2);
                const wordsM = cleanM.split(' ').filter(w => w.length >= 2);
                if (wordsLast.length > 0 && wordsM.length > 0) {
                    const overlap = wordsM.filter(w => wordsLast.includes(w)).length;
                    const ratio = overlap / Math.max(1, Math.min(wordsLast.length, wordsM.length));
                    const score = (ratio * 100) + (overlap * 10);
                    if (score > 40 && score > bestScore) {
                        bestScore = score;
                        matchedId = s.id;
                    }
                }
            }
        });

        const lastIdx = silabuses.findIndex(s => s.id === matchedId);
        return silabuses.map((s, idx) => {
            const isLast = idx === lastIdx;
            const isNext = lastIdx !== -1 && idx === lastIdx + 1;
            const isPrev = lastIdx !== -1 && idx <= lastIdx;
            return {
                ...s,
                is_last_delivered: isLast,
                is_next_material: isNext,
                is_previously_taught: isPrev || s.is_previously_taught,
            };
        });
    }, [silabuses, data.last_topic]);

    const nextMaterial = useMemo(() => {
        return enrichedSilabuses.find(s => s.is_next_material);
    }, [enrichedSilabuses]);

    const lastDeliveredMaterial = useMemo(() => {
        return enrichedSilabuses.find(s => s.is_last_delivered);
    }, [enrichedSilabuses]);

    // Fetch students and silabus when Subject or Date is selected
    useEffect(() => {
        if (data.active_subject_id) {
            setIsLoadingStudents(true);
            
            // 1. Fetch Students with date parameter for health & permission sync
            axios.get(route('journals.get-students', data.active_subject_id), { params: { date: data.date } })
                .then(response => {
                    const studentList = response.data
                        .sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, {numeric: true}))
                        .map(student => ({
                        student_id: student.id,
                        name: student.name,
                        nis: student.nis,
                        status: student.suggested_status || 'Hadir',
                        is_uniform_complete: true,
                        note: student.suggested_note || '',
                        is_sick_from_health: student.is_sick_from_health || false,
                        health_info: student.health_info || null,
                        is_permitted_from_care: student.is_permitted_from_care || false,
                        permission_info: student.permission_info || null,
                    }));
                    setStudents(studentList);

                    // Set attendances immediately so students table renders without delay
                    setData(prev => ({
                        ...prev,
                        attendances: studentList,
                    }));
                    
                    // 2. Fetch syllabus
                    axios.get(route('journals.get-silabus', data.active_subject_id))
                        .then(silabusRes => {
                            setSilabuses(silabusRes.data);
                            let newTopic = data.topic;
                            
                            // Auto-fill logic if empty
                            if (!newTopic && currentPekan && currentPekan.name) {
                                const pekanNumber = parseInt(currentPekan.name.replace(/[^0-9]/g, ''), 10);
                                const match = silabusRes.data.find(s => parseInt(s.pekan, 10) === pekanNumber);
                                if (match) {
                                    newTopic = (match.kompetensi ? "KD: " + match.kompetensi + "\n" : "") + "Materi: " + match.materi;
                                }
                            }
                            
                            // 3. Fetch last journal
                            axios.get(route('journals.last-journal', data.active_subject_id))
                                .then(lastJournalRes => {
                                    const lastJournal = lastJournalRes.data;
                                    setData(prev => ({
                                        ...prev,
                                        topic: newTopic || prev.topic,
                                        last_topic: lastJournal ? lastJournal.topic : null,
                                        last_description: lastJournal ? lastJournal.description : null
                                    }));
                                })
                                .catch(() => {
                                    setData(prev => ({
                                        ...prev,
                                        topic: newTopic || prev.topic,
                                        last_topic: null,
                                        last_description: null
                                    }));
                                });
                        })
                        .catch(err => {
                            console.error("Error fetching silabus:", err);
                        });
                })
                .catch(error => console.error("Error fetching students:", error))
                .finally(() => setIsLoadingStudents(false));
                
        } else {
            setStudents([]);
            setSilabuses([]);
            setData(prev => ({ ...prev, attendances: [], topic: '', last_topic: '', last_description: '' }));
        }
    }, [data.active_subject_id, data.date]);

    const handleAttendanceChange = (index, field, value) => {
        const updatedAttendances = [...data.attendances];
        updatedAttendances[index][field] = value;
        setData('attendances', updatedAttendances);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('journals.store'));
    };

    return (
        <MainLayout>
            <Head title="Input Jurnal & Absensi" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Input Jurnal & Absensi</h2>
                    <p className="text-muted-foreground">
                        {academicYear?.name} • Pekan {currentPekan?.name || '-'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* INFO UTAMA */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                </div>
                                {errors.date && <p className="text-destructive text-sm">{errors.date}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jam Ke-</label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1-2"
                                        value={data.jam_ke}
                                        onChange={e => setData('jam_ke', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                </div>
                                {errors.jam_ke && <p className="text-destructive text-sm">{errors.jam_ke}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Mata Pelajaran & Kelas</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={data.active_subject_id}
                                        onChange={e => setData('active_subject_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    >
                                        <option value="">Pilih Kelas & Mapel</option>
                                        {Object.entries(
                                            activeSubjects.reduce((acc, subject) => {
                                                const className = subject.class_name || 'Lainnya';
                                                if (!acc[className]) acc[className] = [];
                                                acc[className].push(subject);
                                                return acc;
                                            }, {})
                                        ).map(([className, subjects]) => (
                                            <optgroup key={className} label={className}>
                                                {subjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                {errors.active_subject_id && <p className="text-destructive text-sm">{errors.active_subject_id}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Materi Pembelajaran (Topik)</label>
                                {data.last_topic && (
                                    <div className="mb-2 p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg text-sm text-blue-900 dark:text-blue-200">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                                                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> 
                                                <span>Materi Terakhir Disampaikan:</span>
                                            </div>
                                            {lastDeliveredMaterial && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const text = (lastDeliveredMaterial.kompetensi ? "KD: " + lastDeliveredMaterial.kompetensi + "\n" : "") + "Materi: " + lastDeliveredMaterial.materi;
                                                        setData('topic', text);
                                                    }}
                                                    className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline inline-flex items-center gap-1 shrink-0"
                                                >
                                                    <span>Ulangi materi ini</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="whitespace-pre-wrap font-medium text-blue-950 dark:text-blue-100 bg-white/70 dark:bg-blue-900/30 p-2.5 rounded border border-blue-200/60 dark:border-blue-800/50">
                                            {data.last_topic}
                                        </div>
                                        
                                        {data.last_description && (
                                            <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-800/60">
                                                <div className="font-semibold flex items-center gap-1 mb-1 text-xs text-blue-700 dark:text-blue-300">
                                                    Catatan Tambahan Terakhir:
                                                </div>
                                                <div className="whitespace-pre-wrap text-xs text-blue-800 dark:text-blue-200">{data.last_description}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {nextMaterial && (
                                    <div className="mb-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                                        <div className="flex items-center gap-2 overflow-hidden text-xs sm:text-sm">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white shrink-0">
                                                👉 Lanjutan Materi Berikutnya
                                            </span>
                                            <span className="font-semibold truncate">
                                                Pekan {nextMaterial.pekan || '-'}: {nextMaterial.materi}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const text = (nextMaterial.kompetensi ? "KD: " + nextMaterial.kompetensi + "\n" : "") + "Materi: " + nextMaterial.materi;
                                                setData('topic', text);
                                            }}
                                            className="shrink-0 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium rounded-md text-xs shadow-xs transition"
                                        >
                                            <span>Gunakan Materi Ini</span>
                                            <span>→</span>
                                        </button>
                                    </div>
                                )}

                                {enrichedSilabuses.length > 0 && (
                                    <div className="mb-2">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground font-medium"
                                            onChange={e => {
                                                const match = enrichedSilabuses.find(s => s.id.toString() === e.target.value);
                                                if (match) {
                                                    const text = (match.kompetensi ? "KD: " + match.kompetensi + "\n" : "") + "Materi: " + match.materi;
                                                    setData('topic', text);
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>💡 Pilih dari Silabus...</option>
                                            {enrichedSilabuses.map(s => {
                                                let badge = '';
                                                let suffix = '';
                                                if (s.is_last_delivered) {
                                                    badge = '📍 [TERAKHIR DISAMPAIKAN] ';
                                                    suffix = ' ◄── Terakhir';
                                                } else if (s.is_next_material) {
                                                    badge = '👉 [MATERI BERIKUTNYA] ';
                                                    suffix = ' ◄── Disarankan';
                                                } else if (s.is_previously_taught) {
                                                    badge = '✓ ';
                                                    suffix = ' (Sudah lewat)';
                                                }

                                                return (
                                                    <option 
                                                        key={s.id} 
                                                        value={s.id}
                                                        className={
                                                            s.is_last_delivered 
                                                                ? 'font-bold bg-amber-100 text-amber-900' 
                                                                : s.is_next_material 
                                                                ? 'font-bold bg-emerald-100 text-emerald-900' 
                                                                : s.is_previously_taught 
                                                                ? 'text-muted-foreground' 
                                                                : ''
                                                        }
                                                    >
                                                        {badge}Pekan {s.pekan || '-'}: {s.materi}{suffix}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                )}
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Isi materi yang diajarkan hari ini..."
                                    value={data.topic}
                                    onChange={e => setData('topic', e.target.value)}
                                    required
                                />
                                {errors.topic && <p className="text-destructive text-sm">{errors.topic}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Catatan kejadian di kelas, tugas, dll."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ABSENSI */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-primary" /> Absensi Siswa
                                </h3>
                                <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                                    Total: {data.attendances.length} Siswa
                                </span>
                            </div>

                            {/* Action Header */}
                        </div>

                        {!data.active_subject_id ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Silakan pilih Mata Pelajaran & Kelas terlebih dahulu untuk menampilkan daftar siswa.</p>
                            </div>
                        ) : isLoadingStudents ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground animate-pulse">Memuat data siswa dan menyinkronkan status kesehatan...</p>
                            </div>
                        ) : data.attendances.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <p>Tidak ada siswa di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {data.attendances.map((student, index) => {
                                    const isSickFromHealth = !!student.is_sick_from_health;
                                    const isPermittedFromCare = !!student.is_permitted_from_care;

                                    return (
                                        <div key={student.student_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="flex-none w-6 text-sm font-semibold text-muted-foreground pt-0.5">
                                                    {index + 1}.
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-foreground">{student.name}</p>
                                                        <span className="text-xs text-muted-foreground">NIS: {student.nis}</span>
                                                    </div>

                                                    {/* Badges dari Poskestren / Pengasuhan */}
                                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                                        {isSickFromHealth && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                                                                <HeartPulse className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                                                <span>Sakit (UKS): {student.health_info}</span>
                                                                {isTeacherOnly && <Lock className="w-3 h-3 text-red-500 ml-0.5" />}
                                                            </span>
                                                        )}

                                                        {isPermittedFromCare && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Izin (Pengasuhan): {student.permission_info}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                                                {/* Tombol Status Kehadiran (5 Kolom Penuh di HP) */}
                                                <div className="grid grid-cols-5 sm:flex gap-1.5 p-1 bg-muted/70 dark:bg-muted/30 rounded-xl border border-border/80 shadow-inner">
                                                    {['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'].map((status) => {
                                                        const isSelected = student.status === status;
                                                        
                                                        // Evaluasi apakah tombol ini disabled
                                                        let isDisabled = false;
                                                        let disabledTitle = '';

                                                        // 1. Jika santri tercatat sakit dari UKS, tombol status selain Sakit terkunci
                                                        if (isSickFromHealth && status !== 'Sakit') {
                                                            isDisabled = true;
                                                            disabledTitle = 'Santri terdata sakit di UKS (status dikunci Sakit)';
                                                        }
                                                        // 2. Jika santri TIDAK sakit dari UKS, dan setting teacher_can_set_sick adalah OFF
                                                        else if (status === 'Sakit' && !isSickFromHealth && !settings.teacher_can_set_sick) {
                                                            isDisabled = true;
                                                            disabledTitle = 'Status Sakit mutlak hanya dapat diinput oleh Bagian Kesehatan (Poskestren)';
                                                        }

                                                        // Warna status yang tajam, vibrant, dan berdaya kontras tinggi
                                                        let buttonClass = '';
                                                        if (isDisabled) {
                                                            buttonClass = 'opacity-30 cursor-not-allowed bg-muted/40 text-muted-foreground border-transparent hover:bg-transparent';
                                                        } else if (isSelected) {
                                                            if (status === 'Hadir') {
                                                                buttonClass = 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500 scale-[1.02]';
                                                            } else if (status === 'Sakit') {
                                                                buttonClass = 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30 ring-2 ring-rose-500 scale-[1.02]';
                                                            } else if (status === 'Izin') {
                                                                buttonClass = 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30 ring-2 ring-amber-400 scale-[1.02]';
                                                            } else if (status === 'Alpa') {
                                                                buttonClass = 'bg-red-800 text-white font-bold shadow-md shadow-red-800/30 ring-2 ring-red-700 scale-[1.02]';
                                                            } else if (status === 'Terlambat') {
                                                                buttonClass = 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30 ring-2 ring-orange-500 scale-[1.02]';
                                                            }
                                                        } else {
                                                            // State Tidak Aktif (Kontras Jelas & Border Ringan)
                                                            if (status === 'Hadir') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
                                                            } else if (status === 'Sakit') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-rose-800 dark:text-rose-300 border border-rose-300/80 hover:bg-rose-50 dark:hover:bg-rose-950/40';
                                                            } else if (status === 'Izin') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-300 border border-amber-300/80 hover:bg-amber-50 dark:hover:bg-amber-950/40';
                                                            } else if (status === 'Alpa') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-red-900 dark:text-red-300 border border-red-300/80 hover:bg-red-50 dark:hover:bg-red-950/40';
                                                            } else if (status === 'Terlambat') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-orange-900 dark:text-orange-300 border border-orange-300/80 hover:bg-orange-50 dark:hover:bg-orange-950/40';
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={status}
                                                                disabled={isDisabled}
                                                                title={disabledTitle || status}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        handleAttendanceChange(index, 'status', status);
                                                                    }
                                                                }}
                                                                className={`h-10 sm:h-8 px-1 sm:px-3 text-xs font-bold rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 ${buttonClass}`}
                                                            >
                                                                {status}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Seragam & Catatan */}
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2.5 py-2 sm:py-1.5 rounded-lg bg-muted/40 sm:bg-transparent border sm:border-0 border-border text-foreground hover:bg-muted/70 transition-colors shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={student.is_uniform_complete ?? true}
                                                            onChange={(e) => handleAttendanceChange(index, 'is_uniform_complete', e.target.checked)}
                                                            className="rounded border-input text-primary focus:ring-primary w-4 h-4 sm:w-3.5 sm:h-3.5"
                                                        />
                                                        <span className="hidden sm:inline">Seragam Sesuai</span>
                                                        <span className="sm:hidden">Seragam</span>
                                                    </label>

                                                    <input
                                                        type="text"
                                                        placeholder={student.status === 'Hadir' ? "Catatan..." : `Ket. ${student.status.toLowerCase()}...`}
                                                        value={student.note || ''}
                                                        onChange={(e) => handleAttendanceChange(index, 'note', e.target.value)}
                                                        className="h-10 sm:h-8 text-sm sm:text-xs border rounded-lg px-2.5 flex-1 sm:w-36 md:w-48 bg-background focus:ring-2 focus:ring-primary/30"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link
                            href={route('journals.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            SIMPAN JURNAL & ABSENSI
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
