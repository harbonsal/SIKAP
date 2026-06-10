import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { IconMicrophone, IconPlayerStop, IconSend, IconLogout, IconVolume, IconVolumeOff, IconCheck } from '@tabler/icons-react';
import { confirmDelete, showError } from '@/lib/sweetalert';

export default function ChatSession({ auth, attempt, messages: initialMessages }) {
    const [messages, setMessages] = useState(initialMessages);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        // Cleanup function to stop audio when component unmounts or updates
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [messages]);

    // Additional mount cleanup
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Optimize: Use Opus codec with low bitrate (16kbps is enough for speech)
            const options = { mimeType: 'audio/webm;codecs=opus', bitsPerSecond: 16000 };

            // Fallback if options not supported
            try {
                mediaRecorderRef.current = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn("MediaRecorder options not supported, using default.", e);
                mediaRecorderRef.current = new MediaRecorder(stream);
            }
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = sendAudio;
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            showError(
                'Gagal Mengakses Mikrofon',
                'Pastikan izin mikrofon telah diberikan di browser Anda.'
            );
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true); // Start processing UI
        }
    };

    const sendAudio = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox use webm usually
        // Note: Backend validation accepts webm

        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');

        // Optimistic UI Update (User Message)
        const tempId = Date.now();
        const userMsg = {
            id: tempId,
            role: 'user',
            content: '...', // Placeholder
            is_temp: true
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const response = await axios.post(route('ikhtabir-nafsi.session.audio', attempt.session_id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 300000 // 5 minutes timeout
            });

            const data = response.data;

            // Update messages with real data from server (or just append AI response)
            // Ideally we re-fetch or use returned data. Let's use returned data to save bandwidth.

            // Remove temp user msg and add real ones
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId);
                return [
                    ...filtered,
                    { id: Date.now(), role: 'user', content: data.user_transcript || '(Pesan Suara)' }, // Use transcript
                    { id: Date.now() + 1, role: 'assistant', content: data.response_text, metadata: data.feedback }
                ];
            });

            // Play TTS
            speakArabic(data.response_text);

        } catch (error) {
            console.error("Error sending audio:", error);

            let errorMsg = "Terjadi kesalahan saat memproses audio.";
            if (error.response) {
                // Server responded with a status code
                // Standard Laravel error structure uses 'message'. My manual responses also use 'message' now.
                const serverMsg = error.response.data.message || error.response.data.error || error.response.statusText;
                errorMsg = `Server Error (${error.response.status}): ${serverMsg}`;

                // Add debug info if available
                if (error.response.data.error_detail) {
                    console.error("Server Trace:", error.response.data.error_detail);
                }
            } else if (error.request) {
                // The request was made but no response was received
                errorMsg = "Tidak ada respon dari server (Timeout/Network Error). Periksa koneksi internet Anda.";
            } else {
                // Something happened in setting up the request
                errorMsg = `Request Error: ${error.message}`;
            }

            showError('Gagal Memproses Audio', errorMsg);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setIsProcessing(false);
        }
    };

    const [isMuted, setIsMuted] = useState(false); // Default: Sound On



    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const speakArabic = (text) => {
        if (isMuted || !text) return;

        if ('speechSynthesis' in window) {
            // Cancel any current speaking
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.9;

            // Try to find a specific Arabic voice
            const arabicVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic'));
            if (arabicVoice) {
                utterance.voice = arabicVoice;
            }

            // Error handling
            utterance.onerror = (e) => {
                console.error("TTS Error:", e);
            };

            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("TTS not supported");
        }
    };

    const finishSession = async () => {
        const confirmed = await confirmDelete({
            title: 'Akhiri Sesi?',
            text: 'Apakah Anda yakin ingin mengakhiri sesi ini dan mendapatkan penilaian?',
            confirmButtonText: 'Ya, Akhiri & Nilai!',
            icon: 'question',
        });

        if (confirmed) {
            router.post(route('ikhtabir-nafsi.session.finish', attempt.session_id));
        }
    };

    const cancelSession = async () => {
        const confirmed = await confirmDelete({
            title: 'Batalkan Sesi?',
            text: 'Yakin ingin membatalkan sesi ini? Riwayat percakapan tidak akan disimpan.',
            confirmButtonText: 'Ya, Batalkan!',
        });

        if (confirmed) {
            router.delete(route('ikhtabir-nafsi.destroy', attempt.id));
        }
    };

    const [showModal, setShowModal] = useState(true);

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<div className="flex justify-between items-center">
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">Sesi Percakapan</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
                        title={isMuted ? "Unmute Audio (Suara Mati)" : "Mute Audio (Suara Hidup)"}
                    >
                        {isMuted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
                    </button>
                    <button onClick={cancelSession} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center">
                        Batalkan
                    </button>
                    <button onClick={finishSession} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center shadow-sm">
                        Simpan dan Nilai
                    </button>
                </div>
            </div>}
        >
            <Head title="Sesi Percakapan" />

            {/* Pre-Chat Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 text-center animate-fade-in-up">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-widest mb-2">Topik Anda</h3>
                            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-8">
                                <h1 className="text-3xl md:text-4xl font-bold font-arabic text-indigo-900 leading-relaxed" dir="rtl">
                                    {attempt.topic_text || "Topik Bebas"}
                                </h1>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                            Silakan berbicara mengenai topik di atas. AI akan menilai kemampuan bahasa Arab Anda berdasarkan relevansi topik, kelancaran, dan tata bahasa.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelSession}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full text-base transition-all duration-300"
                            >
                                Ganti Topik / Batal
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <IconMicrophone size={24} />
                                <span>Mulai Bicara</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`py-6 h-[calc(100vh-140px)] flex flex-col max-w-4xl mx-auto transition-all duration-500 ${showModal ? 'blur-sm grayscale' : ''}`}>
                {/* Topic Display (Small) */}
                <div className="bg-indigo-600 text-white p-3 rounded-t-lg shadow-md z-10 flex justify-between items-center px-6">
                    <span className="text-sm opacity-90">Topik:</span>
                    <h2 className="text-lg font-bold font-arabic truncate max-w-2xl" dir="rtl">
                        {attempt.topic_text || "Topik Bebas (Free Topic)"}
                    </h2>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white overflow-y-auto p-6 shadow-sm rounded-b-lg mb-4 space-y-4 border-x border-b border-gray-200">
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                <div className="text-sm font-bold mb-1 opacity-75">
                                    {msg.role === 'user' ? 'Anda' : 'Penguji (AI)'}
                                </div>

                                {msg.role === 'assistant' && (
                                    <div className="flex items-start gap-2">
                                        <button onClick={() => speakArabic(msg.content)} className="mt-1 p-1 hover:bg-gray-200 rounded-full">
                                            <IconVolume size={18} />
                                        </button>
                                        <div className="text-lg leading-relaxed" dir="rtl" style={{ fontFamily: 'Amiri, serif' }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                )}

                                {msg.role === 'user' && (
                                    <div className="flex items-center gap-2">
                                        <IconMicrophone size={16} />
                                        <span>{msg.content}</span>
                                    </div>
                                )}

                                {/* Feedback Indicator */}
                                {msg.metadata && msg.metadata.correction && (
                                    <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-red-600">
                                        <strong>Koreksi:</strong> {msg.metadata.correction}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 p-4 rounded-lg rounded-bl-none animate-pulse">
                                Sedang mengetik/berpikir...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="bg-white p-4 shadow-sm sm:rounded-lg flex justify-center items-center gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">
                            {isRecording ? "Sedang merekam... (Ketuk untuk stop)" : "Ketuk mikrofon untuk bicara"}
                        </p>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                            className={`p-6 rounded-full transition-all duration-200 shadow-lg ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? (
                                <IconPlayerStop size={32} className="text-white" />
                            ) : (
                                <IconMicrophone size={32} className="text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
