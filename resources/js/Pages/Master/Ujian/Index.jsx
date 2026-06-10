import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function Index({ ujians, gradeWeights, examSemesters }) {
    const { delete: destroy } = useForm();

    const calculateTotal = (targetSemester) => {
        return Object.entries(gradeWeights || {}).reduce((sum, [name, weight]) => {
            const semester = examSemesters[name];
            // If semester matches OR exam is applicable to 'all' (both semesters)
            if (semester === targetSemester || semester === 'all' || !semester) {
                return sum + parseInt(weight || 0);
            }
            return sum;
        }, 0);
    };

    const totalGanjil = calculateTotal('ganjil');
    const totalGenap = calculateTotal('genap');

    const handleWeightChange = (ujian, newWeight) => {
        router.put(route('ujians.update-weight', ujian.id), {
            weight: newWeight
        }, {
            preserveScroll: true,
            preserveState: true,
            onError: (errors) => {
                console.error(errors);
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus jenis ujian ini?')) {
            destroy(route('ujians.destroy', id));
        }
    };

    return (
        <MainLayout>
            <Head title="Jenis Ujian" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Jenis Ujian</h2>
                        <p className="text-muted-foreground">Atur jenis ujian, semester, dan bobot penilaian.</p>
                    </div>
                    <Link
                        href={route('ujians.create')}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Ujian
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Alert Semester Ganjil */}
                    <div className={`p-4 rounded-lg border ${totalGanjil === 100 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                        <div className="flex items-center gap-2 font-semibold">
                            {totalGanjil === 100 ? '✅' : '⚠️'} Semester Ganjil
                        </div>
                        <div className="text-sm mt-1">
                            Total bobot: <strong>{totalGanjil}%</strong>.
                            {totalGanjil !== 100 && (totalGanjil < 100 ? ' (Kurang)' : ' (Berlebih)')}
                        </div>
                    </div>

                    {/* Alert Semester Genap */}
                    <div className={`p-4 rounded-lg border ${totalGenap === 100 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                        <div className="flex items-center gap-2 font-semibold">
                            {totalGenap === 100 ? '✅' : '⚠️'} Semester Genap
                        </div>
                        <div className="text-sm mt-1">
                            Total bobot: <strong>{totalGenap}%</strong>.
                            {totalGenap !== 100 && (totalGenap < 100 ? ' (Kurang)' : ' (Berlebih)')}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Nama Ujian</th>
                                    <th className="px-6 py-3 font-medium">Semester</th>
                                    <th className="px-6 py-3 font-medium w-40 text-center">Bobot (%)</th>
                                    <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {ujians.data.length > 0 ? (
                                    ujians.data.map((ujian, index) => (
                                        <tr key={ujian.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                {(ujians.current_page - 1) * ujians.per_page + index + 1}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{ujian.name}</td>
                                            <td className="px-6 py-4 capitalize">
                                                {ujian.semester === 'all' ? 'Semua Semester' : ujian.semester}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="flex h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-center"
                                                        defaultValue={gradeWeights[ujian.name] || 0}
                                                        min="0"
                                                        max="100"
                                                        onBlur={(e) => handleWeightChange(ujian, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.target.blur();
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-muted-foreground">%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={route('ujians.edit', ujian.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(ujian.id)}
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
                                        <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada data jenis ujian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination links={ujians.links} />
            </div>
        </MainLayout>
    );
}
