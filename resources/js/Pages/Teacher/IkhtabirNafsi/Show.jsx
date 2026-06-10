import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { IconArrowLeft, IconAward, IconMessageCircle, IconClipboardCheck } from '@tabler/icons-react';
import { confirmDelete } from '@/lib/sweetalert';

export default function Show({ auth, attempt, is_manager }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-blue-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const CEFR_DESCRIPTIONS = {
        'A1': 'Pemula (Beginner) - Dapat memahami dan menggunakan ungkapan sehari-hari yang sangat umum.',
        'A2': 'Dasar (Elementary) - Dapat memahami kalimat dan ungkapan yang sering digunakan terkait area relevansi langsung.',
        'B1': 'Menengah (Intermediate) - Dapat memahami poin-poin utama dari input standar yang jelas mengenai hal-hal familiar.',
        'B2': 'Menengah Atas (Upper Intermediate) - Dapat memahami ide utama teks kompleks dan berinteraksi dengan tingkat kefasihan yang memadai.',
        'C1': 'Mahir (Advanced) - Dapat memahami berbagai teks panjang dan menantang, serta mengekspresikan ide dengan lancar.',
        'C2': 'Sangat Mahir (Proficiency) - Dapat memahami dengan mudah hampir semua yang didengar atau dibaca.'
    };

    const toNumberOrNull = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const inferSchoolLevelRecommendation = (cefrLevel, suitableToTeach) => {
        if (!suitableToTeach) {
            return 'Belum Direkomendasikan';
        }

        const map = {
            A1: 'Belum Direkomendasikan',
            A2: 'Belum Direkomendasikan',
            B1: 'Layak SD',
            B2: 'Layak SD/SMP',
            C1: 'Layak SD/SMP/SMA',
            C2: 'Layak SD/SMP/SMA',
        };

        return map[cefrLevel] || 'Rekomendasi jenjang belum spesifik. Perlu verifikasi supervisor.';
    };

    const inferCefrFromFinalScore = (totalScore) => {
        const score = toNumberOrNull(totalScore);
        if (score === null) return null;
        if (score >= 24) return 'C2';
        if (score >= 22) return 'C1';
        if (score >= 18) return 'B2';
        if (score >= 14) return 'B1';
        if (score >= 10) return 'A2';
        if (score >= 7) return 'A1';
        return 'Belum Mencapai A1';
    };

    const explainSchoolLevelBullets = (recommendedText) => {
        const text = String(recommendedText || '').toLowerCase();
        return {
            sd: text.includes('sd') || text.includes('semua jenjang'),
            smp: text.includes('smp') || text.includes('semua jenjang'),
            sma: text.includes('sma') || text.includes('semua jenjang'),
        };
    };

    const buildFallbackAnalysis = (label, score) => {
        if (score === null) {
            return `Analisis ${label} belum tersedia karena data skor tidak lengkap.`;
        }
        if (score <= 1) {
            return `${label}: performa masih sangat terbatas, sehingga perlu penguatan fundamental sebelum naik level.`;
        }
        if (score === 2) {
            return `${label}: kemampuan dasar sudah muncul, namun konsistensi masih lemah dan perlu latihan terstruktur.`;
        }
        if (score === 3) {
            return `${label}: sudah memenuhi standar minimum, tetapi kualitas masih belum stabil di semua konteks.`;
        }
        if (score === 4) {
            return `${label}: sudah baik dan relatif konsisten, dengan sedikit area yang masih perlu penyempurnaan.`;
        }
        return `${label}: sangat baik dan konsisten, menunjukkan penguasaan kuat pada indikator ini.`;
    };

    const criteriaRows = [
        {
            label: 'Spoken Production',
            score: toNumberOrNull(attempt.spoken_production_score),
            analysis: attempt.spoken_production_analysis,
            desc: 'Sistematika, struktur penjelasan, dan konteks.',
        },
        {
            label: 'Range (Keluasan)',
            score: toNumberOrNull(attempt.range_score),
            analysis: attempt.range_analysis,
            desc: 'Variasi kosakata, istilah akademik, dan struktur kompleks.',
        },
        {
            label: 'Accuracy (Ketepatan)',
            score: toNumberOrNull(attempt.accuracy_score),
            analysis: attempt.accuracy_analysis,
            desc: 'Gramatika (Nahwu/Sharaf) dan kontrol kesalahan.',
        },
        {
            label: 'Fluency (Kelancaran)',
            score: toNumberOrNull(attempt.fluency_score_advanced ?? attempt.fluency_score),
            analysis: attempt.fluency_analysis,
            desc: 'Alur bicara alami, minim jeda/filler tidak perlu.',
        },
        {
            label: 'Coherence (Keterpaduan)',
            score: toNumberOrNull(attempt.coherence_score),
            analysis: attempt.coherence_analysis,
            desc: 'Logika, transisi, dan kohesi antar kalimat.',
        },
    ];

    const validScores = criteriaRows
        .map((item) => item.score)
        .filter((s) => s !== null && s >= 0);

    const totalScore25 = validScores.length
        ? clamp(validScores.reduce((sum, s) => sum + s, 0), 0, 25)
        : 0;

    const averageScore15 = validScores.length
        ? clamp(validScores.reduce((sum, s) => sum + s, 0) / validScores.length, 0, 5)
        : 0;

    const derivedFinalScore100 = clamp(Math.round((totalScore25 / 25) * 100), 0, 100);
    const rawFinalScore = toNumberOrNull(attempt.final_score);
    const finalScore100 = (rawFinalScore !== null && rawFinalScore >= 0 && rawFinalScore <= 100)
        ? Math.round(rawFinalScore)
        : derivedFinalScore100;

    const canonicalCefrLevel = inferCefrFromFinalScore(totalScore25) || attempt?.cefr_level || '-';
    const suitableToTeach = ['B1', 'B2', 'C1', 'C2'].includes(canonicalCefrLevel);
    const canonicalVerdict = suitableToTeach ? 'Layak' : 'Belum Layak';
    const recommendedLevelsText = inferSchoolLevelRecommendation(canonicalCefrLevel, suitableToTeach);
    const schoolLevelFlags = explainSchoolLevelBullets(recommendedLevelsText);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Hasil Tes: {attempt.user?.name || 'Guru'}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">
                        Waktu Pengerjaan: {formatDate(attempt.created_at)}
                    </p>
                </div>
            }
        >
            <Head title={`Hasil Tes - ${attempt.user?.name || 'Guru'}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('ikhtabir-nafsi.index')} className="text-gray-600 hover:text-gray-900 flex items-center">
                            <IconArrowLeft size={16} className="mr-1" /> Kembali ke Riwayat
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supervisor Note (Only for Managers OR if Published) */}
                        {(is_manager || (attempt.supervisor_note && attempt.published_at)) && (
                            <div className="col-span-2 bg-yellow-50 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-medium text-yellow-800 flex items-center">
                                        <IconClipboardCheck className="mr-2" />
                                        Catatan Khusus Supervisor
                                    </h3>
                                    {is_manager && attempt.supervisor_note && !attempt.published_at && (
                                        <button
                                            onClick={async () => {
                                                const confirmed = await confirmDelete({
                                                    title: 'Publish Catatan Supervisor?',
                                                    text: 'Apakah Anda yakin ingin mem-publish catatan ini ke Guru?',
                                                    confirmButtonText: 'Ya, Publish!',
                                                    icon: 'question',
                                                });

                                                if (confirmed) {
                                                    router.post(route('ikhtabir-nafsi.publish', attempt.id));
                                                }
                                            }}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 shadow"
                                        >
                                            Post / Publish ke Guru
                                        </button>
                                    )}
                                    {attempt.published_at && (
                                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300">
                                            Terpublish: {new Date(attempt.published_at).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                </div>

                                {attempt.supervisor_note ? (
                                    <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded border border-yellow-200">
                                                <span className="font-bold text-gray-700 block mb-1">Rekomendasi Mengajar:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${suitableToTeach ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {suitableToTeach ? "LAYAK" : "BELUM LAYAK"}
                                                    </span>
                                                    <span className="text-gray-900 font-medium bg-gray-100 px-2 py-1 rounded text-xs">
                                                        {recommendedLevelsText}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {schoolLevelFlags.sd && <span className="px-2 py-1 rounded text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">SD</span>}
                                                    {schoolLevelFlags.smp && <span className="px-2 py-1 rounded text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">SMP</span>}
                                                    {schoolLevelFlags.sma && <span className="px-2 py-1 rounded text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">SMA</span>}
                                                    {!schoolLevelFlags.sd && !schoolLevelFlags.smp && !schoolLevelFlags.sma && (
                                                        <span className="px-2 py-1 rounded text-[11px] font-semibold border bg-gray-50 text-gray-500 border-gray-200">Belum ada rekomendasi jenjang</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Topic Relevance */}
                                            {attempt.supervisor_note.topic_relevance && (
                                                <div className="bg-white p-3 rounded border border-blue-200">
                                                    <span className="font-bold text-gray-700 block mb-1">Kecocokan dengan Topik:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${attempt.supervisor_note.topic_relevance.includes('Sangat') ? "bg-green-100 text-green-800" :
                                                            attempt.supervisor_note.topic_relevance.includes('Cukup') ? "bg-blue-100 text-blue-800" :
                                                                "bg-red-100 text-red-800"
                                                            }`}>
                                                            {attempt.supervisor_note.topic_relevance}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <span className="font-bold text-gray-700 block mb-2 underline decoration-red-300">Kekurangan / Area Perbaikan:</span>
                                                <ul className="list-disc ml-5 text-gray-700 space-y-1 bg-white p-3 rounded border border-gray-100">
                                                    {Array.isArray(attempt.supervisor_note.weaknesses) ?
                                                        attempt.supervisor_note.weaknesses.map((w, i) => <li key={i}>{w}</li>) :
                                                        <li>-</li>
                                                    }
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-700 block mb-2 underline decoration-blue-300">Langkah Upgrade Level (Next CEFR):</span>
                                                <ul className="list-disc ml-5 text-gray-700 space-y-1 bg-white p-3 rounded border border-gray-100">
                                                    {Array.isArray(attempt.supervisor_note.improvement_steps) ?
                                                        attempt.supervisor_note.improvement_steps.map((s, i) => <li key={i}>{s}</li>) :
                                                        <li>-</li>
                                                    }
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 italic text-center py-4 bg-white rounded border border-dashed border-gray-300">
                                        Data analisis supervisor belum tersedia untuk tes ini (Tes dilakukan sebelum update sistem).
                                        <br />Silakan lakukan tes baru untuk mendapatkan analisis lengkap.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Score Comparison (New 6 Criteria) */}
                        <div className="col-span-2 bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <IconAward className="mr-2 text-indigo-500" />
                                    Hasil Penilaian Lisan (Skala 1-5 dan 1-100)
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${suitableToTeach ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                                    Status: {canonicalVerdict}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kriteria Penilaian (CEFR)</th>
                                            <th className="px-4 py-2 bg-indigo-50 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider w-24">
                                                Skor (1-5)
                                            </th>
                                            <th className="px-4 py-2 bg-blue-50 text-center text-xs font-medium text-blue-700 uppercase tracking-wider w-28">
                                                Nilai (1-100)
                                            </th>
                                            <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan Skor dan Kaitannya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {criteriaRows.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {item.label}
                                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">{item.desc}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-bold bg-indigo-50 text-indigo-700">
                                                    {item.score !== null ? item.score : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-bold bg-blue-50 text-blue-700">
                                                    {item.score !== null ? Math.round((clamp(item.score, 0, 5) / 5) * 100) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 bg-gray-50/30">
                                                    {item.analysis ? (
                                                        <div className="space-y-1">
                                                            <div className="text-gray-700">{item.analysis}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Skor {item.score !== null ? item.score : '-'} / 5 pada kriteria ini setara nilai {item.score !== null ? Math.round((clamp(item.score, 0, 5) / 5) * 100) : '-'} / 100.
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <span className="text-gray-700">{buildFallbackAnalysis(item.label, item.score)}</span>
                                                            <div className="text-xs text-gray-500">
                                                                Analisis ini dihasilkan otomatis dari skor {item.score !== null ? item.score : '-'} / 5 untuk menjaga keterbacaan hasil.
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Final Row */}
                                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                                TOTAL SKOR
                                            </td>
                                            <td className="px-4 py-3 text-center text-lg font-black text-indigo-900">
                                                {totalScore25} / 25
                                            </td>
                                            <td className="px-4 py-3 text-center text-lg font-black text-blue-700">
                                                {finalScore100} / 100
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <span>Level Estimasi: <span className="text-indigo-600">
                                                        {canonicalCefrLevel}
                                                    </span></span>
                                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded shadow-sm text-xs whitespace-nowrap">
                                                        Final: {totalScore25} / 25 | {finalScore100} / 100
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 text-xs text-center text-gray-400">
                                * Mapping level berdasarkan total skor: 7-9 = A1, 10-13 = A2, 14-17 = B1, 18-21 = B2, 22-23 = C1, 24-25 = C2.
                            </div>
                        </div>

                        {/* CEFR Teaching Guide */}
                        <div className="col-span-2 bg-blue-50 overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-400">
                            <h3 className="text-lg font-medium text-blue-900 mb-3">Panduan Kelayakan Mengajar (CEFR)</h3>
                            <div className="space-y-2 text-sm text-blue-900">
                                <p><strong>B1:</strong> layak di jenjang SD.</p>
                                <p><strong>B2:</strong> standar minimal, layak untuk SMP dan SMA pada mata pelajaran ringan.</p>
                                <p><strong>C1:</strong> sesuai untuk SMP dan SMA termasuk mapel sulit seperti fikih.</p>
                                <p><strong>A1/A2:</strong> belum layak mengajar mandiri. <strong>C2:</strong> sangat layak untuk semua jenjang.</p>
                            </div>
                        </div>

                        {/* Summary & Transcript */}
                        <div className="col-span-2 space-y-6">
                            {/* Summary */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <IconAward className="mr-2 text-indigo-500" />
                                    Simpulan & Saran
                                </h3>
                                <div className="prose max-w-none text-gray-700">
                                    {attempt.summary ? (
                                        <p>{attempt.summary}</p>
                                    ) : (
                                        <p className="italic text-gray-500">Tidak ada simpulan.</p>
                                    )}
                                </div>
                            </div>

                            {/* Transcript Preview (Optional/Collapsible) */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <IconMessageCircle className="mr-2 text-indigo-500" />
                                    Transkrip Percakapan
                                </h3>
                                <div className="max-h-60 overflow-y-auto space-y-3 bg-gray-50 p-4 rounded">
                                    {attempt.messages && attempt.messages.map((msg) => (
                                        <div key={msg.id} className={`p-2 rounded ${msg.role === 'user' ? 'bg-indigo-50 ml-8' : 'bg-white mr-8 border'}`}>
                                            <span className="text-xs font-bold block mb-1 uppercase text-gray-500">{msg.role}</span>
                                            <p className="text-sm" dir={msg.role === 'assistant' ? 'rtl' : 'ltr'}>{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Corrections & Improvements (New Section) */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <IconClipboardCheck className="mr-2 text-indigo-500" />
                                    Daftar Koreksi & Perbaikan
                                </h3>
                                <div className="space-y-4">
                                    {attempt.messages && attempt.messages.filter(m => m.role === 'assistant' && m.metadata).length > 0 ? (
                                        attempt.messages.filter(m => m.role === 'assistant' && m.metadata).map((msg, index) => {
                                            let feedback = null;
                                            try {
                                                feedback = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
                                            } catch (e) { return null; }

                                            if (!feedback || (!feedback.correction && !feedback.praise)) return null;

                                            return (
                                                <div key={index} className="bg-gray-50 p-4 rounded border border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {feedback.correction && (
                                                            <div>
                                                                <span className="text-xs font-bold text-red-600 uppercase block mb-1">Koreksi (Correction):</span>
                                                                <p className="text-sm text-gray-700">{feedback.correction}</p>
                                                            </div>
                                                        )}
                                                        {feedback.praise && (
                                                            <div>
                                                                <span className="text-xs font-bold text-green-600 uppercase block mb-1">Pujian (Praise):</span>
                                                                <p className="text-sm text-gray-700">{feedback.praise}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 italic text-sm">Tidak ada catatan koreksi khusus.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
