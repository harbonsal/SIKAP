import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function Edit({ userLevel }) {
    const { data, setData, put, processing, errors } = useForm({
        name: userLevel.name,
        category: userLevel.category || 'Lainnya',
        dashboard_type: userLevel.dashboard_type || 'Default',
        widgets: userLevel.widgets || {},
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('user-levels.update', userLevel.id));
    };

    return (
        <MainLayout>
            <Head title="Edit User Level" />

            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Edit User Level</h2>
                    <Link
                        href={route('user-levels.index')}
                        className="text-sm text-muted-foreground hover:text-primary"
                    >
                        Kembali
                    </Link>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <InputLabel htmlFor="name" value="Nama Level" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Administrator, Guru, Siswa"
                                className="w-full"
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <InputLabel htmlFor="category" value="Kategori" />
                                <select
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Pilih Kategori</option>
                                    <option value="Santri">Santri</option>
                                    <option value="Ustadz">Ustadz</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                            </div>

                            <div className="space-y-2">
                                <InputLabel htmlFor="dashboard_type" value="Tipe Dashboard" />
                                <select
                                    id="dashboard_type"
                                    value={data.dashboard_type}
                                    onChange={(e) => setData('dashboard_type', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="Default">Default</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Teacher">Guru / Wali Kelas</option>
                                    <option value="Student">Siswa</option>
                                </select>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Menentukan tampilan dashboard utama untuk role ini.
                                </p>
                                {errors.dashboard_type && <p className="text-sm text-destructive">{errors.dashboard_type}</p>}
                            </div>
                        </div>

                        {/* Widget Selection */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium">Konfigurasi Widget</h3>
                            <p className="text-sm text-muted-foreground">Pilih widget yang akan ditampilkan di dashboard untuk level ini.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.dashboard_type === 'Student' && (
                                    <>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.welcome_card ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, welcome_card: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Kartu Selamat Datang</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.class_info ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, class_info: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Info Kelas Aktif</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.schedule_today ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, schedule_today: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Jadwal Hari Ini</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_grades ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_grades: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Nilai Saya</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_finance_student ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_finance_student: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Tagihan & Pembayaran</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.widget_tahfidz_monitoring ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, widget_tahfidz_monitoring: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Widget: Pantauan Tahfidz</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.widget_finance_monitoring ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, widget_finance_monitoring: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Widget: Info Keuangan</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.widget_grade_analysis ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, widget_grade_analysis: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Widget: Analisis Nilai (&lt;70)</span>
                                        </label>
                                    </>
                                )}

                                {data.dashboard_type === 'Teacher' && (
                                    <>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.welcome_card ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, welcome_card: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Kartu Selamat Datang</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.stats_cards ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, stats_cards: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Kartu Statistik (Siswa, Mapel)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.schedule_today ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, schedule_today: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Jadwal Mengajar Hari Ini</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.quick_actions ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, quick_actions: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Aksi Cepat (Container)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_journals ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_journals: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Absensi & Jurnal</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_grades ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_grades: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Input Nilai</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_profile ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_profile: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Profil Saya</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_finance ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_finance: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Info Keuangan (Gaji/Honor)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_calendar ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_calendar: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Kalender Akademik</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_tahfidz ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_tahfidz: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Penilaian Tahfidz</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_schedule ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_schedule: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Jadwal Mengajar</span>
                                        </label>
                                    </>
                                )}

                                {(data.dashboard_type === 'Admin' || data.dashboard_type === 'Default') && (
                                    <>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.welcome_card ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, welcome_card: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Kartu Selamat Datang</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.stats_cards ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, stats_cards: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Statistik Global (Total Santri, dll)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.activity_feed ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, activity_feed: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Feed Aktivitas / Pengumuman</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.quick_actions ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, quick_actions: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Aksi Cepat (Container)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_journals ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_journals: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Absensi & Jurnal</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_grades ?? false}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_grades: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Input Nilai</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_profile ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_profile: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Profil Saya</span>
                                        </label>
                                        <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={data.widgets?.shortcut_calendar ?? true}
                                                onChange={(e) => setData('widgets', { ...data.widgets, shortcut_calendar: e.target.checked })}
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span>Shortcut: Kalender Akademik</span>
                                        </label>
                                    </>
                                )}
                            </div>
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
