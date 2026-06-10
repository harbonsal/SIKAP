import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Checkbox from '@/Components/Checkbox';

export default function Edit({ academicYear }) {
    const { data, setData, put, processing, errors } = useForm({
        name: academicYear.name,
        is_active: Boolean(academicYear.is_active),
        status: academicYear.status || 'draft',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('academic-years.update', academicYear.id));
    };

    return (
        <MainLayout>
            <Head title="Edit Tahun Pelajaran" />

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Edit Tahun Pelajaran</h2>
                    <Link
                        href={route('academic-years.index')}
                        className="text-sm text-muted-foreground hover:text-primary"
                    >
                        Kembali
                    </Link>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <InputLabel htmlFor="name" value="Tahun Pelajaran (Format: YYYY/YYYY)" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: 2024/2025"
                                className="w-full"
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                Set sebagai Tahun Pelajaran Aktif
                            </label>
                        </div>

                        <div className="space-y-2">
                            <InputLabel htmlFor="status" value="Status Tahun Pelajaran" />
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="draft">Draft (Persiapan)</option>
                                <option value="active">Siap (Aktif)</option>
                                <option value="archived">Arsip</option>
                            </select>
                            {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
