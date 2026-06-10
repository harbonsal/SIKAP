import { Head, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Zap, AlertTriangle, CheckCircle, UserCheck, Clock } from 'lucide-react';

export default function Scan() {
    const [rfid, setRfid] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { status, type, student, message, time, is_late }
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto focus input
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!rfid) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(route('rfid.tap'), { rfid });
            setResult(response.data);
            setRfid('');
        } catch (error) {
            setResult({
                status: 'error',
                message: error.response?.data?.message || 'Terjadi kesalahan sistem.'
            });
            setRfid('');
        } finally {
            setLoading(false);
            // Keep focus
            if (inputRef.current) inputRef.current.focus();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
            <Head title="Scan RFID Perizinan" />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/30 text-blue-500 mb-4">
                        <Zap className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">POS PERIZINAN</h1>
                    <p className="text-neutral-400">Silakan tap kartu santri pada reader.</p>
                </div>

                {/* Result Display */}
                {result && (
                    <div className={`p-6 rounded-xl border animate-in fade-in zoom-in duration-300 ${result.status === 'success'
                            ? result.type === 'OUT'
                                ? 'bg-blue-950/50 border-blue-800 text-blue-200'
                                : result.is_late
                                    ? 'bg-red-950/50 border-red-800 text-red-200'
                                    : 'bg-green-950/50 border-green-800 text-green-200'
                            : 'bg-neutral-900 border-neutral-800 text-red-400'
                        }`}>
                        <div className="flex flex-col items-center text-center space-y-3">
                            {result.status === 'success' ? (
                                <>
                                    {result.is_late ? <AlertTriangle className="h-12 w-12 text-red-500" /> : <CheckCircle className="h-12 w-12 text-green-500" />}

                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold">{result.student}</h2>
                                        <p className="text-sm opacity-80">{result.group}</p>
                                    </div>

                                    <div className="text-4xl font-mono font-bold tracking-widest my-2">
                                        {result.type}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1 rounded-full">
                                        <Clock className="h-4 w-4" /> {result.time}
                                    </div>

                                    <p className="font-medium text-lg pt-2 border-t border-white/10 w-full">
                                        {result.message}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-12 w-12" />
                                    <p className="text-lg font-medium">{result.message}</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Input Form (Hidden but focused) */}
                <form onSubmit={handleScan} className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-neutral-900 border-neutral-800 text-center text-transparent focus:text-white caret-transparent focus:caret-white rounded-lg py-4 focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        placeholder="Tap Kartu Disini..."
                        value={rfid}
                        onChange={e => setRfid(e.target.value)}
                        disabled={loading}
                        autoComplete="off"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    )}
                </form>

                <p className="text-center text-xs text-neutral-600">
                    Sistem Perizinan v1.0 • Klik input box jika scanner tidak merespon.
                </p>
            </div>
        </div>
    );
}
