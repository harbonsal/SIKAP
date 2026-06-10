import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Save, CalendarDays, CheckSquare } from 'lucide-react';

const SEMESTER_1_MONTHS = [
    { id: 7, label: 'Juli' },
    { id: 8, label: 'Agustus' },
    { id: 9, label: 'September' },
    { id: 10, label: 'Oktober' },
    { id: 11, label: 'November' },
    { id: 12, label: 'Desember' },
];

const SEMESTER_2_MONTHS = [
    { id: 1, label: 'Januari' },
    { id: 2, label: 'Februari' },
    { id: 3, label: 'Maret' },
    { id: 4, label: 'April' },
    { id: 5, label: 'Mei' },
    { id: 6, label: 'Juni' },
];

export default function CharacterSettingsIndex({ activeMonths = [] }) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        months: activeMonths,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.master.character-settings.store'), { preserveScroll: true });
    };

    const handleCheckboxChange = (monthId, checked) => {
        if (checked) {
            setData('months', [...data.months, monthId]);
        } else {
            setData('months', data.months.filter(id => id !== monthId));
        }
    };

    const toggleGroup = (checked, groupMonths) => {
        const groupIds = groupMonths.map(m => m.id);
        if (checked) {
            const newMonths = [...new Set([...data.months, ...groupIds])];
            setData('months', newMonths);
        } else {
            setData('months', data.months.filter(id => !groupIds.includes(id)));
        }
    };

    const isGroupChecked = (groupMonths) => {
        return groupMonths.every(m => data.months.includes(m.id));
    };

    const renderMonthGroup = (title, months) => (
        <div className="mb-8 last:mb-0">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
                <span className="text-sm font-bold text-gray-800">{title}</span>
                <label className="inline-flex items-center cursor-pointer gap-2">
                    <span className="text-xs text-gray-500">Pilih Semua</span>
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        checked={isGroupChecked(months)}
                        onChange={(e) => toggleGroup(e.target.checked, months)}
                    />
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {months.map((month) => {
                    const isChecked = data.months.includes(month.id);
                    return (
                        <label 
                            key={month.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50 border-gray-200'}`}
                        >
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(month.id, e.target.checked)}
                            />
                            <span className={`text-sm font-medium ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>
                                {month.label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );

    return (
        <MainLayout>
            <Head title="Pengaturan Akhlak" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan Master Akhlak</h1>
                    <p className="text-gray-500">Kelola bulan-bulan aktif untuk ditampilkan dalam penilaian dan rekapan Akhlak.</p>
                </div>

                <div className="max-w-3xl">
                    <Card>
                        <form onSubmit={submit}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                                    Bulan Aktif Pantauan Akhlak
                                </CardTitle>
                                <CardDescription>
                                    Pilih bulan-bulan yang akan selalu ditampilkan pada aplikasi Santri/Ortu, meskipun nilainya masih kosong. 
                                    Bulan yang tidak dicentang akan disembunyikan dari rekapan bulanan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderMonthGroup("Semester Ganjil (Juli - Desember)", SEMESTER_1_MONTHS)}
                                {renderMonthGroup("Semester Genap (Januari - Juni)", SEMESTER_2_MONTHS)}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t px-6 py-4 bg-gray-50/50">
                                <div className="text-sm text-gray-500">
                                    {recentlySuccessful && <span className="text-green-600 font-medium flex items-center gap-1"><CheckSquare className="w-4 h-4" /> Berhasil disimpan.</span>}
                                </div>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
