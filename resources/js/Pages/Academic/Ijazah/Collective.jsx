import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Save } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Collective({ subjects, candidates }) {

    const [selectedMapel, setSelectedMapel] = useState(subjects.length > 0 ? subjects[0].name : '');

    // Form state structure: { mapel_name: '...', grades: { student_id: score, ... } }
    const { data, setData, post, processing, reset } = useForm({
        mapel_name: '',
        grades: {}
    });

    // When Mapel changes, populate form data with existing grades matching that mapel
    useEffect(() => {
        if (selectedMapel) {
            const gradesMap = {};
            candidates.forEach(student => {
                // If student has a grade for this mapel, set it. Otherwise empty.
                const exGrade = student.grades[selectedMapel];
                gradesMap[student.id] = exGrade !== undefined ? exGrade : '';
            });

            setData({
                mapel_name: selectedMapel,
                grades: gradesMap
            });
        }
    }, [selectedMapel, candidates]);

    const handleScoreChange = (studentId, value) => {
        setData('grades', {
            ...data.grades,
            [studentId]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.education.ijazah.collective.store'), {
            onSuccess: () => {
                Swal.fire('Berhasil', 'Nilai kolektif berhasil disimpan', 'success');
            }
        });
    };

    const handlePaste = (e, startIndex) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');

        const newGrades = { ...data.grades };

        rows.forEach((row, i) => {
            const candidateIndex = startIndex + i;
            if (candidateIndex < candidates.length) {
                const studentId = candidates[candidateIndex].id;
                // Clean value: remove non-numeric except dots/commas if needed
                // For now, simple trim.
                const val = row.trim();
                newGrades[studentId] = val;
            }
        });

        setData('grades', newGrades);
    };

    return (
        <MainLayout>
            <Head title="Input Nilai Kolektif" />
            <div className="max-w-5xl mx-auto pb-20">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle>Input Nilai Kolektif</CardTitle>
                            <p className="text-sm text-gray-500">
                                Pilih mata pelajaran, lalu input nilai untuk seluruh siswa sekaligus.
                                <br />Bisa Copy-Paste dari Excel.
                            </p>
                        </div>
                        <div className="w-[300px]">
                            <Select value={selectedMapel} onValueChange={(val) => setSelectedMapel(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Mapel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subj, idx) => (
                                        <SelectItem key={idx} value={subj.name}>
                                            {subj.name} ({subj.name_ar})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedMapel ? (
                            <form onSubmit={handleSubmit}>
                                <div className="rounded-md border mb-4">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-3 text-left w-12">No</th>
                                                <th className="p-3 text-left">Nama Siswa</th>
                                                <th className="p-3 text-left">Kelas</th>
                                                <th className="p-3 text-center w-32">Nilai</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {candidates.map((student, i) => (
                                                <tr key={student.id} className="border-t hover:bg-slate-50">
                                                    <td className="p-3">{i + 1}</td>
                                                    <td className="p-3">
                                                        <div className="font-semibold">{student.name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.nomor_induk}</div>
                                                    </td>
                                                    <td className="p-3">{student.class_name}</td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="number"
                                                            className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            value={data.grades[student.id] || ''}
                                                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                            onPaste={(e) => handlePaste(e, i)}
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end sticky bottom-4 bg-white p-4 shadow-lg border rounded-lg">
                                    <Button disabled={processing} className="gap-2 w-full md:w-auto">
                                        <Save className="h-4 w-4" /> Simpan Semua Nilai ({selectedMapel})
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Silakan pilih mata pelajaran terlebih dahulu
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
