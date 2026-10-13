import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/Components/ui/dialog';
import {
    Users, GraduationCap, Clock, CalendarDays, BookOpen, FilePenLine, User, Calendar,
    Bot, Book, ChevronRight, Sparkles, BarChart2, CalendarRange, Download,
    SlidersHorizontal, Check, FileText, RotateCcw, X, Layers,
    HeartPulse, Key, BookOpenCheck, Wallet, UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

// Registry Seluruh Pintasan KBM & Sistem Tersedia
const ALL_SHORTCUTS = [
    {
        id: 'students',
        alias: 'students',
        label: 'Santri',
        icon: Users,
        route: () => route('students.index', { my_students: 1, status: 'Aktif' }),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-purple-500 to-indigo-600',
        textColor: 'group-hover:text-purple-600',
    },
    {
        id: 'journals',
        alias: 'journals',
        label: 'Jurnal KBM',
        icon: CalendarDays,
        route: () => route('journals.index'),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-amber-500 to-amber-600',
        textColor: 'group-hover:text-amber-600',
    },
    {
        id: 'schedule',
        alias: 'schedule',
        label: 'Jadwal KBM',
        icon: Clock,
        route: () => route('academic.schedules.index'),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-cyan-500 to-blue-600',
        textColor: 'group-hover:text-cyan-600',
    },
    {
        id: 'tahfidz',
        alias: 'tahfidz',
        label: 'Tahfidz',
        icon: Book,
        route: () => route('tahfidz.assessments.index'),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-teal-500 to-emerald-600',
        textColor: 'group-hover:text-teal-600',
    },
    {
        id: 'skrining',
        alias: 'skrining',
        label: 'Skrining',
        icon: Sparkles,
        route: () => route('tahfidz.pantau-skrining'),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-violet-600 to-purple-700',
        textColor: 'group-hover:text-violet-600',
    },
    {
        id: 'ikhtabir',
        alias: 'ikhtabir',
        label: 'Tes AI',
        icon: Bot,
        route: () => route('ikhtabir-nafsi.index'),
        category: 'daily',
        categoryLabel: 'Harian',
        color: 'from-rose-500 to-pink-600',
        textColor: 'group-hover:text-rose-600',
    },
    {
        id: 'quran',
        alias: 'quran',
        label: "Al-Qur'an",
        icon: BookOpenCheck,
        route: () => route('quran.index'),
        category: 'daily',
        categoryLabel: 'Tahfidz',
        color: 'from-emerald-500 to-teal-600',
        textColor: 'group-hover:text-emerald-600',
    },
    {
        id: 'health',
        alias: 'health',
        label: 'Kesehatan',
        icon: HeartPulse,
        route: () => route('health.records.index'),
        category: 'daily',
        categoryLabel: 'Pengasuhan',
        color: 'from-rose-500 to-pink-600',
        textColor: 'group-hover:text-rose-600',
    },
    {
        id: 'permissions',
        alias: 'permissions',
        label: 'Perizinan',
        icon: Key,
        route: () => route('permissions.index'),
        category: 'daily',
        categoryLabel: 'Pengasuhan',
        color: 'from-amber-600 to-red-600',
        textColor: 'group-hover:text-amber-600',
    },
    {
        id: 'permission_personal',
        alias: 'permission_personal',
        label: 'Izin Personal',
        icon: UserCheck,
        route: () => route('permissions.create', { type: 'personal' }),
        category: 'daily',
        categoryLabel: 'Pengasuhan',
        color: 'from-emerald-600 to-teal-600',
        textColor: 'group-hover:text-emerald-600',
    },
    {
        id: 'silabus',
        alias: 'silabus',
        label: 'Silabus',
        icon: BookOpen,
        route: () => route('silabus.index'),
        category: 'period',
        categoryLabel: 'Awal Semester',
        color: 'from-cyan-500 to-blue-600',
        textColor: 'group-hover:text-cyan-600',
    },
    {
        id: 'grades',
        alias: 'grades',
        label: 'Nilai',
        icon: GraduationCap,
        route: () => route('assessments.index'),
        category: 'period',
        categoryLabel: 'Periode Ujian',
        color: 'from-emerald-500 to-teal-600',
        textColor: 'group-hover:text-emerald-600',
    },
    {
        id: 'recap',
        alias: 'recap',
        label: 'Rekap',
        icon: BarChart2,
        route: () => route('recap.class.index'),
        category: 'period',
        categoryLabel: 'Periode Ujian',
        color: 'from-amber-500 to-orange-600',
        textColor: 'group-hover:text-amber-600',
    },
    {
        id: 'reports',
        alias: 'reports',
        label: 'Rapor',
        icon: FileText,
        route: () => route('reports.index'),
        category: 'period',
        categoryLabel: 'Akhir Semester',
        color: 'from-fuchsia-500 to-pink-600',
        textColor: 'group-hover:text-fuchsia-600',
    },
    {
        id: 'calendar',
        alias: 'calendar',
        label: 'Kalender',
        icon: CalendarRange,
        route: () => route('academic-calendar.index'),
        category: 'period',
        categoryLabel: 'Akademik',
        color: 'from-blue-500 to-sky-600',
        textColor: 'group-hover:text-blue-600',
    },
    {
        id: 'profile',
        alias: 'profile',
        label: 'Profil Saya',
        icon: User,
        route: () => route('profile.edit'),
        category: 'daily',
        categoryLabel: 'Akun',
        color: 'from-purple-500 to-indigo-600',
        textColor: 'group-hover:text-purple-600',
    },
    {
        id: 'finance',
        alias: 'finance',
        label: 'Keuangan',
        icon: Wallet,
        route: () => '#',
        category: 'period',
        categoryLabel: 'Akun',
        color: 'from-emerald-600 to-teal-700',
        textColor: 'group-hover:text-emerald-600',
    },
    {
        id: 'install_app',
        alias: 'install_app',
        label: 'Pasang App',
        icon: Download,
        isAction: true,
        category: 'daily',
        categoryLabel: 'PWA',
        color: 'from-slate-600 to-indigo-700',
        textColor: 'group-hover:text-indigo-600',
    },
];

export default function TeacherDashboard({ stats, schedule, allowedWidgets = {} }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const permissions = user?.permissions || [];
    const hasTeachingLoad = user?.has_teaching_load;

    // Defaults if allowedWidgets is empty
    const showWelcome = allowedWidgets.welcome_card ?? true;
    const showStats = allowedWidgets.stats_cards ?? true;
    const showSchedule = allowedWidgets.schedule_today ?? true;
    const showQuickActions = allowedWidgets.quick_actions ?? true;

    // Helper to check permission
    const can = (p) => user?.user_level?.name === 'Administrator' || permissions.includes(p);
    const isTeacher = user?.user_level?.name === 'Guru';
    const canViewAcademic = !isTeacher || hasTeachingLoad;

    const isStandalone = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        navigator.standalone === true
    );

    // Cek apakah Admin mengizinkan pintasan ini untuk role Guru
    const hasConfiguredWidgets = Object.keys(allowedWidgets).length > 0;
    const isAllowedByAdmin = (shortcutId, alias = null) => {
        if (allowedWidgets[`shortcut_${shortcutId}`] !== undefined) {
            return Boolean(allowedWidgets[`shortcut_${shortcutId}`]);
        }
        if (allowedWidgets[shortcutId] !== undefined) {
            return Boolean(allowedWidgets[shortcutId]);
        }
        if (alias && allowedWidgets[`shortcut_${alias}`] !== undefined) {
            return Boolean(allowedWidgets[`shortcut_${alias}`]);
        }
        if (alias && allowedWidgets[alias] !== undefined) {
            return Boolean(allowedWidgets[alias]);
        }
        // Fallback default jika role belum dikonfigurasi sama sekali di admin
        if (!hasConfiguredWidgets) {
            const defaultRecommended = [
                'students', 'journals', 'schedule', 'tahfidz', 'skrining', 
                'ikhtabir', 'quran', 'silabus', 'grades', 'recap', 'calendar', 'profile'
            ];
            return defaultRecommended.includes(shortcutId) || (alias && defaultRecommended.includes(alias));
        }
        return false;
    };

    // Seluruh pintasan yang diizinkan Admin untuk peran ini
    const adminAllowedShortcuts = ALL_SHORTCUTS.filter(s => {
        if (s.id === 'install_app' && isStandalone) return false;
        return isAllowedByAdmin(s.id, s.alias);
    });

    // Filter Mode: 'daily' | 'period' | 'all'
    const [filterMode, setFilterMode] = useState(() => {
        if (typeof window !== 'undefined' && user?.id) {
            return localStorage.getItem(`sikap_shortcut_tab_${user.id}`) || 'all';
        }
        return 'all';
    });

    // Hidden Shortcut IDs (kustomisasi personal Guru jika sengaja ingin menyembunyikan item)
    // Default: [] (semua pintasan yang diaktifkan Admin langsung tampil otomatis)
    const [hiddenShortcuts, setHiddenShortcuts] = useState(() => {
        if (typeof window !== 'undefined' && user?.id) {
            // Bersihkan legacy whitelist lama jika ada
            const legacyKey = `sikap_shortcuts_${user.id}`;
            const legacySaved = localStorage.getItem(legacyKey);
            if (legacySaved) {
                try {
                    const parsed = JSON.parse(legacySaved);
                    if (Array.isArray(parsed) && parsed.length === 0) {
                        localStorage.removeItem(legacyKey);
                    }
                } catch (e) {
                    localStorage.removeItem(legacyKey);
                }
            }

            const savedHidden = localStorage.getItem(`sikap_hidden_shortcuts_${user.id}`);
            if (savedHidden) {
                try {
                    const parsed = JSON.parse(savedHidden);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    // fallback
                }
            }
        }
        return [];
    });

    // Dialog state & temporary selection
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [tempHidden, setTempHidden] = useState(hiddenShortcuts);

    // Sync temp state when opening dialog
    useEffect(() => {
        if (isCustomizeOpen) {
            setTempHidden(hiddenShortcuts);
        }
    }, [isCustomizeOpen, hiddenShortcuts]);

    const handleFilterChange = (mode) => {
        setFilterMode(mode);
        if (typeof window !== 'undefined' && user?.id) {
            localStorage.setItem(`sikap_shortcut_tab_${user.id}`, mode);
        }
    };

    const toggleShortcut = (id) => {
        setTempHidden((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const applyPreset = (presetName) => {
        if (presetName === 'all') {
            setTempHidden([]);
            setFilterMode('all');
        } else if (presetName === 'daily') {
            const nonDailyIds = adminAllowedShortcuts.filter(s => s.category !== 'daily').map(s => s.id);
            setTempHidden(nonDailyIds);
            setFilterMode('daily');
        } else if (presetName === 'exams') {
            const nonExamIds = adminAllowedShortcuts.filter(s => !['grades', 'recap', 'reports', 'tahfidz', 'skrining'].includes(s.id)).map(s => s.id);
            setTempHidden(nonExamIds);
            setFilterMode('period');
        } else if (presetName === 'semester_start') {
            const nonStartIds = adminAllowedShortcuts.filter(s => !['silabus', 'calendar', 'students', 'schedule'].includes(s.id)).map(s => s.id);
            setTempHidden(nonStartIds);
            setFilterMode('period');
        }
    };

    const saveCustomization = () => {
        setHiddenShortcuts(tempHidden);
        if (typeof window !== 'undefined' && user?.id) {
            localStorage.setItem(`sikap_hidden_shortcuts_${user.id}`, JSON.stringify(tempHidden));
            localStorage.removeItem(`sikap_shortcuts_${user.id}`);
        }
        setIsCustomizeOpen(false);
        Swal.fire({
            icon: 'success',
            title: 'Pintasan Diperbarui',
            text: 'Daftar akses cepat Anda berhasil disesuaikan.',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
        });
    };

    const resetToDefault = () => {
        setTempHidden([]);
        if (typeof window !== 'undefined' && user?.id) {
            localStorage.removeItem(`sikap_hidden_shortcuts_${user.id}`);
            localStorage.removeItem(`sikap_shortcuts_${user.id}`);
        }
    };

    // Filter visible shortcuts according to active tab, admin allowance, and hidden list
    const visibleShortcuts = adminAllowedShortcuts.filter((s) => {
        if (hiddenShortcuts.includes(s.id)) return false;
        if (filterMode === 'daily') return s.category === 'daily';
        if (filterMode === 'period') return s.category === 'period';
        return true; // 'all'
    });

    // Format tanggal hari ini dalam Bahasa Indonesia
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    const handleInstallClick = () => {
        if (typeof window !== 'undefined' && window.deferredPWAInstallPrompt) {
            window.deferredPWAInstallPrompt.prompt();
            window.deferredPWAInstallPrompt.userChoice.then(({ outcome }) => {
                if (outcome === 'accepted') {
                    window.deferredPWAInstallPrompt = null;
                }
            });
            return;
        }
        if (isStandalone) {
            Swal.fire({
                icon: 'success',
                title: 'Aplikasi Terpasang',
                text: 'Aplikasi SIKAP sudah terpasang dan sedang berjalan langsung di perangkat Anda.',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (isIOS) {
            Swal.fire({
                icon: 'info',
                title: 'Pasang di iPhone / iPad',
                html: '<div style="text-align: left; font-size: 14px; line-height: 1.6;">1. Ketuk ikon <b>Bagikan (Share)</b> 📤 di bilah navigasi Safari.<br/><br/>2. Gulir ke bawah lalu pilih menu <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b> ➕.<br/><br/>3. Ketuk <b>Tambah</b> di pojok kanan atas.</div>',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        Swal.fire({
            icon: 'info',
            title: 'Pasang Aplikasi SIKAP',
            html: '<div style="text-align: left; font-size: 14px; line-height: 1.6;">Untuk memasang aplikasi SIKAP secara langsung:<br/><br/>1. Ketuk ikon <b>titik tiga (⋮)</b> di pojok kanan atas browser Chrome.<br/><br/>2. Pilih menu <b>"Instal aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.<br/><br/>Aplikasi akan otomatis muncul di menu aplikasi HP Anda.</div>',
            confirmButtonColor: '#4f46e5'
        });
    };

    return (
        <div className="space-y-5 sm:space-y-8">
            {/* 1. JADWAL MENGAJAR HARI INI (Langsung Muncul di Posisi Teratas) */}
            {showSchedule && can('view_academic_schedules') && canViewAcademic && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                                        Jadwal KBM Hari Ini
                                    </h3>
                                    {schedule && schedule.length > 0 && (
                                        <span className="text-xs bg-indigo-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                                            {schedule.length} Mapel
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                                    {todayFormatted} • Langsung isi jurnal & absensi
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('academic.schedules.index')}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                        >
                            <span>Semua</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {schedule && schedule.length > 0 ? (
                        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {schedule.map((item, index) => {
                                const subjectId = item.active_subject_id || item.active_subject?.id;
                                const hourNumber = item.learning_hour?.hour_number || (index + 1);
                                const className = item.active_class?.grade?.name || item.active_class?.kelas?.name || item.active_class?.name || 'Kelas';

                                return (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Hour Badge */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex flex-col items-center justify-center shadow-md shadow-indigo-500/20">
                                                <span className="text-[10px] font-semibold uppercase leading-none opacity-80">Jam</span>
                                                <span className="text-base font-black leading-tight">{hourNumber}</span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                                    {item.active_subject?.mapel?.name || 'Mata Pelajaran'}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60">
                                                        {className}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        {item.learning_hour?.start_time || '-'} - {item.learning_hour?.end_time || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                            <Link
                                                href={route('journals.create', {
                                                    active_subject_id: subjectId,
                                                    jam_ke: hourNumber,
                                                })}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                                            >
                                                <FilePenLine className="w-4 h-4" />
                                                <span>Isi Jurnal</span>
                                            </Link>
                                            <Link
                                                href={route('assessments.index', { active_subject_id: subjectId })}
                                                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors active:scale-95 shrink-0"
                                                title="Input Nilai Mapel Ini"
                                            >
                                                <GraduationCap className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-border bg-card/60 text-center space-y-2">
                            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-sm text-foreground">Tidak Ada Jadwal Mengajar Hari Ini</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Hari ini Anda tidak memiliki jam KBM terjadwal. Anda dapat memanfaatkan waktu luang untuk evaluasi nilai atau melengkapi silabus.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 2. AKSES CEPAT & PINTASAN KBM (Mode Harian vs Periode & Kustomisasi Cepat) */}
            {showQuickActions && (
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                                    Akses Cepat
                                </h3>
                                <span className={cn(
                                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                                    filterMode === 'daily'
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : filterMode === 'period'
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        : "bg-primary/10 text-primary border-primary/20"
                                )}>
                                    {filterMode === 'daily' ? '⚡ Harian' : filterMode === 'period' ? '📅 Periode' : '🌟 Semua'}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground">
                                {filterMode === 'daily'
                                    ? 'Pintasan rutin sehari-hari'
                                    : filterMode === 'period'
                                    ? 'Pintasan musiman yang aktif saat periode penilaian/perencanaan'
                                    : 'Seluruh pintasan yang diaktifkan'}
                            </p>
                        </div>

                        {/* Segmented Filter Tab & Customize Modal Trigger */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <div className="inline-flex p-1 bg-muted/80 rounded-xl border border-border/60 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('daily')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg transition-all active:scale-95 text-xs font-bold",
                                        filterMode === 'daily'
                                            ? "bg-background text-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    ⚡ Harian
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('period')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg transition-all active:scale-95 text-xs font-bold",
                                        filterMode === 'period'
                                            ? "bg-background text-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    📅 Periode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange('all')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg transition-all active:scale-95 text-xs font-bold",
                                        filterMode === 'all'
                                            ? "bg-background text-foreground shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    🌟 Semua
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCustomizeOpen(true)}
                                className="p-2 rounded-xl border border-border/80 bg-card hover:bg-muted/70 text-foreground transition-all active:scale-95 shadow-2xs flex items-center justify-center"
                                title="Atur Pintasan Saya"
                                aria-label="Atur Pintasan Saya"
                            >
                                <SlidersHorizontal className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>
                    </div>

                    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-sm">
                        {visibleShortcuts.length > 0 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-4">
                                {visibleShortcuts.map((item) => {
                                    const IconComponent = item.icon;
                                    if (item.isAction) {
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={handleInstallClick}
                                                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg mb-1.5 group-hover:scale-105 transition-transform",
                                                    item.color,
                                                    "shadow-slate-500/25"
                                                )}>
                                                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                                <span className={cn(
                                                    "text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 transition-colors",
                                                    item.textColor
                                                )}>
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.route()}
                                            className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group text-center"
                                        >
                                            <div className={cn(
                                                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg mb-1.5 group-hover:scale-105 transition-transform",
                                                item.color,
                                                "shadow-indigo-500/20"
                                            )}>
                                                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                                            </div>
                                            <span className={cn(
                                                "text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 transition-colors",
                                                item.textColor
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center space-y-2.5">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Tidak ada pintasan yang aktif di kategori ini.
                                </p>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {filterMode !== 'all' && adminAllowedShortcuts.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleFilterChange('all')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition active:scale-95 border border-indigo-200 dark:border-indigo-800"
                                        >
                                            <span>Tampilkan Semua Pintasan ({adminAllowedShortcuts.length})</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomizeOpen(true)}
                                        className="text-xs font-bold text-primary hover:underline px-2 py-1"
                                    >
                                        Atur atau sesuaikan pintasan →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL ATUR PINTASAN SAYA */}
            <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <DialogContent className="max-w-md p-5 rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-primary" />
                            <span>Atur Pintasan Akses Cepat</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Pilih menu yang sedang aktif dipakai di periode kerja Anda saat ini.
                        </DialogDescription>
                    </DialogHeader>

                    {/* 1-Tap Quick Presets */}
                    <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Pilih Cepat Periode
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => applyPreset('daily')}
                                className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-left transition-all active:scale-95 flex flex-col gap-0.5"
                            >
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    ⚡ Rutin Harian
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Santri, Tahfidz, Skrining, AI
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('exams')}
                                className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-left transition-all active:scale-95 flex flex-col gap-0.5"
                            >
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    📝 Periode Ujian
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Input Nilai, Rekap & Rapor
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('semester_start')}
                                className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-left transition-all active:scale-95 flex flex-col gap-0.5"
                            >
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    📚 Awal Semester
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Silabus & Kalender KBM
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('all')}
                                className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-left transition-all active:scale-95 flex flex-col gap-0.5"
                            >
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    🌟 Tampilkan Semua
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    Aktifkan seluruh menu
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Checklist of Available Shortcuts */}
                    <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Kustomisasi Tiap Menu
                        </span>
                        <div className="divide-y divide-border/50 rounded-xl border border-border/80 bg-muted/10 overflow-hidden">
                            {adminAllowedShortcuts.map((shortcut) => {
                                const isChecked = !tempHidden.includes(shortcut.id);
                                const IconComp = shortcut.icon;
                                return (
                                    <label
                                        key={shortcut.id}
                                        className="flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shrink-0 shadow-xs",
                                                shortcut.color
                                            )}>
                                                <IconComp className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground leading-tight">
                                                    {shortcut.label}
                                                </p>
                                                <span className={cn(
                                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                                                    shortcut.category === 'daily'
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : shortcut.category === 'period'
                                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {shortcut.categoryLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleShortcut(shortcut.id)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter className="flex sm:justify-between items-center gap-2 pt-3 border-t border-border/50">
                        <button
                            type="button"
                            onClick={resetToDefault}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 active:scale-95 transition-all"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Standar</span>
                        </button>
                        <button
                            type="button"
                            onClick={saveCustomization}
                            className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 active:scale-95 transition-all"
                        >
                            Simpan & Terapkan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. STATISTIK BEBAN MENGAJAR (2 Kolom di Mobile, Warna Tajam) */}
            {showStats && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-foreground">Ringkasan Beban Ajar</h3>
                            <p className="text-xs text-muted-foreground">Statistik pengajaran semester aktif</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* 1. Kelas Diampu */}
                        {can('view_active_classes') && canViewAcademic && (
                            <Link href={route('active-classes.index', { my_classes: 1 })} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-4 sm:p-5 shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <Users className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Kelas</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <Users className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_classes || 0}</div>
                                        <p className="text-[11px] text-indigo-100 font-medium truncate mt-0.5">
                                            {stats.my_class_list?.length ? stats.my_class_list.join(', ') : 'Kelas diampu'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 2. Total Santri Ajar */}
                        {can('view_students') && canViewAcademic && (
                            <Link href={route('students.index', { my_students: 1, status: 'Aktif' })} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <GraduationCap className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Santri Ajar</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <GraduationCap className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_students || 0}</div>
                                        <p className="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                                            Santri terdaftar aktif
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 3. Mapel Diampu */}
                        {can('view_silabus') && canViewAcademic && (
                            <Link href={route('silabus.index')} className="block group">
                                <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-4 sm:p-5 shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                    <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                        <BookOpen className="w-16 h-16 -mr-4 -mt-4" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">Mata Pelajaran</span>
                                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <BookOpen className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="text-2xl sm:text-3xl font-black">{stats.my_subjects || 0}</div>
                                        <p className="text-[11px] text-amber-100 font-medium truncate mt-0.5">
                                            {stats.my_subject_list?.length ? stats.my_subject_list.join(', ') : 'Mapel diampu'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* 4. Skrining Hafalan */}
                        <Link href={route('tahfidz.pantau-skrining')} className="block group">
                            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white p-4 sm:p-5 shadow-lg shadow-violet-600/20 hover:shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
                                <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
                                    <Sparkles className="w-16 h-16 -mr-4 -mt-4" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">Skrining</span>
                                    <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                        <Book className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl sm:text-3xl font-black">{stats.skrining_today || 0}</div>
                                    <p className="text-[11px] text-violet-100 font-medium truncate mt-0.5">
                                        Aktivitas hari ini
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
