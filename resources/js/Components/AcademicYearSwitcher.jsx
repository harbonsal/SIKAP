import { useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';

export default function AcademicYearSwitcher() {
    const { academic_state } = usePage().props;
    const { active_year, active_semester, years, semesters, system_year, can_switch_year } = academic_state;
    const isDifferentFromSystem = system_year && active_year && String(system_year.id) !== String(active_year.id);

    if (!active_year || !active_semester) return null;

    const { post, processing } = useForm();

    const handleSwitch = (yearId, semesterId) => {
        post(route('academic.switch-state', {
            academic_year_id: yearId,
            semester_id: semesterId
        }), {
            preserveScroll: true,
            preserveState: false,
        });
    };

    if (!can_switch_year) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border bg-background border-border/70 text-xs font-semibold shadow-2xs shrink-0 select-none">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-bold">
                    <span className="sm:hidden">{active_year.name?.split('/')[0] || active_year.name}</span>
                    <span className="hidden sm:inline">{active_year.name}</span>
                </span>
                <span className="text-muted-foreground/40 text-[10px]">|</span>
                <span className="font-medium text-muted-foreground">{active_semester.name}</span>
            </div>
        );
    }

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <div className={`
                    flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-200 shadow-2xs shrink-0 select-none active:scale-95
                    ${isDifferentFromSystem
                        ? 'bg-amber-100/60 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-background border-border/70 hover:border-primary/50 text-foreground'}
                `}>
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDifferentFromSystem ? 'text-amber-600' : 'text-primary'}`} />
                    <span className="font-bold">
                        <span className="sm:hidden">{active_year.name?.split('/')[0] || active_year.name}</span>
                        <span className="hidden sm:inline">{active_year.name}</span>
                    </span>
                    <span className="text-muted-foreground/40 text-[10px]">|</span>
                    <span className="font-medium text-muted-foreground">{active_semester.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                </div>
            </Dropdown.Trigger>

            <Dropdown.Content contentClasses="py-1 bg-white dark:bg-zinc-950 w-72 max-h-[85vh] overflow-y-auto shadow-xl border border-border/50 rounded-xl ring-1 ring-black/5">
                <div className="px-4 py-3 border-b border-border/40 bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Konteks Kerja
                    </h3>
                    <p className="px-4 py-2 text-[10px] text-muted-foreground/70">
                        {isDifferentFromSystem
                            ? `Anda sedang menyiapkan ${active_year.name}. Tahun aktif sekolah tetap ${system_year?.name || '-'}.`
                            : 'Pilih tahun kerja untuk persiapan atau pengecekan. Ini tidak mengubah tahun aktif sistem.'}
                    </p>
                </div>

                {years.map((year) => (
                    <div key={year.id} className="group border-b border-border/40 last:border-0">
                        <div className="px-4 py-2.5 text-sm font-bold bg-muted/10 flex items-center justify-between group-hover:bg-muted/30 transition-colors">
                            <span className="text-foreground/80 group-hover:text-foreground">{year.name}</span>
                            {year.is_active && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shadow-sm">
                                    AKTIF
                                </span>
                            )}
                        </div>
                        <div className="p-1 space-y-0.5">
                            {semesters.map((sem) => {
                                const isActive = active_year.id === year.id && active_semester.id === sem.id;
                                return (
                                    <button
                                        key={`${year.id}-${sem.id}`}
                                        onClick={() => handleSwitch(year.id, sem.id)}
                                        disabled={processing}
                                        className={`
                                            w-full text-left px-4 py-2.5 text-sm rounded-lg flex items-center justify-between transition-all duration-200
                                            ${isActive
                                                ? 'bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/20'
                                                : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground hover:pl-5'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                            <span>Semester {sem.name}</span>
                                        </div>
                                        {isActive && <Check className="w-4 h-4 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}
