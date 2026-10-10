import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, Calendar, Clock, BookOpen, UserCheck, AlertCircle, HeartPulse, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Edit({ 
    journal, 
    activeSubjects, 
    initialStudents,
    attendanceSettings = { teacher_can_set_sick: false, teacher_can_set_permission: false },
    userCanManageSettings = false,
    isTeacherOnly = false
}) {
    const sortedInitialStudents = [...(initialStudents || [])].sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, {numeric: true}));

    const { data, setData, put, processing, errors } = useForm({
        active_subject_id: journal.active_subject_id,
        date: journal.date,
        jam_ke: journal.jam_ke,
        pekan_id: journal.pekan_id,
        topic: journal.topic,
        description: journal.description || '',
        attendances: sortedInitialStudents,
    });

    const [students, setStudents] = useState(sortedInitialStudents);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [silabuses, setSilabuses] = useState([]);

    useEffect(() => {
        if (data.active_subject_id) {
            axios.get(route('journals.get-silabus', data.active_subject_id))
                .then(res => setSilabuses(res.data))
                .catch(err => console.error("Error fetching silabus:", err));
        } else {
            setSilabuses([]);
        }
    }, [data.active_subject_id]);

    useEffect(() => {
        if (data.active_subject_id === journal.active_subject_id && data.date === journal.date) {
            setStudents(sortedInitialStudents);
            setData('attendances', sortedInitialStudents);
            return;
        }

        if (data.active_subject_id) {
            setIsLoadingStudents(true);
            axios.get(route('journals.get-students', data.active_subject_id), { params: { date: data.date } })
                .then(response => {
                    const studentList = response.data
                        .sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, {numeric: true}))
                        .map(student => ({
                        student_id: student.id,
                        name: student.name,
                        nis: student.nis,
                        status: student.suggested_status || 'Hadir',
                        is_uniform_complete: true,
                        note: student.suggested_note || '',
                        is_sick_from_health: student.is_sick_from_health || false,
                        health_info: student.health_info || null,
                        is_permitted_from_care: student.is_permitted_from_care || false,
                        permission_info: student.permission_info || null,
                    }));
                    setStudents(studentList);
                    setData('attendances', studentList);
                })
                .catch(error => {
                    console.error("Error fetching students:", error);
                })
                .finally(() => {
                    setIsLoadingStudents(false);
                });
        }
    }, [data.active_subject_id, data.date]);

    const handleAttendanceChange = (index, field, value) => {
        const updatedAttendances = [...data.attendances];
        updatedAttendances[index][field] = value;
        setData('attendances', updatedAttendances);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('journals.update', journal.id));
    };

    return (
        <MainLayout>
            <Head title="Edit Jurnal & Absensi" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit Jurnal & Absensi</h2>
                    <p className="text-muted-foreground">
                        Perbarui data jurnal dan absensi siswa.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                </div>
                                {errors.date && <p className="text-destructive text-sm">{errors.date}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jam Ke-</label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Contoh: 1-2"
                                        value={data.jam_ke}
                                        onChange={e => setData('jam_ke', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                </div>
                                {errors.jam_ke && <p className="text-destructive text-sm">{errors.jam_ke}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Mata Pelajaran & Kelas</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        value={data.active_subject_id}
                                        onChange={e => setData('active_subject_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    >
                                        <option value="">Pilih Kelas & Mapel</option>
                                        {activeSubjects.map((subject) => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.active_subject_id && <p className="text-destructive text-sm">{errors.active_subject_id}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Materi Pembelajaran (Topik)</label>
                                {silabuses.length > 0 && (
                                    <div className="mb-2">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground"
                                            onChange={e => {
                                                const match = silabuses.find(s => s.id.toString() === e.target.value);
                                                if (match) {
                                                    const text = (match.kompetensi ? "KD: " + match.kompetensi + "\n" : "") + "Materi: " + match.materi;
                                                    setData('topic', text);
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>💡 Pilih dari Silabus...</option>
                                            {silabuses.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    Pekan {s.pekan || '-'}: {s.materi}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Isi materi yang diajarkan hari ini..."
                                    value={data.topic}
                                    onChange={e => setData('topic', e.target.value)}
                                    required
                                />
                                {errors.topic && <p className="text-destructive text-sm">{errors.topic}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Catatan kejadian di kelas, tugas, dll."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ABSENSI */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-primary" /> Absensi Siswa
                                </h3>
                                <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                                    Total: {data.attendances.length} Siswa
                                </span>
                            </div>

                            {/* Action Header */}
                        </div>

                        {!data.active_subject_id ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Silakan pilih Mata Pelajaran & Kelas terlebih dahulu untuk menampilkan daftar siswa.</p>
                            </div>
                        ) : isLoadingStudents ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground animate-pulse">Memuat data siswa dan menyinkronkan status kesehatan...</p>
                            </div>
                        ) : data.attendances.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <p>Tidak ada siswa di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {data.attendances.map((student, index) => {
                                    const isSickFromHealth = !!student.is_sick_from_health;
                                    const isPermittedFromCare = !!student.is_permitted_from_care;

                                    return (
                                        <div key={student.student_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="flex-none w-6 text-sm font-semibold text-muted-foreground pt-0.5">
                                                    {index + 1}.
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-foreground">{student.name}</p>
                                                        <span className="text-xs text-muted-foreground">NIS: {student.nis}</span>
                                                    </div>

                                                    {/* Badges dari Poskestren / Pengasuhan */}
                                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                                        {isSickFromHealth && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                                                                <HeartPulse className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                                                <span>Sakit (UKS): {student.health_info}</span>
                                                            </span>
                                                        )}

                                                        {isPermittedFromCare && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                                                <span>Izin (Pengasuhan): {student.permission_info}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                                                {/* Tombol Status Kehadiran (5 Kolom Penuh di HP) */}
                                                <div className="grid grid-cols-5 sm:flex gap-1.5 p-1 bg-muted/70 dark:bg-muted/30 rounded-xl border border-border/80 shadow-inner">
                                                    {['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'].map((status) => {
                                                        const isSelected = student.status === status;
                                                        
                                                        // Evaluasi apakah tombol ini disabled
                                                        // Pada mode Edit, guru bersangkutan bebas mengoreksi status kehadiran santri
                                                        // untuk mengantisipasi jika terjadi kesalahan saat input sebelumnya.
                                                        let isDisabled = false;
                                                        let disabledTitle = '';

                                                        // Warna status yang tajam, vibrant, dan berdaya kontras tinggi
                                                        let buttonClass = '';
                                                        if (isSelected) {
                                                            if (status === 'Hadir') {
                                                                buttonClass = 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500 scale-[1.02]';
                                                            } else if (status === 'Sakit') {
                                                                buttonClass = 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30 ring-2 ring-rose-500 scale-[1.02]';
                                                            } else if (status === 'Izin') {
                                                                buttonClass = 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30 ring-2 ring-amber-400 scale-[1.02]';
                                                            } else if (status === 'Alpa') {
                                                                buttonClass = 'bg-red-800 text-white font-bold shadow-md shadow-red-800/30 ring-2 ring-red-700 scale-[1.02]';
                                                            } else if (status === 'Terlambat') {
                                                                buttonClass = 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30 ring-2 ring-orange-500 scale-[1.02]';
                                                            }
                                                        } else {
                                                            // State Tidak Aktif (Kontras Jelas & Border Ringan)
                                                            if (status === 'Hadir') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
                                                            } else if (status === 'Sakit') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-rose-800 dark:text-rose-300 border border-rose-300/80 hover:bg-rose-50 dark:hover:bg-rose-950/40';
                                                            } else if (status === 'Izin') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-amber-900 dark:text-amber-300 border border-amber-300/80 hover:bg-amber-50 dark:hover:bg-amber-950/40';
                                                            } else if (status === 'Alpa') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-red-900 dark:text-red-300 border border-red-300/80 hover:bg-red-50 dark:hover:bg-red-950/40';
                                                            } else if (status === 'Terlambat') {
                                                                buttonClass = 'bg-white dark:bg-zinc-800 text-orange-900 dark:text-orange-300 border border-orange-300/80 hover:bg-orange-50 dark:hover:bg-orange-950/40';
                                                            }
                                                        }

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={status}
                                                                disabled={isDisabled}
                                                                title={disabledTitle || status}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        handleAttendanceChange(index, 'status', status);
                                                                    }
                                                                }}
                                                                className={`h-10 sm:h-8 px-1 sm:px-3 text-xs font-bold rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 ${buttonClass}`}
                                                            >
                                                                {status}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Seragam & Catatan */}
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2.5 py-2 sm:py-1.5 rounded-lg bg-muted/40 sm:bg-transparent border sm:border-0 border-border text-foreground hover:bg-muted/70 transition-colors shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={student.is_uniform_complete ?? true}
                                                            onChange={(e) => handleAttendanceChange(index, 'is_uniform_complete', e.target.checked)}
                                                            className="rounded border-input text-primary focus:ring-primary w-4 h-4 sm:w-3.5 sm:h-3.5"
                                                        />
                                                        <span className="hidden sm:inline">Seragam Sesuai</span>
                                                        <span className="sm:hidden">Seragam</span>
                                                    </label>

                                                    <input
                                                        type="text"
                                                        placeholder={student.status === 'Hadir' ? "Catatan..." : `Ket. ${student.status.toLowerCase()}...`}
                                                        value={student.note || ''}
                                                        onChange={(e) => handleAttendanceChange(index, 'note', e.target.value)}
                                                        className="h-10 sm:h-8 text-sm sm:text-xs border rounded-lg px-2.5 flex-1 sm:w-36 md:w-48 bg-background focus:ring-2 focus:ring-primary/30"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link
                            href={route('journals.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            SIMPAN PERUBAHAN
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
