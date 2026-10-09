import MainLayout from '@/Layouts/MainLayout';
import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { User, CheckCircle, Search, ChevronLeft, ArrowRight, History as HistoryIcon, RefreshCw, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

export default function StudentList({ activeSubject, gradeWeight, existingGrades, kkm = 75, lockStatus = 'open', isAdminOrManager = false }) {
    const allStudents = activeSubject?.active_class?.class_members?.map(member => member.student) || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [remedialConfirmOpen, setRemedialConfirmOpen] = useState(false);
    const [remedialStudent, setRemedialStudent] = useState(null);
    const [isLateSubmission, setIsLateSubmission] = useState(false);
    const [isExcused, setIsExcused] = useState(null);
    const [targetUrl, setTargetUrl] = useState('');

    const isLatePhase = lockStatus === 'late_phase' || lockStatus === 'strict_lock';
    const isStrictlyLocked = lockStatus === 'strict_lock' && !isAdminOrManager;
    const actionLocked = isStrictlyLocked;

    // Filter students based on search AND late_phase logic
    const students = allStudents.filter(student => {
        // Search filter
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.nomor_induk && student.nomor_induk.includes(searchQuery)) ||
            (student.nisn && student.nisn.includes(searchQuery));
            
        if (!matchesSearch) return false;
        
        // Late Phase filter: only show if no grade or score < kkm
        if (isLatePhase && !isAdminOrManager) {
            const grade = existingGrades[student.id];
            if (!grade) return true;
            return parseFloat(grade.score) < kkm;
        }
        
        return true;
    });

    return (
        <MainLayout>
            <Head title="Daftar Santri" />
            <div className="py-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header & Back Button */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="icon" asChild className="-ml-2 hidden sm:inline-flex">
                                <Link href={route('tahfidz.assessments.show', activeSubject.id)}>
                                    <ChevronLeft className="h-6 w-6 text-gray-500" />
                                </Link>
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {gradeWeight.name}
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground sm:ml-10">
                            Kelas: <span className="font-semibold text-foreground">{activeSubject?.active_class?.kelas?.name || 'Kelas ?'}</span> • Pilih santri untuk penilaian
                        </p>
                    </div>

                    <Button variant="outline" asChild className="shrink-0">
                        <Link href={route('tahfidz.assessments.show', activeSubject.id)}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Kembali ke Daftar Ujian
                        </Link>
                    </Button>
                </div>

                {/* Locked Banner */}
                {isStrictlyLocked && (
                    <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-200">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>Masa Perbaikan Berakhir</AlertTitle>
                        <AlertDescription>
                            Input nilai saat ini tertutup sepenuhnya. Hubungi Manager Tahfidz atau Administrator jika anda perlu melakukan perubahan.
                        </AlertDescription>
                    </Alert>
                )}
                {isLatePhase && (
                    <Alert className="mb-6 bg-amber-50 text-amber-900 border-amber-200">
                        <RefreshCw className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Masa Ujian Susulan & Remedial</AlertTitle>
                        <AlertDescription className="text-amber-700">
                            Waktu ujian normal telah berakhir. Saat ini Anda hanya dapat melakukan penilaian untuk santri yang belum ujian atau remedial (Nilai &lt; KKM). Santri yang mengabaikan ujian (tanpa udzur) dibatasi maksimal KKM (70).
                        </AlertDescription>
                    </Alert>
                )}

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari santri berdasarkan nama, NIS atau NISN..."
                            className="pl-10 h-11 bg-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="space-y-3">
                    {students.length > 0 ? (
                        students.map((student) => {
                            const grade = existingGrades[student.id];
                            const hasGrade = !!grade;

                            return (
                                <div
                                    key={student.id}
                                    onClick={() => {
                                        if (actionLocked && !hasGrade) return; // Allow viewing if has grade, but wait, actionLocked prevents new tests
                                        if (hasGrade) {
                                            setRemedialStudent(student);
                                            setRemedialConfirmOpen(true);
                                        } else {
                                            setTargetUrl(route('tahfidz.assessments.assess', {
                                                active_subject: activeSubject.id,
                                                grade_weight: gradeWeight.id,
                                                student_id: student.id
                                            }));
                                            setConfirmOpen(true);
                                        }
                                    }}
                                    className={`group flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${hasGrade ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-indigo-300'}`}
                                >
                                    {/* Left Status Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasGrade ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-indigo-500'} transition-colors`} />

                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center shrink-0 ${hasGrade ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'}`}>
                                            <User className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                                    {student.name}
                                                </h3>
                                                {hasGrade && grade.original_score !== null && (new Date(grade.updated_at) - new Date(grade.created_at) < 5000) && !grade.is_excused && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full border border-red-200">Terlambat (Tledor)</span>
                                                )}
                                                {hasGrade && grade.original_score !== null && (new Date(grade.updated_at) - new Date(grade.created_at) >= 5000) && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">Remedial</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono">
                                                {student.nomor_induk || student.nisn || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={route('tahfidz.assessments.history', {
                                                active_subject: activeSubject.id,
                                                student_id: student.id
                                            })}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Lihat Histori Penilaian"
                                        >
                                            <HistoryIcon className="h-5 w-5" />
                                        </Link>

                                        {/* Remedial Button */}
                                        {hasGrade && (parseFloat(grade.score) < kkm || gradeWeight.name.toLowerCase().includes('validasi')) && !actionLocked && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent triggering parent row click
                                                    if (actionLocked) return;
                                                    setRemedialStudent(student);
                                                    setRemedialConfirmOpen(true);
                                                }}
                                                className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors cursor-pointer"
                                                title="Ambil Ulang (Mode Remedial)"
                                            >
                                                <RefreshCw className="h-5 w-5" />
                                            </div>
                                        )}

                                        {hasGrade ? (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (actionLocked) return;
                                                    setRemedialStudent(student);
                                                    setRemedialConfirmOpen(true);
                                                }}
                                                className={`flex flex-col items-end ${actionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                            >
                                                <div className={`flex items-center font-bold ${parseFloat(grade.score) < kkm ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    <span className="text-xl mr-1.5">{parseFloat(parseFloat(grade.score).toFixed(1))}</span>
                                                    <CheckCircle className="h-5 w-5" />
                                                </div>
                                                <span className={`text-xs font-medium ${parseFloat(grade.score) < kkm ? 'text-red-600/80' : 'text-emerald-600/80'}`}>Sudah Dinilai</span>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    if (actionLocked) return;
                                                    setTargetUrl(route('tahfidz.assessments.assess', {
                                                        active_subject: activeSubject.id,
                                                        grade_weight: gradeWeight.id,
                                                        student_id: student.id
                                                    }));
                                                    setIsLateSubmission(!hasGrade && (lockStatus === 'late_phase' || lockStatus === 'strict_lock'));
                                                    setIsExcused(null);
                                                    setConfirmOpen(true);
                                                }}
                                                className={`flex items-center transition-colors cursor-pointer ${actionLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 group-hover:text-indigo-600'}`}
                                            >
                                                <span className="text-sm font-medium mr-2 hidden sm:inline">{actionLocked ? 'Terkunci' : 'Input Nilai'}</span>
                                                {actionLocked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-5 w-5" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                            <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                            <p>Tidak ada santri ditemukan dengan kata kunci "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Penilaian</DialogTitle>
                            <DialogDescription>
                                Pastikan ananda sudah setor hafalan ke Musrif Halaqoh
                            </DialogDescription>
                        </DialogHeader>
                        {isLateSubmission && (
                            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-2">
                                <h3 className="font-bold text-gray-900 text-sm">Alasan Keterlambatan Ujian</h3>
                                <div className="flex flex-col gap-2">
                                    <div onClick={() => setIsExcused(true)}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isExcused === true ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isExcused === true ? 'border-indigo-600' : 'border-gray-400'}`}>
                                                {isExcused === true && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">Izin / Sakit</span>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-7 block">Mendapatkan jatah nilai penuh (Maks 100).</span>
                                    </div>
                                    <div onClick={() => setIsExcused(false)}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isExcused === false ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isExcused === false ? 'border-red-600' : 'border-gray-400'}`}>
                                                {isExcused === false && <div className="w-2 h-2 bg-red-600 rounded-full" />}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">Tledor / Tanpa Udzur</span>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-7 block">Nilai maksimal dibatasi KKM ({kkm}).</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter className="flex flex-row space-x-2 sm:justify-end mt-4">
                            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                                Batal
                            </Button>
                            <Link 
                                href={targetUrl + (isLateSubmission && isExcused !== null ? `?is_excused=${isExcused ? '1' : '0'}` : '')} 
                                className={`w-full sm:w-auto ${isLateSubmission && isExcused === null ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <Button className="w-full" disabled={isLateSubmission && isExcused === null}>Lanjut Menilai</Button>
                            </Link>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={remedialConfirmOpen} onOpenChange={setRemedialConfirmOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Pilih Jenis Pengulangan</DialogTitle>
                            <DialogDescription>
                                Apakah ini ujian ulang atau remidi?
                                <ul className="mt-2 text-left list-disc list-inside text-xs text-gray-500">
                                    <li><strong>Ujian Ulang:</strong> Nilai maksimal 100</li>
                                    <li><strong>Remidi:</strong> Nilai dibatasi maksimal KKM ({kkm})</li>
                                </ul>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-700" onClick={() => {
                                window.location.href = route('tahfidz.assessments.assess', {
                                    active_subject: activeSubject.id,
                                    grade_weight: gradeWeight.id,
                                    student_id: remedialStudent?.id,
                                    type: 'retake'
                                });
                            }}>
                                <span className="font-bold text-base">Ujian Ulang</span>
                                <span className="text-xs opacity-80">(Maks 100)</span>
                            </Button>
                            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 text-amber-700" onClick={() => {
                                window.location.href = route('tahfidz.assessments.assess', {
                                    active_subject: activeSubject.id,
                                    grade_weight: gradeWeight.id,
                                    student_id: remedialStudent?.id,
                                    type: 'remedial'
                                });
                            }}>
                                <span className="font-bold text-base">Remidi</span>
                                <span className="text-xs opacity-80">(Maks {kkm})</span>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
