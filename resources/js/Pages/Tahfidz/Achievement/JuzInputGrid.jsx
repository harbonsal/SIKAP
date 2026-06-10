
import React, { useState } from 'react';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import axios from 'axios';

export default function JuzInputGrid({ student, juzData, onUpdate }) {
    const [selectedJuz, setSelectedJuz] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Local form state
    const [formData, setFormData] = useState({
        student_id: student.id,
        juz: '',
        completed_pages: [],
        mark_full_juz: false
    });

    const openJuzDetail = (juz) => {
        setSelectedJuz(juz);
        setFormData({
            student_id: student.id,
            juz: juz.juz,
            completed_pages: juz.completed_pages || [],
            mark_full_juz: juz.is_completed
        });
        setIsDialogOpen(true);
    };

    const handlePageToggle = (pageNumber) => {
        if (formData.mark_full_juz) return;

        const currentPages = formData.completed_pages;
        let newPages = [];
        if (currentPages.includes(pageNumber)) {
            newPages = currentPages.filter(p => p !== pageNumber);
        } else {
            newPages = [...currentPages, pageNumber];
        }
        setFormData({ ...formData, completed_pages: newPages });
    };

    const handleFullJuzToggle = (e) => {
        const checked = e.target.checked;
        if (checked && selectedJuz) {
            const allPages = [];
            for (let i = selectedJuz.start_page; i <= selectedJuz.end_page; i++) {
                allPages.push(i);
            }
            setFormData({ ...formData, mark_full_juz: true, completed_pages: allPages });
        } else {
            setFormData({ ...formData, mark_full_juz: false });
        }
    };

    const submitForm = async () => {
        setProcessing(true);
        try {
            await axios.post(route('tahfidz.achievements.store'), formData);
            setIsDialogOpen(false);
            if (onUpdate) onUpdate(); // Refresh parent data
        } catch (error) {
            console.error('Failed to save', error);
            alert('Gagal menyimpan data.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white border shadow-sm">
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                        <p className="text-gray-500">NIS: {student.nis}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Total Hafalan</div>
                        <div className="text-3xl font-bold text-green-600">
                            {juzData.filter(j => j.is_completed).length} <span className="text-base text-gray-400 font-normal">/ 30 Juz</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {juzData.map((juz) => (
                    <div
                        key={juz.juz}
                        onClick={() => openJuzDetail(juz)}
                        className={`
                            cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-105
                            ${juz.is_completed
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : juz.progress > 0
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-lg">Juz {juz.juz}</span>
                            {juz.is_completed && <span className="text-green-600 font-bold">✔</span>}
                            {!juz.is_completed && juz.progress > 0 && <span className="text-blue-500 text-xs">● {juz.progress} Hal</span>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{juz.progress} / {juz.total_pages}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${juz.is_completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${(juz.progress / juz.total_pages) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Hafalan Juz {selectedJuz?.juz}</DialogTitle>
                        <DialogDescription>
                            Silahkan ceklis halaman yang sudah disetorkan. <br />
                            Halaman {selectedJuz?.start_page} s.d {selectedJuz?.end_page} (Total {selectedJuz?.total_pages} Halaman)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex items-center space-x-2 p-4 bg-slate-100 rounded-lg border border-slate-200">
                            <input
                                type="checkbox"
                                id="mark_full"
                                checked={formData.mark_full_juz}
                                onChange={handleFullJuzToggle}
                                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <label htmlFor="mark_full" className="font-medium cursor-pointer ml-2">
                                Tandai Selesai 1 Juz Penuh (Semua halaman otomatis tercentang)
                            </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {selectedJuz && Array.from({ length: selectedJuz.end_page - selectedJuz.start_page + 1 }, (_, i) => selectedJuz.start_page + i).map((pageNum) => (
                                <div
                                    key={pageNum}
                                    className={`
                                        flex items-center space-x-3 p-3 rounded-lg border transition-colors
                                        ${formData.completed_pages.includes(pageNum) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        id={`page-${pageNum}`}
                                        checked={formData.completed_pages.includes(pageNum)}
                                        onChange={() => handlePageToggle(pageNum)}
                                        disabled={formData.mark_full_juz}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <label
                                        htmlFor={`page-${pageNum}`}
                                        className={`font-medium text-sm cursor-pointer ml-2 ${formData.mark_full_juz ? 'opacity-50' : ''}`}
                                    >
                                        Halaman {pageNum}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                        <Button onClick={submitForm} disabled={processing}>Simpan Perubahan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
