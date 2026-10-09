import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/Components/ui/dialog';
import { Target, Plus, Trash2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

export default function StandardTargetsTab({ standardTargets = [], jenjangs = [] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        jenjang_id: '',
        semester_number: '',
        target_juz_count: '',
        juz_details: '',
    });

    const handleAdd = (e) => {
        e.preventDefault();
        post(route('settings.tahfidz.standard-targets.store'), {
            onSuccess: () => {
                setIsAddOpen(false);
                reset();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Hapus standar target ini?')) {
            router.delete(route('settings.tahfidz.standard-targets.destroy', id));
        }
    };

    // Group targets by Jenjang
    const groupedTargets = standardTargets.reduce((acc, target) => {
        const jenjangName = target.jenjang?.name || 'Unknown';
        if (!acc[jenjangName]) acc[jenjangName] = [];
        acc[jenjangName].push(target);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-200">
                <Info className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-800">Informasi Target Hafalan</AlertTitle>
                <AlertDescription className="text-indigo-700">
                    <ul className="list-disc ml-4 space-y-1 mt-1 text-sm">
                        <li>Semester yang dimasukkan adalah <strong>Semester Bersambung</strong> (akumulatif dari santri masuk, misal 1 s/d 12).</li>
                        <li>Sistem otomatis menghitung <strong>1 Juz = 20 Halaman</strong>. Contoh: Target 2 Juz = Target 40 Halaman Ziyadah.</li>
                        <li>Keterangan detail juz hanya sebagai informasi untuk Musrif.</li>
                    </ul>
                </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Daftar Standar Target</h3>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Target
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAdd}>
                            <DialogHeader>
                                <DialogTitle>Tambah Standar Target</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Jenjang Masuk (Track)</Label>
                                    <Select value={data.jenjang_id?.toString()} onValueChange={v => setData('jenjang_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Jenjang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jenjangs.map(j => (
                                                <SelectItem key={j.id} value={j.id.toString()}>{j.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.jenjang_id && <p className="text-sm text-red-500">{errors.jenjang_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Semester Ke- (Bersambung)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="20"
                                        placeholder="Contoh: 1, 2, 3..."
                                        value={data.semester_number}
                                        onChange={e => setData('semester_number', e.target.value)}
                                    />
                                    {errors.semester_number && <p className="text-sm text-red-500">{errors.semester_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Jumlah Juz</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        placeholder="Contoh: 2"
                                        value={data.target_juz_count}
                                        onChange={e => setData('target_juz_count', e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">{(data.target_juz_count || 0) * 20} Halaman Ziyadah</p>
                                    {errors.target_juz_count && <p className="text-sm text-red-500">{errors.target_juz_count}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Keterangan Detail Juz (Opsional)</Label>
                                    <Input
                                        placeholder="Contoh: Juz 30 dan 29"
                                        value={data.juz_details}
                                        onChange={e => setData('juz_details', e.target.value)}
                                    />
                                    {errors.juz_details && <p className="text-sm text-red-500">{errors.juz_details}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {Object.keys(groupedTargets).length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <Target className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">Belum ada standar target</p>
                        <p className="text-sm mt-1">Silakan tambahkan standar target hafalan untuk mengevaluasi capaian santri.</p>
                    </CardContent>
                </Card>
            ) : (
                Object.entries(groupedTargets).map(([jenjangName, targets]) => (
                    <Card key={jenjangName} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4 text-indigo-600" />
                                Track Masuk: {jenjangName}
                            </CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Semester Ke-</th>
                                        <th className="px-6 py-3 font-medium">Target Capaian</th>
                                        <th className="px-6 py-3 font-medium">Keterangan Juz</th>
                                        <th className="px-6 py-3 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {targets.map(target => (
                                        <tr key={target.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                Semester {target.semester_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-indigo-600">{target.target_juz_count} Juz</div>
                                                <div className="text-xs text-gray-500">({target.target_juz_count * 20} Halaman)</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {target.juz_details || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDelete(target.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}
