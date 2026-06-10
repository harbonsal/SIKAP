
import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react'; // Link added import to Show.jsx
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
// Keep Dialog but be careful. If it fails, we might need a custom modal.
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

export default function Show({ auth, student, juz_data }) {
    const [selectedJuz, setSelectedJuz] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data, setData, post, processing } = useForm({
        student_id: student.id,
        juz: '',
        completed_pages: [],
        mark_full_juz: false
    });

    const openJuzDetail = (juz) => {
        setSelectedJuz(juz);
        setData({
            student_id: student.id,
            juz: juz.juz,
            completed_pages: juz.completed_pages || [],
            mark_full_juz: juz.is_completed
        });
        setIsDialogOpen(true);
    };

    const handlePageToggle = (pageNumber) => {
        if (data.mark_full_juz) return;

        const currentPages = data.completed_pages;
        let newPages = [];
        if (currentPages.includes(pageNumber)) {
            newPages = currentPages.filter(p => p !== pageNumber);
        } else {
            newPages = [...currentPages, pageNumber];
        }
        setData('completed_pages', newPages);
    };

    const handleFullJuzToggle = (e) => {
        const checked = e.target.checked;
        setData('mark_full_juz', checked);
        if (checked && selectedJuz) {
            const allPages = [];
            for (let i = selectedJuz.start_page; i <= selectedJuz.end_page; i++) {
                allPages.push(i);
            }
            setData(d => ({ ...d, mark_full_juz: true, completed_pages: allPages }));
        } else if (!checked) {
            setData(d => ({ ...d, mark_full_juz: false }));
        }
    };

    const submitForm = () => {
        post(route('tahfidz.achievements.store'), {
            onSuccess: () => {
                setIsDialogOpen(false);
                // toast/alert replaced with simple alert if needed or relies on flash message
                // toast.success('Berhasil');
            },
        });
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail Hafalan: {student.name}</h2>
                    <Link
                        href={route('tahfidz.achievements.index')}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                    >
                        Kembali
                    </Link>
                </div>
            }
        >
            <Head title={`Hafalan ${student.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <Card className="bg-white border shadow-sm">
                        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                                <p className="text-gray-500">NIS: {student.nis} | {student.class_name} | {student.kamar_name}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Total Hafalan</div>
                                <div className="text-3xl font-bold text-green-600">
                                    {juz_data.filter(j => j.is_completed).length} <span className="text-base text-gray-400 font-normal">/ 30 Juz</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {juz_data.map((juz) => (
                            <div
                                key={juz.juz}
                                onClick={() => openJuzDetail(juz)}
                                className={`
                                    cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-105
                                    ${juz.is_completed && juz.is_validated
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : juz.is_completed
                                            ? 'bg-green-50 border-green-500 text-green-700'
                                            : juz.progress > 0
                                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-lg leading-none">Juz {juz.juz}</span>

                                        {/* Badge: Status Skrining */}
                                        {juz.is_screened ? (
                                            <span className="text-[10px] text-violet-700 font-bold border border-violet-200 bg-violet-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-max shadow-sm">
                                                <span className="text-xs leading-none">📝</span> Sudah Skrining
                                            </span>
                                        ) : juz.progress > 0 && !juz.is_completed ? (
                                            <span className="text-[10px] text-amber-700 font-bold border border-amber-200 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-max shadow-sm">
                                                <span className="text-xs leading-none">🔄</span> Proses Skrining
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-500 font-bold border border-gray-200 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-max shadow-sm">
                                                <span className="text-xs leading-none">○</span> Belum Skrining
                                            </span>
                                        )}

                                        {/* Badge Validasi: HANYA untuk juz yang masuk daftar validasi (is_validated=true) */}
                                        {juz.is_validated && (
                                            <span className="text-[10px] text-orange-700 font-bold border border-orange-200 bg-orange-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-max shadow-sm">
                                                <span className="text-xs leading-none">⚠️</span> Butuh Validasi
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {juz.is_completed && juz.is_validated && <span className="text-blue-600 font-bold text-xl leading-none">✔</span>}
                                        {juz.is_completed && !juz.is_validated && <span className="text-green-600 font-bold text-xl leading-none">✔</span>}
                                        {!juz.is_completed && juz.progress > 0 && <span className="text-amber-500 text-xs whitespace-nowrap">● {juz.progress} Hal</span>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Progress</span>
                                        <span>{juz.progress} / {juz.total_pages}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${juz.is_completed && juz.is_validated ? 'bg-blue-500' : juz.is_completed ? 'bg-green-500' : 'bg-amber-500'}`}
                                            style={{ width: `${(juz.progress / juz.total_pages) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                                checked={data.mark_full_juz}
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
                                        ${data.completed_pages.includes(pageNum) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        id={`page-${pageNum}`}
                                        checked={data.completed_pages.includes(pageNum)}
                                        onChange={() => handlePageToggle(pageNum)}
                                        disabled={data.mark_full_juz}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <label
                                        htmlFor={`page-${pageNum}`}
                                        className={`font-medium text-sm cursor-pointer ml-2 ${data.mark_full_juz ? 'opacity-50' : ''}`}
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
        </AuthenticatedLayout>
    );
}
