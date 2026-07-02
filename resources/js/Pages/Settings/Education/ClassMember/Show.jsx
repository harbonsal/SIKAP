import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, UserPlus, Trash2, Search, Save, X, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

export default function Show({ activeClass, members, availableStudents, allActiveClasses }) {
    const { auth } = usePage().props;
    // Check permissions (Admin always has access)
    const permissions = auth.user?.permissions || [];
    const isAdmin = auth.user?.roles?.includes('Administrator') || auth.user?.user_level?.name === 'Administrator';

    // Permission flags
    const canAdd = isAdmin || permissions.includes('create_class_members');
    const canDelete = isAdmin || permissions.includes('delete_class_members');

    const { delete: destroy, post, processing } = useForm();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchAvailable, setSearchAvailable] = useState('');

    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [memberToMove, setMemberToMove] = useState(null);
    const [targetClassId, setTargetClassId] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);

    const handleRemove = (id) => {
        if (confirm('Apakah Anda yakin ingin mengeluarkan siswa ini dari kelas?')) {
            destroy(route('class-members.destroy', id));
        }
    };

    const handleOpenMoveModal = (member) => {
        setMemberToMove(member);
        setTargetClassId('');
        setIsMoveModalOpen(true);
    };

    const handleMove = () => {
        if (!targetClassId) {
            alert('Pilih kelas tujuan terlebih dahulu!');
            return;
        }
        router.post(route('class-members.move', memberToMove.id), {
            target_class_id: targetClassId
        }, {
            onBefore: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false),
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setMemberToMove(null);
            },
        });
    };

    const handleAddStudents = () => {
        router.post(route('class-members.store'), {
            active_class_id: activeClass.id,
            student_ids: selectedStudents,
        }, {
            onBefore: () => setIsProcessing(true),
            onFinish: () => setIsProcessing(false),
            onSuccess: () => {
                setIsAddModalOpen(false);
                setSelectedStudents([]);
            },
        });
    };

    const toggleStudentSelection = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const filteredAvailableStudents = availableStudents.filter(student =>
        String(student?.user?.name || '').toLowerCase().includes(String(searchAvailable).toLowerCase()) ||
        String(student?.user?.nomor_induk || '').includes(String(searchAvailable))
    );

    return (
        <MainLayout>
            <Head title={`Anggota Kelas ${activeClass.kelas?.name}`} />

            <div className="flex border-b border-border mb-6 overflow-x-auto">
                <Link href={route('students.index')} className={`px-4 py-3 border-b-2 whitespace-nowrap ${route().current('students.*') ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    Cari & Biodata Santri
                </Link>
                {auth.user?.permissions?.includes('view_class_members') && (
                    <Link href={route('class-members.index')} className={`px-4 py-3 border-b-2 whitespace-nowrap ${route().current('class-members.*') ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        Anggota Kelas
                    </Link>
                )}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('class-members.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                {activeClass.kelas?.name} {activeClass.kelas_paralel?.name ?? ''}
                            </h2>
                            <p className="text-muted-foreground">
                                {activeClass.academic_year?.name} - {activeClass.academic_year?.semester} • Wali Kelas: {activeClass.teacher?.name || '-'}
                            </p>
                        </div>
                    </div>
                    {canAdd && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah Siswa
                        </button>
                    )}
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Nama Siswa</th>
                                    <th className="px-6 py-3 font-medium">NIS / NISN</th>
                                    <th className="px-6 py-3 font-medium">Kamar</th>
                                    <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {members.length > 0 ? (
                                    members.map((member, index) => (
                                        <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-center">{index + 1}</td>
                                            <td className="px-6 py-4 font-medium">{member.student?.user?.name || 'Siswa Terhapus'}</td>
                                            <td className="px-6 py-4">
                                                <div>{member.student?.user?.nomor_induk || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{member.student?.nisn || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.student?.kamar_members?.length > 0
                                                    ? member.student.kamar_members[0].active_kamar?.kamar?.name
                                                    : '-'}
                                            </td>
                                            {canDelete && (
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenMoveModal(member)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-primary/10 hover:text-primary"
                                                            title="Pindah Kelas"
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(member.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                                                            title="Keluarkan dari kelas (Tinggal Kelas)"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={canDelete ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada siswa di kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-background rounded-xl shadow-lg flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Tambah Siswa ke Kelas</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari siswa yang belum mendapat kelas..."
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={searchAvailable}
                                    onChange={(e) => setSearchAvailable(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredAvailableStudents.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredAvailableStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.id)
                                                ? 'bg-primary/10 border-primary/20'
                                                : 'hover:bg-muted'
                                                }`}
                                            onClick={() => toggleStudentSelection(student.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedStudents.includes(student.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                                                    }`}>
                                                    {selectedStudents.includes(student.id) && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{student?.user?.name || 'Siswa Tidak Dikenal'}</div>
                                                    <div className="text-xs text-muted-foreground">{student?.user?.nomor_induk || '-'} • {student?.gender || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    Tidak ada siswa tersedia (semua siswa sudah masuk kelas atau tidak ditemukan).
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {selectedStudents.length} siswa dipilih
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddStudents}
                                    disabled={selectedStudents.length === 0 || isProcessing}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Class Modal */}
            {isMoveModalOpen && memberToMove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-background rounded-xl shadow-lg flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-xl font-semibold">Pindah Kelas</h3>
                            <button onClick={() => setIsMoveModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Siswa</label>
                                <div className="font-semibold text-lg">{memberToMove.student?.user?.name}</div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium">Kelas Tujuan</label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 mt-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={targetClassId}
                                    onChange={(e) => setTargetClassId(e.target.value)}
                                >
                                    <option value="">-- Pilih Kelas Tujuan --</option>
                                    {allActiveClasses?.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.kelas?.name} {c.kelas_paralel?.name ?? ''} 
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
                            <button
                                onClick={() => setIsMoveModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleMove}
                                disabled={!targetClassId || isProcessing}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Pindahkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
