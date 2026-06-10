import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { PlusCircle, Eye, Trash2 } from 'lucide-react';

export default function Index({ auth, rpps }) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus RPP ini?')) {
            destroy(route('rpp-generator.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">RPP Generator AI</h2>}
        >
            <Head title="RPP Generator AI" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Riwayat RPP</h3>
                                    <p className="mt-1 text-sm text-gray-600">Daftar RPP yang telah di-generate menggunakan AI.</p>
                                </div>
                                <Link href={route('rpp-generator.create')}>
                                    <Button className="flex items-center gap-2">
                                        <PlusCircle className="w-4 h-4" />
                                        Buat RPP Baru
                                    </Button>
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran & Kelas</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topik</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rpps.data.length > 0 ? (
                                            rpps.data.map((rpp) => (
                                                <tr key={rpp.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(rpp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="font-medium">{rpp.active_subject?.mapel?.name || '-'}</div>
                                                        <div className="text-xs text-gray-500">{rpp.active_subject?.active_class?.name || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {rpp.topic}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {rpp.teaching_method?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link href={route('rpp-generator.show', rpp.id)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                            <Eye className="w-5 h-5 inline" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(rpp.id)}
                                                            disabled={processing}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-5 h-5 inline" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                                    Belum ada riwayat RPP yang dibuat. Klik tombol "Buat RPP Baru" untuk memulai.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Simple pagination component */}
                            {rpps.links && rpps.links.length > 3 && (
                                <div className="mt-4 flex justify-end">
                                    <div className="flex flex-wrap -mb-1">
                                        {rpps.links.map((link, key) => (
                                            link.url === null ? (
                                                <div key={key} className="mr-1 mb-1 px-4 py-3 text-sm leading-4 text-gray-400 border rounded" dangerouslySetInnerHTML={{ __html: link.label }} />
                                            ) : (
                                                <Link key={key} className={`mr-1 mb-1 px-4 py-3 text-sm leading-4 border rounded hover:bg-white focus:border-indigo-500 focus:text-indigo-500 ${link.active ? 'bg-indigo-50 text-indigo-600' : ''}`} href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
