import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, Calendar, Clock, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Edit({ journal, activeSubjects, initialStudents }) {
    const { data, setData, put, processing, errors } = useForm({
        active_subject_id: journal.active_subject_id,
        date: journal.date,
        jam_ke: journal.jam_ke,
        pekan_id: journal.pekan_id,
        topic: journal.topic,
        description: journal.description || '',
        attendances: initialStudents || [],
    });

    const [students, setStudents] = useState(initialStudents || []);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    useEffect(() => {
        if (data.active_subject_id === journal.active_subject_id) {
            setStudents(initialStudents);
            setData('attendances', initialStudents);
            return;
        }

        if (data.active_subject_id) {
            setIsLoadingStudents(true);
            axios.get(route('journals.get-students', data.active_subject_id))
                .then(response => {
                    const studentList = response.data.map(student => ({
                        student_id: student.id,
                        name: student.name,
                        nis: student.nis,
                        status: 'Hadir',
                        note: ''
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
    }, [data.active_subject_id]);

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

                                            <input
                                                type="text"
                                                placeholder="Keterangan..."
                                                value={student.note || ''}
                                                onChange={(e) => handleAttendanceChange(index, 'note', e.target.value)}
                                                className="h-8 text-xs border rounded px-2 w-32 md:w-48"
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
                            SIMPAN PERUBAHAN
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
