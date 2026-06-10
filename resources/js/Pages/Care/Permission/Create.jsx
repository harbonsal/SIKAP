import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Create({ kamars }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        active_kamar_id: '',
        start_time: '',
        end_time: '',
        description: '',
        select_all: true,
        student_ids: []
    });

    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Fetch students when Kamar changes
    useEffect(() => {
        if (data.active_kamar_id) {
            setLoadingStudents(true);
            axios.get(route('permissions.students', data.active_kamar_id))
                .then(response => {
                    setStudents(response.data);
                    // Reset student selection when kamar changes
                    setData(prev => ({ ...prev, student_ids: [], select_all: true }));
                })
                .catch(error => {
                    console.error("Error fetching students:", error);
                })
                .finally(() => {
                    setLoadingStudents(false);
                });
        } else {
            setStudents([]);
        }
    }, [data.active_kamar_id]);

    const handleSelectAllChange = (e) => {
        const checked = e.target.checked;
        setData(prev => ({
            ...prev,
            select_all: checked,
            student_ids: checked ? [] : [] // If check all, we rely on backend or empty list implies all valid? Logic: If select_all true, backend ignores student_ids and takes all. If false, takes student_ids.
        }));
    };

    const handleStudentCheck = (studentId) => {
        const currentIds = data.student_ids;
        let newIds = [];
        if (currentIds.includes(studentId)) {
            newIds = currentIds.filter(id => id !== studentId);
        } else {
            newIds = [...currentIds, studentId];
        }

        setData(prev => ({
            ...prev,
            select_all: false, // If manually checking, uncheck "Select All"
            student_ids: newIds
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('permissions.store'));
    };

    return (
        <MainLayout>
            <Head title="Buat Izin Baru" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('permissions.index')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Buat Izin Baru</h2>
                        <p className="text-muted-foreground">Buat kelompok perizinan untuk satu kamar.</p>
                    </div>
                </div>

                <div className="bg-card rounded-xl border shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nama Izin */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nama Izin / Kegiatan
                            </label>
                            <input
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Contoh: Pesiar Jumat, Izin Sakit"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        {/* Pilih Kamar */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Pilih Kamar
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={data.active_kamar_id}
                                onChange={e => setData('active_kamar_id', e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Kamar --</option>
                                {kamars.map(kamar => (
                                    <option key={kamar.id} value={kamar.id}>{kamar.name}</option>
                                ))}
                            </select>
                            {errors.active_kamar_id && <p className="text-sm text-destructive">{errors.active_kamar_id}</p>}
                        </div>

                        {/* Waktu */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Waktu Mulai (Keluar)</label>
                                <input
                                    type="datetime-local"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={data.start_time}
                                    onChange={e => setData('start_time', e.target.value)}
                                    required
                                />
                                {errors.start_time && <p className="text-sm text-destructive">{errors.start_time}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Waktu Akhir (Kembali)</label>
                                <input
                                    type="datetime-local"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={data.end_time}
                                    onChange={e => setData('end_time', e.target.value)}
                                    required
                                />
                                {errors.end_time && <p className="text-sm text-destructive">{errors.end_time}</p>}
                            </div>
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Keterangan (Opsional)</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                        </div>

                        {/* Pilih Santri */}
                        {data.active_kamar_id && (
                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                <h3 className="font-medium text-sm">Pilih Santri</h3>
                                {loadingStudents ? (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar santri...
                                    </div>
                                ) : students.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="select_all"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={data.select_all}
                                                onChange={handleSelectAllChange}
                                            />
                                            <label htmlFor="select_all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                Semua Anggota Kamar ({students.length} Santri)
                                            </label>
                                        </div>

                                        {!data.select_all && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto pl-6">
                                                {students.map(student => (
                                                    <div key={student.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`student_${student.id}`}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            checked={data.student_ids.includes(student.id)}
                                                            onChange={() => handleStudentCheck(student.id)}
                                                        />
                                                        <label htmlFor={`student_${student.id}`} className="text-sm leading-none cursor-pointer">
                                                            {student.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-600">Tidak ada santri di kamar ini.</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Simpan Izin
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
