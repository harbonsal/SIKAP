import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { IconMicrophone, IconHistory, IconPlayerPlay, IconClipboardCheck, IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { confirmDelete, showError, showInfo } from '@/lib/sweetalert';
import ResponsiveTable from '@/Components/ResponsiveTable';

export default function Index({ auth, attempts, is_manager, allowed_models, active_model, feature_active, status, available_models, filters, teachers }) {
    // Fallback: Check roles directly if is_manager prop fails
    const isManagerInternal = is_manager || (auth.user.roles && (auth.user.roles.some(r => r.name === 'Administrator') || auth.user.roles.some(r => r.name === 'Kepala Sekolah')));
    const [isRecording, setIsRecording] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const { post, processing } = useForm({});

    const startSession = (e) => {
        e.preventDefault();
        post(route('ikhtabir-nafsi.store'));
    };

    const toNumberOrNull = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const inferCefrFromFinalScore = (finalScore) => {
        const score = toNumberOrNull(finalScore);
        if (score === null) return null;
        if (score >= 90) return 'C2';
        if (score >= 70) return 'C1';
        if (score >= 50) return 'B2';
        if (score >= 30) return 'B1';
        if (score >= 10) return 'A2';
        return 'A1';
    };

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

    const summarizeAttempt = (attempt) => {
        const metricScores = [
            toNumberOrNull(attempt.spoken_production_score),
            toNumberOrNull(attempt.range_score),
            toNumberOrNull(attempt.accuracy_score),
            toNumberOrNull(attempt.fluency_score_advanced ?? attempt.fluency_score),
            toNumberOrNull(attempt.coherence_score)
        ].filter((s) => s !== null);

        const derivedFinalScore = metricScores.length > 0
            ? clamp(Math.round((metricScores.reduce((sum, s) => sum + s, 0) / metricScores.length / 5) * 100), 0, 100)
            : null;

        const rawFinalScore = toNumberOrNull(attempt.final_score);
        const finalScore = derivedFinalScore ?? rawFinalScore;
        const cefrLevel = inferCefrFromFinalScore(finalScore) ?? attempt.cefr_level ?? null;
        const suitableToTeach = cefrLevel ? ['B1', 'B2', 'C1', 'C2'].includes(cefrLevel) : null;
        const recommendedLevels = suitableToTeach === null
            ? null
            : inferSchoolLevelRecommendation(cefrLevel, suitableToTeach);

        return {
            finalScore,
            cefrLevel,
            suitableToTeach,
            recommendedLevels,
        };
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Ikhtabir Nafsi (Tes Mandiri Bahasa Arab)</h2>}
        >
            <Head title="Ikhtabir Nafsi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">


                    {/* Hero Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6 flex flex-col items-center justify-center text-center">
                        <div className="bg-indigo-100 p-4 rounded-full mb-4">
                            <IconMicrophone size={48} className="text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Uji Kemampuan Bahasa Arab Anda</h3>
                        <p className="text-gray-600 mb-6 max-w-lg">
                            Lakukan percakapan langsung dengan AI. Sistem akan menilai pelafalan (makhraj), kelancaran, tata bahasa, dan kosakata Anda.
                        </p>

                        <div className="w-full flex justify-between items-center mb-6">
                            {isManagerInternal ? (
                                <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">Status Fitur:</span>
                                    <button
                                        onClick={() => router.post(route('ikhtabir-nafsi.toggle-status'), {}, { preserveScroll: true })}
                                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${feature_active ? 'bg-green-600' : 'bg-gray-200'}`}
                                    >
                                        <span className="sr-only">Use setting</span>
                                        <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${feature_active ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                    <span className={`text-xs font-bold ${feature_active ? 'text-green-600' : 'text-gray-500'}`}>
                                        {feature_active ? 'AKTIF' : 'NONAKTIF'}
                                    </span>
                                </div>
                            ) : (
                                <div></div>
                            )}
                        </div>

                        {!feature_active && !isManagerInternal ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 mb-6 w-full max-w-md">
                                <IconMicrophone size={48} className="text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Fitur Sedang Nonaktif</h3>
                                <p className="text-gray-500 mt-2 px-4">
                                    Mohon maaf, fitur tes mandiri sedang dinonaktifkan sementara oleh Administrator untuk pemeliharaan atau penghematan kuota.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={startSession} className={`w-full max-w-md ${!feature_active && isManagerInternal ? 'opacity-75 ring-2 ring-yellow-400 p-4 rounded-lg' : ''}`}>
                                {(!feature_active && isManagerInternal) && (
                                    <div className="mb-4 text-center text-xs font-bold text-yellow-700 bg-yellow-50 p-2 rounded">
                                        ⚠️ Mode Admin: Anda tetap bisa mencoba tes meskipun fitur Nonaktif.
                                    </div>
                                )}

                                {(!status?.litellm_ready) && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                                        <strong className="font-bold">Konfigurasi Belum Lengkap!</strong>
                                        <span className="block sm:inline"> API Key AI belum diisi di file .env. Hubungi Administrator.</span>
                                    </div>
                                )}

                                {/* Admin Controls */}
                                {isManagerInternal && (
                                    <div className="mb-4 flex justify-end space-x-2">
                                        <Link
                                            href={route('ikhtabir-nafsi.topics.index')}
                                            className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 transition ease-in-out duration-150"
                                        >
                                            <IconClipboardCheck size={16} className="mr-2" />
                                            Kelola Topik
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setShowSettingsModal(true)}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150"
                                        >
                                            <IconSettings size={16} className="mr-2" />
                                            Pengaturan AI
                                        </button>
                                    </div>
                                )}

                                <button
                                    disabled={processing || !status?.litellm_ready}
                                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IconMicrophone className="mr-2 -ml-1 h-5 w-5" />
                                    Mulai Tes Baru
                                </button>

                                {/* Active model info */}
                                {active_model ? (
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        🤖 Model aktif: <span className="font-semibold text-indigo-600">{active_model}</span>
                                    </p>
                                ) : (
                                    <p className="text-xs text-center text-red-500 mt-2">
                                        ⚠️ Belum ada model AI yang diaktifkan. Buka &nbsp;
                                        {isManagerInternal ? (
                                            <button type="button" onClick={() => setShowSettingsModal(true)} className="underline">Pengaturan AI</button>
                                        ) : 'Pengaturan AI'}
                                        &nbsp;untuk mengaktifkan.
                                    </p>
                                )}

                                {isManagerInternal && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => router.post(route('ikhtabir-nafsi.store'), { topic_id: null })}
                                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            🧪 Mode Pengujian (Topik Bebas)
                                        </button>
                                        <p className="text-xs text-center text-gray-400 mt-2">Tombol ini hanya muncul untuk Admin/Kepala Sekolah</p>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* History Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                    <IconHistory className="mr-2 text-gray-500" />
                                    Riwayat Tes
                                </h3>

                                {isManagerInternal && (
                                    <div className="flex items-center space-x-2">
                                        <select
                                            className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            value={filters?.user_id || ''}
                                            onChange={(e) => {
                                                router.get(route('ikhtabir-nafsi.index'), { user_id: e.target.value }, { preserveState: true });
                                            }}
                                        >
                                            <option value="">Semua Guru</option>
                                            {teachers && teachers.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={async () => {
                                                const confirmed = await confirmDelete({
                                                    title: 'Bersihkan Sesi Berlangsung?',
                                                    text: 'Hapus semua sesi "Berlangsung" yang ditinggalkan? Sesi aktif saat ini tidak akan terhapus.',
                                                    confirmButtonText: 'Ya, Bersihkan!',
                                                    icon: 'warning',
                                                });

                                                if (confirmed) {
                                                    router.post(route('ikhtabir-nafsi.cleanup-abandoned'), {}, { preserveScroll: true });
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                                            title="Hapus sesi yang tidak selesai"
                                        >
                                            🗑️ Bersihkan Sesi
                                        </button>
                                    </div>
                                )}
                            </div>

                            {attempts.data.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">Belum ada riwayat tes.</p>
                            ) : (
                                <ResponsiveTable>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {isManagerInternal ? "Guru & Waktu" : "Waktu Tes"}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model AI</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai Akhir</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                                {isManagerInternal && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelayakan Ngajar</th>}
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tindakan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {attempts.data.map((attempt) => {
                                                const assessment = summarizeAttempt(attempt);
                                                return (
                                                    <tr key={attempt.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isManagerInternal && (
                                                                <div className="text-sm font-medium text-gray-900 mb-1">
                                                                    {attempt.user?.name ?? '-'}
                                                                </div>
                                                            )}
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(attempt.created_at).toLocaleDateString('id-ID', {
                                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                            {attempt.model_name ? (
                                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded border shadow-sm">{attempt.model_name}</span>
                                                            ) : (
                                                                <span className="text-gray-400 italic">{attempt.ai_model}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="text-lg font-bold text-gray-900">
                                                                    {assessment.finalScore ?? '-'}
                                                                </span>
                                                                {attempt.ended_at ? (
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        Selesai
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                        Berlangsung
                                                                    </span>
                                                                )}
                                                                {is_manager && attempt.published_at && (
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                        Published
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                                                            {assessment.cefrLevel ?? '-'}
                                                            {is_manager && attempt.supervisor_note?.improvement_steps && (
                                                                <div className="mt-1">
                                                                    <button
                                                                        type="button"
                                                                        className="text-xs text-indigo-500 underline"
                                                                        onClick={() => {
                                                                            const steps = attempt.supervisor_note.improvement_steps;
                                                                            const stepsHtml = steps.map(step => `<li class="text-left mb-2">${step}</li>`).join('');
                                                                            
                                                                            showInfo(
                                                                                'Langkah Upgrading Level',
                                                                                `<ul class="list-disc list-inside text-sm">${stepsHtml}</ul>`
                                                                            );
                                                                        }}
                                                                    >
                                                                        Saran Upgrading
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {is_manager && (
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                {assessment.suitableToTeach !== null ? (
                                                                    assessment.suitableToTeach ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 uppercase w-fit">
                                                                                LAYAK
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 mt-1">
                                                                                {assessment.recommendedLevels}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 uppercase">
                                                                            BELUM LAYAK
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                {isManagerInternal && !attempt.published_at && attempt.supervisor_note && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const confirmed = await confirmDelete({
                                                                                title: 'Publish Catatan Supervisor?',
                                                                                text: 'Post / Publish catatan supervisor ke guru ini?',
                                                                                confirmButtonText: 'Ya, Publish!',
                                                                                icon: 'question',
                                                                            });

                                                                            if (confirmed) {
                                                                                router.post(route('ikhtabir-nafsi.publish', attempt.id));
                                                                            }
                                                                        }}
                                                                        className="text-blue-600 hover:text-blue-900 border border-blue-600 rounded px-2 py-1 text-xs"
                                                                        title="Post to Teacher"
                                                                    >
                                                                        Post
                                                                    </button>
                                                                )}
                                                                {attempt.ended_at ? (
                                                                    <Link
                                                                        href={route('ikhtabir-nafsi.show', attempt.id)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Detail
                                                                    </Link>
                                                                ) : (
                                                                    <Link
                                                                        href={route('ikhtabir-nafsi.session', attempt.session_id)}
                                                                        className="text-yellow-600 hover:text-yellow-900"
                                                                    >
                                                                        Lanjutkan
                                                                    </Link>
                                                                )}
                                                                {(isManagerInternal || (!attempt.ended_at && attempt.user_id === auth.user.id)) && (
                                                                    <button
                                                                        key={`del-${attempt.id}`}
                                                                        onClick={async () => {
                                                                            const msg = attempt.ended_at
                                                                                ? 'Yakin ingin menghapus riwayat tes ini?'
                                                                                : 'Yakin ingin membatalkan sesi ini? Data tidak akan disimpan.';

                                                                            const confirmed = await confirmDelete({
                                                                                title: attempt.ended_at ? 'Hapus Riwayat Tes?' : 'Batalkan Sesi?',
                                                                                text: msg,
                                                                                confirmButtonText: attempt.ended_at ? 'Ya, Hapus!' : 'Ya, Batalkan!',
                                                                            });

                                                                            if (confirmed) {
                                                                                router.delete(route('ikhtabir-nafsi.destroy', attempt.id));
                                                                            }
                                                                        }}
                                                                        className="text-red-600 hover:text-red-900 ml-2 text-xs border border-red-200 rounded px-2 py-1"
                                                                    >
                                                                        {attempt.ended_at ? 'Hapus' : 'Batalkan'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </ResponsiveTable>
                            )}

                            {/* Pagination */}
                            {attempts.links && (
                                <div className="flex items-center justify-center space-x-1 py-4">
                                    {attempts.links.map((link, i) => {
                                        const classes = `px-3 py-1 border rounded text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`;

                                        return link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={classes}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className={classes}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>
                        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
                            <h3 className="text-lg font-medium text-gray-900">Pengaturan Model AI</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-500">
                                <IconSettings size={20} />
                            </button>
                        </div>

                        {/* Scrollable model list */}
                        <div className="overflow-y-auto flex-1 px-6 py-4">
                            <p className="text-sm text-gray-600">Aktifkan model AI yang dapat digunakan guru. Model yang aktif akan digunakan secara otomatis.</p>

                            {available_models && available_models.length > 0 ? (
                                available_models.map((model) => (
                                    <div key={model.id} className="flex items-center justify-between border-b pb-2">
                                        <span className="text-gray-700 font-medium text-sm">{model.id}</span>
                                        <button
                                            onClick={() => {
                                                router.post(route('ikhtabir-nafsi.update-models'), {
                                                    model: model.id,
                                                    value: !allowed_models?.[model.id]
                                                }, {
                                                    preserveScroll: true,
                                                });
                                            }}
                                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${allowed_models?.[model.id] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${allowed_models?.[model.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 italic">Tidak ada model terdaftar di server LiteLLM.</p>
                            )}
                        </div>{/* end scrollable */}

                        <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
