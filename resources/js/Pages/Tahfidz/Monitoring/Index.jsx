import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Eye, Calendar } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';

export default function Index({ monitorings, filters }) {
    const [date, setDate] = useState(filters.date || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('tahfidz.monitoring.index'), { date }, { preserveState: true });
    };

    return (
        <MainLayout>
            <Head title="Riwayat Pantauan Halaqoh" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">Riwayat Pantauan Halaqoh</h2>
                    <Link href={route('tahfidz.monitoring.create')}>
                        <PrimaryButton><Plus className="w-4 h-4 mr-2" /> Input Laporan</PrimaryButton>
                    </Link>
                </div>

                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <form onSubmit={handleSearch} className="flex gap-4 mb-6">
                        <div className="flex-1 max-w-xs">
                            <TextInput
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <PrimaryButton>Filter Tanggal</PrimaryButton>
                        {date && (
                            <button
                                type="button"
                                onClick={() => { setDate(''); router.get(route('tahfidz.monitoring.index')); }}
                                className="text-gray-500 hover:text-gray-700 underline text-sm py-2"
                            >
                                Reset
                            </button>
                        )}
                    </form>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petugas</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {monitorings.data.length > 0 ? monitorings.data.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(m.recorded_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {m.session?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {m.user?.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {m.general_note || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={route('tahfidz.monitoring.show', m.id)} className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                                                <Eye className="w-4 h-4 mr-1" />
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500 italic">
                                            Belum ada data laporan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4">
                        <Pagination links={monitorings.links} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
