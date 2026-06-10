import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function Index({ kelasParalels }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kelas paralel ini?')) {
            destroy(route('kelas-paralel.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Kelas Paralel" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Kelas Paralel</h2>
                    <Link
                        href={route('kelas-paralel.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kelas Paralel
                    </Link>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Nama Kelas Paralel</th>
                                    <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {kelasParalels.data.length > 0 ? (
                                    kelasParalels.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {(kelasParalels.current_page - 1) * kelasParalels.per_page + index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{item.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={route('kelas-paralel.edit', item.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada data kelas paralel.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={kelasParalels.links} />
            </div>
        </MainLayout>
    );
}
