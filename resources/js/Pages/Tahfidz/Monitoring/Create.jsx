import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, Plus, Trash2, Clock, Calendar, User, X, ChevronDown, ChevronUp } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Select from 'react-select';
import Checkbox from '@/Components/Checkbox';

export default function Create({ sessions, musyrifs, scheduledOfficers, currentDate, currentUser }) {
    const [detectedSession, setDetectedSession] = useState(null);
    const [expandedMusyrif, setExpandedMusyrif] = useState(null);

    // Violation Form State
    const [violationMusyrif, setViolationMusyrif] = useState(null);
    const [violationType, setViolationType] = useState(null);
    const [violationNote, setViolationNote] = useState('');
    const [violationList, setViolationList] = useState([]);

    const initialMemberAttendances = musyrifs.flatMap(m => 
        (m.members || []).map(mem => ({
            student_id: mem.student_id,
            musyrif_id: m.id,
            status: 'Hadir',
            note: ''
        }))
    );

    const { data, setData, post, processing, errors } = useForm({
        session_id: '',
        user_id: currentUser.id, // Default to logged in user
        general_note: '',
        attendances: musyrifs.map(m => ({ musyrif_id: m.id, status: 'Hadir' })), // Default all present
        member_attendances: initialMemberAttendances,
        violations: [],
    });

    useEffect(() => {
        // Auto detect session
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        const found = sessions.find(s => {
            const start = s.start_time.substring(0, 5);
            const end = s.end_time.substring(0, 5);
            return currentTime >= start && currentTime <= end;
        });

        if (found) {
            setDetectedSession(found);
            
            // Cari petugas yang diploting untuk sesi ini
            const plottedOfficer = scheduledOfficers.find(o => o.session_id === found.id);
            
            setData(data => ({
                ...data,
                session_id: found.id,
                user_id: plottedOfficer ? plottedOfficer.user_id : currentUser.id
            }));
        }
    }, [sessions, scheduledOfficers]);

    // Construct Officer Options
    const officerOptions = scheduledOfficers.map(o => ({
        value: o.user.id,
        label: `${o.user.name} (${o.session.name} - ${['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'][o.day_of_week]})`
    }));

    // Add current user if not in scheduled (optional, but good for UX)
    if (!officerOptions.find(o => o.value === currentUser.id)) {
        officerOptions.unshift({ value: currentUser.id, label: `${currentUser.name} (Anda)` });
    }

    const musyrifOptions = musyrifs.map(m => ({ value: m.id, label: m.student ? m.student.name : (m.user ? m.user.name + ' (Ustadz)' : '-') }));

    const violationTypes = [
        { value: 'Terlambat', label: 'Terlambat' },
        { value: 'Tidak bawa mushaf', label: 'Tidak bawa mushaf' },
        { value: 'Tidak tertib', label: 'Tidak tertib/Ribut' },
        { value: 'Tidur', label: 'Tidur' },
        { value: 'Main HP', label: 'Main HP' },
        { value: 'Lainnya', label: 'Lainnya' },
    ];

    const handleAttendanceChange = (musyrifId, isChecked) => {
        const newAttendances = data.attendances.map(a => {
            if (a.musyrif_id === musyrifId) {
                return { ...a, status: isChecked ? 'Hadir' : 'Alpha' };
            }
            return a;
        });
        setData('attendances', newAttendances);
    };

    const toggleAllAttendance = (isChecked) => {
        const newAttendances = data.attendances.map(a => ({
            ...a, status: isChecked ? 'Hadir' : 'Alpha'
        }));
        setData('attendances', newAttendances);
    };

    const handleMemberAttendanceChange = (studentId, field, value) => {
        const updated = data.member_attendances.map(ma => {
            if (ma.student_id === studentId) {
                return { ...ma, [field]: value };
            }
            return ma;
        });
        setData('member_attendances', updated);
    };

    const addViolation = () => {
        if (!violationMusyrif || !violationType) return;

        const newVio = {
            musyrif_id: violationMusyrif.value,
            musyrif_name: violationMusyrif.label,
            violation_type: violationType.value,
            note: violationNote
        };

        const updatedList = [...violationList, newVio];
        setViolationList(updatedList);
        setData('violations', updatedList); // Sync with form data

        // Reset inputs
        setViolationMusyrif(null);
        setViolationType(null);
        setViolationNote('');
    };

    const removeViolation = (index) => {
        const updatedList = violationList.filter((_, i) => i !== index);
        setViolationList(updatedList);
        setData('violations', updatedList);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (!data.session_id) {
            alert("⚠️ Gagal menyimpan: Anda belum memilih Sesi Halaqoh di bagian atas form!");
            return;
        }

        post(route('tahfidz.monitoring.store'), {
            onError: (err) => {
                const errorMsg = Object.values(err).join('\n');
                alert("⚠️ Gagal menyimpan laporan. Periksa kembali isian form Anda:\n\n" + errorMsg);
            }
        });
    };

    return (
        <MainLayout>
            <Head title="Input Pantauan Halaqoh" />

            <div className="py-6 max-w-5xl mx-auto px-4">
                <div className="bg-white overflow-hidden shadow-lg sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-indigo-600" />
                            Input Pantauan Halaqoh
                        </h2>

                        <form onSubmit={submit}>
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <InputLabel value="Nama Petugas" />
                                    <Select
                                        options={officerOptions}
                                        defaultValue={officerOptions.find(o => o.value === data.user_id)}
                                        onChange={opt => setData('user_id', opt.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Waktu Pengisian" />
                                    <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-700 font-medium">
                                        {currentDate}
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Sesi" />
                                    <Select
                                        options={sessions.map(s => ({ 
                                            value: s.id, 
                                            label: `${s.name} (${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)})` 
                                        }))}
                                        value={data.session_id ? { 
                                            value: data.session_id, 
                                            label: sessions.find(s => s.id === data.session_id) 
                                                ? `${sessions.find(s => s.id === data.session_id).name} (${sessions.find(s => s.id === data.session_id).start_time.substring(0, 5)} - ${sessions.find(s => s.id === data.session_id).end_time.substring(0, 5)})` 
                                                : 'Sesi Tidak Diketahui' 
                                        } : null}
                                        onChange={opt => {
                                            const newSessionId = opt ? opt.value : '';
                                            if (opt) {
                                                const selected = sessions.find(s => s.id === opt.value);
                                                setDetectedSession(selected);
                                                
                                                // Auto select plotted officer when manually selecting session
                                                const plottedOfficer = scheduledOfficers.find(o => o.session_id === selected.id);
                                                setData(data => ({
                                                    ...data,
                                                    session_id: selected.id,
                                                    user_id: plottedOfficer ? plottedOfficer.user_id : currentUser.id
                                                }));
                                            } else {
                                                setDetectedSession(null);
                                                setData(data => ({ ...data, session_id: '' }));
                                            }
                                        }}
                                        placeholder="Pilih Sesi (Ubah manual jika telat absen)"
                                        className="mt-1"
                                        isClearable
                                    />
                                    {errors.session_id && <p className="text-xs text-red-500 mt-1">{errors.session_id}</p>}
                                    {(!detectedSession && !data.session_id) && (
                                        <p className="text-xs text-amber-600 mt-1">* Saat ini di luar sesi. Silakan pilih sesi secara manual.</p>
                                    )}
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <User className="w-5 h-5 text-green-600" />
                                        Kehadiran Musyrif & Santri
                                    </h3>
                                    <label className="flex items-center bg-gray-100 px-3 py-1 rounded-md cursor-pointer hover:bg-gray-200">
                                        <Checkbox onChange={(e) => toggleAllAttendance(e.target.checked)} />
                                        <span className="ml-2 text-sm font-bold text-gray-700">Semua Musyrif Hadir</span>
                                    </label>
                                </div>
                                
                                <div className="space-y-3">
                                    {musyrifs.map((m, index) => {
                                        const attState = data.attendances.find(a => a.musyrif_id === m.id);
                                        const isChecked = attState?.status === 'Hadir';
                                        const isExpanded = expandedMusyrif === m.id;
                                        
                                        return (
                                            <div key={m.id} className="border rounded-lg overflow-hidden">
                                                {/* Musyrif Header */}
                                                <div className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50 border-b' : 'bg-white hover:bg-gray-50'}`} onClick={() => setExpandedMusyrif(isExpanded ? null : m.id)}>
                                                    <div className="flex items-center space-x-3">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onChange={(e) => handleAttendanceChange(m.id, e.target.checked)}
                                                            />
                                                        </div>
                                                        <span className="font-medium text-gray-900 uppercase">
                                                            {index + 1}. {m.student ? m.student.name : (m.user ? m.user.name + ' (Ustadz)' : '-')}
                                                        </span>
                                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                                            {m.members?.length || 0} Santri
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-400">
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </div>
                                                </div>

                                                {/* Santri List (Expanded) */}
                                                {isExpanded && (
                                                    <div className="p-4 bg-gray-50">
                                                        {m.members && m.members.length > 0 ? (
                                                            <div className="overflow-x-auto border rounded-lg">
                                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                                    <thead className="bg-gray-100">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600 w-12">No</th>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">NIS</th>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Nama Santri</th>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Kehadiran</th>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Catatan</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {m.members.map((mem, i) => {
                                                                            const sId = mem.student_id;
                                                                            const memAtt = data.member_attendances.find(ma => ma.student_id === sId) || {};
                                                                            return (
                                                                                <tr key={sId}>
                                                                                    <td className="px-4 py-2 text-gray-500 text-center">{i + 1}</td>
                                                                                    <td className="px-4 py-2 text-gray-500">{mem.student?.user?.nomor_induk || '-'}</td>
                                                                                    <td className="px-4 py-2 font-medium text-gray-900">{mem.student?.name}</td>
                                                                                    <td className="px-4 py-2">
                                                                                        <select 
                                                                                            value={memAtt.status || 'Hadir'} 
                                                                                            onChange={(e) => handleMemberAttendanceChange(sId, 'status', e.target.value)}
                                                                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                                                        >
                                                                                            <option value="Hadir">Hadir</option>
                                                                                            <option value="Izin">Izin</option>
                                                                                            <option value="Sakit">Sakit</option>
                                                                                            <option value="Alpha">Alpha</option>
                                                                                        </select>
                                                                                    </td>
                                                                                    <td className="px-4 py-2">
                                                                                        <TextInput
                                                                                            className="w-full text-sm py-1"
                                                                                            placeholder="Keterangan..."
                                                                                            value={memAtt.note || ''}
                                                                                            onChange={(e) => handleMemberAttendanceChange(sId, 'note', e.target.value)}
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-gray-500 py-4">
                                                                Belum ada anggota santri dalam halaqoh ini.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* General Note */}
                            <div className="mb-8">
                                <InputLabel value="Keterangan Umum (Opsional)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.general_note}
                                    onChange={e => setData('general_note', e.target.value)}
                                    placeholder="Catatan tambahan (misal: izin sakit, musyrif pengganti, dll)"
                                />
                            </div>

                            {/* Violation Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-3 text-red-700">Catatan Ketidaktertiban Halaqoh (Opsional)</h3>

                                <div className="flex flex-col md:flex-row gap-2 mb-2">
                                    <div className="w-full md:w-1/3">
                                        <Select
                                            options={musyrifOptions}
                                            value={violationMusyrif}
                                            onChange={setViolationMusyrif}
                                            placeholder="-- Pilih Musyrif --"
                                        />
                                    </div>
                                    <div className="w-full md:w-1/3">
                                        <Select
                                            options={violationTypes}
                                            value={violationType}
                                            onChange={setViolationType}
                                            placeholder="-- Pilih Pelanggaran --"
                                        />
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <SecondaryButton onClick={addViolation} type="button" className="h-[38px]">Tambah</SecondaryButton>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <TextInput
                                        className="w-full"
                                        placeholder="Catatan pelanggaran (detail)"
                                        value={violationNote}
                                        onChange={e => setViolationNote(e.target.value)}
                                    />
                                </div>

                                {/* Violation List */}
                                {violationList.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {violationList.map((vio, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-red-50 p-2 rounded border border-red-100 text-sm md:text-base">
                                                <div>
                                                    <span className="font-bold text-red-800">{vio.musyrif_name}</span>
                                                    <span className="text-gray-600 mx-2">[{vio.violation_type}]</span>
                                                    <span className="text-gray-500 italic">{vio.note}</span>
                                                </div>
                                                <button type="button" onClick={() => removeViolation(idx)} className="text-red-500 hover:text-red-700">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <PrimaryButton disabled={processing} className="w-full md:w-auto text-center justify-center">
                                    <Save className="w-4 h-4 mr-2" /> Simpan Laporan
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
