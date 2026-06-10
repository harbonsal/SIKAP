import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Info, Clock, Plus, Edit2, Trash2, BookOpen, Save, X, Filter, ChevronLeft, ChevronRight, Check, AlertTriangle, ListFilter, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export default function Index({
    events = [],
    pekans = [],
    mapels = [],
    kelas = [],
    silabuses = [],
    activeYear,
    currentSemester,
    activeWeeksCount,
    inactiveWeeksCount,
    totalWeeksCount,
    filters = {},
    isAdmin = false
}) {
    const [activeTab, setActiveTab] = useState('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter states for plotting
    const [selectedMapel, setSelectedMapel] = useState(filters.mapel_id || '');
    const [selectedKelas, setSelectedKelas] = useState(filters.kelas_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || (currentSemester ? currentSemester.name : 'Ganjil'));

    // Modal / Form states
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const { data: eventData, setData: setEventData, post: postEvent, put: putEvent, delete: deleteEvent, processing: eventProcessing, errors: eventErrors, reset: resetEvent, clearErrors: clearEventErrors } = useForm({
        title: '',
        category: 'Kegiatan Pesantren',
        start_date: '',
        end_date: '',
        color: 'indigo',
        description: '',
        is_kbm_active: true,
    });

    // Helper: list days of current month for the custom calendar grid
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 0, 0); // Last day of previous month
        const lastDayOfCurrMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfCurrMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Ahad, 1 = Senin...

        const days = [];

        // Fill previous month padding days
        const prevMonthLastDay = lastDayOfMonth.getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }

        // Fill current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Fill next month padding days
        const totalSlots = 42; // 6 rows of 7 days
        const nextMonthPadding = totalSlots - days.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    }, [currentDate]);

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getEventsForDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        return events.filter(event => {
            return event.start_date <= dateStr && event.end_date >= dateStr;
        });
    };

    const handleOpenEventModal = (event = null) => {
        clearEventErrors();
        if (event) {
            setEditingEvent(event);
            setEventData({
                title: event.title,
                category: displayCategory(event.category),
                start_date: event.start_date,
                end_date: event.end_date,
                color: event.color || 'indigo',
                description: event.description || '',
                is_kbm_active: event.is_kbm_active,
            });
        } else {
            setEditingEvent(null);
            resetEvent();
        }
        setIsEventModalOpen(true);
    };

    const handleCloseEventModal = () => {
        setIsEventModalOpen(false);
        resetEvent();
        setEditingEvent(null);
    };

    const handleEventSubmit = (e) => {
        e.preventDefault();
        if (editingEvent) {
            putEvent(route('academic-calendar.events.update', editingEvent.id), {
                onSuccess: handleCloseEventModal,
                preserveScroll: true
            });
        } else {
            postEvent(route('academic-calendar.events.store'), {
                onSuccess: handleCloseEventModal,
                preserveScroll: true
            });
        }
    };

    const handleEventDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) {
            router.delete(route('academic-calendar.events.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const handleToggleKbmWeek = (pekanId, currentKbmStatus) => {
        router.put(route('academic-calendar.pekans.update-kbm', pekanId), {
            is_kbm: !currentKbmStatus
        }, {
            preserveScroll: true,
            preserveState: true
        });
    };

    const handleApplyFilters = (e) => {
        if (e) e.preventDefault();
        router.get(route('academic-calendar.index'), {
            mapel_id: selectedMapel,
            kelas_id: selectedKelas,
            semester: selectedSemester
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleAssignSyllabusWeek = (silabusId, pekanVal) => {
        router.put(route('silabus.update', silabusId), {
            pekan: pekanVal
        }, {
            preserveScroll: true,
            preserveState: true
        });
    };

    const getEventStyles = (colorCode) => {
        const maps = {
            indigo: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500', outline: 'border-indigo-200 text-indigo-700' },
            rose: { bg: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500', outline: 'border-rose-200 text-rose-700' },
            amber: { bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', outline: 'border-amber-200 text-amber-700' },
            emerald: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', outline: 'border-emerald-200 text-emerald-700' },
            cyan: { bg: 'bg-cyan-100 text-cyan-800 border-cyan-200', dot: 'bg-cyan-500', outline: 'border-cyan-200 text-cyan-700' },
            violet: { bg: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500', outline: 'border-violet-200 text-violet-700' }
        };
        return maps[colorCode] || maps.indigo;
    };

    const displayCategory = (cat) => {
        const map = {
            kbm_aktif: 'KBM Aktif',
            holiday: 'Libur / Non-KBM',
            exam: 'Ujian',
            pesantren_activity: 'Kegiatan Pesantren'
        };
        return map[cat] || cat;
    };

    return (
        <MainLayout>
            <Head title="Kalender Pendidikan" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Kalender Pendidikan (Kaldik)</h2>
                        <p className="text-muted-foreground">
                            Tahun Ajaran: <span className="font-semibold text-foreground">{activeYear?.name || '-'}</span> | Semester: <span className="font-semibold text-foreground">{currentSemester?.name || '-'}</span>
                        </p>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => handleOpenEventModal()} className="shadow-lg shadow-indigo-500/10">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
                        </Button>
                    )}
                </div>

                {/* Tabs bar */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'calendar'
                                ? 'border-indigo-600 text-indigo-600 font-semibold'
                                : 'border-transparent text-gray-500 hover:text-indigo-600'
                        }`}
                    >
                        📅 Kalender Kegiatan
                    </button>
                    <button
                        onClick={() => setActiveTab('plotting')}
                        className={`py-3 px-6 text-sm font-medium border-b-2 transition-all ${
                            activeTab === 'plotting'
                                ? 'border-indigo-600 text-indigo-600 font-semibold'
                                : 'border-transparent text-gray-500 hover:text-indigo-600'
                        }`}
                    >
                        📚 Kalkulasi & Plotting Silabus
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('manage-events')}
                            className={`py-3 px-6 text-sm font-medium border-b-2 transition-all ${
                                activeTab === 'manage-events'
                                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-indigo-600'
                            }`}
                        >
                            ⚙️ Kelola Agenda (Admin)
                        </button>
                    )}
                </div>

                {/* Content based on Tab */}
                {activeTab === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Calendar Visual */}
                        <Card className="lg:col-span-3 shadow-md border border-slate-100 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-xl font-bold text-slate-800">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8">
                                        Hari Ini
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-slate-600 mb-2">
                                    <div className="text-red-500 py-2">Ahad</div>
                                    <div className="py-2">Senin</div>
                                    <div className="py-2">Selasa</div>
                                    <div className="py-2">Rabu</div>
                                    <div className="py-2">Kamis</div>
                                    <div className="py-2">Jumat</div>
                                    <div className="text-indigo-500 py-2">Sabtu</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1.5 min-h-[350px]">
                                    {calendarDays.map((slot, index) => {
                                        const dayEvents = getEventsForDate(slot.date);
                                        const isToday = new Date().toDateString() === slot.date.toDateString();

                                        return (
                                            <div
                                                key={index}
                                                className={`min-h-[80px] p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
                                                    slot.isCurrentMonth
                                                        ? 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                                                        : 'bg-gray-100/40 border-gray-100 text-gray-400'
                                                } ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50/20 border-indigo-200' : ''}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                                        isToday ? 'bg-indigo-600 text-white' : ''
                                                    }`}>
                                                        {slot.day}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end overflow-hidden">
                                                    {dayEvents.map(event => (
                                                        <div
                                                            key={event.id}
                                                            className={`text-[10px] font-medium py-0.5 px-1.5 rounded truncate border ${getEventStyles(event.color).bg}`}
                                                            title={event.title}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Calendar Legend */}
                                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t text-xs text-slate-500 justify-center">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-emerald-500"></span>
                                        <span>KBM Aktif</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-rose-500"></span>
                                        <span>Libur / Non-KBM</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-amber-500"></span>
                                        <span>Ujian</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-indigo-500"></span>
                                        <span>Kegiatan Pesantren</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sidebar Agenda List */}
                        <div className="space-y-6">
                            <Card className="shadow-md border border-slate-100 bg-white">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-lg font-bold text-slate-800">Daftar Agenda Kegiatan</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
                                    {events.length > 0 ? (
                                        events.map(event => (
                                            <div key={event.id} className="flex gap-3 p-3 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                <span className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${getEventStyles(event.color).dot}`}></span>
                                                <div className="space-y-1">
                                                    <h5 className="font-bold text-sm text-slate-800 leading-snug">{event.title}</h5>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        {event.start_date === event.end_date ? (
                                                            <span>{event.start_date}</span>
                                                        ) : (
                                                            <span>{event.start_date} s/d {event.end_date}</span>
                                                        )}
                                                    </p>
                                                    {event.description && (
                                                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">{event.description}</p>
                                                    )}
                                                    <div className="pt-1.5 flex flex-wrap gap-1">
                                                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                                            {displayCategory(event.category)}
                                                        </Badge>
                                                        {event.is_kbm_active ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 text-[9px] py-0 px-1.5 border-none font-medium">KBM Aktif</Badge>
                                                        ) : (
                                                            <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 text-[9px] py-0 px-1.5 border-none font-medium">Libur KBM</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Belum ada agenda terdaftar.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'plotting' && (
                    <div className="space-y-6">
                        {/* Stats Panel */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/10 border-none">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Total Pekan Semester</p>
                                            <h3 className="text-3xl font-extrabold mt-2">{totalWeeksCount} Pekan</h3>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <CalendarIcon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/10 border-none">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Pekan Aktif KBM</p>
                                            <h3 className="text-3xl font-extrabold mt-2">{activeWeeksCount} Pekan</h3>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/10 border-none">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Pekan Non-KBM / Libur</p>
                                            <h3 className="text-3xl font-extrabold mt-2">{inactiveWeeksCount} Pekan</h3>
                                        </div>
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <AlertCircle className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filter Plotting Silabus */}
                        <Card className="shadow-md border border-slate-100 bg-white">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-2">
                                    <ListFilter className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-lg font-bold">Plotting Topik Silabus ke Pekan Aktif</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <Label htmlFor="mapel">Mata Pelajaran</Label>
                                        <select
                                            id="mapel"
                                            value={selectedMapel}
                                            onChange={(e) => setSelectedMapel(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        >
                                            <option value="">Pilih Mapel</option>
                                            {mapels.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="kelas">Kelas</Label>
                                        <select
                                            id="kelas"
                                            value={selectedKelas}
                                            onChange={(e) => setSelectedKelas(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            required
                                        >
                                            <option value="">Pilih Kelas</option>
                                            {kelas.map(k => (
                                                <option key={k.id} value={k.id}>{k.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label htmlFor="semester">Semester</Label>
                                        <select
                                            id="semester"
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        <Filter className="mr-2 h-4 w-4" /> Tampilkan Silabus
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* List of Weeks and Plotting Board */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Side: Active Weeks List */}
                            <div className="lg:col-span-2 space-y-4">
                                <Card className="shadow-md border border-slate-100 bg-white">
                                    <CardHeader className="pb-3 border-b">
                                        <CardTitle className="text-base font-bold text-slate-800">Daftar Pekan Semester ini</CardTitle>
                                        <CardDescription>Gunakan daftar pekan ini untuk memetakan materi silabus.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-28">Nama Pekan</TableHead>
                                                    <TableHead className="w-48">Tanggal Mulai - Selesai</TableHead>
                                                    <TableHead>Status KBM & Kegiatan Overlap</TableHead>
                                                    {isAdmin && <TableHead className="text-center w-28">Pekan Aktif</TableHead>}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pekans.length > 0 ? (
                                                    pekans.map(pekan => {
                                                        const isKbmActive = pekan.is_kbm;

                                                        return (
                                                            <TableRow key={pekan.id} className="hover:bg-slate-50/50">
                                                                <TableCell className="font-bold text-slate-800">{pekan.name}</TableCell>
                                                                <TableCell className="text-xs text-slate-500 font-mono">
                                                                    {pekan.start_date} s/d {pekan.end_date}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {isKbmActive ? (
                                                                                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none font-medium text-[10px]">
                                                                                    Aktif KBM
                                                                                </Badge>
                                                                            ) : (
                                                                                <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 border-none font-medium text-[10px]">
                                                                                    Non-KBM / Libur
                                                                                </Badge>
                                                                            )}

                                                                            {/* Display overlaps */}
                                                                            {pekan.overlapping_events?.map(event => (
                                                                                <Badge
                                                                                    key={event.id}
                                                                                    variant="outline"
                                                                                    className={`text-[9px] font-normal ${getEventStyles(event.color).outline}`}
                                                                                    title={event.description}
                                                                                >
                                                                                    {event.title}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                {isAdmin && (
                                                                    <TableCell className="text-center">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleToggleKbmWeek(pekan.id, isKbmActive)}
                                                                            className={`text-xs px-2 py-1 h-7 border ${
                                                                                isKbmActive
                                                                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800'
                                                                                    : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:text-rose-800'
                                                                            }`}
                                                                        >
                                                                            {isKbmActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                                        </Button>
                                                                    </TableCell>
                                                                )}
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-6 text-slate-400 text-sm">
                                                            Belum ada data pekan yang diatur di sistem.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Side: Syllabus Items & Week Mapping */}
                            <div className="space-y-4">
                                <Card className="shadow-md border border-slate-100 bg-white">
                                    <CardHeader className="pb-3 border-b">
                                        <CardTitle className="text-base font-bold text-slate-800">Pemetaan Materi Silabus</CardTitle>
                                        <CardDescription>
                                            {selectedMapel && selectedKelas
                                                ? 'Petakan materi pelajaran di bawah ini ke pekan KBM Aktif.'
                                                : 'Silakan pilih Mapel & Kelas terlebih dahulu pada filter di atas.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4 max-h-[550px] overflow-y-auto">
                                        {selectedMapel && selectedKelas ? (
                                            silabuses.length > 0 ? (
                                                silabuses.map(item => (
                                                    <div key={item.id} className="p-3 border rounded-xl space-y-3 bg-white hover:border-indigo-200 transition-all">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h6 className="font-bold text-sm text-slate-800 leading-snug">{item.materi}</h6>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 font-mono truncate" title={item.kompetensi}>
                                                                {item.kode ? `[${item.kode}] ` : ''}{item.kompetensi}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4 border-t pt-2 mt-2">
                                                            <span className="text-xs text-slate-400">
                                                                Alokasi: <span className="font-semibold text-slate-700">{item.alokasi_waktu || '-'}</span>
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Plot Pekan:</label>
                                                                <select
                                                                    value={item.pekan || ''}
                                                                    onChange={(e) => handleAssignSyllabusWeek(item.id, e.target.value)}
                                                                    className="h-7 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring w-24"
                                                                >
                                                                    <option value="">Belum di-plot</option>
                                                                    {pekans.map(pekan => (
                                                                        <option key={pekan.id} value={pekan.name.replace(/[^0-9]/g, '')}>
                                                                            {pekan.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                    Tidak ada data silabus untuk kriteria ini.
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-center py-12 text-slate-400 text-sm">
                                                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                Pilih Mapel & Kelas pada filter untuk memetakan silabus.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'manage-events' && isAdmin && (
                    <Card className="shadow-md border border-slate-100 bg-white">
                        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Kelola Agenda Kegiatan Kalender Pendidikan</CardTitle>
                                <CardDescription>Daftar kegiatan khusus pesantren dan agenda KBM.</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenEventModal()} size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center pl-4">No</TableHead>
                                        <TableHead>Nama Kegiatan</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Tanggal Mulai - Selesai</TableHead>
                                        <TableHead>KBM Efektif</TableHead>
                                        <TableHead className="text-center w-28 pr-4">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.length > 0 ? (
                                        events.map((event, index) => (
                                            <TableRow key={event.id} className="hover:bg-slate-50/50">
                                                <TableCell className="text-center pl-4">{index + 1}</TableCell>
                                                <TableCell className="font-bold text-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${getEventStyles(event.color).dot}`}></span>
                                                        <span>{event.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal text-xs">
                                                        {displayCategory(event.category)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono text-slate-600">
                                                    {event.start_date === event.end_date ? (
                                                        <span>{event.start_date}</span>
                                                    ) : (
                                                        <span>{event.start_date} s/d {event.end_date}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {event.is_kbm_active ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none font-semibold">Aktif KBM</Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 border-none font-semibold">Libur KBM</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center pr-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEventModal(event)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEventDelete(event.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                                                Belum ada agenda terdaftar. Klik "Tambah Kegiatan" untuk membuat baru.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Event Form Modal */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingEvent ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan'}
                            </h3>
                            <button onClick={handleCloseEventModal} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="title">Nama Kegiatan / Agenda <span className="text-rose-500">*</span></Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={eventData.title}
                                    onChange={(e) => setEventData('title', e.target.value)}
                                    placeholder="Contoh: Libur Idul Fitri, Penilaian Akhir Semester..."
                                    required
                                />
                                {eventErrors.title && <p className="text-xs text-rose-500">{eventErrors.title}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="category">Kategori <span className="text-rose-500">*</span></Label>
                                    <Input
                                        id="category"
                                        list="category-options"
                                        type="text"
                                        value={eventData.category}
                                        onChange={(e) => setEventData('category', e.target.value)}
                                        placeholder="Ketik / pilih kategori..."
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    />
                                    <datalist id="category-options">
                                        <option value="Kegiatan Pesantren" />
                                        <option value="KBM Aktif" />
                                        <option value="Ujian" />
                                        <option value="Libur / Non-KBM" />
                                    </datalist>
                                    {eventErrors.category && <p className="text-xs text-rose-500">{eventErrors.category}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="color">Warna Tampilan <span className="text-rose-500">*</span></Label>
                                    <select
                                        id="color"
                                        value={eventData.color}
                                        onChange={(e) => setEventData('color', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                        required
                                    >
                                        <option value="indigo">Indigo / Violet</option>
                                        <option value="rose">Merah / Pink</option>
                                        <option value="amber">Kuning / Orange</option>
                                        <option value="emerald">Hijau</option>
                                        <option value="cyan">Biru Muda</option>
                                        <option value="violet">Ungu</option>
                                    </select>
                                    {eventErrors.color && <p className="text-xs text-rose-500">{eventErrors.color}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="start_date">Tanggal Mulai <span className="text-rose-500">*</span></Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={eventData.start_date}
                                        onChange={(e) => setEventData('start_date', e.target.value)}
                                        required
                                    />
                                    {eventErrors.start_date && <p className="text-xs text-rose-500">{eventErrors.start_date}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="end_date">Tanggal Selesai <span className="text-rose-500">*</span></Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={eventData.end_date}
                                        onChange={(e) => setEventData('end_date', e.target.value)}
                                        required
                                    />
                                    {eventErrors.end_date && <p className="text-xs text-rose-500">{eventErrors.end_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description">Keterangan / Detail</Label>
                                <textarea
                                    id="description"
                                    value={eventData.description}
                                    onChange={(e) => setEventData('description', e.target.value)}
                                    placeholder="Keterangan tambahan mengenai kegiatan..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                {eventErrors.description && <p className="text-xs text-rose-500">{eventErrors.description}</p>}
                            </div>

                            <div className="flex items-center gap-2 border-t pt-4">
                                <input
                                    id="is_kbm_active"
                                    type="checkbox"
                                    checked={eventData.is_kbm_active}
                                    onChange={(e) => setEventData('is_kbm_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="is_kbm_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    KBM (Kegiatan Belajar Mengajar) tetap aktif selama agenda ini berlangsung
                                </Label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={handleCloseEventModal}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={eventProcessing}>
                                    {eventProcessing ? 'Menyimpan...' : 'Simpan Agenda'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
