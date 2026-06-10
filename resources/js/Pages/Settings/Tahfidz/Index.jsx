
import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Calendar, Save, AlertCircle, Trash2, UserPlus, Search, ShieldCheck, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';

export default function TahfidzSettingsIndex({ startDate, endDate, subjects = [], quranSkriningEnabled = true }) {

    // --- Exam Period Logic ---
    // Ensure datetime-local compatibility by replacing space with T
    const formatDatetimeLocal = (val) => val ? val.replace(' ', 'T').substring(0, 16) : '';

    const { data: periodData, setData: setPeriodData, post: postPeriod, processing: periodProcessing, errors: periodErrors, recentlySuccessful: periodSuccess } = useForm({
        start_date: formatDatetimeLocal(startDate),
        end_date: formatDatetimeLocal(endDate),
    });

    const submitPeriod = (e) => {
        e.preventDefault();
        postPeriod(route('settings.tahfidz.exam-period.store'), { preserveScroll: true });
    };

    const [skriningData, setSkriningDataState] = React.useState({ enabled: !!quranSkriningEnabled });
    const [skriningProcessing, setSkriningProcessing] = React.useState(false);
    const [skriningSuccess, setSkriningSuccess] = React.useState(false);
    const [skriningError, setSkriningError] = React.useState(null);

    const setSkriningData = (key, value) => setSkriningDataState(prev => ({ ...prev, [key]: value }));

    const submitSkriningSetting = async (e) => {
        e.preventDefault();
        setSkriningProcessing(true);
        setSkriningSuccess(false);
        setSkriningError(null);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                setSkriningError('CSRF token tidak ditemukan. Refresh halaman dan coba lagi.');
                setSkriningProcessing(false);
                return;
            }

            const response = await fetch('/settings/tahfidz/quran-skrining', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ enabled: skriningData.enabled }),
            });

            if (response.ok) {
                const result = await response.json();
                setSkriningData('enabled', result.enabled);
                setSkriningSuccess(true);
                setTimeout(() => setSkriningSuccess(false), 3000);
                // Reload Inertia props to refresh quran_settings for sidebar without full page reload
                router.reload({ only: ['quran_settings'] });
            } else {
                let errorMessage = 'Gagal menyimpan pengaturan.';
                try {
                    const err = await response.json();
                    errorMessage = err.message || errorMessage;
                } catch (e) {
                    // Response bukan JSON, gunakan error default
                }
                setSkriningError(errorMessage);
            }
        } catch (err) {
            console.error('Skrining setting error:', err);
            setSkriningError('Terjadi kesalahan jaringan. Pastikan koneksi stabil.');
        } finally {
            setSkriningProcessing(false);
        }
    };


    // --- Tester Plotting Logic ---
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [teacherQuery, setTeacherQuery] = useState('');
    const [foundTeachers, setFoundTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // Form for adding tester
    const { data: testerData, setData: setTesterData, post: postTester, processing: testerProcessing, reset: resetTester } = useForm({
        active_subject_id: '',
        user_id: '',
        type: 'assistant',
    });

    const handleSearch = async (q) => {
        setTeacherQuery(q);
        if (q.length > 2) {
            const res = await fetch(route('api.teachers.search', { query: q }));
            const json = await res.json();
            setFoundTeachers(json);
        } else {
            setFoundTeachers([]);
        }
    };

    const handleAddTester = (e) => {
        e.preventDefault();
        postTester(route('settings.tahfidz.testers.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                resetTester();
                setTeacherQuery('');
                setSelectedTeacher(null);
            }
        });
    };
    // Derive selected subject from props to ensure reactivity
    const activeSubject = selectedSubject ? subjects.find(s => s.id === selectedSubject.id) : null;

    // Delete form
    const { delete: destroyTester } = useForm();
    const handleDeleteTester = (id) => {
        if (confirm('Hapus penguji ini?')) {
            destroyTester(route('settings.tahfidz.testers.destroy', id));
        }
    };


    return (
        <MainLayout>
            <Head title="Pengaturan Tahfidz" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan Master Tahfidz</h1>
                    <p className="text-gray-500">Kelola masa ujian dan plotting penguji tahfidz dalam satu tempat.</p>
                </div>

                <Tabs defaultValue="exam-period" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md bg-white border shadow-sm p-1 h-auto rounded-xl">
                        <TabsTrigger
                            value="exam-period"
                            className="rounded-lg py-2.5 text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-indigo-600"
                        >
                            Waktu Ujian
                        </TabsTrigger>
                        <TabsTrigger
                            value="testers"
                            className="rounded-lg py-2.5 text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-indigo-600"
                        >
                            Plotting Penguji
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB 1: MASA UJIAN --- */}
                    <TabsContent value="exam-period">
                        <div className="space-y-6 max-w-2xl">
                            <Card>
                                <form onSubmit={submitPeriod}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-indigo-600" />
                                            Pengaturan Masa Ujian
                                        </CardTitle>
                                        <CardDescription>
                                            Tentukan jadwal input nilai ujian. Diluar masa ini, input nilai terkunci.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="start_date">Waktu Mulai</Label>
                                                <Input
                                                    id="start_date"
                                                    type="datetime-local"
                                                    value={periodData.start_date}
                                                    onChange={(e) => setPeriodData('start_date', e.target.value)}
                                                    className={periodErrors.start_date ? 'border-red-500' : ''}
                                                />
                                                {periodErrors.start_date && <p className="text-sm text-red-500">{periodErrors.start_date}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="end_date">Waktu Selesai</Label>
                                                <Input
                                                    id="end_date"
                                                    type="datetime-local"
                                                    value={periodData.end_date}
                                                    onChange={(e) => setPeriodData('end_date', e.target.value)}
                                                    className={periodErrors.end_date ? 'border-red-500' : ''}
                                                />
                                                {periodErrors.end_date && <p className="text-sm text-red-500">{periodErrors.end_date}</p>}
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 text-amber-800 text-sm">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            <div>
                                                <span className="font-semibold">Catatan:</span>
                                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                                    <li>Diluar tanggal diatas, Guru/Penguji tidak dapat mengubah nilai.</li>
                                                    <li>Administrator memiliki hak akses bypass.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t px-6 py-4">
                                        <div className="text-sm text-gray-500">
                                            {periodSuccess && <span className="text-green-600 font-medium">Pengaturan berhasil disimpan.</span>}
                                        </div>
                                        <Button type="submit" disabled={periodProcessing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {periodProcessing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>

                            <Card>
                                <form onSubmit={submitSkriningSetting}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                            Kontrol Menu Skrining Al-Quran
                                        </CardTitle>
                                        <CardDescription>
                                            Aktifkan hanya saat kebutuhan manajemen Tahfidz sedang berjalan. Saat nonaktif, menu Skrining tetap tampil di sidebar tetapi tidak bisa dibuka.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className={`rounded-xl border p-4 ${skriningData.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200 bg-stone-50'}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        Status saat ini: {skriningData.enabled ? 'Aktif' : 'Nonaktif'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Jika dinonaktifkan, pengguna tetap melihat menu Skrining namun tombolnya terkunci.
                                                    </p>
                                                </div>
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={skriningData.enabled}
                                                        onChange={(e) => setSkriningData('enabled', e.target.checked)}
                                                    />
                                                    <div className="relative w-12 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 text-amber-800 text-sm">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            <div>
                                                <span className="font-semibold">Perilaku sistem:</span>
                                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                                    <li>Menu `Skrining` tetap terlihat di sidebar agar struktur menu tidak berubah.</li>
                                                    <li>Saat `off`, menu menjadi terkunci dan akses langsung ke halaman Skrining dialihkan ke Tilawah.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t px-6 py-4">
                                        <div className="text-sm">
                                            {skriningSuccess && <span className="text-green-600 font-medium">Pengaturan skrining berhasil disimpan.</span>}
                                            {skriningError && <span className="text-red-600 font-medium">{skriningError}</span>}
                                        </div>
                                        <Button type="submit" disabled={skriningProcessing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {skriningProcessing ? 'Menyimpan...' : 'Simpan Status Skrining'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- TAB 2: PLOTTING PENGUJI --- */}
                    <TabsContent value="testers">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* List of Classes */}
                            <div className="md:col-span-1 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Daftar Kelas</CardTitle>
                                        <CardDescription>Pilih kelas untuk mengatur penguji</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                                        {subjects.length > 0 ? subjects.map(subject => (
                                            <div
                                                key={subject.id}
                                                onClick={() => setSelectedSubject(subject)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${activeSubject?.id === subject.id
                                                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                                    : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                                                    }`}
                                            >
                                                <h3 className="font-semibold text-gray-800">{subject.class_name}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <User className="w-3 h-3" />
                                                    <span>{subject.testers.length} Penguji</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-gray-500 italic">Tidak ada kelas Tahfidz ditemukan.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Editor Area */}
                            <div className="md:col-span-2">
                                {activeSubject ? (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>{activeSubject.class_name}</CardTitle>
                                                <CardDescription>Daftar Penguji Tahfidz</CardDescription>
                                            </div>
                                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                                <DialogTrigger asChild>
                                                    <Button onClick={() => {
                                                        setTesterData('active_subject_id', activeSubject.id);
                                                        setIsAddOpen(true);
                                                    }}>
                                                        <UserPlus className="w-4 h-4 mr-2" />
                                                        Tambah Penguji
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Tambah Penguji Tahfidz</DialogTitle>
                                                    </DialogHeader>
                                                    <form onSubmit={handleAddTester} className="space-y-4 mt-4">
                                                        <div>
                                                            <Label>Cari Guru</Label>
                                                            <div className="relative mt-1">
                                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    placeholder="Ketik nama guru..."
                                                                    value={teacherQuery}
                                                                    onChange={e => handleSearch(e.target.value)}
                                                                />
                                                            </div>
                                                            {foundTeachers.length > 0 && (
                                                                <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                                                                    {foundTeachers.map(teacher => (
                                                                        <div
                                                                            key={teacher.id}
                                                                            onClick={() => {
                                                                                setSelectedTeacher(teacher);
                                                                                setTesterData('user_id', teacher.id);
                                                                                setTeacherQuery(teacher.name);
                                                                                setFoundTeachers([]);
                                                                            }}
                                                                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                                        >
                                                                            {teacher.name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {selectedTeacher && (
                                                                <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                                                                    Terpilih: <b>{selectedTeacher.name}</b>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label>Tipe Penguji</Label>
                                                            <Select
                                                                value={testerData.type}
                                                                onValueChange={val => setTesterData('type', val)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="main">Penguji Utama</SelectItem>
                                                                    <SelectItem value="assistant">Penguji Pendamping</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <DialogFooter>
                                                            <Button type="submit" disabled={!testerData.user_id || testerProcessing}>
                                                                Simpan
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {activeSubject.testers.map(tester => (
                                                    <div key={tester.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${tester.type === 'main' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                {tester.type === 'main' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{tester.name}</h4>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${tester.type === 'main' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                                    {tester.type === 'main' ? 'Penguji Utama' : 'Penguji Pendamping'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteTester(tester.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                {activeSubject.testers.length === 0 && (
                                                    <div className="text-center py-8 text-gray-400">
                                                        Belum ada penguji.
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/50 text-gray-400">
                                        <div className="text-center">
                                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>Pilih kelas di samping untuk melihat penguji</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
