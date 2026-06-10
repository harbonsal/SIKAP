import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Plus, FileText, Eye, Trash2 } from 'lucide-react';

export default function Index({ auth, rpps }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus RPP ini?')) {
            destroy(route('supervision-rpps.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Persiapan Mengajar (RPP)</h2>}
        >
            <Head title="Daftar RPP" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium text-gray-900">Daftar RPP Anda</h3>
                            <p className="text-sm text-gray-500">
                                Buat dan kelola RPP untuk keperluan supervisi.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={route('supervision-rpps.create')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Buat RPP Baru
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Materi Pokok</TableHead>
                                        <TableHead>Mata Pelajaran</TableHead>
                                        <TableHead>Kelas</TableHead>
                                        <TableHead>Semester</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rpps.length > 0 ? (
                                        rpps.map((rpp) => (
                                            <TableRow key={rpp.id}>
                                                <TableCell className="font-medium">
                                                    <div>{rpp.topic}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{rpp.sub_topic}</div>
                                                </TableCell>
                                                <TableCell>{rpp.active_subject?.mapel?.name || '-'}</TableCell>
                                                <TableCell>
                                                    {rpp.active_subject?.active_class?.kelas?.name || '-'}
                                                </TableCell>
                                                <TableCell>{rpp.semester?.name} / {rpp.academic_year?.name}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rpp.status === 'Final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {rpp.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={route('supervision-rpps.show', rpp.id)}>
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(rpp.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Belum ada RPP yang dibuat.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
