import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, AlertCircle, Info, Download } from 'lucide-react';
import { Label } from '@/Components/ui/label';
import { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';

export default function Show({ activeSubject, gradeWeights, semester, previousParams, kkmValue }) {
    const [grades, setGrades] = useState({});
    const [activeColumns, setActiveColumns] = useState({}); // Stores which columns are active for editing
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        grades: [],
    });

    // Initialize grades from existing data
    // Initialize grades from existing data
    useEffect(() => {
        const initialGrades = {};
        if (activeSubject?.active_class?.class_members) {
            activeSubject.active_class.class_members.forEach(member => {
                const studentId = member.student.id;
                initialGrades[studentId] = {};

                gradeWeights.forEach(weight => {
                    const existingGrade = member.student.student_grades?.find(
                        g => g.grade_weight_id == weight.id
                    );
                    // Parse float to remove trailing .00
                    const rawScore = existingGrade ? existingGrade.score : '';
                    initialGrades[studentId][weight.id] = rawScore !== '' ? parseFloat(parseFloat(rawScore).toFixed(1)) : '';
                });
            });
        }
        setGrades(initialGrades);
    }, [activeSubject, gradeWeights]);

    const handleGradeChange = (studentId, weightId, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [weightId]: value
            }
        }));
    };



    const toggleColumn = (weightId) => {
        setActiveColumns(prev => ({
            ...prev,
            [weightId]: !prev[weightId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Transform grades object to array for submission
        const gradesArray = [];
        Object.keys(grades).forEach(studentId => {
            Object.keys(grades[studentId]).forEach(weightId => {
                const score = grades[studentId][weightId];
                // Only include if score is not empty string (allow 0)
                if (score !== '') {
                    gradesArray.push({
                        student_id: parseInt(studentId),
                        grade_weight_id: parseInt(weightId),
                        score: parseFloat(score)
                    });
                }
            });
        });

        setData('grades', gradesArray);
    };

    // Trigger post when data.grades is updated
    useEffect(() => {
        if (data.grades.length > 0) {
            post(route('assessments.store', activeSubject.id), {
                preserveScroll: true,
                onSuccess: () => {
                    // Reset active columns on success for security/safety
                    setActiveColumns({});
                    setData('grades', []); // Reset form data
                }
            });
        }
    }, [data.grades]);

    // Paste Logic
    const handlePaste = (e, startStudentId, startWeightId) => {
        e.preventDefault();
        const clipboardData = e.clipboardData.getData('text');

        // Don't filter out empty rows immediately, they might represent empty values for students
        // Just remove the very last empty line if it exists
        let rawRows = clipboardData.split(/\r?\n/);
        if (rawRows.length > 1 && rawRows[rawRows.length - 1].trim() === '') {
            rawRows.pop();
        }

        if (rawRows.length === 0) return;

        // Get sorted list of student IDs
        const studentIds = activeSubject.active_class.class_members.map(m => m.student.id);
        const startStudentIndex = studentIds.indexOf(startStudentId);

        // Get sorted list of weight IDs (based on display order)
        const weightIds = gradeWeights.map(w => w.id);
        const startWeightIndex = weightIds.indexOf(startWeightId);

        if (startStudentIndex === -1 || startWeightIndex === -1) return;

        setGrades(prev => {
            const newGrades = { ...prev };

            rawRows.forEach((row, rowIndex) => {
                const currentStudentIndex = startStudentIndex + rowIndex;
                if (currentStudentIndex >= studentIds.length) return;

                const currentStudentId = studentIds[currentStudentIndex];
                const cols = row.split('\t'); // Excel uses tabs

                cols.forEach((value, colIndex) => {
                    const currentWeightIndex = startWeightIndex + colIndex;
                    if (currentWeightIndex >= weightIds.length) return;

                    const weightId = weightIds[currentWeightIndex];

                    // Simple cleaning: comma to dot, remove non-numeric chars except dot/comma
                    let cleanValue = value.trim().replace(',', '.');

                    // Handle empty/null values explicitly
                    if (cleanValue === '' || cleanValue === '-') {
                        cleanValue = '';
                    } else if (isNaN(parseFloat(cleanValue))) {
                        // If it's pure text (non-numeric), skip it but preserve the structure?
                        // Actually, if it's text, we should probably set to empty or keep previous
                        return;
                    }

                    if (!newGrades[currentStudentId]) newGrades[currentStudentId] = {};
                    newGrades[currentStudentId][weightId] = cleanValue;
                });
            });

            return newGrades;
        });
    };

    const handleKeyDown = (e, studentId, weightId) => {
        const studentIds = activeSubject.active_class.class_members.map(m => m.student.id);
        const weightIds = gradeWeights.map(w => w.id);

        const studentIndex = studentIds.indexOf(studentId);
        const weightIndex = weightIds.indexOf(weightId);

        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            if (studentIndex < studentIds.length - 1) {
                const nextStudentId = studentIds[studentIndex + 1];
                const input = document.getElementById(`grade-input-${nextStudentId}-${weightId}`);
                input?.focus();
            } else {
                // Wrap around to top of NEXT column or just stay? 
                // Usually staying is safer, or move to save button?
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (studentIndex > 0) {
                const prevStudentId = studentIds[studentIndex - 1];
                const input = document.getElementById(`grade-input-${prevStudentId}-${weightId}`);
                input?.focus();
            }
        } else if (e.key === 'ArrowRight' && e.target.selectionEnd === e.target.value.length) {
            // Optional: Move to right column if at end of input
            if (weightIndex < weightIds.length - 1) {
                const nextWeightId = weightIds[weightIndex + 1];
                // Only if next column is enabled?
                if (activeColumns[nextWeightId]) {
                    const input = document.getElementById(`grade-input-${studentId}-${nextWeightId}`);
                    input?.focus();
                }
            }
        } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
            // Optional: Move to left column if at start of input
            if (weightIndex > 0) {
                const prevWeightId = weightIds[weightIndex - 1];
                if (activeColumns[prevWeightId]) {
                    const input = document.getElementById(`grade-input-${studentId}-${prevWeightId}`);
                    input?.focus();
                }
            }
        }
    };

    const getDisplayName = (name) => {
        if (name.toUpperCase() === 'UAS/UKK' || name.toUpperCase() === 'UAS / UKK') {
            return semester?.name?.toLowerCase().includes('genap') ? 'UKK' : 'UAS';
        }
        return name;
    };

    // Helper calculate total
    const calculateTotal = (studentId) => {
        let totalScore = 0;
        let totalWeight = 0;
        gradeWeights.forEach(weight => {
            const score = parseFloat(grades[studentId]?.[weight.id] || 0);
            totalScore += score * (weight.weight / 100);
            totalWeight += weight.weight;
        });
        // Use parseFloat to remove trailing zeros, but keep 1 decimal if needed
        return totalWeight > 0 ? parseFloat(totalScore.toFixed(1)) : '-';
    }

    return (
        <MainLayout>
            <Head title={`Input Nilai - ${activeSubject.mapel.name}`} />

            <style>{`
                /* Hide spin buttons for number inputs */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none;
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild className="h-9 w-9">
                            <Link href={route('assessments.index', previousParams)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                Input Nilai
                                <span className="text-muted-foreground font-normal text-lg hidden sm:inline">|</span>
                                <span className="text-primary text-xl hidden sm:inline">{activeSubject.mapel.name}</span>
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {activeSubject.active_class.kelas.name} {activeSubject.active_class.kelas_paralel?.name} • Semester {semester?.name}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild className="min-w-[120px] shadow-sm">
                        <a href={route('assessments.template', activeSubject.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Template Excel/CSV
                        </a>
                    </Button>

                    <Button onClick={(e) => document.getElementById('grades-form').requestSubmit()} disabled={processing} className="min-w-[120px] shadow-sm">
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </div>

                {gradeWeights.length === 0 ? (
                    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <p>Komponen penilaian (Bobot Nilai) belum diatur untuk tahun ajaran ini. Silakan hubungi admin.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-900">Cara Cepat Input Nilai (Copy-Paste)</h4>
                                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                        <li>Pastikan sumber nilai (Excel/Spreadsheet) <strong>sudah terurut</strong> sesuai urutan siswa di bawah ini. (Urutan berdasarkan <strong>No Induk / NIS</strong>).</li>
                                        <li>Copy angka nilai dari Excel (bisa satu kolom atau beberapa kolom sekaligus).</li>
                                        <li>Klik pada kolom input nilai siswa pertama yang ingin diisi.</li>
                                        <li>Tekan <strong>Ctrl + V</strong> (Paste) pada keyboard untuk menempelkan nilai.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <Card className="overflow-hidden border-none shadow-md">
                            <CardContent className="p-0">
                                <form id="grades-form" onSubmit={handleSubmit}>
                                    <div className="relative overflow-x-auto max-h-[calc(100vh-250px)]">
                                        <table className="w-full text-sm text-left border-collapse border border-gray-300">
                                            <thead className="text-xs uppercase bg-gray-100 text-gray-700 sticky top-0 z-30 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold w-12 text-center sticky left-0 z-40 bg-gray-100 border-b border-r border-gray-300 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">No</th>
                                                    <th className="px-4 py-3 font-bold min-w-[220px] sticky left-12 z-40 bg-gray-100 border-b border-r border-gray-300 shadow-[4px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                                        Identitas Siswa
                                                    </th>
                                                    {gradeWeights.map(weight => (
                                                        <th key={weight.id} className="px-2 py-3 font-bold text-center min-w-[100px] border-b border-r border-gray-300 bg-gray-50">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex items-center gap-1.5 mb-1 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-400 text-primary focus:ring-primary h-3.5 w-3.5"
                                                                        checked={!!activeColumns[weight.id]}
                                                                        onChange={() => toggleColumn(weight.id)}
                                                                        id={`toggle-${weight.id}`}
                                                                    />
                                                                    <label htmlFor={`toggle-${weight.id}`} className="text-[10px] cursor-pointer font-bold uppercase tracking-wider select-none text-gray-700">
                                                                        Input
                                                                    </label>
                                                                </div>
                                                                <span className="text-xs">{getDisplayName(weight.name)}</span>
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none font-normal border-gray-300">
                                                                    {weight.weight}%
                                                                </Badge>
                                                            </div>
                                                        </th>
                                                    ))}
                                                    <th className="px-4 py-3 font-bold text-center w-24 bg-blue-50 text-blue-800 border-b border-l border-gray-300">
                                                        Nilai<br />Semester {semester?.name?.toLowerCase().includes('genap') ? '2' : '1'}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-300">
                                                {activeSubject.active_class.class_members.map((member, index) => (
                                                    <tr key={member.id} className="hover:bg-blue-50/50 transition-colors group even:bg-gray-50/50">
                                                        <td className="px-4 py-3 text-center sticky left-0 z-20 bg-background group-hover:bg-blue-50/50 group-even:bg-gray-50/50 border-r border-gray-300 font-medium text-gray-700">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3 sticky left-12 z-20 bg-background group-hover:bg-blue-50/50 group-even:bg-gray-50/50 border-r border-gray-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800">{member.student.name}</span>
                                                                <span className="text-xs text-gray-500 font-mono mt-0.5">{member.student.nomor_induk}</span>
                                                            </div>
                                                        </td>
                                                        {gradeWeights.map(weight => (
                                                            <td key={weight.id} className="p-2 text-center border-r border-gray-300 relative">
                                                                <Input
                                                                    type="number"
                                                                    id={`grade-input-${member.student.id}-${weight.id}`}
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.01"
                                                                    disabled={!activeColumns[weight.id]}
                                                                    className={`h-9 w-full min-w-[60px] text-center font-bold focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary px-1 transition-all ${activeColumns[weight.id] ? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'} ${(grades[member.student.id]?.[weight.id] !== '' && parseFloat(grades[member.student.id]?.[weight.id] || 0) < kkmValue) ? 'text-red-500' : ''}`}
                                                                    value={grades[member.student.id]?.[weight.id] ?? ''}
                                                                    onChange={(e) => handleGradeChange(member.student.id, weight.id, e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    placeholder=""
                                                                    onPaste={(e) => handlePaste(e, member.student.id, weight.id)}
                                                                    onKeyDown={(e) => handleKeyDown(e, member.student.id, weight.id)}
                                                                    onWheel={(e) => e.target.blur()}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className={`px-4 py-3 text-center font-extrabold bg-blue-50/30 border-l border-gray-300 ${parseFloat(calculateTotal(member.student.id)) < kkmValue ? 'text-red-600' : 'text-blue-700'}`}>
                                                            {calculateTotal(member.student.id)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout >
    );
}
