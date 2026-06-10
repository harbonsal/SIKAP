import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, Pause, Play, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { estimatePageFromSurahAyah, JUZ_TO_PAGE } from '@/Services/quranApi';
import axios from 'axios';

const SURAH_NAMES = ['Al-Fatihah', 'Al-Baqarah', "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", 'Al-Anfal', 'At-Taubah', 'Yunus', 'Hud', 'Yusuf', "Ar-Ra'd", 'Ibrahim', 'Al-Hijr', 'An-Nahl', "Al-Isra'", 'Al-Kahf', 'Maryam', 'Taha', "Al-Anbiya'", 'Al-Hajj', "Al-Mu'minun", 'An-Nur', 'Al-Furqan', "Ash-Shu'ara'", 'An-Naml', 'Al-Qasas', 'Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab', "Saba'", 'Fatir', 'Ya Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', "Al-Waqi'ah", 'Al-Hadid', 'Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', "Al-Jumu'ah", 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', "Al-Ma'arij", 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddathir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', "An-Naba'", "An-Nazi'at", 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', "Al-A'la", 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Lail', 'Ad-Duha', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', "Al-Qari'ah", 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraish', "Al-Ma'un", 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Lahab', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'];
const SURAH_AYAHS = [0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
const SURAH_LIST = SURAH_NAMES.map((name, index) => ({ number: index + 1, name, ayahs: SURAH_AYAHS[index + 1] }));
const JUZ_SURAH_MAP = { 1: [1, 2], 2: [2], 3: [2, 3], 4: [3, 4], 5: [4], 6: [4, 5], 7: [5, 6], 8: [6, 7], 9: [7, 8], 10: [8, 9], 11: [9, 10], 12: [11, 12], 13: [12, 13, 14, 15], 14: [15, 16], 15: [17, 18], 16: [18, 19, 20], 17: [21, 22], 18: [23, 24, 25], 19: [25, 26, 27], 20: [27, 28, 29], 21: [29, 30, 31, 32, 33], 22: [33, 34, 35, 36], 23: [36, 37, 38, 39], 24: [39, 40, 41], 25: [41, 42, 43, 44, 45, 46], 26: [46, 47, 48, 49, 50, 51], 27: [51, 52, 53, 54, 55, 56, 57], 28: [58, 59, 60, 61, 62, 63, 64, 65, 66], 29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77], 30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114] };
const RECITERS = [['Alafasy_128kbps', 'Mishary Rashid Al-Afasy'], ['Abdul_Basit_Murattal_192kbps', 'Abdul Basit Abd us-Samad (Murattal)'], ['Abdul_Basit_Mujawwad_128kbps', 'Abdul Basit Abd us-Samad (Mujawwad)'], ['Husary_128kbps', 'Mahmoud Khalil Al-Husary'], ['Minshawi_Murattal_128kbps', 'Mohamed Siddiq El-Minshawi'], ['Muhammad_Jibreel_128kbps', 'Muhammad Jibreel'], ['Maher_AlMuaiqly_128kbps', 'Maher Al-Muaiqly'], ['Saood_ash-Shuraym_128kbps', 'Saood Ash-Shuraym (Saud Al-Shuraim)'], ['Hani_Rifai_192kbps', 'Hani Ar-Rifai'], ['Abu_Bakr_Ash-Shaatree_128kbps', 'Abu Bakr Ash-Shaatree'], ['Abdullaah_3awwaad_Al-Juhaynee_128kbps', 'Abdullah Awad Al-Juhani'], ['Yasser_Ad-Dussary_128kbps', 'Yasser Ad-Dussary'], ['f.jaleel', 'Fares Abbad (Al-Jaleel)'], ['Nasser_Alqatami_128kbps', 'Nasser Al-Qatami'], ['Ibrahim_Al-Akhdar_128kbps', 'Ibrahim Al-Akhdar']].map(([id, name]) => ({ id, name }));
const API_BASE = 'https://api.quran.com/api/v4';
const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);

function getAudioUrl(surahNum, ayahNum, reciterId) {
    const surah = String(surahNum).padStart(3, '0');
    const ayah = String(ayahNum).padStart(3, '0');
    return `https://everyayah.com/data/${reciterId}/${surah}${ayah}.mp3`;
}

function toArabicNumber(value) {
    return String(value).replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
}

function getJuzFromSurah(surahNumber) {
    for (const [juz, surahs] of Object.entries(JUZ_SURAH_MAP)) {
        if (surahs.includes(surahNumber)) {
            return parseInt(juz, 10);
        }
    }
    return null;
}

async function getAccuratePageFromSurahAyah(surahNumber, ayahNumber) {
    try {
        const response = await fetch(`${API_BASE}/verses/by_key/${surahNumber}:${ayahNumber}?fields=page_number`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.verses?.[0]?.page_number || null;
    } catch (error) {
        console.error('Gagal mengambil halaman akurat:', error);
        return null;
    }
}

export default function QuranTilawah({ is_admin = false, hidden_qori_ids = [] }) {
    const [pageNumber, setPageNumber] = useState(1);
    const [inputPage, setInputPage] = useState('1');
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedJuz, setSelectedJuz] = useState('');
    const [selectedSurah, setSelectedSurah] = useState('');
    const [selectedAyahFrom, setSelectedAyahFrom] = useState('');
    const [selectedAyahTo, setSelectedAyahTo] = useState('all');
    const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
    const [hiddenQoriIds, setHiddenQoriIds] = useState(Array.isArray(hidden_qori_ids) ? hidden_qori_ids : []);
    const [showManageModal, setShowManageModal] = useState(false);
    const [playingKey, setPlayingKey] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);

    const abortRef = useRef(null);
    const audioRef = useRef(null);
    const playQueueRef = useRef([]);
    const queueIndexRef = useRef(0);

    const filteredSurahList = SURAH_LIST;
    const selectedSurahObj = SURAH_LIST.find(surah => surah.number === parseInt(selectedSurah, 10));
    const availableAyahs = selectedSurahObj ? Array.from({ length: selectedSurahObj.ayahs }, (_, i) => i + 1) : [];
    const availableReciters = RECITERS.filter(reciter => is_admin || !hiddenQoriIds.includes(reciter.id));

    useEffect(() => {
        if (!availableReciters.some(reciter => reciter.id === selectedReciter)) {
            setSelectedReciter(availableReciters[0]?.id || RECITERS[0].id);
        }
    }, [availableReciters, selectedReciter]);

    useEffect(() => {
        if (selectedSurah) {
            const surahNumber = parseInt(selectedSurah, 10);
            const juzForSurah = getJuzFromSurah(surahNumber);
            if (juzForSurah) {
                setSelectedJuz(String(juzForSurah));
            }
        }
    }, [selectedSurah]);

    useEffect(() => {
        if (!selectedSurah) {
            setSelectedAyahFrom('');
            setSelectedAyahTo('all');
            return;
        }

        const fromAyah = parseInt(selectedAyahFrom, 10);
        if (!fromAyah || fromAyah > (selectedSurahObj?.ayahs || 0)) {
            setSelectedAyahFrom('1');
        }

        if (selectedAyahTo !== 'all') {
            const toAyah = parseInt(selectedAyahTo, 10);
            if (!toAyah || toAyah > (selectedSurahObj?.ayahs || 0)) {
                setSelectedAyahTo('all');
            }
        }
    }, [selectedSurah, selectedAyahFrom, selectedAyahTo, selectedSurahObj]);

    useEffect(() => () => {
        abortRef.current?.abort();
        audioRef.current?.pause();
    }, []);

    useEffect(() => {
        setInputPage(String(pageNumber));
    }, [pageNumber]);

    useEffect(() => {
        const loadPage = async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            setError(null);
            setVerses([]);

            try {
                const response = await fetch(`${API_BASE}/verses/by_page/${pageNumber}?fields=text_uthmani,verse_key,juz_number&per_page=50`, { signal: controller.signal });
                if (!response.ok) throw new Error('Gagal mengambil data');
                const data = await response.json();
                setVerses(data.verses || []);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(navigator.onLine ? 'Gagal memuat halaman. Coba beberapa saat lagi.' : 'Tidak ada koneksi internet. Hubungkan perangkat ke internet terlebih dahulu.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [pageNumber]);

    const goToPage = page => setPageNumber(Math.max(1, Math.min(604, page)));

    const getRangeStart = () => {
        const fromAyah = parseInt(selectedAyahFrom || '1', 10);
        return Number.isInteger(fromAyah) && fromAyah > 0 ? fromAyah : 1;
    };

    const getRangeEnd = () => {
        if (!selectedSurahObj) return null;
        if (selectedAyahTo === 'all' || !selectedAyahTo) return selectedSurahObj.ayahs;

        const toAyah = parseInt(selectedAyahTo, 10);
        if (!Number.isInteger(toAyah) || toAyah <= 0) return selectedSurahObj.ayahs;
        return Math.min(toAyah, selectedSurahObj.ayahs);
    };

    const buildSelectedQueue = () => {
        if (selectedSurahObj) {
            const startAyah = getRangeStart();
            const endAyah = Math.max(startAyah, getRangeEnd() ?? startAyah);
            return Array.from({ length: endAyah - startAyah + 1 }, (_, index) => ({
                surah: selectedSurahObj.number,
                ayah: startAyah + index,
                key: `${selectedSurahObj.number}:${startAyah + index}`,
            }));
        }

        return verses.map(verse => {
            const [surah, ayah] = verse.verse_key.split(':').map(Number);
            return { surah, ayah, key: verse.verse_key };
        });
    };

    const stopAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        playQueueRef.current = [];
        queueIndexRef.current = 0;
        setIsPlaying(false);
        setAudioProgress(0);
        setPlayingKey(null);
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (audioRef.current) audioRef.current.muted = nextMuted;
    };

    const playAyah = (surahNum, ayahNum, queue = null, queueIndex = 0) => {
        const verseKey = `${surahNum}:${ayahNum}`;
        const audioUrl = getAudioUrl(surahNum, ayahNum, selectedReciter);

        if (queue) {
            playQueueRef.current = queue;
            queueIndexRef.current = queueIndex;
        } else {
            playQueueRef.current = [{ surah: surahNum, ayah: ayahNum, key: verseKey }];
            queueIndexRef.current = 0;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
        }

        if (playingKey !== verseKey) {
            audioRef.current.pause();
            audioRef.current = new Audio(audioUrl);
        } else {
            audioRef.current.src = audioUrl;
        }

        audioRef.current.muted = isMuted;
        audioRef.current.ontimeupdate = () => {
            const duration = audioRef.current?.duration || 0;
            const currentTime = audioRef.current?.currentTime || 0;
            setAudioProgress(duration > 0 ? (currentTime / duration) * 100 : 0);
        };
        audioRef.current.onended = () => {
            const nextIndex = queueIndexRef.current + 1;
            const nextItem = playQueueRef.current[nextIndex];

            if (nextItem) {
                playAyah(nextItem.surah, nextItem.ayah, playQueueRef.current, nextIndex);
                return;
            }

            setIsPlaying(false);
            setAudioProgress(100);
        };

        audioRef.current.play().then(() => {
            setPlayingKey(verseKey);
            setIsPlaying(true);
        }).catch(() => {
            setIsPlaying(false);
        });
    };

    const handlePlayPause = () => {
        if (audioRef.current && playingKey) {
            if (audioRef.current.paused) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
            return;
        }

        // Buka halaman terlebih dahulu jika ada seleksi
        openSelection();

        if (selectedSurah) {
            const queue = buildSelectedQueue();
            if (queue.length > 0) {
                const firstItem = queue[0];
                playAyah(firstItem.surah, firstItem.ayah, queue, 0);
            }
            return;
        }

        const firstVerse = verses[0];
        if (firstVerse) {
            const queue = buildSelectedQueue();
            const firstItem = queue[0];
            if (firstItem) {
                playAyah(firstItem.surah, firstItem.ayah, queue, 0);
            }
        }
    };

    const openSelection = async () => {
        if (selectedSurahObj) {
            const startAyah = getRangeStart();
            const accuratePage = await getAccuratePageFromSurahAyah(selectedSurahObj.number, startAyah);
            if (accuratePage) {
                goToPage(accuratePage);
            } else {
                // Fallback to estimation if API fails
                goToPage(estimatePageFromSurahAyah(selectedSurahObj.name, startAyah, selectedJuz || undefined));
            }
            return;
        }

        if (selectedJuz) {
            goToPage(JUZ_TO_PAGE[parseInt(selectedJuz, 10)] || 1);
        }
    };

    useEffect(() => {
        if (!playingKey || !audioRef.current) return;

        const [surahNum, ayahNum] = playingKey.split(':').map(Number);
        const wasPlaying = !audioRef.current.paused;

        audioRef.current.pause();
        audioRef.current.src = getAudioUrl(surahNum, ayahNum, selectedReciter);
        audioRef.current.load();
        audioRef.current.muted = isMuted;

        if (wasPlaying) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, [selectedReciter]);

    useEffect(() => {
        if (!selectedSurahObj || selectedAyahTo === 'all') return;

        const startAyah = getRangeStart();
        const endAyah = parseInt(selectedAyahTo, 10);

        if (Number.isInteger(endAyah) && endAyah < startAyah) {
            setSelectedAyahTo(String(startAyah));
        }
    }, [selectedAyahFrom, selectedAyahTo, selectedSurahObj]);

    const groupedVerses = verses.reduce((accumulator, verse) => {
        const [surahNumber] = verse.verse_key.split(':');
        if (!accumulator[surahNumber]) accumulator[surahNumber] = [];
        accumulator[surahNumber].push(verse);
        return accumulator;
    }, {});

    const currentJuz = verses[0]?.juz_number;

    return (
        <MainLayout>
            <Head title="Tilawah Al-Quran - Mushaf Madinah" />
            <link href="https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap" rel="stylesheet" />

            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-100 pb-28">
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-lg sticky top-0 z-20">
                    <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 mr-auto">
                            <BookOpen className="h-5 w-5 text-emerald-300" />
                            <span className="font-semibold text-lg">Tilawah Al-Quran</span>
                            <span className="text-emerald-300 text-sm hidden md:block">Mushaf Madinah</span>
                        </div>
                        {currentJuz && <span className="text-xs bg-emerald-700/50 px-2 py-1 rounded-full">Juz {currentJuz}</span>}
                        <div className="flex items-center gap-2 bg-emerald-900/50 rounded-lg px-3 py-1.5">
                            <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="text-white/80 hover:text-white disabled:opacity-30 transition-opacity">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-1 text-sm">
                                <span className="text-emerald-300">Hal.</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={604}
                                    value={inputPage}
                                    onChange={e => setInputPage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && goToPage(parseInt(inputPage, 10) || 1)}
                                    onBlur={() => goToPage(parseInt(inputPage, 10) || 1)}
                                    className="w-14 text-center bg-emerald-900 border border-emerald-600 rounded px-1 py-0.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                />
                                <span className="text-emerald-400">/ 604</span>
                            </div>
                            <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= 604} className="text-white/80 hover:text-white disabled:opacity-30 transition-opacity">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-emerald-300 text-xs font-medium">Pilih Juz</label>
                            <select value={selectedJuz} onChange={e => setSelectedJuz(e.target.value)} className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[95px]">
                                <option value="">Semua Juz</option>
                                {JUZ_LIST.map(juz => <option key={juz} value={juz}>Juz {juz}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-emerald-300 text-xs font-medium">Pilih Surah</label>
                            <select value={selectedSurah} onChange={e => setSelectedSurah(e.target.value)} className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[210px]">
                                <option value="">Semua Surah</option>
                                {filteredSurahList.map(surah => <option key={surah.number} value={surah.number}>{surah.number}. {surah.name}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-emerald-300 text-xs font-medium">Dari Ayat</label>
                            <select value={selectedAyahFrom} onChange={e => setSelectedAyahFrom(e.target.value)} disabled={!selectedSurah} className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[110px] disabled:opacity-50">
                                <option value="">{selectedSurah ? 'Ayat 1' : 'Pilih Surah'}</option>
                                {availableAyahs.map(ayah => <option key={ayah} value={ayah}>Ayat {ayah}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-emerald-300 text-xs font-medium">Sampai Ayat</label>
                            <select value={selectedAyahTo} onChange={e => setSelectedAyahTo(e.target.value)} disabled={!selectedSurah} className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[130px] disabled:opacity-50">
                                <option value="all">Semua Ayat</option>
                                {availableAyahs
                                    .filter(ayah => ayah >= getRangeStart())
                                    .map(ayah => <option key={ayah} value={ayah}>Ayat {ayah}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <label className="text-emerald-300 text-xs font-medium">Pilih Qari</label>
                                {is_admin && (
                                    <button type="button" onClick={() => setShowManageModal(true)} className="text-emerald-400 hover:text-white transition-colors" title="Kelola daftar qari">
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <select value={selectedReciter} onChange={e => setSelectedReciter(e.target.value)} className="bg-emerald-900 border border-emerald-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 min-w-[210px]">
                                {availableReciters.length > 0 ? availableReciters.map(reciter => <option key={reciter.id} value={reciter.id}>{reciter.name}{is_admin && hiddenQoriIds.includes(reciter.id) ? ' (Hidden)' : ''}</option>) : <option value="" disabled>Tidak ada qari tersedia</option>}
                            </select>
                        </div>

                        <div className="flex gap-2 self-end">
                            <button onClick={openSelection} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors border border-white/10">Buka</button>
                            <button onClick={handlePlayPause} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                {isPlaying ? 'Jeda' : 'Putar'}
                            </button>
                            <button onClick={() => { setSelectedJuz(''); setSelectedSurah(''); setSelectedAyahFrom(''); setSelectedAyahTo('all'); stopAudio(); goToPage(1); }} className="text-emerald-400 hover:text-white text-xs pb-0.5 transition-colors">Reset</button>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="mb-5 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-stone-800">Mode tilawah umum</p>
                        <p className="mt-1 text-sm text-stone-500">
                            Halaman ini hanya untuk membaca dan menyimak audio Al-Quran tanpa menyimpan progres atau input apa pun.
                        </p>
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                            <p className="text-stone-500 text-sm">Memuat halaman {pageNumber}...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-20">
                            <p className="text-red-500 font-semibold">{error}</p>
                            <button onClick={() => goToPage(pageNumber)} className="mt-4 text-sm text-emerald-600 hover:underline">Coba lagi</button>
                        </div>
                    )}

                    {!loading && !error && verses.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl border border-amber-200/60 overflow-hidden">
                            <div className="flex items-center justify-center py-3 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-b border-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
                                    <span className="text-amber-700 text-xs font-medium tracking-widest uppercase">Halaman {pageNumber}</span>
                                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                {Object.entries(groupedVerses).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)).map(([surahNumber, surahVerses]) => {
                                    const surah = SURAH_LIST.find(item => item.number === parseInt(surahNumber, 10));

                                    return (
                                        <div key={surahNumber} className="mb-8">
                                            <div className="text-center mb-4">
                                                <div className="inline-flex flex-col items-center gap-1 bg-gradient-to-b from-emerald-800 to-emerald-950 text-white px-8 py-3 rounded-xl shadow-md">
                                                    <span className="text-lg font-semibold">{surah?.name || `Surah ${surahNumber}`}</span>
                                                    <span className="text-emerald-300 text-xs">{surah?.ayahs || surahVerses.length} Ayat</span>
                                                </div>
                                            </div>

                                            <div className="text-right leading-[3.2rem]" style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }}>
                                                {surahVerses.map(verse => {
                                                    const [surahNum, ayahNum] = verse.verse_key.split(':').map(Number);
                                                    const isActiveAyah = playingKey === verse.verse_key;

                                                    return (
                                                        <span key={verse.verse_key} className="text-[2rem] text-stone-800 leading-loose">
                                                            {verse.text_uthmani}
                                                            <button
                                                                type="button"
                                                                onClick={() => playAyah(surahNum, ayahNum)}
                                                                className={`inline-flex items-center justify-center mx-1 px-1 py-0.5 rounded text-sm font-medium transition-all ${isActiveAyah ? 'text-emerald-600 bg-emerald-100 ring-2 ring-emerald-300' : 'text-emerald-700 hover:bg-emerald-50 hover:ring-2 hover:ring-emerald-200'}`}
                                                                title="Putar ayat ini"
                                                            >
                                                                ﴾{toArabicNumber(ayahNum)}﴿
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-center py-3 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-t border-amber-200">
                                <span className="text-amber-600 font-medium text-sm">{pageNumber}</span>
                            </div>
                        </div>
                    )}

                    {!loading && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} className="flex items-center gap-2 bg-white border border-stone-200 hover:border-emerald-400 hover:text-emerald-700 text-stone-600 px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-30 text-sm font-medium">
                                <ChevronLeft className="h-4 w-4" /> Sebelumnya
                            </button>
                            <span className="text-stone-400 text-sm">{pageNumber} / 604</span>
                            <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= 604} className="flex items-center gap-2 bg-white border border-stone-200 hover:border-emerald-400 hover:text-emerald-700 text-stone-600 px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-30 text-sm font-medium">
                                Berikutnya <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-center text-xs text-stone-400 pb-4">
                    Sumber: api.quran.com • Audio: everyayah.com • Halaman {pageNumber} dari 604
                </div>
            </div>

            {playingKey && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900 to-emerald-950 border-t-2 border-emerald-600 shadow-2xl">
                    <div className="h-1 bg-emerald-800">
                        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                    </div>

                    <div className="max-w-3xl mx-auto flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{RECITERS.find(reciter => reciter.id === selectedReciter)?.name}</p>
                            <p className="text-emerald-300 text-xs">Surah {playingKey.split(':')[0]} : Ayat {playingKey.split(':')[1]}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handlePlayPause} className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-full p-2.5 transition-colors shadow-lg">
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>
                            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <button onClick={stopAudio} className="text-emerald-400 hover:text-white text-xs transition-colors ml-1">Stop</button>
                        </div>
                    </div>
                </div>
            )}

            {is_admin && showManageModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowManageModal(false)} />
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
                                Klik ikon mata untuk menyembunyikan qari tertentu dari pengguna umum. Pengaturan disimpan otomatis.
                            </p>

                            {RECITERS.map(reciter => {
                                const isHidden = hiddenQoriIds.includes(reciter.id);

                                return (
                                    <div key={reciter.id} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-emerald-50 transition-colors">
                                        <span className={`text-sm font-medium ${isHidden ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{reciter.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = isHidden ? hiddenQoriIds.filter(id => id !== reciter.id) : [...hiddenQoriIds, reciter.id];
                                                setHiddenQoriIds(next);
                                                axios.post('/quran/settings', { key: 'quran_hidden_qoris', value: next }).catch(() => {
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
                            <button type="button" onClick={() => setShowManageModal(false)} className="bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow">
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
