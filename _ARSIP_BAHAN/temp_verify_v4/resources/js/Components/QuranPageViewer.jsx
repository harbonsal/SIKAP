import { useState, useEffect, useRef } from 'react';
import { Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { SURAH_MAPPING, estimatePageFromSurahAyah } from '@/Services/quranApi';

const API_BASE = 'https://api.quran.com/api/v4';

const toArabicNum = (n) =>
    String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

async function fetchVerses(surahNum, startAyah, surahName, perPage = 20) {
    console.log('fetchVerses called with:', { surahNum, startAyah, surahName });
    let accuratePage = null;

    try {
        const cleanSurah = parseInt(surahNum);
        const cleanAyah = parseInt(startAyah);
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
        console.log('Fallback ke perhitungan matematis halaman Madinah offline.');
        accuratePage = estimatePageFromSurahAyah(surahName, startAyah);
    }

    console.log('Fetching from page:', accuratePage);
    const res = await fetch(
        `${API_BASE}/verses/by_page/${accuratePage}?words=true&word_fields=line_number,text_uthmani&fields=text_uthmani,verse_key,juz_number&per_page=200`
    );
    if (!res.ok) throw new Error('Gagal mengambil data halaman');
    const json = await res.json();
    return { verses: json.verses || [], page: accuratePage };
}

function isVerseInRange(vk, startVk, endVk) {
    if (!vk || !startVk) return false;
    const [s1, a1] = vk.split(':').map(Number);
    const [s2, a2] = startVk.split(':').map(Number);
    
    if (s1 < s2 || (s1 === s2 && a1 < a2)) return false;
    
    if (endVk) {
        const [s3, a3] = endVk.split(':').map(Number);
        if (s1 > s3 || (s1 === s3 && a1 > a3)) return false;
    }
    return true;
}

// ─── Inline Mode ─────────────────────────────────────────────────────────────
function InlineViewer({ surahName, startAyah, verses, loading, error, onRefresh, onAyahClick, pageNumber, onPageChange, highlightState }) {
    const startRef = useRef(null);

    useEffect(() => {
        if (startRef.current) {
            startRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [verses]);

    const clickable = typeof onAyahClick === 'function';

    return (
        <div className="flex flex-col h-full w-full bg-[#fdfaf4] rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-300" />
                    <span className="font-semibold text-sm">
                        {surahName || 'Al-Quran Digital'}
                    </span>
                    {pageNumber && (
                        <span className="text-emerald-300 text-xs">· Halaman {pageNumber}</span>
                    )}
                    {startAyah && (
                        <span className="text-emerald-300 text-xs">· Ayat {startAyah}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {clickable && (
                        <span className="text-emerald-300 text-[10px] bg-emerald-700/50 px-2 py-0.5 rounded-full">
                            Klik ayat untuk input
                        </span>
                    )}
                    <button onClick={onRefresh} title="Refresh"
                        className="text-emerald-300 hover:text-white transition-colors p-1 rounded">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-x-auto overflow-y-auto px-5 py-6 custom-scrollbar">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                        <span className="text-stone-500 text-sm">Memuat halaman...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <p className="text-red-500 text-sm font-medium">{error}</p>
                        <button onClick={onRefresh} className="mt-3 text-xs text-emerald-600 hover:underline">
                            Coba lagi
                        </button>
                    </div>
                )}
                {!loading && !error && verses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 text-stone-400">
                        <BookOpen className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">Pilih Juz, Surat & Ayat</p>
                        <p className="text-xs mt-1">untuk menampilkan Al-Quran</p>
                    </div>
                )}
                {!loading && !error && verses.length > 0 && (() => {
                    const lines = {};
                    for (let i = 1; i <= 15; i++) lines[i] = [];

                    let totalWordsNum = 0;
                    verses.forEach(v => {
                        if (v.words) {
                            v.words.forEach(w => {
                                const l = w.line_number;
                                if (lines[l]) {
                                    lines[l].push({ ...w, verse_key: v.verse_key });
                                    totalWordsNum++;
                                }
                            });
                        }
                    });

                    let headerIndices = [];
                    let bismillahIndices = [];

                    for (let i = 1; i <= 15; i++) {
                        if (lines[i].length === 0) {
                            let nextSurah = null;
                            for (let j = i + 1; j <= 15; j++) {
                                if (lines[j].length > 0) {
                                    const vk = lines[j][0].verse_key;
                                    if (vk && vk.endsWith(':1')) {
                                        nextSurah = vk.split(':')[0];
                                    }
                                    break;
                                }
                            }
                            if (nextSurah) {
                                if (i < 15 && lines[i + 1].length === 0) {
                                    headerIndices.push(i);
                                    bismillahIndices.push(i + 1);
                                } else if (!bismillahIndices.includes(i)) {
                                    headerIndices.push(i);
                                }
                            }
                        }
                    }

                    const renderContent = [];
                    for (let i = 1; i <= 15; i++) {
                        if (headerIndices.includes(i)) {
                            let nextS = null;
                            for (let j = i + 1; j <= 15; j++) {
                                if (lines[j].length > 0) { nextS = lines[j][0].verse_key.split(':')[0]; break; }
                            }
                            const surahNameMatched = Object.keys(SURAH_MAPPING).find(key => SURAH_MAPPING[key] === parseInt(nextS, 10));
                            renderContent.push(
                                <div key={`sheader-${i}`} className="w-full text-center relative opacity-90 shrink-0 flex items-center justify-center my-1" style={{ height: '4.5rem' }}>
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-amber-300 border-dashed"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#fdfaf4] px-8 py-1.5 border border-amber-300 rounded-full text-sm font-bold text-amber-800 tracking-widest uppercase shadow-sm">
                                            {surahNameMatched || `Surah ${nextS}`}
                                        </span>
                                    </div>
                                </div>
                            );
                            continue;
                        }
                        if (bismillahIndices.includes(i)) {
                            renderContent.push(
                                <div key={`bismillah-${i}`} className="w-full text-center shrink-0 flex items-center justify-center" style={{ fontFamily: "'Amiri Quran', serif", fontSize: '2rem', height: '4.5rem' }}>
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                </div>
                            );
                            continue;
                        }
                        if (lines[i].length === 0) {
                            renderContent.push(<div key={`empty-${i}`} className="w-full shrink-0" style={{ height: '4.5rem' }} />);
                            continue;
                        }

                        // Rendering Filled Line
                        const wordSpans = lines[i].map((w, idx) => {
                            const isAyahEnd = w.char_type_name === 'end';
                            const [wSurah, wAyah] = w.verse_key.split(':');
                            const isStartInfo = surahName ? SURAH_MAPPING[surahName] : null;
                            const isStart = w.verse_key === `${isStartInfo}:${startAyah}`;
                            let isHighlighted = false;
                            if (highlightState && highlightState.startVk) {
                                const afterStart = isVerseInRange(w.verse_key, highlightState.startVk, null);
                                if (highlightState.L_start !== null && pageNumber) {
                                    const w_global_line = (pageNumber - 1) * 15 + parseInt(w.line_number, 10);
                                    isHighlighted = afterStart && (w_global_line < highlightState.L_start + 8);
                                } else {
                                    isHighlighted = afterStart;
                                }
                            }

                            if (isAyahEnd) {
                                return (
                                    <span key={`${w.verse_key}-${w.position}`}
                                        className={`inline-flex items-center justify-center mx-1.5 rounded-full w-9 h-9 align-middle shrink-0 ${isHighlighted ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200' : 'bg-amber-100 text-amber-800'}`}
                                        style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 600 }}>
                                        {toArabicNum(wAyah)}
                                    </span>
                                );
                            }

                            return (
                                <span
                                    key={`${w.verse_key}-${w.position}`}
                                    ref={isStart && idx === 0 ? startRef : null}
                                    onClick={clickable ? () => onAyahClick({ verse_key: w.verse_key }) : undefined}
                                    className={`inline-flex items-center transition-all duration-200 rounded px-0.5 ${isHighlighted ? 'text-sky-900 bg-sky-50 ring-1 ring-sky-300' : 'text-stone-800'} ${clickable ? 'cursor-pointer hover:bg-amber-100 hover:text-amber-900' : ''}`}
                                    title={clickable ? `Klik untuk input kesalahan Ayat ${wAyah}` : undefined}
                                >
                                    {w.text_uthmani}
                                </span>
                            );
                        });

                        const nextLineEmpty = (i < 15 && lines[i + 1].length === 0);
                        let flexStrategy = 'justify-between';
                        if (nextLineEmpty || lines[i].length < 6) {
                            flexStrategy = 'justify-center gap-2 sm:gap-3';
                        }

                        renderContent.push(
                            <div key={`line-${i}`} className={`flex w-full items-center shrink-0 ${flexStrategy}`} style={{ direction: 'rtl', height: '4.5rem' }}>
                                {wordSpans}
                            </div>
                        );
                    }

                    return (
                        <div className="min-w-[700px] max-w-4xl mx-auto flex flex-col font-normal py-8 px-2" style={{ fontFamily: "'Amiri Quran', serif", fontSize: '2.2rem', lineHeight: '4.5rem' }}>
                            {renderContent}
                        </div>
                    );
                })()}
            </div>

            {!loading && verses.length > 0 && (
                <div className="shrink-0 border-t border-amber-200 px-4 py-2 bg-amber-50 flex items-center justify-between">
                    <button 
                        type="button"
                        disabled={!pageNumber || pageNumber >= 604}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1"
                    >
                        &laquo; Berikutnya
                    </button>
                    <p className="text-[10px] text-amber-600 text-center hidden sm:block flex-1">
                        Sumber: api.quran.com · {verses.length} ayat ditampilkan
                        {clickable && ' · Klik ayat untuk input kesalahan'}
                    </p>
                    <button 
                        type="button"
                        disabled={!pageNumber || pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1"
                    >
                        Sebelumnya &raquo;
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Popup Button Mode (Mobile) ───────────────────────────────────────────────
function PopupViewer({ surahName, startAyah, verses, loading, error, onRefresh, pageNumber, onPageChange, highlightState }) {
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative bg-[#fdfaf4] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-amber-200"
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
                        <div className="flex-1 overflow-x-auto overflow-y-auto px-5 py-6 custom-scrollbar">
                            {loading && <div className="flex items-center justify-center py-16 gap-3"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /><span className="text-sm text-stone-500">Memuat ayat...</span></div>}
                            {error && !loading && <div className="text-center py-10 text-red-500 text-sm">{error}</div>}
                            {!loading && !error && verses.length > 0 && (() => {
                                const lines = {};
                                for (let i = 1; i <= 15; i++) lines[i] = [];

                                verses.forEach(v => {
                                    if (v.words) {
                                        v.words.forEach(w => {
                                            const l = w.line_number;
                                            if (lines[l]) lines[l].push({ ...w, verse_key: v.verse_key });
                                        });
                                    }
                                });

                                let headerIndices = [];
                                let bismillahIndices = [];
                                for (let i = 1; i <= 15; i++) {
                                    if (lines[i].length === 0) {
                                        let nextSurah = null;
                                        for (let j = i + 1; j <= 15; j++) {
                                            if (lines[j].length > 0) {
                                                const vk = lines[j][0].verse_key;
                                                if (vk && vk.endsWith(':1')) nextSurah = vk.split(':')[0];
                                                break;
                                            }
                                        }
                                        if (nextSurah) {
                                            if (i < 15 && lines[i + 1].length === 0) {
                                                headerIndices.push(i);
                                                bismillahIndices.push(i + 1);
                                            } else if (!bismillahIndices.includes(i)) {
                                                headerIndices.push(i);
                                            }
                                        }
                                    }
                                }

                                const renderContent = [];
                                for (let i = 1; i <= 15; i++) {
                                    if (headerIndices.includes(i)) {
                                        let nextS = null;
                                        for (let j = i + 1; j <= 15; j++) {
                                            if (lines[j].length > 0) { nextS = lines[j][0].verse_key.split(':')[0]; break; }
                                        }
                                        const surahNameMatched = Object.keys(SURAH_MAPPING).find(key => SURAH_MAPPING[key] === parseInt(nextS, 10));
                                        renderContent.push(
                                            <div key={`sheader-${i}`} className="w-full text-center relative opacity-90 shrink-0 flex items-center justify-center my-1" style={{ height: '4.5rem' }}>
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-amber-300 border-dashed"></div>
                                                </div>
                                                <div className="relative flex justify-center">
                                                    <span className="bg-[#fdfaf4] px-8 py-1.5 border border-amber-300 rounded-full text-sm font-bold text-amber-800 tracking-widest uppercase shadow-sm">
                                                        {surahNameMatched || `Surah ${nextS}`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                        continue;
                                    }
                                    if (bismillahIndices.includes(i)) {
                                        renderContent.push(
                                            <div key={`bismillah-${i}`} className="w-full text-center shrink-0 flex items-center justify-center" style={{ fontFamily: "'Amiri Quran', serif", fontSize: '2rem', height: '4.5rem' }}>
                                                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                            </div>
                                        );
                                        continue;
                                    }
                                    if (lines[i].length === 0) {
                                        renderContent.push(<div key={`empty-${i}`} className="w-full shrink-0" style={{ height: '4.5rem' }} />);
                                        continue;
                                    }

                                    const wordSpans = lines[i].map((w, idx) => {
                                        const isAyahEnd = w.char_type_name === 'end';
                                        const [wSurah, wAyah] = w.verse_key.split(':');
                                        const isStartInfo = surahName ? SURAH_MAPPING[surahName] : null;
                                        const isStart = w.verse_key === `${isStartInfo}:${startAyah}`;
                                        let isHighlighted = false;
                                        if (highlightState && highlightState.startVk) {
                                            const afterStart = isVerseInRange(w.verse_key, highlightState.startVk, null);
                                            if (highlightState.L_start !== null && pageNumber) {
                                                const w_global_line = (pageNumber - 1) * 15 + parseInt(w.line_number, 10);
                                                isHighlighted = afterStart && (w_global_line < highlightState.L_start + 8);
                                            } else {
                                                isHighlighted = afterStart;
                                            }
                                        }

                                        if (isAyahEnd) {
                                            return (
                                                <span key={`${w.verse_key}-${w.position}`}
                                                    className={`inline-flex items-center justify-center mx-1.5 rounded-full w-9 h-9 align-middle shrink-0 ${isHighlighted ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200' : 'bg-amber-100 text-amber-800'}`}
                                                    style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 600 }}>
                                                    {toArabicNum(wAyah)}
                                                </span>
                                            );
                                        }

                                        return (
                                            <span
                                                key={`${w.verse_key}-${w.position}`}
                                                className={`inline-flex items-center ${isHighlighted ? 'text-sky-900 bg-sky-50 ring-1 ring-sky-300 rounded px-0.5' : 'text-stone-800'}`}
                                            >
                                                {w.text_uthmani}
                                            </span>
                                        );
                                    });

                                    const nextLineEmpty = (i < 15 && lines[i + 1].length === 0);
                                    let flexStrategy = 'justify-between';
                                    if (nextLineEmpty || lines[i].length < 6) {
                                        flexStrategy = 'justify-center gap-2 sm:gap-3';
                                    }

                                    renderContent.push(
                                        <div key={`line-${i}`} className={`flex w-full items-center shrink-0 ${flexStrategy}`} style={{ direction: 'rtl', height: '4.5rem' }}>
                                            {wordSpans}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="min-w-[700px] max-w-4xl mx-auto flex flex-col font-normal py-8 px-2" style={{ fontFamily: "'Amiri Quran', serif", fontSize: '2.2rem', lineHeight: '4.5rem' }}>
                                        {renderContent}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="shrink-0 border-t border-amber-100 px-4 py-2 bg-amber-50 flex items-center justify-between">
                            <button 
                                type="button"
                                disabled={!pageNumber || pageNumber >= 604}
                                onClick={() => onPageChange(pageNumber + 1)}
                                className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                &laquo; Berikutnya
                            </button>
                            <p className="text-[10px] text-amber-600 hidden sm:block">Sumber: api.quran.com</p>
                            <button 
                                type="button"
                                disabled={!pageNumber || pageNumber <= 1}
                                onClick={() => onPageChange(pageNumber - 1)}
                                className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Sebelumnya &raquo;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function QuranPageViewer({ selectedJuz, surahName, verseStart, inline = false, onAyahClick = null }) {
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchKey, setFetchKey] = useState(0);
    const [pageNumber, setPageNumber] = useState(null);

    const [highlightState, setHighlightState] = useState({ startVk: null, L_start: null });

    const surahNum = surahName ? SURAH_MAPPING[surahName] : null;
    const startVerseKey = surahNum && verseStart ? `${surahNum}:${verseStart}` : null;

    useEffect(() => {
        if (!startVerseKey) return;
        if (highlightState.startVk !== startVerseKey) {
            setHighlightState({ startVk: startVerseKey, L_start: null });
        }
    }, [startVerseKey, highlightState.startVk]);

    useEffect(() => {
        if (!verses.length || !pageNumber || !startVerseKey) return;
        
        let newL_start = highlightState.L_start;
        let changed = false;

        if (newL_start === null) {
            const firstWord = verses.flatMap(v => v.words || []).find(w => w.verse_key === startVerseKey);
            if (firstWord) {
                newL_start = (pageNumber - 1) * 15 + parseInt(firstWord.line_number, 10);
                changed = true;
            }
        }

        if (changed) {
            setHighlightState(prev => ({ ...prev, L_start: newL_start }));
        }
    }, [verses, pageNumber, startVerseKey, highlightState.L_start]);

    useEffect(() => {
        console.log('useEffect triggered:', { surahNum, verseStart });

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

    const props = { surahName, startAyah: verseStart, verses, loading, error, onRefresh: handleRefresh, pageNumber, onPageChange: handlePageChange, highlightState };

    return inline
        ? <InlineViewer {...props} onAyahClick={onAyahClick} />
        : <PopupViewer {...props} />;
}
