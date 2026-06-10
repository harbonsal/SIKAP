import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Activity, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Index({ records, student, error }) {
    if (error) {
        return (
            <MainLayout>
                <div className="py-12 text-center text-red-500">{error}</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title="Riwayat Kesehatan Saya" />
            <div className="py-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Riwayat Kesehatan</h1>
                        <p className="text-gray-500">Catatan sakit dan keluhan selama di pesantren.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {records.length > 0 ? (
                        records.map((record) => (
                            <Card key={record.id} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Calendar className="h-4 w-4" />
                                                <span>{format(new Date(record.date), 'EEEE, dd MMMM yyyy', { locale: id })}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {record.complaints.map(c => (
                                                    <Badge key={c.id} variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                                                        {c.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-gray-700 mt-2">
                                                <span className="font-semibold">Terapi:</span> {record.therapy || '-'}
                                            </p>
                                            {record.description && (
                                                <p className="text-sm text-gray-500 italic mt-1">
                                                    "{record.description}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={
                                                record.status === 'Sakit' ? 'bg-red-600' :
                                                    record.status === 'Sembuh' ? 'bg-green-600' :
                                                        record.status === 'Istirahat' ? 'bg-amber-600' : 'bg-gray-600'
                                            }>
                                                {record.status}
                                            </Badge>
                                            <span className="text-xs text-gray-400">
                                                Oleh: {record.creator?.name || 'Admin'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Alhamdulillah, belum ada riwayat sakit tercatat.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
