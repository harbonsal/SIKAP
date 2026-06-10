import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import Select from 'react-select';
import { Card, CardContent } from '@/Components/ui/card';

export default function Create({ userLevels }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        nomor_induk: '',
        nama_arab: '',
        no_hp: '',
        user_level_id: '',
        additional_levels: [],
    });

    const levelOptions = userLevels.map(level => ({ value: level.id, label: level.name }));

    const submit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <MainLayout>
            <Head title="Tambah User" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('users.index')}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Tambah User</h2>
                    </div>
                </div>

                <div className="grid gap-6">
                    <form onSubmit={submit}>
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Personal Information Section */}
                            <Card className="md:col-span-2 lg:col-span-1 rounded-xl shadow-sm border h-fit">
                                <div className="p-6 pb-4 border-b">
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">Informasi Pribadi</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Data identitas dan kontak pengguna.</p>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="name">Nama Lengkap <span className="text-destructive">*</span></label>
                                        <input
                                            id="name"
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Contoh: Ahmad Fulan"
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="nama_arab">Nama Arab</label>
                                        <input
                                            id="nama_arab"
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-arabic text-right ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.nama_arab}
                                            onChange={(e) => setData('nama_arab', e.target.value)}
                                            dir="rtl"
                                            placeholder="أحمد فلان"
                                        />
                                        {errors.nama_arab && <p className="text-sm text-destructive">{errors.nama_arab}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none" htmlFor="nomor_induk">Nomor Induk / NIP <span className="text-destructive">*</span></label>
                                            <input
                                                id="nomor_induk"
                                                type="number"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.nomor_induk}
                                                onChange={(e) => setData('nomor_induk', e.target.value)}
                                                required
                                            />
                                            {errors.nomor_induk && <p className="text-sm text-destructive">{errors.nomor_induk}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none" htmlFor="no_hp">No HP (WhatsApp)</label>
                                            <input
                                                id="no_hp"
                                                type="text"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.no_hp}
                                                onChange={(e) => setData('no_hp', e.target.value)}
                                                placeholder="628..."
                                            />
                                            {errors.no_hp && <p className="text-sm text-destructive">{errors.no_hp}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Information Section */}
                            <Card className="md:col-span-2 lg:col-span-1 rounded-xl shadow-sm border h-fit">
                                <div className="p-6 pb-4 border-b">
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">Akun & Akses</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Pengaturan login dan hak akses.</p>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="email">Email <span className="text-destructive">*</span></label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="user_level_id">Level Utama <span className="text-destructive">*</span></label>
                                        <select
                                            id="user_level_id"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.user_level_id}
                                            onChange={(e) => setData('user_level_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Pilih Level...</option>
                                            {userLevels.map((level) => (
                                                <option key={level.id} value={level.id}>{level.name}</option>
                                            ))}
                                        </select>
                                        {errors.user_level_id && <p className="text-sm text-destructive">{errors.user_level_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Level Tambahan (Opsional)</label>
                                        <Select
                                            isMulti
                                            options={levelOptions.filter(opt => opt.value != data.user_level_id)}
                                            className="text-sm"
                                            placeholder="Pilih jabatan tambahan..."
                                            onChange={(selected) => setData('additional_levels', selected ? selected.map(s => s.value) : [])}
                                            value={levelOptions.filter(opt => data.additional_levels.includes(opt.value))}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    borderColor: 'hsl(var(--input))',
                                                    borderRadius: 'calc(var(--radius) - 2px)',
                                                    minHeight: '2.5rem',
                                                }),
                                            }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none" htmlFor="password">Password <span className="text-destructive">*</span></label>
                                            <input
                                                id="password"
                                                type="password"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                            />
                                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none" htmlFor="password_confirmation">Konfirmasi</label>
                                            <input
                                                id="password_confirmation"
                                                type="password"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Link
                                href={route('users.index')}
                                className="mr-4 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
