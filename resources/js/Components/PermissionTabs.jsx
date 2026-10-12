import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ScanLine, ClipboardList, Activity } from 'lucide-react';

export default function PermissionTabs({ activeTab = 'scan' }) {
    const { auth } = usePage().props;

    const userRoles = [
        auth?.user?.user_level?.name,
        ...(auth?.user?.additional_levels?.map(l => l?.name) || []),
        ...(auth?.user?.roles?.map(r => typeof r === 'string' ? r : r?.name) || [])
    ].filter(Boolean);

    const canManagePermissions = userRoles.length === 0 || userRoles.some(r => [
        'Administrator', 'Admin', 'Sekertaris Divisi', 'Sekretaris Divisi',
        'Kepala Sekolah', 'Manager', 'Manager Pengasuhan', 'Musrif', 'Musyrif',
        'Musrif Asrama', 'Guru', 'Guru Kelas', 'Wali Kelas', 'Kurikulum', 'Staf Pendidikan', 'Pengajar'
    ].includes(r));

    const tabs = [
        {
            id: 'scan',
            title: 'Pos Scanner',
            subtitle: 'RFID / Tap',
            href: route('rfid.scan'),
            icon: ScanLine,
            activeColor: 'text-blue-600 dark:text-blue-400',
            activeBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60',
            activeBar: 'bg-blue-600',
            badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
            show: true,
        },
        {
            id: 'index',
            title: 'Daftar Perizinan',
            subtitle: 'Data Izin',
            href: route('permissions.index'),
            icon: ClipboardList,
            activeColor: 'text-amber-600 dark:text-amber-400',
            activeBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60',
            activeBar: 'bg-amber-500',
            badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
            show: canManagePermissions,
        },
        {
            id: 'monitor',
            title: 'Pantauan Real-time',
            subtitle: 'Live Status',
            href: route('permissions.monitor'),
            icon: Activity,
            activeColor: 'text-emerald-600 dark:text-emerald-400',
            activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60',
            activeBar: 'bg-emerald-500',
            badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
            isLive: true,
            show: true,
        },
    ];

    return (
        <div className="w-full overflow-x-auto no-scrollbar pb-1">
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm min-w-max">
                {tabs.filter(t => t.show).map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 select-none ${
                                isActive
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            {/* Icon with subtle halo on active */}
                            <div className={`p-1 rounded-lg transition-colors ${
                                isActive 
                                    ? tab.activeBg + ' ' + tab.activeColor 
                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                            }`}>
                                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            </div>

                            {/* Label */}
                            <span className="tracking-tight whitespace-nowrap">
                                {tab.title}
                            </span>

                            {/* Badges / Live indicators */}
                            {tab.isLive ? (
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                    isActive ? tab.badgeBg : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span>LIVE</span>
                                </span>
                            ) : (
                                <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight ${
                                    isActive ? tab.badgeBg : 'bg-slate-200/60 text-slate-500 dark:bg-slate-800/70 dark:text-slate-400'
                                }`}>
                                    {tab.subtitle}
                                </span>
                            )}

                            {/* Active bottom micro-bar */}
                            {isActive && (
                                <div className={`absolute bottom-0 inset-x-3 h-0.5 rounded-full ${tab.activeBar}`} />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
