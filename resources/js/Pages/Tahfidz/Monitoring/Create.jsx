import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, Plus, Trash2, Clock, Calendar, User } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Select from 'react-select';
import Checkbox from '@/Components/Checkbox';

export default function Create({ sessions, musyrifs, scheduledOfficers, currentDate, currentUser }) {
    const [detectedSession, setDetectedSession] = useState(null);

    // Violation Form State
    const [violationMusyrif, setViolationMusyrif] = useState(null);
    const [violationType, setViolationType] = useState(null);
    const [violationNote, setViolationNote] = '';
    const [violationList, setViolationList] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        session_id: '',
        user_id: currentUser.id, // Default to logged in user
        general_note: '',
        attendances: musyrifs.map(m => ({ musyrif_id: m.id, status: 'Hadir' })), // Default all present
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
            setData('session_id', found.id);
        }
    }, [sessions]);

    // Construct Officer Options
    const officerOptions = scheduledOfficers.map(o => ({
        value: o.user.id,
        label: `${o.user.name} (${o.session.name} - ${['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'][o.day_of_week]})`
    }));

    // Add current user if not in scheduled (optional, but good for UX)
    if (!officerOptions.find(o => o.value === currentUser.id)) {
        officerOptions.unshift({ value: currentUser.id, label: `${currentUser.name} (Anda)` });
    }

    const musyrifOptions = musyrifs.map(m => ({ value: m.id, label: m.student.name }));

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
                return { ...a, status: isChecked ? 'Hadir' : 'Alpha' }; // Default uncheck = Alpha? Or Absent. 
                // User image shows "Semua Hadir" checkbox. 
                // Let's assume checked = Hadir. Unchecked = Absen/Sakit/Izin? 
                // Usually checklist implies presence. 
                // But simplified: Yes/No. 
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
        post(route('tahfidz.monitoring.store'));
    };

    return (
        <MainLayout>
            <Head title="Input Pantauan Halaqoh" />

            <div className="py-6 max-w-4xl mx-auto px-4">
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
                                    <div className={`mt-1 p-2 rounded-md font-medium ${detectedSession ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {detectedSession ? detectedSession.name : 'Di luar sesi'}
                                    </div>
                                    {!detectedSession && (
                                        <p className="text-xs text-red-500 mt-1">* Waktu sekarang tidak masuk dalam sesi manapun.</p>
                                    )}
                                    <input type="hidden" name="session_id" value={data.session_id} />
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-green-600" />
                                    Kehadiran Musyrif
                                </h3>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="mb-4">
                                        <label className="flex items-center">
                                            <Checkbox
                                                onChange={(e) => toggleAllAttendance(e.target.checked)}
                                            />
                                            <span className="ml-2 text-sm font-bold text-gray-700">Semua Hadir</span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {musyrifs.map((m) => {
                                            const attState = data.attendances.find(a => a.musyrif_id === m.id);
                                            const isChecked = attState?.status === 'Hadir';
                                            return (
                                                <label key={m.id} className="flex items-center space-x-2 p-2 hover:bg-green-100 rounded cursor-pointer transition-colors">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onChange={(e) => handleAttendanceChange(m.id, e.target.checked)}
                                                    />
                                                    <span className="text-sm text-gray-700 uppercase font-medium">{m.student.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
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
