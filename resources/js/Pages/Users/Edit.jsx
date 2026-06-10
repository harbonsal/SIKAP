import MainLayout from '@/Layouts/MainLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import Select from 'react-select';
import { Card, CardContent } from "@/Components/ui/card";

export default function Edit({ user, userLevels, has_student_profile, filters }) {
    // Force rebuild: Status field added
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        nomor_induk: user.nomor_induk || '',
        nama_arab: user.nama_arab || '',
        no_hp: user.no_hp || '',
        user_level_id: user.user_level_id || '',
        status: user.status || 'Aktif',
        inactive_date: user.inactive_date || '',
        inactive_reason: user.inactive_reason || '',
        inactive_note: user.inactive_note || '',
        additional_levels: user.additional_levels ? user.additional_levels.map(l => l.id) : [],
    });

    const levelOptions = userLevels.map(level => ({ value: level.id, label: level.name }));

    const submit = (e) => {
        e.preventDefault();
        // Pass filters (query params) back to the update route so the controller can use them for redirect
        put(route('users.update', { user: user.id, ...filters }));
    };

    return (
        <MainLayout>
            <Head title="Edit User" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('users.index', filters)}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-10 w-10 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Edit User</h2>

                        {!has_student_profile && (() => {
                            const userLevel = userLevels.find(l => l.id === user.user_level_id);
                            return userLevel?.category === 'Santri';
                        })() && (
                                <Link
                                    href={route('students.create', { user_id: user.id })}
                                    className="ml-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                                >
                                    Lengkapi Biodata Siswa
                                </Link>
                            )}
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
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none" htmlFor="nama_arab">Nama Arab</label>
                                        <input
                                            id="nama_arab"
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-arabic text-right ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={data.nama_arab}
                                            onChange={(e) => setData('nama_arab', e.target.value)}
                                            dir="rtl"
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

                            <div className="md:col-span-2 lg:col-span-1 space-y-6">
                                {/* Account Information Section */}
                                <Card className="rounded-xl shadow-sm border h-fit">
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
                                                <label className="text-sm font-medium leading-none" htmlFor="password">Password (Opsional)</label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Isi jika ingin ubah"
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
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Status Section */}
                                <Card className="rounded-xl shadow-sm border h-fit">
                                    <div className="p-6 pb-4 border-b">
                                        <h3 className="text-lg font-semibold leading-none tracking-tight">Status Pengguna</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Status keaktifan user dalam sistem.</p>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none" htmlFor="status">Status</label>
                                            <select
                                                id="status"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={data.status}
                                                onChange={(e) => {
                                                    setData('status', e.target.value);
                                                    if (e.target.value === 'Tidak Aktif' && !data.inactive_date) {
                                                        setData(data => ({ ...data, status: 'Tidak Aktif', inactive_date: new Date().toISOString().split('T')[0] }));
                                                    }
                                                }}
                                            >
                                                <option value="Aktif">Aktif</option>
                                                <option value="Tidak Aktif">Tidak Aktif</option>
                                            </select>
                                        </div>

                                        {data.status === 'Tidak Aktif' && (
                                            <div className="space-y-4 pt-2 border-t mt-2">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none" htmlFor="inactive_date">Tanggal Non-Aktif</label>
                                                    <input
                                                        id="inactive_date"
                                                        type="date"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={data.inactive_date}
                                                        onChange={(e) => setData('inactive_date', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none" htmlFor="inactive_reason">Alasan</label>
                                                    <select
                                                        id="inactive_reason"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={data.inactive_reason}
                                                        onChange={(e) => setData('inactive_reason', e.target.value)}
                                                    >
                                                        <option value="">Pilih Alasan...</option>
                                                        {(() => {
                                                            const selectedLevel = userLevels.find(l => l.id == data.user_level_id);
                                                            const isSantri = ['Santri', 'Santri Khusus', 'Santri Dengan Catatan'].includes(selectedLevel?.name);
                                                            if (isSantri) {
                                                                return (
                                                                    <>
                                                                        <option value="Lulus">Lulus</option>
                                                                        <option value="Dikembalikan">Dikembalikan</option>
                                                                        <option value="Pindah">Pindah</option>
                                                                        <option value="Melanjutkan di Tempat Lain">Melanjutkan di Tempat Lain</option>
                                                                        <option value="Lainnya">Lainnya</option>
                                                                    </>
                                                                );
                                                            } else {
                                                                return (
                                                                    <>
                                                                        <option value="Pindah">Pindah</option>
                                                                        <option value="Lanjut Study">Lanjut Study</option>
                                                                        <option value="Pensiun">Pensiun</option>
                                                                        <option value="Meninggal">Meninggal</option>
                                                                        <option value="Lainnya">Lainnya</option>
                                                                    </>
                                                                );
                                                            }
                                                        })()}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none" htmlFor="inactive_note">Keterangan {data.inactive_reason === 'Lainnya' && <span className="text-destructive">*</span>}</label>
                                                    <textarea
                                                        id="inactive_note"
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        placeholder="Tambahkan keterangan..."
                                                        value={data.inactive_note}
                                                        onChange={(e) => setData('inactive_note', e.target.value)}
                                                        required={data.inactive_reason === 'Lainnya'}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Link
                                href={route('users.index', filters)}
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
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
