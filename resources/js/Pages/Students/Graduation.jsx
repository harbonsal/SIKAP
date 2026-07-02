import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, AlertCircle, GraduationCap, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Graduation({ classes, students, filters }) {
    const { flash } = usePage().props;
    const [selectedClass, setSelectedClass] = useState(filters.class_id || '');
    const [selectedStudents, setSelectedStudents] = useState([]);
    
    const { data, setData, post, processing, errors } = useForm({
        student_ids: [],
        graduation_date: new Date().toISOString().split('T')[0],
        note: 'Lulus'
    });

    useEffect(() => {
        setData('student_ids', selectedStudents);
    }, [selectedStudents]);

    const handleClassChange = (e) => {
        const val = e.target.value;
        setSelectedClass(val);
        setSelectedStudents([]); // Reset selection
        router.get(route('students.graduation'), { class_id: val }, { preserveState: true, preserveScroll: true });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sId => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedStudents.length === 0) {
            alert('Pilih minimal satu santri untuk diluluskan.');
            return;
        }

        if (confirm(`Anda yakin ingin meluluskan ${selectedStudents.length} santri terpilih? Status mereka akan berubah menjadi Nonaktif.`)) {
            post(route('students.graduation.process'), {
                onSuccess: () => {
                    setSelectedStudents([]);
                    // Reload data santri
                    router.get(route('students.graduation'), { class_id: selectedClass }, { preserveState: true, preserveScroll: true });
                }
            });
        }
    };

    const allSelected = students.length > 0 && selectedStudents.length === students.length;
    const someSelected = selectedStudents.length > 0 && selectedStudents.length < students.length;

    return (
        <MainLayout>
            <Head title="Kelulusan Santri" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('students.index')}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kelulusan Santri</h2>
                        <p className="text-muted-foreground">Proses pe-nonaktifan santri secara massal karena kelulusan.</p>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{flash.success}</p>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{flash.error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Panel: Filter & Form */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium leading-none mb-2 block">Pilih Kelas</label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.kelas?.name} {c.kelas_paralel?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedClass && (
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                                    <div>
                                        <label className="text-sm font-medium leading-none mb-2 block">Tanggal Lulus</label>
                                        <input 
                                            type="date" 
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={data.graduation_date}
                                            onChange={e => setData('graduation_date', e.target.value)}
                                            required
                                        />
                                        {errors.graduation_date && <p className="text-xs text-destructive mt-1">{errors.graduation_date}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium leading-none mb-2 block">Catatan / Keterangan</label>
                                        <input 
                                            type="text" 
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={data.note}
                                            onChange={e => setData('note', e.target.value)}
                                            placeholder="Cth: Lulus Tahun Ajaran 2023/2024"
                                        />
                                        {errors.note && <p className="text-xs text-destructive mt-1">{errors.note}</p>}
                                    </div>

                                    <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-xs mt-4">
                                        Santri yang diluluskan akan diubah statusnya menjadi <strong>Tidak Aktif</strong>.
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={processing || selectedStudents.length === 0}
                                        className="w-full flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <GraduationCap className="h-4 w-4" />
                                        {processing ? 'Memproses...' : `Luluskan (${selectedStudents.length}) Santri`}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Data Table */}
                    <div className="md:col-span-3">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="p-4 border-b flex justify-between items-center bg-muted/20">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Daftar Santri Aktif
                                </h3>
                                <div className="text-sm text-muted-foreground">
                                    Total: {students.length} Santri
                                </div>
                            </div>
                            
                            {!selectedClass ? (
                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                    <Users className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Silakan pilih kelas terlebih dahulu untuk melihat daftar santri.</p>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                    <GraduationCap className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Tidak ada santri aktif di kelas ini.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                            <tr>
                                                <th scope="col" className="p-4 w-4">
                                                    <div className="flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                            checked={allSelected}
                                                            ref={input => {
                                                                if (input) input.indeterminate = someSelected;
                                                            }}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-4 py-3 font-medium">NIS / NISN</th>
                                                <th scope="col" className="px-4 py-3 font-medium">Nama Lengkap</th>
                                                <th scope="col" className="px-4 py-3 font-medium">L/P</th>
                                                <th scope="col" className="px-4 py-3 font-medium">Kelas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => {
                                                const isActiveClass = student.class_members?.find(cm => cm.active_class_id == selectedClass);
                                                const className = isActiveClass 
                                                    ? `${isActiveClass.active_class?.kelas?.name} ${isActiveClass.active_class?.kelas_paralel?.name ?? ''}`
                                                    : '-';

                                                return (
                                                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                        <td className="p-4 w-4">
                                                            <div className="flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                                                    checked={selectedStudents.includes(student.id)}
                                                                    onChange={() => handleSelectStudent(student.id)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-foreground">
                                                            <div>{student.user?.nomor_induk}</div>
                                                            {student.nisn && <div className="text-xs text-muted-foreground font-normal">{student.nisn}</div>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-foreground">{student.user?.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">
                                                                {student.gender}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {className}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
