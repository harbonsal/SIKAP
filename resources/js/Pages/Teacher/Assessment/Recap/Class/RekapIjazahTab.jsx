import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { formatScore } from './utils';

export default function RekapIjazahTab({ ijazahSubjects = [], studentIjazahs = [] }) {
    // Safety check
    if (!ijazahSubjects || ijazahSubjects.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Pengaturan mata pelajaran Ijazah belum dikonfigurasi.</p>
                </CardContent>
            </Card>
        );
    }

    if (!studentIjazahs || studentIjazahs.length === 0) {
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
                                <TableHead className="w-[50px] text-center border-r">No</TableHead>
                                <TableHead className="w-[100px] border-r">NIS</TableHead>
                                <TableHead className="min-w-[200px] border-r">Nama Siswa</TableHead>
                                {ijazahSubjects.map((subject, idx) => (
                                    <TableHead key={idx} className="text-center min-w-[100px] border-r whitespace-nowrap px-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{subject.name || subject.mapel_name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center w-[80px] border-r font-bold bg-amber-50 text-amber-700">Total</TableHead>
                                <TableHead className="text-center w-[80px] border-r font-bold bg-amber-50 text-amber-700">Rerata</TableHead>
                                <TableHead className="text-center w-[60px] font-bold bg-amber-100 text-amber-800">Rank</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentIjazahs.map((student, index) => (
                                <TableRow key={student.student_id}>
                                    <TableCell className="text-center border-r">{index + 1}</TableCell>
                                    <TableCell className="border-r text-muted-foreground">{student.nomor_induk}</TableCell>
                                    <TableCell className="border-r font-medium whitespace-nowrap">{student.name}</TableCell>
                                    {ijazahSubjects.map((subject, idx) => {
                                        const score = student.subjects[idx]?.final_score;
                                        return (
                                            <TableCell 
                                                key={idx} 
                                                className="text-center border-r px-2"
                                            >
                                                {formatScore(score)}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-center font-bold bg-amber-50 border-r">
                                        {formatScore(student.total_score)}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-amber-50 border-r">
                                        {Number(student.average_score).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-center font-bold bg-amber-100">
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
