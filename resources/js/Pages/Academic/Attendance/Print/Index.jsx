import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm } from '@inertiajs/react'; // Correct import for useForm
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import Checkbox from '@/Components/Checkbox'; // Assuming standard checkbox

export default function Index({ title, activeClasses = [], academicYear }) {
    const [activeTab, setActiveTab] = useState('kelas');
    const { data, setData, post, processing, errors } = useForm({
        active_class_id: '',
        months: [],
        type: 'kelas', // Default
    });

    // Default months mapping
    const allMonths = [
        { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
        { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
        { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    ];

    const handleMonthChange = (monthValue, isChecked) => {
        let newMonths = [...data.months];
        if (isChecked) {
            if (newMonths.length >= 3) return; // Max 3
            newMonths.push(monthValue);
        } else {
            newMonths = newMonths.filter(m => m !== monthValue);
        }
        // Sort by logical order (semester based or just number) - User wants flexible selection
        // Let's just keep them in order of selection or sort numerically? 
        // Better sort numerically to have J-F-M not M-F-J
        // BUT academic year order is better (Jul -> Jun)?
        // For simplicity let's sort by input value index in `allMonths` to keep Jun after Jul etc if mixing semesters? 
        // No, user usually selects Jan-Feb-Mar.

        setData('months', newMonths);
    };

    const handlePrint = (type) => {
        if (!data.active_class_id) {
            alert('Harap pilih Kelas terlebih dahulu.');
            return;
        }

        if (type !== 'kelas' && type !== 'jurnal' && type !== 'sampul' && data.months.length === 0) {
            alert('Pilih minimal 1 bulan.');
            return;
        }

        // Build Query String for GET request
        // Laravel expects array syntax: months[]=1&months[]=2
        let queryString = `type=${type}&active_class_id=${data.active_class_id}`;
        data.months.forEach(m => {
            queryString += `&months[]=${m}`;
        });

        const url = route('attendance.print.generate') + '?' + queryString;
        window.open(url, '_blank');
    };

    return (
        <MainLayout>
            <Head title={title} />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">Cetak form absensi manual untuk keperluan operasional.</p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b overflow-x-auto">
                    {[
                        { id: 'kelas', label: 'Kelas' },
                        { id: 'jurnal', label: 'Jurnal' },
                        { id: 'sampul', label: 'Cetak Sampul' },
                        { id: 'beladiri', label: 'Beladiri' },
                        { id: 'pkbm', label: 'PKBM' },
                        { id: 'tahfidz', label: 'Halaqoh Tahfidz' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cetak Absensi {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
                        <CardDescription>
                            Silahkan atur filter di bawah ini sebelum mencetak form absensi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Placeholder Content for Each Tab */}
                        <div className="space-y-6">
                            <div className={`p-4 rounded-md border ${activeTab === 'kelas' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                                    activeTab === 'jurnal' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                    activeTab === 'sampul' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                                    activeTab === 'beladiri' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                        activeTab === 'pkbm' ? 'bg-green-50 text-green-800 border-green-200' :
                                            'bg-purple-50 text-purple-800 border-purple-200'
                                }`}>
                                {activeTab === 'kelas' || activeTab === 'jurnal' || activeTab === 'sampul' ? (
                                    <p>Mencetak form absensi <strong>{activeTab.toUpperCase()}</strong> (Format Arab / RTL).</p>
                                ) : (
                                    <p>Mencetak form absensi <strong>{activeTab.toUpperCase()}</strong>. Pilih Kelas dan Bulan (Maksimal 3 Bulan per halaman).</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Pilih Kelas</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.active_class_id}
                                        onChange={e => setData('active_class_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih Kelas --</option>
                                        {activeClasses.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {activeTab !== 'kelas' && activeTab !== 'jurnal' && activeTab !== 'sampul' && (
                                    <div className="space-y-2">
                                        <Label>Pilih Bulan (Max 3)</Label>
                                        <div className="grid grid-cols-3 gap-2 border p-3 rounded-md bg-white">
                                            {allMonths.map(m => {
                                                const isChecked = data.months.includes(m.value);
                                                const isDisabled = !isChecked && data.months.length >= 3;
                                                return (
                                                    <div key={m.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`m-${m.value}`}
                                                            checked={isChecked}
                                                            onChange={(e) => handleMonthChange(m.value, e.target.checked)}
                                                            disabled={isDisabled}
                                                        />
                                                        <label
                                                            htmlFor={`m-${m.value}`}
                                                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDisabled ? 'text-gray-400' : ''}`}
                                                        >
                                                            {m.label}
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Dipilih: {data.months.length} / 3 Bulan</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => handlePrint(activeTab)}
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Cetak Form Absensi'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
