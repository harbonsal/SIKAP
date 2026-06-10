import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Card, CardContent } from '@/Components/ui/card';
import { isBelowKkm, formatScore } from './utils';

export default function LedgerTab({ activeSubjects = [], gradeWeights = [], studentLedgers = [], kkms = {}, semester }) {
    const isSem2 = semester?.name === 'Genap' || semester?.name === 'Semester 2';
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

    if (!gradeWeights || gradeWeights.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Belum ada bobot nilai untuk semester ini.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0 overflow-x-auto">
                <div className="w-full inline-block min-w-max p-4">
                    <Table className="border-collapse border border-gray-300 w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead rowSpan={2} className="border border-gray-300 text-center w-[50px] font-bold text-foreground sticky left-0 z-20 bg-muted/90 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">No</TableHead>
                                <TableHead rowSpan={2} className="border border-gray-300 min-w-[200px] font-bold text-foreground sticky left-[50px] z-20 bg-muted/90 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama & NIS</TableHead>

                                {activeSubjects.map((subject, index) => {
                                    const isEven = index % 2 === 0;
                                    const groupBgClass = isEven ? 'bg-blue-50/40' : 'bg-slate-50/60';
                                    return (
                                        <TableHead key={subject.id} colSpan={gradeWeights.length + (isSem2 ? 2 : 1)} className={`border border-gray-300 border-r-2 border-r-gray-400 text-center font-bold text-foreground whitespace-nowrap px-4 py-2 ${groupBgClass}`}>
                                        <div className="flex flex-col">
                                            <span>{subject.mapel?.name || 'Mapel'}</span>
                                            {subject.teacher && (
                                                <span className="text-xs font-normal text-muted-foreground mt-0.5">
                                                    {subject.teacher.name}
                                                </span>
                                            )}
                                        </div>
                                        </TableHead>
                                    );
                                })}

                                <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 bg-muted/50">Jumlah</TableHead>
                                <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 bg-muted/50">Rerata</TableHead>
                                <TableHead rowSpan={2} className="border border-gray-300 text-center font-bold text-foreground px-4 bg-muted/50">Peringkat</TableHead>
                            </TableRow>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                {activeSubjects.map((subject, index) => {
                                    const isEven = index % 2 === 0;
                                    const groupBgClass = isEven ? 'bg-blue-50/20' : 'bg-slate-50/30';
                                    return (
                                        <React.Fragment key={subject.id}>
                                            {gradeWeights.map((weight) => (
                                                <TableHead key={weight.id} className={`border border-gray-300 text-center text-xs px-2 py-1 ${groupBgClass}`}>
                                                    {weight.name}
                                                </TableHead>
                                            ))}
                                            <TableHead className={`border border-gray-300 text-center font-bold text-xs px-2 py-1 ${isEven ? 'bg-blue-100/50' : 'bg-slate-200/50'} ${!isSem2 ? 'border-r-2 border-r-gray-400' : ''}`}>
                                                NA
                                            </TableHead>
                                            {isSem2 && (
                                                <TableHead className={`border border-gray-300 border-r-2 border-r-gray-400 text-center font-bold text-xs px-2 py-1 ${isEven ? 'bg-blue-100/50' : 'bg-slate-200/50'}`}>
                                                    R2
                                                </TableHead>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentLedgers && studentLedgers.length > 0 ? (
                                studentLedgers.map((ledger, index) => (
                                    <TableRow key={ledger.student_id} className="hover:bg-muted/30 group transition-colors">
                                        <TableCell className="border border-gray-300 text-center py-2 sticky left-0 z-10 bg-background group-hover:bg-muted/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="border border-gray-300 font-medium py-2 sticky left-[50px] z-10 bg-background group-hover:bg-muted/30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <div className="flex flex-col">
                                                <span>{ledger.name}</span>
                                                <span className="text-xs text-muted-foreground">{ledger.nomor_induk}</span>
                                            </div>
                                        </TableCell>

                                        {activeSubjects.map((subject, sIndex) => {
                                            const subjectData = ledger.subjects[subject.id];
                                            const mapelId = subject.mapel_id;
                                            const isEven = sIndex % 2 === 0;
                                            const groupBgClass = isEven ? 'bg-blue-50/10' : 'bg-slate-50/20';
                                            const groupHighlightBgClass = isEven ? 'bg-blue-50/40' : 'bg-slate-50/50';

                                            return (
                                                <React.Fragment key={subject.id}>
                                                    {gradeWeights.map((weight) => {
                                                        const score = subjectData?.weights?.[weight.id];
                                                        const isBelow = isBelowKkm(score, mapelId, kkms);
                                                        return (
                                                            <TableCell
                                                                key={weight.id}
                                                                className={`border border-gray-300 text-center py-2 ${groupBgClass} group-hover:${groupHighlightBgClass} ${isBelow ? 'text-red-600 font-bold' : ''}`}
                                                                style={isBelow ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                            >
                                                                {formatScore(score)}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell
                                                        className={`border border-gray-300 text-center font-semibold py-2 ${isEven ? 'bg-blue-50/50' : 'bg-slate-100/50'} group-hover:${isEven ? 'bg-blue-100/60' : 'bg-slate-200/60'} ${!isSem2 ? 'border-r-2 border-r-gray-400' : ''} ${isBelowKkm(subjectData?.final_score, mapelId, kkms) ? 'text-red-600 font-bold' : ''}`}
                                                        style={isBelowKkm(subjectData?.final_score, mapelId, kkms) ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                    >
                                                        {formatScore(subjectData?.final_score)}
                                                    </TableCell>
                                                    {isSem2 && (
                                                        <TableCell
                                                            className={`border border-gray-300 border-r-2 border-r-gray-400 text-center font-semibold py-2 ${isEven ? 'bg-blue-100/40' : 'bg-slate-200/40'} group-hover:${isEven ? 'bg-blue-100/80' : 'bg-slate-200/80'} ${isBelowKkm(subjectData?.r2_score, mapelId, kkms) ? 'text-red-600 font-bold' : ''}`}
                                                            style={isBelowKkm(subjectData?.r2_score, mapelId, kkms) ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                        >
                                                            {formatScore(subjectData?.r2_score)}
                                                        </TableCell>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}

                                        <TableCell className="border border-gray-300 text-center font-bold py-2 bg-muted/10 group-hover:bg-muted/30">
                                            {formatScore(ledger.total_score)}
                                        </TableCell>
                                        <TableCell className="border border-gray-300 text-center font-bold py-2 bg-muted/10 group-hover:bg-muted/30">
                                            {formatScore(ledger.average_score)}
                                        </TableCell>
                                        <TableCell className="border border-gray-300 text-center font-bold py-2 text-primary bg-primary/5 group-hover:bg-primary/10">
                                            {ledger.rank}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={activeSubjects.length * (gradeWeights.length + (isSem2 ? 2 : 1)) + 5} className="h-24 text-center text-muted-foreground border border-gray-300">
                                        Belum ada data nilai atau santri di kelas ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
