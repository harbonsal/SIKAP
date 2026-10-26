import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    AlertCircle, 
    Save, 
    RotateCcw, 
    ChevronLeft, 
    Check as CheckIcon, 
    Lock, 
    BookOpen, 
    X, 
    SlidersHorizontal, 
    ChevronDown, 
    ChevronUp,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Input } from '@/Components/ui/input';
import QuranPageViewer from '@/Components/QuranPageViewer';

// ─── Surah Lists ──────────────────────────────────────────────────────────────
const SURAHS = [
    "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah",
    "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", "Hud",
    "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf",
    "Maryam", "Taha", "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur",
    "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-Ankabut",
    "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir",
    "Ya Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat",
    "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf",
    "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", "At-Tur",
    "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila",
    "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun",
    "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah",
    "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddathir", "Al-Qiyamah",
    "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "Abasa", "At-Takwir",
    "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq",
    "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail",
    "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah",
    "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr",
    "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun",
    "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

const JUZ_MAPPING = {
    1: ["Al-Fatihah", "Al-Baqarah"], 2: ["Al-Baqarah"], 3: ["Al-Baqarah", "Ali 'Imran"],
    4: ["Ali 'Imran", "An-Nisa'"], 5: ["An-Nisa'"], 6: ["An-Nisa'", "Al-Ma'idah"],
    7: ["Al-Ma'idah", "Al-An'am"], 8: ["Al-An'am", "Al-A'raf"], 9: ["Al-A'raf", "Al-Anfal"],
    10: ["Al-Anfal", "At-Taubah"], 11: ["At-Taubah", "Yunus", "Hud"], 12: ["Hud", "Yusuf"],
    13: ["Yusuf", "Ar-Ra'd", "Ibrahim"], 14: ["Al-Hijr", "An-Nahl"], 15: ["Al-Isra'", "Al-Kahf"],
    16: ["Al-Kahf", "Maryam", "Taha"], 17: ["Al-Anbiya'", "Al-Hajj"],
    18: ["Al-Mu'minun", "An-Nur", "Al-Furqan"], 19: ["Al-Furqan", "Ash-Shu'ara'", "An-Naml"],
    20: ["An-Naml", "Al-Qasas", "Al-Ankabut"], 21: ["Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab"],
    22: ["Al-Ahzab", "Saba'", "Fatir", "Ya Sin"], 23: ["Ya Sin", "As-Saffat", "Sad", "Az-Zumar"],
    24: ["Az-Zumar", "Ghafir", "Fussilat"],
    25: ["Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah"],
    26: ["Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat"],
    27: ["Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"],
    28: ["Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"],
    29: ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddathir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"],
    30: ["An-Naba'", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Lahab", "Al-Ikhlas", "Al-Falaq", "An-Nas"]
};

const DEFICIENCY_OPTIONS = [
    "Makharijul Huruf", "Hukum Nun Sukun dan Tanwin (Izhar)",
    "Hukum Nun Sukun dan Tanwin (Ikhfa')", "Hukum Nun Sukun dan Tanwin (Idgham/Iqlab)",
    "Hukum Mim Sukun", "Hukum Mad (Mad Thabi'i)", "Hukum Mad (Mad Wajib Muttashil)",
    "Hukum Mad (Mad Jaiz Munfashil)", "Qolqolah", "Harakat & Huruf"
];

// Batas awal setiap Juz (surah_name, ayat_min)
const JUZ_BOUNDARIES = {
    1:  { surah: 1,  ayat: 1   },
    2:  { surah: 2,  ayat: 142 },
    3:  { surah: 2,  ayat: 253 },
    4:  { surah: 3,  ayat: 93  },
    5:  { surah: 4,  ayat: 24  },
    6:  { surah: 4,  ayat: 148 },
    7:  { surah: 5,  ayat: 82  },
    8:  { surah: 6,  ayat: 111 },
    9:  { surah: 7,  ayat: 88  },
    10: { surah: 8,  ayat: 41  },
    11: { surah: 9,  ayat: 93  },
    12: { surah: 11, ayat: 6   },
    13: { surah: 12, ayat: 53  },
    14: { surah: 15, ayat: 1   },
    15: { surah: 17, ayat: 1   },
    16: { surah: 18, ayat: 75  },
    17: { surah: 21, ayat: 1   },
    18: { surah: 23, ayat: 1   },
    19: { surah: 25, ayat: 21  },
    20: { surah: 27, ayat: 56  },
    21: { surah: 29, ayat: 46  },
    22: { surah: 33, ayat: 31  },
    23: { surah: 36, ayat: 28  },
    24: { surah: 39, ayat: 32  },
    25: { surah: 41, ayat: 47  },
    26: { surah: 46, ayat: 1   },
    27: { surah: 51, ayat: 31  },
    28: { surah: 58, ayat: 1   },
    29: { surah: 67, ayat: 1   },
    30: { surah: 78, ayat: 1   },
};

function validateJuzAyat(juzNum, surahName, ayatNum) {
    if (!juzNum || juzNum === 'all' || !surahName || !ayatNum) return null;
    const juz = parseInt(juzNum, 10);
    const ayat = parseInt(ayatNum, 10);
    if (isNaN(juz) || isNaN(ayat)) return null;

    const startBound = JUZ_BOUNDARIES[juz];
    const endBound = JUZ_BOUNDARIES[juz + 1];

    if (!startBound) return null;

    const surahIdx = SURAHS.findIndex(s => s === surahName);
    if (surahIdx < 0) return null;
    const currentSurahNum = surahIdx + 1;

    const startSurahNum = startBound.surah;
    const endSurahNum = endBound ? endBound.surah : 114;

    const beforeStart =
        currentSurahNum < startSurahNum ||
        (currentSurahNum === startSurahNum && ayat < startBound.ayat);

    let afterEnd = false;
    if (endBound) {
        afterEnd =
            currentSurahNum > endSurahNum ||
            (currentSurahNum === endSurahNum && ayat >= endBound.ayat);
    }

    if (beforeStart) {
        return `Ayat ini sebelum batas Juz ${juz} (${SURAHS[startBound.surah - 1]} ayat ${startBound.ayat}).`;
    }
    if (afterEnd) {
        return `Ayat ini melewati batas Juz ${juz} (sebelum ${SURAHS[endBound.surah - 1]} ayat ${endBound.ayat}).`;
    }
    return null;
}

// ─── Ayah Mistake Modal (Mobile-Thumb Friendly) ───────────────────────────────
function AyahMistakeModal({ verse, activeQuestion, currentData, onSalah, onMumtaz, onReset, onClose, onLanjut, isLocked }) {
    if (!verse) return null;
    const [surahNum, ayahNum] = (verse.verse_key || '').split(':');
    const currentScore = Math.max(0, 10 - (currentData?.mistakes || 0)) * 10;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <div
                className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-900 to-teal-950 px-4 py-3 flex items-center justify-between text-white">
                    <div>
                        <h3 className="font-bold text-sm sm:text-base">Penilaian Ayat</h3>
                        <p className="text-emerald-300 text-xs mt-0.5">
                            Surat {currentData?.surah_name || surahNum} Ayat {ayahNum} · Soal {activeQuestion}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Ayat text */}
                <div className="px-4 py-3 bg-[#fdfbf7] border-b border-amber-200/80 max-h-36 overflow-y-auto">
                    <p className="text-right text-lg sm:text-xl leading-loose text-stone-900"
                        style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }}>
                        {verse.text_uthmani || `Ayat ${ayahNum}`}
                    </p>
                </div>

                {/* Score preview */}
                <div className="flex items-center justify-around px-4 py-2.5 bg-slate-50 border-b">
                    <div className="text-center">
                        <div className="text-[11px] text-slate-500 uppercase font-bold">Total Salah</div>
                        <div className="text-xl font-bold text-rose-600">{currentData?.mistakes || 0}</div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                        <div className="text-[11px] text-slate-500 uppercase font-bold">Nilai Soal {activeQuestion}</div>
                        <div className="text-xl font-bold text-indigo-700">{currentScore}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            disabled={isLocked}
                            onClick={onSalah}
                            className="h-12 bg-rose-600 hover:bg-rose-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                            <span>SALAH (+1)</span>
                        </button>
                        <button
                            disabled={isLocked}
                            onClick={onMumtaz}
                            className="h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                            <span>MUMTAZ ✓</span>
                        </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            disabled={isLocked}
                            onClick={onReset}
                            className="h-9 px-3 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                            title="Reset kesalahan soal ini"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reset</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                        >
                            Tutup
                        </button>

                        <button
                            onClick={onLanjut}
                            className="flex-1 h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                        >
                            <span>Lanjut Soal ➔</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Assessment({ 
    activeSubject, 
    gradeWeight, 
    student, 
    grade, 
    nextStudentId, 
    kkm = 75, 
    lockStatus = 'open', 
    eligibleValidationJuz = [], 
    isAdminOrManager = false 
}) {
    const isValidasiMode = gradeWeight?.name?.toLowerCase().includes('validasi');
    const hasEligibleJuz = eligibleValidationJuz && eligibleValidationJuz.length > 0;
    const isLatePhase = lockStatus === 'late_phase' || lockStatus === 'strict_lock';
    const isStrictlyLocked = lockStatus === 'strict_lock' && !isAdminOrManager;
    const isLocked = isStrictlyLocked;
    const isNewSubmission = !grade;

    const getQuestionCount = (name) => {
        const n = (name || '').toUpperCase();
        if (n.includes('UTS') || n.includes('UAS') || n.includes('UKK')) return 5;
        if (n.includes('UH')) return 3;
        return 1;
    };
    const totalQuestions = getQuestionCount(gradeWeight?.name || '');

    const [activeQuestion, setActiveQuestion] = useState(1);

    // Initial answers state
    const [allAnswers, setAllAnswers] = useState(() => {
        const initial = {};
        let lastJuz = '30';
        for (let i = 1; i <= totalQuestions; i++) {
            const existing = grade?.tahfidz_details?.find(d => d.question_number === i);
            initial[i] = {
                mistakes: existing?.mistakes || 0,
                surah_name: existing?.surah_name || '',
                verse_start: existing?.verse_start || '',
                is_reviewed: !!existing,
                selectedJuz: existing?.juz ? existing.juz.toString() :
                    (isValidasiMode && eligibleValidationJuz.length > 0
                        ? eligibleValidationJuz[0].toString()
                        : lastJuz)
            };
        }
        return initial;
    });

    const currentData = allAnswers[activeQuestion] || {};

    // Cek apakah opsi soal saat ini sudah terisi
    const isOptionComplete = Boolean(currentData?.selectedJuz && currentData?.surah_name && currentData?.verse_start);

    // Kontrol apakah panel pemilih opsi sedang terbuka atau diciutkan (collapse)
    // Otomatis diciutkan jika sudah terisi, agar Al-Quran mendominasi tampilan
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(!isOptionComplete);

    // Sinkronkan auto-collapse saat berganti soal
    useEffect(() => {
        const complete = Boolean(allAnswers[activeQuestion]?.selectedJuz && allAnswers[activeQuestion]?.surah_name && allAnswers[activeQuestion]?.verse_start);
        setIsOptionsExpanded(!complete);
    }, [activeQuestion]);

    const updateAnswer = (qNum, field, value) => {
        setAllAnswers(prev => {
            const newState = { ...prev, [qNum]: { ...prev[qNum], [field]: value } };
            if (field === 'selectedJuz') {
                for (let i = qNum + 1; i <= totalQuestions; i++) {
                    newState[i] = { ...newState[i], selectedJuz: value };
                }
            }
            return newState;
        });
    };

    const [ayahModal, setAyahModal] = useState(null);

    const handleAyahClick = (verse) => {
        if (isLocked) return;
        const cur = allAnswers[activeQuestion];
        if (!cur?.selectedJuz || !cur?.surah_name || !cur?.verse_start) {
            setIsOptionsExpanded(true);
            alert('Lengkapi Surat & Ayat Awal terlebih dahulu.');
            return;
        }
        setAyahModal({ verse });
    };

    const handleModalSalah = () => {
        updateAnswer(activeQuestion, 'mistakes', (allAnswers[activeQuestion].mistakes || 0) + 1);
        updateAnswer(activeQuestion, 'is_reviewed', true);
        setAyahModal(null);
    };

    const handleModalMumtaz = () => {
        updateAnswer(activeQuestion, 'mistakes', 0);
        updateAnswer(activeQuestion, 'is_reviewed', true);
        setAyahModal(null);
        if (activeQuestion < totalQuestions) {
            setActiveQuestion(q => q + 1);
        }
    };

    const handleModalReset = () => {
        updateAnswer(activeQuestion, 'mistakes', 0);
        updateAnswer(activeQuestion, 'is_reviewed', false);
        setAyahModal(null);
    };

    // Reading quality & Validation state
    const [readingQuality, setReadingQuality] = useState(grade?.reading_quality || '');
    const [deficiencies, setDeficiencies] = useState(grade?.reading_deficiencies || []);
    const [isRemedial, setIsRemedial] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('type') === 'remedial';
    });
    const [isExcused, setIsExcused] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('is_excused')) return params.get('is_excused') === '1';
        return null;
    });
    const hasExcusedParam = new URLSearchParams(window.location.search).has('is_excused');
    const [processing, setProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);

    const toggleDeficiency = (def) => {
        setDeficiencies(prev => prev.includes(def) ? prev.filter(d => d !== def) : [...prev, def]);
    };

    const totalPredictedScore = Object.values(allAnswers).reduce((acc, curr) => {
        return acc + (Math.max(0, 10 - curr.mistakes) * 10);
    }, 0) / totalQuestions;

    const allReviewed = Object.values(allAnswers).every(a => a.is_reviewed);
    const showValidation = (isValidasiMode && !hasEligibleJuz) ? false : allReviewed;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!readingQuality) { alert('Mohon pilih Keterangan Bacaan.'); return; }
        if (readingQuality === 'kurang' && deficiencies.length === 0) {
            alert('Jika bacaan Kurang, mohon pilih minimal satu kekurangan.'); return;
        }
        if (isLatePhase && isNewSubmission && isExcused === null) {
            alert('Mohon pilih Alasan Keterlambatan.'); return;
        }
        const unreviewedQuestions = [];
        for (let i = 1; i <= totalQuestions; i++) {
            if (!allAnswers[i]?.is_reviewed) unreviewedQuestions.push(i);
        }
        if (unreviewedQuestions.length > 0) {
            alert(`Mohon selesaikan penilaian untuk Soal: ${unreviewedQuestions.join(', ')}.`);
            setActiveQuestion(unreviewedQuestions[0]); return;
        }
        const incompleteQuestions = [];
        for (let i = 1; i <= totalQuestions; i++) {
            const d = allAnswers[i];
            if (!d.selectedJuz || !d.surah_name || !d.verse_start) incompleteQuestions.push(i);
        }
        if (incompleteQuestions.length > 0) {
            alert(`Lengkapi Juz/Surat/Ayat untuk Soal: ${incompleteQuestions.join(', ')}.`);
            setActiveQuestion(incompleteQuestions[0]); 
            setIsOptionsExpanded(true);
            return;
        }

        const juzMismatchQuestions = [];
        for (let i = 1; i <= totalQuestions; i++) {
            const d = allAnswers[i];
            const err = validateJuzAyat(d.selectedJuz, d.surah_name, d.verse_start);
            if (err) juzMismatchQuestions.push({ soal: i, pesan: err });
        }
        if (juzMismatchQuestions.length > 0) {
            const detail = juzMismatchQuestions.map(m => `Soal ${m.soal}: ${m.pesan}`).join('\n');
            alert(`Kesalahan Batas Juz:\n\n${detail}\n\nMohon perbaiki sebelum menyimpan.`);
            setActiveQuestion(juzMismatchQuestions[0].soal);
            setIsOptionsExpanded(true);
            return;
        }

        setProcessing(true);
        const payload = Object.keys(allAnswers).map(qNum => ({
            question_number: parseInt(qNum, 10),
            mistakes: allAnswers[qNum].mistakes,
            surah_name: allAnswers[qNum].surah_name,
            verse_start: allAnswers[qNum].verse_start,
            juz: allAnswers[qNum].selectedJuz,
        }));

        router.post(route('tahfidz.assessments.store', activeSubject.id), {
            student_id: student.id,
            grade_weight_id: gradeWeight.id,
            answers: payload,
            reading_quality: readingQuality,
            reading_deficiencies: deficiencies,
            is_remedial: isRemedial,
            is_excused: isExcused
        }, {
            preserveScroll: true,
            onSuccess: (page) => { 
                setProcessing(false); 
                const isError = page.props.flash?.error;
                const validationErrors = page.props.errors;
                if (isError) {
                    alert(isError);
                } else if (validationErrors && Object.keys(validationErrors).length > 0) {
                    alert('Validasi Gagal:\n' + Object.values(validationErrors).join('\n'));
                } else {
                    setIsFinished(true); 
                }
            },
            onError: (errors) => { 
                setProcessing(false); 
                if (errors && Object.keys(errors).length > 0) {
                    alert('Validasi Gagal:\n' + Object.values(errors).join('\n'));
                } else {
                    alert('Gagal menyimpan data!'); 
                }
            },
            onFinish: () => setProcessing(false)
        });
    };

    // ── Success Screen ────────────────────────────────────────────────────────
    if (isFinished) {
        return (
            <MainLayout showBreadcrumb={false}>
                <Head title="Ujian Selesai" />
                <div className="py-8 max-w-xl mx-auto px-4 text-center">
                    <div className="bg-white rounded-2xl border border-emerald-200 shadow-xl p-8 space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 animate-in zoom-in duration-300">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-800">Alhamdulillah Selesai!</h2>
                        <p className="text-sm text-slate-600">
                            Penilaian untuk santri <strong>{student?.name}</strong> berhasil disimpan ke rapor.
                        </p>
                        <div className="py-4 border-y border-emerald-100">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Nilai Akhir</div>
                            <div className="text-5xl font-black text-emerald-600">
                                {grade?.score ? grade.score : totalPredictedScore.toFixed(0)}
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            {nextStudentId ? (
                                <Link href={route('tahfidz.assessments.assess', { active_subject: activeSubject.id, grade_weight: gradeWeight.id, student_id: nextStudentId })}>
                                    <button className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                                        <span>Lanjut Santri Berikutnya</span>
                                        <span>➔</span>
                                    </button>
                                </Link>
                            ) : (
                                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200">
                                    Semua santri di kelas ini telah selesai dinilai.
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <Link href={route('tahfidz.assessments.students', { active_subject: activeSubject.id, grade_weight: gradeWeight.id })}>
                                    <button className="w-full h-11 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors">
                                        Daftar Santri
                                    </button>
                                </Link>
                                <Link href={route('tahfidz.assessments.index')}>
                                    <button className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors">
                                        Pilih Kelas
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const filteredSurahs = currentData.selectedJuz && currentData.selectedJuz !== 'all' && JUZ_MAPPING[currentData.selectedJuz]
        ? JUZ_MAPPING[currentData.selectedJuz]
        : SURAHS;

    const currentScore = Math.max(0, 10 - (currentData.mistakes || 0)) * 10;

    return (
        <MainLayout 
            showBreadcrumb={false} 
            hideMobileNav={true} 
            hideHeader={true}
            contentPadding="p-0"
        >
            <Head title={`Ujian ${gradeWeight?.name || 'Tahfidz'} - ${student?.name || ''}`} />
            <link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" rel="stylesheet" />

            {/* Ayah Mistake Modal */}
            {ayahModal && (
                <AyahMistakeModal
                    verse={ayahModal.verse}
                    activeQuestion={activeQuestion}
                    currentData={currentData}
                    onSalah={handleModalSalah}
                    onMumtaz={handleModalMumtaz}
                    onReset={handleModalReset}
                    onClose={() => setAyahModal(null)}
                    onLanjut={() => {
                        setAyahModal(null);
                        if (activeQuestion < totalQuestions) {
                            setActiveQuestion(activeQuestion + 1);
                        }
                    }}
                    isLocked={isLocked}
                />
            )}

            <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-100 select-none">
                
                {/* ── 1. BILAH UTAMA ATAS (Ultra-Compact Sticky Header) ───────────── */}
                <header className="shrink-0 z-30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md border-b border-emerald-800/80">
                    <div className="px-3 py-2 flex items-center justify-between gap-2 max-w-7xl mx-auto">
                        {/* Kiri: Tombol Back & Identitas Santri */}
                        <div className="flex items-center gap-2 min-w-0">
                            <Link 
                                href={route('tahfidz.assessments.students', { active_subject: activeSubject.id, grade_weight: gradeWeight.id })}
                                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors shrink-0"
                                title="Kembali ke Daftar Santri"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Link>

                            <div className="min-w-0 leading-tight">
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-xs">
                                        {student?.name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200 border border-emerald-700 shrink-0 hidden sm:inline">
                                        {gradeWeight?.name || ''}
                                    </span>
                                </div>
                                <div className="text-[10px] text-emerald-300/80 truncate">
                                    NIS: {student?.nomor_induk || student?.nis || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Kanan: Ringkasan Nilai & Toggle Tombol Opsi */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Score Preview Pill */}
                            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/60 rounded-lg px-2.5 py-1 text-right">
                                <div>
                                    <div className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold leading-none">
                                        Nilai Akhir
                                    </div>
                                    <div className="text-base sm:text-lg font-black text-emerald-100 leading-tight">
                                        {grade?.score || totalPredictedScore.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Toggle Buka/Tutup Opsi */}
                            <button
                                type="button"
                                onClick={() => setIsOptionsExpanded(exp => !exp)}
                                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 ${
                                    isOptionsExpanded 
                                        ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs' 
                                        : 'bg-emerald-800/90 hover:bg-emerald-700 text-white border-emerald-600'
                                }`}
                                title={isOptionsExpanded ? 'Sembunyikan Opsi agar Al-Quran Penuh' : 'Buka Opsi Surat & Ayat'}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">
                                    {isOptionsExpanded ? 'Tutup Opsi' : 'Pilih Opsi'}
                                </span>
                                {isOptionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* ── 2. STRIP RINGKAS SAAT OPSI TERCIUT (Collapsed Compact Strip) ─── */}
                    {!isOptionsExpanded && (
                        <div className="bg-emerald-950/90 border-t border-emerald-800/60 px-3 py-1 flex items-center justify-between text-xs text-emerald-200">
                            {/* Tabs Soal Cepat */}
                            <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scrollbar">
                                {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qn => {
                                    const q = allAnswers[qn];
                                    const isActive = activeQuestion === qn;
                                    const isRev = q?.is_reviewed;
                                    return (
                                        <button
                                            key={qn}
                                            type="button"
                                            onClick={() => setActiveQuestion(qn)}
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                                isActive 
                                                    ? 'bg-white text-emerald-950 shadow-xs' 
                                                    : isRev 
                                                        ? 'bg-emerald-700/70 text-emerald-100' 
                                                        : 'bg-emerald-900/60 text-emerald-400'
                                            }`}
                                        >
                                            {isRev && <CheckIcon className="w-2.5 h-2.5" />}
                                            Soal {qn}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Info Surat & Ayat Aktif (Tap to Edit) */}
                            <div 
                                onClick={() => setIsOptionsExpanded(true)}
                                className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors shrink-0 ml-2"
                                title="Klik untuk mengubah Surat atau Ayat"
                            >
                                <span className="text-[11px] font-medium text-emerald-200">
                                    {currentData.surah_name 
                                        ? `Juz ${currentData.selectedJuz} · ${currentData.surah_name}:${currentData.verse_start || '1'}`
                                        : 'Belum Pilih Surat ✎'}
                                </span>
                                <span className="text-[10px] px-1 py-0.2 rounded bg-rose-600/80 text-white font-bold">
                                    Salah: {currentData.mistakes || 0}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── 3. PANEL PEMILIH OPSI LENGKAP (Expanded Form Panel) ─────────── */}
                    {isOptionsExpanded && (
                        <div className="bg-emerald-950 border-t border-emerald-800 p-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="max-w-7xl mx-auto space-y-2.5">
                                {/* Baris Tab Soal */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mr-1">
                                            Pilih Soal:
                                        </span>
                                        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qn => {
                                            const q = allAnswers[qn];
                                            const isActive = activeQuestion === qn;
                                            const isRev = q?.is_reviewed;
                                            return (
                                                <button
                                                    key={qn}
                                                    type="button"
                                                    onClick={() => setActiveQuestion(qn)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isActive 
                                                            ? 'bg-white text-emerald-950 shadow-md ring-2 ring-emerald-400' 
                                                            : isRev 
                                                                ? 'bg-emerald-700 text-white' 
                                                                : 'bg-emerald-900/80 text-emerald-300 hover:bg-emerald-800'
                                                    }`}
                                                >
                                                    {isRev && <CheckIcon className="w-3 h-3 text-emerald-400" />}
                                                    Soal {qn}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tombol Ciutkan Cepat */}
                                    {isOptionComplete && (
                                        <button
                                            type="button"
                                            onClick={() => setIsOptionsExpanded(false)}
                                            className="text-[11px] text-emerald-300 hover:text-white underline font-semibold ml-auto"
                                        >
                                            Tutup Panel Opsi ▴
                                        </button>
                                    )}
                                </div>

                                {/* Form Dropdown Juz, Surat, Ayat */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-800/80">
                                    {/* JUZ */}
                                    <div className="sm:col-span-3">
                                        <label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">
                                            Pilih Juz
                                        </label>
                                        <Select
                                            value={currentData.selectedJuz}
                                            onValueChange={val => updateAnswer(activeQuestion, 'selectedJuz', val)}
                                            disabled={isLocked}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-emerald-950 border-emerald-700 text-white focus:ring-emerald-400">
                                                <SelectValue placeholder="Pilih Juz" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {!isValidasiMode && <SelectItem value="all">Semua Juz</SelectItem>}
                                                {isValidasiMode
                                                    ? eligibleValidationJuz.map(j => <SelectItem key={j} value={j.toString()}>Juz {j}</SelectItem>)
                                                    : Array.from({ length: 30 }, (_, i) => i + 1).map(j => <SelectItem key={j} value={j.toString()}>Juz {j}</SelectItem>)
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* SURAH */}
                                    <div className="sm:col-span-4">
                                        <label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">
                                            Pilih Surat
                                        </label>
                                        <Select
                                            value={currentData.surah_name}
                                            onValueChange={val => updateAnswer(activeQuestion, 'surah_name', val)}
                                            disabled={isLocked}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-emerald-950 border-emerald-700 text-white focus:ring-emerald-400">
                                                <SelectValue placeholder="Pilih Surat" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56">
                                                {filteredSurahs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* AYAT AWAL */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-emerald-300 uppercase mb-1">
                                            Ayat Awal
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="Ayat"
                                            value={currentData.verse_start}
                                            onChange={e => updateAnswer(activeQuestion, 'verse_start', e.target.value)}
                                            disabled={isLocked}
                                            className="h-8 text-xs bg-emerald-950 border-emerald-700 text-white placeholder:text-emerald-500 focus:ring-emerald-400"
                                        />
                                    </div>

                                    {/* STATUS SOAL & SCORE */}
                                    <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                                        <div className="text-right">
                                            <div className="text-[10px] text-emerald-300 font-semibold uppercase">Kesalahan:</div>
                                            <div className="text-base font-bold text-rose-400 leading-none">
                                                {currentData.mistakes || 0}
                                            </div>
                                        </div>

                                        <div className="text-right border-l border-emerald-700 pl-3">
                                            <div className="text-[10px] text-emerald-300 font-semibold uppercase">Nilai:</div>
                                            <div className="text-base font-black text-white leading-none">
                                                {currentScore}
                                            </div>
                                        </div>

                                        {currentData.mistakes > 0 && !isLocked && (
                                            <button
                                                type="button"
                                                onClick={() => { updateAnswer(activeQuestion, 'mistakes', 0); updateAnswer(activeQuestion, 'is_reviewed', false); }}
                                                className="p-1 rounded bg-emerald-800 text-emerald-200 hover:text-white"
                                                title="Reset kesalahan"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── 4. AREA UTAMA: AL-QUR'AN MENDOMINASI LAYAR (Full Dominance) ──── */}
                <main className="flex-1 w-full h-full min-h-0 overflow-hidden relative">
                    {!(isValidasiMode && !hasEligibleJuz) ? (
                        <QuranPageViewer
                            selectedJuz={currentData.selectedJuz}
                            surahName={currentData.surah_name}
                            verseStart={currentData.verse_start}
                            inline={true}
                            onAyahClick={isLocked ? null : handleAyahClick}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white">
                            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                            <h3 className="text-base font-bold text-slate-800">Tidak Dapat Melakukan Validasi</h3>
                            <p className="text-xs text-slate-500 max-w-sm mt-1">
                                Santri tidak memiliki hafalan juz penuh yang menunggu validasi.
                            </p>
                        </div>
                    )}
                </main>

                {/* ── 5. FLOATING DOCK VALIDASI & SIMPAN (Saat Semua Soal Selesai) ──── */}
                {showValidation && (
                    <div className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 shadow-lg z-20">
                        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div className="text-xs truncate">
                                    <span className="font-bold text-slate-800">Semua Soal Terisi</span>
                                    <span className="text-slate-500 text-[11px] ml-1">· Nilai: {totalPredictedScore.toFixed(0)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowValidationModal(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>Validasi & Simpan</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 6. MODAL VALIDASI AKHIR (Popup Bersih Saat Klik Simpan) ───────── */}
            {showValidationModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowValidationModal(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
                    <div
                        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Validasi Akhir Penilaian</h3>
                                <p className="text-xs text-slate-500">Santri: {student?.name} (Nilai: {totalPredictedScore.toFixed(0)})</p>
                            </div>
                            <button onClick={() => setShowValidationModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Keterangan Bacaan */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase">
                                Kualitas Bacaan
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { val: 'bagus', label: 'Bagus / Lancar', color: 'emerald' },
                                    { val: 'kurang', label: 'Kurang / Catatan', color: 'amber' }
                                ].map(({ val, label }) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => { setReadingQuality(val); if (val === 'bagus') setDeficiencies([]); }}
                                        className={`p-3 rounded-xl border-2 text-left font-bold text-xs transition-all ${
                                            readingQuality === val
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kekurangan Jika Kurang */}
                        {readingQuality === 'kurang' && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 animate-in fade-in">
                                <p className="text-xs font-bold text-amber-900">Ceklist Kekurangan:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                                    {DEFICIENCY_OPTIONS.map((opt, idx) => (
                                        <label key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-amber-100/50">
                                            <input
                                                type="checkbox"
                                                checked={deficiencies.includes(opt)}
                                                onChange={() => toggleDeficiency(opt)}
                                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alasan Keterlambatan */}
                        {isLatePhase && isNewSubmission && !hasExcusedParam && (
                            <div className="space-y-2 border-t pt-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                    Alasan Keterlambatan
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExcused(true)}
                                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                                            isExcused === true ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        Izin / Sakit (Maks 100)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsExcused(false)}
                                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                                            isExcused === false ? 'border-rose-600 bg-rose-50 text-rose-900' : 'border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        Tledor (Maks KKM {kkm})
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                disabled={processing || isLocked}
                                onClick={handleSubmit}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {processing ? 'Menyimpan ke Rapor...' : 'Simpan Penilaian ke Rapor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
