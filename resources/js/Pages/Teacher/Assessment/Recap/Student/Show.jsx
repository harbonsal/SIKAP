import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Show({ student, activeClass, gradesData, academicYear, semester, averageScore }) {
    return (
        <MainLayout>
            <Head title={`Rekap Nilai - ${student.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('recap.student.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Rekap Nilai Santri</h2>
                            <p className="text-muted-foreground">
                                {student.name} ({student.nomor_induk}) - {activeClass.kelas.name} {activeClass.kelas_paralel?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak
                    </button>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                            <div>
                                <div className="text-muted-foreground">Tahun Pelajaran</div>
                                <div className="font-medium">{academicYear.name}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Semester</div>
                                <select
                                    className="font-medium bg-transparent border-none p-0 h-auto focus:ring-0 cursor-pointer text-foreground"
                                    value={semester.name}
                                    onChange={(e) => router.get(route('recap.student.show', student.id), { semester: e.target.value }, { preserveState: true })}
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Kelas</div>
                                <div className="font-medium">{activeClass.kelas.name} {activeClass.kelas_paralel?.name}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Wali Kelas</div>
                                <div className="font-medium">{activeClass.teacher?.name || '-'}</div>
                            </div>
                        </div>

                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium border w-12 text-center">No</th>
                                        <th className="px-4 py-3 font-medium border min-w-[200px]">Mata Pelajaran</th>
                                        <th className="px-4 py-3 font-medium border text-center w-16">KKM</th>
                                        {gradesData.length > 0 && gradesData[0]?.components.map((comp, idx) => (
                                            <th key={idx} className="px-4 py-3 font-medium border text-center">
                                                {comp.name}
                                                <div className="text-[10px] normal-case opacity-70">[{comp.weight_percent}%]</div>
                                            </th>
                                        ))}
                                        {semester.name === 'Genap' || semester.name === 'Semester 2' ? (
                                            <>
                                                <th className="px-4 py-3 font-bold border text-center bg-gray-50">Jumlah</th>
                                                <th className="px-4 py-3 font-bold border text-center bg-gray-50">Rapor 1</th>
                                                <th className="px-4 py-3 font-bold border text-center bg-primary/10 text-primary">Rapor 2</th>
                                            </>
                                        ) : (
                                            <th className="px-4 py-3 font-bold border text-center bg-primary/5 text-primary">Nilai Rapor</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {gradesData.map((subject, index) => (
                                        <tr key={subject.subject_id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 border text-center">{index + 1}</td>
                                            <td className="px-4 py-3 border font-medium">{subject.subject_name}</td>
                                            <td className="px-4 py-3 border text-center">{subject.kkm}</td>
                                            {subject.components.map((comp, idx) => {
                                                const scoreNum = Number(comp.score);
                                                const kkmNum = Number(subject.kkm);
                                                return (
                                                    <td key={idx} className={`px-4 py-3 border text-center ${scoreNum > 0 && scoreNum < kkmNum ? 'text-red-600 font-bold' : ''}`}>
                                                        {scoreNum > 0 ? scoreNum.toFixed(0) : 0}
                                                    </td>
                                                );
                                            })}
                                            {semester.name === 'Genap' || semester.name === 'Semester 2' ? (
                                                <>
                                                    <td className={`px-4 py-3 border text-center font-medium bg-gray-50 ${Number(subject.final_score) > 0 && Number(subject.final_score) < Number(subject.kkm) ? 'text-red-600 font-bold' : ''}`}>
                                                        {Number(subject.final_score) > 0 ? Number(subject.final_score).toFixed(0) : 0}
                                                    </td>
                                                    <td className={`px-4 py-3 border text-center font-medium bg-gray-50 ${Number(subject.sem1_score) > 0 && Number(subject.sem1_score) < Number(subject.kkm) ? 'text-red-600 font-bold' : ''}`}>
                                                        {Number(subject.sem1_score) > 0 ? Number(subject.sem1_score).toFixed(0) : 0}
                                                    </td>
                                                    <td className={`px-4 py-3 border text-center font-bold bg-primary/10 ${Number(subject.rapor_score) > 0 && Number(subject.rapor_score) < Number(subject.kkm) ? 'text-red-600' : 'text-primary'}`}>
                                                        {Number(subject.rapor_score) > 0 ? Number(subject.rapor_score).toFixed(0) : 0}
                                                    </td>
                                                </>
                                            ) : (
                                                <td className={`px-4 py-3 border text-center font-bold bg-primary/5 ${Number(subject.final_score) > 0 && Number(subject.final_score) < Number(subject.kkm) ? 'text-red-600' : ''}`}>
                                                    {Number(subject.final_score) > 0 ? Number(subject.final_score).toFixed(0) : 0}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/50 font-bold">
                                    <tr>
                                        <td colSpan={3 + (gradesData.length > 0 ? gradesData[0].components.length : 0)} className="px-4 py-3 border text-right uppercase text-muted-foreground">
                                            Rata-rata Nilai Rapor
                                        </td>
                                        {semester.name === 'Genap' || semester.name === 'Semester 2' ? (
                                            <td colSpan={3} className="px-4 py-3 border text-center text-primary text-lg">
                                                {averageScore}
                                            </td>
                                        ) : (
                                            <td className="px-4 py-3 border text-center text-primary text-lg">
                                                {averageScore}
                                            </td>
                                        )}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
