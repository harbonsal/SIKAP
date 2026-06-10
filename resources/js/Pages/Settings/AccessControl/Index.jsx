import MainLayout from '@/Layouts/MainLayout';
import { Head, Link } from '@inertiajs/react';
import { Settings } from 'lucide-react';

export default function Index({ userLevels }) {
    return (
        <MainLayout>
            <Head title="Hak Akses" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Hak Akses</h2>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-medium w-16 text-center">No</th>
                                    <th className="px-6 py-3 font-medium">Nama Level</th>
                                    <th className="px-6 py-3 font-medium text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {userLevels.map((level, index) => (
                                    <tr key={level.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium">{level.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Link
                                                href={route('settings.access-control.edit', level.id)}
                                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            >
                                                Atur Hak Akses
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
