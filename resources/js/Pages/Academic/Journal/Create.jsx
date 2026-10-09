import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, Calendar, Clock, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Create({ academicYear, currentPekan, jamKe, activeSubjects, date, selectedSubjectId }) {
    const { data, setData, post, processing, errors } = useForm({
        active_subject_id: selectedSubjectId || '',
        date: date,
        jam_ke: jamKe,
        pekan_id: currentPekan?.id || '',
        topic: '',
        last_topic: '',
        last_description: '',
        description: '',
        attendances: [],
    });

    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [silabuses, setSilabuses] = useState([]);

    // Fetch students and silabus when Subject is selected
    useEffect(() => {
        if (data.active_subject_id) {
            setIsLoadingStudents(true);
            
            // 1. Fetch Students
            axios.get(route('journals.get-students', data.active_subject_id))
                .then(response => {
                    const studentList = response.data
                        .sort((a, b) => String(a.nis).localeCompare(String(b.nis), undefined, {numeric: true}))
                        .map(student => ({
                        student_id: student.id,
                        name: student.name,
                        nis: student.nis,
                        status: 'Hadir', // Default status
                        is_uniform_complete: true, // Default seragam
                        note: ''
                    }));
                    setStudents(studentList);
                    
                    // We also fetch syllabus here to avoid state race condition in Inertia useForm
                    axios.get(route('journals.get-silabus', data.active_subject_id))
                        .then(silabusRes => {
                            setSilabuses(silabusRes.data);
                            let newTopic = data.topic;
                            
                            // Auto-fill logic if empty
                            if (!newTopic && currentPekan && currentPekan.name) {
                                const pekanNumber = parseInt(currentPekan.name.replace(/[^0-9]/g, ''), 10);
                                const match = silabusRes.data.find(s => parseInt(s.pekan, 10) === pekanNumber);
                                if (match) {
                                    newTopic = (match.kompetensi ? "KD: " + match.kompetensi + "\n" : "") + "Materi: " + match.materi;
                                }
                            }
                            
                            // Also fetch last journal
                            axios.get(route('journals.last-journal', data.active_subject_id))
                                .then(lastJournalRes => {
                                    const lastJournal = lastJournalRes.data;
                                    setData(prev => ({
                                        ...prev,
                                        attendances: studentList,
                                        topic: newTopic,
                                        last_topic: lastJournal ? lastJournal.topic : null,
                                        last_description: lastJournal ? lastJournal.description : null
                                    }));
                                })
                                .catch(() => {
                                    setData(prev => ({
                                        ...prev,
                                        attendances: studentList,
                                        topic: newTopic,
                                        last_topic: null,
                                        last_description: null
                                    }));
                                });
                        });
                })
                .catch(error => console.error("Error fetching data:", error))
                .finally(() => setIsLoadingStudents(false));
                
        } else {
            setStudents([]);
            setSilabuses([]);
            setData(prev => ({ ...prev, attendances: [], topic: '' }));
        }
    }, [data.active_subject_id]);

    const handleAttendanceChange = (index, field, value) => {
        const updatedAttendances = [...data.attendances];
        updatedAttendances[index][field] = value;
        setData('attendances', updatedAttendances);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('journals.store'));
    };

    return (
        <MainLayout>
            <Head title="Input Jurnal & Absensi" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Input Jurnal & Absensi</h2>
                    <p className="text-muted-foreground">
                        {academicYear?.name} • Pekan {currentPekan?.name || '-'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* INFO UTAMA */}
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
                                        {Object.entries(
                                            activeSubjects.reduce((acc, subject) => {
                                                const className = subject.class_name || 'Lainnya';
                                                if (!acc[className]) acc[className] = [];
                                                acc[className].push(subject);
                                                return acc;
                                            }, {})
                                        ).map(([className, subjects]) => (
                                            <optgroup key={className} label={className}>
                                                {subjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                {errors.active_subject_id && <p className="text-destructive text-sm">{errors.active_subject_id}</p>}
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="text-sm font-medium">Materi Pembelajaran (Topik)</label>
                                {data.last_topic && (
                                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                                        <div className="font-semibold flex items-center gap-1 mb-1">
                                            <AlertCircle className="w-4 h-4" /> Materi Terakhir Disampaikan:
                                        </div>
                                        <div className="whitespace-pre-wrap">{data.last_topic}</div>
                                        
                                        {data.last_description && (
                                            <div className="mt-3 pt-3 border-t border-blue-200/60">
                                                <div className="font-semibold flex items-center gap-1 mb-1">
                                                    Catatan Tambahan Terakhir:
                                                </div>
                                                <div className="whitespace-pre-wrap">{data.last_description}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <UserCheck className="h-5 w-5" /> Absensi Siswa
                            </h3>
                            <div className="text-sm text-muted-foreground">
                                Total: {data.attendances.length} Siswa
                            </div>
                        </div>

                        {!data.active_subject_id ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Silakan pilih Mata Pelajaran & Kelas terlebih dahulu untuk menampilkan daftar siswa.</p>
                            </div>
                        ) : isLoadingStudents ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground animate-pulse">Memuat data siswa...</p>
                            </div>
                        ) : data.attendances.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <p>Tidak ada siswa di kelas ini.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {data.attendances.map((student, index) => (
                                    <div key={student.student_id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex-none w-8 text-sm font-semibold text-muted-foreground">
                                            {index + 1}.
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">NIS: {student.nis}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex bg-muted rounded-md p-1">
                                                {['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'].map((status) => (
                                                    <button
                                                        type="button"
                                                        key={status}
                                                        onClick={() => handleAttendanceChange(index, 'status', status)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${student.status === status
                                                            ? 'bg-background shadow-sm text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2 border-l pl-3 ml-1">
                                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                                                    <input
                                                        type="checkbox"
                                                        checked={student.is_uniform_complete ?? true}
                                                        onChange={(e) => handleAttendanceChange(index, 'is_uniform_complete', e.target.checked)}
                                                        className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
                                                    />
                                                    Seragam Sesuai
                                                </label>
                                            </div>

                                            <input
                                                type="text"
                                                placeholder={student.status === 'Hadir' ? "Catatan tambahan..." : `Keterangan ${student.status.toLowerCase()}...`}
                                                value={student.note || ''}
                                                onChange={(e) => handleAttendanceChange(index, 'note', e.target.value)}
                                                className="h-8 text-xs border rounded px-2 w-32 md:w-48 ml-2"
                                            />
                                        </div>
                                    </div>
                                ))}
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
                            SIMPAN JURNAL & ABSENSI
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
