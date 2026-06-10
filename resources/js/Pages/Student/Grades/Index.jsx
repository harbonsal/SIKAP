import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

export default function Index({ auth, safetyTargets, student, className, semesterName, weightComponents, isSem2, error, tahfidzGrades, memorizationCount }) {

    if (error) {
        return (
            <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Saya</h2>}>
                <Head title="Nilai Saya" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Aman': return 'bg-green-100 text-green-800 border-green-200';
            case 'Perlu Perhatian': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Belum Aman': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Aman': return <CheckCircle className="w-4 h-4 mr-1 text-green-600" />;
            case 'Perlu Perhatian': return <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />;
            case 'Belum Aman': return <XCircle className="w-4 h-4 mr-1 text-red-600" />;
            default: return null;
        }
    };

    const formatScore = (val) => {
        if (val === null || val === undefined || val === '-') return '-';
        const num = parseFloat(val);
        if (isNaN(num)) return val;

        // 100 tanpa koma, selain 100 sisakan 1 angka di belakang koma
        if (num === 100) return "100";
        return num.toFixed(1);
    };

    const getScoreColor = (val, kkm = 70) => {
        if (val === null || val === undefined || val === '-') return 'text-gray-500';
        const num = parseFloat(val);
        if (isNaN(num)) return 'text-gray-500';

        // Fix string comparison bug: >= KKM is green, otherwise red.
        return num >= kkm ? 'text-emerald-600' : 'text-red-600';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Saya & Target Akademik</h2>}
        >
            <Head title="Nilai Saya" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Info */}
                    <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{student?.name}</h3>
                                    <p className="text-blue-100 opacity-90 text-sm mt-1 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {className} | {semesterName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                                        <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Total Nilai</p>
                                        <p className="text-2xl font-mono font-bold">{safetyTargets.length} Mapel</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tahfidz Section */}
                    <Card className="shadow-lg border-t-4 border-t-emerald-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                    Informasi Tahfidz
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Capaian hafalan dan nilai ujian tahfidz.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Total Hafalan: {memorizationCount !== undefined ? memorizationCount : '-'} Juz (Est.)
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kategori</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Jenis Ujian</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Nilai Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tahfidzGrades && tahfidzGrades.length > 0 ? (
                                            tahfidzGrades.map((grade, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {grade.active_subject?.mapel?.name || 'Tahfidz'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {grade.grade_weight?.name}
                                                    </td>
                                                    <td className={`px-4 py-3 text-center text-sm font-bold ${getScoreColor(grade.score, 70)}`}>
                                                        {formatScore(grade.score)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-6 text-gray-400 italic">
                                                    Belum ada data nilai tahfidz semester ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Table */}
                    <Card className="shadow-lg border-t-4 border-t-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                    Rekapitulasi Nilai Akademik
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Pantau terus nilai dan targetmu agar tetap aman.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aman</Badge>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Perlu Perhatian</Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Belum Aman</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-12">
                                                No
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                                Mata Pelajaran
                                            </th>
                                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                KKM
                                            </th>
                                            {isSem2 && (
                                                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Sem 1
                                                </th>
                                            )}
                                            {weightComponents.map((comp, idx) => (
                                                <th key={idx} className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {comp}
                                                </th>
                                            ))}
                                            {isSem2 && (
                                                <th className="px-3 py-3 text-center text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50/50">
                                                    SEM 2
                                                </th>
                                            )}
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                STATUS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {safetyTargets.map((subject, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-500 border-l-4 border-transparent hover:border-blue-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-l-4 border-transparent hover:border-blue-500">
                                                    {subject.subject_name}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {subject.kkm}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                                    <span className={`text-sm font-semibold ${getScoreColor(subject.sem1_score, subject.kkm)}`}>
                                                        {formatScore(subject.sem1_score)}
                                                    </span>
                                                </td>
                                                {weightComponents.map((comp, cIdx) => (
                                                    <td key={cIdx} className="px-2 py-3 whitespace-nowrap text-center">
                                                        {subject.components[comp]?.is_predicted ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[10px] font-bold text-blue-500 uppercase leading-none mb-0.5">TARGET</span>
                                                                <span className="text-sm font-bold text-blue-600">{formatScore(subject.components[comp]?.value)}</span>
                                                            </div>
                                                        ) : subject.components[comp]?.value !== null && subject.components[comp]?.value !== undefined ? (
                                                            <span className={`text-sm font-semibold ${getScoreColor(subject.components[comp]?.value, subject.kkm)}`}>
                                                                {formatScore(subject.components[comp]?.value)}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[10px] font-bold text-blue-500 uppercase leading-none mb-0.5">BELUM</span>
                                                                <span className="text-sm font-bold text-blue-600">0</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                                {isSem2 && (
                                                    <td className="px-3 py-3 whitespace-nowrap text-center bg-orange-50/30">
                                                        <span className="text-sm font-bold text-orange-700">
                                                            {formatScore(subject.target_sem2_final)}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 text-center border-l border-gray-100">
                                                    <Badge variant="outline" className={`whitespace-nowrap ${getStatusColor(subject.status)}`}>
                                                        {getStatusIcon(subject.status)}
                                                        {subject.status}
                                                    </Badge>
                                                    {subject.status !== 'Aman' && (
                                                        <div className="text-[10px] text-gray-400 mt-1">
                                                            Sisa butuh: <span className="font-bold text-gray-600">{subject.target_remaining}</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {safetyTargets.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-200">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data mata pelajaran</h3>
                            <p className="mt-1 text-sm text-gray-500">Mata pelajaran belum disetting untuk kelas ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
