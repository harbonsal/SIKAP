import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, ArrowLeft, Loader2, User, Users, Search, X, Clock, Calendar, CheckCircle, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Create({ kamars = [], initialType = 'personal' }) {
    // Mode perizinan: 'personal' (1 santri) atau 'group' (rombongan / kamar)
    const [mode, setMode] = useState(initialType === 'group' ? 'group' : 'personal');

    // Default datetime values
    const formatDateTime = (date) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const now = new Date();
    const defaultStart = formatDateTime(now);
    const defaultEnd = new Date(now.getTime() + 8 * 60 * 60 * 1000); // +8 jam default
    defaultEnd.setMinutes(0);
    const defaultEndStr = formatDateTime(defaultEnd);

    // Form state
    const { data, setData, post, processing, errors } = useForm({
        permission_type: initialType === 'group' ? 'umum' : 'personal',
        is_personal: initialType !== 'group',
        // Personal Fields
        student_id: '',
        initial_status: 'Pending', // 'Pending' (Dijadwalkan) atau 'Out' (Langsung Keluar)
        uang_saku: '',
        barang_titipan: '',
        // Common Fields
        name: '',
        start_time: defaultStart,
        end_time: defaultEndStr,
        description: '',
        // Group Fields
        active_kamar_id: '',
        select_all: true,
        student_ids: []
    });

    // Student Search for Personal Mode
    const [studentQuery, setStudentQuery] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const searchTimeout = useRef(null);

    // Room members for Group Mode
    const [roomStudents, setRoomStudents] = useState([]);
    const [loadingRoomStudents, setLoadingRoomStudents] = useState(false);

    // Quick suggestions for reasons
    const quickReasons = [
        'Izin Pulang (Acara Keluarga)',
        'Izin Berobat / Rumah Sakit',
        'Izin Lomba / Kegiatan Luar',
        'Izin Belanja / Keperluan Santri',
        'Izin Pulang Mendesak',
        'Izin Sakit / Istirahat di Rumah'
    ];

    // Search students for personal permission
    useEffect(() => {
        if (mode !== 'personal' || selectedStudent) return;

        if (studentQuery.trim().length >= 2) {
            setIsSearching(true);
            clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const res = await axios.get(route('permissions.students.search', { query: studentQuery }));
                    setStudentResults(res.data || []);
                } catch (e) {
                    setStudentResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setStudentResults([]);
            setIsSearching(false);
        }

        return () => clearTimeout(searchTimeout.current);
    }, [studentQuery, mode, selectedStudent]);

    // Fetch students when Kamar changes in Group Mode
    useEffect(() => {
        if (mode === 'group' && data.active_kamar_id && data.active_kamar_id !== 'all') {
            setLoadingRoomStudents(true);
            axios.get(route('permissions.students', data.active_kamar_id))
                .then(response => {
                    setRoomStudents(response.data);
                    if (data.permission_type === 'umum') {
                        setData(prev => ({ ...prev, student_ids: [], select_all: true }));
                    }
                })
                .catch(() => setRoomStudents([]))
                .finally(() => setLoadingRoomStudents(false));
        } else {
            setRoomStudents([]);
        }
    }, [data.active_kamar_id, data.permission_type, mode]);

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setData(prev => ({
            ...prev,
            student_id: student.id,
            active_kamar_id: student.active_kamar_id || prev.active_kamar_id
        }));
        setStudentResults([]);
        setStudentQuery('');
    };

    const handleClearSelectedStudent = () => {
        setSelectedStudent(null);
        setData(prev => ({ ...prev, student_id: '' }));
        setStudentQuery('');
    };

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        if (newMode === 'personal') {
            setData(prev => ({
                ...prev,
                permission_type: 'personal',
                is_personal: true,
                select_all: false,
                student_ids: []
            }));
        } else {
            setData(prev => ({
                ...prev,
                permission_type: 'umum',
                is_personal: false,
                student_id: '',
                select_all: true,
                student_ids: []
            }));
            setSelectedStudent(null);
        }
    };

    const handleStudentCheck = (studentId) => {
        const currentIds = data.student_ids;
        const newIds = currentIds.includes(studentId)
            ? currentIds.filter(id => id !== studentId)
            : [...currentIds, studentId];

        setData(prev => ({
            ...prev,
            select_all: false,
            student_ids: newIds
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('permissions.store'));
    };

    return (
        <MainLayout>
            <Head title={mode === 'personal' ? 'Beri Izin Personal Santri' : 'Buat Izin Kamar / Rombongan'} />

            <div className="max-w-3xl mx-auto space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('permissions.index')}
                        className="inline-flex items-center justify-center rounded-xl border border-input bg-background text-foreground hover:bg-accent h-10 w-10 shadow-sm transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <span>{mode === 'personal' ? 'Beri Izin Personal' : 'Buat Izin Rombongan'}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Pengasuhan
                            </span>
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {mode === 'personal' 
                                ? 'Berikan izin resmi untuk seorang santri secara langsung dan terpantau di sistem.'
                                : 'Buat jadwal izin rombongan santri per kamar atau libur umum.'}
                        </p>
                    </div>
                </div>

                {/* Mode Selector Segmented Tabs */}
                <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('personal')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            mode === 'personal'
                                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        <span>Izin Personal (1 Santri)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('group')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            mode === 'group'
                                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Izin Kamar / Rombongan</span>
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-7">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* ============================================================== */}
                        {/* MODE 1: IZIN PERSONAL                                          */}
                        {/* ============================================================== */}
                        {mode === 'personal' && (
                            <div className="space-y-6">
                                {/* 1. Pilih Santri */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground flex items-center justify-between">
                                        <span>Pilih Santri <span className="text-destructive">*</span></span>
                                        <span className="text-xs text-muted-foreground font-normal">Cari berdasarkan Nama atau NIS</span>
                                    </label>

                                    {selectedStudent ? (
                                        /* Selected Student Preview Card */
                                        <div className="relative p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                                                    {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug">
                                                        {selectedStudent.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
                                                        <span className="font-mono bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                                            NIS: {selectedStudent.nis}
                                                        </span>
                                                        <span className="bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                                            Kelas: {selectedStudent.kelas}
                                                        </span>
                                                        <span className="bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                                            Kamar: {selectedStudent.kamar}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleClearSelectedStudent}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1 transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                <span>Ganti Santri</span>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Search Input */
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Search className="w-4 h-4" />}
                                            </div>
                                            <input
                                                type="text"
                                                className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                                                placeholder="Ketik nama atau NIS santri (contoh: Muhammad, 202401)..."
                                                value={studentQuery}
                                                onChange={e => setStudentQuery(e.target.value)}
                                                autoFocus
                                            />

                                            {/* Search Dropdown Results */}
                                            {studentResults.length > 0 && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-popover rounded-xl border border-border shadow-xl max-h-60 overflow-y-auto divide-y divide-border">
                                                    {studentResults.map((s) => (
                                                        <div
                                                            key={s.id}
                                                            onClick={() => handleSelectStudent(s)}
                                                            className="p-3 hover:bg-accent/60 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                                                        >
                                                            <div>
                                                                <p className="font-bold text-sm text-foreground">{s.name}</p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                    <span>NIS: {s.nis}</span>
                                                                    <span>•</span>
                                                                    <span>Kelas: {s.kelas}</span>
                                                                    <span>•</span>
                                                                    <span>Kamar: {s.kamar}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                                                                Pilih
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {studentQuery.trim().length >= 2 && !isSearching && studentResults.length === 0 && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 p-3 bg-popover rounded-xl border border-border shadow-md text-xs text-muted-foreground text-center">
                                                    Tidak ditemukan santri aktif dengan kata kunci "{studentQuery}".
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {errors.student_id && <p className="text-xs text-destructive font-medium">{errors.student_id}</p>}
                                </div>

                                {/* 2. Keperluan Izin */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">
                                        Keperluan / Nama Izin <span className="text-destructive">*</span>
                                    </label>
                                    
                                    {/* Quick chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                        {quickReasons.map(reason => (
                                            <button
                                                type="button"
                                                key={reason}
                                                onClick={() => setData('name', reason)}
                                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                                    data.name === reason
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                                                }`}
                                            >
                                                {reason}
                                            </button>
                                        ))}
                                    </div>

                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                                        placeholder="Ketik atau pilih keperluan izin di atas..."
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
                                </div>

                                {/* 3. Status Keberangkatan */}
                                <div className="space-y-2 pt-1">
                                    <label className="text-sm font-bold text-foreground">
                                        Status Keberangkatan
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label
                                            onClick={() => setData('initial_status', 'Pending')}
                                            className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                                                data.initial_status === 'Pending'
                                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 dark:border-amber-700 ring-1 ring-amber-400 shadow-sm'
                                                    : 'bg-background hover:bg-muted/30 border-border'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg mt-0.5 ${data.initial_status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <span>Dijadwalkan (Pending)</span>
                                                    {data.initial_status === 'Pending' && <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                    Santri belum keluar. Nanti tap RFID di Pos Scanner atau konfirmasi manual saat berangkat.
                                                </p>
                                            </div>
                                        </label>

                                        <label
                                            onClick={() => setData('initial_status', 'Out')}
                                            className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                                                data.initial_status === 'Out'
                                                    ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400 shadow-sm'
                                                    : 'bg-background hover:bg-muted/30 border-border'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg mt-0.5 ${data.initial_status === 'Out' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <span>Langsung Keluar (Out)</span>
                                                    {data.initial_status === 'Out' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                    Santri langsung berangkat sekarang. Jam keluar otomatis dicatat saat ini juga.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* 4. Waktu Mulai & Waktu Akhir */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">
                                            Waktu Mulai Izin <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            value={data.start_time}
                                            onChange={e => setData('start_time', e.target.value)}
                                            required
                                        />
                                        {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">
                                            Batas Waktu Kembali <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            value={data.end_time}
                                            onChange={e => setData('end_time', e.target.value)}
                                            required
                                        />
                                        {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
                                    </div>
                                </div>

                                {/* 5. Titipan Uang Saku & Barang */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Uang Saku Santri (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                                            placeholder="Contoh: 100.000 atau Rp 50.000"
                                            value={data.uang_saku}
                                            onChange={e => setData('uang_saku', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Barang Titipan / Dibawa (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                                            placeholder="Contoh: HP, Surat Dokter, Tas Pakaian"
                                            value={data.barang_titipan}
                                            onChange={e => setData('barang_titipan', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* 6. Alasan / Deskripsi Tambahan */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground">
                                        Keterangan / Alasan Tambahan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="flex w-full rounded-xl border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                                        placeholder="Catatan penjemputan, orang tua yang menjemput, atau keterangan penting lainnya..."
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ============================================================== */}
                        {/* MODE 2: IZIN KAMAR / ROMBONGAN                                 */}
                        {/* ============================================================== */}
                        {mode === 'group' && (
                            <div className="space-y-6">
                                {/* Nama Izin */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">
                                        Nama Izin / Kegiatan <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                        placeholder="Contoh: Pesiar Jumat, Libur Semester Kamar Abu Bakar"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>

                                {/* Jenis Izin Rombongan */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">Jenis Izin Rombongan</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label
                                            onClick={() => {
                                                setData(prev => ({
                                                    ...prev,
                                                    permission_type: 'umum',
                                                    select_all: true,
                                                    student_ids: []
                                                }));
                                            }}
                                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                                                data.permission_type === 'umum'
                                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 ring-1 ring-amber-400 font-bold'
                                                    : 'bg-background hover:bg-muted/30 border-border text-muted-foreground'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="permission_type"
                                                checked={data.permission_type === 'umum'}
                                                onChange={() => {}}
                                                className="text-primary"
                                            />
                                            <span className="text-xs">Izin Umum (Semua Santri di Kamar)</span>
                                        </label>

                                        <label
                                            onClick={() => {
                                                setData(prev => ({
                                                    ...prev,
                                                    permission_type: 'khusus',
                                                    select_all: false
                                                }));
                                            }}
                                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                                                data.permission_type === 'khusus'
                                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400 ring-1 ring-amber-400 font-bold'
                                                    : 'bg-background hover:bg-muted/30 border-border text-muted-foreground'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="permission_type"
                                                checked={data.permission_type === 'khusus'}
                                                onChange={() => {}}
                                                className="text-primary"
                                            />
                                            <span className="text-xs">Izin Khusus (Pilih Santri Tertentu)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Pilih Kamar */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground">
                                        Pilih Kamar <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                        value={data.active_kamar_id}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setData(prev => ({
                                                ...prev,
                                                active_kamar_id: val,
                                                permission_type: val === 'all' ? 'umum' : prev.permission_type,
                                                select_all: val === 'all' || prev.permission_type === 'umum'
                                            }));
                                        }}
                                        required
                                    >
                                        <option value="">-- Pilih Kamar --</option>
                                        <option value="all" className="font-bold text-primary">Semua Kamar (Libur Umum Seluruh Santri)</option>
                                        {kamars.map(kamar => (
                                            <option key={kamar.id} value={kamar.id}>{kamar.name}</option>
                                        ))}
                                    </select>
                                    {errors.active_kamar_id && <p className="text-xs text-destructive">{errors.active_kamar_id}</p>}
                                </div>

                                {/* Waktu */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Waktu Mulai (Keluar)</label>
                                        <input
                                            type="datetime-local"
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                            value={data.start_time}
                                            onChange={e => setData('start_time', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground">Waktu Akhir (Kembali)</label>
                                        <input
                                            type="datetime-local"
                                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                            value={data.end_time}
                                            onChange={e => setData('end_time', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Pilih Santri Khusus */}
                                {data.permission_type === 'khusus' && data.active_kamar_id && data.active_kamar_id !== 'all' && (
                                    <div className="space-y-3 border rounded-xl p-4 bg-muted/20">
                                        <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Pilih Santri di Kamar</h3>
                                        {loadingRoomStudents ? (
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Memuat daftar santri di kamar...
                                            </div>
                                        ) : roomStudents.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                                                {roomStudents.map(student => (
                                                    <label
                                                        key={student.id}
                                                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                                                            data.student_ids.includes(student.id)
                                                                ? 'bg-primary/10 border-primary/50 text-foreground font-semibold'
                                                                : 'bg-background hover:bg-muted/40 border-border text-muted-foreground'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.student_ids.includes(student.id)}
                                                            onChange={() => handleStudentCheck(student.id)}
                                                            className="rounded border-input text-primary"
                                                        />
                                                        <span>{student.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-600">Tidak ada santri aktif di kamar ini.</p>
                                        )}
                                    </div>
                                )}

                                {/* Deskripsi */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground">Keterangan Tambahan (Opsional)</label>
                                    <textarea
                                        rows={2}
                                        className="flex w-full rounded-xl border border-input bg-background p-3 text-sm shadow-sm"
                                        placeholder="Keterangan perizinan rombongan..."
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <Link
                                href={route('permissions.index')}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing || (mode === 'personal' && !data.student_id)}
                                className={`inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    mode === 'personal'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
                                }`}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        <span>{mode === 'personal' ? 'Simpan Izin Personal' : 'Simpan Izin Rombongan'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
