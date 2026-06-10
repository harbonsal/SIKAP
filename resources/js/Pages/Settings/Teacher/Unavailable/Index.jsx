import MainLayout from '@/Layouts/MainLayout';
import { Head, router, useForm } from '@inertiajs/react'; // Add useForm here
import { CalendarOff, Save, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Index({ teachers, days, learningHours, unavailableHours, selectedTeacherId }) { // Prop name unavailableHours
    const [selectedTeacher, setSelectedTeacher] = useState(selectedTeacherId || '');
    const [selectedSlots, setSelectedSlots] = useState(new Set(unavailableHours || []));

    // Update selectedSlots when prop changes (e.g. after selecting a new teacher)
    useEffect(() => {
        setSelectedSlots(new Set(unavailableHours || []));
    }, [unavailableHours]);

    const [search, setSearch] = useState('');

    // Filter teachers based on search
    const filteredTeachers = teachers.filter(teacher =>
        teacher.name?.toLowerCase().includes(search.toLowerCase()) ||
        String(teacher.nomor_induk || '').includes(search)
    );

    const selectTeacher = (teacherId) => {
        setSelectedTeacher(teacherId);
        router.get(route('settings.teacher.unavailable.index'), { user_id: teacherId }, { preserveState: true });
    };

    const toggleSlot = (dayId, hourId) => {
        const slotKey = `${dayId}-${hourId}`;
        const newSlots = new Set(selectedSlots);
        if (newSlots.has(slotKey)) {
            newSlots.delete(slotKey);
        } else {
            newSlots.add(slotKey);
        }
        setSelectedSlots(newSlots);
    };

    const toggleDay = (dayId) => {
        const dayHours = learningHours.map(h => `${dayId}-${h.id}`);
        const allSelected = dayHours.every(slot => selectedSlots.has(slot));

        const newSlots = new Set(selectedSlots);
        if (allSelected) {
            dayHours.forEach(slot => newSlots.delete(slot));
        } else {
            dayHours.forEach(slot => newSlots.add(slot));
        }
        setSelectedSlots(newSlots);
    };

    const { post, processing } = useForm({});

    const handleSave = () => {
        if (!selectedTeacher) return;

        router.post(route('settings.teacher.unavailable.update'), {
            user_id: selectedTeacher,
            unavailable_slots: Array.from(selectedSlots)
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message handled by layout
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Jam Off Guru" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Jam Off Guru</h2>
                    <p className="text-muted-foreground">Atur jadwal jam di mana guru tidak dapat mengajar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Teacher List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari Guru..."
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Nama Guru</th>
                                            <th className="px-4 py-3 font-medium text-center">Jml Off</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTeachers.map(teacher => (
                                            <tr
                                                key={teacher.id}
                                                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedTeacher == teacher.id ? 'bg-primary/10 hover:bg-primary/20' : ''}`}
                                                onClick={() => selectTeacher(teacher.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{teacher.name}</div>
                                                    <div className="text-xs text-muted-foreground">{teacher.nomor_induk}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {teacher.unavailable_hours_count > 0 ? (
                                                        <span className="inline-flex items-center justify-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                                                            {teacher.unavailable_hours_count} Jam
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Matrix */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            {selectedTeacher ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">
                                            Jadwal Off: {teachers.find(t => t.id == selectedTeacher)?.name}
                                        </h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="p-3 border text-left bg-muted/50 font-medium">Jam Ke</th>
                                                    {days.map(day => (
                                                        <th key={day.id} className="p-3 border text-center bg-muted/50 font-medium min-w-[80px]">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span>{day.name}</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleDay(day.id); }}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                                                                >
                                                                    All
                                                                </button>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {learningHours.map(hour => (
                                                    <tr key={hour.id}>
                                                        <td className="p-2 border bg-muted/20 font-medium text-center">
                                                            <div className="font-bold">{hour.hour_number}</div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {hour.start_time?.substring(0, 5)} - {hour.end_time?.substring(0, 5)}
                                                            </div>
                                                        </td>
                                                        {days.map(day => {
                                                            const isSelected = selectedSlots.has(`${day.id}-${hour.id}`);
                                                            return (
                                                                <td
                                                                    key={`${day.id}-${hour.id}`}
                                                                    className={`p-1 border text-center cursor-pointer transition-colors hover:bg-muted/40 ${isSelected ? 'bg-destructive/10' : ''}`}
                                                                    onClick={() => toggleSlot(day.id, hour.id)}
                                                                >
                                                                    <div className={`h-10 w-full rounded flex items-center justify-center transition-all ${isSelected ? 'bg-destructive text-destructive-foreground font-medium' : 'text-muted-foreground/30'}`}>
                                                                        {isSelected ? <CalendarOff size={16} /> : <Check size={14} />}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <button
                                            onClick={handleSave}
                                            disabled={processing}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <CalendarOff className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium">Pilih guru dari daftar di samping</p>
                                    <p className="text-sm">untuk mengatur jam tidak bisa mengajar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
