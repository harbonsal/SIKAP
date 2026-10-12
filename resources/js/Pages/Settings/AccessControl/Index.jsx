import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    Shield,
    SlidersHorizontal,
    Key,
    ExternalLink,
    Search,
    X,
    Users,
    CheckCircle2,
    Info,
    ArrowRight,
    Lock,
    Sparkles,
    LayoutDashboard,
    Layers,
    Save,
    RotateCcw,
    Check,
    AlertTriangle,
    Unlock,
    CalendarDays,
    GraduationCap,
    BookOpen,
    BarChart2,
    FileText,
    Clock,
    CalendarRange,
    BookOpenCheck,
    Bot,
    Book,
    FileSpreadsheet,
    HeartPulse,
    User,
    Heart,
    Trophy,
    Activity,
    Wallet,
    Building,
    Scale,
    HelpCircle,
    Camera,
    CalendarCheck,
    School,
    Bell,
    CheckSquare,
    Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

// Icon Map Registry for feature cards
const ICON_MAP = {
    CalendarDays,
    GraduationCap,
    BookOpen,
    BarChart2,
    FileText,
    Clock,
    CalendarRange,
    BookOpenCheck,
    CheckCircle2,
    Bot,
    Book,
    Users,
    FileSpreadsheet,
    HeartPulse,
    User,
    Heart,
    Shield,
    Trophy,
    Activity,
    Wallet,
    Building,
    Scale,
    HelpCircle,
    Camera,
    Sparkles,
    CalendarCheck,
    School,
    Bell,
    LayoutDashboard,
    Layers,
};

function getCategoryColor(category) {
    switch (category) {
        case 'Akademik & KBM':
            return {
                badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
            };
        case "Al-Qur'an & Tahfidz":
            return {
                badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
                iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
            };
        case 'Pengasuhan & Asrama':
            return {
                badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
            };
        case 'Ekstra & Prestasi':
            return {
                badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            };
        case 'Keuangan':
        case 'Keuangan & Tagihan':
            return {
                badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
                iconBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
            };
        case 'Widget Dashboard':
            return {
                badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            };
        default:
            return {
                badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                iconBg: 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
            };
    }
}

export default function Index({ userLevels = [], features = [], currentTab = 'roles', initialRoleId = null }) {
    const [activeTab, setActiveTab] = useState(currentTab);
    const [searchRoleQuery, setSearchRoleQuery] = useState('');

    // Filter roles for the primary role list table (strictly exclude Administrator)
    const nonAdminUserLevels = useMemo(() => {
        return userLevels.filter((lvl) => lvl.name !== 'Administrator');
    }, [userLevels]);

    // Active selected role for Tab 2 (Pintasan Dashboard)
    const [selectedRoleId, setSelectedRoleId] = useState(() => {
        if (initialRoleId && nonAdminUserLevels.some((lvl) => lvl.id === initialRoleId)) {
            return initialRoleId;
        }
        return nonAdminUserLevels[0]?.id || null;
    });

    const selectedRole = useMemo(() => {
        return nonAdminUserLevels.find((lvl) => lvl.id === selectedRoleId) || nonAdminUserLevels[0] || null;
    }, [nonAdminUserLevels, selectedRoleId]);

    const filteredUserLevels = useMemo(() => {
        const q = searchRoleQuery.toLowerCase().trim();
        if (!q) return nonAdminUserLevels;
        return nonAdminUserLevels.filter(
            (lvl) =>
                lvl.name.toLowerCase().includes(q) ||
                (lvl.category && lvl.category.toLowerCase().includes(q)) ||
                (lvl.dashboard_type && lvl.dashboard_type.toLowerCase().includes(q))
        );
    }, [nonAdminUserLevels, searchRoleQuery]);

    // Quick Access Matrix state
    const [searchMatrixQuery, setSearchMatrixQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [autoSyncPermissions, setAutoSyncPermissions] = useState(true);
    const [isSavingMatrix, setIsSavingMatrix] = useState(false);

    const initialMatrix = useMemo(() => {
        const matrix = {};
        nonAdminUserLevels.forEach((level) => {
            matrix[level.id] = {};
            const levelWidgets = level.widgets || {};
            features.forEach((feat) => {
                if (levelWidgets[feat.key] !== undefined) {
                    matrix[level.id][feat.key] = Boolean(levelWidgets[feat.key]);
                } else if (levelWidgets[feat.alias] !== undefined) {
                    matrix[level.id][feat.key] = Boolean(levelWidgets[feat.alias]);
                } else {
                    const isDefault = Array.isArray(feat.default_for) && feat.default_for.includes(level.name);
                    matrix[level.id][feat.key] = isDefault;
                }
            });
        });
        return matrix;
    }, [nonAdminUserLevels, features]);

    const [matrix, setMatrix] = useState(initialMatrix);

    // Track unsaved diff count for selected role
    const selectedRoleDiffCount = useMemo(() => {
        if (!selectedRole) return 0;
        let diff = 0;
        features.forEach((feat) => {
            if (matrix[selectedRole.id]?.[feat.key] !== initialMatrix[selectedRole.id]?.[feat.key]) {
                diff++;
            }
        });
        return diff;
    }, [matrix, initialMatrix, selectedRole, features]);

    // Total diff across all roles
    const totalChangeCount = useMemo(() => {
        let diff = 0;
        nonAdminUserLevels.forEach((level) => {
            features.forEach((feat) => {
                if (matrix[level.id]?.[feat.key] !== initialMatrix[level.id]?.[feat.key]) {
                    diff++;
                }
            });
        });
        return diff;
    }, [matrix, initialMatrix, nonAdminUserLevels, features]);

    const categories = useMemo(() => {
        const set = new Set();
        features.forEach((f) => set.add(f.category));
        return ['ALL', ...Array.from(set)];
    }, [features]);

    const filteredFeatures = useMemo(() => {
        return features.filter((feat) => {
            const matchesCategory = selectedCategory === 'ALL' || feat.category === selectedCategory;
            const q = searchMatrixQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                feat.label.toLowerCase().includes(q) ||
                feat.description?.toLowerCase().includes(q) ||
                feat.category.toLowerCase().includes(q) ||
                (feat.required_permission && feat.required_permission.toLowerCase().includes(q));
            return matchesCategory && matchesSearch;
        });
    }, [features, selectedCategory, searchMatrixQuery]);

    // Toggle shortcut for current role
    const toggleRoleFeature = (featureKey) => {
        if (!selectedRole) return;
        setMatrix((prev) => ({
            ...prev,
            [selectedRole.id]: {
                ...prev[selectedRole.id],
                [featureKey]: !prev[selectedRole.id]?.[featureKey],
            },
        }));
    };

    // Batch toggle for current role
    const handleSetAllForRole = (enable) => {
        if (!selectedRole) return;
        setMatrix((prev) => {
            const currentRoleWidgets = { ...(prev[selectedRole.id] || {}) };
            filteredFeatures.forEach((feat) => {
                currentRoleWidgets[feat.key] = enable;
            });
            return {
                ...prev,
                [selectedRole.id]: currentRoleWidgets,
            };
        });
    };

    // Apply default presets for current role
    const handleApplyDefaultPresets = () => {
        if (!selectedRole) return;
        setMatrix((prev) => {
            const currentRoleWidgets = { ...(prev[selectedRole.id] || {}) };
            features.forEach((feat) => {
                const isDefault = Array.isArray(feat.default_for) && feat.default_for.includes(selectedRole.name);
                currentRoleWidgets[feat.key] = isDefault;
            });
            return {
                ...prev,
                [selectedRole.id]: currentRoleWidgets,
            };
        });
        Swal.fire({
            icon: 'info',
            title: 'Rekomendasi Diterapkan',
            text: `Pintasan disesuaikan dengan rekomendasi bawaan untuk peran '${selectedRole.name}'. Klik Simpan untuk memperbarui.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    // Save shortcuts for single active role
    const handleSaveSelectedRoleWidgets = () => {
        if (!selectedRole) return;
        setIsSavingMatrix(true);
        router.post(
            route('settings.access-control.quick-access-matrix'),
            {
                user_level_id: selectedRole.id,
                widgets: matrix[selectedRole.id] || {},
                auto_sync_permissions: autoSyncPermissions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingMatrix(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Pintasan Disimpan!',
                        text: `Pintasan dashboard untuk '${selectedRole.name}' berhasil diperbarui.`,
                        timer: 2200,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end',
                    });
                },
                onError: () => {
                    setIsSavingMatrix(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan',
                        text: 'Terjadi kesalahan saat menyimpan pintasan dashboard.',
                    });
                },
            }
        );
    };

    // Count active shortcuts for a given role ID
    const getActiveCountForLevel = (levelId) => {
        const levelWidgets = matrix[levelId] || {};
        return features.filter((feat) => Boolean(levelWidgets[feat.key])).length;
    };

    // Direct jump from Tab 1 to Tab 2 with role pre-selected
    const handleOpenRolePintasan = (levelId) => {
        setSelectedRoleId(levelId);
        setActiveTab('quick-access');
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Hak Akses Peran (Role)" />

            <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
                {/* Header & Main Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Pengaturan Hak Akses & Pintasan
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Atur izin fitur sistem dan pintasan dashboard untuk setiap level pengguna.
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-2xl border border-border self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95",
                                activeTab === 'roles'
                                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Key className="w-4 h-4" />
                            <span>Daftar Hak Akses Role</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('quick-access')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95",
                                activeTab === 'quick-access'
                                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-border/50"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Pintasan Dashboard</span>
                            {totalChangeCount > 0 && (
                                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-500 text-white">
                                    {totalChangeCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* TAB 1: DAFTAR ROLE & LINK KE PENGATURAN HAK AKSES */}
                {activeTab === 'roles' && (
                    <div className="space-y-5">
                        {/* Information Alert Box */}
                        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 sm:p-5 shadow-xs space-y-2">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                                    <Info className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm text-foreground">
                                        Pengaturan Hak Akses Peran Pengguna
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Setiap peran (role) dapat diatur izin menu & fiturnya secara mandiri. Peran <strong>Super Admin (Administrator)</strong> memiliki hak akses absolut otomatis ke seluruh database sehingga tidak perlu dikonfigurasi di sini.
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Gunakan tombol <strong>"Atur Izin"</strong> untuk izin modul detail (lihat/tambah/edit/hapus), atau tombol <strong>"Pintasan"</strong> untuk mengatur tombol akses cepat di dashboard peran tersebut.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search Toolbar & Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchRoleQuery}
                                    onChange={(e) => setSearchRoleQuery(e.target.value)}
                                    placeholder="Cari nama role atau kategori..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                                />
                                {searchRoleQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchRoleQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <Link
                                href={route('user-levels.index')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-2xs self-start sm:self-auto"
                            >
                                <Users className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Master Level Pengguna</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </Link>
                        </div>

                        {/* Primary Role List Table */}
                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                                    <thead className="bg-muted/70 text-foreground uppercase text-[11px] font-extrabold border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 w-16 text-center">No</th>
                                            <th className="px-6 py-4 min-w-[200px]">Level Pengguna / Peran (Role)</th>
                                            <th className="px-6 py-4">Kategori Peran</th>
                                            <th className="px-6 py-4">Tipe Dashboard</th>
                                            <th className="px-6 py-4 text-center">Izin Fitur</th>
                                            <th className="px-6 py-4 text-center">Pintasan Dashboard</th>
                                            <th className="px-6 py-4 text-center w-60">Aksi Pengaturan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUserLevels.map((level, index) => {
                                            const activePintasanCount = getActiveCountForLevel(level.id);
                                            return (
                                                <tr
                                                    key={level.id}
                                                    className="transition-colors hover:bg-muted/40"
                                                >
                                                    {/* Col 0: No */}
                                                    <td className="px-6 py-4 text-center text-muted-foreground font-semibold">
                                                        {index + 1}
                                                    </td>

                                                    {/* Col 1: Role Name */}
                                                    <td className="px-6 py-4 font-bold text-foreground">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                                                {level.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-extrabold text-foreground text-sm">
                                                                        {level.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] text-muted-foreground font-normal">
                                                                    ID: #{level.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Col 2: Category */}
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border/70">
                                                            {level.category || 'Lainnya'}
                                                        </span>
                                                    </td>

                                                    {/* Col 3: Dashboard Type */}
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-0.5 rounded-md border",
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
                                                    </td>

                                                    {/* Col 4: Active Permissions Count */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                                            {level.permission_names?.length || 0} Izin
                                                        </span>
                                                    </td>

                                                    {/* Col 5: Active Shortcuts Count */}
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenRolePintasan(level.id)}
                                                            className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                                                            title="Klik untuk atur pintasan"
                                                        >
                                                            {activePintasanCount} Pintasan
                                                        </button>
                                                    </td>

                                                    {/* Col 6: Actions */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Link
                                                                href={route('settings.access-control.edit', level.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all active:scale-95"
                                                                title="Atur Hak Akses Fitur & Menu"
                                                            >
                                                                <Shield className="w-3.5 h-3.5" />
                                                                <span>Atur Izin</span>
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenRolePintasan(level.id)}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs transition-all active:scale-95"
                                                                title="Atur Pintasan Dashboard Role Ini"
                                                            >
                                                                <LayoutDashboard className="w-3.5 h-3.5" />
                                                                <span>Pintasan</span>
                                                            </button>
                                                        </div>
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

                {/* TAB 2: PENGATURAN PINTASAN DASHBOARD (INDIVIDUAL PER-ROLE) */}
                {activeTab === 'quick-access' && (
                    <div className="space-y-6">
                        {/* Role Selector Header */}
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>Pilih Role yang Ingin Diatur:</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Setiap role diatur secara mandiri. Klik salah satu role di bawah untuk menampilkan dan menyesuaikan pintasan dashboard-nya.
                                    </p>
                                </div>

                                {selectedRole && (
                                    <Link
                                        href={route('settings.access-control.edit', selectedRole.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs self-start sm:self-auto"
                                    >
                                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Atur Izin Modul '{selectedRole.name}'</span>
                                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    </Link>
                                )}
                            </div>

                            {/* Role Pills / Tabs Bar */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {nonAdminUserLevels.map((lvl) => {
                                    const isSelected = lvl.id === selectedRoleId;
                                    const activeCount = getActiveCountForLevel(lvl.id);
                                    return (
                                        <button
                                            key={lvl.id}
                                            type="button"
                                            onClick={() => setSelectedRoleId(lvl.id)}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-2xs",
                                                isSelected
                                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/30"
                                                    : "bg-muted/70 hover:bg-muted text-foreground border border-border"
                                            )}
                                        >
                                            <span>{lvl.name}</span>
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-md text-[10px] font-mono",
                                                isSelected
                                                    ? "bg-white/20 text-white font-extrabold"
                                                    : "bg-background text-muted-foreground border border-border/80"
                                            )}>
                                                {activeCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Role Control & Features Grid */}
                        {selectedRole && (
                            <div className="space-y-5">
                                {/* Role Header Card & Toolbar */}
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm shrink-0">
                                                {selectedRole.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-extrabold text-foreground">
                                                        Pintasan Dashboard: <span className="text-indigo-600 dark:text-indigo-400">{selectedRole.name}</span>
                                                    </h2>
                                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground border border-border">
                                                        {selectedRole.category || 'Role'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Aktifkan atau matikan pintasan tombol cepat dan widget yang akan muncul di layar beranda peran ini.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-start lg:self-auto">
                                            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                {getActiveCountForLevel(selectedRole.id)} / {features.length} Aktif
                                            </span>

                                            <button
                                                type="button"
                                                onClick={handleSaveSelectedRoleWidgets}
                                                disabled={isSavingMatrix}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                <span>{isSavingMatrix ? 'Menyimpan...' : `Simpan Pintasan ${selectedRole.name}`}</span>
                                                {selectedRoleDiffCount > 0 && (
                                                    <span className="px-1.5 py-0.2 text-[10px] bg-white text-indigo-700 rounded-full font-black">
                                                        {selectedRoleDiffCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filter & Batch Actions Toolbar */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                                            {/* Search Shortcut */}
                                            <div className="relative w-full sm:w-64">
                                                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={searchMatrixQuery}
                                                    onChange={(e) => setSearchMatrixQuery(e.target.value)}
                                                    placeholder="Cari pintasan..."
                                                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
                                                />
                                                {searchMatrixQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchMatrixQuery('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Category Pills */}
                                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all",
                                                            selectedCategory === cat
                                                                ? "bg-foreground text-background font-bold shadow-2xs"
                                                                : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {cat === 'ALL' ? 'Semua Kategori' : cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Batch Tools & Auto-sync */}
                                        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => handleSetAllForRole(true)}
                                                className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground transition"
                                                title="Pilih semua yang tampil"
                                            >
                                                Pilih Semua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSetAllForRole(false)}
                                                className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground transition"
                                                title="Hapus pilihan"
                                            >
                                                Hapus Semua
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApplyDefaultPresets}
                                                className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                                                title="Gunakan default rekomendasi untuk role ini"
                                            >
                                                Default Role
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto-Sync Permissions Checkbox */}
                                    <div className="pt-2 border-t border-border flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={autoSyncPermissions}
                                                onChange={(e) => setAutoSyncPermissions(e.target.checked)}
                                                className="rounded border-border text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                            />
                                            <span>Otomatis sinkronkan izin modul yang dibutuhkan jika pintasan diaktifkan</span>
                                        </label>

                                        <span className="text-[11px] text-muted-foreground">
                                            Menampilkan {filteredFeatures.length} dari {features.length} fitur
                                        </span>
                                    </div>
                                </div>

                                {/* Responsive Card Grid (NO HORIZONTAL SCROLL) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    {filteredFeatures.map((feat) => {
                                        const isChecked = Boolean(matrix[selectedRole.id]?.[feat.key]);
                                        const IconComp = ICON_MAP[feat.icon] || Sparkles;
                                        const catColors = getCategoryColor(feat.category);

                                        return (
                                            <div
                                                key={feat.key}
                                                onClick={() => toggleRoleFeature(feat.key)}
                                                className={cn(
                                                    "rounded-2xl border p-4 transition-all cursor-pointer relative group flex flex-col justify-between select-none shadow-2xs",
                                                    isChecked
                                                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700/80 shadow-xs ring-1 ring-indigo-500/20"
                                                        : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="space-y-3">
                                                    {/* Top row: Icon + Category Badge + Toggle */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105",
                                                                catColors.iconBg
                                                            )}>
                                                                <IconComp className="w-4.5 h-4.5" />
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                                                catColors.badge
                                                            )}>
                                                                {feat.category}
                                                            </span>
                                                        </div>

                                                        {/* iOS-Style Toggle Switch */}
                                                        <div className="shrink-0 pt-0.5">
                                                            <div
                                                                className={cn(
                                                                    "w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5",
                                                                    isChecked
                                                                        ? "bg-indigo-600"
                                                                        : "bg-muted-foreground/30 dark:bg-muted-foreground/20"
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center",
                                                                        isChecked ? "translate-x-4" : "translate-x-0"
                                                                    )}
                                                                >
                                                                    {isChecked && (
                                                                        <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Feature Details */}
                                                    <div>
                                                        <h4 className={cn(
                                                            "font-bold text-sm leading-snug transition-colors",
                                                            isChecked ? "text-indigo-950 dark:text-indigo-100" : "text-foreground"
                                                        )}>
                                                            {feat.label}
                                                        </h4>
                                                        {feat.description && (
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                                {feat.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bottom Status Tag */}
                                                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                                                    <span className={cn(
                                                        "font-semibold flex items-center gap-1",
                                                        isChecked ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-muted-foreground"
                                                    )}>
                                                        {isChecked ? (
                                                            <>
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                <span>Tampil di Dashboard</span>
                                                            </>
                                                        ) : (
                                                            <span>Disembunyikan</span>
                                                        )}
                                                    </span>

                                                    {feat.required_permission && (
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {feat.required_permission}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {filteredFeatures.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-2">
                                        <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto" />
                                        <p className="text-sm font-semibold text-foreground">
                                            Tidak ada pintasan yang cocok dengan pencarian / kategori ini.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchMatrixQuery('');
                                                setSelectedCategory('ALL');
                                            }}
                                            className="text-xs text-indigo-600 font-bold hover:underline"
                                        >
                                            Reset Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
