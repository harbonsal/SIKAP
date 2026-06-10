import MainLayout from '@/Layouts/MainLayout';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Calendar, Users, User, LayoutGrid, Printer, Settings, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/Components/ui/dialog";
import Swal from 'sweetalert2';

// --- Utility: Generate Consistent Color from String ---
const stringToColor = (str) => {
    if (!str) return 'bg-gray-50 border-gray-100 text-gray-500';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Pastel colors palette (Tailwind classes would be better but dynamic is harder, so we use style or predefined list)
    // Let's use a predefined list of pleasant pastel background colors
    const colors = [
        'bg-red-50 border-red-100 text-red-700',
        'bg-orange-50 border-orange-100 text-orange-700',
        'bg-amber-50 border-amber-100 text-amber-700',
        'bg-yellow-50 border-yellow-100 text-yellow-700',
        'bg-lime-50 border-lime-100 text-lime-700',
        'bg-green-50 border-green-100 text-green-700',
        'bg-emerald-50 border-emerald-100 text-emerald-700',
        'bg-teal-50 border-teal-100 text-teal-700',
        'bg-cyan-50 border-cyan-100 text-cyan-700',
        'bg-sky-50 border-sky-100 text-sky-700',
        'bg-blue-50 border-blue-100 text-blue-700',
        'bg-indigo-50 border-indigo-100 text-indigo-700',
        'bg-violet-50 border-violet-100 text-violet-700',
        'bg-purple-50 border-purple-100 text-purple-700',
        'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700',
        'bg-pink-50 border-pink-100 text-pink-700',
        'bg-rose-50 border-rose-100 text-rose-700',
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export default function Index({ schedules, activeClasses, days, activeSlots, activeYear, schoolInfo, learningHours, teachers, initialTab, initialClassId, initialTeacherId }) {
    const { auth } = usePage().props;
    const userRole = auth.user?.user_level?.name;
    const isAdminOrHead = ['Administrator', 'Kepala Sekolah'].includes(userRole);
    const isTeacher = userRole === 'Guru';

    const getDefaultView = () => {
        if (initialTab) return initialTab;
        if (isAdminOrHead) return 'master';
        if (isTeacher) return 'teacher';
        return 'class';
    };

    const [selectedView, setSelectedView] = useState(getDefaultView());
    const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId || (isTeacher ? auth.user.id : ''));
    const [printZoom, setPrintZoom] = useState(100);

    const ARABIC_DAYS = {
        'Senin': 'الإثنين', 'Selasa': 'الثلاثاء', 'Rabu': 'الأربعاء',
        'Kamis': 'الخميس', 'Jumat': 'الجمعة', 'Sabtu': 'السبت', 'Minggu': 'الأحد',
    };

    const handlePrint = () => window.print();

    // Helper for safe ID comparison
    const getScheduleItem = (classId, dayId, hourId) => {
        return schedules.find(s =>
            String(s.active_class_id) === String(classId) &&
            String(s.day_id) === String(dayId) &&
            String(s.learning_hour_id) === String(hourId)
        );
    };

    // --- Header Settings Dialog ---
    const [isHeaderDialogOpen, setIsHeaderDialogOpen] = useState(false);

    // Parse partial configs
    const config = schoolInfo?.header_config || {};

    const { data: headerData, setData: setHeaderData, post: postHeader, processing: processingHeader } = useForm({
        name: schoolInfo?.name || '',
        address: schoolInfo?.address || '',
        title_class: config.title_class || 'JADWAL PELAJARAN',
        title_teacher: config.title_teacher || 'JADWAL MENGAJAR',
        title_arabic: config.title_arabic || 'الجدول الدراسي',
        // New Arabic Settings
        school_name_ar: config.school_name_ar || 'مدرسة التوحيد المتوسطة',
        school_address_ar: config.school_address_ar || 'Jl. Raya Hidayatullah, Sumber Arum, Malang',
    });

    const saveHeader = (e) => {
        e.preventDefault();
        postHeader(route('settings.education.schedules.update-school-info'), {
            data: {
                name: headerData.name,
                address: headerData.address,
                header_config: {
                    title_class: headerData.title_class,
                    title_teacher: headerData.title_teacher,
                    title_arabic: headerData.title_arabic,
                    school_name_ar: headerData.school_name_ar,
                    school_address_ar: headerData.school_address_ar,
                }
            },
            onSuccess: () => {
                setIsHeaderDialogOpen(false);
                Swal.fire('Berhasil', 'Pengaturan header diperbarui.', 'success');
            },
            onError: () => Swal.fire('Gagal', 'Terjadi kesalahan.', 'error'),
        });
    };

    const PrintHeader = ({ overrideTitle, subtitle, isArabic = false }) => {
        const title = overrideTitle || (
            isArabic ? (headerData.title_arabic || 'الجدول الدراسي') :
                selectedView === 'teacher' ? (headerData.title_teacher || 'JADWAL MENGAJAR') :
                    (headerData.title_class || 'JADWAL PELAJARAN')
        );

        // Determine School Name & Address
        const schoolName = isArabic ? (headerData.school_name_ar || 'مدرسة التوحيد المتوسطة') : (headerData.name || 'SMP INTEGRAL AR-ROHMAH');
        const schoolAddress = isArabic ? (headerData.school_address_ar || headerData.address || 'Jl. Raya Hidayatullah, Sumber Arum, Malang') : (headerData.address || 'Jl. Raya Hidayatullah, Sumber Arum, Malang');

        return (
            <div className="hidden print:block mb-4 border-b-2 border-black pb-2 text-black page-break-avoid w-full">
                <div className="flex items-start justify-between mb-2">
                    <div className={`${isArabic ? 'text-right order-2' : 'text-left'}`}>
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900 leading-tight">{schoolName}</h1>
                        <p className="text-sm text-gray-600 font-semibold">{schoolAddress}</p>
                    </div>
                    <div className={`${isArabic ? 'text-left order-1' : 'text-right'}`}>
                        <p className="text-xs font-bold uppercase text-gray-800">{isArabic ? 'العام الدراسي' : 'Tahun Pelajaran'}: {activeYear?.name}</p>
                        <p className="text-xs text-gray-800">{isArabic ? 'الفصل' : 'Semester'}: {activeYear?.semester === 'Ganjil' ? (isArabic ? 'الأول' : 'Ganjil') : (isArabic ? 'الثاني' : 'Genap')}</p>
                    </div>
                </div>
                <div className="text-center">
                    <h2 className={`text-xl font-bold text-white inline-block px-8 py-1.5 rounded-lg shadow-sm ${isArabic ? 'font-serif bg-emerald-600' : 'bg-blue-600'}`}>{title}</h2>
                    {subtitle && <h3 className={`text-base font-bold text-gray-500 mt-1 uppercase tracking-widest ${isArabic ? 'font-serif' : ''}`}>{subtitle}</h3>}
                </div>
                <style>{`
                    @media print {
                        @page { margin: 0.5cm; size: landscape; }
                        body { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            zoom: ${printZoom}%;
                        }
                        .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
                    }
                `}</style>
            </div>
        );
    };

    // Generic Settings Trigger Button
    const SettingsTriggerBtn = () => (
        isAdminOrHead ? (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2 print:hidden"
                title="Pengaturan Header Cetak"
                onClick={() => setIsHeaderDialogOpen(true)}
            >
                <Settings className="h-4 w-4" />
            </Button>
        ) : null
    );

    const ZoomControls = () => (
        <div className="flex items-center gap-2 print:hidden ml-4 bg-muted/50 p-1 rounded">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pl-2">Skala Cetak:</span>
            <input type="range" min="50" max="100" value={printZoom} onChange={(e) => setPrintZoom(e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            <span className="text-xs font-mono w-8">{printZoom}%</span>
        </div>
    );

    // --- RENDER VIEWS ---

    const renderMasterGrid = () => (
        <div className="overflow-x-auto rounded-md border">
            {/* ... content ... */}
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
                    {days.filter(d => d.name !== 'Melanggar' && d.name !== 'Minggu').map(day => (
                        learningHours.map((hour) => {
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
                                            const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number == 1;

                                            if (isMondayFirstHour) {
                                                return <td key={ac.id} className="p-1 border text-center bg-gray-100 text-gray-400 italic">UPACARA / APEL</td>;
                                            }

                                            return (
                                                <td key={ac.id} className="p-1 border text-center h-16 align-top hover:bg-slate-50">
                                                    {schedule ? (
                                                        <div className={`flex flex-col h-full justify-center rounded p-1 ${stringToColor(schedule.active_subject?.mapel?.name)} bg-opacity-30`}>
                                                            <span className="font-bold truncate" title={schedule.active_subject?.mapel?.name}>
                                                                {schedule.active_subject?.mapel?.name}
                                                            </span>
                                                            <span className="text-[10px] opacity-80 truncate" title={schedule.teacher?.name}>
                                                                {schedule.teacher?.name}
                                                            </span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground/20">-</span>}
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

    // --- REFACTORED CLASS VIEW (Single Grid) ---
    const renderClassView = () => {
        const selectedClass = activeClasses.find(c => String(c.id) === String(selectedClassId));
        if (!selectedClassId) return <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">Pilih kelas untuk melihat jadwal.</div>;

        const visibleDays = days.filter(d => d.name !== 'Minggu' && d.name !== 'Melanggar');

        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center print:hidden">
                    <ZoomControls />
                    <SettingsTriggerBtn />
                    <Button variant="outline" className="ml-2" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Cetak Jadwal
                    </Button>
                </div>
                <div className="print:bg-white rounded-md border p-4 bg-card print:border-none print:shadow-none print:p-0">
                    <PrintHeader
                        // Title handled by component logic or overrides
                        subtitle={`${selectedClass?.kelas?.name} ${selectedClass?.kelas_paralel?.name}`}
                    />

                    {/* Compact Grid Table: Rows = Time, Cols = Days */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse table-fixed">
                            <thead>
                                <tr>
                                    <th className="p-3 border bg-muted text-center w-16">Jam</th>
                                    {visibleDays.map(day => (
                                        <th key={day.id} className="p-3 border bg-muted text-center uppercase tracking-wider text-muted-foreground text-xs font-bold">
                                            {day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {learningHours.map((hour, idx) => {
                                    const showBreak = hour.hour_number === 4;
                                    return (
                                        <>
                                            {showBreak && (
                                                <tr key={`break-${idx}`} className="bg-amber-100/50 page-break-avoid">
                                                    <td className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs">-</td>
                                                    <td colSpan={visibleDays.length} className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs tracking-[0.2em]">
                                                        ISTIRAHAT
                                                    </td>
                                                </tr>
                                            )}
                                            <tr key={hour.id} className="hover:bg-slate-50 transition-colors page-break-avoid">
                                                <td className="p-3 border text-center font-bold text-muted-foreground bg-muted/20">
                                                    {hour.hour_number}
                                                </td>
                                                {visibleDays.map(day => {
                                                    const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                                    const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                    if (isMondayFirstHour) {
                                                        return (
                                                            <td key={`${day.id}-${hour.id}`} className="p-2 border text-center bg-gray-50 italic text-muted-foreground text-xs">
                                                                Upacara
                                                            </td>
                                                        );
                                                    }

                                                    const colorClass = schedule ? stringToColor(schedule.active_subject?.mapel?.name) : '';

                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className="p-2 border text-center h-20 align-middle">
                                                            {schedule ? (
                                                                <div className={`flex flex-col items-center justify-center h-full w-full rounded-md border ${colorClass} bg-opacity-40 border-opacity-60 p-1`}>
                                                                    <div className="font-bold text-sm leading-tight text-center">
                                                                        {schedule.active_subject?.mapel?.name}
                                                                    </div>
                                                                    <div className="text-[10px] font-medium uppercase mt-1 truncate w-full text-center opacity-80">
                                                                        {schedule.teacher?.name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/10 text-xl font-light">·</span>
                                                            )}
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
                </div>
            </div>
        );
    };

    // --- REFACTORED ARABIC CLASS VIEW (Single Grid - RTL) ---
    const renderArabicClassView = () => {
        const selectedClass = activeClasses.find(c => String(c.id) === String(selectedClassId));
        if (!selectedClassId) return <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">Pilih kelas untuk melihat jadwal Arab.</div>;

        const visibleDays = days.filter(d => d.name !== 'Minggu' && d.name !== 'Melanggar');

        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center print:hidden">
                    <ZoomControls />
                    <SettingsTriggerBtn />
                    <Button variant="outline" className="ml-2" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Cetak Arab</Button>
                </div>
                <div className="print:bg-white rounded-md border p-6 bg-card print:border-none print:shadow-none print:p-0" dir="rtl">
                    <PrintHeader
                        subtitle={`${selectedClass?.kelas?.name} ${selectedClass?.kelas_paralel?.name}`}
                        isArabic={true}
                    />

                    {/* Compact Grid Table RTL: Rows = Time, Cols = Days */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse table-fixed">
                            <thead>
                                <tr>
                                    <th className="p-3 border bg-muted text-center w-16">الحصة</th>
                                    {visibleDays.map(day => (
                                        <th key={day.id} className="p-3 border bg-muted text-center uppercase tracking-wider text-emerald-900 text-lg font-serif font-bold bg-emerald-50 print:bg-emerald-600 print:text-white">
                                            {ARABIC_DAYS[day.name] || day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {learningHours.map((hour, idx) => {
                                    const showBreak = hour.hour_number === 4;
                                    return (
                                        <>
                                            {showBreak && (
                                                <tr key={`break-${idx}`} className="bg-emerald-50/50 page-break-avoid">
                                                    <td className="p-2 border text-center font-bold text-emerald-900 border-emerald-200 text-xs">-</td>
                                                    <td colSpan={visibleDays.length} className="p-2 border text-center font-bold text-emerald-900 border-emerald-200 text-xs font-serif text-lg">
                                                        استراحة
                                                    </td>
                                                </tr>
                                            )}
                                            <tr key={hour.id} className="hover:bg-emerald-50/20 transition-colors page-break-avoid">
                                                <td className="p-3 border text-center font-bold text-emerald-900 bg-emerald-50/30 font-serif text-lg">
                                                    {hour.hour_number}
                                                </td>
                                                {visibleDays.map(day => {
                                                    const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                                    const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                    if (isMondayFirstHour) {
                                                        return (
                                                            <td key={`${day.id}-${hour.id}`} className="p-2 border text-center bg-gray-50 italic text-emerald-700 font-serif">
                                                                المراسم
                                                            </td>
                                                        );
                                                    }

                                                    // Use English name for color generation consistency, but mapel might be arabic
                                                    // Ideally use ID or consistent slug. Name is fine.
                                                    const colorClass = schedule ? stringToColor(schedule.active_subject?.mapel?.name) : '';

                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className="p-2 border text-center h-20 align-middle">
                                                            {schedule ? (
                                                                <div className={`flex flex-col items-center justify-center h-full w-full rounded-md border ${colorClass} bg-opacity-20 border-opacity-40 p-1`}>
                                                                    <div className="font-bold text-lg leading-tight text-center font-serif">
                                                                        {schedule.active_subject?.mapel?.nama_arab || schedule.active_subject?.mapel?.name}
                                                                    </div>
                                                                    <div className="text-sm font-medium mt-1 truncate w-full text-center font-serif opacity-90">
                                                                        {schedule.teacher?.nama_arab || schedule.teacher?.name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/10 text-xl font-light">·</span>
                                                            )}
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
                </div>
            </div>
        );
    };

    const renderTeacherView = () => {
        if (!selectedTeacherId) return <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">Pilih guru untuk melihat jadwal.</div>;

        // FIX: Strict type comparison for filtering
        const teacherSchedules = schedules.filter(s => String(s.teacher_id) === String(selectedTeacherId));
        const currentTeacher = teachers.find(t => String(t.id) === String(selectedTeacherId));

        // FIX: Ensure strict String comparison for IDs in Sets
        const activeDayIds = new Set(teacherSchedules.map(s => String(s.day_id)));

        // Filter days ensuring comparison as String
        const visibleDays = days.filter(d => activeDayIds.has(String(d.id))).sort((a, b) => a.order - b.order);

        // COMPACT: Filter Learning Hours used by this teacher
        const usedHourIds = new Set();
        teacherSchedules.forEach(s => usedHourIds.add(String(s.learning_hour_id)));

        // Always include Hour 1 if Monday is visible
        const monday = days.find(d => d.name === 'Senin');
        if (monday && activeDayIds.has(String(monday.id))) {
            const h1 = learningHours.find(h => h.hour_number == 1);
            if (h1) usedHourIds.add(String(h1.id));
        }

        const visibleHours = learningHours.filter(h => usedHourIds.has(String(h.id)));

        if (visibleDays.length === 0) {
            return (
                <div className="space-y-4">
                    <div className="text-center p-12 text-muted-foreground bg-amber-50 rounded-lg border border-amber-200">
                        Guru ini belum memiliki jadwal mengajar terdaftar.
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center print:hidden">
                    <ZoomControls />
                    <SettingsTriggerBtn />
                    <Button variant="outline" className="ml-2" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Cetak Jadwal
                    </Button>
                </div>
                <div className="print:bg-white rounded-md border p-6 bg-card print:border-none print:shadow-none print:p-0">
                    <PrintHeader subtitle={`GURU MATA PELAJARAN: ${currentTeacher?.name?.toUpperCase()}`} />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 border bg-muted text-center w-16">Jam</th>
                                    {visibleDays.map(day => (
                                        <th key={day.id} className="p-3 border bg-muted min-w-[150px] text-center uppercase tracking-wider text-muted-foreground text-xs">
                                            {day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleHours.map((hour, idx) => {
                                    const showBreak = hour.hour_number === 4;
                                    return (
                                        <>
                                            {showBreak && (
                                                <tr key={`break-${idx}`} className="bg-amber-100/50 page-break-avoid">
                                                    <td className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs">-</td>
                                                    <td colSpan={visibleDays.length} className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs tracking-[0.2em]">
                                                        ISTIRAHAT
                                                    </td>
                                                </tr>
                                            )}
                                            <tr key={hour.id} className="hover:bg-slate-50 transition-colors page-break-avoid">
                                                <td className="p-3 border text-center font-bold text-muted-foreground bg-muted/20">
                                                    {hour.hour_number}
                                                </td>
                                                {visibleDays.map(day => {
                                                    // FIX: Strict comparison for lookups as well
                                                    const schedule = teacherSchedules.find(s => String(s.day_id) === String(day.id) && String(s.learning_hour_id) === String(hour.id));
                                                    const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                    if (isMondayFirstHour) {
                                                        return (
                                                            <td key={`${day.id}-${hour.id}`} className="p-2 border text-center bg-gray-50 italic text-muted-foreground text-xs">
                                                                Upacara
                                                            </td>
                                                        );
                                                    }

                                                    const colorClass = schedule ? stringToColor(schedule.active_subject?.mapel?.name) : '';

                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className="p-2 border text-center h-16 align-middle">
                                                            {schedule ? (
                                                                <div className={`flex flex-col items-center justify-center rounded-md p-1.5 border h-full w-full ${colorClass} bg-opacity-40 border-opacity-60`}>
                                                                    <div className="font-bold text-sm leading-tight text-center">
                                                                        {schedule.active_class?.kelas?.name} {schedule.active_class?.kelas_paralel?.name}
                                                                    </div>
                                                                    <div className="text-[10px] font-medium uppercase mt-0.5 truncate w-full text-center opacity-80">
                                                                        {schedule.active_subject?.mapel?.name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/10 text-xl font-light">·</span>
                                                            )}
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
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title="Jadwal Pelajaran" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Jadwal Pelajaran</h2>
                        <p className="text-muted-foreground">Lihat jadwal pelajaran akademik.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-muted p-1 rounded-lg w-fit print:hidden">
                    {isAdminOrHead && (
                        <button onClick={() => setSelectedView('master')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'master' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <LayoutGrid className="w-4 h-4 inline-block mr-2" /> Master Grid
                        </button>
                    )}
                    <button onClick={() => setSelectedView('class')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Users className="w-4 h-4 inline-block mr-2" /> Per Kelas
                    </button>
                    <button onClick={() => setSelectedView('teacher')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'teacher' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <User className="w-4 h-4 inline-block mr-2" /> Per Guru
                    </button>
                    <button onClick={() => setSelectedView('arabic_class')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedView === 'arabic_class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <span className="font-serif">ع</span> <span className="ml-2">Arabic View</span>
                    </button>
                </div>

                <div className="flex gap-4 items-end print:hidden">
                    {(selectedView === 'class' || selectedView === 'arabic_class') && (
                        <div className="w-64">
                            <Label>Pilih Kelas</Label>
                            <Select value={selectedClassId?.toString()} onValueChange={setSelectedClassId}>
                                <SelectTrigger><SelectValue placeholder="Pilih Kelas..." /></SelectTrigger>
                                <SelectContent>
                                    {activeClasses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.kelas?.name} {c.kelas_paralel?.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {selectedView === 'teacher' && (
                        <div className="w-64">
                            <Label>Pilih Guru</Label>
                            <Select value={selectedTeacherId?.toString()} onValueChange={setSelectedTeacherId} disabled={isTeacher && !isAdminOrHead}>
                                <SelectTrigger><SelectValue placeholder="Pilih Guru..." /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {selectedView === 'master' && isAdminOrHead && renderMasterGrid()}
                {selectedView === 'class' && renderClassView()}
                {selectedView === 'teacher' && renderTeacherView()}
                {selectedView === 'arabic_class' && renderArabicClassView()}
            </div>

            {/* --- SETTINGS DIALOG (Moved outside to prevent re-renders) --- */}
            {isAdminOrHead && (
                <Dialog open={isHeaderDialogOpen} onOpenChange={setIsHeaderDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Pengaturan Header & Kop</DialogTitle>
                            <DialogDescription>Sesuaikan tampilan kop surat dan judul untuk berbagai format cetak.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={saveHeader} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 border-b pb-2 mb-2">
                                    <h4 className="font-semibold text-sm text-blue-900">1. Identitas Sekolah (Umum)</h4>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Nama Sekolah</Label>
                                    <Input value={headerData.name} onChange={e => setHeaderData('name', e.target.value)} placeholder="Contoh: SMP INTEGRAL AR-ROHMAH" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Alamat Sekolah</Label>
                                    <Input value={headerData.address} onChange={e => setHeaderData('address', e.target.value)} placeholder="Alamat Sekolah..." />
                                </div>

                                <div className="space-y-2 col-span-2 border-b pb-2 mb-2 pt-2">
                                    <h4 className="font-semibold text-sm text-emerald-900">2. Identitas Sekolah (Arab)</h4>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Nama Sekolah (Arab)</Label>
                                    <Input dir="rtl" value={headerData.school_name_ar} onChange={e => setHeaderData('school_name_ar', e.target.value)} placeholder="Default: مدرسة التوحيد المتوسطة" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Alamat Sekolah (Arab/Latin)</Label>
                                    <Input dir="rtl" value={headerData.school_address_ar} onChange={e => setHeaderData('school_address_ar', e.target.value)} placeholder="Default: Jl. Raya Hidayatullah..." />
                                </div>

                                <div className="space-y-2 col-span-2 border-b pb-2 mb-2 pt-2">
                                    <h4 className="font-semibold text-sm text-amber-900">3. Judul / Kop Laporan</h4>
                                </div>
                                <div className="space-y-2">
                                    <Label>Judul Jadwal Kelas</Label>
                                    <Input value={headerData.title_class} onChange={e => setHeaderData('title_class', e.target.value)} placeholder="Default: JADWAL PELAJARAN" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Judul Jadwal Guru</Label>
                                    <Input value={headerData.title_teacher} onChange={e => setHeaderData('title_teacher', e.target.value)} placeholder="Default: JADWAL MENGAJAR" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Judul Jadwal Arab</Label>
                                    <Input dir="rtl" value={headerData.title_arabic} onChange={e => setHeaderData('title_arabic', e.target.value)} placeholder="Default: الجدول الدراسي" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={processingHeader}><Save className="w-4 h-4 mr-2" /> Simpan Pengaturan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

        </MainLayout>
    );
}
