
import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Edit, Save, X, Search, Filter, User, Users, Clipboard } from 'lucide-react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import Select from 'react-select';

export default function Index({ sessions, officers, musyrifs, users, students, filters }) {
    const [activeTab, setActiveTab] = useState('members'); // Default to new tab for visibility
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [showMusyrifModal, setShowMusyrifModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    // --- State for "Plotting Anggota" ---
    const [selectedMusyrifId, setSelectedMusyrifId] = useState(null);
    const activeMusyrif = musyrifs.find(m => m.id === selectedMusyrifId);

    // --- Filter State ---
    const [monthAttributes, setMonthAttributes] = useState({
        month: filters?.month || new Date().toISOString().slice(0, 7)
    });

    const handleMonthChange = (e) => {
        setMonthAttributes({ month: e.target.value });
        router.get(route('tahfidz.halaqoh-settings.index'), { month: e.target.value }, { preserveState: true, preserveScroll: true });
    };

    // --- Session Form ---
    const { data: sessionData, setData: setSessionData, post: postSession, put: putSession, processing: sessionProcessing, errors: sessionErrors, reset: resetSession } = useForm({
        name: '',
        start_time: '',
        end_time: '',
    });

    const openSessionModal = (session = null) => {
        setEditingSession(session);
        if (session) {
            setSessionData({
                name: session.name,
                start_time: session.start_time,
                end_time: session.end_time,
            });
        } else {
            resetSession();
        }
        setShowSessionModal(true);
    };

    const submitSession = (e) => {
        e.preventDefault();
        if (editingSession) {
            putSession(route('tahfidz.halaqoh-settings.session.update', editingSession.id), {
                onSuccess: () => setShowSessionModal(false),
            });
        } else {
            postSession(route('tahfidz.halaqoh-settings.session.store'), {
                onSuccess: () => setShowSessionModal(false),
            });
        }
    };

    // --- Officer Form ---
    const { data: officerData, setData: setOfficerData, post: postOfficer, delete: deleteOfficer, processing: officerProcessing, errors: officerErrors, reset: resetOfficer } = useForm({
        user_id: '',
        session_id: '',
        assigned_date: '',
    });

    const openOfficerModal = () => {
        resetOfficer();
        setOfficerData('assigned_date', new Date().toISOString().slice(0, 10));
        setShowOfficerModal(true);
    };

    const submitOfficer = (e) => {
        e.preventDefault();
        postOfficer(route('tahfidz.halaqoh-settings.officer.store'), {
            onSuccess: () => setShowOfficerModal(false),
        });
    };

    const handleDeleteOfficer = (id) => {
        if (confirm('Hapus petugas ini?')) {
            router.delete(route('tahfidz.halaqoh-settings.officer.destroy', id));
        }
    };

    // --- Musyrif Form ---
    const { data: musyrifData, setData: setMusyrifData, post: postMusyrif, delete: deleteMusyrif, processing: musyrifProcessing, errors: musyrifErrors, reset: resetMusyrif } = useForm({
        student_id: '',
    });

    const openMusyrifModal = () => {
        resetMusyrif();
        setShowMusyrifModal(true);
    };

    const submitMusyrif = (e) => {
        e.preventDefault();
        postMusyrif(route('tahfidz.halaqoh-settings.musyrif.store'), {
            onSuccess: () => setShowMusyrifModal(false),
        });
    };

    const handleDeleteMusyrif = (id) => {
        if (confirm('Hapus/Nonaktifkan Musyrif ini?')) {
            router.delete(route('tahfidz.halaqoh-settings.musyrif.destroy', id));
        }
    };

    // --- Member Form ---
    const { data: memberData, setData: setMemberData, post: postMember, processing: memberProcessing, reset: resetMember } = useForm({
        musyrif_id: '',
        student_id: '',
        nis_list: '',
    });

    const submitMember = (e) => {
        e.preventDefault();
        memberData.musyrif_id = selectedMusyrifId; // Ensure ID is set
        postMember(route('tahfidz.halaqoh-settings.members.store'), {
            onSuccess: () => {
                resetMember();
                // Keep the musyrif selected
            },
            preserveScroll: true,
        });
    };

    const handleDeleteMember = (id) => {
        if (confirm('Hapus anggota ini dari halaqoh?')) {
            router.delete(route('tahfidz.halaqoh-settings.members.destroy', id), {
                preserveScroll: true,
            });
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    };

    const studentOptions = students.map(s => ({ value: s.id, label: `${s.name} (${s.class_members?.[s.class_members.length - 1]?.active_class?.name || '-'})` }));
    const userOptions = users.map(u => ({ value: u.id, label: u.name }));

    return (
        <MainLayout>
            <Head title="Pengaturan Pantauan Halaqoh" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                {/* --- TABS --- */}
                <div className="flex p-1 mb-6 bg-gray-100/50 rounded-xl border w-fit">
                    <button
                        onClick={() => setActiveTab('officers')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'officers'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-200/50'
                            }`}
                    >
                        Plotting Petugas
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'sessions'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-200/50'
                            }`}
                    >
                        Sesi Halaqoh
                    </button>
                    <button
                        onClick={() => setActiveTab('musyrifs')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'musyrifs'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-200/50'
                            }`}
                    >
                        Data Musyrif
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'members'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-200/50'
                            }`}
                    >
                        Plotting Anggota
                    </button>
                </div>

                {/* --- OFFICERS TAB --- */}
                {activeTab === 'officers' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Jadwal Petugas Pemantau (v2.0)</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Bulan:</span>
                                    <input
                                        type="month"
                                        value={monthAttributes.month}
                                        onChange={handleMonthChange}
                                        className="border-gray-300 rounded-md shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <PrimaryButton onClick={openOfficerModal}><Plus className="w-4 h-4 mr-2" /> Tambah Petugas</PrimaryButton>
                            </div>
                        </div>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Petugas</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {officers.length > 0 ? officers.map((off) => (
                                        <tr key={off.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(off.assigned_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{off.session?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{off.user?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDeleteOfficer(off.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center py-4 text-gray-500">Belum ada data untuk bulan ini</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- SESSIONS TAB --- */}
                {activeTab === 'sessions' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-semibold">Daftar Sesi Halaqoh</h3>
                            <PrimaryButton onClick={() => openSessionModal()}><Plus className="w-4 h-4 mr-2" /> Tambah Sesi</PrimaryButton>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {sessions.map((sess) => (
                                <div key={sess.id} className="border p-4 rounded-lg shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="font-bold text-lg">{sess.name}</h4>
                                        <p className="text-gray-600">{sess.start_time} - {sess.end_time}</p>
                                    </div>
                                    <button onClick={() => openSessionModal(sess)} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full"><Edit className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MUSYRIFS TAB --- */}
                {activeTab === 'musyrifs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-semibold">Daftar Musyrif Halaqoh</h3>
                            <PrimaryButton onClick={openMusyrifModal}><Plus className="w-4 h-4 mr-2" /> Tambah Musyrif</PrimaryButton>
                        </div>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Musyrif</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {musyrifs.map((m) => (
                                        <tr key={m.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{m.student?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{m.student?.class_members?.[m.student.class_members.length - 1]?.active_class?.name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleDeleteMusyrif(m.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- NEW: PLOTTING ANGGOTA TAB --- */}
                {activeTab === 'members' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* LEFT: LIST MUSYRIF */}
                        <div className="md:col-span-1 border rounded-lg overflow-hidden h-fit">
                            <div className="bg-gray-50 px-4 py-3 border-b">
                                <h3 className="font-semibold text-gray-700">Pilih Musyrif</h3>
                            </div>
                            <div className="divide-y max-h-[600px] overflow-y-auto">
                                {musyrifs.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => setSelectedMusyrifId(m.id)}
                                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMusyrifId === m.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <div className="font-medium text-gray-900">{m.student?.name}</div>
                                        <div className="text-xs text-gray-500 flex justify-between mt-1">
                                            <span>{m.student?.class_members?.[m.student.class_members.length - 1]?.active_class?.name || '-'}</span>
                                            <span className="bg-gray-200 px-1.5 rounded text-gray-700">{m.members?.length || 0} Anggota</span>
                                        </div>
                                    </div>
                                ))}
                                {musyrifs.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">Belum ada Musyrif</div>}
                            </div>
                        </div>

                        {/* RIGHT: MEMBER EDITOR */}
                        <div className="md:col-span-2 space-y-4">
                            {activeMusyrif ? (
                                <>
                                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">{activeMusyrif.student?.name}</h3>
                                        <p className="text-gray-500 text-sm">Kelola anggota halaqoh untuk musyrif ini.</p>

                                        <form onSubmit={submitMember} className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel value="Tambah Satu Anggota" />
                                                    <Select
                                                        options={studentOptions}
                                                        onChange={opt => setMemberData('student_id', opt.value)}
                                                        value={studentOptions.find(o => o.value === memberData.student_id)}
                                                        className="mt-1"
                                                        placeholder="Cari Santri..."
                                                        isSearchable
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        menuPortalTarget={document.body}
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel value="Atau Paste NIS (Bulk)" />
                                                    <textarea
                                                        className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                                        rows="2"
                                                        placeholder="Paste NIS disini (pisahkan dengan enter/koma)..."
                                                        value={memberData.nis_list}
                                                        onChange={e => setMemberData('nis_list', e.target.value)}
                                                    ></textarea>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-3">
                                                <PrimaryButton disabled={memberProcessing || (!memberData.student_id && !memberData.nis_list)}>
                                                    <Plus className="w-4 h-4 mr-2" /> Tambahkan
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {activeMusyrif.members && activeMusyrif.members.length > 0 ? activeMusyrif.members.map(mem => (
                                                    <tr key={mem.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{mem.student?.user?.nomor_induk || '-'}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{mem.student?.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{mem.student?.class_members?.[mem.student.class_members.length - 1]?.active_class?.name || '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button onClick={() => handleDeleteMember(mem.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                                                            Belum ada anggota di halaqoh ini.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400 bg-gray-50">
                                    <div className="text-center">
                                        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>Pilih Musyrif disebelah kiri untuk mengelola anggota.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}

            {/* Session Modal */}
            <Modal show={showSessionModal} onClose={() => setShowSessionModal(false)}>
                <form onSubmit={submitSession} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">{editingSession ? 'Edit Sesi' : 'Tambah Sesi'}</h2>
                    <div className="mb-4">
                        <InputLabel value="Nama Sesi (Contoh: Pagi)" />
                        <TextInput value={sessionData.name} onChange={e => setSessionData('name', e.target.value)} className="w-full mt-1" required />
                        <InputError message={sessionErrors.name} className="mt-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <InputLabel value="Mulai" />
                            <TextInput type="time" value={sessionData.start_time} onChange={e => setSessionData('start_time', e.target.value)} className="w-full mt-1" required />
                        </div>
                        <div>
                            <InputLabel value="Selesai" />
                            <TextInput type="time" value={sessionData.end_time} onChange={e => setSessionData('end_time', e.target.value)} className="w-full mt-1" required />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setShowSessionModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={sessionProcessing}>{editingSession ? 'Simpan' : 'Tambah'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Officer Modal */}
            <Modal show={showOfficerModal} onClose={() => setShowOfficerModal(false)}>
                <form onSubmit={submitOfficer} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Tambah Petugas</h2>
                    <div className="mb-4">
                        <InputLabel value="Nama Petugas" />
                        <Select
                            options={userOptions}
                            onChange={opt => setOfficerData('user_id', opt.value)}
                            className="mt-1"
                            placeholder="Pilih Petugas..."
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                menuList: (base) => ({ ...base, maxHeight: '250px' })
                            }}
                        />
                        <InputError message={officerErrors.user_id} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel value="Tanggal Bertugas" />
                        <TextInput
                            type="date"
                            value={officerData.assigned_date}
                            onChange={e => setOfficerData('assigned_date', e.target.value)}
                            className="w-full mt-1"
                            required
                        />
                        <InputError message={officerErrors.assigned_date} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel value="Sesi" />
                        <select
                            value={officerData.session_id}
                            onChange={e => setOfficerData('session_id', e.target.value)}
                            className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="">-- Pilih Sesi --</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>)}
                        </select>
                        <InputError message={officerErrors.session_id} className="mt-2" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setShowOfficerModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={officerProcessing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Musyrif Modal */}
            <Modal show={showMusyrifModal} onClose={() => setShowMusyrifModal(false)}>
                <form onSubmit={submitMusyrif} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Tambah Musyrif</h2>
                    <div className="mb-4">
                        <InputLabel value="Cari Santri" />
                        <Select
                            options={studentOptions}
                            onChange={opt => setMusyrifData('student_id', opt.value)}
                            className="mt-1"
                            placeholder="Ketik nama santri..."
                            isSearchable
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                menuList: (base) => ({ ...base, maxHeight: '250px' })
                            }}
                        />
                        <InputError message={musyrifErrors.student_id} className="mt-2" />
                    </div>
                    <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={() => setShowMusyrifModal(false)}>Batal</SecondaryButton>
                        <PrimaryButton disabled={musyrifProcessing}>Simpan</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
