import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, BookOpen, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { SURAH_MAPPING, estimatePageFromSurahAyah } from '@/Services/quranApi';

const API_BASE = 'https://api.quran.com/api/v4';

const toArabicNum = (n) =>
    String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

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
        accuratePage = 582; // Default to Juz 30 / An-Naba if not resolvable
    }

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

// ─── Inline Mode (Dioptimalkan Penuh untuk Layar HP & Desktop) ──────────────────
function InlineViewer({ surahName, startAyah, verses, loading, error, onRefresh, onAyahClick, pageNumber, onPageChange, highlightState }) {
    const startRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(0); // -1: Kecil, 0: Normal, 1: Besar, 2: Sangat Besar

    useEffect(() => {
        if (startRef.current) {
            startRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [verses]);

    const clickable = typeof onAyahClick === 'function';

    // Map ayah texts for quick modal lookup
    const versesMap = useMemo(() => {
        const map = {};
        verses.forEach(v => {
            if (v.verse_key) map[v.verse_key] = v;
        });
        return map;
    }, [verses]);

    // Ukuran Font & Line Height Responsif
    const fontConfig = {
        '-1': {
            sizeClass: 'text-lg sm:text-xl md:text-2xl',
            lineClass: 'leading-[2.8rem] sm:leading-[3.6rem]',
            heightStyle: '3.6rem',
            bismillahSize: '1.4rem'
        },
        '0': {
            sizeClass: 'text-xl sm:text-2xl md:text-3xl',
            lineClass: 'leading-[3.2rem] sm:leading-[4.2rem]',
            heightStyle: '4.2rem',
            bismillahSize: '1.75rem'
        },
        '1': {
            sizeClass: 'text-2xl sm:text-3xl md:text-4xl',
            lineClass: 'leading-[3.8rem] sm:leading-[4.8rem]',
            heightStyle: '4.8rem',
            bismillahSize: '2.1rem'
        },
        '2': {
            sizeClass: 'text-3xl sm:text-4xl md:text-5xl',
            lineClass: 'leading-[4.4rem] sm:leading-[5.6rem]',
            heightStyle: '5.6rem',
            bismillahSize: '2.5rem'
        }
    }[zoomLevel] || {
        sizeClass: 'text-xl sm:text-2xl md:text-3xl',
        lineClass: 'leading-[3.2rem] sm:leading-[4.2rem]',
        heightStyle: '4.2rem',
        bismillahSize: '1.75rem'
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#fcf9f2] rounded-none sm:rounded-2xl border-0 sm:border border-amber-200/70 shadow-xs overflow-hidden select-none">
            {/* BILAH KONTROL MUSHAF (Minimalis & Bebas Keterangan Doble) */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shrink-0 shadow-xs">
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

                {/* TENGAH: Nama Surat Aktif */}
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

            {/* AREA TEKS MUSHAF AL-QUR'AN */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-2 sm:px-6 py-4 custom-scrollbar bg-[#fdfaf4]">
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

                {!loading && !error && verses.length > 0 && (() => {
                    const lines = {};
                    for (let i = 1; i <= 15; i++) lines[i] = [];

                    verses.forEach(v => {
                        if (v.words) {
                            v.words.forEach(w => {
                                const l = w.line_number;
                                if (lines[l]) {
                                    lines[l].push({ ...w, verse_key: v.verse_key });
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
                        // Header Pembatas Surah
                        if (headerIndices.includes(i)) {
                            let nextS = null;
                            for (let j = i + 1; j <= 15; j++) {
                                if (lines[j].length > 0) { nextS = lines[j][0].verse_key.split(':')[0]; break; }
                            }
                            const surahNameMatched = Object.keys(SURAH_MAPPING).find(key => SURAH_MAPPING[key] === parseInt(nextS, 10));
                            renderContent.push(
                                <div key={`sheader-${i}`} className="w-full text-center relative shrink-0 flex items-center justify-center my-2" style={{ height: '3.5rem' }}>
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-amber-300 border-dashed"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-[#fcf8f0] px-6 py-1 border border-amber-400/80 rounded-full text-xs sm:text-sm font-bold text-amber-900 tracking-wider shadow-2xs">
                                            سُورَةُ {surahNameMatched || `Surah ${nextS}`}
                                        </span>
                                    </div>
                                </div>
                            );
                            continue;
                        }

                        // Kalimat Bismillah
                        if (bismillahIndices.includes(i)) {
                            renderContent.push(
                                <div 
                                    key={`bismillah-${i}`} 
                                    className="w-full text-center shrink-0 flex items-center justify-center text-stone-800" 
                                    style={{ 
                                        fontFamily: "'Amiri Quran', serif", 
                                        fontSize: fontConfig.bismillahSize, 
                                        height: '3.5rem' 
                                    }}
                                >
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                                </div>
                            );
                            continue;
                        }

                        if (lines[i].length === 0) {
                            renderContent.push(<div key={`empty-${i}`} className="w-full shrink-0" style={{ height: '1.5rem' }} />);
                            continue;
                        }

                        // Kata-kata dalam satu baris
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
                                    <span 
                                        key={`${w.verse_key}-${w.position}`}
                                        onClick={clickable ? () => onAyahClick({ 
                                            verse_key: w.verse_key, 
                                            text_uthmani: versesMap[w.verse_key]?.text_uthmani || '' 
                                        }) : undefined}
                                        className={`inline-flex items-center justify-center mx-1 rounded-full w-7 h-7 sm:w-8 sm:h-8 align-middle shrink-0 cursor-pointer transition-transform active:scale-95 ${
                                            isHighlighted 
                                                ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-200' 
                                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                                        }`}
                                        style={{ fontFamily: 'sans-serif', fontSize: '11px', fontWeight: 700 }}
                                        title={`Klik untuk menilai Ayat ${wAyah}`}
                                    >
                                        {toArabicNum(wAyah)}
                                    </span>
                                );
                            }

                            return (
                                <span
                                    key={`${w.verse_key}-${w.position}`}
                                    ref={isStart && idx === 0 ? startRef : null}
                                    onClick={clickable ? () => onAyahClick({ 
                                        verse_key: w.verse_key, 
                                        text_uthmani: versesMap[w.verse_key]?.text_uthmani || '' 
                                    }) : undefined}
                                    className={`inline-flex items-center transition-all duration-150 rounded px-1 py-0.5 ${
                                        isHighlighted 
                                            ? 'text-sky-950 bg-sky-100/90 ring-1 ring-sky-300 font-medium' 
                                            : 'text-stone-900'
                                    } ${clickable ? 'cursor-pointer hover:bg-amber-200/80 active:bg-amber-300' : ''}`}
                                    title={clickable ? `Klik untuk input kesalahan Ayat ${wAyah}` : undefined}
                                >
                                    {w.text_uthmani}
                                </span>
                            );
                        });

                        const nextLineEmpty = (i < 15 && lines[i + 1].length === 0);
                        let flexStrategy = 'justify-between';
                        if (nextLineEmpty || lines[i].length < 6) {
                            flexStrategy = 'justify-center gap-2 sm:gap-4';
                        }

                        renderContent.push(
                            <div 
                                key={`line-${i}`} 
                                className={`flex w-full items-center shrink-0 ${flexStrategy} flex-wrap sm:flex-nowrap`} 
                                style={{ direction: 'rtl', minHeight: fontConfig.heightStyle }}
                            >
                                {wordSpans}
                            </div>
                        );
                    }

                    return (
                        <div 
                            className={`w-full max-w-4xl mx-auto flex flex-col font-normal py-2 sm:py-6 px-1 sm:px-4 ${fontConfig.sizeClass} ${fontConfig.lineClass}`} 
                            style={{ fontFamily: "'Amiri Quran', serif" }}
                        >
                            {renderContent}
                        </div>
                    );
                })()}
            </div>

            {/* FOOTER RINGKAS DENGAN THUMB-FRIENDLY NAVIGASI */}
            {!loading && verses.length > 0 && (
                <div className="shrink-0 border-t border-amber-200/80 px-3 py-2 bg-amber-50/70 flex items-center justify-between text-xs text-amber-900">
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
    const [highlightState, setHighlightState] = useState({ startVk: null, L_start: null });

    const surahNum = surahName ? SURAH_MAPPING[surahName] : null;
    const startVerseKey = (surahNum && verseStart) ? `${surahNum}:${verseStart}` : null;

    useEffect(() => {
        setHighlightState({
            startVk: startVerseKey,
            L_start: null
        });
    }, [startVerseKey]);

    useEffect(() => {
        if (!verses.length || !pageNumber || !startVerseKey) return;
        
        let newL_start = highlightState.L_start;
        let changed = false;

        if (newL_start === null) {
            const startVerse = verses.find(v => v.verse_key === startVerseKey);
            if (startVerse && startVerse.words && startVerse.words.length > 0) {
                const firstWord = startVerse.words[0];
                newL_start = (pageNumber - 1) * 15 + parseInt(firstWord.line_number, 10);
                changed = true;
            }
        }

        if (changed) {
            setHighlightState(prev => ({ ...prev, L_start: newL_start }));
        }
    }, [verses, pageNumber, startVerseKey, highlightState.L_start]);

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

    const props = { surahName, startAyah: verseStart, verses, loading, error, onRefresh: handleRefresh, pageNumber, onPageChange: handlePageChange, highlightState };

    return inline
        ? <InlineViewer {...props} onAyahClick={onAyahClick} />
        : <PopupViewer {...props} />;
}
