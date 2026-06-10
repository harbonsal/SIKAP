
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Search, Trophy, BookOpen, Filter } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import AsyncSelect from 'react-select/async';
import JuzInputGrid from './JuzInputGrid';
import axios from 'axios';

const BatteryProgress = ({ value, max, label, colorClass, emptyClass = "bg-slate-100", height = "h-4", showLabel = true, subLabel = "" }) => {
    // Ensure value is between 0 and max
    const safeValue = Math.min(Math.max(0, value || 0), max);
    const percentage = max > 0 ? (safeValue / max) * 100 : 0;

    // Determine dynamic color if colorClass is not provided
    let finalColorClass = colorClass;
    if (!finalColorClass) {
        if (percentage === 0) finalColorClass = 'bg-red-500';
        else if (percentage < 100) finalColorClass = 'bg-amber-400';
        else finalColorClass = 'bg-emerald-500';
    }

    return (
        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[120px] mx-auto">
            <div className={`relative w-full ${height} ${emptyClass} rounded-sm border border-slate-300 overflow-hidden shadow-inner font-mono`}>
                <div
                    className={`absolute top-0 left-0 h-full ${finalColorClass} transition-all duration-500 ease-in-out`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Battery Nub */}
                <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-1 h-1/2 bg-slate-400 rounded-r-sm z-10 hidden" />
            </div>
            {showLabel && (
                <div className="text-[11px] font-bold text-slate-700 leading-tight flex flex-col items-center mt-0.5">
                    <span>{label}</span>
                    {subLabel && <span className="text-[9px] text-slate-500 font-normal">{subLabel}</span>}
                </div>
            )}
        </div>
    );
};

export default function Index({ auth, title, students, filters, classes, kamars, musyrifs }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.active_class_id || 'all');
    const [selectedKamar, setSelectedKamar] = useState(filters.active_kamar_id || 'all');
    const [selectedMusyrif, setSelectedMusyrif] = useState(filters.musyrif_id || 'all');

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (key, value) => {
        const newFilters = {
            active_class_id: selectedClass,
            active_kamar_id: selectedKamar,
            musyrif_id: selectedMusyrif,
            search: searchInput,
            [key]: value
        };

        if (key === 'active_class_id') setSelectedClass(value);
        if (key === 'active_kamar_id') setSelectedKamar(value);
        if (key === 'musyrif_id') setSelectedMusyrif(value);
        if (key === 'search') setSearchInput(value);

        router.get(route('tahfidz.achievements.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange('search', searchInput);
    };

    const [activeTab, setActiveTab] = useState('monitoring');
    const [inputStudent, setInputStudent] = useState(null);
    const [inputJuzData, setInputJuzData] = useState([]);
    const [loadingInput, setLoadingInput] = useState(false);
    const [musyrifFilter, setMusyrifFilter] = useState('all');

    // Load student data for input tab
    const loadStudentData = async (studentId) => {
        setLoadingInput(true);
        try {
            const res = await axios.get(route('tahfidz.achievements.data', studentId));
            setInputStudent(res.data.student);
            setInputJuzData(res.data.juz_data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingInput(false);
        }
    };

    const loadOptions = (inputValue, callback) => {
        // If inputValue is empty, we still fetch to show default list
        axios.get(route('tahfidz.achievements.search-students', { q: inputValue, musyrif_id: musyrifFilter }))
            .then(res => {
                const options = res.data.map(s => ({ value: s.id, label: s.text, nis: s.nis }));
                callback(options);
            });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{title}</h2>}
        >
            <Head title={title} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* TABS */}
                    <div className="flex space-x-1 rounded-xl bg-gray-100/50 p-1 w-fit border">
                        <button
                            onClick={() => setActiveTab('monitoring')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'monitoring' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Monitoring Capaian
                        </button>
                        <button
                            onClick={() => setActiveTab('input')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'input' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Input Hafalan
                        </button>
                    </div>

                    {activeTab === 'monitoring' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Stats / Header Card */}
                            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 text-green-600 rounded-xl shadow-sm">
                                            <Trophy className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-green-800">Capaian Hafalan Tahfidz</CardTitle>
                                            <CardDescription className="text-green-600">
                                                Pantau progress hafalan santri per Juz dan Halaman (Standar Madinah)
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Filters & Search */}
                            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border">
                                <div className="flex flex-col md:flex-row gap-3 w-full">
                                    {/* Kelas */}
                                    <div className="w-full md:w-56">
                                        <Select value={selectedClass} onValueChange={(val) => handleFilterChange('active_class_id', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Kelas</SelectItem>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Asrama */}
                                    <div className="w-full md:w-56">
                                        <Select value={selectedKamar} onValueChange={(val) => handleFilterChange('active_kamar_id', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Asrama" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Asrama</SelectItem>
                                                {kamars.map((kmr) => (
                                                    <SelectItem key={kmr.id} value={kmr.id.toString()}>{kmr.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Halaqoh */}
                                    <div className="w-full md:w-56">
                                        <Select value={selectedMusyrif} onValueChange={(val) => handleFilterChange('musyrif_id', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Halaqoh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Halaqoh</SelectItem>
                                                {musyrifs.map((m) => (
                                                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Search NIS / Nama */}
                                    <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Cari nama / NIS santri..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            className="flex-1 min-w-[180px]"
                                        />
                                        <button
                                            type="submit"
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1 text-sm"
                                        >
                                            <Search className="h-4 w-4" />
                                        </button>
                                        {searchInput && (
                                            <button
                                                type="button"
                                                onClick={() => { setSearchInput(''); handleFilterChange('search', ''); }}
                                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* Students Table */}
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">No</TableHead>
                                                <TableHead>Nama Santri</TableHead>
                                                <TableHead>Kelas & Asrama</TableHead>
                                                <TableHead className="text-center">Juz Selesai</TableHead>
                                                <TableHead className="text-center">Juz Proses</TableHead>
                                                <TableHead className="text-center">Juz Validasi</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.data.length > 0 ? (
                                                students.data.map((student, index) => (
                                                    <TableRow key={student.id} className="hover:bg-slate-50">
                                                        <TableCell>{(students.current_page - 1) * students.per_page + index + 1}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-slate-900">{student.name}</div>
                                                            <div className="text-xs text-slate-500">NIS: {student.nis}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">{student.class_name}</div>
                                                            <div className="text-xs text-slate-500">{student.kamar_name}</div>
                                                            <div className="text-xs text-indigo-500 mt-1 font-medium">{student.musyrif_name !== '-' ? `Halaqoh: ${student.musyrif_name}` : ''}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center align-middle">
                                                            <BatteryProgress
                                                                value={student.total_juz_completed}
                                                                max={30}
                                                                label={`${student.total_juz_completed} Juz`}
                                                                colorClass={student.total_juz_completed === 30 ? 'bg-emerald-500' : student.total_juz_completed === 0 ? 'bg-slate-300' : 'bg-emerald-400'}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center align-middle">
                                                            {student.juz_proses_data ? (
                                                                <BatteryProgress
                                                                    value={student.juz_proses_data.completed}
                                                                    max={student.juz_proses_data.total}
                                                                    label={`Juz ${student.juz_proses_data.juz}`}
                                                                    subLabel={`${student.juz_proses_data.completed}/${student.juz_proses_data.total} Hal`}
                                                                    colorClass="bg-amber-400"
                                                                />
                                                            ) : (
                                                                <div className="text-slate-300 text-sm font-medium">-</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center align-middle">
                                                            {student.juz_validasi_count > 0 ? (
                                                                <BatteryProgress
                                                                    value={student.juz_validasi_count}
                                                                    max={student.total_juz_completed > 0 ? student.total_juz_completed : 30}
                                                                    label={`${student.juz_validasi_count} Juz Validation`}
                                                                    subLabel={student.juz_validasi} // Show the details like "Juz 29, 30"
                                                                    colorClass={student.juz_validasi_count === student.total_juz_completed ? 'bg-blue-600' : 'bg-blue-400'}
                                                                />
                                                            ) : (
                                                                <div className="text-slate-300 text-sm font-medium">-</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={route('tahfidz.achievements.show', student.id)}>
                                                                    <BookOpen className="w-4 h-4 mr-2" /> Detail
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                                        Tidak ada data santri ditemukan
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="mt-4">
                                <Pagination links={students.links} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'input' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            <Card className="bg-white border shadow-sm">
                                <CardHeader>
                                    <CardTitle>Input Capaian Hafalan</CardTitle>
                                    <CardDescription>Cari santri untuk mulai menginput hafalan</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="w-full max-w-xl">
                                        <div className="mb-2 text-sm font-medium text-gray-700">Filter Halaqoh</div>
                                        <Select value={musyrifFilter} onValueChange={setMusyrifFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Halaqoh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Halaqoh</SelectItem>
                                                {musyrifs.map((m) => (
                                                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full max-w-xl">
                                        <div className="mb-2 text-sm font-medium text-gray-700">Cari Nama Santri / NIS</div>
                                        <AsyncSelect
                                            key={musyrifFilter} // Force re-render/reload when filter changes
                                            cacheOptions
                                            loadOptions={loadOptions}
                                            defaultOptions={true}
                                            onChange={(opt) => loadStudentData(opt?.value)}
                                            placeholder="Ketik nama santri (min 3 huruf)..."
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            noOptionsMessage={() => "Ketik untuk mencari..."}
                                            isClearable
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {loadingInput && (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            )}

                            {!loadingInput && inputStudent && (
                                <JuzInputGrid
                                    student={inputStudent}
                                    juzData={inputJuzData}
                                    onUpdate={() => loadStudentData(inputStudent.id)}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
