import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Zap, AlertTriangle, CheckCircle, Clock, Settings, X, MapPin } from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';

export default function Scan({ autoConfirm, autoConfirmSeconds }) {
    const [rfid, setRfid] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null); // { student: {}, permission: {} }
    const [result, setResult] = useState(null); // { status, type, student, message, time, is_late }
    const [errorMsg, setErrorMsg] = useState(null);
    const { auth } = usePage().props;
    const userRole = auth?.user?.user_level?.name;
    const canManagePermissions = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager'].includes(userRole);
    
    
    // Scan Mode & Confirmation
    const [scanMode, setScanMode] = useState('OUT');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');

    // Auto-confirm state
    const [countdown, setCountdown] = useState(autoConfirmSeconds);
    const timerRef = useRef(null);
    const resultTimerRef = useRef(null);
    const inputRef = useRef(null);

    // Arrival Notes Form
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [notesData, setNotesData] = useState({ uang_saku: '', barang_titipan: '' });
    const [savingNotes, setSavingNotes] = useState(false);

    // Settings Modal
    const [showSettings, setShowSettings] = useState(false);
    const { data: formSettings, setData: setFormSettings, post: postSettings, processing: processingSettings } = useForm({
        auto_confirm: autoConfirm,
        seconds: autoConfirmSeconds
    });

    useEffect(() => {
        if (!showSettings && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showSettings]);

    // Handle initial preview
    const handlePreview = async (e) => {
        e.preventDefault();
        if (!rfid) return;

        setLoading(true);
        setPreviewData(null);
        setResult(null);
        setErrorMsg(null);
        setShowNotesForm(false);
        setNotesData({ uang_saku: '', barang_titipan: '' });
        clearTimeout(timerRef.current);
        clearTimeout(resultTimerRef.current);

        try {
            const response = await axios.post(route('rfid.preview'), { rfid, scan_mode: scanMode });
            setPreviewData(response.data);
            
            if (response.data.requires_confirmation) {
                setConfirmMessage(response.data.confirmation_message);
                setShowConfirmDialog(true);
            } else if (autoConfirm) {
                setCountdown(autoConfirmSeconds);
                startCountdown(response.data.student.nomor_induk || rfid);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Terjadi kesalahan sistem.');
            setRfid('');
            setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
        } finally {
            setLoading(false);
        }
    };

    const startCountdown = (rfidValue) => {
        let currentCount = autoConfirmSeconds;
        timerRef.current = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(timerRef.current);
                handleConfirm(rfidValue);
            }
        }, 1000);
    };

    const handleConfirm = async (overrideRfid = null, forceUpdate = false) => {
        clearInterval(timerRef.current);
        setLoading(true);
        setShowConfirmDialog(false);
        const submitRfid = overrideRfid || previewData?.student?.nomor_induk || rfid;

        try {
            const response = await axios.post(route('rfid.tap'), { 
                rfid: submitRfid,
                scan_mode: scanMode,
                force_update: forceUpdate
            });
            setResult(response.data);
            setPreviewData(null);
            setRfid('');
            
            // Auto close success message after 3 seconds if not showing notes form
            if (response.data.status === 'success' && response.data.type === 'IN') {
                resultTimerRef.current = setTimeout(() => {
                    if (!showNotesForm) {
                        setResult(null);
                        setShowNotesForm(false);
                        if (inputRef.current) inputRef.current.focus();
                    }
                }, 3000);
            } else {
                resultTimerRef.current = setTimeout(() => {
                    setResult(null);
                    setShowNotesForm(false);
                    if (inputRef.current) inputRef.current.focus();
                }, 3000);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Terjadi kesalahan saat konfirmasi.');
            setPreviewData(null);
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const cancelPreview = () => {
        clearInterval(timerRef.current);
        setPreviewData(null);
        setRfid('');
        setShowConfirmDialog(false);
        if (inputRef.current) inputRef.current.focus();
    };

    const saveSettings = (e) => {
        e.preventDefault();
        postSettings(route('rfid.settings'), {
            onSuccess: () => setShowSettings(false)
        });
    };

    const handleOpenNotes = () => {
        clearTimeout(resultTimerRef.current);
        setShowNotesForm(true);
    };

    const submitNotes = async (e) => {
        e.preventDefault();
        if (!result?.permission_id) return;
        
        setSavingNotes(true);
        try {
            await axios.post(route('rfid.update-note'), {
                permission_id: result.permission_id,
                uang_saku: notesData.uang_saku || null,
                barang_titipan: notesData.barang_titipan || null
            });
            // reset and close
            setResult(null);
            setShowNotesForm(false);
            setNotesData({ uang_saku: '', barang_titipan: '' });
            if (inputRef.current) inputRef.current.focus();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan keterangan');
        } finally {
            setSavingNotes(false);
        }
    };

    return (
        <MainLayout>
            <Head title="Pos Perizinan (Scanner)" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Pos Perizinan</h2>
                        <p className="text-muted-foreground">Sistem Tap/Scan kartu santri atau input NIS manual.</p>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Pengaturan Scanner
                    </button>
                </div>

                {/* Tabs / Navigation */}
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-max">
                    <Link
                        href={route('rfid.scan')}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-background shadow-sm text-foreground transition-all"
                    >
                        Pos Scanner
                    </Link>
                    {canManagePermissions && (
                        <Link
                            href={route('permissions.index')}
                            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                        >
                            Daftar Perizinan
                        </Link>
                    )}
                    <Link
                        href={route('permissions.monitor')}
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                    >
                        Pantauan Real-time
                    </Link>
                </div>

                <div className="bg-neutral-950 flex flex-col items-center justify-center p-8 rounded-xl min-h-[500px]">
                    
                    {/* Scan Mode Toggle */}
                    {!previewData && !result && (
                        <div className="flex bg-neutral-900 rounded-lg p-1 mb-8 animate-in fade-in duration-500">
                            <button
                                onClick={() => { setScanMode('OUT'); if(inputRef.current) inputRef.current.focus(); }}
                                className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${scanMode === 'OUT' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
                            >
                                MODE: KELUAR
                            </button>
                            <button
                                onClick={() => { setScanMode('IN'); if(inputRef.current) inputRef.current.focus(); }}
                                className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${scanMode === 'IN' ? 'bg-emerald-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
                            >
                                MODE: KEDATANGAN
                            </button>
                        </div>
                    )}

                    <div className="w-full max-w-md space-y-8">
                        {!previewData && !result && (
                            <div className="text-center space-y-2">
                                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 animate-pulse ${scanMode === 'OUT' ? 'bg-blue-900/30 text-blue-500' : 'bg-emerald-900/30 text-emerald-500'}`}>
                                    <Zap className="h-8 w-8" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-white">READY TO SCAN</h1>
                                <p className="text-neutral-400">Silakan tap kartu santri atau ketik NIS secara manual.</p>
                            </div>
                        )}

                        {/* Error Message */}
                        {errorMsg && !result && !previewData && (
                            <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-center animate-in fade-in zoom-in duration-300">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                                <p className="font-medium">{errorMsg}</p>
                            </div>
                        )}

                        {/* Result Display (Success after Tap) */}
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

                                            {result.type === 'IN' && !showNotesForm && (
                                                <button
                                                    onClick={handleOpenNotes}
                                                    className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    + Tambah Keterangan Kedatangan
                                                </button>
                                            )}

                                            {result.type === 'IN' && showNotesForm && (
                                                <div className="mt-4 w-full bg-black/30 p-4 rounded-xl border border-white/10 text-left space-y-3">
                                                    <h3 className="font-bold text-sm text-white/80 border-b border-white/10 pb-2 mb-2">Form Kedatangan (Opsional)</h3>
                                                    <div>
                                                        <label className="text-xs text-white/70 block mb-1">Titipan Uang Saku (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-black/50 border-white/20 text-white rounded p-2 text-sm focus:ring-1 focus:ring-white" 
                                                            placeholder="Contoh: 50000"
                                                            value={notesData.uang_saku}
                                                            onChange={e => setNotesData({...notesData, uang_saku: e.target.value})}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-white/70 block mb-1">Barang Sitaan / Titipan</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-black/50 border-white/20 text-white rounded p-2 text-sm focus:ring-1 focus:ring-white" 
                                                            placeholder="Contoh: HP, Uang Cash"
                                                            value={notesData.barang_titipan}
                                                            onChange={e => setNotesData({...notesData, barang_titipan: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            onClick={submitNotes}
                                                            disabled={savingNotes}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors flex justify-center items-center gap-2"
                                                        >
                                                            {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setResult(null);
                                                                setShowNotesForm(false);
                                                                if (inputRef.current) inputRef.current.focus();
                                                            }}
                                                            disabled={savingNotes}
                                                            className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                                                        >
                                                            Tutup
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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

                        {/* Preview Profile Card */}
                        {previewData && (
                            <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                                <div className="p-6 flex gap-6 items-center bg-slate-50 border-b">
                                    <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex-shrink-0">
                                        {previewData.student.foto ? (
                                            <img src={previewData.student.foto} alt="Foto Santri" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{previewData.student.name}</h2>
                                        <p className="text-slate-500 font-mono text-sm mb-2">{previewData.student.nomor_induk}</p>
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">{previewData.student.kelas}</span>
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">{previewData.student.kamar}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 mr-1 text-slate-400 flex-shrink-0" />
                                            <span className="truncate">{previewData.student.address || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase">Status Izin</p>
                                            <p className="font-medium text-slate-800">{previewData.permission.group}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Batas Waktu</p>
                                            <p className="font-bold text-rose-600">{previewData.permission.end_time}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => handleConfirm()}
                                            disabled={loading}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                            Konfirmasi {autoConfirm && countdown > 0 && `(${countdown}s)`}
                                        </button>
                                        <button 
                                            onClick={cancelPreview}
                                            disabled={loading}
                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg shadow-sm transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Form (Hidden but focused when ready) */}
                        {!previewData && !result && (
                            <form onSubmit={handlePreview} className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={`w-full bg-neutral-900 border-neutral-800 text-center text-transparent focus:text-white caret-white rounded-lg py-4 focus:ring-2 transition-all font-mono ${scanMode === 'OUT' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'}`}
                                    placeholder="Tap Kartu / Ketik NIS Disini..."
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
                        )}
                        
                        {!previewData && !result && (
                            <p className="text-center text-xs text-neutral-600">
                                SIKAP Perizinan • Gunakan Scanner RFID atau ketik NIS lalu tekan Enter.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background w-full max-w-md rounded-xl shadow-lg border">
                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Settings className="w-5 h-5 text-muted-foreground" />
                                Pengaturan Scanner
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={saveSettings} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="font-medium">Auto-Confirm</label>
                                    <p className="text-sm text-muted-foreground">Konfirmasi otomatis setelah tap</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formSettings.auto_confirm}
                                        onChange={e => setFormSettings('auto_confirm', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            
                            {formSettings.auto_confirm && (
                                <div className="space-y-2">
                                    <label className="font-medium text-sm">Durasi Hitung Mundur (Detik)</label>
                                    <input 
                                        type="number" 
                                        min="1" max="60"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formSettings.seconds}
                                        onChange={e => setFormSettings('seconds', e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Jeda waktu sebelum layar konfirmasi tertutup otomatis dan izin tercatat.</p>
                                </div>
                            )}

                            <div className="pt-4 border-t flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processingSettings}
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white text-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Konfirmasi Pembaruan</h3>
                        <p className="text-slate-600 mb-6">{confirmMessage}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={cancelPreview}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleConfirm(null, true)}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                Ya, Perbarui
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
