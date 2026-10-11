import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    CalendarDays,
    GraduationCap,
    BookOpen,
    BarChart2,
    FileText,
    Clock,
    CalendarRange,
    Book,
    Sparkles,
    Bot,
    BookOpenCheck,
    Users,
    Key,
    HeartPulse,
    UserCheck,
    Wallet,
    Download,
    LayoutDashboard,
    Layers,
    CalendarCheck,
    School,
    Bell,
    Check,
    X,
    Shield,
    SlidersHorizontal,
    Save,
    RotateCcw,
    AlertTriangle,
    Search,
    Lock,
    Unlock,
    CheckCircle2,
    CheckSquare,
    Square,
    ExternalLink,
    HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

// Icon Map Registry
const ICON_MAP = {
    CalendarDays,
    GraduationCap,
    BookOpen,
    BarChart2,
    FileText,
    Clock,
    CalendarRange,
    Book,
    Sparkles,
    Bot,
    BookOpenCheck,
    Users,
    Key,
    HeartPulse,
    UserCheck,
    Wallet,
    Download,
    LayoutDashboard,
    Layers,
    CalendarCheck,
    School,
    Bell,
};

export default function Index({ userLevels = [], features = [], currentTab = 'quick-access' }) {
    const [activeTab, setActiveTab] = useState(currentTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [autoSyncPermissions, setAutoSyncPermissions] = useState(true);

    // Initial matrix mapping: { [userLevelId]: { [featureKey]: boolean } }
    const initialMatrix = useMemo(() => {
        const matrix = {};
        userLevels.forEach((level) => {
            matrix[level.id] = {};
            const levelWidgets = level.widgets || {};
            features.forEach((feat) => {
                // Check if explicitly set in widgets
                if (levelWidgets[feat.key] !== undefined) {
                    matrix[level.id][feat.key] = Boolean(levelWidgets[feat.key]);
                } else if (levelWidgets[feat.alias] !== undefined) {
                    matrix[level.id][feat.key] = Boolean(levelWidgets[feat.alias]);
                } else {
                    // Fallback to default recommendation
                    const isDefault = Array.isArray(feat.default_for) && feat.default_for.includes(level.name);
                    matrix[level.id][feat.key] = isDefault;
                }
            });
        });
        return matrix;
    }, [userLevels, features]);

    // Local state for interactive matrix edits
    const [matrix, setMatrix] = useState(initialMatrix);
    const [isSaving, setIsSaving] = useState(false);

    // Compute change count compared to initialMatrix
    const changeCount = useMemo(() => {
        let diff = 0;
        userLevels.forEach((level) => {
            features.forEach((feat) => {
                if (matrix[level.id]?.[feat.key] !== initialMatrix[level.id]?.[feat.key]) {
                    diff++;
                }
            });
        });
        return diff;
    }, [matrix, initialMatrix, userLevels, features]);

    // Extract categories
    const categories = useMemo(() => {
        const set = new Set();
        features.forEach((f) => set.add(f.category));
        return ['ALL', ...Array.from(set)];
    }, [features]);

    // Filter features
    const filteredFeatures = useMemo(() => {
        return features.filter((feat) => {
            const matchesCategory = selectedCategory === 'ALL' || feat.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                feat.label.toLowerCase().includes(q) ||
                feat.description?.toLowerCase().includes(q) ||
                feat.category.toLowerCase().includes(q) ||
                (feat.required_permission && feat.required_permission.toLowerCase().includes(q));
            return matchesCategory && matchesSearch;
        });
    }, [features, selectedCategory, searchQuery]);

    // Group filtered features by category
    const groupedFilteredFeatures = useMemo(() => {
        const groups = {};
        filteredFeatures.forEach((feat) => {
            if (!groups[feat.category]) groups[feat.category] = [];
            groups[feat.category].push(feat);
        });
        return groups;
    }, [filteredFeatures]);

    // Toggle individual matrix cell
    const toggleCell = (levelId, featureKey) => {
        setMatrix((prev) => ({
            ...prev,
            [levelId]: {
                ...prev[levelId],
                [featureKey]: !prev[levelId]?.[featureKey],
            },
        }));
    };

    // Toggle column (role) all
    const setColumnValue = (levelId, value) => {
        setMatrix((prev) => {
            const updatedLevel = { ...prev[levelId] };
            filteredFeatures.forEach((feat) => {
                updatedLevel[feat.key] = value;
            });
            return {
                ...prev,
                [levelId]: updatedLevel,
            };
        });
    };

    // Toggle row (feature) all
    const setRowValue = (featureKey, value) => {
        setMatrix((prev) => {
            const updated = { ...prev };
            userLevels.forEach((level) => {
                updated[level.id] = {
                    ...updated[level.id],
                    [featureKey]: value,
                };
            });
            return updated;
        });
    };

    // Reset back to initial
    const handleReset = () => {
        setMatrix(initialMatrix);
        Swal.fire({
            icon: 'info',
            title: 'Direset',
            text: 'Perubahan dikembalikan ke pengaturan terakhir yang tersimpan.',
            timer: 1800,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Apply system recommended presets
    const handleApplyRecommended = () => {
        const recMatrix = {};
        userLevels.forEach((level) => {
            recMatrix[level.id] = {};
            features.forEach((feat) => {
                const isRec = Array.isArray(feat.default_for) && feat.default_for.includes(level.name);
                recMatrix[level.id][feat.key] = isRec;
            });
        });
        setMatrix(recMatrix);
        Swal.fire({
            icon: 'success',
            title: 'Preset Sistem Diterapkan',
            text: 'Matriks akses cepat disetel sesuai rekomendasi standar peran. Jangan lupa klik Simpan.',
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Save matrix to backend
    const handleSave = () => {
        setIsSaving(true);
        router.post(
            route('settings.access-control.quick-access-matrix'),
            {
                matrix,
                auto_sync_permissions: autoSyncPermissions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Matriks Berhasil Disimpan',
                        text: autoSyncPermissions
                            ? 'Pengaturan akses cepat & izin fitur otomatis disinkronkan ke role.'
                            : 'Pengaturan akses cepat berhasil disimpan ke database.',
                        timer: 2500,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end',
                    });
                },
                onError: (err) => {
                    setIsSaving(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan',
                        text: 'Terjadi kesalahan saat menyimpan pengaturan matriks.',
                    });
                },
            }
        );
    };

    return (
        <MainLayout>
            <Head title="Manajemen Akses & Pintasan Cepat" />

            <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
                {/* Header Title & Tab Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                    Manajemen Akses & Pintasan Cepat
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Kelola matriks akses cepat dashboard dan hak izin per level pengguna dalam satu halaman.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 self-start lg:self-auto bg-muted/60 p-1.5 rounded-2xl border border-border">
                        <button
                            type="button"
                            onClick={() => setActiveTab('quick-access')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95",
                                activeTab === 'quick-access'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50 text-indigo-600 dark:text-indigo-400"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Matriks Akses Cepat</span>
                            {changeCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse">
                                    {changeCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('permissions')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95",
                                activeTab === 'permissions'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50 text-indigo-600 dark:text-indigo-400"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Key className="w-4 h-4" />
                            <span>Hak Izin CRUD Detail</span>
                        </button>
                    </div>
                </div>

                {/* TAB 1: MATRIKS AKSES CEPAT */}
                {activeTab === 'quick-access' && (
                    <div className="space-y-4">
                        {/* Control Toolbar */}
                        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search Box */}
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari fitur, menu, atau syarat izin..."
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

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleApplyRecommended}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all active:scale-95"
                                        title="Kembalikan ke susunan rekomendasi standar sistem"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Preset Rekomendasi</span>
                                    </button>

                                    {changeCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95"
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
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
                                        <span>{isSaving ? 'Menyimpan...' : changeCount > 0 ? `Simpan (${changeCount} Perubahan)` : 'Simpan Pengaturan'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Category Filter Pills & Auto Sync Toggle */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-border/60">
                                {/* Categories */}
                                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                                            {cat === 'ALL' ? '🌟 Semua Fitur' : cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Auto-Sync Permissions Toggle Switch */}
                                <label className="inline-flex items-center gap-2.5 cursor-pointer bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-xl border border-border/80 transition-colors shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={autoSyncPermissions}
                                        onChange={(e) => setAutoSyncPermissions(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        "w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5",
                                        autoSyncPermissions ? "bg-indigo-600" : "bg-muted-foreground/30"
                                    )}>
                                        <div className={cn(
                                            "w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-xs",
                                            autoSyncPermissions ? "translate-x-3.5" : "translate-x-0"
                                        )} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Otomatis Sinkronkan Izin Role</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline" title="Bila dicentang, role akan otomatis diberi izin yang diperlukan saat fitur diaktifkan">
                                        (Cegah 403 Forbidden)
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Interactive Matrix Table */}
                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
                            <div className="overflow-x-auto max-h-[72vh] overflow-y-auto no-scrollbar relative">
                                <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                                    {/* Sticky Table Header */}
                                    <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-foreground border-b border-border shadow-xs">
                                        <tr>
                                            {/* Column 1: Feature / Menu */}
                                            <th className="sticky left-0 z-40 bg-muted/95 backdrop-blur-md px-4 py-3.5 min-w-[280px] sm:min-w-[340px] border-r border-border font-bold">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-extrabold text-foreground">
                                                            Fitur & Menu Akses Cepat
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-normal">
                                                            Urutan vertikal fitur vs kelompok role
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background border border-border">
                                                        {filteredFeatures.length} Menu
                                                    </span>
                                                </div>
                                            </th>

                                            {/* Role Columns (Horizontal X-Axis) */}
                                            {userLevels.map((level) => {
                                                const isAdmin = level.name === 'Administrator';
                                                return (
                                                    <th
                                                        key={level.id}
                                                        className="px-3 py-3 text-center min-w-[130px] sm:min-w-[150px] border-r border-border/70 last:border-r-0 align-top"
                                                    >
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-[120px]" title={level.name}>
                                                                    {level.name}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={cn(
                                                                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border",
                                                                    level.dashboard_type === 'Teacher'
                                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                                        : level.dashboard_type === 'Student'
                                                                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                                        : level.dashboard_type === 'Admin'
                                                                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                                                        : "bg-muted text-muted-foreground border-border"
                                                                )}>
                                                                    {level.dashboard_type || 'Default'}
                                                                </span>
                                                                <span className="text-[9px] text-muted-foreground">
                                                                    ({level.category})
                                                                </span>
                                                            </div>

                                                            {/* Quick Column Toggles */}
                                                            <div className="flex items-center justify-center gap-1 pt-1 border-t border-border/40">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setColumnValue(level.id, true)}
                                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                                    title={`Centang semua fitur untuk ${level.name}`}
                                                                >
                                                                    Semua
                                                                </button>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setColumnValue(level.id, false)}
                                                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                    title={`Kosongkan semua fitur untuk ${level.name}`}
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    {/* Table Body Grouped by Category */}
                                    <tbody className="divide-y divide-border/60">
                                        {Object.entries(groupedFilteredFeatures).map(([categoryName, catFeatures]) => (
                                            <div key={categoryName} style={{ display: 'contents' }}>
                                                {/* Category Section Header Row */}
                                                <tr className="bg-muted/40 font-bold border-t-2 border-border/80">
                                                    <td
                                                        colSpan={userLevels.length + 1}
                                                        className="sticky left-0 z-20 px-4 py-2 text-xs font-black tracking-wide text-foreground uppercase bg-muted/60 backdrop-blur-sm"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                                <span>{categoryName}</span>
                                                                <span className="text-[10px] text-muted-foreground font-normal lowercase">
                                                                    ({catFeatures.length} menu)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Feature Rows */}
                                                {catFeatures.map((feat) => {
                                                    const IconComponent = ICON_MAP[feat.icon] || LayoutDashboard;
                                                    return (
                                                        <tr
                                                            key={feat.key}
                                                            className="hover:bg-muted/30 transition-colors group"
                                                        >
                                                            {/* Sticky Left: Feature Info */}
                                                            <td className="sticky left-0 z-20 bg-card group-hover:bg-muted/40 transition-colors px-4 py-3 border-r border-border shadow-xs">
                                                                <div className="flex items-start justify-between gap-2.5">
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="p-2 rounded-xl bg-muted group-hover:bg-indigo-500/10 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5">
                                                                            <IconComponent className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="space-y-0.5">
                                                                            <div className="font-bold text-xs sm:text-sm text-foreground">
                                                                                {feat.label}
                                                                            </div>
                                                                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                                                                                {feat.description}
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 pt-0.5">
                                                                                {feat.required_permission ? (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20" title={`Fitur ini membutuhkan hak akses: ${feat.required_permission}`}>
                                                                                        <Lock className="w-2.5 h-2.5" />
                                                                                        <span>{feat.required_permission}</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border/50">
                                                                                        <Unlock className="w-2.5 h-2.5" />
                                                                                        <span>Umum</span>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mini Row Toggle */}
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 shrink-0 self-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setRowValue(feat.key, true)}
                                                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-600 transition-colors"
                                                                            title="Centang fitur ini untuk semua role"
                                                                        >
                                                                            + Semua
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setRowValue(feat.key, false)}
                                                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                                            title="Hapus centang fitur ini di semua role"
                                                                        >
                                                                            - Batal
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Role Checkbox Cells */}
                                                            {userLevels.map((level) => {
                                                                const isChecked = Boolean(matrix[level.id]?.[feat.key]);
                                                                const isAdmin = level.name === 'Administrator';
                                                                const hasPermission =
                                                                    isAdmin ||
                                                                    !feat.required_permission ||
                                                                    level.permission_names?.includes(feat.required_permission);

                                                                return (
                                                                    <td
                                                                        key={`${level.id}-${feat.key}`}
                                                                        onClick={() => toggleCell(level.id, feat.key)}
                                                                        className={cn(
                                                                            "px-3 py-3 text-center border-r border-border/50 last:border-r-0 cursor-pointer transition-colors relative select-none",
                                                                            isChecked
                                                                                ? "bg-indigo-500/5 hover:bg-indigo-500/10"
                                                                                : "hover:bg-muted/40"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                                            {/* Checkbox Icon */}
                                                                            <div className={cn(
                                                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shadow-2xs",
                                                                                isChecked
                                                                                    ? "bg-indigo-600 border-indigo-600 text-white scale-105"
                                                                                    : "border-muted-foreground/30 bg-background hover:border-indigo-400"
                                                                            )}>
                                                                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                                            </div>

                                                                            {/* Role Restriction Indicator */}
                                                                            {isChecked && feat.required_permission && !isAdmin && (
                                                                                <span
                                                                                    className={cn(
                                                                                        "text-[9px] font-bold px-1 rounded flex items-center gap-0.5",
                                                                                        hasPermission
                                                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                                                            : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                                                                    )}
                                                                                    title={
                                                                                        hasPermission
                                                                                            ? `Role ${level.name} memiliki izin ${feat.required_permission}`
                                                                                            : `Role ${level.name} belum memiliki izin ${feat.required_permission} (${autoSyncPermissions ? 'Otomatis disinkronkan saat disimpan' : 'Perlu diizinkan'})`
                                                                                    }
                                                                                >
                                                                                    {hasPermission ? (
                                                                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                                                                    ) : (
                                                                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                                                                    )}
                                                                                    <span className="hidden xl:inline">
                                                                                        {hasPermission ? 'Izin OK' : 'Sinkron'}
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Sticky Bottom Summary Bar */}
                            <div className="p-3.5 bg-muted/70 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 rounded bg-indigo-600 flex items-center justify-center text-white text-[9px]">✓</div>
                                        <span>Aktif di Role</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Izin Terpenuhi</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Perlu Izin / Auto-Sync</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {changeCount > 0 && (
                                        <span className="text-amber-600 font-bold">
                                            {changeCount} sel diubah
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Menyimpan...' : 'Simpan Matriks'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: HAK AKSES DETAIL PER ROLE */}
                {activeTab === 'permissions' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Daftar Level Pengguna & Konfigurasi Izin
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Pilih role untuk mengatur izin granular (View, Create, Edit, Delete) tiap modul sistem.
                                </p>
                            </div>
                            <Link
                                href={route('user-levels.index')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Master Level Pengguna</span>
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm text-left">
                                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-bold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3.5 w-16 text-center">No</th>
                                            <th className="px-6 py-3.5">Nama Level Pengguna</th>
                                            <th className="px-6 py-3.5">Kategori</th>
                                            <th className="px-6 py-3.5">Tipe Dashboard</th>
                                            <th className="px-6 py-3.5 text-center">Jumlah Izin Aktif</th>
                                            <th className="px-6 py-3.5 text-center w-40">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {userLevels.map((level, index) => {
                                            const isAdmin = level.name === 'Administrator';
                                            return (
                                                <tr key={level.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="px-6 py-4 text-center text-muted-foreground font-semibold">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <span>{level.name}</span>
                                                            {isAdmin && (
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                                                    Super Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                                                            {level.category || 'Lainnya'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-foreground">
                                                            {level.dashboard_type || 'Default'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                                            {isAdmin ? 'Semua Izin' : `${level.permission_names?.length || 0} Izin`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {isAdmin ? (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                Akses Penuh
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={route('settings.access-control.edit', level.id)}
                                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                                                            >
                                                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                                                <span>Atur Hak Akses</span>
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
