import React from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Save, Search, Sparkles, Calendar, ChevronLeft, Check, ChevronsUpDown, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import Swal from 'sweetalert2';

export default function Index({ kamars, categories, rubrics, students, existingAssessments, existingReports, filters }) {
    const [selectedKamarId, setSelectedKamarId] = useState(filters.active_kamar_id || '');
    const [selectedMonth, setSelectedMonth] = useState(filters.month || '');
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());

    const { data, setData, post, processing, errors, reset } = useForm({
        active_kamar_id: selectedKamarId,
        month: selectedMonth,
        year: selectedYear,
        assessments: {}, // { student_id: { category: score } }
        comments: {}, // { student_id: comment_string }
    });

    const normalizeScore = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const num = Number(value);
        if (!Number.isFinite(num) || num === 0) return '';
        return String(Math.round(num));
    };

    // Initialize data from existing assessments when students load
    useEffect(() => {
        if (students.length > 0) {
            const initialAssessments = {};
            const initialComments = {};

            students.forEach(student => {
                initialAssessments[student.id] = {};
                categories.forEach(category => {
                    const existingScore = existingAssessments[student.id]?.[category] ?? '';
                    initialAssessments[student.id][category] = normalizeScore(existingScore);
                });
                initialComments[student.id] = existingReports[student.id] || '';
            });
            setData(prev => ({
                ...prev,
                assessments: initialAssessments,
                comments: initialComments
            }));
        }
    }, [students, existingAssessments, existingReports]);

    // Update form's state when selection changes
    useEffect(() => {
        setData(prev => ({
            ...prev,
            active_kamar_id: selectedKamarId,
            month: selectedMonth,
            year: selectedYear
        }));
    }, [selectedKamarId, selectedMonth, selectedYear]);

    const handleKamarChange = (e) => {
        const kamarId = e.target.value;
        setSelectedKamarId(kamarId);
        setSelectedMonth('');
    };

    const handleMonthSelect = (month) => {
        setSelectedMonth(month);
        router.get(route('assessments.character.index'), {
            active_kamar_id: selectedKamarId,
            month: month,
            year: selectedYear
        }, { preserveState: true });
    };

    const handleBackToMonths = () => {
        setSelectedMonth('');
        router.get(route('assessments.character.index'), { active_kamar_id: selectedKamarId }, { preserveState: true });
    };

    const months = [
        { id: 1, name: 'Januari' }, { id: 2, name: 'Februari' }, { id: 3, name: 'Maret' },
        { id: 4, name: 'April' }, { id: 5, name: 'Mei' }, { id: 6, name: 'Juni' },
        { id: 7, name: 'Juli' }, { id: 8, name: 'Agustus' }, { id: 9, name: 'September' },
        { id: 10, name: 'Oktober' }, { id: 11, name: 'November' }, { id: 12, name: 'Desember' }
    ];

    const selectedMonthNumber = Number(selectedMonth);
    const selectedMonthName = months.find((m) => m.id === selectedMonthNumber)?.name || '-';
    const selectedSemester = selectedMonthNumber >= 1 && selectedMonthNumber <= 6
        ? 'Genap'
        : selectedMonthNumber >= 7 && selectedMonthNumber <= 12
            ? 'Ganjil'
            : '-';
    const semesterBadgeClass = selectedSemester === 'Genap'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : selectedSemester === 'Ganjil'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-border bg-muted/40 text-muted-foreground';

    const handleScoreChange = (studentId, category, value) => {
        const digitsOnly = String(value).replace(/[^\d]/g, '');
        const normalizedScore = digitsOnly === '' ? '' : digitsOnly;

        setData(prevData => ({
            ...prevData,
            assessments: {
                ...prevData.assessments,
                [studentId]: {
                    ...prevData.assessments[studentId],
                    [category]: normalizedScore
                }
            }
        }));
    };

    const parsePastedScore = (rawValue) => {
        const text = String(rawValue ?? '').trim();
        if (text === '') return '';

        const normalizedDecimal = text.replace(/\s/g, '').replace(',', '.');
        const numericValue = Number(normalizedDecimal);
        if (Number.isFinite(numericValue)) {
            return normalizeScore(numericValue);
        }

        const digitsOnly = text.replace(/[^\d]/g, '');
        if (digitsOnly === '') return '';

        return normalizeScore(digitsOnly);
    };

    const handleScorePaste = (e, startStudentIndex, startCategoryIndex) => {
        const pastedText = e.clipboardData?.getData('text');
        if (!pastedText) return;

        e.preventDefault();

        const rows = pastedText
            .replace(/\r/g, '')
            .split('\n')
            .filter((row, index, allRows) => !(index === allRows.length - 1 && row === ''));

        setData(prevData => {
            const nextAssessments = { ...prevData.assessments };

            rows.forEach((rowText, rowOffset) => {
                const studentIndex = startStudentIndex + rowOffset;
                if (studentIndex >= students.length) return;

                const student = students[studentIndex];
                if (!student?.active_class_id) return;

                const cells = rowText.split('\t');
                const studentScores = { ...(nextAssessments[student.id] || {}) };

                cells.forEach((cellValue, colOffset) => {
                    const categoryIndex = startCategoryIndex + colOffset;
                    if (categoryIndex >= categories.length) return;

                    const category = categories[categoryIndex];
                    studentScores[category] = parsePastedScore(cellValue);
                });

                nextAssessments[student.id] = studentScores;
            });

            return {
                ...prevData,
                assessments: nextAssessments
            };
        });
    };

    const handleCommentChange = (studentId, value) => {
        setData(prevData => ({
            ...prevData,
            comments: {
                ...prevData.comments,
                [studentId]: value
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation for values < 10 or > 100
        let hasInvalidScore = false;
        for (const studentId in data.assessments) {
            for (const cat in data.assessments[studentId]) {
                const val = data.assessments[studentId][cat];
                if (val !== '') {
                    const score = Number(val);
                    if (score < 10 || score > 100) {
                        hasInvalidScore = true;
                        break;
                    }
                }
            }
            if (hasInvalidScore) break;
        }

        if (hasInvalidScore) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Valid',
                text: 'Harap periksa kembali. Skala input nilai akhlak harus berada di antara 10 hingga 100.',
            });
            return;
        }

        post(route('assessments.character.store'), {
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Penilaian akhlak berhasil disimpan.',
                    timer: 1600,
                    showConfirmButton: false,
                });
            },
            onError: (formErrors) => {
                const firstError = formErrors?.error || Object.values(formErrors || {})[0] || 'Gagal menyimpan data.';
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal menyimpan',
                    text: String(firstError),
                });
            }
        });
    };

    // Helper for MultiSelect
    const toggleComment = (studentId, description) => {
        let currentComments = data.comments[studentId] || '';
        let commentList = currentComments ? currentComments.split('. ').filter(c => c.trim() !== '') : [];

        if (commentList.includes(description)) {
            // Remove
            commentList = commentList.filter(c => c !== description);
        } else {
            // Add
            commentList.push(description);
        }

        const newCommentString = commentList.join('. ');
        handleCommentChange(studentId, newCommentString);
    };

    const isCommentSelected = (studentId, description) => {
        let currentComments = data.comments[studentId] || '';
        if (!currentComments) return false;
        let commentList = currentComments.split('. ');
        return commentList.includes(description);
    };

    const getSelectedCount = (studentId) => {
        let currentComments = data.comments[studentId] || '';
        if (!currentComments) return 0;
        return currentComments.split('. ').filter(c => c.trim() !== '').length;
    };

    return (
        <MainLayout>
            <Head title="Penilaian Karakter (Akhlak)" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Penilaian Karakter</h2>
                        <p className="text-muted-foreground">Input penilaian akhlak dan karakter siswa per Kamar.</p>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={route('assessments.character.export-excel', {
                                active_kamar_id: selectedKamarId,
                                month: selectedMonth,
                                year: selectedYear
                            })}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                        </a>
                    </div>
                </div>

                <div className="bg-card rounded-xl border shadow-sm p-4">
                    <div className="max-w-sm">
                        <label className="block text-sm font-medium mb-1">Pilih Kamar</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={selectedKamarId}
                            onChange={handleKamarChange}
                        >
                            <option value="">-- Pilih Kamar --</option>
                            {kamars.map(kamar => (
                                <option key={kamar.id} value={kamar.id}>
                                    {kamar.name} (Musrif: {kamar.musrif})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedKamarId && !selectedMonth && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border">
                            <label className="text-sm font-medium">Tahun:</label>
                            <input
                                type="number"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-24 rounded-md border border-input px-3 py-1 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {months.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleMonthSelect(m.id)}
                                    className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
                                >
                                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                                    <span className="font-medium text-lg">{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedKamarId && selectedMonth && students.length > 0 ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleBackToMonths}
                            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Kembali ke Pilih Bulan
                        </button>

                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 py-3 border-b bg-muted/10">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                                            Bulan: {selectedMonthName} {selectedYear}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${semesterBadgeClass}`}>
                                            Semester: {selectedSemester}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-3 text-xs text-muted-foreground border-b bg-muted/20">
                                    Paste dari Excel: fokuskan kursor di kolom nilai pertama santri paling atas, lalu tekan Ctrl+V.
                                </div>
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-6 py-3 font-medium w-16">No</th>
                                                <th className="px-6 py-3 font-medium min-w-[200px]">Nama Santri</th>
                                                <th className="px-4 py-3 font-medium min-w-[150px]">Kelas</th>
                                                {categories.map(cat => (
                                                    <th key={cat} className="px-4 py-3 font-medium text-center w-24">{cat}</th>
                                                ))}
                                                <th className="px-6 py-3 font-medium min-w-[300px]">Komentar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {students.map((student, index) => (
                                                <tr key={student.id} className="hover:bg-muted/50">
                                                    <td className="px-6 py-4 text-center">{index + 1}</td>
                                                    <td className="px-6 py-4 font-medium">
                                                        <div>{student.name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.nis}</div>
                                                        {!student.active_class_id &&
                                                            <span className="text-[10px] text-red-500 block">Belum ada kelas</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-4 font-medium text-muted-foreground">
                                                        {student.class_name || '-'}
                                                    </td>
                                                    {categories.map((cat, catIndex) => (
                                                        <td key={cat} className="px-2 py-4 text-center">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                                                value={data.assessments[student.id]?.[cat] || ''}
                                                                onChange={(e) => handleScoreChange(student.id, cat, e.target.value)}
                                                                onPaste={(e) => handleScorePaste(e, index, catIndex)}
                                                                placeholder="0"
                                                                disabled={!student.active_class_id}
                                                                title={!student.active_class_id ? "Santri belum masuk kelas" : ""}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-4">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    disabled={!student.active_class_id}
                                                                    className="w-full justify-between font-normal text-left h-auto min-h-[2.5rem]"
                                                                >
                                                                    {getSelectedCount(student.id) > 0 ? (
                                                                        <span className="whitespace-normal block">
                                                                            {getSelectedCount(student.id)} komentar...
                                                                            <span className="block text-xs text-muted-foreground mt-1 truncate">
                                                                                {data.comments[student.id].substring(0, 50)}...
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">-- Pilih Komentar --</span>
                                                                    )}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                                <div className="p-2 max-h-[300px] overflow-y-auto">
                                                                    {rubrics.map((r) => {
                                                                        const isChecked = isCommentSelected(student.id, r.description);
                                                                        return (
                                                                            <div
                                                                                key={r.id}
                                                                                className="flex items-start space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                                                onClick={() => toggleComment(student.id, r.description)}
                                                                            >
                                                                                <Checkbox
                                                                                    checked={isChecked}
                                                                                    onCheckedChange={() => { }}
                                                                                    className="mt-1"
                                                                                />
                                                                                <div className="space-y-1 leading-none">
                                                                                    <label className="text-sm font-medium leading-normal cursor-pointer pointer-events-none">
                                                                                        {r.description}
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    {rubrics.length === 0 && <div className="p-2 text-center text-muted-foreground">Tidak ada komentar tersedia.</div>}
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 border-t flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Menyimpan...' : 'Simpan Nilai'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : selectedKamarId && selectedMonth ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-dashed">
                        Tidak ada siswa di kamar ini.
                    </div>
                ) : !selectedKamarId ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-dashed">
                        Silakan pilih kamar terlebih dahulu untuk mengisi nilai.
                    </div>
                ) : null}
            </div>
        </MainLayout>
    );
}
