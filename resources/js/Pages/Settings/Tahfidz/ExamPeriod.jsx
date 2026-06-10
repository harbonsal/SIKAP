import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Calendar, Save, AlertCircle } from 'lucide-react';

export default function ExamPeriod({ startDate, endDate }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        start_date: startDate || '',
        end_date: endDate || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.tahfidz.exam-period.store'));
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Waktu Ujian Tahfidz" />

            <div className="py-6 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan Waktu Ujian Tahfidz</h1>
                    <p className="text-gray-500">Tentukan masa berlaku input nilai ujian. Diluar masa ini, input nilai akan terkunci bagi guru/penguji.</p>
                </div>

                <Card>
                    <form onSubmit={submit}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                                Masa Ujian
                            </CardTitle>
                            <CardDescription>
                                Set tanggal mulai dan selesai ujian. Kosongkan jika ingin membuka akses tanpa batas waktu (Not Recommended).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className={errors.start_date ? 'border-red-500' : ''}
                                    />
                                    {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className={errors.end_date ? 'border-red-500' : ''}
                                    />
                                    {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 text-amber-800 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <span className="font-semibold">Catatan:</span>
                                    <ul className="list-disc ml-4 mt-1 space-y-1">
                                        <li>Diluar tanggal diatas, Guru/Penguji tidak dapat mengubah nilai.</li>
                                        <li>Administrator dan Manager Tahfidz memiliki hak akses penuh (bypass) kapan saja.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-4">
                            <div className="text-sm text-gray-500">
                                {recentlySuccessful && <span className="text-green-600 font-medium">Pengaturan berhasil disimpan.</span>}
                            </div>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
