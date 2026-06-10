import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Copy,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Edit,
    FileSpreadsheet,
    GraduationCap,
    Info,
    LayoutGrid,
    ListChecks,
    Download,
    Upload,
    Plus,
    Printer,
    Save,
    Settings,
    Trash2,
    User,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import Swal from 'sweetalert2';

const stringToColor = (str) => {
    if (!str) return 'bg-gray-50 border-gray-100 text-gray-500';

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

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

    return colors[Math.abs(hash) % colors.length];
};

const topTabs = [
    { id: 'schedule', label: 'Jadwal', icon: CalendarDays },
    { id: 'classes', label: 'Kelas Aktif', icon: Users },
    { id: 'subjects', label: 'Mapel Aktif', icon: GraduationCap },
    { id: 'teachers', label: 'Plotting Guru', icon: User },
    { id: 'distribution', label: 'Distribusi', icon: FileSpreadsheet },
    { id: 'unavailable', label: 'Jam Off Guru', icon: Calendar },
    { id: 'time', label: 'Jam & Hari', icon: Clock },
];

export default function Workspace({
    schedules = [],
    activeClasses = [],
    activeYear,
    schoolInfo,
    days = [],
    activeSlots = {},
    learningHours = [],
    teachers = [],
    mapels = [],
    kelasOptions = [],
    kelasParalels = [],
    semesters = [],
    teacherLoadSummaries = [],
    classAnalysis = [],
    summary = {},
    unavailableByTeacher = {},
    systemAcademicYear = null,
    preparationSourceYears = [],
    defaultTab = 'schedule',
    initialScheduleView = 'master',
    initialClassId = null,
    initialTeacherId = null,
    canManageWorkspace = false,
}) {
    const { auth } = usePage().props;
    const permissions = auth.user?.permissions || [];
    const roles = auth.user?.roles || [auth.user?.user_level?.name].filter(Boolean);
    const userRole = auth.user?.user_level?.name;
    const isAdminLike = roles.includes('Administrator') || roles.includes('Kepala Sekolah') || roles.includes('Manager');

    const can = (permission) => isAdminLike || permissions.includes(permission);

    const managementEnabled = canManageWorkspace || can('edit_active_subjects') || can('create_active_subjects') || can('edit_active_classes');
    const allowedTabs = topTabs.filter((tab) => tab.id === 'schedule' || managementEnabled);
    const isPlanningMode = systemAcademicYear && activeYear && String(systemAcademicYear.id) !== String(activeYear.id);

    const firstClassId = activeClasses[0]?.id ? String(activeClasses[0].id) : '';
    const firstTeacherId = teachers[0]?.id ? String(teachers[0].id) : '';

    const getInitialScheduleView = () => {
        if (initialScheduleView) return initialScheduleView;
        if (managementEnabled) return 'master';
        if (userRole === 'Guru') return 'teacher';
        return 'class';
    };

    const [activeTab, setActiveTab] = useState(defaultTab);
    const [selectedScheduleView, setSelectedScheduleView] = useState(getInitialScheduleView());
    const [selectedClassId, setSelectedClassId] = useState(initialClassId ? String(initialClassId) : firstClassId);
    const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId ? String(initialTeacherId) : (userRole === 'Guru' ? String(auth.user.id) : firstTeacherId));
    const [selectedManageClassId, setSelectedManageClassId] = useState(initialClassId ? String(initialClassId) : firstClassId);
    const [selectedSemesterId, setSelectedSemesterId] = useState('annual');
    const [selectedUnavailableTeacherId, setSelectedUnavailableTeacherId] = useState(initialTeacherId ? String(initialTeacherId) : firstTeacherId);
    const [selectedOffSlots, setSelectedOffSlots] = useState(new Set(unavailableByTeacher?.[selectedUnavailableTeacherId] || []));
    const [printZoom, setPrintZoom] = useState(100);
    const [isHeaderDialogOpen, setIsHeaderDialogOpen] = useState(false);
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorClassId, setEditorClassId] = useState(initialClassId ? String(initialClassId) : firstClassId);
    const [gridData, setGridData] = useState({});
    const [subjectDrafts, setSubjectDrafts] = useState([]);
    const [isSubjectsDirty, setIsSubjectsDirty] = useState(false);
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editingTeacherId, setEditingTeacherId] = useState('');
    const [quotaDrafts, setQuotaDrafts] = useState({});
    const [isQuotasDirty, setIsQuotasDirty] = useState(false);
    const [hourModalOpen, setHourModalOpen] = useState(false);
    const [editingHourId, setEditingHourId] = useState(null);
    const [searchTeacherLoad, setSearchTeacherLoad] = useState('');
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [editingClassId, setEditingClassId] = useState(null);
    const [preparationSourceId, setPreparationSourceId] = useState(preparationSourceYears[0]?.id ? String(preparationSourceYears[0].id) : '');
    const [preparingAction, setPreparingAction] = useState(null);
    const [isFetModalOpen, setIsFetModalOpen] = useState(false);
    const [fetUploadFile, setFetUploadFile] = useState(null);

    useEffect(() => {
        setSelectedOffSlots(new Set(unavailableByTeacher?.[selectedUnavailableTeacherId] || []));
    }, [selectedUnavailableTeacherId, unavailableByTeacher]);

    useEffect(() => {
        if (!preparationSourceId && preparationSourceYears[0]?.id) {
            setPreparationSourceId(String(preparationSourceYears[0].id));
        }
    }, [preparationSourceId, preparationSourceYears]);

    const currentManageClass = activeClasses.find((item) => String(item.id) === String(selectedManageClassId));
    const currentScheduleClass = activeClasses.find((item) => String(item.id) === String(selectedClassId));
    const currentTeacher = teachers.find((item) => String(item.id) === String(selectedTeacherId));
    const editorClass = activeClasses.find((item) => String(item.id) === String(editorClassId));
    const manageSubjects = currentManageClass?.active_subjects || [];

    useEffect(() => {
        const sorted = [...manageSubjects].sort((a, b) => (a.mapel?.name || '').localeCompare(b.mapel?.name || ''));
        setSubjectDrafts(sorted);
        setIsSubjectsDirty(false);
    }, [selectedManageClassId, activeClasses]);

    useEffect(() => {
        if (!isEditorOpen || !editorClassId) return;

        const initialGrid = {};
        schedules.forEach((schedule) => {
            if (String(schedule.active_class_id) === String(editorClassId)) {
                initialGrid[`${schedule.day_id}-${schedule.learning_hour_id}`] = String(schedule.active_subject_id);
            }
        });
        setGridData(initialGrid);
    }, [isEditorOpen, editorClassId, schedules]);

    const headerConfig = schoolInfo?.header_config || {};
    const { data: headerData, setData: setHeaderData, post: postHeader, processing: processingHeader } = useForm({
        name: schoolInfo?.name || '',
        address: schoolInfo?.address || '',
        title_class: headerConfig.title_class || 'JADWAL PELAJARAN',
        title_teacher: headerConfig.title_teacher || 'JADWAL MENGAJAR',
        title_arabic: headerConfig.title_arabic || 'الجدول الدراسي',
        school_name_ar: headerConfig.school_name_ar || 'مدرسة التوحيد المتوسطة',
        school_address_ar: headerConfig.school_address_ar || 'Jl. Raya Hidayatullah, Sumber Arum, Malang',
    });

    const scheduleConfig = schoolInfo?.schedule_config || {};
    const { data: configData, setData: setConfigData, post: postConfig, processing: processingConfig } = useForm({
        name: schoolInfo?.name || '',
        address: schoolInfo?.address || '',
        schedule_config: {
            enable_teacher_off: scheduleConfig.enable_teacher_off ?? true,
            max_hours_per_class: scheduleConfig.max_hours_per_class ?? 4,
            max_hours_per_day: scheduleConfig.max_hours_per_day ?? 6,
            allow_split_2_hours: scheduleConfig.allow_split_2_hours ?? false,
            min_days_between: scheduleConfig.min_days_between ?? 1,
            max_gaps_teacher: scheduleConfig.max_gaps_teacher ?? 2,
            weight_teacher_off: scheduleConfig.weight_teacher_off ?? 100,
            weight_min_days_between: scheduleConfig.weight_min_days_between ?? 100,
            weight_max_hours_daily: scheduleConfig.weight_max_hours_daily ?? 100,
            weight_max_gaps_teacher: scheduleConfig.weight_max_gaps_teacher ?? 100,
        },
    });

    const subjectAddForm = useForm({
        active_class_id: selectedManageClassId || '',
        mapel_id: '',
        jam: 1,
    });

    const classForm = useForm({
        academic_year_id: activeYear?.id || '',
        kelas_id: '',
        kelas_paralel_id: '',
        teacher_id: '',
        name: '',
        total_hours_per_week: 35,
        from_workspace: true,
    });

    useEffect(() => {
        subjectAddForm.setData('active_class_id', selectedManageClassId || '');
    }, [selectedManageClassId]);

    const hourForm = useForm({
        hour_number: '',
        start_time: '',
        end_time: '',
    });

    const getScheduleItem = (classId, dayId, hourId) => schedules.find((schedule) =>
        String(schedule.active_class_id) === String(classId)
        && String(schedule.day_id) === String(dayId)
        && String(schedule.learning_hour_id) === String(hourId)
    );

    const isSlotActive = (dayId, hourId) => {
        const slots = activeSlots?.[dayId] || activeSlots?.[String(dayId)] || [];
        return slots.some((slot) => String(slot.learning_hour_id) === String(hourId));
    };

    const runPreparationCopy = (routeName, label) => {
        if (!preparationSourceId) {
            Swal.fire({
                icon: 'warning',
                title: 'Pilih Tahun Sumber',
                text: 'Pilih tahun sumber terlebih dahulu sebelum menyalin data.',
            });
            return;
        }

        Swal.fire({
            icon: 'question',
            title: `${label}?`,
            text: `Data tahun ${activeYear?.name} akan diperbarui dari tahun sumber yang dipilih.`,
            showCancelButton: true,
            confirmButtonText: 'Ya, salin',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (!result.isConfirmed) return;

            setPreparingAction(routeName);
            router.post(route(routeName), {
                source_year_id: preparationSourceId,
            }, {
                preserveScroll: true,
                onFinish: () => setPreparingAction(null),
            });
        });
    };

    const availableMapels = mapels.filter((mapel) => !manageSubjects.some((subject) => String(subject.mapel_id) === String(mapel.id)));
    const visibleDays = days.filter((day) => day.name !== 'Minggu' && day.name !== 'Ahad' && day.name !== 'Melanggar');

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
                },
            },
            onSuccess: () => {
                setIsHeaderDialogOpen(false);
                Swal.fire('Berhasil', 'Pengaturan header diperbarui.', 'success');
            },
            onError: () => Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan header.', 'error'),
        });
    };

    const saveConfig = (e) => {
        e.preventDefault();

        postConfig(route('settings.education.schedules.update-school-info'), {
            onSuccess: () => {
                setIsConfigDialogOpen(false);
                Swal.fire('Berhasil', 'Pengaturan batas jadwal diperbarui.', 'success');
            },
            onError: () => Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan pengaturan.', 'error'),
        });
    };

    const handleGenerate = () => {
        Swal.fire({
            title: 'Generate ulang jadwal?',
            html: `
                <p class="text-sm text-gray-500 mb-4">Sistem akan menyusun jadwal secara otomatis.</p>
                <div class="flex flex-col gap-3 mt-2 text-left">
                    <div class="flex items-start gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                        <input type="radio" id="gen_full" name="gen_mode" value="full" class="mt-0.5 cursor-pointer" checked />
                        <label for="gen_full" class="text-sm cursor-pointer w-full">
                            <strong class="text-gray-800">Generate Total (Rekomendasi)</strong><br/>
                            <span class="text-gray-600/80">Hapus seluruh jadwal saat ini dan buat formasi baru dari awal.</span>
                        </label>
                    </div>
                    <div class="flex items-start gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                        <input type="radio" id="gen_partial" name="gen_mode" value="partial" class="mt-0.5 cursor-pointer" />
                        <label for="gen_partial" class="text-sm cursor-pointer w-full">
                            <strong class="text-gray-700">Pertahankan Jadwal Manual</strong><br/>
                            <span class="text-gray-500">Hanya mengisi slot kosong. Jadwal yang sudah ada tidak akan diubah posisinya.</span>
                        </label>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                return document.getElementById('gen_partial').checked;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const keepExisting = result.value;
                router.post(route('settings.master.schedules.generate'), { keep_existing: keepExisting });
            }
        });
    };

    const handleFetDownload = () => {
        window.location.href = route('settings.master.schedules.download-fet');
    };

    const handleFetUpload = (e) => {
        e.preventDefault();
        if (!fetUploadFile) return;

        const formData = new FormData();
        formData.append('fet_file', fetUploadFile);

        router.post(route('settings.master.schedules.upload-fet'), formData, {
            onSuccess: () => {
                setIsFetModalOpen(false);
                setFetUploadFile(null);
            }
        });
    };

    const handleClear = () => {
        Swal.fire({
            title: 'Kosongkan Seluruh Jadwal?',
            text: 'Tindakan ini akan menghapus semua jadwal yang sudah ada (termasuk yang diatur manual) untuk tahun ajaran ini. Lanjutkan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Kosongkan!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d33',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('settings.master.schedules.clear'));
            }
        });
    };

    const handleClearClassSchedule = () => {
        if (!editorClassId) return;
        Swal.fire({
            target: document.getElementById('schedule-editor-dialog') || document.body,
            title: 'Kosongkan Jadwal Kelas?',
            text: 'Seluruh jadwal untuk kelas ini akan dihapus. Lanjutkan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Kosongkan!',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#d33',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('settings.master.schedules.clear-class', editorClassId), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setGridData({});
                    }
                });
            }
        });
    };

    const handleDeleteSchedule = (id) => {
        Swal.fire({
            title: 'Hapus slot jadwal?',
            text: 'Slot ini akan dikosongkan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('settings.master.schedules.destroy', id), {
                    preserveScroll: true,
                });
            }
        });
    };

    const handleGridChange = (dayId, hourId, subjectId) => {
        setGridData((previous) => ({
            ...previous,
            [`${dayId}-${hourId}`]: subjectId,
        }));
    };

    const handleBulkScheduleSave = () => {
        const payload = [];

        visibleDays.forEach((day) => {
            learningHours.forEach((hour) => {
                const key = `${day.id}-${hour.id}`;
                if (gridData[key] === undefined) return;

                payload.push({
                    day_id: day.id,
                    learning_hour_id: hour.id,
                    active_subject_id: gridData[key],
                });
            });
        });

        router.post(route('settings.master.schedules.bulk-store'), {
            active_class_id: editorClassId,
            schedule_items: payload,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditorOpen(false);
            },
        });
    };

    const handleSubjectHourChange = (id, value) => {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 0) return;

        setSubjectDrafts((previous) => previous.map((subject) => (
            String(subject.id) === String(id) ? { ...subject, jam: parsed } : subject
        )));
        setIsSubjectsDirty(true);
    };

    const handleSubjectSave = () => {
        router.post(route('active-subjects.bulk-update'), {
            subjects: subjectDrafts.map((subject) => ({ id: subject.id, jam: subject.jam })),
        }, {
            preserveScroll: true,
            onSuccess: () => setIsSubjectsDirty(false),
        });
    };

    const handleAddSubject = (e) => {
        e.preventDefault();
        subjectAddForm.post(route('active-subjects.store'), {
            preserveScroll: true,
            onSuccess: () => {
                subjectAddForm.reset('mapel_id', 'jam');
            },
        });
    };

    const handleCopyMapel = () => {
        if (!selectedManageClassId) return;
        
        let optionsHtml = '<option value="">-- Pilih Kelas Sumber --</option>';
        activeClasses.forEach(c => {
            if (String(c.id) !== String(selectedManageClassId)) {
                const className = c.kelas?.name + (c.kelas_paralel ? ' ' + c.kelas_paralel.name : '');
                optionsHtml += `<option value="${c.id}">${className}</option>`;
            }
        });

        Swal.fire({
            title: 'Salin Mapel dari Kelas Lain',
            html: `
                <p class="text-sm text-gray-500 mb-4" style="text-align: left;">Pilih kelas sumber untuk menyalin seluruh mapel dan jam pelajaran beserta gurunya.</p>
                <select id="source_class_id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                    ${optionsHtml}
                </select>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Salin',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const sourceId = document.getElementById('source_class_id').value;
                if (!sourceId) {
                    Swal.showValidationMessage('Silakan pilih kelas sumber');
                    return false;
                }
                return sourceId;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const sourceId = result.value;
                router.post(route('active-subjects.copy', selectedManageClassId), {
                    source_class_id: sourceId
                }, {
                    preserveScroll: true,
                });
            }
        });
    };

    const handleRemoveSubject = (subjectId) => {
        Swal.fire({
            title: 'Hapus mapel aktif?',
            text: 'Mapel ini akan dihapus dari kelas paralel terkait.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('active-subjects.destroy', subjectId), {
                    preserveScroll: true,
                });
            }
        });
    };

    const getTeacherAssignment = (subject) => {
        if (selectedSemesterId === 'annual') {
            return {
                teacher: subject?.teacher || null,
                isInherited: false,
                isOverride: false,
            };
        }

        const override = subject?.semester_subject_teachers?.find(
            (item) => String(item.semester_id) === String(selectedSemesterId),
        );

        if (override?.teacher) {
            return {
                teacher: override.teacher,
                isInherited: false,
                isOverride: true,
            };
        }

        return {
            teacher: subject?.teacher || null,
            isInherited: true,
            isOverride: false,
        };
    };

    const startTeacherEdit = (subject) => {
        const current = getTeacherAssignment(subject);
        setEditingSubjectId(subject.id);
        setEditingTeacherId(current.teacher?.id ? String(current.teacher.id) : '');
    };

    const saveTeacherEdit = (subjectId) => {
        const payload = { teacher_id: editingTeacherId };
        if (selectedSemesterId !== 'annual') {
            payload.semester_id = selectedSemesterId;
        }

        router.put(route('subject-teachers.update', subjectId), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingSubjectId(null);
                setEditingTeacherId('');
            },
        });
    };

    const handleQuotaChange = (teacherId, value) => {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 0) return;
        
        setQuotaDrafts(prev => ({ ...prev, [teacherId]: parsed }));
        setIsQuotasDirty(true);
    };

    const handleSaveQuotas = () => {
        router.post(route('teaching-distribution.bulk-update-quota'), {
            quotas: quotaDrafts,
            from_workspace: true,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsQuotasDirty(false);
                setQuotaDrafts({});
                Swal.fire('Berhasil', 'Kuota guru berhasil disimpan.', 'success');
            },
        });
    };

    const toggleOffSlot = (dayId, hourId) => {
        const key = `${dayId}-${hourId}`;
        const next = new Set(selectedOffSlots);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        setSelectedOffSlots(next);
    };

    const toggleOffDay = (dayId) => {
        const dayKeys = learningHours.map((hour) => `${dayId}-${hour.id}`);
        const next = new Set(selectedOffSlots);
        const allSelected = dayKeys.every((item) => next.has(item));

        dayKeys.forEach((item) => {
            if (allSelected) {
                next.delete(item);
            } else {
                next.add(item);
            }
        });

        setSelectedOffSlots(next);
    };

    const saveTeacherOff = () => {
        if (!selectedUnavailableTeacherId) return;

        router.post(route('settings.teacher.unavailable.update'), {
            user_id: selectedUnavailableTeacherId,
            unavailable_slots: Array.from(selectedOffSlots),
            from_workspace: true,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire('Berhasil', 'Jam off guru berhasil disimpan.', 'success');
            },
            onError: (errors) => {
                console.error(errors);
                Swal.fire('Error', 'Gagal menyimpan jam off guru.', 'error');
            }
        });
    };

    const openHourModal = (hour = null) => {
        if (hour) {
            setEditingHourId(hour.id);
            hourForm.setData({
                hour_number: hour.hour_number,
                start_time: hour.start_time?.substring(0, 5) || '',
                end_time: hour.end_time?.substring(0, 5) || '',
            });
        } else {
            setEditingHourId(null);
            const nextHour = learningHours.length > 0
                ? Math.max(...learningHours.map((item) => item.hour_number)) + 1
                : 1;
            hourForm.setData({
                hour_number: nextHour,
                start_time: '',
                end_time: '',
            });
        }
        setHourModalOpen(true);
    };

    const submitHour = (e) => {
        e.preventDefault();

        if (editingHourId) {
            hourForm.put(route('learning-hours.update', editingHourId), {
                preserveScroll: true,
                onSuccess: () => {
                    setHourModalOpen(false);
                    setEditingHourId(null);
                },
            });
            return;
        }

        hourForm.post(route('learning-hours.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setHourModalOpen(false);
                setEditingHourId(null);
            },
        });
    };

    const deleteHour = (hourId) => {
        Swal.fire({
            title: 'Hapus jam pelajaran?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('learning-hours.destroy', hourId), {
                    preserveScroll: true,
                });
            }
        });
    };

    const updateDay = (day, field, value) => {
        router.put(route('days.update', day.id), {
            total_hours: field === 'total_hours' ? value : day.total_hours,
            is_active: field === 'is_active' ? value : day.is_active,
        }, {
            preserveScroll: true,
        });
    };

    const deleteActiveClass = (id) => {
        Swal.fire({
            title: 'Hapus kelas aktif?',
            text: 'Data kelas aktif akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Hapus',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('active-classes.destroy', id), {
                    preserveScroll: true,
                });
            }
        });
    };

    const openClassModal = (activeClass = null) => {
        if (activeClass) {
            setEditingClassId(activeClass.id);
            classForm.setData({
                academic_year_id: activeClass.academic_year_id || activeYear?.id || '',
                kelas_id: activeClass.kelas_id || '',
                kelas_paralel_id: activeClass.kelas_paralel_id || '',
                teacher_id: activeClass.teacher_id || '',
                name: activeClass.name || '',
                total_hours_per_week: activeClass.total_hours_per_week || 35,
                from_workspace: true,
            });
        } else {
            setEditingClassId(null);
            classForm.setData({
                academic_year_id: activeYear?.id || '',
                kelas_id: '',
                kelas_paralel_id: '',
                teacher_id: '',
                name: '',
                total_hours_per_week: 35,
                from_workspace: true,
            });
        }

        setClassModalOpen(true);
    };

    const submitClassForm = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setClassModalOpen(false);
                setEditingClassId(null);
            },
        };

        if (editingClassId) {
            classForm.put(route('active-classes.update', editingClassId), options);
            return;
        }

        classForm.post(route('active-classes.store'), options);
    };

    const PrintHeader = ({ overrideTitle, subtitle, isArabic = false }) => {
        const title = overrideTitle || (
            isArabic
                ? (headerData.title_arabic || 'الجدول الدراسي')
                : selectedScheduleView === 'teacher'
                    ? (headerData.title_teacher || 'JADWAL MENGAJAR')
                    : (headerData.title_class || 'JADWAL PELAJARAN')
        );

        const schoolName = isArabic
            ? (headerData.school_name_ar || 'مدرسة التوحيد المتوسطة')
            : (headerData.name || 'SMP INTEGRAL AR-ROHMAH');
        const schoolAddress = isArabic
            ? (headerData.school_address_ar || headerData.address || 'Jl. Raya Hidayatullah, Sumber Arum, Malang')
            : (headerData.address || 'Jl. Raya Hidayatullah, Sumber Arum, Malang');

        return (
            <div className="hidden print:block mb-4 border-b-2 border-black pb-2 text-black page-break-avoid w-full">
                <div className="flex items-start justify-between mb-2">
                    <div className={isArabic ? 'text-right order-2' : 'text-left'}>
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-blue-900 leading-tight">{schoolName}</h1>
                        <p className="text-sm text-gray-600 font-semibold">{schoolAddress}</p>
                    </div>
                    <div className={isArabic ? 'text-left order-1' : 'text-right'}>
                        <p className="text-xs font-bold uppercase text-gray-800">{isArabic ? 'العام الدراسي' : 'Tahun Pelajaran'}: {activeYear?.name}</p>
                        <p className="text-xs text-gray-800">{isArabic ? 'الفصل' : 'Semester'}: {activeYear?.semester}</p>
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

    const renderScheduleMasterGrid = () => (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 border bg-muted font-medium sticky left-0 z-10 w-24">Waktu</th>
                        {activeClasses.map((activeClass) => (
                            <th key={activeClass.id} className="p-2 border bg-muted font-medium min-w-[120px]">
                                {activeClass.kelas?.name} {activeClass.kelas_paralel?.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visibleDays.map((day) => (
                        learningHours.map((hour) => {
                            const showBreak = hour.hour_number === 4;

                            return (
                                <FragmentRow key={`${day.id}-${hour.id}`}>
                                    {showBreak && (
                                        <tr className="bg-amber-100/50">
                                            <td colSpan={1 + activeClasses.length} className="p-1 text-center font-bold text-amber-700 text-[10px] tracking-widest border">
                                                ISTIRAHAT
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="p-2 border bg-muted/20 font-medium sticky left-0 z-10">
                                            <div className="flex flex-col">
                                                <span>{day.name}</span>
                                                <span className="text-[10px] text-muted-foreground">Jam ke-{hour.hour_number}</span>
                                            </div>
                                        </td>
                                        {activeClasses.map((activeClass) => {
                                            const schedule = getScheduleItem(activeClass.id, day.id, hour.id);
                                            const isMondayFirstHour = day.name.trim().toLowerCase() === 'senin' && hour.hour_number === 1;

                                            if (isMondayFirstHour) {
                                                return (
                                                    <td key={activeClass.id} className="p-1 border text-center bg-gray-100 text-gray-400 italic">
                                                        UPACARA / APEL
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={activeClass.id} className="p-1 border text-center h-16 align-top hover:bg-slate-50 relative">
                                                    {schedule ? (
                                                        <div className={`flex flex-col h-full justify-center rounded p-1 relative ${stringToColor(schedule.active_subject?.mapel?.name)}`}>
                                                            {schedules.some(s => s.id !== schedule.id && s.teacher_id === schedule.teacher_id && s.day_id === schedule.day_id && s.learning_hour_id === schedule.learning_hour_id) && (
                                                                <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded shadow-sm z-10" title="Kelas Gabungan">GABUNGAN</div>
                                                            )}
                                                            <span className="font-bold truncate">{schedule.active_subject?.mapel?.name}</span>
                                                            <span className="text-[10px] opacity-80 truncate">{schedule.teacher?.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground/20">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </FragmentRow>
                            );
                        })
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderScheduleClassView = (arabic = false) => {
        if (!selectedClassId) {
            return <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">Pilih kelas untuk melihat jadwal.</div>;
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center print:hidden gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pl-2">Skala Cetak:</span>
                        <input type="range" min="50" max="100" value={printZoom} onChange={(e) => setPrintZoom(e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs font-mono w-8">{printZoom}%</span>
                    </div>
                    {managementEnabled && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Pengaturan Header Cetak" onClick={() => setIsHeaderDialogOpen(true)}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Cetak Jadwal
                    </Button>
                </div>
                <div className="print:bg-white rounded-md border p-4 bg-card print:border-none print:shadow-none print:p-0">
                    <PrintHeader
                        isArabic={arabic}
                        subtitle={`${currentScheduleClass?.kelas?.name || ''} ${currentScheduleClass?.kelas_paralel?.name || ''}`.trim()}
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse table-fixed">
                            <thead>
                                <tr>
                                    <th className="p-3 border bg-muted text-center w-16">Jam</th>
                                    {visibleDays.map((day) => (
                                        <th key={day.id} className="p-3 border bg-muted text-center uppercase tracking-wider text-muted-foreground text-xs font-bold">
                                            {arabic ? (day.nama_arab || day.name) : day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {learningHours.map((hour, index) => {
                                    const showBreak = hour.hour_number === 4;

                                    return (
                                        <FragmentRow key={hour.id}>
                                            {showBreak && (
                                                <tr className="bg-amber-100/50 page-break-avoid">
                                                    <td className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs">-</td>
                                                    <td colSpan={visibleDays.length} className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs tracking-[0.2em]">
                                                        ISTIRAHAT
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="hover:bg-slate-50 transition-colors page-break-avoid">
                                                <td className="p-3 border text-center font-bold text-muted-foreground bg-muted/20">{hour.hour_number}</td>
                                                {visibleDays.map((day) => {
                                                    const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                                    const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                    if (isMondayFirstHour) {
                                                        return (
                                                            <td key={`${day.id}-${hour.id}`} className="p-2 border text-center bg-gray-50 italic text-muted-foreground text-xs">
                                                                Upacara
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className="p-2 border text-center h-20 align-middle relative">
                                                            {schedule ? (
                                                                <div className={`flex flex-col items-center justify-center rounded-md p-1.5 border h-full w-full relative ${stringToColor(schedule.active_subject?.mapel?.name)}`}>
                                                                    {schedules.some(s => s.id !== schedule.id && s.teacher_id === schedule.teacher_id && s.day_id === schedule.day_id && s.learning_hour_id === schedule.learning_hour_id) && (
                                                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-bl-md rounded-tr-md shadow-sm z-10" title="Kelas Gabungan">GABUNGAN</div>
                                                                    )}
                                                                    <div className={`font-bold leading-tight text-center ${arabic ? 'text-lg font-serif' : 'text-sm'}`}>
                                                                        {arabic ? (schedule.active_subject?.mapel?.nama_arab || schedule.active_subject?.mapel?.name) : schedule.active_subject?.mapel?.name}
                                                                    </div>
                                                                    <div className={`mt-1 truncate w-full text-center opacity-80 ${arabic ? 'text-sm font-serif' : 'text-[10px] font-medium uppercase'}`}>
                                                                        {arabic ? (schedule.teacher?.nama_arab || schedule.teacher?.name) : schedule.teacher?.name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/10 text-xl font-light">·</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </FragmentRow>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderScheduleTeacherView = () => {
        if (!selectedTeacherId) {
            return <div className="text-center p-8 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">Pilih guru untuk melihat jadwal.</div>;
        }

        const teacherSchedules = schedules.filter((schedule) => String(schedule.teacher_id) === String(selectedTeacherId));
        const activeDayIds = new Set(teacherSchedules.map((schedule) => String(schedule.day_id)));
        const daysForTeacher = visibleDays.filter((day) => activeDayIds.has(String(day.id))).sort((a, b) => a.order - b.order);

        const usedHourIds = new Set();
        teacherSchedules.forEach((schedule) => usedHourIds.add(String(schedule.learning_hour_id)));

        const monday = days.find((day) => day.name === 'Senin');
        if (monday && activeDayIds.has(String(monday.id))) {
            const hourOne = learningHours.find((hour) => hour.hour_number === 1);
            if (hourOne) {
                usedHourIds.add(String(hourOne.id));
            }
        }

        const hoursForTeacher = learningHours.filter((hour) => usedHourIds.has(String(hour.id)));

        if (daysForTeacher.length === 0) {
            return <div className="text-center p-12 text-muted-foreground bg-amber-50 rounded-lg border border-amber-200">Guru ini belum memiliki jadwal mengajar terdaftar.</div>;
        }

        return (
            <div className="space-y-4">
                <div className="flex justify-end items-center print:hidden gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pl-2">Skala Cetak:</span>
                        <input type="range" min="50" max="100" value={printZoom} onChange={(e) => setPrintZoom(e.target.value)} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs font-mono w-8">{printZoom}%</span>
                    </div>
                    {managementEnabled && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Pengaturan Header Cetak" onClick={() => setIsHeaderDialogOpen(true)}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Cetak Jadwal
                    </Button>
                </div>
                <div className="print:bg-white rounded-md border p-6 bg-card print:border-none print:shadow-none print:p-0">
                    <PrintHeader subtitle={`GURU MATA PELAJARAN: ${currentTeacher?.name?.toUpperCase() || '-'}`} />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 border bg-muted text-center w-16">Jam</th>
                                    {daysForTeacher.map((day) => (
                                        <th key={day.id} className="p-3 border bg-muted min-w-[150px] text-center uppercase tracking-wider text-muted-foreground text-xs">
                                            {day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {hoursForTeacher.map((hour, index) => {
                                    const showBreak = hour.hour_number === 4;

                                    return (
                                        <FragmentRow key={hour.id}>
                                            {showBreak && (
                                                <tr className="bg-amber-100/50 page-break-avoid">
                                                    <td className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs">-</td>
                                                    <td colSpan={daysForTeacher.length} className="p-2 border text-center font-bold text-amber-900 border-amber-200 text-xs tracking-[0.2em]">
                                                        ISTIRAHAT
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="hover:bg-slate-50 transition-colors page-break-avoid">
                                                <td className="p-3 border text-center font-bold text-muted-foreground bg-muted/20">{hour.hour_number}</td>
                                                {daysForTeacher.map((day) => {
                                                    const schedule = teacherSchedules.find((item) => String(item.day_id) === String(day.id) && String(item.learning_hour_id) === String(hour.id));
                                                    const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                    if (isMondayFirstHour) {
                                                        return (
                                                            <td key={`${day.id}-${hour.id}`} className="p-2 border text-center bg-gray-50 italic text-muted-foreground text-xs">
                                                                Upacara
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className="p-2 border text-center h-16 align-middle relative">
                                                            {schedule ? (
                                                                <div className={`flex flex-col items-center justify-center rounded-md p-1.5 border h-full w-full relative ${stringToColor(schedule.active_subject?.mapel?.name)}`}>
                                                                    {schedules.some(s => s.id !== schedule.id && s.teacher_id === schedule.teacher_id && s.day_id === schedule.day_id && s.learning_hour_id === schedule.learning_hour_id) && (
                                                                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1 rounded-bl-md rounded-tr-md shadow-sm z-10" title="Kelas Gabungan">GABUNGAN</div>
                                                                    )}
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
                                        </FragmentRow>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const filteredTeacherLoads = teacherLoadSummaries.filter((teacher) => {
        if (!searchTeacherLoad.trim()) return true;

        const search = searchTeacherLoad.toLowerCase();
        return teacher.name?.toLowerCase().includes(search)
            || teacher.nomor_induk?.toLowerCase?.().includes(search)
            || teacher.user_level?.name?.toLowerCase().includes(search);
    });

    return (
        <MainLayout>
            <Head title={managementEnabled ? 'Pusat Pengaturan Jadwal' : 'Jadwal Pelajaran'} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {managementEnabled ? 'Pusat Jadwal & KBM' : 'Jadwal Pelajaran'}
                        </h2>
                        <p className="text-muted-foreground">
                            {managementEnabled
                                ? 'Seluruh pengaturan jadwal, kelas aktif, mapel, plotting guru, beban mengajar, dan jam belajar dikumpulkan di satu workspace.'
                                : 'Lihat jadwal pelajaran akademik yang tersedia.'}
                        </p>
                    </div>
                    {managementEnabled && (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => { setEditorClassId(selectedManageClassId || firstClassId); setIsEditorOpen(true); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editor Jadwal
                            </Button>
                            <Button variant="outline" onClick={() => setIsConfigDialogOpen(true)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Pengaturan Generator
                            </Button>
                            <Button variant="outline" onClick={handleGenerate}>
                                <ListChecks className="w-4 h-4 mr-2" />
                                Auto Generate (PHP)
                            </Button>
                            <Button variant="outline" className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200" onClick={() => setIsFetModalOpen(true)}>
                                <ListChecks className="w-4 h-4 mr-2" />
                                Auto Generate (FET)
                            </Button>
                            <Button variant="outline" onClick={() => window.open('/diagnostic.php', '_blank')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Log Diagnostik
                            </Button>
                            <Button variant="destructive" onClick={handleClear}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Kosongkan Jadwal
                            </Button>
                        </div>
                    )}
                </div>

                {managementEnabled && (
                    <div className={`rounded-2xl border p-4 md:p-5 ${isPlanningMode ? 'border-amber-300 bg-amber-50/70' : 'border-blue-200 bg-blue-50/60'}`}>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-foreground">
                                    Konteks kerja: {activeYear?.name}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {isPlanningMode
                                        ? `Anda sedang menyiapkan ${activeYear?.name}. Operasional sekolah tetap memakai tahun aktif ${systemAcademicYear?.name || '-'} sampai nanti diaktifkan secara global.`
                                        : 'Anda sedang membuka tahun aktif sistem. Gunakan switcher tahun di header bila ingin menyiapkan tahun berikutnya.'}
                                </p>
                            </div>

                            {preparationSourceYears.length > 0 && (
                                <div className="flex flex-col gap-3 xl:min-w-[620px]">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="sm:w-64">
                                            <Label>Tahun Sumber</Label>
                                            <select
                                                value={preparationSourceId}
                                                onChange={(e) => setPreparationSourceId(e.target.value)}
                                                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="">Pilih Tahun Sumber</option>
                                                {preparationSourceYears.map((year) => (
                                                    <option key={year.id} value={year.id}>
                                                        {year.name}{year.is_active ? ' (Aktif Sistem)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-muted-foreground sm:max-w-xs">
                                            Salin data dasar untuk mempercepat persiapan, lalu lanjutkan penyesuaian manual seperlunya.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-classes', 'Salin kelas aktif')}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Kelas
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-subjects', 'Salin mapel dan plotting guru')}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Mapel & Plotting
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!preparationSourceId || preparingAction !== null}
                                            onClick={() => runPreparationCopy('settings.education.schedules.copy-teacher-settings', 'Salin kuota dan jam off guru')}
                                        >
                                            <Copy className="w-4 h-4 mr-2" />
                                            Salin Kuota & Jam Off
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 bg-muted p-1 rounded-lg w-fit">
                    {allowedTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon className="w-4 h-4 inline-block mr-2" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-2 bg-muted p-1 rounded-lg w-fit">
                            {(managementEnabled || isAdminLike) && (
                                <button onClick={() => setSelectedScheduleView('master')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedScheduleView === 'master' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <LayoutGrid className="w-4 h-4 inline-block mr-2" /> Master Grid
                                </button>
                            )}
                            <button onClick={() => setSelectedScheduleView('class')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedScheduleView === 'class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Users className="w-4 h-4 inline-block mr-2" /> Per Kelas
                            </button>
                            <button onClick={() => setSelectedScheduleView('teacher')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedScheduleView === 'teacher' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                <User className="w-4 h-4 inline-block mr-2" /> Per Guru
                            </button>
                            <button onClick={() => setSelectedScheduleView('arabic_class')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${selectedScheduleView === 'arabic_class' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                <span className="font-serif">ع</span> <span className="ml-2">Arabic View</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-4 items-end">
                            {(selectedScheduleView === 'class' || selectedScheduleView === 'arabic_class') && (
                                <div className="w-64">
                                    <Label>Pilih Kelas</Label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {activeClasses.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.kelas?.name} {item.kelas_paralel?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {selectedScheduleView === 'teacher' && (
                                <div className="w-64">
                                    <Label>Pilih Guru</Label>
                                    <select
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Pilih Guru</option>
                                        {teachers.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {selectedScheduleView === 'master' && (managementEnabled || isAdminLike) && renderScheduleMasterGrid()}
                        {selectedScheduleView === 'class' && renderScheduleClassView(false)}
                        {selectedScheduleView === 'teacher' && renderScheduleTeacherView()}
                        {selectedScheduleView === 'arabic_class' && renderScheduleClassView(true)}
                    </div>
                )}

                {activeTab === 'classes' && managementEnabled && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">Kelas Aktif</h3>
                                <p className="text-sm text-muted-foreground">Kelola rombel yang digunakan sebagai dasar jadwal tahun {activeYear?.name}.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => openClassModal()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Kelas
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-xl border bg-card">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Kelas</th>
                                        <th className="px-4 py-3 text-left font-medium">Wali Kelas</th>
                                        <th className="px-4 py-3 text-center font-medium">Jam/Pekan</th>
                                        <th className="px-4 py-3 text-center font-medium">Anggota</th>
                                        <th className="px-4 py-3 text-center font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {activeClasses.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold">{item.kelas?.name} {item.kelas_paralel?.name}</div>
                                                {item.name && <div className="text-xs text-muted-foreground">{item.name}</div>}
                                            </td>
                                            <td className="px-4 py-3">{item.teacher?.name || '-'}</td>
                                            <td className="px-4 py-3 text-center font-mono">{item.total_hours_per_week || 0}</td>
                                            <td className="px-4 py-3 text-center">{item.class_members_count || 0}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedManageClassId(String(item.id));
                                                            setActiveTab('subjects');
                                                        }}
                                                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        Mapel
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedManageClassId(String(item.id));
                                                            setActiveTab('teachers');
                                                        }}
                                                        className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        Guru
                                                    </button>
                                                    <Link href={route('class-members.show', item.id)} className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                                                        Anggota
                                                    </Link>
                                                    <button onClick={() => openClassModal(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteActiveClass(item.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'subjects' && managementEnabled && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="w-full max-w-sm">
                                <Label>Pilih Kelas</Label>
                                <select value={selectedManageClassId} onChange={(e) => setSelectedManageClassId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {activeClasses.map((item) => (
                                        <option key={item.id} value={item.id}>{item.kelas?.name} {item.kelas_paralel?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Target jam pekanan: <span className="font-semibold text-foreground">{currentManageClass?.total_hours_per_week || 0}</span>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                            <div className="rounded-xl border bg-card overflow-hidden">
                                <div className="border-b px-4 py-3">
                                    <h3 className="font-semibold">Mapel Aktif Kelas {currentManageClass?.kelas?.name} {currentManageClass?.kelas_paralel?.name}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Mata Pelajaran</th>
                                                <th className="px-4 py-3 text-center font-medium w-28">Jam</th>
                                                <th className="px-4 py-3 text-center font-medium w-24">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {subjectDrafts.length > 0 ? subjectDrafts.map((subject) => (
                                                <tr key={subject.id}>
                                                    <td className="px-4 py-3 font-medium">{subject.mapel?.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={subject.jam}
                                                            onChange={(e) => handleSubjectHourChange(subject.id, e.target.value)}
                                                            className="w-20 rounded-md border px-2 py-1 text-center"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button onClick={() => handleRemoveSubject(subject.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-600 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Belum ada mapel aktif.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {isSubjectsDirty && (
                                    <div className="border-t px-4 py-3 flex justify-end">
                                        <Button onClick={handleSubjectSave}>
                                            <Save className="w-4 h-4 mr-2" />
                                            Simpan Perubahan Jam
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border bg-card p-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold">Tambah Mapel</h3>
                                    <p className="text-sm text-muted-foreground">Penambahan akan diterapkan ke kelas paralel terkait.</p>
                                </div>
                                <form onSubmit={handleAddSubject} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Mata Pelajaran</Label>
                                        <select
                                            value={subjectAddForm.data.mapel_id}
                                            onChange={(e) => subjectAddForm.setData('mapel_id', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">Pilih Mapel</option>
                                            {availableMapels.map((mapel) => (
                                                <option key={mapel.id} value={mapel.id}>{mapel.name}</option>
                                            ))}
                                        </select>
                                        {subjectAddForm.errors.mapel_id && <p className="text-sm text-destructive">{subjectAddForm.errors.mapel_id}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jam/Pekan</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={subjectAddForm.data.jam}
                                            onChange={(e) => subjectAddForm.setData('jam', e.target.value)}
                                        />
                                        {subjectAddForm.errors.jam && <p className="text-sm text-destructive">{subjectAddForm.errors.jam}</p>}
                                    </div>
                                    <Button type="submit" className="w-full" disabled={!subjectAddForm.data.mapel_id || subjectAddForm.processing}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah Mapel
                                    </Button>
                                </form>

                                <div className="pt-2">
                                    <Button type="button" variant="outline" className="w-full border-dashed" onClick={handleCopyMapel}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Salin dari Kelas Lain
                                    </Button>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="text-sm text-muted-foreground">Total jam mapel saat ini</div>
                                    <div className="text-2xl font-bold text-foreground">{subjectDrafts.reduce((total, subject) => total + (parseInt(subject.jam, 10) || 0), 0)} Jam</div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Target kelas: {currentManageClass?.total_hours_per_week || 0} Jam
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'teachers' && managementEnabled && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4 items-end justify-between">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="w-full max-w-sm">
                                    <Label>Pilih Kelas</Label>
                                    <select value={selectedManageClassId} onChange={(e) => setSelectedManageClassId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {activeClasses.map((item) => (
                                            <option key={item.id} value={item.id}>{item.kelas?.name} {item.kelas_paralel?.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full max-w-sm">
                                    <Label>Mode Plotting</Label>
                                    <select disabled={isPlanningMode} value={selectedSemesterId} onChange={(e) => setSelectedSemesterId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                                        <option value="annual">Tahunan (Default)</option>
                                        {!isPlanningMode && semesters.map((semester) => (
                                            <option key={semester.id} value={semester.id}>Semester {semester.name}</option>
                                        ))}
                                    </select>
                                    {isPlanningMode && (
                                        <p className="text-[10px] text-amber-600 mt-1 font-medium">Semester dikunci. Susun data dasar di mode Tahunan.</p>
                                    )}
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => window.open(route('daftar-pengajar.index'), '_blank')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Rincian Jam Mengajar Tiap Guru
                            </Button>
                        </div>
                        {selectedSemesterId !== 'annual' && (
                            <div className="rounded-md bg-blue-50 p-4 border border-blue-200 text-sm text-blue-800">
                                Jika guru semester dikosongkan, sistem akan memakai guru tahunan sebagai default.
                            </div>
                        )}

                        <div className="rounded-xl border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Mapel</th>
                                        <th className="px-4 py-3 text-center font-medium w-24">Jam</th>
                                        <th className="px-4 py-3 text-left font-medium">Guru Pengampu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {manageSubjects.length > 0 ? manageSubjects.map((subject) => {
                                        const assignment = getTeacherAssignment(subject);
                                        return (
                                            <tr key={subject.id}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{subject.mapel?.name}</div>
                                                    {assignment.isOverride && <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Khusus semester ini</div>}
                                                </td>
                                                <td className="px-4 py-3 text-center">{subject.jam}</td>
                                                <td className="px-4 py-3">
                                                    {editingSubjectId === subject.id ? (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <select value={editingTeacherId} onChange={(e) => setEditingTeacherId(e.target.value)} className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                                <option value="">{selectedSemesterId === 'annual' ? 'Pilih Guru' : '(Gunakan Guru Tahunan)'}</option>
                                                                {teachers.map((teacher) => (
                                                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                                                ))}
                                                            </select>
                                                            <button onClick={() => saveTeacherEdit(subject.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-green-600 hover:bg-green-50">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => { setEditingSubjectId(null); setEditingTeacherId(''); }} className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-red-600 hover:bg-red-50">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div>
                                                                <div className={`font-medium ${assignment.isInherited ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                                    {assignment.teacher?.name || 'Belum ditentukan'}
                                                                </div>
                                                                {assignment.isInherited && selectedSemesterId !== 'annual' && (
                                                                    <div className="text-[10px] italic text-muted-foreground">Mengikuti guru tahunan</div>
                                                                )}
                                                            </div>
                                                            <button onClick={() => startTeacherEdit(subject)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Belum ada mapel untuk diplotkan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'distribution' && managementEnabled && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold tracking-tight">Ringkasan Distribusi Beban Mengajar</h2>
                            <Button variant="outline" onClick={() => window.open(route('daftar-pengajar.index'), '_blank')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Rincian Jam Mengajar Tiap Guru
                            </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <MetricCard label="Total Kelas" value={summary.total_classes || 0} color="blue" />
                            <MetricCard label="Kelas Kurang Jam" value={summary.incomplete_hours_count || 0} color="amber" />
                            <MetricCard label="Mapel Tanpa Guru" value={summary.missing_teacher_count || 0} color="orange" />
                            <MetricCard label="Jam Belum Teralokasi" value={summary.total_unallocated_hours || 0} color="emerald" />
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
                            <div className="rounded-xl border bg-card overflow-hidden">
                                <div className="border-b px-4 py-3">
                                    <h3 className="font-semibold">Analisa Kelas</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Kelas</th>
                                                <th className="px-4 py-3 text-center font-medium">Target</th>
                                                <th className="px-4 py-3 text-center font-medium">Terisi</th>
                                                <th className="px-4 py-3 text-center font-medium">Guru Kosong</th>
                                                <th className="px-4 py-3 text-center font-medium">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {classAnalysis.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.custom_name && <div className="text-[11px] text-muted-foreground">{item.custom_name}</div>}
                                                        <div className="text-xs text-muted-foreground mt-0.5">{item.teacher?.name || 'Belum ada wali kelas'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{item.target_hours}</td>
                                                    <td className="px-4 py-3 text-center font-semibold">{item.assigned_hours}</td>
                                                    <td className="px-4 py-3 text-center">{item.missing_teacher_count}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedManageClassId(String(item.id));
                                                                setActiveTab('teachers');
                                                            }}
                                                            className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                        >
                                                            Kelola
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card overflow-hidden">
                                <div className="border-b px-4 py-3 flex flex-wrap gap-3 justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold">Kuota & Beban Guru</h3>
                                        {isQuotasDirty && (
                                            <Button size="sm" onClick={handleSaveQuotas}>
                                                <Save className="w-4 h-4 mr-2" /> Simpan
                                            </Button>
                                        )}
                                    </div>
                                    <div className="w-full max-w-xs">
                                        <Input placeholder="Cari guru..." value={searchTeacherLoad} onChange={(e) => setSearchTeacherLoad(e.target.value)} />
                                    </div>
                                </div>
                                <div className="max-h-[520px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Guru</th>
                                                <th className="px-4 py-3 text-center font-medium">Kuota</th>
                                                <th className="px-4 py-3 text-center font-medium">Terjadwal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredTeacherLoads.map((teacher) => (
                                                <tr key={teacher.id}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{teacher.name}</div>
                                                        <div className="text-xs text-muted-foreground">{teacher.user_level?.name || '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            className="h-8 w-20 text-center mx-auto"
                                                            value={quotaDrafts[teacher.id] !== undefined ? quotaDrafts[teacher.id] : (teacher.max_hours || 0)}
                                                            onChange={(e) => handleQuotaChange(teacher.id, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${teacher.assigned_hours > teacher.max_hours ? 'bg-red-100 text-red-700' : teacher.assigned_hours === teacher.max_hours ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {teacher.assigned_hours}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'unavailable' && managementEnabled && (
                    <div className="space-y-6">
                        <div className="w-full max-w-sm">
                            <Label>Pilih Guru</Label>
                            <select value={selectedUnavailableTeacherId} onChange={(e) => setSelectedUnavailableTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Pilih Guru</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedUnavailableTeacherId ? (
                            <div className="rounded-xl border bg-card overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3 border text-left bg-muted/50 font-medium">Jam</th>
                                            {days.map((day) => (
                                                <th key={day.id} className="p-3 border text-center bg-muted/50 font-medium min-w-[90px]">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span>{day.name}</span>
                                                        <button onClick={() => toggleOffDay(day.id)} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80">
                                                            All
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {learningHours.map((hour) => (
                                            <tr key={hour.id}>
                                                <td className="p-2 border bg-muted/20 font-medium text-center">
                                                    <div className="font-bold">{hour.hour_number}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {hour.start_time?.substring(0, 5)} - {hour.end_time?.substring(0, 5)}
                                                    </div>
                                                </td>
                                                {days.map((day) => {
                                                    const selected = selectedOffSlots.has(`${day.id}-${hour.id}`);
                                                    return (
                                                        <td key={`${day.id}-${hour.id}`} className={`p-1 border text-center cursor-pointer transition-colors hover:bg-muted/40 ${selected ? 'bg-red-100/60' : ''}`} onClick={() => toggleOffSlot(day.id, hour.id)}>
                                                            <div className={`h-10 w-full rounded flex items-center justify-center transition-all ${selected ? 'bg-red-500 text-white font-medium' : 'text-muted-foreground/30 border border-dashed'}`}>
                                                                {selected ? 'OFF' : '•'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="border-t px-4 py-3 flex justify-end">
                                    <Button onClick={saveTeacherOff}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan Jam Off
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Pilih guru terlebih dahulu untuk mengatur jam off.</div>
                        )}
                    </div>
                )}

                {activeTab === 'time' && managementEnabled && (
                    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <div className="border-b px-4 py-3 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Jam Pelajaran</h3>
                                    <p className="text-sm text-muted-foreground">Kelola urutan dan rentang waktu jam belajar.</p>
                                </div>
                                <Button onClick={() => openHourModal()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Jam
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-center font-medium w-24">Jam</th>
                                            <th className="px-4 py-3 text-left font-medium">Waktu</th>
                                            <th className="px-4 py-3 text-center font-medium w-24">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {learningHours.map((hour) => (
                                            <tr key={hour.id}>
                                                <td className="px-4 py-3 text-center font-bold">{hour.hour_number}</td>
                                                <td className="px-4 py-3 font-mono">{hour.start_time?.substring(0, 5)} - {hour.end_time?.substring(0, 5)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openHourModal(hour)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => deleteHour(hour.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-600 hover:bg-red-50">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card overflow-hidden">
                            <div className="border-b px-4 py-3">
                                <h3 className="font-semibold">Hari Aktif</h3>
                                <p className="text-sm text-muted-foreground">Atur hari sekolah dan jumlah jam efektif per hari.</p>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Hari</th>
                                        <th className="px-4 py-3 text-center font-medium w-32">Jumlah Jam</th>
                                        <th className="px-4 py-3 text-center font-medium w-24">Aktif</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {days.map((day) => (
                                        <tr key={day.id}>
                                            <td className="px-4 py-3 font-medium">{day.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue={day.total_hours}
                                                    onBlur={(e) => updateDay(day, 'total_hours', e.target.value)}
                                                    className="w-20 rounded-md border px-2 py-1 text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={day.is_active}
                                                    onChange={(e) => updateDay(day, 'is_active', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isHeaderDialogOpen} onOpenChange={setIsHeaderDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pengaturan Header Cetak</DialogTitle>
                        <DialogDescription>Sesuaikan identitas sekolah dan judul cetak jadwal.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveHeader} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Sekolah</Label>
                                <Input value={headerData.name} onChange={(e) => setHeaderData('name', e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Alamat Sekolah</Label>
                                <Input value={headerData.address} onChange={(e) => setHeaderData('address', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Judul Jadwal Kelas</Label>
                                <Input value={headerData.title_class} onChange={(e) => setHeaderData('title_class', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Judul Jadwal Guru</Label>
                                <Input value={headerData.title_teacher} onChange={(e) => setHeaderData('title_teacher', e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Judul Arab</Label>
                                <Input dir="rtl" value={headerData.title_arabic} onChange={(e) => setHeaderData('title_arabic', e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Sekolah Arab</Label>
                                <Input dir="rtl" value={headerData.school_name_ar} onChange={(e) => setHeaderData('school_name_ar', e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Alamat Arab</Label>
                                <Input dir="rtl" value={headerData.school_address_ar} onChange={(e) => setHeaderData('school_address_ar', e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={processingHeader}>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent id="schedule-editor-dialog" className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editor Jadwal Mingguan</DialogTitle>
                        <DialogDescription>Atur slot pelajaran kelas dalam satu tampilan penuh.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        <div className="flex flex-wrap gap-4 items-end justify-between">
                            <div className="grid gap-1.5 w-full max-w-sm">
                                <Label>Pilih Kelas</Label>
                                <select value={editorClassId} onChange={(e) => setEditorClassId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {activeClasses.map((item) => (
                                        <option key={item.id} value={item.id}>{item.kelas?.name} {item.kelas_paralel?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleClearClassSchedule}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hapus Jadwal
                                </Button>
                                <Button type="button" variant="outline" className="border-dashed" onClick={handleCopyMapel}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Salin dari Kelas Lain
                                </Button>
                            </div>
                        </div>

                        {editorClassId ? (
                            <div className="border rounded-md overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-3 border bg-muted w-16 text-center">Jam</th>
                                            {visibleDays.map((day) => (
                                                <th key={day.id} className="p-3 border bg-muted min-w-[200px]">{day.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {learningHours.map((hour) => {
                                            const showBreak = hour.hour_number === 4;
                                            return (
                                                <FragmentRow key={hour.id}>
                                                    {showBreak && (
                                                        <tr className="bg-amber-100">
                                                            <td className="p-2 border font-bold text-center text-amber-800 border-amber-200">-</td>
                                                            <td colSpan={visibleDays.length} className="p-2 border text-center font-bold text-amber-800 border-amber-200 tracking-widest">
                                                                ISTIRAHAT (SHOLAT & MAKAN)
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr>
                                                        <td className="p-2 border text-center font-medium bg-muted/20">{hour.hour_number}</td>
                                                        {visibleDays.map((day) => {
                                                            const key = `${day.id}-${hour.id}`;
                                                            const activeValue = gridData[key] || '';
                                                            const isMondayFirstHour = day.name === 'Senin' && hour.hour_number === 1;

                                                            if (isMondayFirstHour) {
                                                                return (
                                                                    <td key={key} className="p-2 border bg-gray-100/80 text-center italic text-gray-500">
                                                                        UPACARA / APEL
                                                                    </td>
                                                                );
                                                            }

                                                            return (
                                                                <td key={key} className="p-1 border h-14 align-top">
                                                                    <div className="flex flex-col gap-1">
                                                                        <select
                                                                            className="w-full text-xs p-1.5 rounded border border-input bg-background"
                                                                            value={activeValue}
                                                                            onChange={(e) => handleGridChange(day.id, hour.id, e.target.value)}
                                                                        >
                                                                            <option value="">- Kosong -</option>
                                                                            {(editorClass?.active_subjects || []).map((subject) => {
                                                                                const effectiveTeacher = getTeacherAssignment(subject).teacher;
                                                                                return (
                                                                                    <option key={subject.id} value={subject.id}>
                                                                                        {subject.mapel?.name} {effectiveTeacher ? `(${effectiveTeacher.name})` : ''}
                                                                                    </option>
                                                                                );
                                                                            })}
                                                                        </select>
                                                                        {activeValue && (
                                                                            <div className="px-1 text-[10px] text-muted-foreground truncate">
                                                                                {(() => {
                                                                                    const subject = (editorClass?.active_subjects || []).find((s) => String(s.id) === String(activeValue));
                                                                                    return getTeacherAssignment(subject).teacher?.name || '-';
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                </FragmentRow>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                <Info className="h-12 w-12 opacity-20 mb-4" />
                                <p className="text-lg font-medium">Silakan pilih kelas terlebih dahulu</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Batal</Button>
                            <Button onClick={handleBulkScheduleSave} disabled={!editorClassId}>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Perubahan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isFetModalOpen} onOpenChange={setIsFetModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Jadwal via FET</DialogTitle>
                        <DialogDescription>
                            Gunakan aplikasi FET Desktop untuk menghitung jadwal secara lokal agar tidak membebani server.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="border rounded-lg p-4 bg-blue-50/50">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                                Download Data
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">Unduh data mapel dan ketersediaan guru ke format XML (.fet).</p>
                            <Button onClick={handleFetDownload} variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" /> Download SIKAP_Jadwal.fet
                            </Button>
                        </div>

                        <div className="border rounded-lg p-4 bg-emerald-50/50">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <span className="bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                                Upload Hasil
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">Setelah selesai memproses jadwal di aplikasi FET, unggah file hasilnya ke sini.</p>
                            <form onSubmit={handleFetUpload} className="space-y-3">
                                <Input 
                                    type="file" 
                                    accept=".fet,.xml" 
                                    onChange={(e) => setFetUploadFile(e.target.files[0])} 
                                    className="bg-white cursor-pointer"
                                />
                                <Button type="submit" className="w-full" disabled={!fetUploadFile}>
                                    <Upload className="w-4 h-4 mr-2" /> Upload Hasil Jadwal
                                </Button>
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={hourModalOpen} onOpenChange={setHourModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingHourId ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}</DialogTitle>
                        <DialogDescription>Atur nomor jam dan rentang waktunya.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitHour} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Jam Ke-</Label>
                            <Input type="number" min="1" value={hourForm.data.hour_number} onChange={(e) => hourForm.setData('hour_number', e.target.value)} />
                            {hourForm.errors.hour_number && <p className="text-sm text-destructive">{hourForm.errors.hour_number}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mulai</Label>
                                <Input type="time" value={hourForm.data.start_time} onChange={(e) => hourForm.setData('start_time', e.target.value)} />
                                {hourForm.errors.start_time && <p className="text-sm text-destructive">{hourForm.errors.start_time}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Selesai</Label>
                                <Input type="time" value={hourForm.data.end_time} onChange={(e) => hourForm.setData('end_time', e.target.value)} />
                                {hourForm.errors.end_time && <p className="text-sm text-destructive">{hourForm.errors.end_time}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setHourModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={hourForm.processing}>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={classModalOpen} onOpenChange={setClassModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingClassId ? 'Edit Kelas Aktif' : 'Tambah Kelas Aktif'}</DialogTitle>
                        <DialogDescription>Atur kelas aktif yang menjadi dasar penyusunan jadwal.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitClassForm} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Kelas</Label>
                                <select value={classForm.data.kelas_id} onChange={(e) => classForm.setData('kelas_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Pilih Kelas</option>
                                    {kelasOptions.map((kelas) => (
                                        <option key={kelas.id} value={kelas.id}>{kelas.name}</option>
                                    ))}
                                </select>
                                {classForm.errors.kelas_id && <p className="text-sm text-destructive">{classForm.errors.kelas_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Kelas Paralel</Label>
                                <select value={classForm.data.kelas_paralel_id} onChange={(e) => classForm.setData('kelas_paralel_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Tanpa Paralel</option>
                                    {kelasParalels.map((kelasParalel) => (
                                        <option key={kelasParalel.id} value={kelasParalel.id}>{kelasParalel.name}</option>
                                    ))}
                                </select>
                                {classForm.errors.kelas_paralel_id && <p className="text-sm text-destructive">{classForm.errors.kelas_paralel_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Wali Kelas</Label>
                                <select value={classForm.data.teacher_id} onChange={(e) => classForm.setData('teacher_id', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Belum Ditentukan</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                    ))}
                                </select>
                                {classForm.errors.teacher_id && <p className="text-sm text-destructive">{classForm.errors.teacher_id}</p>}
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Tampilan Kelas</Label>
                                <Input value={classForm.data.name} onChange={(e) => classForm.setData('name', e.target.value)} placeholder="Opsional, mis. Kelas Reguler Ikhwan" />
                                {classForm.errors.name && <p className="text-sm text-destructive">{classForm.errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Jam per Pekan</Label>
                                <Input type="number" min="0" value={classForm.data.total_hours_per_week} onChange={(e) => classForm.setData('total_hours_per_week', e.target.value)} />
                                {classForm.errors.total_hours_per_week && <p className="text-sm text-destructive">{classForm.errors.total_hours_per_week}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Tahun Pelajaran</Label>
                                <Input value={`${activeYear?.name || '-'}${activeYear?.semester ? ` - ${activeYear.semester}` : ''}`} disabled />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setClassModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={classForm.processing}>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pengaturan Batas Jadwal</DialogTitle>
                        <DialogDescription>
                            Atur batas maksimal jam mengajar dan penerapan jam off. Pengaturan ini akan digunakan oleh sistem saat men-generate jadwal secara otomatis.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveConfig}>
                        <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto px-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="enable_teacher_off"
                                    checked={configData.schedule_config.enable_teacher_off}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, enable_teacher_off: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="enable_teacher_off" className="font-normal cursor-pointer">Terapkan Aturan Jam Off Guru</Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Batas Maksimal Jam per Guru dalam 1 Kelas per Hari</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={configData.schedule_config.max_hours_per_class}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, max_hours_per_class: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">Sistem tidak akan menempatkan guru lebih dari {configData.schedule_config.max_hours_per_class} jam di kelas yang sama pada hari yang sama.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Batas Maksimal Total Jam per Guru dalam 1 Hari</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={configData.schedule_config.max_hours_per_day}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, max_hours_per_day: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">Sistem tidak akan menempatkan guru lebih dari {configData.schedule_config.max_hours_per_day} jam secara keseluruhan (di semua kelas) pada hari yang sama.</p>
                            </div>
                            
                            <hr className="my-2" />
                            <h4 className="font-semibold text-sm">Pengaturan Lanjutan (Advance)</h4>
                            
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="allow_split_2_hours"
                                    checked={configData.schedule_config.allow_split_2_hours}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, allow_split_2_hours: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="allow_split_2_hours" className="font-normal cursor-pointer">Izinkan Pemecahan Jadwal 2 Jam</Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">Jika jadwal sangat padat, jadwal mapel yang 2 jam boleh dipecah menjadi 1 jam dan 1 jam di hari berbeda.</p>

                            <div className="space-y-2 mt-4">
                                <Label>Jarak Minimal Hari Untuk Mapel Sama</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={configData.schedule_config.min_days_between}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, min_days_between: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">Jika diisi 1, mapel yang sama wajib beda hari. Jika 0, boleh ditempatkan di hari yang sama (misal pagi dan sore).</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Maksimal Jam Kosong (Gap) Guru dalam 1 Hari</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={configData.schedule_config.max_gaps_teacher}
                                    onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, max_gaps_teacher: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-xs text-muted-foreground">Batas waktu guru nganggur di antara jam mengajar. (Hanya berlaku di FET. Isi angka 10 untuk menonaktifkan aturan ini).</p>
                            </div>

                            <hr className="my-2" />
                            <h4 className="font-semibold text-sm">Pengaturan Bobot / Persentase Paksaan (Khusus FET)</h4>
                            <p className="text-xs text-muted-foreground mb-4">Ubah angka 100% menjadi lebih rendah (misal 95%) jika Anda ingin aturan ini bisa dilanggar oleh FET saat terdesak agar jadwal tetap berhasil jadi.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bobot Aturan Jam Off Guru (%)</Label>
                                    <Input
                                        type="number" min="0" max="100"
                                        value={configData.schedule_config.weight_teacher_off}
                                        onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, weight_teacher_off: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bobot Jarak Minimal Hari (%)</Label>
                                    <Input
                                        type="number" min="0" max="100"
                                        value={configData.schedule_config.weight_min_days_between}
                                        onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, weight_min_days_between: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bobot Maksimal Jam/Hari (%)</Label>
                                    <Input
                                        type="number" min="0" max="100"
                                        value={configData.schedule_config.weight_max_hours_daily}
                                        onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, weight_max_hours_daily: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bobot Maksimal Jam Kosong (%)</Label>
                                    <Input
                                        type="number" min="0" max="100"
                                        value={configData.schedule_config.weight_max_gaps_teacher}
                                        onChange={(e) => setConfigData('schedule_config', { ...configData.schedule_config, weight_max_gaps_teacher: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsConfigDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processingConfig}>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Pengaturan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

function FragmentRow({ children }) {
    return <>{children}</>;
}

function MetricCard({ label, value, color }) {
    const styles = {
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };

    return (
        <div className={`rounded-xl border p-5 ${styles[color] || styles.blue}`}>
            <div className="text-sm font-medium opacity-80">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
        </div>
    );
}
