import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react'; // useForm for managing form state
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect } from 'react';

export default function Show({ activeClass, students, semester, academicYear }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        semester: semester,
        students: students.map(s => ({
            student_id: s.student_id,
            sakit: s.sakit,
            izin: s.izin,
            alpa: s.alpa,
        }))
    });

    const handleChange = (index, field, value) => {
        const newStudents = [...data.students];
        newStudents[index][field] = value;
        setData('students', newStudents);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('journals.manual.store', activeClass.id), {
            preserveScroll: true,
            onSuccess: () => {
                // Toast handled by flash message usually, but here we can add client toast
                console.log('Saved');
            }
        });
    };

    return (
        <MainLayout>
            <Head title={`Input Absensi - ${activeClass.kelas.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Link href={route('journals.manual.index')} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Input Absensi Manual</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Kelas: {activeClass.kelas.name} {activeClass.kelas_paralel?.name} | Semester: {semester} | TA: {academicYear.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px] text-center">No</TableHead>
                                        <TableHead className="w-[120px]">NIS</TableHead>
                                        <TableHead className="min-w-[200px]">Nama Santri</TableHead>
                                        <TableHead className="w-[100px] text-center">Sakit (Hari)</TableHead>
                                        <TableHead className="w-[100px] text-center">Izin (Hari)</TableHead>
                                        <TableHead className="w-[100px] text-center">Alpa (Hari)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, index) => (
                                        <TableRow key={student.student_id} className="hover:bg-muted/50">
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell className="font-mono">{student.nis}</TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className={`w-20 text-center mx-auto ${errors[`students.${index}.sakit`] ? 'border-red-500' : ''}`}
                                                    value={data.students[index].sakit}
                                                    onChange={(e) => handleChange(index, 'sakit', e.target.value)}
                                                />
                                                {errors[`students.${index}.sakit`] && (
                                                    <div className="text-[10px] text-red-500 mt-1">{errors[`students.${index}.sakit`]}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className={`w-20 text-center mx-auto ${errors[`students.${index}.izin`] ? 'border-red-500' : ''}`}
                                                    value={data.students[index].izin}
                                                    onChange={(e) => handleChange(index, 'izin', e.target.value)}
                                                />
                                                {errors[`students.${index}.izin`] && (
                                                    <div className="text-[10px] text-red-500 mt-1">{errors[`students.${index}.izin`]}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className={`w-20 text-center mx-auto ${errors[`students.${index}.alpa`] ? 'border-red-500' : ''}`}
                                                    value={data.students[index].alpa}
                                                    onChange={(e) => handleChange(index, 'alpa', e.target.value)}
                                                />
                                                {errors[`students.${index}.alpa`] && (
                                                    <div className="text-[10px] text-red-500 mt-1">{errors[`students.${index}.alpa`]}</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {students.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Tidak ada santri di kelas ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={processing || students.length === 0} size="lg">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
