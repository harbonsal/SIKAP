import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, X, User, Edit2, Info, List } from 'lucide-react';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";

export default function Show({ activeClass, subjects, teachers, semesters }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.user_level?.name === 'Administrator';

    // State for Semester Filter
    const [selectedSemesterId, setSelectedSemesterId] = useState('annual'); // 'annual' or integer ID

    // Helper to get effective teacher for current view
    const getTeacher = (subject) => {
        if (selectedSemesterId === 'annual') {
            return {
                teacher: subject?.teacher || null,
                isInherited: false,
                isOverride: false
            };
        }

        // Find override for selected semester
        const override = subject?.semester_subject_teachers?.find(
            sst => sst.semester_id?.toString() === selectedSemesterId.toString()
        );

        if (override) {
            return {
                teacher: override?.teacher || null,
                isInherited: false,
                isOverride: true
            };
        }

        return {
            teacher: subject?.teacher || null,
            isInherited: true, // Showing annual because no override
            isOverride: false
        };
    };

    // State for Inline Editing
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editTeacherId, setEditTeacherId] = useState('');

    const startEditing = (subject) => {
        const currentData = getTeacher(subject);
        setEditingSubjectId(subject?.id);
        // If inherited, we start with empty (or maybe the inherited value? prefer empty to force choice or explicit "Same")
        // Actually, better to start with current effective teacher ID to make it easy to "Save as override"
        setEditTeacherId(currentData.teacher?.id || '');
    };

    const cancelEditing = () => {
        setEditingSubjectId(null);
        setEditTeacherId('');
    };

    const saveEditing = (id) => {
        const payload = {
            teacher_id: editTeacherId,
        };

        if (selectedSemesterId !== 'annual') {
            payload.semester_id = selectedSemesterId;
        }

        router.put(route('subject-teachers.update', id), payload, {
            onSuccess: () => {
                setEditingSubjectId(null);
            },
        });
    };

    const selectedSemesterName = selectedSemesterId === 'annual'
        ? "Tahunan (Default)"
        : semesters?.find(s => s?.id?.toString() === selectedSemesterId.toString())?.name || '-';

    return (
        <MainLayout>
            <Head title={`Guru Mapel ${activeClass?.kelas?.name || ''} ${activeClass?.kelas_paralel?.name || ''} - ${activeClass?.academic_year?.name || ''}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('active-classes.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kelas Aktif
                        </Link>
                        <Link
                            href={route('subject-teachers.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                            title="Kembali ke Daftar Plotting Guru"
                        >
                            <List className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                {activeClass?.kelas?.name} {activeClass?.kelas_paralel?.name}
                            </h2>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <span>{activeClass?.academic_year?.name}</span>
                                <span>•</span>
                                <span>Wali Kelas: {activeClass?.teacher?.name || '-'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="w-full sm:w-64">
                        <Select
                            value={selectedSemesterId.toString()}
                            onValueChange={(val) => setSelectedSemesterId(val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Semester Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="annual">Tahunan (Default)</SelectItem>
                                {semesters.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        Semester {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedSemesterId !== 'annual' && (
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Mode Semester {selectedSemesterName}</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        Anda sedang mengatur guru khusus untuk <strong>Semester {selectedSemesterName}</strong>.
                                        Jika dikosongkan, maka akan otomatis menggunakan guru dari pengaturan <strong>Tahunan</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Mata Pelajaran</th>
                                    <th className="px-6 py-3 font-medium w-24 text-center">Jam</th>
                                    <th className="px-6 py-3 font-medium">
                                        Guru Pengampu
                                        <span className="ml-1 text-xs normal-case opacity-70">
                                            ({selectedSemesterName})
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subjects.length > 0 ? (
                                    subjects.map((subject, index) => {
                                        const { teacher, isInherited, isOverride } = getTeacher(subject);

                                        return (
                                            <tr key={subject.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 text-center">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{subject?.mapel?.name}</span>
                                                        {isOverride && (
                                                            <span className="text-[10px] text-blue-600 font-semibold mt-0.5">
                                                                *Khusus Semester Ini
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                                        {subject.jam} Jam
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isAdmin && editingSubjectId === subject.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={editTeacherId}
                                                                onChange={(e) => setEditTeacherId(e.target.value)}
                                                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                            >
                                                                <option value="">
                                                                    {selectedSemesterId !== 'annual'
                                                                        ? '(Gunakan Default Tahunan)'
                                                                        : 'Pilih Guru'}
                                                                </option>
                                                                {teachers.map((t) => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => saveEditing(subject.id)} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded"><Save className="h-4 w-4" /></button>
                                                            <button onClick={cancelEditing} className="text-red-600 hover:text-red-700 bg-red-50 p-1 rounded"><X className="h-4 w-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center justify-between group ${isAdmin ? 'cursor-pointer' : ''}`} onClick={() => isAdmin && startEditing(subject)}>
                                                            <div className="flex items-center gap-2">
                                                                {teacher ? (
                                                                    <>
                                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isInherited ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                                                            {teacher?.name?.substring(0, 2).toUpperCase() || '?'}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={isInherited ? 'text-muted-foreground' : 'font-medium'}>
                                                                                {teacher?.name || 'Unknown'}
                                                                            </span>
                                                                            {isInherited && selectedSemesterId !== 'annual' && (
                                                                                <span className="text-[10px] text-muted-foreground italic">(Mengikut Tahunan)</span>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className={`flex items-center gap-2 text-muted-foreground ${isAdmin ? 'hover:text-primary transition-colors' : ''}`}>
                                                                        <span className="italic">Belum ditentukan</span>
                                                                        {isAdmin && <Edit2 className="h-3 w-3" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isAdmin && (
                                                                <button
                                                                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Ubah Guru"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada mapel di kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
