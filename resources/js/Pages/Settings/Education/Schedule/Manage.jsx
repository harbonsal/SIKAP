import MainLayout from '@/Layouts/MainLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Users, User, Clock, Plus, Trash2, Save, X, Edit, Info, LayoutGrid, Printer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import Swal from 'sweetalert2';

export default function Manage({ schedules, activeClasses, days, activeSlots, learningHours, teachers, initialTab, initialClassId, initialTeacherId, activeYear, schoolInfo }) {

    const [selectedView, setSelectedView] = useState(initialTab || 'master'); // master, class, teacher, arabic_class
    const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId || '');

    const ARABIC_DAYS = {
        'Senin': 'الإثنين', // Al-Itsnayn
        'Selasa': 'الثلاثاء', // Ats-Tsulasa'
        'Rabu': 'الأربعاء', // Al-Arbi'a'
        'Kamis': 'الخميس', // Al-Khamis
        'Jumat': 'الجمعة', // Al-Jumu'ah
        'Sabtu': 'السبت', // As-Sabt
        'Minggu': 'الأحد', // Al-Ahad
    };

    const handlePrint = () => {
        window.print();
    };



    const PrintHeader = ({ title, subtitle, isArabic = false }) => (
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
            <div className="flex items-start justify-between mb-4">
                <div className={`${isArabic ? 'text-right order-2' : 'text-left'}`}>
                    <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900">{isArabic ? 'مدرسة التوحيد المتوسطة' : (schoolInfo?.name || 'SMP INTEGRAL AR-ROHMAH')}</h1>
                    <p className="text-base text-gray-600 font-semibold">{schoolInfo?.address || 'Jl. Raya Hidayatullah, Sumber Arum, Malang'}</p>
                </div>
                <div className={`${isArabic ? 'text-left order-1' : 'text-right'}`}>
                    <p className="text-sm font-bold uppercase text-gray-800">{isArabic ? 'العام الدراسي' : 'Tahun Pelajaran'}: {activeYear?.name}</p>
                    <p className="text-sm text-gray-800">{isArabic ? 'الفصل' : 'Semester'}: {activeYear?.semester === 'Ganjil' ? (isArabic ? 'الأول' : 'Ganjil') : (isArabic ? 'الثاني' : 'Genap')}</p>
                </div>
            </div>
            <div className="text-center">
                <h2 className={`text-2xl font-bold text-white inline-block px-8 py-2 rounded-lg shadow-sm ${isArabic ? 'font-serif bg-emerald-600' : 'bg-blue-600'}`}>{title}</h2>
                {subtitle && <h3 className={`text-lg font-bold text-gray-500 mt-2 uppercase tracking-widest ${isArabic ? 'font-serif' : ''}`}>{subtitle}</h3>}
            </div>
            <style>{`
                @media print {
                    @page { margin: 0.5cm; size: landscape; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );

    // Grid Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorClassId, setEditorClassId] = useState('');
    const [gridData, setGridData] = useState({}); // { "dayId-hourId": subjectId }

    // Initialize logic
    useEffect(() => {
        if (initialClassId) setSelectedClassId(initialClassId);
        if (initialTeacherId) setSelectedTeacherId(initialTeacherId);
    }, [initialClassId, initialTeacherId]);

    // -- GRID EDITOR LOGIC --

    // Filtered lists for Grid
    const activeDays = days.filter(d => d.name !== 'Ahad' && d.name !== 'Minggu'); // Hide Minggu
    const editorClass = activeClasses.find(c => c.id == editorClassId);
    const editorSubjects = editorClass ? editorClass.active_subjects : [];

    // Initialize Grid Data when Class changes in Editor
    useEffect(() => {
        if (isEditorOpen && editorClassId) {
            const initialGrid = {};
            // Populate with existing schedules
            schedules.forEach(s => {
                if (s.active_class_id == editorClassId) {
                    initialGrid[`${s.day_id}-${s.learning_hour_id}`] = s.active_subject_id;
                }
            });
            setGridData(initialGrid);
        }
    }, [isEditorOpen, editorClassId, schedules]);

    const handleGridChange = (dayId, hourId, subjectId) => {
        setGridData(prev => ({
            ...prev,
            [`${dayId}-${hourId}`]: subjectId
        }));
    };

    const handleBulkSave = () => {
        const payload = [];

        activeDays.forEach(day => {
            learningHours.forEach(hour => {
                const key = `${day.id}-${hour.id}`;
                const subjectId = gridData[key]; // Can be undefined or value

                if (subjectId !== undefined) {
                    payload.push({
                        day_id: day.id,
                        learning_hour_id: hour.id,
                        active_subject_id: subjectId
                    });
                }
            });
        });

        router.post(route('settings.master.schedules.bulk-store'), {
            active_class_id: editorClassId,
            schedule_items: payload
        }, {
            onSuccess: (page) => {
                setIsEditorOpen(false);
                if (page.props.flash?.error) {
                    Swal.fire('Gagal', page.props.flash.error, 'error');
                } else {
                    Swal.fire('Berhasil', 'Jadwal kelas berhasil diperbarui!', 'success');
                }
            },
            onError: (err) => {
                console.error(err);
                Swal.fire('Error', 'Terjadi kesalahan sistem.', 'error');
            }
        });
    }


    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus Jadwal?',
            text: "Slot jadwal ini akan dikosongkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('settings.master.schedules.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire('Terhapus!', 'Jadwal berhasil dihapus.', 'success')
                });
            }
        });
    }


    // Helper: Find schedule item for Display Views
    const getScheduleItem = (classId, dayId, hourId) => {
        return schedules.find(s =>
            s.active_class_id == classId &&
            s.day_id == dayId &&
            s.learning_hour_id == hourId
        );
    };

    // Helper: Is slot active?
    const isSlotActive = (dayId, hourId) => {
        if (!activeSlots[dayId]) return false;
        return activeSlots[dayId].some(slot => slot.learning_hour_id === hourId);
    };

    const renderMasterGrid = () => (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 border bg-muted font-medium sticky left-0 z-10 w-24">Waktu</th>
                        {activeClasses.map(ac => (
                            <th key={ac.id} className="p-2 border bg-muted font-medium min-w-[120px]">
                                {ac.kelas?.name} {ac.kelas_paralel?.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {activeDays.map(day => ( // Use filtered days
                        learningHours.map((hour, index) => {
                            // Break after Jam 3 (Index 2 -> Index 3 starts)
                            const showBreak = hour.hour_number === 4;

                            return (
                                <>
                                    {showBreak && (
                                        <tr key={`break-${day.id}`} className="bg-amber-100/50">
                                            <td colSpan={1 + activeClasses.length} className="p-1 text-center font-bold text-amber-700 text-[10px] tracking-widest border">
                                                ISTIRAHAT
                                            </td>
                                        </tr>
                                    )}
                                    <tr key={`${day.id}-${hour.id}`}>
                                        <td className="p-2 border bg-muted/20 font-medium sticky left-0 z-10">
                                            <div className="flex flex-col">
                                                <span>{day.name}</span>
                                                <span className="text-[10px] text-muted-foreground">Jam ke-{hour.hour_number}</span>
                                            </div>
                                        </td>
                                        {activeClasses.map(ac => {
                                            const schedule = getScheduleItem(ac.id, day.id, hour.id);
                                            // Special Case: Senin Jam 1
                                            const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number == 1;

                                            if (isMondayFirstHour) {
                                                return (
                                                    <td key={ac.id} className="p-1 border text-center h-16 bg-gray-100 text-gray-400 italic">
                                                        UPACARA / APEL
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={ac.id} className="p-1 border text-center h-16 align-top group relative hover:bg-slate-50">
                                                    {schedule ? (
                                                        <div className="flex flex-col h-full justify-center bg-primary/5 rounded p-1 relative">
                                                            <span className="font-bold text-primary truncate" title={schedule.active_subject?.mapel?.name}>
                                                                {schedule.active_subject?.mapel?.name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground truncate" title={schedule.teacher?.name}>
                                                                {schedule.teacher?.name}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDelete(schedule.id)}
                                                                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                                title="Hapus Jadwal"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-muted-foreground/20">
                                                            -
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </>
                            );
                        })
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderClassView = () => {
        const selectedClass = activeClasses.find(c => c.id == selectedClassId);

        if (!selectedClassId) return <div className="text-center p-8 text-muted-foreground">Pilih kelas untuk melihat jadwal.</div>;

        return (
            <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak Jadwal
                    </Button>
                </div>
                <div className="rounded-md border p-4 bg-card print:border-none print:shadow-none print:p-0 print:bg-white">
                    <PrintHeader
                        title={`JADWAL PELAJARAN KELAS ${selectedClass?.kelas?.name.toUpperCase()} ${selectedClass?.kelas_paralel?.name.toUpperCase()}`}
                        subtitle="KBM REGULER"
                    />
                    <h3 className="text-lg font-bold mb-4 print:hidden">Jadwal Kelas: {selectedClass?.kelas?.name} {selectedClass?.kelas_paralel?.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 print:grid-cols-3 print:gap-4 print:text-xs">
                        {activeDays.map(day => (
                            <div key={day.id} className="border-2 rounded-xl overflow-hidden shadow-sm print:border-blue-200 print:shadow-none">
                                <div className="bg-muted p-2 text-center font-bold text-sm border-b uppercase tracking-wider print:bg-blue-600 print:text-white print:border-blue-700">
                                    {day.name}
                                </div>
                                <div className="divide-y text-xs print:divide-blue-100">
                                    {learningHours.map(hour => {
                                        const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                        const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number == 1;

                                        return (
                                            <div key={hour.id} className="p-2 flex items-center gap-2 h-14 group relative hover:bg-slate-50 print:h-auto print:py-1.5 even:print:bg-blue-50/50">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0 print:bg-blue-100 print:text-blue-700">
                                                    {hour.hour_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isMondayFirstHour ? (
                                                        <span className="italic font-medium text-muted-foreground print:text-blue-900">Upacara/Apel</span>
                                                    ) : (
                                                        schedule ? (
                                                            <>
                                                                <div className="font-bold truncate text-foreground print:text-blue-900">{schedule.active_subject?.mapel?.name}</div>
                                                                <div className="text-muted-foreground truncate text-[10px] uppercase font-medium print:text-blue-600">{schedule.teacher?.name}</div>
                                                            </>
                                                        ) : <span className="text-muted-foreground/50 print:text-blue-200">-</span>
                                                    )}
                                                </div>
                                                {schedule && !isMondayFirstHour && (
                                                    <button
                                                        onClick={() => handleDelete(schedule.id)}
                                                        className="absolute right-1 top-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity print:hidden"
                                                        title="Hapus Jadwal"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderTeacherView = () => {
        if (!selectedTeacherId) return <div className="text-center p-8 text-muted-foreground">Pilih guru untuk melihat jadwal.</div>;

        const teacherSchedules = schedules.filter(s => s.teacher_id == selectedTeacherId);
        const currentTeacher = teachers.find(t => t.id == selectedTeacherId);

        return (
            <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak Jadwal
                    </Button>
                </div>
                <div className="print:bg-white">
                    <PrintHeader
                        title={`JADWAL MENGAJAR: ${currentTeacher?.name?.toUpperCase()}`}
                        subtitle="GURU MATA PELAJARAN"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print:text-xs">
                        {activeDays.map(day => (
                            <div key={day.id} className="border-2 rounded-xl overflow-hidden shadow-sm print:border-amber-200 print:shadow-none">
                                <div className="bg-muted p-2 text-center font-bold text-sm border-b uppercase tracking-wider print:bg-amber-500 print:text-white print:border-amber-600">
                                    {day.name}
                                </div>
                                <div className="divide-y text-xs print:divide-amber-100">
                                    {learningHours.map(hour => {
                                        const schedule = teacherSchedules.find(s => s.day_id == day.id && s.learning_hour_id == hour.id);
                                        const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number == 1;

                                        return (
                                            <div key={hour.id} className="p-2 flex items-center gap-3 h-14 hover:bg-slate-50 print:h-auto print:py-1.5 even:print:bg-amber-50/50">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0 print:bg-amber-100 print:text-amber-700">
                                                    {hour.hour_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {isMondayFirstHour ? (
                                                        <span className="italic font-medium text-muted-foreground print:text-amber-900">Upacara/Apel</span>
                                                    ) : (
                                                        schedule ? (
                                                            <>
                                                                <div className="font-bold truncate text-foreground print:text-amber-900">{schedule.active_class?.kelas?.name} {schedule.active_class?.kelas_paralel?.name}</div>
                                                                <div className="text-muted-foreground truncate text-[10px] uppercase font-medium print:text-amber-700">{schedule.active_subject?.mapel?.name}</div>
                                                            </>
                                                        ) : <span className="text-muted-foreground/50 print:text-amber-200">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderArabicClassView = () => {
        if (!selectedClassId) return <div className="text-center p-8 text-muted-foreground">Pilih kelas untuk melihat jadwal Arab.</div>;

        const selectedClass = activeClasses.find(c => c.id == selectedClassId);

        return (
            <div className="space-y-4">
                <div className="flex justify-end print:hidden">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak Arab
                    </Button>
                </div>
                <div className="print:bg-white" dir="rtl">
                    <PrintHeader
                        title={`الجدول الدراسي: ${selectedClass?.kelas?.name} ${selectedClass?.kelas_paralel?.name}`}
                        subtitle="للعام الدراسي"
                        isArabic={true}
                    />
                    <h3 className="text-lg font-bold mb-4 text-right print:hidden">الجدول الدراسي: {selectedClass?.kelas?.name} {selectedClass?.kelas_paralel?.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 print:text-xs">
                        {activeDays.map(day => (
                            <div key={day.id} className="border-2 rounded-xl overflow-hidden shadow-sm print:border-emerald-200 print:shadow-none">
                                <div className="bg-emerald-50 p-2 text-center font-bold text-sm border-b font-serif text-lg text-emerald-900 print:bg-emerald-600 print:text-white print:border-emerald-700">
                                    {ARABIC_DAYS[day.name] || day.name}
                                </div>
                                <div className="divide-y text-xs print:divide-emerald-100">
                                    {learningHours.map(hour => {
                                        const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                        const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number == 1;

                                        return (
                                            <div key={hour.id} className="p-2 flex items-center gap-2 h-16 group relative hover:bg-emerald-50/50 print:h-auto print:py-1.5 even:print:bg-emerald-50/50">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-serif shrink-0 ml-2 print:bg-emerald-100 print:text-emerald-800 print:border print:border-emerald-200">
                                                    {hour.hour_number}
                                                </div>
                                                <div className="flex-1 min-w-0 text-right">
                                                    {isMondayFirstHour ? (
                                                        <span className="italic font-bold text-emerald-700 font-serif text-sm print:text-emerald-800">المراسم</span>
                                                    ) : (
                                                        schedule ? (
                                                            <div className="flex flex-col">
                                                                <div className="font-bold text-base truncate font-serif text-emerald-950 print:text-emerald-950">
                                                                    {schedule.active_subject?.mapel?.nama_arab || schedule.active_subject?.mapel?.name}
                                                                </div>
                                                                <div className="text-emerald-700 truncate font-serif text-sm print:text-emerald-800">
                                                                    {schedule.teacher?.nama_arab || schedule.teacher?.name}
                                                                </div>
                                                            </div>
                                                        ) : <span className="text-muted-foreground/50 print:text-emerald-100">-</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Jadwal" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan Jadwal</h2>
                        <p className="text-muted-foreground">Master Management for Academic Schedules.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Auto Generate Button */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (confirm('Jadwal eksisting yang bentrok mungkin akan di-skip. Lanjutkan?')) {
                                router.post(route('settings.master.schedules.generate'));
                            }
                        }}>
                            <Button variant="outline" type="submit">
                                Auto Generate
                            </Button>
                        </form>

                        {/* Trigger Editor */}
                        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editor Jadwal
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Editor Jadwal Harian</DialogTitle>
                                    <DialogDescription>
                                        Atur jadwal per kelas dalam tampilan satu minggu penuh.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-2">
                                    {/* Class Selector */}
                                    <div className="flex items-center gap-4">
                                        <div className="grid gap-1.5 w-full max-w-sm">
                                            <Label>Pilih Kelas</Label>
                                            <Select
                                                value={editorClassId?.toString()}
                                                onValueChange={setEditorClassId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="-- Pilih Kelas --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {activeClasses.map(c => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.kelas?.name} {c.kelas_paralel?.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {editorClass && (
                                            <div className="mt-6 text-sm text-muted-foreground">
                                                Wali Kelas: <span className="font-semibold text-foreground">{editorClass.teacher?.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Grid Input */}
                                    {editorClassId ? (
                                        <div className="border rounded-md overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="p-3 border bg-muted w-16 text-center">Jam</th>
                                                        {activeDays.map(day => (
                                                            <th key={day.id} className="p-3 border bg-muted min-w-[200px]">
                                                                {day.name}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {learningHours.map((hour, index) => {
                                                        const showBreak = hour.hour_number === 4;

                                                        return (
                                                            <>
                                                                {showBreak && (
                                                                    <tr key={`break-${index}`} className="bg-amber-100">
                                                                        <td className="p-2 border font-bold text-center text-amber-800 border-amber-200">
                                                                            -
                                                                        </td>
                                                                        <td colSpan={activeDays.length} className="p-2 border text-center font-bold text-amber-800 border-amber-200 tracking-widest">
                                                                            ISTIRAHAT (SHOLAT & MAKAN)
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                <tr key={hour.id}>
                                                                    <td className="p-2 border text-center font-medium bg-muted/20">
                                                                        {hour.hour_number}
                                                                        <div className="text-[10px] text-muted-foreground font-normal">
                                                                            {/* Time range could be shown here if available */}
                                                                        </div>
                                                                    </td>
                                                                    {activeDays.map(day => {
                                                                        const key = `${day.id}-${hour.id}`;
                                                                        const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;
                                                                        const activeValue = gridData[key] || '';

                                                                        if (isMondayFirstHour) {
                                                                            return (
                                                                                <td key={key} className="p-2 border bg-gray-100/80 text-center italic text-gray-500">
                                                                                    UPACARA / APEL
                                                                                </td>
                                                                            );
                                                                        }

                                                                        // Teacher Info Helper
                                                                        const selectedSubject = editorSubjects.find(s => s.id == activeValue);
                                                                        const teacherName = selectedSubject?.teacher?.name || '-';

                                                                        return (
                                                                            <td key={key} className="p-1 border h-14 align-top">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <select
                                                                                        className="w-full text-xs p-1.5 rounded border border-input bg-background focus:ring-1 focus:ring-primary truncate appearance-none"
                                                                                        value={activeValue}
                                                                                        onChange={(e) => handleGridChange(day.id, hour.id, e.target.value)}
                                                                                        title={selectedSubject?.mapel?.name} // Mobile tooltip
                                                                                    >
                                                                                        <option value="">- Kosong -</option>
                                                                                        {editorSubjects.map(s => (
                                                                                            <option key={s.id} value={s.id}>
                                                                                                {s.mapel?.name}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    {activeValue && (
                                                                                        <div className="px-1 text-[10px] text-muted-foreground truncate" title={teacherName}>
                                                                                            {teacherName}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            </>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                            <Info className="h-12 w-12 opacity-20 mb-4" />
                                            <p className="text-lg font-medium">Silakan pilih kelas terlebih dahulu</p>
                                            <p className="text-sm opacity-70">Jadwal mingguan akan muncul setelah kelas dipilih.</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Batal</Button>
                                        <Button onClick={handleBulkSave} disabled={!editorClassId}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit overflow-x-auto print:hidden">
                    <button
                        onClick={() => setSelectedView('master')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'master' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <LayoutGrid className="w-4 h-4 inline-block mr-2" />
                        Master Grid
                    </button>
                    <button
                        onClick={() => setSelectedView('class')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Per Kelas
                    </button>
                    <button
                        onClick={() => setSelectedView('teacher')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'teacher' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <User className="w-4 h-4 inline-block mr-2" />
                        Per Guru
                    </button>
                    <button
                        onClick={() => setSelectedView('arabic_class')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'arabic_class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <span className="font-serif">ع</span>
                        <span className="ml-2">Arabic View</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-end print:hidden">
                    {(selectedView === 'class' || selectedView === 'arabic_class') && (
                        <div className="w-64">
                            <Label>Pilih Kelas</Label>
                            <Select
                                value={selectedClassId?.toString()}
                                onValueChange={(val) => setSelectedClassId(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Kelas..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeClasses.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.kelas?.name} {c.kelas_paralel?.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {selectedView === 'teacher' && (
                        <div className="w-64">
                            <Label>Pilih Guru</Label>
                            <Select
                                value={selectedTeacherId?.toString()}
                                onValueChange={(val) => setSelectedTeacherId(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Guru..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {selectedView === 'master' && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            {renderMasterGrid()}
                        </div>
                    </div>
                )}

                {selectedView === 'class' && renderClassView()}
                {selectedView === 'teacher' && renderTeacherView()}
                {selectedView === 'arabic_class' && renderArabicClassView()}

            </div>
        </MainLayout>
    );
}
