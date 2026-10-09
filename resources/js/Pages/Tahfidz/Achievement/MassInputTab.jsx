import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import Select from 'react-select';
import { Button } from '@/Components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function MassInputTab({ musyrifs }) {
    const [selectedMusyrif, setSelectedMusyrif] = useState('');
    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [maxPages, setMaxPages] = useState(20);

    // Fetch data when musyrif changes
    useEffect(() => {
        if (!selectedMusyrif || selectedMusyrif === 'all') {
            setStudentsData([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(route('tahfidz.achievements.mass-input.data'), {
                    params: { musyrif_id: selectedMusyrif }
                });
                
                const data = response.data;
                setStudentsData(data);
                
                // Determine max pages to show columns up to that number (max 23)
                let maxP = 20;
                data.forEach(s => {
                    if (s.total_pages > maxP) {
                        maxP = s.total_pages;
                    }
                });
                setMaxPages(maxP);
                
            } catch (error) {
                console.error("Failed to load mass input data", error);
                alert("Gagal memuat data santri");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedMusyrif]);

    const handleCheckboxChange = (studentId, pageNumber) => {
        setStudentsData(prev => prev.map(student => {
            if (student.id === studentId) {
                const newCompleted = [...student.completed_pages];
                if (newCompleted.includes(pageNumber)) {
                    // Remove
                    return { ...student, completed_pages: newCompleted.filter(p => p !== pageNumber) };
                } else {
                    // Add
                    return { ...student, completed_pages: [...newCompleted, pageNumber] };
                }
            }
            return student;
        }));
    };

    const handleSave = async () => {
        if (studentsData.length === 0) return;
        
        setSaving(true);
        
        // Prepare payload
        const payload = studentsData.filter(s => s.current_juz !== null).map(s => ({
            student_id: s.id,
            juz: s.current_juz,
            completed_pages: s.completed_pages
        }));

        try {
            router.post(route('tahfidz.achievements.mass-input.store'), { inputs: payload }, {
                preserveScroll: true,
                onSuccess: () => {
                    alert("Data hafalan massal berhasil disimpan");
                    setSaving(false);
                },
                onError: (err) => {
                    console.error("Save error", err);
                    alert("Gagal menyimpan data hafalan");
                    setSaving(false);
                }
            });
        } catch (error) {
            setSaving(false);
        }
    };

    return (
        <Card className="bg-white border shadow-sm">
            <CardHeader>
                <CardTitle>Input Hafalan Manual / Massal</CardTitle>
                <CardDescription>Pilih Halaqoh untuk menampilkan anggota dan melakukan ceklist halaman secara massal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="w-full max-w-xl">
                    <div className="mb-2 text-sm font-medium text-gray-700">Nama Musyrif</div>
                    <Select 
                        options={musyrifs.map(m => ({ value: m.id.toString(), label: m.name }))}
                        value={selectedMusyrif ? { value: selectedMusyrif, label: musyrifs.find(m => m.id.toString() === selectedMusyrif)?.name } : null}
                        onChange={(selectedOption) => setSelectedMusyrif(selectedOption ? selectedOption.value : '')}
                        placeholder="Pilih Musyrif"
                        isClearable
                        isSearchable
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                    </div>
                ) : (
                    studentsData.length > 0 && (
                        <div className="mt-6 border rounded-md overflow-x-auto relative">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-700 font-medium">
                                        <th className="px-3 py-3 border-b border-r text-center w-12 bg-slate-50 sticky left-0 z-20">No.</th>
                                        <th className="px-4 py-3 border-b border-r min-w-[200px] sticky left-12 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">Nama Santri</th>
                                        <th className="px-3 py-3 border-b border-r text-center bg-slate-50">Juz</th>
                                        {Array.from({ length: maxPages }).map((_, i) => (
                                            <th key={i} className="px-2 py-3 border-b text-center min-w-[40px] bg-slate-50">{i + 1}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsData.map((student, index) => (
                                        <tr key={student.id} className="border-b hover:bg-slate-50 group">
                                            <td className="px-3 py-2 border-r text-center text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2 border-r font-medium text-slate-900 sticky left-12 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0]">
                                                {student.name} <span className="text-slate-500 font-normal">({student.class_name})</span>
                                            </td>
                                            <td className="px-3 py-2 border-r text-center font-semibold text-indigo-600">
                                                {student.current_juz || '-'}
                                            </td>
                                            {Array.from({ length: maxPages }).map((_, i) => {
                                                const relativePage = i + 1;
                                                const isApplicable = student.current_juz && relativePage <= student.total_pages;
                                                const absolutePage = student.start_page + i;
                                                
                                                return (
                                                    <td key={i} className="px-2 py-2 text-center border-l border-slate-100">
                                                        {isApplicable ? (
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                                checked={student.completed_pages.includes(absolutePage)}
                                                                onChange={() => handleCheckboxChange(student.id, absolutePage)}
                                                            />
                                                        ) : (
                                                            <div className="w-4 h-4 mx-auto bg-slate-100 rounded-sm"></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {studentsData.length > 0 && !loading && (
                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Simpan Capaian
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
