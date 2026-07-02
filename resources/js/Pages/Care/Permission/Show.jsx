import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin, Calendar, Edit2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Show({ permission, students }) {
    const [showEditTime, setShowEditTime] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        end_time: permission.raw_end_time || ''
    });

    const handleEditTime = (e) => {
        e.preventDefault();
        put(route('permissions.updateTime', permission.id), {
            onSuccess: () => setShowEditTime(false)
        });
    };
    return (
        <MainLayout>
            <Head title={`Detail Izin: ${permission.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('permissions.index')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{permission.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {permission.kamar}</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {permission.time_range}
                                <button onClick={() => setShowEditTime(true)} className="ml-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                                    <Edit2 className="h-3 w-3 mr-1" /> Edit Batas Waktu
                                </button>
                            </span>
                        </div>
                    </div>
                </div>

                {permission.description && (
                    <div className="bg-muted/30 p-4 rounded-md text-sm border">
                        <span className="font-semibold block mb-1">Keterangan:</span>
                        {permission.description}
                    </div>
                )}

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/50">
                        <h3 className="font-semibold">Daftar Santri</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/20 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nama Santri</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-center">Jam Keluar</th>
                                    <th className="px-6 py-3 font-medium text-center">Jam Kembali</th>
                                    <th className="px-6 py-3 font-medium">Uang Saku</th>
                                    <th className="px-6 py-3 font-medium">Brg Titipan/Sitaan</th>
                                    <th className="px-6 py-3 font-medium">Keterangan Lanjut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 font-medium">{student.student_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent 
                                                ${student.status === 'Pending' ? 'bg-secondary text-secondary-foreground' :
                                                        student.status === 'Out' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'}`}
                                            >
                                                {student.status === 'Out' ? 'Keluar' : student.status === 'Returned' ? 'Kembali' : 'Belum Keluar'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xs">{student.exit_at}</td>
                                        <td className="px-6 py-4 text-center font-mono text-xs">
                                            {student.return_at}
                                            {student.is_late && <span className="ml-2 text-[10px] text-red-600 bg-red-100 px-1 rounded">LATE</span>}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">{student.uang_saku ? 'Rp ' + student.uang_saku.toLocaleString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4 text-sm">{student.barang_titipan || '-'}</td>
                                        <td className="px-6 py-4 text-muted-foreground italic">{student.keterangan || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showEditTime && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background w-full max-w-md rounded-xl shadow-lg border">
                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h3 className="font-bold text-lg">Edit Batas Waktu Kedatangan</h3>
                        </div>
                        <form onSubmit={handleEditTime} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Batas Waktu Kedatangan Baru</label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.end_time}
                                    onChange={e => setData('end_time', e.target.value)}
                                    required
                                />
                                {errors.end_time && <p className="text-xs text-red-500">{errors.end_time}</p>}
                                <p className="text-xs text-muted-foreground">Merubah batas waktu akan merubah batas keterlambatan seluruh santri pada perizinan ini.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditTime(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-accent"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"
                                >
                                    {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
