import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { BookOpen, AlertCircle, CheckSquare } from 'lucide-react';


export default function Index({ auth, student, className, semesterName, memorizationCount, memorizationSummary, tahfidzGrades, error }) {

    // Debug: Log nilai yang diterima
    console.log('Tahfidz Grades Debug:', tahfidzGrades?.map(g => ({
        id: g.id,
        score: g.score,
        original_score: g.original_score,
        display_value: g.original_score ?? g.score
    })));

    const scrollToSummary = () => {
        const element = document.getElementById('tahfidz-summary');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (error) {
        return (
            <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Tahfidz</h2>}>
                <Head title="Nilai Tahfidz" />
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Portal Nilai & Riwayat Tahfidz</h2>}
        >
            <Head title="Nilai Tahfidz" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Header Info */}
                    <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-0 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{student?.name}</h3>
                                    <p className="text-emerald-100 opacity-90 text-sm mt-1 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {className} | {semesterName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div 
                                        className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 cursor-pointer hover:bg-white/30 transition-colors"
                                        onClick={scrollToSummary}
                                        title="Klik untuk lihat rincian"
                                    >
                                        <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">Total Hafalan</p>
                                        <p className="text-2xl font-mono font-bold align-middle">{memorizationCount} <span className="text-sm font-normal">Juz (Est.)</span></p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 1: Nilai Ujian Tahfidz */}
                    <Card className="shadow-lg border-t-4 border-t-blue-600">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2 border-b">
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                    Nilai Ujian Tahfidz
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Rincian nilai Ujian Harian, UTS, dan UAS/UKK.
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mata Pelajaran</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Semester</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Jenis Ujian</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Nilai Akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tahfidzGrades?.length > 0 ? (
                                            tahfidzGrades.map((grade, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {grade.active_subject?.mapel?.name || 'Tahfidz'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 italic">
                                                        {grade.semester?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {grade.grade_weight?.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-blue-600">
                                                        {grade.original_score ?? grade.score}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-6 text-gray-400 italic">
                                                    Belum ada data nilai ujian tahfidz.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Daftar Perolehan Hafalan */}
                    <Card className="shadow-lg border-t-4 border-t-emerald-600 scroll-mt-20" id="tahfidz-summary">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2 border-b">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                            <div>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                    Rekapitulasi Capaian per Juz
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Daftar Juz yang telah dikonfirmasi dan status skriningnya.
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Juz</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tanggal Konfirmasi</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status Skrining</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status Validasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {memorizationSummary?.length > 0 ? (
                                            memorizationSummary.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-bold">
                                                        Juz {item.juz}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 italic">
                                                        {item.confirmed_at}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.has_screening ? (
                                                            <a 
                                                                href={route('tahfidz.pantau-skrining', { juz_number: item.juz, role_category: 'Santri' })}
                                                                className="inline-flex items-center"
                                                            >
                                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 cursor-pointer">
                                                                    Sudah Skrining
                                                                </Badge>
                                                            </a>
                                                        ) : (
                                                            <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-200">
                                                                Belum Skrining
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge className={
                                                            item.is_completed ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-amber-100 text-amber-700 border-amber-200'
                                                        }>
                                                            {item.is_completed ? 'Valid / Selesai' : 'Proses'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-6 text-gray-400 italic">
                                                    Belum ada data rekapan juz.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
