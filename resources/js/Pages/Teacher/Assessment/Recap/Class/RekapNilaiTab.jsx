import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { isBelowKkm, formatScore } from './utils';

export default function RekapNilaiTab({ activeSubjects = [], studentRecaps = [], kkms = {} }) {
    // Safety check
    if (!activeSubjects || activeSubjects.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Belum ada mata pelajaran di kelas ini.</p>
                </CardContent>
            </Card>
        );
    }

    if (!studentRecaps || studentRecaps.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Belum ada data siswa di kelas ini.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="border-collapse w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px] text-center border-r sticky left-0 z-20 bg-muted/90 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">No</TableHead>
                                <TableHead className="w-[100px] border-r sticky left-[50px] z-20 bg-muted/90 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">NIS</TableHead>
                                <TableHead className="min-w-[200px] border-r sticky left-[150px] z-20 bg-muted/90 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</TableHead>
                                {activeSubjects.map((subject, index) => {
                                    const isEven = index % 2 === 0;
                                    const groupBgClass = isEven ? 'bg-blue-50/40' : 'bg-slate-50/60';
                                    return (
                                        <TableHead key={subject.id} className={`text-center min-w-[100px] border-r whitespace-nowrap px-2 ${groupBgClass}`}>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{subject.mapel.name}</span>
                                                {subject.teacher && (
                                                    <span className="text-xs font-normal text-muted-foreground mt-0.5">
                                                        {subject.teacher.name}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                                <TableHead className="text-center w-[80px] border-r font-bold bg-primary/5 text-primary">Total</TableHead>
                                <TableHead className="text-center w-[80px] border-r font-bold bg-primary/5 text-primary">Rerata</TableHead>
                                <TableHead className="text-center w-[60px] font-bold bg-primary/10 text-primary">Rank</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentRecaps.map((student, index) => (
                                <TableRow key={student.student_id} className="hover:bg-muted/30 group transition-colors">
                                    <TableCell className="text-center border-r sticky left-0 z-10 bg-background group-hover:bg-muted/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{index + 1}</TableCell>
                                    <TableCell className="border-r text-muted-foreground sticky left-[50px] z-10 bg-background group-hover:bg-muted/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.nomor_induk}</TableCell>
                                    <TableCell className="border-r font-medium whitespace-nowrap sticky left-[150px] z-10 bg-background group-hover:bg-muted/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.name}</TableCell>
                                    {activeSubjects.map((subject, sIndex) => {
                                        const isEven = sIndex % 2 === 0;
                                        const groupBgClass = isEven ? 'bg-blue-50/10' : 'bg-slate-50/20';
                                        const groupHighlightBgClass = isEven ? 'bg-blue-50/40' : 'bg-slate-50/50';
                                        const score = student.subjects[subject.id]?.final_score;
                                        const isBelow = isBelowKkm(score, subject.mapel_id, kkms);
                                        return (
                                            <TableCell 
                                                key={subject.id} 
                                                className={`text-center border-r px-2 ${groupBgClass} group-hover:${groupHighlightBgClass} ${isBelow ? 'text-red-600 font-bold' : ''}`}
                                                style={isBelow ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                            >
                                                {formatScore(score)}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-center font-bold bg-primary/5 border-r">
                                        {formatScore(student.total_score)}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-primary/5 border-r">
                                        {Number(student.average_score).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-primary/10">
                                        {student.rank}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
