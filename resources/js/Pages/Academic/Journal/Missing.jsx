import React, { useState } from 'react';
import AbsensiLayout from '@/Layouts/AbsensiLayout';
import { Head, router } from '@inertiajs/react';
import { Search, Calendar, UserX, Clock } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Missing({ missing, filters, teachers, classes }) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [teacherId, setTeacherId] = useState(filters.teacher_id || '');
    const [classId, setClassId] = useState(filters.active_class_id || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('journals.missing'), {
            start_date: startDate,
            end_date: endDate,
            teacher_id: teacherId,
            active_class_id: classId
        }, { preserveState: true });
    };

    return (
        <AbsensiLayout breadcrumbItems={[
            { title: 'Pendidikan', url: '#' },
            { title: 'Absensi & Jurnal', url: route('journals.index') },
            { title: 'Rekap Belum Absen', url: route('journals.missing') }
        ]}>
            <Head title="Rekap Belum Absen" />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <UserX className="w-5 h-5 text-red-500" />
                        Daftar Ustadz Belum Mengisi Jurnal
                    </h3>
                </div>
                
                <div className="p-4">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                            />
                        </div>
                        <div className="w-full sm:w-auto min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Guru</label>
                            <select 
                                value={teacherId}
                                onChange={e => setTeacherId(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                            >
                                <option value="">Semua Guru</option>
                                {teachers?.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-auto min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
                            <select 
                                value={classId}
                                onChange={e => setClassId(e.target.value)}
                                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm w-full"
                            >
                                <option value="">Semua Kelas</option>
                                {classes?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <PrimaryButton type="submit" className="h-[42px]">
                                <Search className="w-4 h-4 mr-2" /> Tampilkan
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>

            <div className="space-y-6">
                {missing.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                            <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Semua Jurnal Telah Diisi!</h3>
                        <p className="text-gray-500">Alhamdulillah, tidak ada jadwal kosong tanpa jurnal pada rentang tanggal ini.</p>
                    </div>
                ) : (
                    missing.map((teacher, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900">{teacher.teacher_name}</h3>
                                <p className="text-sm text-red-600 font-medium">
                                    Total {teacher.schedules.length} jadwal belum diisi
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3">Hari & Tanggal</th>
                                            <th className="px-6 py-3">Waktu</th>
                                            <th className="px-6 py-3">Kelas</th>
                                            <th className="px-6 py-3">Mata Pelajaran</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {teacher.schedules.map((schedule, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                    {schedule.day_name}, {schedule.date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="font-semibold">Ke-{schedule.jam_ke}</span> 
                                                        <span className="text-xs text-gray-500 ml-1">({schedule.waktu})</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                        {schedule.class_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700">
                                                    {schedule.mapel_name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AbsensiLayout>
    );
}
