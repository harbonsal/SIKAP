import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Users, AlertTriangle, CheckCircle, FileEdit, UsersRound, FilterX, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard({ plottings, isAdmin, summary }) {
    const { auth } = usePage().props;

    // Build unique options
    const uniqueKelas = [...new Set(plottings.map(p => p.kelas).filter(Boolean))].sort();
    const uniqueAsrama = [...new Set(plottings.map(p => p.asrama).filter(Boolean))].sort();
    
    const uniqueMusyrifsMap = new Map();
    plottings.forEach(p => {
        if (p.musyrif_id) {
            uniqueMusyrifsMap.set(p.musyrif_id, p.musyrif_name);
        }
    });
    const uniqueMusyrifs = Array.from(uniqueMusyrifsMap.entries()).map(([id, name]) => ({ id, name }));

    // Set initial filter for Musyrif if user is one of them
    const isUserMusyrif = uniqueMusyrifsMap.has(auth.user.id);
    const [filterKelas, setFilterKelas] = useState('');
    const [filterAsrama, setFilterAsrama] = useState('');
    const [filterMusyrif, setFilterMusyrif] = useState(isUserMusyrif ? auth.user.id.toString() : '');
    const [filterStatus, setFilterStatus] = useState('');

    const filteredPlottings = useMemo(() => {
        return plottings.filter(p => {
            if (filterKelas && p.kelas !== filterKelas) return false;
            if (filterAsrama && p.asrama !== filterAsrama) return false;
            if (filterMusyrif && p.musyrif_id?.toString() !== filterMusyrif) return false;
            if (filterStatus === 'tunggakan' && !p.is_tunggakan) return false;
            if (filterStatus === 'aman' && p.is_tunggakan) return false;
            return true;
        });
    }, [plottings, filterKelas, filterAsrama, filterMusyrif, filterStatus]);
    return (
        <MainLayout>
            <Head title="Dashboard Musyrif Tarbiyah" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Musyrif Tarbiyah</h1>
                        <p className="text-muted-foreground mt-1 text-sm text-gray-500">
                            Pantau dan kelola pendampingan santri asuh Anda.
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="mt-4 sm:mt-0 flex gap-2">
                            <Link 
                                href={route('musyrif-tarbiyah.plotting.index')} 
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 py-2 px-4 bg-gray-200 text-gray-800"
                            >
                                <UsersRound className="mr-2 h-4 w-4" />
                                Plotting Anak Asuh
                            </Link>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-white shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-gray-700">Total Anak Asuh</h3>
                            <Users className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{summary.total_students}</div>
                        </div>
                    </div>
                    
                    <div className="rounded-xl border bg-white shadow-sm p-6 border-l-4 border-l-red-500">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-red-600">Tunggakan Pendampingan</h3>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{summary.total_tunggakan}</div>
                            <p className="text-xs text-gray-500 mt-1">Santri belum didampingi &gt; 14 hari</p>
                        </div>
                    </div>

                    {/* Card: Pertemuan Kelompok Bulan Ini */}
                    <Link
                        href={route('musyrif-tarbiyah.group.index')}
                        className="rounded-xl border bg-white shadow-sm p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow block"
                    >
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-blue-700">Pertemuan Kelompok</h3>
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-700">{summary.group_log_this_month}</div>
                            <p className="text-xs text-gray-500 mt-1">Pertemuan bulan {summary.current_month_name}</p>
                        </div>
                    </Link>

                    {/* Card: Pertemuan Bulan Lalu */}
                    <div className="rounded-xl border bg-white shadow-sm p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-gray-700">Bulan Lalu</h3>
                            {summary.group_log_this_month >= summary.group_log_last_month
                                ? <TrendingUp className="h-4 w-4 text-green-500" />
                                : <TrendingDown className="h-4 w-4 text-red-400" />
                            }
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{summary.group_log_last_month}</div>
                            <p className="text-xs text-gray-500 mt-1">Pertemuan kelompok</p>
                        </div>
                    </div>
                </div>

                {/* Banner Keterangan Standar Pendampingan */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">i</span>
                        <div>
                            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Standar Pendampingan</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-blue-700">
                                <span>
                                    🧑‍🏫 <strong>Individu:</strong> 1× setiap 2 pekan &mdash; durasi 10–15 menit
                                </span>
                                <span>
                                    👥 <strong>Kelompok:</strong> Minimal 1× dalam 1 bulan
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="rounded-md border bg-white shadow-sm">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-lg text-gray-800">Daftar Anak Asuh</h2>
                        <Link
                            href={route('musyrif-tarbiyah.group.index')}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 shadow-sm"
                        >
                            <UsersRound className="mr-2 h-4 w-4" />
                            Input Jurnal Kelompok
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Kelas</label>
                                <select 
                                    className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {uniqueKelas.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Asrama</label>
                                <select 
                                    className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={filterAsrama}
                                    onChange={(e) => setFilterAsrama(e.target.value)}
                                >
                                    <option value="">Semua Asrama</option>
                                    {uniqueAsrama.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Musyrif</label>
                                <select 
                                    className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={filterMusyrif}
                                    onChange={(e) => setFilterMusyrif(e.target.value)}
                                >
                                    <option value="">Semua Musyrif</option>
                                    {uniqueMusyrifs.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status Tunggakan</label>
                                <select 
                                    className="w-full text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="tunggakan">Tunggakan</option>
                                    <option value="aman">Aman</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterKelas('');
                                        setFilterAsrama('');
                                        setFilterMusyrif(isUserMusyrif ? auth.user.id.toString() : '');
                                        setFilterStatus('');
                                    }}
                                    className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <FilterX className="h-4 w-4 mr-2" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b bg-gray-50">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600 w-[50px]">No</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">NIS</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Nama Santri</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Kelas</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Asrama</th>
                                    {isAdmin && <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Musyrif</th>}
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Terakhir Pendampingan</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Status</th>
                                    <th className="h-12 px-4 text-center align-middle font-medium text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredPlottings.length > 0 ? (
                                    filteredPlottings.map((plot, idx) => (
                                        <tr key={plot.plotting_id} className="border-b transition-colors hover:bg-gray-50/50">
                                            <td className="p-4 align-middle">{idx + 1}</td>
                                            <td className="p-4 align-middle">{plot.nis}</td>
                                            <td className="p-4 align-middle font-medium text-gray-800">{plot.student_name}</td>
                                            <td className="p-4 align-middle text-gray-600">{plot.kelas}</td>
                                            <td className="p-4 align-middle text-gray-600">{plot.asrama}</td>
                                            {isAdmin && <td className="p-4 align-middle text-gray-600">{plot.musyrif_name}</td>}
                                            <td className="p-4 align-middle text-gray-600">
                                                {plot.last_mentoring_date ? plot.last_mentoring_date : <span className="text-gray-400 italic">Belum pernah</span>}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {plot.is_tunggakan ? (
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700">
                                                        <AlertTriangle className="mr-1 h-3 w-3" /> Tunggakan
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                                                        <CheckCircle className="mr-1 h-3 w-3" /> Aman
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <Link 
                                                    href={route('musyrif-tarbiyah.individual.index', plot.student_id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 h-8 w-8 text-blue-600 mr-2"
                                                    title="Input Jurnal Individu"
                                                >
                                                    <FileEdit className="h-4 w-4" />
                                                </Link>
                                                <Link 
                                                    href={route('musyrif-tarbiyah.profile.show', plot.student_id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 bg-white hover:bg-gray-100 h-8 px-2 text-indigo-600"
                                                    title="Lihat Profil Santri"
                                                >
                                                    <UsersRound className="h-4 w-4 mr-1" /> Profil
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-gray-500">
                                            Belum ada santri yang diplot atau tidak ada data yang cocok dengan filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
