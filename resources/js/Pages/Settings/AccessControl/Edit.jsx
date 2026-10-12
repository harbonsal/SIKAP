import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft,
    Save,
    RotateCcw,
    Sparkles,
    CheckSquare,
    Square,
    Search,
    X,
    Shield,
    Check,
    SlidersHorizontal,
    GraduationCap,
    BarChart2,
    FileSpreadsheet,
    Award,
    Printer,
    FilePenLine,
    TrendingUp,
    CalendarRange,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    ShieldCheck,
    Cpu,
    UserCheck,
    Bot,
    LayoutDashboard,
    Book,
    FileText,
    LineChart,
    Users,
    Settings,
    BookOpenCheck,
    Heart,
    Home,
    Bed,
    UserPlus,
    Key,
    HeartPulse,
    Activity,
    Trophy,
    AlertTriangle,
    School,
    Wallet,
    Banknote,
    User,
    ClipboardCheck,
    Calendar,
    Layers,
    Split,
    BookMarked,
    Building,
    Scale,
    CalendarClock,
    HelpCircle,
    MapPin,
    KeyRound,
    Database,
    Eye,
    PlusCircle,
    Edit3,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

// Icon Map Registry for dynamic feature icons
const ICON_MAP = {
    GraduationCap,
    BarChart2,
    FileSpreadsheet,
    Award,
    Printer,
    FilePenLine,
    TrendingUp,
    CalendarRange,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock,
    ShieldCheck,
    Cpu,
    Sparkles,
    UserCheck,
    Bot,
    LayoutDashboard,
    Book,
    FileText,
    LineChart,
    Users,
    Settings,
    BookOpenCheck,
    Heart,
    Home,
    Bed,
    UserPlus,
    Key,
    HeartPulse,
    Activity,
    Trophy,
    AlertTriangle,
    School,
    Wallet,
    Banknote,
    User,
    ClipboardCheck,
    Calendar,
    Layers,
    Split,
    BookMarked,
    Building,
    Scale,
    CalendarClock,
    HelpCircle,
    MapPin,
    KeyRound,
    Database,
};

export default function Edit({ userLevel, allUserLevels = [], features = [], activePermissions = [] }) {
    // Current active permissions as a Set of strings
    const [selectedPermissions, setSelectedPermissions] = useState(() => new Set(activePermissions));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [isSaving, setIsSaving] = useState(false);

    // Initial state reference for detecting changes
    const initialPermissions = useMemo(() => new Set(activePermissions), [activePermissions]);

    // Track unsaved diff count
    const changeCount = useMemo(() => {
        let diff = 0;
        selectedPermissions.forEach((p) => {
            if (!initialPermissions.has(p)) diff++;
        });
        initialPermissions.forEach((p) => {
            if (!selectedPermissions.has(p)) diff++;
        });
        return diff;
    }, [selectedPermissions, initialPermissions]);

    // Unique Categories
    const categories = useMemo(() => {
        const set = new Set();
        features.forEach((f) => set.add(f.category));
        return ['ALL', ...Array.from(set)];
    }, [features]);

    // Filtered Features
    const filteredFeatures = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return features.filter((feat) => {
            const matchesCat = selectedCategory === 'ALL' || feat.category === selectedCategory;
            const matchesSearch =
                !q ||
                feat.name.toLowerCase().includes(q) ||
                (feat.description && feat.description.toLowerCase().includes(q)) ||
                feat.category.toLowerCase().includes(q) ||
                Object.values(feat.permission_keys || {}).some((k) => k.toLowerCase().includes(q));
            return matchesCat && matchesSearch;
        });
    }, [features, selectedCategory, searchQuery]);

    // Group filtered features by Category
    const groupedFeatures = useMemo(() => {
        const groups = {};
        filteredFeatures.forEach((feat) => {
            if (!groups[feat.category]) groups[feat.category] = [];
            groups[feat.category].push(feat);
        });
        return groups;
    }, [filteredFeatures]);

    // Toggle a single permission
    const togglePermission = (permKey) => {
        if (!permKey) return;
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(permKey)) {
                next.delete(permKey);
            } else {
                next.add(permKey);
            }
            return next;
        });
    };

    // Toggle entire row (feature)
    const setRowPermissions = (feature, enable) => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            Object.values(feature.permission_keys || {}).forEach((pName) => {
                if (enable) next.add(pName);
                else next.delete(pName);
            });
            return next;
        });
    };

    // Set row to view only
    const setRowReadOnly = (feature) => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            // remove all actions
            Object.values(feature.permission_keys || {}).forEach((pName) => next.delete(pName));
            // add view if available
            if (feature.permission_keys?.view) {
                next.add(feature.permission_keys.view);
            }
            return next;
        });
    };

    // Toggle entire column (action: 'create' | 'view' | 'edit' | 'delete')
    const setColumnPermissions = (action, enable) => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            filteredFeatures.forEach((feat) => {
                const permName = feat.permission_keys?.[action];
                if (permName) {
                    if (enable) next.add(permName);
                    else next.delete(permName);
                }
            });
            return next;
        });
    };

    // Check if column is fully checked
    const isColumnFullyChecked = (action) => {
        const relevantPerms = filteredFeatures
            .map((f) => f.permission_keys?.[action])
            .filter(Boolean);
        if (relevantPerms.length === 0) return false;
        return relevantPerms.every((p) => selectedPermissions.has(p));
    };

    // Batch Actions: Read-Only for all visible
    const handleCheckAllReadOnly = () => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            filteredFeatures.forEach((feat) => {
                if (feat.permission_keys?.view) {
                    next.add(feat.permission_keys.view);
                }
            });
            return next;
        });
        Swal.fire({
            icon: 'info',
            title: 'Hanya Baca (Read-Only) Dipilih',
            text: 'Semua izin Membaca/Mencari (view) telah dicentang.',
            timer: 1600,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Batch Actions: Select All CRUD
    const handleCheckAllCRUD = () => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            filteredFeatures.forEach((feat) => {
                Object.values(feat.permission_keys || {}).forEach((p) => next.add(p));
            });
            return next;
        });
        Swal.fire({
            icon: 'success',
            title: 'Semua CRUD Dipilih',
            text: 'Seluruh izin fitur yang tampil telah dicentang.',
            timer: 1600,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Batch Actions: Clear All
    const handleClearAll = () => {
        setSelectedPermissions((prev) => {
            const next = new Set(prev);
            filteredFeatures.forEach((feat) => {
                Object.values(feat.permission_keys || {}).forEach((p) => next.delete(p));
            });
            return next;
        });
        Swal.fire({
            icon: 'info',
            title: 'Dikosongkan',
            text: 'Seluruh izin fitur telah dihapus centangnya.',
            timer: 1600,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Reset back to initial loaded state
    const handleReset = () => {
        setSelectedPermissions(new Set(initialPermissions));
        Swal.fire({
            icon: 'info',
            title: 'Perubahan Direset',
            text: 'Izin dikembalikan ke kondisi terakhir tersimpan.',
            timer: 1600,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Standard Preset Recommendations by Role
    const applyStandardPreset = () => {
        const role = userLevel.name;
        const next = new Set();

        // 1. GURU
        if (role === 'Guru') {
            const guruPerms = [
                'view_assessments', 'create_assessments', 'edit_assessments',
                'view_journals', 'create_journals', 'edit_journals',
                'view_silabus', 'create_silabus', 'edit_silabus',
                'view_academic_schedules', 'view_supervision_rpps', 'view_pickets',
                'view_active_subjects', 'view_students', 'view_class_members',
                'view_tahfidz_halaqoh', 'view_quran_tilawah', 'use_ikhtabir_ai'
            ];
            guruPerms.forEach((p) => next.add(p));
        }
        // 2. WALI KELAS
        else if (role === 'Wali Kelas') {
            const waliPerms = [
                // Guru standard
                'view_assessments', 'create_assessments', 'edit_assessments',
                'view_journals', 'create_journals', 'edit_journals',
                'view_silabus', 'create_silabus', 'edit_silabus',
                'view_academic_schedules', 'view_students', 'view_class_members',
                // Homeroom class-wide view & reports
                'view_grade_recap', 'view_student_recap', 'view_reports',
                'create_report_notes', 'view_learning_analysis',
                'view_active_classes', 'view_permissions', 'create_permissions',
                'view_health_records', 'view_character_assessments', 'create_character_assessments',
                'view_character_recap', 'view_achievements', 'create_achievements',
                'view_violations', 'create_violations'
            ];
            waliPerms.forEach((p) => next.add(p));
        }
        // 3. MUSRIF / PEMBINA ASRAMA
        else if (role.includes('Musrif') || role.includes('Asrama')) {
            const musrifPerms = [
                'view_kamars', 'view_kamar_members', 'create_kamar_members',
                'view_active_kamars', 'view_students',
                'view_permissions', 'create_permissions', 'edit_permissions',
                'view_health_records', 'create_health_record', 'view_health_stats',
                'view_character_assessments', 'create_character_assessments', 'edit_character_assessments',
                'view_character_recap', 'view_achievements', 'create_achievements',
                'view_violations', 'create_violations', 'use_rfid_scanner',
                'view_tahfidz_halaqoh', 'view_quran_tilawah'
            ];
            musrifPerms.forEach((p) => next.add(p));
        }
        // 4. SANTRI
        else if (role === 'Santri') {
            const santriPerms = [
                'view_own_biodata', 'view_own_grades', 'view_own_schedule',
                'view_own_finance', 'use_ikhtabir_ai', 'view_quran_tilawah'
            ];
            santriPerms.forEach((p) => next.add(p));
        }
        // 5. KEPALA SEKOLAH / MANAGER
        else if (role.includes('Kepala') || role.includes('Manager')) {
            // Give all view permissions across all features
            features.forEach((feat) => {
                if (feat.permission_keys?.view) next.add(feat.permission_keys.view);
            });
            // Plus reports & supervisions
            ['create_supervisions', 'edit_supervisions', 'view_supervisions', 'use_supervision_ai'].forEach((p) => next.add(p));
        }
        // DEFAULT FALLBACK
        else {
            features.forEach((feat) => {
                if (feat.permission_keys?.view) next.add(feat.permission_keys.view);
            });
        }

        setSelectedPermissions(next);
        Swal.fire({
            icon: 'success',
            title: `Preset '${role}' Diterapkan`,
            text: 'Hak akses disetel sesuai standar rekomendasi sistem. Klik "Simpan Hak Akses" untuk menerapkan.',
            timer: 2400,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Save permissions to server
    const handleSave = () => {
        setIsSaving(true);
        router.post(
            route('settings.access-control.bulk-update'),
            {
                user_level_id: userLevel.id,
                permissions: Array.from(selectedPermissions),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Hak Akses Berhasil Disimpan',
                        text: `Pengaturan izin untuk '${userLevel.name}' telah diperbarui dan menu induk otomatis disinkronkan.`,
                        timer: 2500,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end',
                    });
                },
                onError: () => {
                    setIsSaving(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan',
                        text: 'Terjadi kesalahan saat menyimpan pengaturan hak akses.',
                    });
                },
            }
        );
    };

    return (
        <MainLayout>
            <Head title={`Atur Hak Akses: ${userLevel.name}`} />

            <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
                {/* Header Title & Role Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('settings.access-control.index', { tab: 'roles' })}
                            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
                            title="Kembali ke Manajemen Akses"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                    Matriks Hak Akses: <span className="text-indigo-600 dark:text-indigo-400">{userLevel.name}</span>
                                </h1>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    {userLevel.category || 'Role'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Atur izin CRUD (Create, View, Edit, Delete) seluruh menu & fitur sistem untuk level pengguna ini.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Shortcut to Dashboard Shortcuts for this role */}
                        <Link
                            href={route('settings.access-control.index', { tab: 'quick-access', role_id: userLevel.id })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition shadow-2xs whitespace-nowrap active:scale-95"
                            title="Atur Pintasan Dashboard untuk Role Ini"
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Pintasan Dashboard</span>
                        </Link>

                        {/* Quick Role Switcher Tabs */}
                        {allUserLevels.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-muted/60 p-1.5 rounded-2xl border border-border">
                                <span className="text-[11px] font-bold text-muted-foreground px-2 whitespace-nowrap">
                                    Ganti Role:
                                </span>
                                {allUserLevels.map((lvl) => {
                                    const isCurrent = lvl.id === userLevel.id;
                                    return (
                                        <Link
                                            key={lvl.id}
                                            href={route('settings.access-control.edit', lvl.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95",
                                                isCurrent
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background border border-border/50"
                                            )}
                                        >
                                            {lvl.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Toolbar */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Filter */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama menu, fitur, atau kode izin..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Quick Presets & Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={applyStandardPreset}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                                title="Setel hak akses sesuai rekomendasi standar peran ini"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Preset Standar ({userLevel.name})</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCheckAllReadOnly}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all active:scale-95"
                                title="Centang semua aksi Membaca/Mencari (view) pada tabel"
                            >
                                <Eye className="w-3.5 h-3.5 text-blue-500" />
                                <span>Hanya Baca (Read-Only)</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCheckAllCRUD}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all active:scale-95"
                                title="Centang semua hak akses yang tersedia"
                            >
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Pilih Semua CRUD</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-destructive transition-all active:scale-95"
                                title="Kosongkan semua centang"
                            >
                                <Square className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Kosongkan</span>
                            </button>

                            {changeCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-amber-600 transition-all active:scale-95"
                                    title="Kembalikan ke kondisi sebelum diedit"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset ({changeCount})</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95",
                                    changeCount > 0
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/25 ring-2 ring-indigo-400/40"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                )}
                            >
                                <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
                                <span>{isSaving ? 'Menyimpan...' : changeCount > 0 ? `Simpan (${changeCount} Diubah)` : 'Simpan Hak Akses'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-border/60">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap",
                                    selectedCategory === cat
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {cat === 'ALL' ? '🌟 Seluruh Fitur' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Excel-like CRUD Matrix Table */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto max-h-[72vh] overflow-y-auto no-scrollbar relative">
                        <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                            {/* Sticky Table Header */}
                            <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-foreground border-b border-border shadow-xs">
                                <tr>
                                    {/* Column 0: No */}
                                    <th className="px-3 py-3.5 w-12 text-center font-extrabold border-r border-border">
                                        No
                                    </th>

                                    {/* Column 1: Menu / Feature */}
                                    <th className="px-4 py-3.5 min-w-[320px] sm:min-w-[400px] border-r border-border font-bold">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-extrabold text-foreground">
                                                    Menu & Fitur Sistem
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-normal">
                                                    Daftar modul lengkap dari seluruh divisi sistem
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background border border-border">
                                                {filteredFeatures.length} Fitur
                                            </span>
                                        </div>
                                    </th>

                                    {/* Column 2: Create (Membuat/Menambah) */}
                                    <th className="px-3 py-3 text-center min-w-[130px] border-r border-border/80 align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                                                <PlusCircle className="w-3.5 h-3.5" />
                                                <span>Tambah / Buat</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                (create)
                                            </div>
                                            <div className="pt-1 flex items-center justify-center gap-1 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('create', true)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                    title="Centang semua aksi create"
                                                >
                                                    + Semua
                                                </button>
                                                <span className="text-muted-foreground/40">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('create', false)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground hover:text-destructive"
                                                    title="Hapus semua aksi create"
                                                >
                                                    - Batal
                                                </button>
                                            </div>
                                        </div>
                                    </th>

                                    {/* Column 3: View (Membaca/Mencari) */}
                                    <th className="px-3 py-3 text-center min-w-[130px] border-r border-border/80 align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-1.5 text-blue-700 dark:text-blue-400 font-extrabold text-xs">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Baca / Cari</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                (view)
                                            </div>
                                            <div className="pt-1 flex items-center justify-center gap-1 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('view', true)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                    title="Centang semua aksi view"
                                                >
                                                    + Semua
                                                </button>
                                                <span className="text-muted-foreground/40">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('view', false)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground hover:text-destructive"
                                                    title="Hapus semua aksi view"
                                                >
                                                    - Batal
                                                </button>
                                            </div>
                                        </div>
                                    </th>

                                    {/* Column 4: Edit (Mengubah/Edit) */}
                                    <th className="px-3 py-3 text-center min-w-[130px] border-r border-border/80 align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Ubah / Edit</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                (edit)
                                            </div>
                                            <div className="pt-1 flex items-center justify-center gap-1 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('edit', true)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                    title="Centang semua aksi edit"
                                                >
                                                    + Semua
                                                </button>
                                                <span className="text-muted-foreground/40">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('edit', false)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground hover:text-destructive"
                                                    title="Hapus semua aksi edit"
                                                >
                                                    - Batal
                                                </button>
                                            </div>
                                        </div>
                                    </th>

                                    {/* Column 5: Delete (Menghapus) */}
                                    <th className="px-3 py-3 text-center min-w-[130px] border-r border-border/80 align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-1.5 text-rose-700 dark:text-rose-400 font-extrabold text-xs">
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Hapus / Delet</span>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                (delete)
                                            </div>
                                            <div className="pt-1 flex items-center justify-center gap-1 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('delete', true)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                    title="Centang semua aksi delete"
                                                >
                                                    + Semua
                                                </button>
                                                <span className="text-muted-foreground/40">•</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setColumnPermissions('delete', false)}
                                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground hover:text-destructive"
                                                    title="Hapus semua aksi delete"
                                                >
                                                    - Batal
                                                </button>
                                            </div>
                                        </div>
                                    </th>

                                    {/* Column 6: Row Actions */}
                                    <th className="px-3 py-3.5 text-center min-w-[140px] font-bold">
                                        Aksi Baris
                                    </th>
                                </tr>
                            </thead>

                            {/* Table Body Grouped by Category */}
                            <tbody className="divide-y divide-border/60">
                                {Object.entries(groupedFeatures).map(([categoryName, catFeatures], groupIndex) => (
                                    <div key={categoryName} style={{ display: 'contents' }}>
                                        {/* Category Header Row */}
                                        <tr className="bg-muted/40 font-bold border-t-2 border-border/80">
                                            <td
                                                colSpan={7}
                                                className="px-4 py-2.5 text-xs font-black tracking-wide text-foreground uppercase bg-muted/70 backdrop-blur-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                        <span>{categoryName}</span>
                                                        <span className="text-[10px] text-muted-foreground font-normal lowercase">
                                                            ({catFeatures.length} fitur)
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Features in this Category */}
                                        {catFeatures.map((feat, featIdx) => {
                                            const IconComp = ICON_MAP[feat.icon] || Layers;
                                            const createKey = feat.permission_keys?.create;
                                            const viewKey = feat.permission_keys?.view;
                                            const editKey = feat.permission_keys?.edit;
                                            const deleteKey = feat.permission_keys?.delete;

                                            const isCreateChecked = createKey ? selectedPermissions.has(createKey) : false;
                                            const isViewChecked = viewKey ? selectedPermissions.has(viewKey) : false;
                                            const isEditChecked = editKey ? selectedPermissions.has(editKey) : false;
                                            const isDeleteChecked = deleteKey ? selectedPermissions.has(deleteKey) : false;

                                            const hasAnyChecked = isCreateChecked || isViewChecked || isEditChecked || isDeleteChecked;

                                            return (
                                                <tr
                                                    key={feat.id}
                                                    className={cn(
                                                        "transition-colors group hover:bg-muted/30",
                                                        hasAnyChecked ? "bg-indigo-500/[0.02]" : ""
                                                    )}
                                                >
                                                    {/* Col 0: No */}
                                                    <td className="px-3 py-3 text-center text-muted-foreground font-semibold border-r border-border/60">
                                                        {featIdx + 1}
                                                    </td>

                                                    {/* Col 1: Feature Title & Description */}
                                                    <td className="px-4 py-3 border-r border-border shadow-xs">
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-xl transition-colors shrink-0 mt-0.5",
                                                                hasAnyChecked
                                                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                                    : "bg-muted text-muted-foreground group-hover:text-foreground"
                                                            )}>
                                                                <IconComp className="w-4 h-4" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <div className="font-extrabold text-xs sm:text-sm text-foreground flex items-center gap-2">
                                                                    <span>{feat.name}</span>
                                                                    {feat.parent_menu && (
                                                                        <span className="text-[9px] font-mono font-normal text-muted-foreground/70 bg-muted px-1.5 py-0.2 rounded" title={`Menu Induk: ${feat.parent_menu}`}>
                                                                            {feat.parent_menu}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground line-clamp-1">
                                                                    {feat.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Col 2: CREATE Checkbox */}
                                                    <td
                                                        onClick={() => createKey && togglePermission(createKey)}
                                                        className={cn(
                                                            "px-3 py-3 text-center border-r border-border/50 select-none transition-colors",
                                                            createKey ? "cursor-pointer hover:bg-emerald-500/5" : "bg-muted/10 text-muted-foreground/40",
                                                            isCreateChecked ? "bg-emerald-500/5" : ""
                                                        )}
                                                    >
                                                        {createKey ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                                                    isCreateChecked
                                                                        ? "bg-emerald-600 border-emerald-600 text-white scale-105"
                                                                        : "border-muted-foreground/30 bg-background hover:border-emerald-500"
                                                                )}>
                                                                    {isCreateChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                </div>
                                                                <span className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1" title={createKey}>
                                                                    {createKey}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 font-bold">—</span>
                                                        )}
                                                    </td>

                                                    {/* Col 3: VIEW Checkbox */}
                                                    <td
                                                        onClick={() => viewKey && togglePermission(viewKey)}
                                                        className={cn(
                                                            "px-3 py-3 text-center border-r border-border/50 select-none transition-colors",
                                                            viewKey ? "cursor-pointer hover:bg-blue-500/5" : "bg-muted/10 text-muted-foreground/40",
                                                            isViewChecked ? "bg-blue-500/5" : ""
                                                        )}
                                                    >
                                                        {viewKey ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                                                    isViewChecked
                                                                        ? "bg-blue-600 border-blue-600 text-white scale-105"
                                                                        : "border-muted-foreground/30 bg-background hover:border-blue-500"
                                                                )}>
                                                                    {isViewChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                </div>
                                                                <span className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1" title={viewKey}>
                                                                    {viewKey}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 font-bold">—</span>
                                                        )}
                                                    </td>

                                                    {/* Col 4: EDIT Checkbox */}
                                                    <td
                                                        onClick={() => editKey && togglePermission(editKey)}
                                                        className={cn(
                                                            "px-3 py-3 text-center border-r border-border/50 select-none transition-colors",
                                                            editKey ? "cursor-pointer hover:bg-amber-500/5" : "bg-muted/10 text-muted-foreground/40",
                                                            isEditChecked ? "bg-amber-500/5" : ""
                                                        )}
                                                    >
                                                        {editKey ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                                                    isEditChecked
                                                                        ? "bg-amber-600 border-amber-600 text-white scale-105"
                                                                        : "border-muted-foreground/30 bg-background hover:border-amber-500"
                                                                )}>
                                                                    {isEditChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                </div>
                                                                <span className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1" title={editKey}>
                                                                    {editKey}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 font-bold">—</span>
                                                        )}
                                                    </td>

                                                    {/* Col 5: DELETE Checkbox */}
                                                    <td
                                                        onClick={() => deleteKey && togglePermission(deleteKey)}
                                                        className={cn(
                                                            "px-3 py-3 text-center border-r border-border/50 select-none transition-colors",
                                                            deleteKey ? "cursor-pointer hover:bg-rose-500/5" : "bg-muted/10 text-muted-foreground/40",
                                                            isDeleteChecked ? "bg-rose-500/5" : ""
                                                        )}
                                                    >
                                                        {deleteKey ? (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                                                    isDeleteChecked
                                                                        ? "bg-rose-600 border-rose-600 text-white scale-105"
                                                                        : "border-muted-foreground/30 bg-background hover:border-rose-500"
                                                                )}>
                                                                    {isDeleteChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                </div>
                                                                <span className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1" title={deleteKey}>
                                                                    {deleteKey}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 font-bold">—</span>
                                                        )}
                                                    </td>

                                                    {/* Col 6: Row Quick Toggles */}
                                                    <td className="px-3 py-3 text-center align-middle">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setRowPermissions(feat, true)}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                                title="Centang semua aksi fitur ini"
                                                            >
                                                                Semua
                                                            </button>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRowReadOnly(feat)}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                                                title="Hanya centang aksi Baca/View"
                                                            >
                                                                Baca
                                                            </button>
                                                            <span className="text-muted-foreground/30">•</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setRowPermissions(feat, false)}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                title="Kosongkan fitur ini"
                                                            >
                                                                Batal
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </div>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Status & Sticky Save Bar */}
                    <div className="p-4 bg-muted/80 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-extrabold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                                    {selectedPermissions.size}
                                </span>
                                <span>Izin Aktif</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>Tambah (Create)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span>Baca (View)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span>Ubah (Edit)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span>Hapus (Delete)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {changeCount > 0 && (
                                <span className="text-amber-600 font-bold animate-pulse">
                                    ⚡ {changeCount} izin diubah
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50",
                                    changeCount > 0
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/25"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                )}
                            >
                                {isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
