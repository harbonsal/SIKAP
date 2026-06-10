import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import RekapNilaiTab from './RekapNilaiTab';
import LedgerTab from './LedgerTab';
import RekapIjazahTab from './RekapIjazahTab';
import { useState, useEffect } from 'react';

export default function Show({ activeClass, activeSubjects = [], gradeWeights = [], studentRecaps = [], studentLedgers = [], ijazahSubjects = [], studentIjazahs = [], academicYear, semester, kkms = {} }) {
    const [activeTab, setActiveTab] = useState('rekap');

    // Get tab from URL parameter on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'ledger') {
            setActiveTab('ledger');
        } else if (tabParam === 'ijazah') {
            setActiveTab('ijazah');
        }
    }, []);

    // Update URL when tab changes
    const handleTabChange = (value) => {
        setActiveTab(value);
        const url = new URL(window.location);
        url.searchParams.set('tab', value);
        window.history.pushState({}, '', url);
    };
    
    // Safety check for required data
    if (!activeClass || !semester || !academicYear) {
        return (
            <MainLayout>
                <Head title="Rekap Nilai" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground">Loading data...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }
    return (
        <MainLayout>
            <Head title={`Rekap Nilai - ${activeClass.kelas.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('recap.class.index')}
                            className={buttonVariants({ variant: "outline", size: "icon" })}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Rekap Nilai Kelas</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-muted-foreground">
                                    {activeClass.kelas.name} {activeClass.kelasParalel?.name} - {activeClass.teacher?.name}
                                </p>
                                <span className="text-muted-foreground">•</span>
                                <select
                                    className="bg-transparent border-none p-0 h-auto focus:ring-0 cursor-pointer text-muted-foreground font-medium text-sm"
                                    value={semester.name}
                                    onChange={(e) => router.get(route('recap.class.show', activeClass.id), { semester: e.target.value }, { preserveState: true })}
                                >
                                    <option value="Ganjil">Semester Ganjil</option>
                                    <option value="Genap">Semester Genap</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak
                    </Button>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-200 text-sm hidden print:hidden md:block">
                    <p className="font-semibold mb-1">ℹ️ Informasi Perhitungan Rekap Nilai Kelas</p>
                    <p>
                        Setiap nilai mata pelajaran didapat dari perkalian nilai ujian dengan persentase bobotnya (UH, UTS, UAS).<br/>
                        <strong className="text-red-600">Nilai berwarna merah</strong> menunjukkan nilai di bawah KKM (Kriteria Ketuntasan Minimal).<br/>
                        <strong>Total:</strong> Hasil penjumlahan seluruh Nilai Akhir mata pelajaran siswa.<br/>
                        <strong>Rerata:</strong> Total dibagi rata dengan jumlah keseluruhan mata pelajaran wajib di kelas ini.<br/>
                        {semester.name === 'Genap' && <span><strong>*Semester Genap:</strong> Rerata akhir menggabungkan nilai Ganjil menggunakan rumus: (Ganjil + (2 &times; Genap)) / 3.</span>}
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3">
                        <TabsTrigger value="rekap">Rekap Nilai</TabsTrigger>
                        <TabsTrigger value="ledger">Ledger</TabsTrigger>
                        <TabsTrigger value="ijazah">Rekap Nilai Ijazah</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="rekap" className="mt-6">
                        <RekapNilaiTab 
                            activeSubjects={activeSubjects}
                            studentRecaps={studentRecaps}
                            kkms={kkms}
                        />
                    </TabsContent>
                    
                    <TabsContent value="ledger" className="mt-6">
                        <LedgerTab 
                            activeSubjects={activeSubjects}
                            gradeWeights={gradeWeights}
                            studentLedgers={studentLedgers}
                            kkms={kkms}
                            semester={semester}
                        />
                    </TabsContent>

                    <TabsContent value="ijazah" className="mt-6">
                        <RekapIjazahTab 
                            ijazahSubjects={ijazahSubjects}
                            studentIjazahs={studentIjazahs}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}
