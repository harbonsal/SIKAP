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
    Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

export default function Index({ userLevels = [], features = [], currentTab = 'roles' }) {
    const [activeTab, setActiveTab] = useState(currentTab);
    const [searchRoleQuery, setSearchRoleQuery] = useState('');

    // Filter roles for the primary role list table (strictly exclude Administrator)
    const nonAdminUserLevels = useMemo(() => {
        return userLevels.filter((lvl) => lvl.name !== 'Administrator');
    }, [userLevels]);

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

    // Quick Access Matrix state (Secondary Tab)
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

    const toggleCell = (levelId, featureKey) => {
        setMatrix((prev) => ({
            ...prev,
            [levelId]: {
                ...prev[levelId],
                [featureKey]: !prev[levelId]?.[featureKey],
            },
        }));
    };

    const handleSaveMatrix = () => {
        setIsSavingMatrix(true);
        router.post(
            route('settings.access-control.quick-access-matrix'),
            {
                matrix,
                auto_sync_permissions: autoSyncPermissions,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingMatrix(false);
                    Swal.fire({
                        icon: 'success',
                        title: 'Tersimpan',
                        text: 'Pengaturan matriks pintasan berhasil disimpan.',
                        timer: 2000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end',
                    });
                },
                onError: () => {
                    setIsSavingMatrix(false);
                },
            }
        );
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Hak Akses Peran (Role)" />

            <div className="space-y-6 max-w-[1500px] mx-auto pb-16">
                {/* Header Title & Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Pengaturan Hak Akses
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Pilih level pengguna (role) untuk mengatur izin fitur dan seluruh menu sistem.
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
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Pintasan Dashboard</span>
                            {changeCount > 0 && (
                                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-500 text-white">
                                    {changeCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* TAB 1 (UTAMA): DAFTAR ROLE & LINK KE PENGATURAN HAK AKSES */}
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
                                        Daftar di bawah menampilkan seluruh peran operasional sistem (<em>Guru, Wali Kelas, Musrif, Santri, Kepala Sekolah, Staf TU, dll.</em>). Peran <strong>Super Admin (Administrator)</strong> memiliki hak akses absolut otomatis ke seluruh database sehingga tidak ditampilkan dan tidak perlu dikonfigurasi di sini.
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Klik tombol <strong>"Atur Hak Akses"</strong> pada peran yang ingin disesuaikan untuk mengatur izin modul dan menu yang dapat diakses.
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
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                            <th className="px-6 py-4 text-center">Hak Akses Aktif</th>
                                            <th className="px-6 py-4 text-center w-52">Aksi Pengaturan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUserLevels.map((level, index) => (
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
                                                        {level.permission_names?.length || 0} Izin Aktif
                                                    </span>
                                                </td>

                                                {/* Col 5: Action Link to Detail Access Control */}
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={route('settings.access-control.edit', level.id)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 group"
                                                    >
                                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                                        <span>Atur Hak Akses</span>
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2 (OPSIONAL): MATRIKS PINTASAN DASHBOARD */}
                {activeTab === 'quick-access' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchMatrixQuery}
                                        onChange={(e) => setSearchMatrixQuery(e.target.value)}
                                        placeholder="Cari pintasan fitur..."
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveMatrix}
                                    disabled={isSavingMatrix}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                                >
                                    <Save className="w-3.5 h-3.5 inline mr-1.5" />
                                    {isSavingMatrix ? 'Menyimpan...' : 'Simpan Pintasan'}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-md border-b border-border">
                                        <tr>
                                            <th className="px-4 py-3 min-w-[280px] border-r border-border font-bold">Fitur Akses Cepat</th>
                                            {nonAdminUserLevels.map((lvl) => (
                                                <th key={lvl.id} className="px-3 py-3 text-center min-w-[120px] border-r border-border font-bold">
                                                    {lvl.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredFeatures.map((feat) => (
                                            <tr key={feat.key} className="hover:bg-muted/30">
                                                <td className="px-4 py-2.5 font-semibold border-r border-border">
                                                    {feat.label}
                                                </td>
                                                {nonAdminUserLevels.map((lvl) => {
                                                    const isChecked = Boolean(matrix[lvl.id]?.[feat.key]);
                                                    return (
                                                        <td
                                                            key={`${lvl.id}-${feat.key}`}
                                                            onClick={() => toggleCell(lvl.id, feat.key)}
                                                            className="px-3 py-2.5 text-center border-r border-border cursor-pointer hover:bg-indigo-50/20"
                                                        >
                                                            <div className={cn(
                                                                "w-4.5 h-4.5 mx-auto rounded border flex items-center justify-center transition-all",
                                                                isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-muted-foreground/30 bg-background"
                                                            )}>
                                                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
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
