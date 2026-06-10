import React, { useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

export default function Show({ auth, rpp }) {
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `RPP_${rpp.active_subject?.mapel?.name}_${rpp.topic}`.replace(/[\/\\?%*:|"<>]/g, '-'),
    });

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Detail RPP Generator AI</h2>
                    <Button onClick={handlePrint} className="flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Cetak RPP
                    </Button>
                </div>
            }
        >
            <Head title={`RPP - ${rpp.topic}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Link
                                    href={route('rpp-generator.index')}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </Link>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Konteks Pembuatan</h3>
                                </div>
                            </div>

                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <dt className="text-gray-500 font-medium">Mata Pelajaran</dt>
                                    <dd className="mt-1 text-gray-900">{rpp.active_subject?.mapel?.name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Kelas / Jenjang</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {rpp.active_subject?.active_class?.name || '-'}
                                        ({rpp.active_subject?.active_class?.kelas?.jenjang?.name || '-'})
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Topik / Materi</dt>
                                    <dd className="mt-1 text-gray-900">{rpp.topic}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Metode Pembelajaran</dt>
                                    <dd className="mt-1 text-gray-900">{rpp.teaching_method?.name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Durasi</dt>
                                    <dd className="mt-1 text-gray-900">{rpp.duration_minutes} Menit</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500 font-medium">Dibuat Oleh</dt>
                                    <dd className="mt-1 text-gray-900">{rpp.user?.name || '-'} ({new Date(rpp.created_at).toLocaleDateString()})</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow-lg sm:rounded-lg">
                        <div className="p-8 sm:p-12 text-gray-800 printable-rpp prose max-w-none" ref={componentRef}>
                            <style type="text/css" media="print">
                                {`
                                    @page { size: A4 portrait; margin: 20mm; }
                                    body { font-family: 'Times New Roman', Times, serif; }
                                    .printable-rpp h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
                                    .printable-rpp h2 { font-size: 14pt; margin-top: 15px; margin-bottom: 5px; }
                                    .printable-rpp h3 { font-size: 12pt; margin-top: 10px; margin-bottom: 5px; font-weight: bold; }
                                    .printable-rpp p, .printable-rpp li, .printable-rpp td { font-size: 12pt; line-height: 1.5; }
                                    .printable-rpp table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
                                    .printable-rpp table, .printable-rpp th, .printable-rpp td { border: 1px solid black; }
                                    .printable-rpp th, .printable-rpp td { padding: 8px; text-align: left; }
                                `}
                            </style>

                            <div dangerouslySetInnerHTML={{ __html: rpp.ai_result_html }} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
