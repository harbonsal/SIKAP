import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Save } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ManualGrade({ student, subjects, existingGrades }) {

    // Map existing grades to form structure
    // We want to handle ALL subjects, allowing user to input manual grade for ANY subject.
    const initialGrades = subjects.map(subj => ({
        mapel_name: subj.name,
        score: existingGrades[subj.name] || ''
    }));

    const { data, setData, post, processing } = useForm({
        grades: initialGrades
    });

    const handleScoreChange = (index, value) => {
        const newGrades = [...data.grades];
        newGrades[index].score = value;
        setData('grades', newGrades);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.education.ijazah.manual-grades.store', student.id), {
            onSuccess: () => Swal.fire('Berhasil', 'Nilai manual disimpan', 'success')
        });
    };

    return (
        <MainLayout>
            <Head title={`Nilai Manual - ${student.user.name}`} />
            <div className="max-w-3xl mx-auto pb-20">
                <Card>
                    <CardHeader>
                        <CardTitle>Input Nilai Manual: {student.user.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                            Masukkan nilai hanya untuk mapel yang tidak tersedia di sistem (misal: pelajaran kelas sebelumnya).
                            Nilai yang diisi di sini akan MENGGANTIKAN nilai sistem (Rapor Semester 2) di cetakan Ijazah.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Mapel (Indo)</th>
                                        <th className="text-right p-2">Mapel (Arab)</th>
                                        <th className="text-center p-2 w-32">Nilai Manual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((subj, index) => {
                                        return (
                                            <tr key={index} className="border-b hover:bg-slate-50">
                                                <td className="p-2">{subj.name}</td>
                                                <td className="p-2 text-right font-bold font-arabic">{subj.name_ar}</td>
                                                <td className="p-2">
                                                    <Input
                                                        type="number"
                                                        className="text-center"
                                                        value={data.grades[index].score}
                                                        onChange={(e) => handleScoreChange(index, e.target.value)}
                                                        placeholder="Sistem"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            <div className="flex justify-end mt-6">
                                <Button disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" /> Simpan Nilai
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
