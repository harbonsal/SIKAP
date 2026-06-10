import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { ChevronLeft, ChevronRight, BookOpen, Search, Loader2, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Lock, RotateCcw, PlayCircle, Eye, EyeOff, Settings } from 'lucide-react';
import { estimatePageFromSurahAyah, JUZ_TO_PAGE } from '@/Services/quranApi';
import axios from 'axios';

// ─── Ayat Popup Menu ──────────────────────────────────────────────────────────
function AyatPopup({ verseKey, verseText, pos, onClose, onPlay, onSkrining }) {
    const [surahNum, ayahNum] = (verseKey || '').split(':');

    // Dismiss on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!verseKey) return null;

    // Clamp position so popup doesn't go off-screen
    const style = {
        position: 'fixed',
        top: Math.min(pos.y, window.innerHeight - 220),
        left: Math.max(8, Math.min(pos.x - 100, window.innerWidth - 220)),
        zIndex: 9999,
    };

    return (
        <div style={style}
            data-ayat-popup
            className="bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden w-52 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-2.5 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">
                    Surah {surahNum} : Ayat {ayahNum}
                </span>
                <button onClick={onClose} className="text-emerald-300 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Preview teks Arab */}
            <div className="px-3 py-2 border-b border-stone-100 text-right">
                <p className="text-stone-700 text-sm leading-relaxed line-clamp-2"
                    style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }}>
                    {verseText}
                </p>
            </div>

            {/* 2 Opsi Utama */}
            <div className="py-1">
                {/* Lanjut Baca: resume audio */}
                <button onClick={() => { onPlay(); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-50 transition-colors text-left border-b border-stone-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Play className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-stone-800 text-sm">Lanjut Baca</p>
                        <p className="text-xs text-stone-400">Lanjutkan bacaan Qari</p>
                    </div>
                </button>

                {/* Skrining Hafalan: buka modal */}
                {onSkrining && (
                    <button onClick={() => { onSkrining(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-violet-50 hover:text-violet-700 transition-colors text-left">
                        <div className="flex-shrink-0 w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-violet-600 text-sm">📝</span>
                        </div>
                        <div>
                            <p className="font-semibold text-stone-800 text-sm">Skrining Hafalan</p>
                            <p className="text-xs text-stone-400">Catat kesalahan hafalan Anda</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Surah Data ───────────────────────────────────────────────────────────────
const SURAH_LIST = [
    { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", ayahs: 7 },
    { number: 2, name: "Al-Baqarah", arabic: "البقرة", ayahs: 286 },
    { number: 3, name: "Ali 'Imran", arabic: "آل عمران", ayahs: 200 },
    { number: 4, name: "An-Nisa'", arabic: "النساء", ayahs: 176 },
    { number: 5, name: "Al-Ma'idah", arabic: "المائدة", ayahs: 120 },
    { number: 6, name: "Al-An'am", arabic: "الأنعام", ayahs: 165 },
    { number: 7, name: "Al-A'raf", arabic: "الأعراف", ayahs: 206 },
    { number: 8, name: "Al-Anfal", arabic: "الأنفال", ayahs: 75 },
    { number: 9, name: "At-Taubah", arabic: "التوبة", ayahs: 129 },
    { number: 10, name: "Yunus", arabic: "يونس", ayahs: 109 },
    { number: 11, name: "Hud", arabic: "هود", ayahs: 123 },
    { number: 12, name: "Yusuf", arabic: "يوسف", ayahs: 111 },
    { number: 13, name: "Ar-Ra'd", arabic: "الرعد", ayahs: 43 },
    { number: 14, name: "Ibrahim", arabic: "إبراهيم", ayahs: 52 },
    { number: 15, name: "Al-Hijr", arabic: "الحجر", ayahs: 99 },
    { number: 16, name: "An-Nahl", arabic: "النحل", ayahs: 128 },
    { number: 17, name: "Al-Isra'", arabic: "الإسراء", ayahs: 111 },
    { number: 18, name: "Al-Kahf", arabic: "الكهف", ayahs: 110 },
    { number: 19, name: "Maryam", arabic: "مريم", ayahs: 98 },
    { number: 20, name: "Taha", arabic: "طه", ayahs: 135 },
    { number: 21, name: "Al-Anbiya'", arabic: "الأنبياء", ayahs: 112 },
    { number: 22, name: "Al-Hajj", arabic: "الحج", ayahs: 78 },
    { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", ayahs: 118 },
    { number: 24, name: "An-Nur", arabic: "النور", ayahs: 64 },
    { number: 25, name: "Al-Furqan", arabic: "الفرقان", ayahs: 77 },
    { number: 26, name: "Ash-Shu'ara'", arabic: "الشعراء", ayahs: 227 },
    { number: 27, name: "An-Naml", arabic: "النمل", ayahs: 93 },
    { number: 28, name: "Al-Qasas", arabic: "القصص", ayahs: 88 },
    { number: 29, name: "Al-Ankabut", arabic: "العنكبوت", ayahs: 69 },
    { number: 30, name: "Ar-Rum", arabic: "الروم", ayahs: 60 },
    { number: 31, name: "Luqman", arabic: "لقمان", ayahs: 34 },
    { number: 32, name: "As-Sajdah", arabic: "السجدة", ayahs: 30 },
    { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", ayahs: 73 },
    { number: 34, name: "Saba'", arabic: "سبأ", ayahs: 54 },
    { number: 35, name: "Fatir", arabic: "فاطر", ayahs: 45 },
    { number: 36, name: "Ya Sin", arabic: "يس", ayahs: 83 },
    { number: 37, name: "As-Saffat", arabic: "الصافات", ayahs: 182 },
    { number: 38, name: "Sad", arabic: "ص", ayahs: 88 },
    { number: 39, name: "Az-Zumar", arabic: "الزمر", ayahs: 75 },
    { number: 40, name: "Ghafir", arabic: "غافر", ayahs: 85 },
    { number: 41, name: "Fussilat", arabic: "فصلت", ayahs: 54 },
    { number: 42, name: "Ash-Shura", arabic: "الشورى", ayahs: 53 },
    { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", ayahs: 89 },
    { number: 44, name: "Ad-Dukhan", arabic: "الدخان", ayahs: 59 },
    { number: 45, name: "Al-Jathiyah", arabic: "الجاثية", ayahs: 37 },
    { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", ayahs: 35 },
    { number: 47, name: "Muhammad", arabic: "محمد", ayahs: 38 },
    { number: 48, name: "Al-Fath", arabic: "الفتح", ayahs: 29 },
    { number: 49, name: "Al-Hujurat", arabic: "الحجرات", ayahs: 18 },
    { number: 50, name: "Qaf", arabic: "ق", ayahs: 45 },
    { number: 51, name: "Adh-Dhariyat", arabic: "الذاريات", ayahs: 60 },
    { number: 52, name: "At-Tur", arabic: "الطور", ayahs: 49 },
    { number: 53, name: "An-Najm", arabic: "النجم", ayahs: 62 },
    { number: 54, name: "Al-Qamar", arabic: "القمر", ayahs: 55 },
    { number: 55, name: "Ar-Rahman", arabic: "الرحمن", ayahs: 78 },
    { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", ayahs: 96 },
    { number: 57, name: "Al-Hadid", arabic: "الحديد", ayahs: 29 },
    { number: 58, name: "Al-Mujadila", arabic: "المجادلة", ayahs: 22 },
    { number: 59, name: "Al-Hashr", arabic: "الحشر", ayahs: 24 },
    { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", ayahs: 13 },
    { number: 61, name: "As-Saff", arabic: "الصف", ayahs: 14 },
    { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", ayahs: 11 },
    { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", ayahs: 11 },
    { number: 64, name: "At-Taghabun", arabic: "التغابن", ayahs: 18 },
    { number: 65, name: "At-Talaq", arabic: "الطلاق", ayahs: 12 },
    { number: 66, name: "At-Tahrim", arabic: "التحريم", ayahs: 12 },
    { number: 67, name: "Al-Mulk", arabic: "الملك", ayahs: 30 },
    { number: 68, name: "Al-Qalam", arabic: "القلم", ayahs: 52 },
    { number: 69, name: "Al-Haqqah", arabic: "الحاقة", ayahs: 52 },
    { number: 70, name: "Al-Ma'arij", arabic: "المعارج", ayahs: 44 },
    { number: 71, name: "Nuh", arabic: "نوح", ayahs: 28 },
    { number: 72, name: "Al-Jinn", arabic: "الجن", ayahs: 28 },
    { number: 73, name: "Al-Muzzammil", arabic: "المزمل", ayahs: 20 },
    { number: 74, name: "Al-Muddathir", arabic: "المدثر", ayahs: 56 },
    { number: 75, name: "Al-Qiyamah", arabic: "القيامة", ayahs: 40 },
    { number: 76, name: "Al-Insan", arabic: "الإنسان", ayahs: 31 },
    { number: 77, name: "Al-Mursalat", arabic: "المرسلات", ayahs: 50 },
    { number: 78, name: "An-Naba'", arabic: "النبأ", ayahs: 40 },
    { number: 79, name: "An-Nazi'at", arabic: "النازعات", ayahs: 46 },
    { number: 80, name: "Abasa", arabic: "عبس", ayahs: 42 },
    { number: 81, name: "At-Takwir", arabic: "التكوير", ayahs: 29 },
    { number: 82, name: "Al-Infitar", arabic: "الانفطار", ayahs: 19 },
    { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", ayahs: 36 },
    { number: 84, name: "Al-Inshiqaq", arabic: "الانشقاق", ayahs: 25 },
    { number: 85, name: "Al-Buruj", arabic: "البروج", ayahs: 22 },
    { number: 86, name: "At-Tariq", arabic: "الطارق", ayahs: 17 },
    { number: 87, name: "Al-A'la", arabic: "الأعلى", ayahs: 19 },
    { number: 88, name: "Al-Ghashiyah", arabic: "الغاشية", ayahs: 26 },
    { number: 89, name: "Al-Fajr", arabic: "الفجر", ayahs: 30 },
    { number: 90, name: "Al-Balad", arabic: "البلد", ayahs: 20 },
    { number: 91, name: "Ash-Shams", arabic: "الشمس", ayahs: 15 },
    { number: 92, name: "Al-Lail", arabic: "الليل", ayahs: 21 },
    { number: 93, name: "Ad-Duha", arabic: "الضحى", ayahs: 11 },
    { number: 94, name: "Ash-Sharh", arabic: "الشرح", ayahs: 8 },
    { number: 95, name: "At-Tin", arabic: "التين", ayahs: 8 },
    { number: 96, name: "Al-Alaq", arabic: "العلق", ayahs: 19 },
    { number: 97, name: "Al-Qadr", arabic: "القدر", ayahs: 5 },
    { number: 98, name: "Al-Bayyinah", arabic: "البينة", ayahs: 8 },
    { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", ayahs: 8 },
    { number: 100, name: "Al-Adiyat", arabic: "العاديات", ayahs: 11 },
    { number: 101, name: "Al-Qari'ah", arabic: "القارعة", ayahs: 11 },
    { number: 102, name: "At-Takathur", arabic: "التكاثر", ayahs: 8 },
    { number: 103, name: "Al-Asr", arabic: "العصر", ayahs: 3 },
    { number: 104, name: "Al-Humazah", arabic: "الهمزة", ayahs: 9 },
    { number: 105, name: "Al-Fil", arabic: "الفيل", ayahs: 5 },
    { number: 106, name: "Quraish", arabic: "قريش", ayahs: 4 },
    { number: 107, name: "Al-Ma'un", arabic: "الماعون", ayahs: 7 },
    { number: 108, name: "Al-Kawthar", arabic: "الكوثر", ayahs: 3 },
    { number: 109, name: "Al-Kafirun", arabic: "الكافرون", ayahs: 6 },
    { number: 110, name: "An-Nasr", arabic: "النصر", ayahs: 3 },
    { number: 111, name: "Al-Lahab", arabic: "المسد", ayahs: 5 },
    { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", ayahs: 4 },
    { number: 113, name: "Al-Falaq", arabic: "الفلق", ayahs: 5 },
    { number: 114, name: "An-Nas", arabic: "الناس", ayahs: 6 },
];

// ─── Juz → Surah Mapping ──────────────────────────────────────────────────────
const JUZ_SURAH_MAP = {
    1: [1, 2], 2: [2], 3: [2, 3],
    4: [3, 4], 5: [4], 6: [4, 5],
    7: [5, 6], 8: [6, 7], 9: [7, 8],
    10: [8, 9], 11: [9, 10], 12: [11, 12],
    13: [12, 13, 14, 15], 14: [15, 16], 15: [17, 18],
    16: [18, 19, 20], 17: [21, 22], 18: [23, 24, 25],
    19: [25, 26, 27], 20: [27, 28, 29], 21: [29, 30, 31, 32, 33],
    22: [33, 34, 35, 36], 23: [36, 37, 38, 39], 24: [39, 40, 41],
    25: [41, 42, 43, 44, 45, 46], 26: [46, 47, 48, 49, 50, 51],
    27: [51, 52, 53, 54, 55, 56, 57],
    28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
    29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
    30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
        93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
        106, 107, 108, 109, 110, 111, 112, 113, 114],
};

// ─── Reciters ─────────────────────────────────────────────────────────────────
const RECITERS = [
    { id: 'Alafasy_128kbps', name: 'Mishary Rashid Al-Afasy' },
    { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit Abd us-Samad (Murattal)' },
    { id: 'Abdul_Basit_Mujawwad_128kbps', name: 'Abdul Basit Abd us-Samad (Mujawwad)' },
    { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
    { id: 'Minshawi_Murattal_128kbps', name: 'Mohamed Siddiq El-Minshawi' },
    { id: 'Muhammad_Jibreel_128kbps', name: 'Muhammad Jibreel' },
    { id: 'Maher_AlMuaiqly_128kbps', name: 'Maher Al-Muaiqly' },
    { id: 'Saood_ash-Shuraym_128kbps', name: 'Saood Ash-Shuraym (Saud Al-Shuraim)' },
    { id: 'Hani_Rifai_192kbps', name: 'Hani Ar-Rifai' },
    { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Ash-Shaatree' },
    { id: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', name: 'Abdullah Awad Al-Juhani' },
    { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser Ad-Dussary' },
    { id: 'f.jaleel', name: 'Fares Abbad (Al-Jaleel)' },
    { id: 'Nasser_Alqatami_128kbps', name: 'Nasser Al-Qatami' },
    { id: 'Ibrahim_Al-Akhdar_128kbps', name: 'Ibrahim Al-Akhdar' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_BASE = 'https://api.quran.com/api/v4';

/** Build everyayah.com MP3 URL */
function getAudioUrl(surahNum, ayahNum, reciterId) {
    const s = String(surahNum).padStart(3, '0');
    const a = String(ayahNum).padStart(3, '0');
    return `https://everyayah.com/data/${reciterId}/${s}${a}.mp3`;
}

function toArabicNumber(n) {
    return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);
// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Skrining Hafalan Modal ───────────────────────────────────────────────────
function SkriningModal({ verseKey, verseText, pageNumber, juzNumber, onClose, onSaved }) {
    const [surahNum, ayahNum] = (verseKey || '').split(':');
    const words = (verseText || '').split(' ').filter(Boolean);

    const [selectedWordIdxs, setSelectedWordIdxs] = React.useState([]);
    const [hafalanSalah, setHafalanSalah] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [savedMsg, setSavedMsg] = React.useState('');
    const [error, setError] = React.useState('');

    const toggleWord = (idx) => {
        setSelectedWordIdxs(prev =>
            prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
        );
    };

    const kataBenar = words.filter((_, i) => selectedWordIdxs.includes(i)).join(' ');

    const handleSave = async () => {
        if (!kataBenar.trim()) { setError('Pilih kata yang benar terlebih dahulu.'); return; }
        if (!hafalanSalah.trim()) { setError('Tulis hafalan Anda yang salah.'); return; }
        setError('');
        setSaving(true);
        try {
            const res = await axios.post('/hafalan-skrining', {
                surah_number: parseInt(surahNum),
                ayat_number: parseInt(ayahNum),
                verse_key: verseKey,
                full_ayat_text: verseText,
                kata_benar: kataBenar,
                hafalan_salah: hafalanSalah.trim(),
                juz_number: juzNumber || null,
                page_number: pageNumber || null,
            });
            if (res.data.success) {
                setSavedMsg('Skrining berhasil disimpan!');
                setTimeout(() => { onSaved && onSaved(); onClose(); }, 1500);
            } else {
                setError(res.data.message || 'Gagal menyimpan.');
            }
        } catch (err) {
            if (err.response && err.response.status === 419) {
                setError('Sesi login habis. Muat ulang halaman lalu coba simpan lagi.');
            } else if (err.response && err.response.data && err.response.data.errors) {
                const firstError = Object.values(err.response.data.errors)[0]?.[0] || 'Gagal menyimpan.';
                setError(firstError);
            } else {
                setError('Terjadi kesalahan koneksi.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (!verseKey) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-700 to-violet-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-white font-bold text-base">Skrining Hafalan Mandiri</h3>
                        <p className="text-violet-200 text-xs mt-0.5">Surah {surahNum} Ayat {ayahNum}</p>
                    </div>
                    <button onClick={onClose} className="text-violet-300 hover:text-white transition-colors">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    <p className="text-sm text-stone-600 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                        Ketuk kata-kata yang <strong>benar</strong> dari ayat ini yang keliru Anda hafalkan:
                    </p>

                    {/* Word-by-word ayat selector */}
                    <div className="text-right p-3 bg-amber-50 border border-amber-200 rounded-xl leading-loose" style={{ direction: 'rtl' }}>
                        {words.map((word, idx) => {
                            const sel = selectedWordIdxs.includes(idx);
                            return (
                                <span key={idx} onClick={() => toggleWord(idx)}
                                    className={`inline-block mx-1 my-0.5 px-2 py-0.5 rounded-lg cursor-pointer select-none transition-all text-xl border-2 ${sel ? 'bg-violet-600 text-white border-violet-700 shadow-md'
                                        : 'bg-white text-stone-800 border-stone-200 hover:border-violet-400 hover:bg-violet-50'
                                        }`}
                                    style={{ fontFamily: "'Amiri Quran', serif" }}
                                >{word}</span>
                            );
                        })}
                    </div>

                    {/* Selected kata benar */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">
                            Kata/Bagian yang Benar <span className="text-violet-500">(dari pilihan di atas)</span>
                        </label>
                        <div className={`rounded-lg border px-3 py-2 text-right min-h-[42px] ${kataBenar ? 'bg-violet-50 border-violet-300' : 'bg-stone-50 border-stone-200'}`}
                            style={{ fontFamily: "'Amiri Quran', serif", fontSize: '1.15rem', direction: 'rtl' }}>
                            {kataBenar || <span className="text-stone-400 text-xs" style={{ fontFamily: 'sans-serif' }}>Belum ada kata dipilih...</span>}
                        </div>
                    </div>

                    {/* Hafalan salah */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1">Hafalan Saya yang Salah</label>
                        <textarea value={hafalanSalah} onChange={e => setHafalanSalah(e.target.value)}
                            placeholder="Tulis bacaan Anda yang keliru di sini..."
                            rows={2}
                            className="w-full rounded-lg border border-stone-300 focus:border-violet-400 focus:ring-1 focus:ring-violet-300 outline-none px-3 py-2 text-sm resize-none text-right"
                            style={{ fontFamily: "'Amiri Quran', serif", fontSize: '1.15rem', direction: 'rtl' }}
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs text-center bg-red-50 rounded-lg py-1.5">{error}</p>}
                    {savedMsg && <p className="text-emerald-600 text-sm text-center font-semibold bg-emerald-50 rounded-lg py-1.5">{savedMsg}</p>}

                    <div className="flex gap-3 pt-1">
                        <button onClick={onClose}
                            className="flex-1 border border-stone-300 hover:border-stone-400 text-stone-600 text-sm font-medium py-2.5 rounded-xl transition-colors">
                            Batal
                        </button>
                        <button onClick={handleSave} disabled={saving || !kataBenar || !hafalanSalah.trim()}
                            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow">
                            {saving ? 'Menyimpan...' : 'Simpan Skrining'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function QuranIndex({ allowed_juz = null, quran_progress = {}, is_admin = false, hidden_qori_ids = [], skrining_disabled = false, skrining_disabled_message = '' }) {
    // ── Page state
    const [pageNumber, setPageNumber] = useState(1);
    const [inputPage, setInputPage] = useState("1");
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Finish Juz state
    const [isFinishingJuz, setIsFinishingJuz] = useState(false);
    const [finishJuzMessage, setFinishJuzMessage] = useState(null);
    const [juzPlaybackCompleted, setJuzPlaybackCompleted] = useState(false);

    // ── Selector state
    const [selectedJuz, setSelectedJuz] = useState("");

    const selectedJuzRef = useRef(selectedJuz);
    const pageNumberRef = useRef(pageNumber);

    useEffect(() => { selectedJuzRef.current = selectedJuz; }, [selectedJuz]);
    useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

    // ── Audio state
    const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
    const [hiddenQoriIds, setHiddenQoriIds] = useState(Array.isArray(hidden_qori_ids) ? hidden_qori_ids : []);
    const [showManageModal, setShowManageModal] = useState(false);
    const [playingKey, setPlayingKey] = useState(null);  // "surah:ayah"
    const [isPlaying, setIsPlaying] = useState(false);
    const [playQueue, setPlayQueue] = useState([]);    // [{surah, ayah, key}]
    const [queueIndex, setQueueIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);

    const audioRef = useRef(null);
    const abortRef = useRef(null);
    const playQueueRef = useRef([]);    // stable ref for onended closure
    const queueIdxRef = useRef(0);
    const shouldPlayRef = useRef(false); // user intent: true=playing
    const isMutedRef = useRef(false);
    const playIdxRef = useRef(null);   // latest playIdx for stable closure
    const autoPlayNextPage = useRef(false);
    const queueModeRef = useRef('page'); // page | single
    const lastPlayedKeyRef = useRef(null); // track last playing ayah for resume
    const playedAyahKeysRef = useRef(new Set()); // ayah yang sudah pernah diputar pada mode Juz aktif
    const playbackProgressRef = useRef({});

    // ── Block/select state
    const [blockedAyah, setBlockedAyah] = useState(null);  // verse_key
    const [blockedText, setBlockedText] = useState('');
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const [skriningVerse, setSkriningVerse] = useState(null); // { verseKey, verseText }

    // ── Resume Dialog
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const autoResumeOnLoadRef = useRef(null);

    // ── Dismiss popup on outside click
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('[data-ayat-popup]') && !e.target.closest('[data-ayat-badge]')) {
                setBlockedAyah(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Filtered surah list by juz
    const filteredSurahList = selectedJuz
        ? SURAH_LIST.filter(s => (JUZ_SURAH_MAP[parseInt(selectedJuz)] || []).includes(s.number))
        : SURAH_LIST;

    const availableReciters = RECITERS.filter(r => is_admin || !hiddenQoriIds.includes(r.id));

    useEffect(() => {
        if (availableReciters.length === 0) return;
        if (!availableReciters.some(r => r.id === selectedReciter)) {
            setSelectedReciter(availableReciters[0].id);
        }
    }, [availableReciters, selectedReciter]);

    // ── Initialize progress state from props ────────────────────────────────────
    useEffect(() => {
        if (quran_progress && Object.keys(quran_progress).length > 0) {
            playbackProgressRef.current = quran_progress;
        }
    }, [quran_progress]);

    // ── Audio engine ──────────────────────────────────────────────────────────
    const persistPlayedProgress = useCallback((verseKey, surahNum, juzNum, pageNum = null) => {
        if (!verseKey || !Number.isInteger(surahNum) || !Number.isInteger(juzNum)) return;

        // Optimistically update ref
        const juzKey = String(juzNum);
        const currentJuzProgress = playbackProgressRef.current[juzKey] || { played_ayahs: [] };

        let newPlayedAyahs = currentJuzProgress.played_ayahs || [];
        if (!newPlayedAyahs.includes(verseKey)) {
            newPlayedAyahs = [...newPlayedAyahs, verseKey];
        }

        const nextProgress = {
            ...playbackProgressRef.current,
            [juzKey]: {
                ...currentJuzProgress,
                last_verse_key: verseKey,
                last_page_number: pageNum,
                played_ayahs: newPlayedAyahs
            }
        };
        playbackProgressRef.current = nextProgress;

        // Send to API
        axios.post('/quran/progress', {
            juz_number: juzNum,
            last_verse_key: verseKey,
            last_page_number: pageNum,
            played_ayahs: [verseKey] // backend will array_merge
        }).catch(() => {
            // Silently fail for progress saving to not interrupt playback
        });
    }, []);

    const stopAudio = useCallback(() => {
        shouldPlayRef.current = false;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
        }
        setIsPlaying(false);
        setPlayingKey(null);
        setAudioProgress(0);
    }, []);

    // Core play-by-index function (uses refs — no stale closure issue)
    const playIdx = useCallback((idx) => {
        const queue = playQueueRef.current;
        if (!queue[idx]) {
            // End of queue
            if (shouldPlayRef.current && selectedJuzRef.current && queueModeRef.current === 'page') {
                const currentJuz = parseInt(selectedJuzRef.current);
                const nextJuzStartPage = JUZ_TO_PAGE[currentJuz + 1] || 605;
                const currentPage = parseInt(pageNumberRef.current, 10);
                if (currentPage < nextJuzStartPage - 1) {
                    autoPlayNextPage.current = true;
                    setPageNumber(prev => parseInt(prev, 10) + 1);
                    return; // Retain playing state for next page
                } else {
                    setJuzPlaybackCompleted(true);
                }
            }

            shouldPlayRef.current = false;
            setIsPlaying(false);
            setPlayingKey(null);
            // keep lastPlayedKeyRef so we can resume
            setAudioProgress(0);
            return;
        }
        const { surah, ayah, juz } = queue[idx];
        queueIdxRef.current = idx;
        setQueueIndex(idx);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
        }

        const audio = new Audio(getAudioUrl(surah, ayah, selectedReciter));
        audioRef.current = audio;
        audio.muted = isMutedRef.current;

        audio.ontimeupdate = () =>
            setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);

        // Use playIdxRef so we always call the LATEST version even after reciter change
        audio.onended = () => {
            if (shouldPlayRef.current) {
                playIdxRef.current?.(queueIdxRef.current + 1);
            }
        };

        audio.onerror = () => {
            // Skip bad audio files, continue queue
            if (shouldPlayRef.current) {
                setTimeout(() => playIdxRef.current?.(queueIdxRef.current + 1), 300);
            } else {
                setIsPlaying(false);
                setPlayingKey(null);
            }
        };

        audio.play().catch(() => { });
        const currentKey = `${surah}:${ayah}`;
        setPlayingKey(currentKey);
        lastPlayedKeyRef.current = currentKey;
        const selectedJuzNum = parseInt(selectedJuzRef.current, 10);
        const resolvedJuz = Number.isInteger(juz)
            ? juz
            : (Number.isInteger(selectedJuzNum) ? selectedJuzNum : null);
        if (resolvedJuz) {
            playedAyahKeysRef.current.add(currentKey);
            persistPlayedProgress(currentKey, surah, resolvedJuz, pageNumberRef.current);
        }
        setIsPlaying(true);
        shouldPlayRef.current = true;
        setAudioProgress(0);
    }, [persistPlayedProgress, selectedReciter]);

    // Keep ref always pointing to latest playIdx (fixes stale closure in onended)
    useEffect(() => { playIdxRef.current = playIdx; }, [playIdx]);

    // Play a specific ayah — find in current queue or create single-item queue
    const playAyah = useCallback((surahNum, ayahNum) => {
        const verseKey = `${surahNum}:${ayahNum}`;

        // Prefer queue from currently visible page so "Lanjut Baca" continues naturally.
        const visibleIdx = verses.findIndex(v => v.verse_key === verseKey);
        if (visibleIdx >= 0) {
            const q = verses.map(v => {
                const [sn, an] = v.verse_key.split(':').map(Number);
                return { surah: sn, ayah: an, key: v.verse_key, juz: v.juz_number ?? null };
            });
            queueModeRef.current = 'page';
            playQueueRef.current = q;
            queueIdxRef.current = visibleIdx;
            setPlayQueue(q);
            setQueueIndex(visibleIdx);
            playIdx(visibleIdx);
            return;
        }

        // Fallback for ayah outside current page.
        const selectedJuzNum = parseInt(selectedJuzRef.current, 10);
        const resolvedJuz = Number.isInteger(selectedJuzNum) ? selectedJuzNum : null;
        const q = [{ surah: surahNum, ayah: ayahNum, key: verseKey, juz: resolvedJuz }];
        queueModeRef.current = 'single';
        playQueueRef.current = q;
        setPlayQueue(q);
        setQueueIndex(0);
        playIdx(0);
    }, [playIdx, verses]);

    // Build queue from visible verses and start playing
    const buildAndPlay = useCallback((startKey = null) => {
        let pool = [...verses];
        if (!pool.length) pool = verses;

        const queue = pool.map(v => {
            const [sn, an] = v.verse_key.split(':').map(Number);
            return { surah: sn, ayah: an, key: v.verse_key, juz: v.juz_number ?? null };
        });

        let startIdx = 0;
        if (startKey) {
            const idx = queue.findIndex(q => q.key === startKey);
            if (idx >= 0) startIdx = idx;
        } else if (lastPlayedKeyRef.current) {
            const idx = queue.findIndex(q => q.key === lastPlayedKeyRef.current);
            if (idx >= 0) startIdx = idx;
        }

        queueModeRef.current = 'page';
        playQueueRef.current = queue;
        queueIdxRef.current = startIdx;
        setPlayQueue(queue);
        setQueueIndex(startIdx);
        playIdx(startIdx);
    }, [verses, playIdx]);

    const handlePlayPause = () => {
        if (isPlaying) {
            // Pause
            shouldPlayRef.current = false;
            audioRef.current?.pause();
            setIsPlaying(false);
        } else if (playingKey && audioRef.current?.src && audioRef.current?.paused) {
            // Resume current ayat
            shouldPlayRef.current = true;
            audioRef.current.play().catch(() => { });
            setIsPlaying(true);
        } else if (lastPlayedKeyRef.current) {
            // Determine if a resume dialog is needed
            const juzNum = parseInt(selectedJuzRef.current, 10);
            const progress = playbackProgressRef.current[String(juzNum)] || {};
            if (progress.is_completed) {
                buildAndPlay();
            } else {
                setShowResumeDialog(true);
            }
        } else {
            buildAndPlay();
        }
    };

    const confirmResume = () => {
        setShowResumeDialog(false);
        const juzNum = parseInt(selectedJuzRef.current, 10);
        const progress = playbackProgressRef.current[String(juzNum)] || {};

        const savedPage = parseInt(progress.last_page_number, 10);
        const currentPage = parseInt(pageNumberRef.current, 10);
        if (savedPage && savedPage !== currentPage) {
            setPageNumber(savedPage);
            autoResumeOnLoadRef.current = lastPlayedKeyRef.current;
        } else {
            buildAndPlay(lastPlayedKeyRef.current);
        }
    };

    const confirmRestart = () => {
        setShowResumeDialog(false);
        const juzNum = parseInt(selectedJuzRef.current, 10);

        if (juzNum) {
            const startPage = JUZ_TO_PAGE[juzNum] || 1;

            axios.post('/quran/progress', {
                juz_number: juzNum,
                played_ayahs: [],
                last_verse_key: null,
                last_page_number: startPage,
                is_completed: false
            }).catch(() => { });

            playbackProgressRef.current[String(juzNum)] = {
                played_ayahs: [],
                last_verse_key: null,
                last_page_number: startPage,
                is_completed: false
            };
            lastPlayedKeyRef.current = null;
            playedAyahKeysRef.current = new Set();

            if (startPage !== pageNumberRef.current) {
                setPageNumber(startPage);
                autoResumeOnLoadRef.current = 'RESTART';
            } else {
                buildAndPlay();
            }
        } else {
            lastPlayedKeyRef.current = null;
            buildAndPlay();
        }
    };

    const handlePrev = () => {
        const prev = queueIdxRef.current - 1;
        if (playQueueRef.current[prev]) playIdx(prev);
    };

    const handleNext = () => {
        const next = queueIdxRef.current + 1;
        if (playQueueRef.current[next]) playIdx(next);
    };

    const toggleMute = () => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(isMutedRef.current);
        if (audioRef.current) audioRef.current.muted = isMutedRef.current;
    };

    const handleReciterChange = (newReciter) => {
        setSelectedReciter(newReciter);
        if (playingKey && audioRef.current) {
            const isCurrentlyPlaying = !audioRef.current.paused || isPlaying;
            const [s, a] = playingKey.split(':').map(Number);
            const newUrl = getAudioUrl(s, a, newReciter);

            audioRef.current.pause();
            audioRef.current.src = newUrl;
            audioRef.current.load();

            if (isCurrentlyPlaying || shouldPlayRef.current) {
                setTimeout(() => {
                    audioRef.current?.play().catch(() => { });
                }, 100);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => () => { audioRef.current?.pause(); }, []);

    // ── Load Quran page ───────────────────────
    const loadPage = useCallback(async (page) => {
        if (page < 1 || page > 604) return;
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true); setError(null); setVerses([]);
        try {
            const res = await fetch(
                `${API_BASE}/verses/by_page/${page}?fields=text_uthmani,verse_key,juz_number&per_page=50`,
                { signal: ctrl.signal }
            );
            if (!res.ok) throw new Error('Gagal mengambil data');
            const json = await res.json();
            setVerses(json.verses || []);
        } catch (e) {
            if (e.name !== 'AbortError') setError(
                navigator.onLine
                    ? 'Gagal memuat halaman. Coba beberapa saat lagi.'
                    : 'Tidak ada koneksi internet. Hubungkan perangkat ke internet terlebih dahulu.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPage(pageNumber);
        setInputPage(String(pageNumber));
    }, [pageNumber, loadPage]);

    // ── Auto-play continued queue on next page
    useEffect(() => {
        if (!loading && verses.length > 0) {
            if (autoPlayNextPage.current) {
                autoPlayNextPage.current = false;
                buildAndPlay();
            } else if (autoResumeOnLoadRef.current) {
                const key = autoResumeOnLoadRef.current;
                autoResumeOnLoadRef.current = null;
                if (key === 'RESTART') {
                    buildAndPlay();
                } else {
                    buildAndPlay(key);
                }
            }
        }
    }, [loading, verses, buildAndPlay]);

    // ── Reset juz playback state when juz changes
    useEffect(() => {
        setJuzPlaybackCompleted(false);
        const currentJuzNum = parseInt(selectedJuz, 10);
        if (Number.isInteger(currentJuzNum)) {
            const juzKey = String(currentJuzNum);
            const juzProgress = playbackProgressRef.current[juzKey] || {};

            const cachedAyahKeys = juzProgress.played_ayahs || [];
            playedAyahKeysRef.current = new Set(cachedAyahKeys);
            lastPlayedKeyRef.current = juzProgress.last_verse_key || null;

            // Optional: You could jump to a specific page if you stored it, but falling back to juz start is fine
            // Assuming we don't store page, we can fall back to the start page of the juz
            const fallbackStartPage = JUZ_TO_PAGE[currentJuzNum] || 1;
            setPageNumber(fallbackStartPage);
        } else {
            lastPlayedKeyRef.current = null;
            playedAyahKeysRef.current = new Set();
        }
        setBlockedAyah(null);
        setBlockedText('');
    }, [selectedJuz]);

    // ── Navigation
    const goToPage = (n) => setPageNumber(Math.max(1, Math.min(604, n)));

    // ── Finish Juz Handler
    const handleFinishJuz = async () => {
        if (!selectedJuz) return;
        setIsFinishingJuz(true);
        setFinishJuzMessage(null);
        try {
            const res = await axios.post('/hafalan-skrining/reports', { juz_number: parseInt(selectedJuz) });
            if (res.data.success) {
                setFinishJuzMessage({ type: 'success', text: res.data.message });

                // Update local ref so the Dropdown shows "Selesai" immediately
                const juzKey = String(selectedJuz);
                const currentJuzProgress = playbackProgressRef.current[juzKey] || {};
                playbackProgressRef.current = {
                    ...playbackProgressRef.current,
                    [juzKey]: {
                        ...currentJuzProgress,
                        is_completed: true
                    }
                };

                // Also tell the backend explicitly (though the controller already does this, it's good to ensure sync)
                axios.post('/quran/progress', {
                    juz_number: parseInt(selectedJuz),
                    is_completed: true
                }).catch(() => { });

                setTimeout(() => setFinishJuzMessage(null), 5000);
            } else {
                setFinishJuzMessage({ type: 'error', text: res.data.message || 'Gagal membuat laporan Juz.' });
                setTimeout(() => setFinishJuzMessage(null), 5000);
            }
        } catch (err) {
            if (err.response && err.response.status === 419) {
                setFinishJuzMessage({ type: 'error', text: 'Sesi login habis. Muat ulang halaman lalu coba lagi.' });
            } else {
                setFinishJuzMessage({ type: 'error', text: 'Terjadi kesalahan koneksi.' });
            }
            setTimeout(() => setFinishJuzMessage(null), 5000);
        } finally {
            setIsFinishingJuz(false);
        }
    };

    // ── Group verses by surah
    const groupedVerses = verses.reduce((acc, v) => {
        const [sn] = v.verse_key.split(':');
        if (!acc[sn]) acc[sn] = [];
        acc[sn].push(v);
        return acc;
    }, {});

    const juzOfPage = verses[0]?.juz_number;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <Head title="Skrining Al-Quran Digital - Mushaf Madinah" />
            <link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" rel="stylesheet" />

            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 pb-28">

                {/* ── Sticky Header ─────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-lg sticky top-0 z-20">
                    <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 mr-auto">
                            <BookOpen className="h-5 w-5 text-emerald-300" />
                            <span className="font-semibold text-lg">Skrining Al-Quran</span>
                            <span className="text-emerald-300 text-sm hidden md:block">Mushaf Madinah</span>
                        </div>
                        {juzOfPage && (
                            <span className="text-xs bg-emerald-700/50 px-2 py-1 rounded-full">Juz {juzOfPage}</span>
                        )}
                        {/* Page nav */}
                        <div className="flex items-center gap-2 bg-emerald-900/50 rounded-lg px-3 py-1.5">
                            <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
                                className="text-white/80 hover:text-white disabled:opacity-30 transition-opacity">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-emerald-300">Hal.</span>
                                <input type="number" min={1} max={604} value={inputPage}
                                    onChange={e => setInputPage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && goToPage(parseInt(inputPage) || 1)}
                                    onBlur={() => goToPage(parseInt(inputPage) || 1)}
                                    className="w-14 text-center bg-emerald-900 border border-emerald-600 rounded px-1 py-0.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                                <span className="text-emerald-400">/ 604</span>
                            </div>
                            <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= 604}
                                className="text-white/80 hover:text-white disabled:opacity-30 transition-opacity">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* ── Selector Row ──────────────────────────────────── */}
                    <div className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap gap-3 items-end">

                        {/* Juz */}
                        <div className="flex flex-col gap-1">
                            <label className="text-emerald-300 text-xs font-medium">Pilih Juz</label>
                            <select value={selectedJuz} onChange={e => setSelectedJuz(e.target.value)}
                                className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[95px]">
                                <option value="">-- Juz --</option>
                                {JUZ_LIST.map(j => {
                                    if (allowed_juz !== null && !allowed_juz.includes(j)) return null;
                                    const progress = playbackProgressRef.current[String(j)];
                                    let historyText = "";
                                    if (progress) {
                                        if (progress.is_completed) {
                                            historyText = " - Selesai";
                                        } else if (progress.last_verse_key) {
                                            historyText = ` - Terakhir: ${progress.last_verse_key}`;
                                        }
                                    }
                                    return <option key={j} value={j}>Juz {j}{historyText}</option>;
                                })}
                            </select>
                        </div>


                        {/* Qari */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-emerald-300 text-xs font-medium">Pilih Qari</label>
                                {is_admin && (
                                    <button
                                        type="button"
                                        onClick={() => setShowManageModal(true)}
                                        className="text-emerald-400 hover:text-white transition-colors"
                                        title="Kelola daftar qari"
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <select value={selectedReciter} onChange={e => handleReciterChange(e.target.value)}
                                className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[175px]">
                                {availableReciters.length > 0 ? availableReciters.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                        {is_admin && hiddenQoriIds.includes(r.id) ? ' (Hidden)' : ''}
                                    </option>
                                )) : (
                                    <option value="" disabled>Tidak ada qari tersedia</option>
                                )}
                            </select>
                        </div>

                        {/* Aksi */}
                        <div className="flex gap-2 self-end">
                            {selectedJuz && (
                                <button onClick={handlePlayPause}
                                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                                    <Play className="h-4 w-4" /> Putar
                                </button>
                            )}
                            {selectedJuz && (
                                <button onClick={handleFinishJuz} disabled={isFinishingJuz || !juzPlaybackCompleted}
                                    title={!juzPlaybackCompleted ? "Putar dan dengarkan seluruh Juz hingga selesai untuk mengaktifkan tombol ini" : "Simpan laporan hafalan Juz ini"}
                                    className={`flex items-center gap-1.5 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors shadow ${juzPlaybackCompleted ? 'bg-violet-600 hover:bg-violet-500' : 'bg-stone-500 cursor-not-allowed'}`}>
                                    {isFinishingJuz ? <Loader2 className="h-4 w-4 animate-spin" /> : (juzPlaybackCompleted ? <span className="text-lg leading-none mb-1">✓</span> : <Lock className="h-4 w-4" />)}
                                    {isFinishingJuz ? 'Memproses...' : 'Selesai Juz'}
                                </button>
                            )}
                            {selectedJuz && (
                                <button onClick={() => { setSelectedJuz(''); stopAudio(); }}
                                    className="text-emerald-400 hover:text-white text-xs pb-0.5 transition-colors">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Finish Juz Message ───────────────────────────────── */}
                {finishJuzMessage && (
                    <div className="max-w-3xl mx-auto px-4 mt-4">
                        <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${finishJuzMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            {finishJuzMessage.type === 'success' ? <span className="text-xl">🎉</span> : <span className="text-xl">⚠️</span>}
                            <p className="font-medium text-sm">{finishJuzMessage.text}</p>
                        </div>
                    </div>
                )}

                {/* ── Page Content ───────────────────────────────────────── */}
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                            <p className="text-stone-500 text-sm">Memuat halaman {pageNumber}...</p>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="text-center py-20">
                            <p className="text-red-500 font-semibold">{error}</p>
                            <button onClick={() => loadPage(pageNumber)} className="mt-4 text-sm text-emerald-600 hover:underline">Coba lagi</button>
                        </div>
                    )}

                    {!loading && !error && verses.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl border border-amber-200/60 overflow-hidden">
                            {/* Top decoration */}
                            <div className="flex items-center justify-center py-3 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-b border-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
                                    <span className="text-amber-700 text-xs font-medium tracking-widest uppercase">Halaman {pageNumber}</span>
                                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                {Object.entries(groupedVerses).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)).map(([surahNum, surahVerses]) => {
                                    const surahObj = SURAH_LIST.find(s => s.number === parseInt(surahNum));
                                    const [, firstAyah] = surahVerses[0]?.verse_key.split(':') || [];
                                    const isFirstAyah = parseInt(firstAyah) === 1;

                                    return (
                                        <div key={surahNum} className="mb-6">
                                            {/* Surah header */}
                                            {isFirstAyah && (
                                                <div className="text-center mb-4">
                                                    <div className="inline-flex flex-col items-center gap-1 bg-gradient-to-b from-emerald-800 to-emerald-950 text-white px-8 py-3 rounded-xl shadow-md">
                                                        <span style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }} className="text-xl leading-loose">
                                                            {surahObj?.arabic || `سورة ${surahNum}`}
                                                        </span>
                                                        <span className="text-emerald-300 text-xs">{surahObj?.name} • {surahObj?.ayahs} Ayat</span>
                                                    </div>
                                                    {/* Bismillah (except At-Taubah) */}
                                                    {parseInt(surahNum) !== 9 && (
                                                        <p className="mt-4 text-2xl text-stone-800 leading-loose"
                                                            style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }}>
                                                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Verses — each ayah is individually clickable for audio */}
                                            <div className="text-right" style={{ direction: 'rtl' }}>
                                                {surahVerses.map(verse => {
                                                    const [sn, an] = verse.verse_key.split(':').map(Number);
                                                    const key = verse.verse_key;
                                                    const playing = playingKey === key;

                                                    return (
                                                        <span key={key}
                                                            style={{ fontFamily: "'Amiri Quran', serif" }}
                                                            className={`inline leading-[3.2] text-xl rounded transition-all ${playing ? 'text-emerald-700 bg-emerald-50 px-0.5' : 'text-stone-900'
                                                                }`}
                                                            title={`Klik nomor ayat untuk opsi`}
                                                        >
                                                            {verse.text_uthmani}
                                                            {/* Ayat badge — klik untuk popup Lanjut Baca / Skrining */}
                                                            <span
                                                                data-ayat-badge
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    // Popup hanya aktif saat mode Juz dan ayat sudah pernah diputar.
                                                                    if (!selectedJuz) return;
                                                                    if (!playedAyahKeysRef.current.has(key)) return;
                                                                    setBlockedAyah(key);
                                                                    setBlockedText(verse.text_uthmani);
                                                                    setPopupPos({ x: e.clientX, y: e.clientY });
                                                                }}
                                                                className={`inline-flex items-center justify-center mx-1 px-1 py-0.5 rounded text-sm font-medium select-none
                                                                    transition-all
                                                                    ${selectedJuz && playedAyahKeysRef.current.has(key)
                                                                        ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:bg-emerald-50'
                                                                        : 'cursor-not-allowed opacity-60'}
                                                                    ${playing ? 'text-emerald-600 bg-emerald-100' : 'text-emerald-700'}`}
                                                                title="Klik untuk opsi ayat ini"
                                                            >
                                                                ﴾{toArabicNumber(an)}﴿
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom decoration */}
                            <div className="flex items-center justify-center py-3 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-t border-amber-200">
                                <span className="text-amber-600 font-medium text-sm">{pageNumber}</span>
                            </div>
                        </div>
                    )}

                    {/* Bottom nav */}
                    {!loading && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
                                className="flex items-center gap-2 bg-white border border-stone-200 hover:border-emerald-400 hover:text-emerald-700 text-stone-600 px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-30 text-sm font-medium">
                                <ChevronLeft className="h-4 w-4" /> Sebelumnya
                            </button>
                            <span className="text-stone-400 text-sm">{pageNumber} / 604</span>
                            <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= 604}
                                className="flex items-center gap-2 bg-white border border-stone-200 hover:border-emerald-400 hover:text-emerald-700 text-stone-600 px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-30 text-sm font-medium">
                                Berikutnya <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-stone-400 pb-4">
                    Sumber: api.quran.com • Audio: everyayah.com • Halaman {pageNumber} dari 604
                </div>
            </div>

            {/* ── Ayat Popup Menu ─────────────────────────────── */}
            <AyatPopup
                verseKey={blockedAyah}
                verseText={blockedText}
                pos={popupPos}
                onClose={() => setBlockedAyah(null)}
                onPlay={() => {
                    if (blockedAyah) {
                        const [sn, an] = blockedAyah.split(':').map(Number);
                        // Saat mode Juz, lanjut baca hanya boleh untuk ayat yang sudah pernah diputar.
                        if (selectedJuz && !playedAyahKeysRef.current.has(blockedAyah)) {
                            return;
                        }
                        playAyah(sn, an);
                    }
                }}
                onSkrining={
                    // Skrining hanya aktif saat mode Juz + ayat yang dipilih sudah pernah diputar.
                    (selectedJuz && blockedAyah && playedAyahKeysRef.current.has(blockedAyah))
                        ? () => {
                            if (blockedAyah) {
                                setSkriningVerse({ verseKey: blockedAyah, verseText: blockedText });
                                // Pause audio while filling skrining
                                shouldPlayRef.current = false;
                                audioRef.current?.pause();
                                setIsPlaying(false);
                            }
                        }
                        : null
                }
            />

            {/* ── Skrining Hafalan Modal */}
            {skriningVerse && (
                <SkriningModal
                    verseKey={skriningVerse.verseKey}
                    verseText={skriningVerse.verseText}
                    pageNumber={pageNumber}
                    juzNumber={juzOfPage}
                    onClose={() => setSkriningVerse(null)}
                    onSaved={() => {
                        setSkriningVerse(null);
                        // Resume audio from where we paused, or play next
                        // Ensure we resume from where it was left!
                        if (lastPlayedKeyRef.current) {
                            buildAndPlay(lastPlayedKeyRef.current);
                        } else if (audioRef.current?.src && audioRef.current?.paused) {
                            shouldPlayRef.current = true;
                            audioRef.current.play().catch(() => { });
                            setIsPlaying(true);
                        } else if (playQueueRef.current.length > 0) {
                            playIdxRef.current?.(queueIdxRef.current + 1);
                        }
                    }}
                />
            )}

            {/* ── Sticky Audio Player ───────────────────────────────────── */}
            {playingKey && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900 to-emerald-950 border-t-2 border-emerald-600 shadow-2xl">
                    {/* Progress bar */}
                    <div className="h-1 bg-emerald-800">
                        <div className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${audioProgress}%` }} />
                    </div>

                    <div className="max-w-3xl mx-auto flex items-center gap-4 px-4 py-3">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                                {RECITERS.find(r => r.id === selectedReciter)?.name}
                            </p>
                            <p className="text-emerald-300 text-xs">
                                Surah {playingKey?.split(':')[0]} : Ayat {playingKey?.split(':')[1]}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            <button onClick={handlePrev} disabled={queueIndex <= 0}
                                className="text-white/70 hover:text-white disabled:opacity-30 transition-colors">
                                <SkipBack className="h-5 w-5" />
                            </button>

                            <button onClick={handlePlayPause}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-2.5 transition-colors shadow-lg">
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>

                            {/* Disable skip forward if Juz is selected to enforce listening */}
                            <button onClick={handleNext} disabled={queueIndex >= playQueue.length - 1 || !!selectedJuz}
                                title={selectedJuz ? "Dilarang memotong bacaan saat mode mendengarkan Juz" : "Berikutnya"}
                                className="text-white/70 hover:text-white disabled:opacity-30 transition-colors">
                                <SkipForward className="h-5 w-5" />
                            </button>

                            <button onClick={toggleMute}
                                className="text-white/70 hover:text-white transition-colors">
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>

                            <button onClick={stopAudio}
                                className="text-emerald-400 hover:text-white text-xs transition-colors ml-1">
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Resume Dialog ─────────────────────────────────────── */}
            {showResumeDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-emerald-100 relative">
                        <button onClick={() => setShowResumeDialog(false)} className="absolute top-4 right-4 text-emerald-300 hover:text-emerald-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Lanjutkan Bacaan?</h3>
                        <p className="text-gray-600 mb-6">
                            Anda memiliki riwayat bacaan pada Juz ini di <strong>Ayat {lastPlayedKeyRef.current}</strong>. Ingin mengulang dari awal Juz atau lanjut membaca?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmResume}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <PlayCircle className="w-5 h-5" />
                                Lanjut dari Ayat {lastPlayedKeyRef.current}
                            </button>
                            <button
                                onClick={confirmRestart}
                                className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Ulangi dari Awal Juz
                            </button>
                            <button
                                onClick={() => setShowResumeDialog(false)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 rounded-lg transition-colors mt-2 text-sm"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {is_admin && showManageModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowManageModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-emerald-800 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                <h3 className="font-bold">Kelola Daftar Qari</h3>
                            </div>
                            <button onClick={() => setShowManageModal(false)} className="hover:text-emerald-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-2">
                            <p className="text-xs text-stone-500 mb-4 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                                Klik ikon mata untuk menyembunyikan qari tertentu dari Santri atau Siswa. Pengaturan disimpan otomatis.
                            </p>

                            {RECITERS.map(r => {
                                const isHidden = hiddenQoriIds.includes(r.id);

                                return (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-emerald-50 transition-colors"
                                    >
                                        <span className={`text-sm font-medium ${isHidden ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                            {r.name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = isHidden
                                                    ? hiddenQoriIds.filter(id => id !== r.id)
                                                    : [...hiddenQoriIds, r.id];

                                                setHiddenQoriIds(next);
                                                axios.post('/quran/settings', {
                                                    key: 'quran_hidden_qoris',
                                                    value: next,
                                                }).catch(error => {
                                                    console.error(error);
                                                    setHiddenQoriIds(hiddenQoriIds);
                                                });
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${isHidden ? 'bg-stone-100 text-stone-400' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                                            title={isHidden ? 'Tampilkan qari' : 'Sembunyikan qari'}
                                        >
                                            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowManageModal(false)}
                                className="bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Skrining Disabled Modal ─────────────────────────────────────── */}
            {skrining_disabled && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-emerald-100 relative">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Fitur Skrining Dinonaktifkan</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {skrining_disabled_message}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.href = '/quran/tilawah'}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-5 h-5" />
                                Buka Mode Tilawah
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 rounded-lg transition-colors"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
