import MainLayout from '@/Layouts/MainLayout';
import { Head } from '@inertiajs/react';
import { Calendar, Users, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Index({ schedules, activeClasses, days, activeSlots, learningHours, teachers, initialTab, initialClassId, initialTeacherId }) {

    const [activeTab, setActiveTab] = useState(initialTab || 'master'); // master, class, teacher
    const [selectedClassId, setSelectedClassId] = useState(initialClassId || activeClasses[0]?.id || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId || '');

    // Initialize logic
    useEffect(() => {
        if (initialClassId) setSelectedClassId(initialClassId);
        if (initialTeacherId) setSelectedTeacherId(initialTeacherId);
    }, [initialClassId, initialTeacherId]);

    // Helper: Find schedule item
    const getScheduleItem = (classId, dayId, hourId) => {
        return schedules.find(s =>
            s.active_class_id == classId &&
            s.day_id === dayId &&
            s.learning_hour_id === hourId
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
                                {ac.kelas?.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map(day => (
                        learningHours.map(hour => {
                            if (!isSlotActive(day.id, hour.id)) return null;

                            return (
                                <tr key={`${day.id}-${hour.id}`}>
                                    <td className="p-2 border bg-muted/20 font-medium sticky left-0 z-10">
                                        <div className="flex flex-col">
                                            <span>{day.name}</span>
                                            <span className="text-[10px] text-muted-foreground">Jam ke-{hour.hour_number}</span>
                                        </div>
                                    </td>
                                    {activeClasses.map(ac => {
                                        const schedule = getScheduleItem(ac.id, day.id, hour.id);
                                        return (
                                            <td key={ac.id} className="p-1 border text-center h-16 align-top">
                                                {schedule ? (
                                                    <div className="flex flex-col h-full justify-center bg-primary/5 rounded p-1">
                                                        <span className="font-bold text-primary truncate" title={schedule.active_subject?.mapel?.name}>
                                                            {schedule.active_subject?.mapel?.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate" title={schedule.teacher?.name}>
                                                            {schedule.teacher?.name}
                                                        </span>
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
                            );
                        })
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderClassView = () => {
        const selectedClass = activeClasses.find(c => c.id == selectedClassId);

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                        {activeClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.kelas?.name}</option>
                        ))}
                    </select>
                </div>

                <div className="rounded-md border p-4 bg-card">
                    <h3 className="text-lg font-bold mb-4">Jadwal Kelas: {selectedClass?.kelas?.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {days.map(day => (
                            <div key={day.id} className="border rounded-md overflow-hidden">
                                <div className="bg-muted p-2 text-center font-bold text-sm border-b">
                                    {day.name}
                                </div>
                                <div className="divide-y text-xs">
                                    {learningHours.map(hour => {
                                        if (!isSlotActive(day.id, hour.id)) return null;
                                        const schedule = getScheduleItem(selectedClassId, day.id, hour.id);
                                        return (
                                            <div key={hour.id} className="p-2 flex items-center gap-2 h-14">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-medium shrink-0">
                                                    {hour.hour_number}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {schedule ? (
                                                        <>
                                                            <div className="font-semibold truncate">{schedule.active_subject?.mapel?.name}</div>
                                                            <div className="text-muted-foreground truncate">{schedule.teacher?.name}</div>
                                                        </>
                                                    ) : <span className="text-muted-foreground/50">-</span>}
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

    const renderTeacherView = () => {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                    >
                        <option value="">-- Pilih Guru --</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {selectedTeacherId ? (
                    <div className="rounded-md border p-4 bg-card">
                        <h3 className="text-lg font-bold mb-4">Jadwal Guru: {teachers.find(t => t.id == selectedTeacherId)?.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            {days.map(day => (
                                <div key={day.id} className="border rounded-md overflow-hidden">
                                    <div className="bg-muted p-2 text-center font-bold text-sm border-b">
                                        {day.name}
                                    </div>
                                    <div className="divide-y text-xs">
                                        {learningHours.map(hour => {
                                            if (!isSlotActive(day.id, hour.id)) return null;
                                            const schedule = schedules.find(s =>
                                                s.teacher_id == selectedTeacherId &&
                                                s.day_id === day.id &&
                                                s.learning_hour_id === hour.id
                                            );

                                            return (
                                                <div key={hour.id} className="p-2 flex items-center gap-2 h-14">
                                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-medium shrink-0">
                                                        {hour.hour_number}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {schedule ? (
                                                            <>
                                                                <div className="font-semibold truncate">{schedule.active_subject?.mapel?.name}</div>
                                                                <div className="text-secondary-foreground text-[10px] bg-secondary px-1 rounded inline-block">
                                                                    {schedule.active_class?.kelas?.name}
                                                                </div>
                                                            </>
                                                        ) : <span className="text-muted-foreground/50">-</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground border border-dashed rounded-md">
                        Pilih guru untuk melihat jadwalnya.
                    </div>
                )}
            </div>
        )
    };

    return (
        <MainLayout>
            <Head title="Jadwal Pelajaran" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Jadwal Pelajaran</h2>
                    <p className="text-muted-foreground">Lihat jadwal pelajaran akademik terbaru.</p>
                </div>

                <div className="flex items-center space-x-1 rounded-lg border bg-card p-1 text-card-foreground shadow-sm w-fit overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('master')}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'master' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        Master Grid
                    </button>
                    <button
                        onClick={() => setActiveTab('class')}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'class' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Per Kelas
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'teacher' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                        <User className="mr-2 h-4 w-4" />
                        Per Guru
                    </button>
                </div>

                {activeTab === 'master' && (
                    <div className="rounded-md border bg-card shadow-sm p-4">
                        {renderMasterGrid()}
                    </div>
                )}

                {activeTab === 'class' && renderClassView()}

                {activeTab === 'teacher' && renderTeacherView()}

            </div>
        </MainLayout>
    );
}
