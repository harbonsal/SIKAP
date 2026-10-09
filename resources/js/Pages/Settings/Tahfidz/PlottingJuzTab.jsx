import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Checkbox } from '@/Components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Target, Users, BookOpen, CheckCircle, Save, Edit3, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Info } from 'lucide-react';

// MultiSelect component specifically for Juz
const JuzMultiSelect = ({ selected, onChange }) => {
    const allJuz = Array.from({ length: 30 }, (_, i) => i + 1);
    
    const toggleJuz = (juz) => {
        if (selected.includes(juz)) {
            onChange(selected.filter(j => j !== juz));
        } else {
            onChange([...selected, juz].sort((a, b) => a - b));
        }
    };

    return (
        <div className="grid grid-cols-10 gap-2 mt-2">
            {allJuz.map(juz => (
                <button
                    key={juz}
                    type="button"
                    onClick={() => toggleJuz(juz)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selected.includes(juz) 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {juz}
                </button>
            ))}
        </div>
    );
};

export default function PlottingJuzTab({ subjects = [] }) {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('1');
    
    const [classTarget, setClassTarget] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [saveClassProcessing, setSaveClassProcessing] = useState(false);
    
    // Bulk Selection
    const [selectedStudents, setSelectedStudents] = useState([]);
    
    // Modal Edit Target
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editMode, setEditMode] = useState('personal'); // 'personal' or 'bulk'
    const [editingStudent, setEditingStudent] = useState(null);
    const [editJuzTargets, setEditJuzTargets] = useState([]);
    const [editIsCustom, setEditIsCustom] = useState(true);
    const [saveStudentProcessing, setSaveStudentProcessing] = useState(false);

    // Fetch data when Class or Semester changes
    useEffect(() => {
        if (selectedClassId && selectedSemester) {
            fetchData();
        } else {
            setStudents([]);
            setClassTarget([]);
        }
    }, [selectedClassId, selectedSemester]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/settings/tahfidz/plotting-juz?active_class_id=${selectedClassId}&semester=${selectedSemester}`);
            const data = response.data;
            setClassTarget(data.class_target || []);
            setStudents(data.students || []);
            setSelectedStudents([]); // Reset selection
        } catch (error) {
            console.error("Failed to fetch plotting data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveClassTarget = async () => {
        setSaveClassProcessing(true);
        try {
            const res = await axios.post('/settings/tahfidz/plotting-juz/class', {
                active_class_id: selectedClassId,
                semester: selectedSemester,
                juz_targets: classTarget
            });
            if (res.status === 200 || res.status === 201) {
                // Refresh data to recompute student targets
                fetchData();
            }
        } catch (error) {
            console.error("Failed to save class target:", error);
        } finally {
            setSaveClassProcessing(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const toggleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sid => sid !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const openPersonalEdit = (student) => {
        setEditMode('personal');
        setEditingStudent(student);
        setEditJuzTargets(student.is_custom ? student.raw_target : classTarget);
        setEditIsCustom(student.is_custom);
        setIsEditModalOpen(true);
    };

    const openBulkEdit = () => {
        setEditMode('bulk');
        setEditJuzTargets(classTarget); // Default to class target
        setEditIsCustom(true);
        setIsEditModalOpen(true);
    };

    const handleSaveStudentTarget = async () => {
        setSaveStudentProcessing(true);
        try {
            let studentIdsToSave = [];
            if (editMode === 'personal' && editingStudent) {
                studentIdsToSave = [editingStudent.id];
            } else if (editMode === 'bulk') {
                studentIdsToSave = selectedStudents;
            }

            const res = await axios.post('/settings/tahfidz/plotting-juz/student', {
                active_class_id: selectedClassId,
                semester: selectedSemester,
                student_ids: studentIdsToSave,
                juz_targets: editJuzTargets,
                is_custom: editIsCustom
            });

            if (res.status === 200 || res.status === 201) {
                setIsEditModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error("Failed to save student targets:", error);
        } finally {
            setSaveStudentProcessing(false);
        }
    };

    // Filter subjects to unique active classes
    const uniqueClasses = subjects.reduce((acc, current) => {
        if (current.active_class_id && !acc.find(item => item.active_class_id === current.active_class_id)) {
            acc.push(current);
        }
        return acc;
    }, []);

    return (
        <div className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200">
                <Info className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-800">Panduan Plotting Juz</AlertTitle>
                <AlertDescription className="text-indigo-700">
                    Pilih kelas dan semester, lalu tentukan Juz apa saja yang menjadi target umum kelas tersebut. Juz yang sudah diselesaikan (Capaian) oleh santri <b>tidak akan muncul</b> di daftar target individu santri tersebut. Anda bisa mengatur pengecualian target per santri jika diperlukan.
                </AlertDescription>
            </Alert>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2 space-y-2">
                    <Label>Pilih Kelas</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger>
                            <SelectValue placeholder="-- Pilih Kelas --" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueClasses.map(cls => (
                                <SelectItem key={cls.id} value={cls.active_class_id.toString()}>
                                    {cls.class_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-1/2 space-y-2">
                    <Label>Pilih Semester</Label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                            <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedClassId && selectedSemester && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Panel Kiri: Target Umum Kelas */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-md flex items-center">
                                    <Target className="h-5 w-5 mr-2 text-indigo-600" />
                                    Target Umum Kelas
                                </CardTitle>
                                <CardDescription>Pilih juz untuk target kelas ini.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <JuzMultiSelect selected={classTarget} onChange={setClassTarget} />
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    onClick={handleSaveClassTarget} 
                                    disabled={saveClassProcessing || isLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {saveClassProcessing ? 'Menyimpan...' : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Simpan Target Kelas
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Panel Kanan: Daftar Santri & Pengecualian */}
                    <div className="md:col-span-3">
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-md flex items-center">
                                        <Users className="h-5 w-5 mr-2 text-indigo-600" />
                                        Target Personal Santri
                                    </CardTitle>
                                    <CardDescription>Juz yang sudah dihafal otomatis disembunyikan dari target aktual.</CardDescription>
                                </div>
                                {selectedStudents.length > 0 && (
                                    <Button onClick={openBulkEdit} variant="outline" size="sm" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit {selectedStudents.length} Santri
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-8 text-gray-500">Memuat data...</div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Tidak ada santri di kelas ini.</div>
                                ) : (
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="w-[50px] text-center">
                                                        <Checkbox 
                                                            checked={selectedStudents.length === students.length && students.length > 0}
                                                            onCheckedChange={toggleSelectAll}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Nama Santri</TableHead>
                                                    <TableHead>Status Target</TableHead>
                                                    <TableHead>Selesai Dihafal</TableHead>
                                                    <TableHead>Target Aktual</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map((student) => (
                                                    <TableRow key={student.id}>
                                                        <TableCell className="text-center">
                                                            <Checkbox 
                                                                checked={selectedStudents.includes(student.id)}
                                                                onCheckedChange={() => toggleSelectStudent(student.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium text-xs">
                                                            {student.name}
                                                            <div className="text-gray-400 font-normal">{student.nis}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {student.is_custom ? (
                                                                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                                                    Kustom
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                                    Sesuai Kelas
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {student.completed_juzs.length > 0 ? student.completed_juzs.sort((a,b)=>a-b).map(juz => (
                                                                    <span key={juz} className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                                                        Juz {juz}
                                                                    </span>
                                                                )) : <span className="text-xs text-gray-400">-</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {student.computed_target.length > 0 ? student.computed_target.map(juz => (
                                                                    <span key={juz} className="inline-flex items-center rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                                                        Juz {juz}
                                                                    </span>
                                                                )) : <span className="text-xs text-green-600 font-medium italic">Selesai/Kosong</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => openPersonalEdit(student)}>
                                                                <Edit3 className="h-4 w-4 text-gray-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editMode === 'bulk' 
                                ? `Edit Target ${selectedStudents.length} Santri` 
                                : `Edit Target Personal - ${editingStudent?.name}`}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="is_custom" 
                                checked={editIsCustom}
                                onCheckedChange={setEditIsCustom}
                            />
                            <Label htmlFor="is_custom" className="font-medium">
                                Target Kustom (Pengecualian)
                            </Label>
                        </div>
                        <p className="text-xs text-gray-500 pl-6">
                            Jika dicentang, santri akan mengikuti target di bawah ini, mengabaikan target umum kelas. Jika tidak dicentang, santri akan kembali mengikuti target umum kelas.
                        </p>

                        {editIsCustom && (
                            <div className="pt-2 pl-6">
                                <Label>Pilih Juz Target</Label>
                                <JuzMultiSelect selected={editJuzTargets} onChange={setEditJuzTargets} />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveStudentTarget} disabled={saveStudentProcessing} className="bg-indigo-600 hover:bg-indigo-700">
                            {saveStudentProcessing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
