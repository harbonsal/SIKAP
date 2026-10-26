import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, BookOpen, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { SURAH_MAPPING, estimatePageFromSurahAyah } from '@/Services/quranApi';

const API_BASE = 'https://api.quran.com/api/v4';

const toArabicNum = (n) =>
    String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

// Nama surat dalam Bahasa Arab standar Mushaf Madinah
const ARABIC_SURAH_NAMES = {
    1: "الفَاتِحَة", 2: "البَقَرَة", 3: "آل عِمْرَان", 4: "النِّسَاء", 5: "المَائِدَة",
    6: "الأَنْعَام", 7: "الأَعْرَاف", 8: "الأَنْفَال", 9: "التَّوْبَة", 10: "يُونُس",
    11: "هُود", 12: "يُوسُف", 13: "الرَّعْد", 14: "إِبْرَاهِيم", 15: "الحِجْر",
    16: "النَّحْل", 17: "الإِسْرَاء", 18: "الكَهْف", 19: "مَرْيَم", 20: "طه",
    21: "الأَنْبِيَاء", 22: "الحَجّ", 23: "المُؤْمِنُون", 24: "النُّور", 25: "الفُرْقَان",
    26: "الشُّعَرَاء", 27: "النَّمْل", 28: "القَصَص", 29: "العَنْكَبُوت", 30: "الرُّوم",
    31: "لُقْمَان", 32: "السَّجْدَة", 33: "الأَحْزَاب", 34: "سَبَأ", 35: "فَاطِر",
    36: "يس", 37: "الصَّافَّات", 38: "ص", 39: "الزُّمَر", 40: "غَافِر",
    41: "فُصِّلَت", 42: "الشُّورَى", 43: "الزُّخْرُف", 44: "الدُّخَان", 45: "الجَاثِيَة",
    46: "الأَحْقَاف", 47: "مُحَمَّد", 48: "الفَتْح", 49: "الحُجُرَات", 50: "ق",
    51: "الذَّارِيَات", 52: "الطُّور", 53: "النَّجْم", 54: "القَمَر", 55: "الرَّحْمَٰن",
    56: "الوَاقِعَة", 57: "الحَدِيد", 58: "المُجَادِلَة", 59: "الحَشْر", 60: "المُمْتَحَنَة",
    61: "الصَّفّ", 62: "الجُمُعَة", 63: "المُنَافِقُون", 64: "التَّغَابُن", 65: "الطَّلَاق",
    66: "التَّحْرِيم", 67: "المُلْك", 68: "القَلَم", 69: "الحَاقَّة", 70: "المَعَارِج",
    71: "نُوح", 72: "الجِنّ", 73: "المُزَّمِّل", 74: "المُدَّثِّر", 75: "القِيَامَة",
    76: "الإِنْسَان", 77: "المُرْسَلَات", 78: "النَّبَأ", 79: "النَّازِعَات", 80: "عَبَس",
    81: "التَّكْوِير", 82: "الانْفِطَار", 83: "المُطَفِّفِين", 84: "الانْشِقَاق", 85: "البُرُوج",
    86: "الطَّارِق", 87: "الأَعْلَى", 88: "الغَاشِيَة", 89: "الفَجْر", 90: "البَلَد",
    91: "الشَّمْس", 92: "اللَّيْل", 93: "الضُّحَى", 94: "الشَّرْح", 95: "التِّين",
    96: "العَلَق", 97: "القَدْر", 98: "البَيِّنَة", 99: "الزَّلْزَلَة", 100: "العَادِيَات",
    101: "القَارِعَة", 102: "التَّكَاثُر", 103: "العَصْر", 104: "الهُمَزَة", 105: "الفِيل",
    106: "قُرَيْش", 107: "المَاعُون", 108: "الكَوْثَر", 109: "الكَافِرُون", 110: "النَّصْر",
    111: "المَسَد", 112: "الإِخْلَاص", 113: "الفَلَق", 114: "النَّاس"
};

async function fetchVerses(surahNum, startAyah, surahName, perPage = 20) {
    let accuratePage = null;

    try {
        const cleanSurah = parseInt(surahNum, 10);
        const cleanAyah = parseInt(startAyah, 10);
        if (cleanSurah && cleanAyah) {
            const response = await fetch(`${API_BASE}/verses/by_key/${cleanSurah}:${cleanAyah}?fields=page_number`);
            if (response.ok) {
                const data = await response.json();
                accuratePage = data.verse?.page_number || data.verses?.[0]?.page_number || null;
            }
        }
    } catch (error) {
        console.error('Gagal mengambil halaman akurat dari API:', error);
    }

    if (!accuratePage && surahName) {
        accuratePage = estimatePageFromSurahAyah(surahName, startAyah);
    }

    if (!accuratePage) {
        accuratePage = 582; // Default ke Juz 30 / An-Naba jika tidak terdefinisi
    }

    const res = await fetch(
        `${API_BASE}/verses/by_page/${accuratePage}?words=true&word_fields=line_number,text_uthmani&fields=text_uthmani,verse_key,juz_number&per_page=200`
    );
    if (!res.ok) throw new Error('Gagal mengambil data halaman');
    const json = await res.json();
    return { verses: json.verses || [], page: accuratePage };
}

// ─── Inline Mode: Desain Tipografi Mushaf Al-Qur'an Dinamis & Rapi ──────────────
function InlineViewer({ 
    surahName, 
    startAyah, 
    startVerseKey, 
    verses, 
    loading, 
    error, 
    onRefresh, 
    onAyahClick, 
    pageNumber, 
    onPageChange 
}) {
    const startRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(0); // -1: Ringkas, 0: Standar, 1: Besar, 2: Sangat Besar

    useEffect(() => {
        if (startRef.current) {
            startRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [verses, startVerseKey]);

    const clickable = typeof onAyahClick === 'function';

    // Konfigurasi ukuran teks & jarak baris Mushaf
    const fontConfig = {
        '-1': {
            fontSize: '1.25rem',
            lineHeight: '2.6rem',
            bismillahSize: '1.35rem'
        },
        '0': {
            fontSize: '1.5rem',
            lineHeight: '3.1rem',
            bismillahSize: '1.65rem'
        },
        '1': {
            fontSize: '1.85rem',
            lineHeight: '3.8rem',
            bismillahSize: '1.95rem'
        },
        '2': {
            fontSize: '2.25rem',
            lineHeight: '4.6rem',
            bismillahSize: '2.35rem'
        }
    }[zoomLevel] || {
        fontSize: '1.5rem',
        lineHeight: '3.1rem',
        bismillahSize: '1.65rem'
    };

    // Kelompokkan ayat-ayat pada halaman berdasarkan Surah
    const surahGroups = useMemo(() => {
        if (!verses || verses.length === 0) return [];
        const groups = [];
        let currentGroup = null;

        verses.forEach((v) => {
            const [sNum] = (v.verse_key || '').split(':').map(Number);
            if (!currentGroup || currentGroup.surahId !== sNum) {
                currentGroup = {
                    surahId: sNum,
                    hasFirstVerse: false,
                    verses: []
                };
                groups.push(currentGroup);
            }
            if (v.verse_key && v.verse_key.endsWith(':1')) {
                currentGroup.hasFirstVerse = true;
            }
            currentGroup.verses.push(v);
        });

        return groups;
    }, [verses]);

    return (
        <div className="flex flex-col h-full w-full bg-[#fdfaf4] select-none overflow-hidden">
            {/* BILAH KONTROL MUSHAF (Minimalis & Elegan) */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shrink-0 shadow-xs border-b border-emerald-800">
                {/* KIRI: Navigasi Cepat Halaman */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        disabled={!pageNumber || pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="p-1 rounded-md bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Halaman Sebelumnya"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <span className="font-bold text-xs sm:text-sm tracking-wide text-emerald-100 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Hal {pageNumber || '-'}</span>
                    </span>

                    <button
                        type="button"
                        disabled={!pageNumber || pageNumber >= 604}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="p-1 rounded-md bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Halaman Berikutnya"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* TENGAH: Nama Surat & Ayat Aktif */}
                <div className="text-center truncate px-2">
                    <span className="text-xs sm:text-sm font-semibold text-white/95">
                        {surahName ? `${surahName}` : 'Mushaf Madinah'}
                    </span>
                    {startAyah && (
                        <span className="text-[11px] text-emerald-300 font-normal ml-1">
                            (Ayat {startAyah})
                        </span>
                    )}
                </div>

                {/* KANAN: Zoom Font (A- / A+) & Refresh */}
                <div className="flex items-center gap-1">
                    <button 
                        type="button"
                        onClick={() => setZoomLevel(z => Math.max(-1, z - 1))}
                        disabled={zoomLevel <= -1}
                        className="px-1.5 py-0.5 rounded bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-[11px] font-bold disabled:opacity-30 transition-colors"
                        title="Kecilkan Teks"
                    >
                        A-
                    </button>
                    <button 
                        type="button"
                        onClick={() => setZoomLevel(z => Math.min(2, z + 1))}
                        disabled={zoomLevel >= 2}
                        className="px-1.5 py-0.5 rounded bg-emerald-800/70 hover:bg-emerald-700 text-emerald-100 text-[11px] font-bold disabled:opacity-30 transition-colors"
                        title="Besarkan Teks"
                    >
                        A+
                    </button>
                    <button 
                        type="button"
                        onClick={onRefresh} 
                        title="Segarkan Halaman"
                        className="p-1 rounded text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors ml-1"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* AREA TEKS MUSHAF AL-QUR'AN (Teks Mengalir Rapi Alami) */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 sm:px-8 py-5 custom-scrollbar bg-[#fdfaf4]">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <span className="text-stone-500 text-xs sm:text-sm font-medium">Memuat teks mushaf...</span>
                    </div>
                )}
                
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                        <button onClick={onRefresh} className="mt-3 text-xs text-emerald-700 font-semibold hover:underline">
                            Coba lagi
                        </button>
                    </div>
                )}

                {!loading && !error && verses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 text-stone-400">
                        <BookOpen className="h-12 w-12 mb-3 text-stone-300" />
                        <p className="text-sm font-medium text-stone-600">Pilih Surat & Ayat Awal</p>
                        <p className="text-xs text-stone-400 mt-0.5">Teks Al-Quran akan langsung tampil di layar ini</p>
                    </div>
                )}

                {!loading && !error && verses.length > 0 && (
                    <div className="max-w-3xl mx-auto w-full pb-8">
                        {surahGroups.map((group) => {
                            const arabicSurahName = ARABIC_SURAH_NAMES[group.surahId] || `Surah ${group.surahId}`;
                            
                            return (
                                <div key={`surah-group-${group.surahId}`} className="mb-6">
                                    {/* ORNAMEN FRAME HEADER SURAH (Bila ayat pertama ada di halaman ini) */}
                                    {group.hasFirstVerse && (
                                        <div className="w-full my-4 select-none">
                                            <div className="relative py-2.5 px-4 rounded-xl border-2 border-amber-600/60 bg-[#fdf5e6] shadow-2xs text-center flex items-center justify-between overflow-hidden">
                                                <div className="text-amber-800/70 font-semibold text-xs hidden sm:block">
                                                    سُورَةُ {arabicSurahName}
                                                </div>
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <span 
                                                        className="text-lg sm:text-xl md:text-2xl font-bold text-amber-950 tracking-wide"
                                                        style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                                                    >
                                                        سُورَةُ {arabicSurahName}
                                                    </span>
                                                </div>
                                                <div className="text-amber-800/70 font-semibold text-xs hidden sm:block">
                                                    {group.verses.length} آيَات
                                                </div>
                                            </div>

                                            {/* BISMILLAH (Kecuali Surah At-Taubah & Al-Fatihah yg ayat 1 sudah bismillah) */}
                                            {group.surahId !== 9 && group.surahId !== 1 && (
                                                <div 
                                                    className="w-full text-center mt-3 mb-2 text-stone-800 select-none" 
                                                    style={{ 
                                                        fontFamily: "'Amiri Quran', 'Amiri', serif", 
                                                        fontSize: fontConfig.bismillahSize 
                                                    }}
                                                >
                                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* BLOK TEKS AYAT MENGALIR (FLOWING PARAGRAPH MUSHAF) */}
                                    <div 
                                        className="w-full text-stone-900 transition-all duration-150"
                                        style={{ 
                                            direction: 'rtl', 
                                            fontFamily: "'Amiri Quran', 'Amiri', serif",
                                            textAlign: 'justify',
                                            textJustify: 'inter-word',
                                            fontSize: fontConfig.fontSize,
                                            lineHeight: fontConfig.lineHeight
                                        }}
                                    >
                                        {group.verses.map((v) => {
                                            const [vSurah, vAyah] = (v.verse_key || '').split(':');
                                            const isStartAyah = startVerseKey && v.verse_key === startVerseKey;
                                            const words = v.words && v.words.length > 0 ? v.words : null;
                                            const hasEndWord = words ? words.some(w => w.char_type_name === 'end') : false;

                                            return (
                                                <span 
                                                    key={v.verse_key}
                                                    ref={isStartAyah ? startRef : null}
                                                    className={`inline transition-colors ${
                                                        isStartAyah ? 'bg-amber-100/80 rounded-md px-1 py-0.5 ring-1 ring-amber-400/60' : ''
                                                    }`}
                                                >
                                                    {/* Penanda Mulai Soal */}
                                                    {isStartAyah && (
                                                        <span className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-sans font-semibold align-middle select-none shadow-2xs">
                                                            <span>Mulai</span>
                                                            <span>◀</span>
                                                        </span>
                                                    )}

                                                    {words ? (
                                                        words.map((w, wIdx) => {
                                                            if (w.char_type_name === 'end') {
                                                                return (
                                                                    <span
                                                                        key={`end-${v.verse_key}-${wIdx}`}
                                                                        onClick={clickable ? () => onAyahClick({ 
                                                                            verse_key: v.verse_key, 
                                                                            text_uthmani: v.text_uthmani 
                                                                        }) : undefined}
                                                                        className={`inline-flex items-center justify-center align-middle mx-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-600/70 bg-gradient-to-b from-amber-100 to-amber-200/90 text-amber-950 font-bold text-xs select-none shadow-2xs transition-transform active:scale-90 ${
                                                                            clickable ? 'cursor-pointer hover:scale-110 hover:border-emerald-600 hover:bg-emerald-100' : ''
                                                                        }`}
                                                                        style={{ fontFamily: 'sans-serif' }}
                                                                        title={clickable ? `Ayat ${vAyah} - Klik untuk menilai kesalahan` : undefined}
                                                                    >
                                                                        {toArabicNum(vAyah)}
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <span
                                                                    key={`w-${v.verse_key}-${w.position || wIdx}`}
                                                                    onClick={clickable ? () => onAyahClick({ 
                                                                        verse_key: v.verse_key, 
                                                                        text_uthmani: v.text_uthmani 
                                                                    }) : undefined}
                                                                    className={`inline transition-colors rounded px-0.5 ${
                                                                        clickable ? 'cursor-pointer hover:text-emerald-800 hover:bg-emerald-100/60 active:bg-amber-200' : ''
                                                                    }`}
                                                                    title={clickable ? `Ayat ${vAyah} - Klik kata untuk menilai` : undefined}
                                                                >
                                                                    {w.text_uthmani}{' '}
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <>
                                                            <span
                                                                onClick={clickable ? () => onAyahClick({ 
                                                                    verse_key: v.verse_key, 
                                                                    text_uthmani: v.text_uthmani 
                                                                }) : undefined}
                                                                className={`inline transition-colors rounded px-0.5 ${
                                                                    clickable ? 'cursor-pointer hover:text-emerald-800 hover:bg-emerald-100/60' : ''
                                                                }`}
                                                            >
                                                                {v.text_uthmani}
                                                            </span>
                                                        </>
                                                    )}

                                                    {/* Fallback nomor ayat jika tidak ada char_type_name === 'end' */}
                                                    {!hasEndWord && (
                                                        <span
                                                            onClick={clickable ? () => onAyahClick({ 
                                                                verse_key: v.verse_key, 
                                                                text_uthmani: v.text_uthmani 
                                                            }) : undefined}
                                                            className={`inline-flex items-center justify-center align-middle mx-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-600/70 bg-gradient-to-b from-amber-100 to-amber-200/90 text-amber-950 font-bold text-xs select-none shadow-2xs transition-transform active:scale-90 ${
                                                                clickable ? 'cursor-pointer hover:scale-110 hover:border-emerald-600 hover:bg-emerald-100' : ''
                                                            }`}
                                                            style={{ fontFamily: 'sans-serif' }}
                                                            title={clickable ? `Ayat ${vAyah} - Klik untuk menilai` : undefined}
                                                        >
                                                            {toArabicNum(vAyah)}
                                                        </span>
                                                    )}
                                                    {' '}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER RINGKAS DENGAN THUMB-FRIENDLY NAVIGASI */}
            {!loading && verses.length > 0 && (
                <div className="shrink-0 border-t border-amber-200/80 px-3 py-2 bg-amber-50/70 flex items-center justify-between text-xs text-amber-900 shadow-xs">
                    <button 
                        type="button"
                        disabled={!pageNumber || pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-30 transition-colors shadow-2xs flex items-center gap-1 active:scale-95"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>Sebelumnya</span>
                    </button>

                    <div className="text-[11px] font-medium text-amber-800">
                        Hal <strong>{pageNumber}</strong> / 604
                    </div>

                    <button 
                        type="button"
                        disabled={!pageNumber || pageNumber >= 604}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-30 transition-colors shadow-2xs flex items-center gap-1 active:scale-95"
                    >
                        <span>Berikutnya</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Popup Button Mode (Fallback) ───────────────────────────────────────────────
function PopupViewer({ surahName, startAyah, verses, loading, error, onRefresh, pageNumber, onPageChange }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                disabled={!surahName || !startAyah}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Quran</span>
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative bg-[#fdfaf4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-amber-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-emerald-300" />
                                <span className="font-semibold text-sm">
                                    {surahName || 'Al-Quran'} {startAyah ? `· Ayat ${startAyah}` : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={onRefresh} className="text-emerald-300 hover:text-white p-1">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setOpen(false)} className="text-emerald-300 hover:text-white text-xl leading-none px-1">×</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {loading && <div className="flex items-center justify-center py-16 gap-3"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /><span className="text-sm text-stone-500">Memuat ayat...</span></div>}
                            {error && !loading && <div className="text-center py-10 text-red-500 text-sm">{error}</div>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Main Export Component ──────────────────────────────────────────────────
export default function QuranPageViewer({ selectedJuz, surahName, verseStart, inline = false, onAyahClick = null }) {
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchKey, setFetchKey] = useState(0);
    const [pageNumber, setPageNumber] = useState(null);

    const surahNum = surahName ? SURAH_MAPPING[surahName] : null;
    const startVerseKey = (surahNum && verseStart) ? `${surahNum}:${verseStart}` : null;

    useEffect(() => {
        if (!surahNum || !verseStart) { setVerses([]); setError(null); setPageNumber(null); return; }
        let cancelled = false;
        setLoading(true); setError(null);

        fetchVerses(surahNum, verseStart, surahName, 20)
            .then(({ verses: v, page }) => {
                if (!cancelled) { 
                    setVerses(v); 
                    setPageNumber(page);
                    setLoading(false); 
                }
            })
            .catch(() => { 
                if (!cancelled) { 
                    setError('Gagal memuat ayat. Periksa koneksi.'); 
                    setPageNumber(null);
                    setLoading(false); 
                } 
            });
        return () => { cancelled = true; };
    }, [surahNum, verseStart, fetchKey]);

    const handleRefresh = () => setFetchKey(k => k + 1);

    const handlePageChange = (newPage) => {
        if (!newPage || newPage < 1 || newPage > 604) return;
        setLoading(true); setError(null);
        fetch(`${API_BASE}/verses/by_page/${newPage}?words=true&word_fields=line_number,text_uthmani&fields=text_uthmani,verse_key,juz_number&per_page=200`)
            .then(res => {
                if (!res.ok) throw new Error('Gagal mengambil data halaman');
                return res.json();
            })
            .then(json => {
                setVerses(json.verses || []);
                setPageNumber(newPage);
                setLoading(false);
            })
            .catch(() => {
                setError('Gagal memuat halaman. Periksa koneksi.');
                setLoading(false);
            });
    };

    const props = { 
        surahName, 
        startAyah: verseStart, 
        startVerseKey, 
        verses, 
        loading, 
        error, 
        onRefresh: handleRefresh, 
        pageNumber, 
        onPageChange: handlePageChange 
    };

    return inline
        ? <InlineViewer {...props} onAyahClick={onAyahClick} />
        : <PopupViewer {...props} />;
}
