import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Save } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CollectiveBiodata({ candidates }) {
    const initialBiodata = (candidates || []).reduce((acc, student) => {
        acc[student.id] = {
            nama_arab: student.nama_arab || '',
            birth_place_ar: student.birth_place_ar || '',
        };

        return acc;
    }, {});

    const { data, setData, post, processing } = useForm({
        biodata: initialBiodata,
    });

    const handleFieldChange = (studentId, field, value) => {
        setData('biodata', {
            ...data.biodata,
            [studentId]: {
                ...data.biodata[studentId],
                [field]: value,
            },
        });
    };

    const handlePaste = (e, startIndex, field) => {
        e.preventDefault();

        const rows = e.clipboardData
            .getData('text')
            .split(/\r?\n/)
            .filter((row) => row.trim() !== '');

        const nextBiodata = { ...data.biodata };

        rows.forEach((row, offset) => {
            const candidate = candidates[startIndex + offset];

            if (!candidate) {
                return;
            }

            nextBiodata[candidate.id] = {
                ...nextBiodata[candidate.id],
                [field]: row.trim(),
            };
        });

        setData('biodata', nextBiodata);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('settings.education.ijazah.collective-biodata.store'), {
            onSuccess: () => {
                Swal.fire('Berhasil', 'Biodata kolektif berhasil disimpan', 'success');
            },
        });
    };

    return (
        <MainLayout>
            <Head title="Edit Biodata Kolektif" />
            <div className="max-w-6xl mx-auto pb-20">
                <Card>
                    <CardHeader>
                        <div className="space-y-1">
                            <CardTitle>Edit Biodata Kolektif</CardTitle>
                            <p className="text-sm text-gray-500">
                                Ubah nama Arab dan tempat lahir Arab seluruh siswa sekaligus.
                                <br />Bisa Copy-Paste satu kolom dari Excel ke field yang sesuai.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="rounded-md border mb-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-3 text-left w-12">No</th>
                                            <th className="p-3 text-left">Nama Siswa</th>
                                            <th className="p-3 text-left">Kelas</th>
                                            <th className="p-3 text-center min-w-[220px]">Nama Arab</th>
                                            <th className="p-3 text-center min-w-[220px]">Tempat Lahir Arab</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {candidates.map((student, index) => (
                                            <tr key={student.id} className="border-t hover:bg-slate-50">
                                                <td className="p-3">{index + 1}</td>
                                                <td className="p-3">
                                                    <div className="font-semibold">{student.name}</div>
                                                    <div className="text-xs text-muted-foreground">{student.nomor_induk}</div>
                                                </td>
                                                <td className="p-3">{student.class_name}</td>
                                                <td className="p-3">
                                                    <Input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.biodata[student.id]?.nama_arab || ''}
                                                        onChange={(e) => handleFieldChange(student.id, 'nama_arab', e.target.value)}
                                                        onPaste={(e) => handlePaste(e, index, 'nama_arab')}
                                                        placeholder="Nama Arab"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.biodata[student.id]?.birth_place_ar || ''}
                                                        onChange={(e) => handleFieldChange(student.id, 'birth_place_ar', e.target.value)}
                                                        onPaste={(e) => handlePaste(e, index, 'birth_place_ar')}
                                                        placeholder="Tempat lahir Arab"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end sticky bottom-4 bg-white p-4 shadow-lg border rounded-lg">
                                <Button disabled={processing} className="gap-2 w-full md:w-auto">
                                    <Save className="h-4 w-4" /> Simpan Semua Biodata
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
