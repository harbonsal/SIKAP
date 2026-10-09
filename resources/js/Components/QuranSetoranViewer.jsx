import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { SURAH_MAPPING } from '@/Services/quranApi';
import axios from 'axios';

const API_BASE = 'https://api.quran.com/api/v4';

const MISTAKE_TYPES = [
    "Makharijul Huruf", "Sifatul Huruf", "Hukum Nun Sukun dan Tanwin (Izhar)",
    "Hukum Nun Sukun dan Tanwin (Ikhfa')", "Hukum Nun Sukun dan Tanwin (Idgham/Iqlab)",
    "Hukum Mim Sukun", "Hukum Mad (Mad Thabi'i)", "Hukum Mad (Mad Wajib Muttashil)",
    "Hukum Mad (Mad Jaiz Munfashil)", "Qolqolah", "Harakat & Huruf"
];

const toArabicNum = (n) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

export default function QuranSetoranViewer({ studentId, juz, initialPageNumber, juzDetails, onClose, onUpdate, sessionType }) {
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedAyah, setSelectedAyah] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const pageDetail = juzDetails ? juzDetails[initialPageNumber] : null;
    const isHalf = pageDetail?.status === 'half';
    const initialMistakes = pageDetail?.mistake_count || 0;
    const lastVerseKey = pageDetail?.verse_key;

    const [localMistakesCount, setLocalMistakesCount] = useState(initialMistakes);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE}/verses/by_page/${initialPageNumber}?words=true&word_fields=line_number,text_uthmani&fields=text_uthmani,verse_key,juz_number&per_page=200`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(json => {
                setVerses(json.verses || []);
                setLoading(false);
            })
            .catch(() => {
                setError('Gagal memuat halaman.');
                setLoading(false);
            });
    }, [initialPageNumber]);

    const handleWordClick = (verseKey, surahNum) => {
        const surahName = Object.keys(SURAH_MAPPING).find(key => SURAH_MAPPING[key] === parseInt(surahNum, 10)) || `Surah ${surahNum}`;
        setSelectedAyah({ verseKey, surahName, surahNum });
        setIsActionModalOpen(true);
    };

    const submitMistake = async (actionType, mistakeType = null) => {
        if (!selectedAyah) return;
        setActionLoading(true);
        try {
            const response = await axios.post(route('tahfidz.achievements.record-mistake'), {
                student_id: studentId,
                juz: juz,
                page_number: initialPageNumber,
                verse_key: selectedAyah.verseKey,
                surah_name: selectedAyah.surahName,
                action: actionType,
                mistake_type: mistakeType,
                type: sessionType
            });
            if (response.data && response.data.success) {
                setLocalMistakesCount(response.data.mistake_count);
            }
            setIsActionModalOpen(false);
            // DO NOT call onUpdate() here to prevent Inertia reload and modal closing
        } catch (err) {
            alert('Gagal merekam kesalahan');
        } finally {
            setActionLoading(false);
        }
    };

    const submitHalfPage = async () => {
        if (!selectedAyah) return;
        setActionLoading(true);
        try {
            await axios.post(route('tahfidz.achievements.update-page'), {
                student_id: studentId,
                juz: juz,
                page_number: initialPageNumber,
                status: 'half',
                verse_key: selectedAyah.verseKey,
                surah_name: selectedAyah.surahName,
                type: sessionType
            });
            setIsActionModalOpen(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('Gagal mengubah status halaman');
        } finally {
            setActionLoading(false);
        }
    };

    const submitFullPage = async () => {
        setActionLoading(true);
        try {
            await axios.post(route('tahfidz.achievements.update-page'), {
                student_id: studentId,
                juz: juz,
                page_number: initialPageNumber,
                status: 'full',
                type: sessionType
            });
            onClose();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('Gagal mengubah status halaman');
        } finally {
            setActionLoading(false);
        }
    };

    const isAfterLastVerse = (vk) => {
        if (!isHalf || !lastVerseKey) return false;
        const [s1, a1] = vk.split(':').map(Number);
        const [s2, a2] = lastVerseKey.split(':').map(Number);
        return (s1 > s2 || (s1 === s2 && a1 > a2));
    };

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
            const unread = isAfterLastVerse(w.verse_key);

            if (isAyahEnd) {
                return (
                    <span key={`${w.verse_key}-${w.position}`}
                        className={`inline-flex items-center justify-center mx-1.5 rounded-full w-9 h-9 align-middle shrink-0 ${unread ? 'bg-gray-100 text-gray-400' : 'bg-amber-100 text-amber-800'}`}
                        style={{ fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 600 }}>
                        {toArabicNum(wAyah)}
                    </span>
                );
            }

            return (
                <span
                    key={`${w.verse_key}-${w.position}`}
                    onClick={() => handleWordClick(w.verse_key, wSurah)}
                    className={`inline-flex items-center transition-colors rounded px-0.5 cursor-pointer ${unread ? 'text-gray-300 hover:text-gray-500' : 'text-stone-800 hover:bg-amber-100 hover:text-amber-900'}`}
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
        <div className="flex flex-col h-[90vh] bg-[#fdfaf4] rounded-xl overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                    <span className="font-semibold">Halaman {initialPageNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                    {localMistakesCount > 0 && (
                        <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold transition-all">
                            <AlertTriangle className="w-3 h-3" /> {localMistakesCount} Salah
                        </div>
                    )}
                    <button onClick={onClose} className="text-white hover:text-red-200 font-bold text-xl leading-none">&times;</button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto px-5 py-6 custom-scrollbar">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                )}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-red-500 font-medium">
                        {error}
                    </div>
                )}
                {!loading && !error && verses.length > 0 && (
                    <div className="min-w-[700px] max-w-4xl mx-auto flex flex-col font-normal py-4 px-2" style={{ fontFamily: "'Amiri Quran', serif", fontSize: '2.2rem', lineHeight: '4.5rem' }}>
                        {renderContent}
                    </div>
                )}
            </div>

            {!loading && verses.length > 0 && (
                <div className="shrink-0 p-4 bg-white border-t flex justify-center">
                    <Button onClick={submitFullPage} disabled={actionLoading} className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg flex items-center justify-center gap-2">
                        {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SELESAI HALAMAN INI'}
                    </Button>
                </div>
            )}

            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Aksi Setoran & Kesalahan</DialogTitle>
                        <DialogDescription>
                            Ayat {selectedAyah?.verseKey?.split(':')[1]} Surat {selectedAyah?.surahName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <div className="max-h-[40vh] overflow-y-auto px-1 py-1 custom-scrollbar">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Catat Kesalahan</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {MISTAKE_TYPES.map((type, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            onClick={() => submitMistake('add', type)}
                                            disabled={actionLoading}
                                            className="h-auto py-2 text-xs font-semibold justify-start text-left border-red-200 hover:bg-red-50 hover:text-red-700 text-stone-700 whitespace-normal h-full"
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">Lainnya</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <Button variant="outline" onClick={() => submitMistake('clear')} disabled={actionLoading} className="w-full py-4 text-sm font-semibold text-green-600 border-green-200 hover:bg-green-50">
                            MUMTAZ / HAPUS SEMUA KESALAHAN AYAT INI
                        </Button>
                        <Button variant="secondary" onClick={submitHalfPage} disabled={actionLoading} className="w-full py-4 text-sm font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200">
                            SETOR SAMPAI AYAT INI (SETENGAH)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
