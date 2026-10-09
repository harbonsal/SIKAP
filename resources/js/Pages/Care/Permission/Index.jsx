import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, Eye, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ kamars, permissions, filters }) {
    const [selectedKamarId, setSelectedKamarId] = useState(filters.active_kamar_id || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [bulkEndTime, setBulkEndTime] = useState('');
    const { auth } = usePage().props;
    const userRole = auth?.user?.user_level?.name;
    const canManagePermissions = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager'].includes(userRole);

    const handleKamarChange = (e) => {
        const kamarId = e.target.value;
        setSelectedKamarId(kamarId);
        router.get(route('permissions.index'), { active_kamar_id: kamarId }, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal perizinan ini? Data historis yang ada di dalamnya akan ikut terhapus.')) {
            router.delete(route('permissions.destroy', id));
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(permissions.data.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} jadwal perizinan terpilih?`)) {
            router.post(route('permissions.bulk-destroy'), { ids: selectedIds }, {
                onSuccess: () => setSelectedIds([])
            });
        }
    };

    const handleBulkUpdate = (e) => {
        e.preventDefault();
        router.post(route('permissions.bulk-update-time'), { 
            ids: selectedIds, 
            end_time: bulkEndTime 
        }, {
            onSuccess: () => {
                setShowBulkEditModal(false);
                setSelectedIds([]);
                setBulkEndTime('');
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Manajemen Perizinan" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Perizinan</h2>
                        <p className="text-muted-foreground">Kelola perizinan keluar/masuk santri (Pesiar, Izin Sakit, dll).</p>
                    </div>
                    <Link
                        href={route('permissions.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Izin Baru
                    </Link>
                </div>

                {/* Tabs / Navigation */}
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-max mb-6">
                    <Link
                        href={route('rfid.scan')}
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                    >
                        Pos Scanner
                    </Link>
                    {canManagePermissions && (
                        <Link
                            href={route('permissions.index')}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-background shadow-sm text-foreground transition-all"
                        >
                            Daftar Perizinan
                        </Link>
                    )}
                    <Link
                        href={route('permissions.monitor')}
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-background/50 text-muted-foreground transition-all"
                    >
                        Pantauan Real-time
                    </Link>
                </div>

                {/* Filter Section */}
                <div className="bg-card rounded-xl border shadow-sm p-4 flex justify-between items-end">
                    <div className="max-w-sm w-full">
                        <label className="block text-sm font-medium mb-1">Filter Kamar</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedKamarId}
                            onChange={handleKamarChange}
                        >
                            <option value="">-- Semua Kamar --</option>
                            {kamars.map(kamar => (
                                <option key={kamar.id} value={kamar.id}>
                                    {kamar.name} (Musrif: {kamar.musrif})
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBulkEditModal(true)}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Waktu Terpilih ({selectedIds.length})
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Terpilih ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Permissions List */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary focus:ring-primary"
                                            onChange={handleSelectAll}
                                            checked={permissions.data.length > 0 && selectedIds.length === permissions.data.length}
                                        />
                                    </th>
                                    <th className="px-6 py-3 font-medium">Nama Izin</th>
                                    <th className="px-6 py-3 font-medium">Kamar</th>
                                    <th className="px-6 py-3 font-medium">Waktu Mulai</th>
                                    <th className="px-6 py-3 font-medium">Waktu Akhir</th>
                                    <th className="px-6 py-3 font-medium text-center">Jumlah Santri</th>
                                    <th className="px-6 py-3 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {permissions.data.length > 0 ? (
                                    permissions.data.map((permission) => (
                                        <tr key={permission.id} className={`hover:bg-muted/50 ${selectedIds.includes(permission.id) ? 'bg-muted/30' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-input text-primary focus:ring-primary"
                                                    checked={selectedIds.includes(permission.id)}
                                                    onChange={() => handleSelectRow(permission.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium">{permission.name}</td>
                                            <td className="px-6 py-4">{permission.kamar}</td>
                                            <td className="px-6 py-4">{permission.start_time}</td>
                                            <td className="px-6 py-4">{permission.end_time}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                    {permission.student_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={route('permissions.show', permission.id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(permission.id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-destructive hover:bg-destructive/10 h-9 w-9"
                                                    title="Hapus Izin"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada data perizinan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={showBulkEditModal} onClose={() => setShowBulkEditModal(false)} maxWidth="md">
                <form onSubmit={handleBulkUpdate} className="p-6">
                    <h2 className="text-lg font-medium text-foreground mb-4">Edit Waktu Kedatangan Massal</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Ubah batas waktu kedatangan untuk {selectedIds.length} jadwal perizinan terpilih.
                    </p>
                    
                    <div className="mb-4">
                        <InputLabel htmlFor="bulk_end_time" value="Waktu Akhir/Kedatangan Baru" />
                        <TextInput
                            id="bulk_end_time"
                            type="datetime-local"
                            className="mt-1 block w-full"
                            value={bulkEndTime}
                            onChange={e => setBulkEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setShowBulkEditModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton type="submit">Simpan Perubahan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
