import { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { AlertCircle, Save, RotateCcw, ChevronLeft, Check as CheckIcon, Lock, BookOpen, X } from 'lucide-react';
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
    13: ["Yusuf", "Ar-Ra'd", "Ibrahim"], 14: ["Ibrahim", "Al-Hijr"], 15: ["Al-Isra'", "Al-Kahf"],
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

// ─── Ayah Mistake Modal ───────────────────────────────────────────────────────
function AyahMistakeModal({ verse, activeQuestion, currentData, onSalah, onMumtaz, onReset, onClose, isLocked }) {
    if (!verse) return null;
    const [surahNum, ayahNum] = (verse.verse_key || '').split(':');
    const currentScore = Math.max(0, 10 - (currentData?.mistakes || 0)) * 10;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-5 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-base">Input Kesalahan</h3>
                        <p className="text-emerald-300 text-xs mt-0.5">
                            Surah {surahNum} Ayat {ayahNum} · Soal {activeQuestion}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-emerald-300 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Ayat text */}
                <div className="px-5 py-4 bg-amber-50 border-b border-amber-200">
                    <p className="text-right text-xl leading-loose text-stone-800"
                        style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }}>
                        {verse.text_uthmani}
                    </p>
                </div>

                {/* Score preview */}
                <div className="flex items-center justify-around px-5 py-3 bg-gray-50 border-b">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Kesalahan</div>
                        <div className="text-2xl font-bold text-red-500">{currentData?.mistakes || 0}</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200" />
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Nilai Soal</div>
                        <div className="text-2xl font-bold text-indigo-600">{currentScore}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 space-y-3">
                    <button
                        disabled={isLocked}
                        onClick={onSalah}
                        className="w-full h-12 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-colors shadow"
                    >
                        SALAH (+1)
                    </button>
                    <button
                        disabled={isLocked}
                        onClick={onMumtaz}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-colors shadow"
                    >
                        MUMTAZ ✓
                    </button>
                    <button
                        disabled={isLocked}
                        onClick={onReset}
                        className="w-full h-9 border border-gray-300 hover:border-gray-400 text-gray-500 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset Kesalahan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// ── Batas awal setiap Juz (surah_name, ayat_min) ────────────────────────────
// Format: [juzNumber]: { surah: nomor_surah, ayat: ayat_awal }
// Batas akhir juz N = batas awal juz N+1 - 1 (atau akhir Quran untuk juz 30)
const JUZ_BOUNDARIES = {
    1:  { surah: 1,  ayat: 1   }, // Al-Fatihah
    2:  { surah: 2,  ayat: 142 }, // Al-Baqarah
    3:  { surah: 2,  ayat: 253 }, // Al-Baqarah
    4:  { surah: 3,  ayat: 93  }, // Ali 'Imran
    5:  { surah: 4,  ayat: 24  }, // An-Nisa'
    6:  { surah: 4,  ayat: 148 }, // An-Nisa'
    7:  { surah: 5,  ayat: 82  }, // Al-Ma'idah
    8:  { surah: 6,  ayat: 111 }, // Al-An'am
    9:  { surah: 7,  ayat: 88  }, // Al-A'raf
    10: { surah: 8,  ayat: 41  }, // Al-Anfal
    11: { surah: 9,  ayat: 93  }, // At-Taubah
    12: { surah: 11, ayat: 6   }, // Hud
    13: { surah: 12, ayat: 53  }, // Yusuf
    14: { surah: 15, ayat: 1   }, // Al-Hijr
    15: { surah: 17, ayat: 1   }, // Al-Isra'
    16: { surah: 18, ayat: 75  }, // Al-Kahf
    17: { surah: 21, ayat: 1   }, // Al-Anbiya'
    18: { surah: 23, ayat: 1   }, // Al-Mu'minun
    19: { surah: 25, ayat: 21  }, // Al-Furqan
    20: { surah: 27, ayat: 56  }, // An-Naml
    21: { surah: 29, ayat: 46  }, // Al-Ankabut
    22: { surah: 33, ayat: 31  }, // Al-Ahzab
    23: { surah: 36, ayat: 28  }, // Ya Sin
    24: { surah: 39, ayat: 32  }, // Az-Zumar
    25: { surah: 41, ayat: 47  }, // Fussilat
    26: { surah: 46, ayat: 1   }, // Al-Ahqaf
    27: { surah: 51, ayat: 31  }, // Adh-Dhariyat
    28: { surah: 58, ayat: 1   }, // Al-Mujadila
    29: { surah: 67, ayat: 1   }, // Al-Mulk
    30: { surah: 78, ayat: 1   }, // An-Naba'
};

/**
 * Cek apakah surah:ayat masuk dalam juz yang dipilih.
 * Returns: null (valid) | string (pesan error)
 */
function validateJuzAyat(juzNum, surahName, ayatNum) {
    if (!juzNum || juzNum === 'all' || !surahName || !ayatNum) return null;
    const juz = parseInt(juzNum);
    const ayat = parseInt(ayatNum);
    if (isNaN(juz) || isNaN(ayat)) return null;

    const startBound = JUZ_BOUNDARIES[juz];
    const endBound = JUZ_BOUNDARIES[juz + 1]; // undefined untuk juz 30

    if (!startBound) return null;

    const surahIdx = SURAHS.findIndex(s => s === surahName);
    if (surahIdx < 0) return null;
    const currentSurahNum = surahIdx + 1;

    const startSurahNum = startBound.surah;
    const endSurahNum = endBound ? endBound.surah : 114;

    // Cek apakah surah:ayat >= batas awal juz
    const beforeStart =
        currentSurahNum < startSurahNum ||
        (currentSurahNum === startSurahNum && ayat < startBound.ayat);

    // Cek apakah surah:ayat < batas awal juz berikutnya
    let afterEnd = false;
    if (endBound) {
        afterEnd =
            currentSurahNum > endSurahNum ||
            (currentSurahNum === endSurahNum && ayat >= endBound.ayat);
    }

    if (beforeStart) {
        return `Ayat ini berada sebelum Juz ${juz}. Juz ${juz} dimulai dari ${SURAHS[startBound.surah - 1]} ayat ${startBound.ayat}.`;
    }
    if (afterEnd) {
        return `Ayat ini melewati batas Juz ${juz}. Juz ${juz} berakhir sebelum ${SURAHS[endBound.surah - 1]} ayat ${endBound.ayat}.`;
    }
    return null;
}

export default function Assessment({ activeSubject, gradeWeight, student, grade, nextStudentId, kkm = 75, isLocked = false, eligibleValidationJuz = [] }) {
    const isValidasiMode = gradeWeight?.name?.toLowerCase().includes('validasi');
    const hasEligibleJuz = eligibleValidationJuz && eligibleValidationJuz.length > 0;

    const getQuestionCount = (name) => {
        const n = (name || '').toUpperCase();
        if (n.includes('UTS') || n.includes('UAS') || n.includes('UKK')) return 5;
        if (n.includes('UH')) return 3;
        return 1;
    };
    const totalQuestions = getQuestionCount(gradeWeight?.name || '');

    // Active question tab
    const [activeQuestion, setActiveQuestion] = useState(1);

    // All questions state
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

    // Ayah modal state
    const [ayahModal, setAyahModal] = useState(null); // { verse }

    const handleAyahClick = (verse) => {
        if (isLocked) return;
        const cur = allAnswers[activeQuestion];
        if (!cur?.selectedJuz || !cur?.surah_name || !cur?.verse_start) {
            alert('Lengkapi Juz, Surat & Ayat Awal terlebih dahulu.');
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
        // Auto-advance
        if (activeQuestion < totalQuestions) {
            setActiveQuestion(q => q + 1);
        }
    };

    const handleModalReset = () => {
        updateAnswer(activeQuestion, 'mistakes', 0);
        updateAnswer(activeQuestion, 'is_reviewed', false);
        setAyahModal(null);
    };

    // Reading quality
    const [readingQuality, setReadingQuality] = useState(grade?.reading_quality || '');
    const [deficiencies, setDeficiencies] = useState(grade?.reading_deficiencies || []);
    const [isRemedial, setIsRemedial] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('type') === 'remedial';
    });
    const [processing, setProcessing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const toggleDeficiency = (def) => {
        setDeficiencies(prev => prev.includes(def) ? prev.filter(d => d !== def) : [...prev, def]);
    };

    const totalPredictedScore = Object.values(allAnswers).reduce((acc, curr) => {
        return acc + (Math.max(0, 10 - curr.mistakes) * 10);
    }, 0) / totalQuestions;

    const allReviewed = Object.values(allAnswers).every(a => a.is_reviewed);
    const showValidation = (isValidasiMode && !hasEligibleJuz) ? false : allReviewed;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!readingQuality) { alert('Mohon pilih Keterangan Bacaan.'); return; }
        if (readingQuality === 'kurang' && deficiencies.length === 0) {
            alert('Jika bacaan Kurang, mohon pilih minimal satu kekurangan.'); return;
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
            setActiveQuestion(incompleteQuestions[0]); return;
        }

        // Validasi kesesuaian Juz dengan Surah:Ayat
        const juzMismatchQuestions = [];
        for (let i = 1; i <= totalQuestions; i++) {
            const d = allAnswers[i];
            const err = validateJuzAyat(d.selectedJuz, d.surah_name, d.verse_start);
            if (err) juzMismatchQuestions.push({ soal: i, pesan: err });
        }
        if (juzMismatchQuestions.length > 0) {
            const detail = juzMismatchQuestions.map(m => `Soal ${m.soal}: ${m.pesan}`).join('\n');
            alert(`❌ Kesalahan Penempatan Juz:\n\n${detail}\n\nMohon perbaiki sebelum menyimpan.`);
            setActiveQuestion(juzMismatchQuestions[0].soal); return;
        }
        setProcessing(true);
        const payload = Object.keys(allAnswers).map(qNum => ({
            question_number: parseInt(qNum),
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
            is_remedial: isRemedial
        }, {
            preserveScroll: true,
            onSuccess: () => { setProcessing(false); setIsFinished(true); },
            onError: () => { setProcessing(false); alert('Gagal menyimpan data!'); },
            onFinish: () => setProcessing(false)
        });
    };

    // ── Success Screen ────────────────────────────────────────────────────────
    if (isFinished) {
        return (
            <MainLayout>
                <Head title="Ujian Selesai" />
                <div className="py-12 max-w-2xl mx-auto px-4 text-center">
                    <div className="bg-white rounded-2xl border border-green-200 shadow-xl p-10 space-y-6">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 animate-in zoom-in duration-500">
                            <span className="text-5xl">🎉</span>
                        </div>
                        <h2 className="text-3xl font-bold text-green-800">Alhamdulillah!</h2>
                        <p className="text-lg text-gray-600">
                            Penilaian untuk <strong>{student?.name}</strong> berhasil disimpan.
                        </p>
                        <div className="py-6 border-y border-green-100">
                            <div className="text-sm text-gray-500 uppercase tracking-widest mb-2">Nilai Akhir</div>
                            <div className="text-6xl font-extrabold text-green-600">
                                {grade?.score ? grade.score : totalPredictedScore.toFixed(0)}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {nextStudentId ? (
                                <Link href={route('tahfidz.assessments.assess', { active_subject: activeSubject.id, grade_weight: gradeWeight.id, student_id: nextStudentId })}>
                                    <button className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors">
                                        Lanjut Siswa Berikutnya →
                                    </button>
                                </Link>
                            ) : (
                                <div className="p-4 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-200">
                                    ✨ Semua siswa sudah dinilai!
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <Link href={route('tahfidz.assessments.students', { active_subject: activeSubject.id, grade_weight: gradeWeight.id })}>
                                    <button className="w-full h-12 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors">
                                        Kembali ke Daftar
                                    </button>
                                </Link>
                                <Link href={route('dashboard')}>
                                    <button className="w-full h-12 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                        Menu Utama
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const currentData = allAnswers[activeQuestion] || {};
    const filteredSurahs = currentData.selectedJuz && currentData.selectedJuz !== 'all' && JUZ_MAPPING[currentData.selectedJuz]
        ? JUZ_MAPPING[currentData.selectedJuz]
        : SURAHS;

    // ── Main Render ───────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <Head title="Input Penilaian Tahfidz" />
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
                    isLocked={isLocked}
                />
            )}

            <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 ${showValidation ? 'pb-32' : 'pb-6'}`}>

                {/* ── Sticky Header ──────────────────────────────────────── */}
                <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-lg">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Link href={route('tahfidz.assessments.students', { active_subject: activeSubject.id, grade_weight: gradeWeight.id })}
                                    className="text-emerald-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-sm">
                                    <ChevronLeft className="h-4 w-4" /> Kembali
                                </Link>
                                <div className="h-5 w-px bg-emerald-700" />
                                <div className="min-w-0">
                                    <div className="font-bold text-base leading-tight">Ujian {gradeWeight?.name || ''}</div>
                                    <div className="text-emerald-300 text-xs truncate">
                                        {student?.name} ({student?.nomor_induk || student?.nisn || '-'})
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs text-emerald-300">Nilai Preview</div>
                                <div className="text-2xl font-extrabold text-white">
                                    {grade?.score || totalPredictedScore.toFixed(0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Question Tabs + Selectors ─────────────────────── */}
                    {!(isValidasiMode && !hasEligibleJuz) && (
                        <div className="border-t border-emerald-700/50 bg-emerald-900/40">
                            <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
                                {/* Question Tabs */}
                                <div className="flex items-center gap-1 mr-2">
                                    {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qn => {
                                        const q = allAnswers[qn];
                                        const reviewed = q?.is_reviewed;
                                        const isActive = activeQuestion === qn;
                                        return (
                                            <button
                                                key={qn}
                                                onClick={() => setActiveQuestion(qn)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                                                        ? 'bg-white text-emerald-900 shadow'
                                                        : reviewed
                                                            ? 'bg-emerald-600/60 text-emerald-100 hover:bg-emerald-600'
                                                            : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                                                    }`}
                                            >
                                                {reviewed && !isActive && <CheckIcon className="h-3 w-3" />}
                                                Soal {qn}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Juz Selector */}
                                <Select
                                    value={currentData.selectedJuz}
                                    onValueChange={val => updateAnswer(activeQuestion, 'selectedJuz', val)}
                                    disabled={isLocked}
                                >
                                    <SelectTrigger className="h-7 text-xs bg-emerald-900 border-emerald-600 text-white focus:ring-emerald-400 w-[90px]">
                                        <SelectValue placeholder="Juz" />
                                    </SelectTrigger>
                                    <SelectContent className="h-60">
                                        {!isValidasiMode && <SelectItem value="all">Semua Juz</SelectItem>}
                                        {isValidasiMode
                                            ? eligibleValidationJuz.map(j => <SelectItem key={j} value={j.toString()}>Juz {j}</SelectItem>)
                                            : Array.from({ length: 30 }, (_, i) => i + 1).map(j => <SelectItem key={j} value={j.toString()}>Juz {j}</SelectItem>)
                                        }
                                    </SelectContent>
                                </Select>

                                {/* Surah Selector */}
                                <Select
                                    value={currentData.surah_name}
                                    onValueChange={val => updateAnswer(activeQuestion, 'surah_name', val)}
                                    disabled={isLocked}
                                >
                                    <SelectTrigger className="h-7 text-xs bg-emerald-900 border-emerald-600 text-white focus:ring-emerald-400 w-[130px]">
                                        <SelectValue placeholder="Surat" />
                                    </SelectTrigger>
                                    <SelectContent className="h-60">
                                        {filteredSurahs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Ayat input + Validasi Batas Juz */}
                                {(() => {
                                    const juzErr = validateJuzAyat(
                                        currentData.selectedJuz,
                                        currentData.surah_name,
                                        currentData.verse_start
                                    );
                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Ayat"
                                                value={currentData.verse_start}
                                                onChange={e => updateAnswer(activeQuestion, 'verse_start', e.target.value)}
                                                disabled={isLocked}
                                                className={`h-7 text-xs w-[70px] bg-emerald-900 border text-white placeholder:text-emerald-500 focus:ring-emerald-400 ${
                                                    juzErr ? 'border-red-400 ring-1 ring-red-400' : 'border-emerald-600'
                                                }`}
                                            />
                                            {juzErr && (
                                                <div className="absolute mt-8 z-50 w-64 bg-red-600 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                                                    ⚠️ {juzErr}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Kesalahan + Nilai */}
                                <div className="flex items-center gap-3 ml-auto">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-400 text-[10px] uppercase font-bold">Kesalahan</span>
                                        <span className="text-xl font-bold text-red-400">{currentData.mistakes || 0}</span>
                                    </div>
                                    <div className="h-4 w-px bg-emerald-700" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-400 text-[10px] uppercase font-bold">Nilai</span>
                                        <span className="text-xl font-bold text-white">
                                            {Math.max(0, 10 - (currentData.mistakes || 0)) * 10}
                                        </span>
                                    </div>
                                    {/* Quick reset */}
                                    {!isLocked && currentData.mistakes > 0 && (
                                        <button
                                            onClick={() => { updateAnswer(activeQuestion, 'mistakes', 0); updateAnswer(activeQuestion, 'is_reviewed', false); }}
                                            className="text-emerald-400 hover:text-white text-[10px] flex items-center gap-0.5 transition-colors"
                                            title="Reset kesalahan"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Locked / Blocker Banners ────────────────────────────── */}
                <div className="max-w-5xl mx-auto px-4 mt-3 space-y-2">
                    {isLocked && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span><strong>Masa Ujian Berakhir.</strong> Input nilai terkunci. Hubungi Administrator jika perlu perubahan.</span>
                        </div>
                    )}
                    {isValidasiMode && !hasEligibleJuz && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span><strong>Tidak Dapat Melakukan Validasi.</strong> Siswa tidak memiliki hafalan lebih yang menunggu validasi.</span>
                        </div>
                    )}
                    {!(isValidasiMode && !hasEligibleJuz) && !currentData.surah_name && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            <span>Pilih <strong>Juz, Surat & Ayat Awal</strong> di atas, lalu klik ayat pada teks Al-Quran untuk menginput kesalahan.</span>
                        </div>
                    )}
                </div>

                {/* ── Quran Content (Full Width) ──────────────────────────── */}
                {!(isValidasiMode && !hasEligibleJuz) && (
                    <div className="max-w-5xl mx-auto px-4 mt-3">
                        <div style={{ height: 'calc(100vh - 190px)' }}>
                            <QuranPageViewer
                                selectedJuz={currentData.selectedJuz}
                                surahName={currentData.surah_name}
                                verseStart={currentData.verse_start}
                                inline={true}
                                onAyahClick={isLocked ? null : handleAyahClick}
                            />
                        </div>
                    </div>
                )}

                {/* ── Validation Section ──────────────────────────────────── */}
                {showValidation && (
                    <form onSubmit={handleSubmit}>
                        <div className="max-w-5xl mx-auto px-4 mt-6 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                                <div className="relative flex justify-center">
                                    <span className="bg-gray-100 px-4 text-base font-semibold text-gray-700 ring-4 ring-gray-100 rounded-full">
                                        Validasi Akhir
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                                <h3 className="font-bold text-gray-900">Keterangan Bacaan</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {[
                                        { val: 'bagus', label: 'Bagus / Lancar', color: 'green' },
                                        { val: 'kurang', label: 'Kurang / Ada Catatan', color: 'amber' }
                                    ].map(({ val, label, color }) => (
                                        <div key={val}
                                            onClick={() => { if (!isLocked) { setReadingQuality(val); if (val === 'bagus') setDeficiencies([]); } }}
                                            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${readingQuality === val
                                                    ? `border-${color}-500 bg-${color}-50 ring-2 ring-${color}-200`
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${readingQuality === val ? `border-${color}-600` : 'border-gray-400'}`}>
                                                    {readingQuality === val && <div className={`w-3 h-3 bg-${color}-600 rounded-full`} />}
                                                </div>
                                                <span className="font-bold text-gray-800">{label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {readingQuality === 'kurang' && (
                                    <div className="animate-in fade-in duration-300">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Ceklist Kekurangan:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {DEFICIENCY_OPTIONS.map((opt, idx) => (
                                                <div key={idx}
                                                    onClick={() => toggleDeficiency(opt)}
                                                    className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${deficiencies.includes(opt) ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-gray-50 border-gray-200 hover:bg-white'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${deficiencies.includes(opt) ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-400'}`}>
                                                        {deficiencies.includes(opt) && <CheckIcon className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium">{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Remedial */}
                                {grade?.score !== null && grade?.score !== undefined && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <input type="checkbox" id="remedial"
                                            checked={isRemedial}
                                            disabled={isLocked}
                                            onChange={e => setIsRemedial(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded disabled:opacity-50" />
                                        <label htmlFor="remedial" className={`text-sm ${grade?.score >= kkm ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Mode Remedial (Maks {kkm})
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Submit */}
                        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-xl px-4 py-3">
                            <div className="max-w-5xl mx-auto">
                                <button
                                    type="submit"
                                    disabled={processing || isLocked}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base shadow-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLocked ? <><Lock className="h-5 w-5" /> Terkunci</> : <><Save className="h-5 w-5" /> {processing ? 'Menyimpan...' : 'Simpan Penilaian'}</>}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Info untuk melengkapi semua soal */}
                {!showValidation && !(isValidasiMode && !hasEligibleJuz) && (
                    <div className="max-w-5xl mx-auto px-4 mt-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qn => {
                                const q = allAnswers[qn];
                                return (
                                    <div key={qn} className={`text-xs px-3 py-1.5 rounded-full font-medium ${q?.is_reviewed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {q?.is_reviewed ? '✓' : '○'} Soal {qn}
                                    </div>
                                );
                            })}
                            <div className="text-xs text-gray-400 py-1.5">
                                — Klik ayat pada teks Al-Quran untuk menilai
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
