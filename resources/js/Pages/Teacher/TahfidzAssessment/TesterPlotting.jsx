import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Trash2, UserPlus, Search, ShieldCheck, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';

export default function TesterPlotting({ subjects }) {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [teacherQuery, setTeacherQuery] = useState('');
    const [foundTeachers, setFoundTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    // Form for adding tester
    const { data, setData, post, processing, reset, errors } = useForm({
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

    const handleAdd = (e) => {
        e.preventDefault();
        post(route('settings.tahfidz.testers.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
                setTeacherQuery('');
                setSelectedTeacher(null);
                // No need to reload, Inertia handles it, but we need to re-select the subject to see updates?
                // Inertia reload preserves state? No. `subjects` prop will update.
                // We depend on `subjects` prop. If `selectedSubject` is just an ID or index, we can find it again.
                // But here I stored the whole object in state `selectedSubject`. It won't update automatically.
                // Better store ID and derive object.
            }
        });
    };

    // Derive selected subject from props to ensure reactivity
    const activeSubject = selectedSubject ? subjects.find(s => s.id === selectedSubject.id) : null;

    // Delete form
    const { delete: destroy } = useForm();
    const handleDelete = (id) => {
        if (confirm('Hapus penguji ini?')) {
            destroy(route('settings.tahfidz.testers.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Plotting Penguji Tahfidz" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Plotting Penguji Tahfidz</h1>
                    <p className="text-gray-600">Atur siapa saja yang berhak menguji Tahfidz untuk setiap kelas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* List of Classes */}
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Daftar Kelas</CardTitle>
                                <CardDescription>Pilih kelas untuk mengatur penguji</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                                {subjects.map(subject => (
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
                                ))}
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
                                                setData('active_subject_id', activeSubject.id);
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
                                            <form onSubmit={handleAdd} className="space-y-4 mt-4">
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
                                                                        setData('user_id', teacher.id);
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
                                                        value={data.type}
                                                        onValueChange={val => setData('type', val)}
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
                                                    <Button type="submit" disabled={!data.user_id || processing}>
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
                                                    onClick={() => handleDelete(tester.id)}
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
            </div>
        </MainLayout>
    );
}
