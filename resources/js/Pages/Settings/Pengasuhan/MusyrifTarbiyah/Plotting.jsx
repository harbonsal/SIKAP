import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Save, Trash2, ArrowLeft, Users } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function Plotting({ musyrifs, plottings }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        musyrif_id: '',
        nis_list: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('musyrif-tarbiyah.plotting.bulkStore'), {
            onSuccess: () => reset('nis_list'),
        });
    };

    return (
        <MainLayout>
            <Head title="Plotting Musyrif Tarbiyah" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('musyrif-tarbiyah.index')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white shadow-sm hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Plotting Musyrif Tarbiyah</h1>
                        <p className="text-sm text-gray-500">
                            Pilih Musyrif dan masukkan daftar NIS untuk dipetakan.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                    {/* Form Input */}
                    <div className="rounded-xl border bg-white shadow-sm p-6 h-fit">
                        <h2 className="text-lg font-semibold border-b pb-4 mb-4">Input Data Plotting</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="musyrif_id" value="Pilih Musyrif/Guru" />
                                <select
                                    id="musyrif_id"
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    value={data.musyrif_id}
                                    onChange={(e) => setData('musyrif_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Musyrif --</option>
                                    {musyrifs.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.musyrif_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="nis_list" value="Daftar NIS Santri (Pisahkan dengan enter/koma)" />
                                <textarea
                                    id="nis_list"
                                    rows={10}
                                    className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                    placeholder="Contoh:&#10;24001&#10;24002&#10;24003"
                                    value={data.nis_list}
                                    onChange={(e) => setData('nis_list', e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Anda bisa langsung copy-paste dari Excel (1 kolom ke bawah).</p>
                                <InputError message={errors.nis_list} className="mt-2" />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Plotting
                            </button>
                        </form>
                    </div>

                    {/* Table Data */}
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-semibold text-lg text-gray-800">Daftar Plotting Saat Ini</h2>
                        </div>
                        <div className="p-4 space-y-6">
                            {plottings.length > 0 ? (
                                plottings.map((group) => (
                                    <div key={group.musyrif_id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200">
                                            <div className="flex items-center font-medium">
                                                <Users className="mr-2 h-4 w-4 text-gray-600" />
                                                {group.musyrif_name}
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                {group.total_students} Santri
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-600 border-b">
                                                    <tr>
                                                        <th className="px-4 py-2 font-medium w-[50px]">No</th>
                                                        <th className="px-4 py-2 font-medium">NIS</th>
                                                        <th className="px-4 py-2 font-medium">Nama Santri</th>
                                                        <th className="px-4 py-2 font-medium text-center w-[80px]">Hapus</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.students.map((student, idx) => (
                                                        <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                                                            <td className="px-4 py-2">{idx + 1}</td>
                                                            <td className="px-4 py-2">{student.nis}</td>
                                                            <td className="px-4 py-2">{student.student_name}</td>
                                                            <td className="px-4 py-2 text-center">
                                                                <Link
                                                                    href={route('musyrif-tarbiyah.plotting.destroy', student.id)}
                                                                    method="delete"
                                                                    as="button"
                                                                    className="text-red-500 hover:text-red-700"
                                                                    preserveScroll
                                                                >
                                                                    <Trash2 className="h-4 w-4 inline-block" />
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 text-gray-500 border-2 border-dashed rounded-xl">
                                    Belum ada data plotting. Silakan input dari form di samping.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
