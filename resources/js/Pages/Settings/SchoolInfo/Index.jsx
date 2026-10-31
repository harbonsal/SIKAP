import MasterSekolahLayout from '@/Layouts/MasterSekolahLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Save, Calendar, FileImage, AlertCircle, Upload, RotateCcw, Info, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Edit({ auth, schoolInfo, appLogo, loginBackground }) {
    const { flash } = usePage().props;
    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        name: schoolInfo.name || '',
        address: schoolInfo.address || '',
        city: schoolInfo.city || '',
        app_logo: null,
        login_background: null,
        remove_login_background: false,
        sem1_weight: schoolInfo.grade_config?.sem1_weight ?? 1,
        sem2_weight: schoolInfo.grade_config?.sem2_weight ?? 2,
        _method: 'POST',
    });

    // Watch for success flash from backend
    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                title: 'Berhasil!',
                text: flash.success,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }, [flash?.success]);

    const [previews, setPreviews] = useState({
        app_logo: appLogo ? `/storage/${appLogo}` : null,
        login_background: loginBackground ? `/storage/${loginBackground}` : null,
    });

    const handleFileChange = (e, key) => {
        const file = e.target.files[0];
        if (file) {
            setData(prev => ({
                ...prev,
                [key]: file,
                ...(key === 'login_background' ? { remove_login_background: false } : {})
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [key]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetBackground = () => {
        setData(prev => ({
            ...prev,
            login_background: null,
            remove_login_background: true
        }));
        setPreviews(prev => ({
            ...prev,
            login_background: null
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.school-info.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <MasterSekolahLayout breadcrumbItems={[{ title: 'Pengaturan Sekolah', href: route('settings.school-info.index') }]}>
            <Head title="Pengaturan Sekolah" />

            <div className="space-y-6">
                    <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">

                        {/* Section 1: Identitas Sekolah */}
                        <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                            <section className="max-w-xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">Identitas Sekolah</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Data utama sekolah yang akan digunakan pada kop surat.
                                    </p>
                                </header>

                                <div className="mt-6 space-y-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Nama Sekolah" />
                                        <TextInput
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            isFocused
                                            autoComplete="name"
                                        />
                                        <InputError className="mt-2" message={errors.name} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="address" value="Alamat Sekolah" />
                                        <TextInput
                                            id="address"
                                            className="mt-1 block w-full"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            autoComplete="address"
                                        />
                                        <InputError className="mt-2" message={errors.address} />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="city" value="Kota/Kabupaten" />
                                        <TextInput
                                            id="city"
                                            className="mt-1 block w-full"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Contoh: Jakarta"
                                        />
                                        <InputError className="mt-2" message={errors.city} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Section 1.5: Branding & Background */}
                        <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                            <section className="max-w-3xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">Branding Aplikasi (White-Label)</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Sesuaikan identitas visual aplikasi berupa logo utama dan latar belakang (background) layar login pesantren.
                                    </p>
                                </header>

                                <div className="mt-6 space-y-8">
                                    {/* 1. Upload Logo Utama */}
                                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <InputLabel value="Logo Utama SIKAP" className="font-semibold text-gray-800" />
                                        <p className="text-xs text-gray-500 mt-0.5 mb-3">
                                            Logo yang tampil pada kartu login, navigasi atas, dan dokumen resmi.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="h-20 w-24 p-2 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-xs">
                                                {previews.app_logo ? (
                                                    <img src={previews.app_logo} alt="App Logo Preview" className="h-full w-auto object-contain" />
                                                ) : (
                                                    <span className="text-xs text-gray-400 text-center">Belum ada logo</span>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="app_logo"
                                                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                                                >
                                                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                                                    Pilih File Logo
                                                    <input
                                                        type="file"
                                                        id="app_logo"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'app_logo')}
                                                        accept="image/png,image/jpeg,image/jpg"
                                                    />
                                                </label>
                                                <p className="text-[11px] text-gray-500">
                                                    Format: <strong>PNG / JPG / JPEG</strong> (Transparan disarankan). Maksimal <strong>2 MB</strong>.
                                                </p>
                                            </div>
                                        </div>
                                        <InputError className="mt-2" message={errors.app_logo} />
                                    </div>

                                    {/* 2. Upload Background Kotak Login */}
                                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                            <div>
                                                <InputLabel value="Background Kotak Login (Kartu Formulir)" className="font-semibold text-gray-800 text-base" />
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Foto latar khusus yang tampil di dalam kotak kartu login (menggantikan area putih polos).
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                previews.login_background 
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {previews.login_background ? '🟢 Background Kotak Aktif' : '⚪ Putih Standar (Default)'}
                                            </span>
                                        </div>

                                        {/* Preview Area (Vertical Card Preview) */}
                                        <div className="mt-3 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                            <div className="relative w-48 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-white flex-shrink-0 group">
                                                {/* Top Wave Preview */}
                                                <div className="h-4 w-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-500 to-blue-500"></div>

                                                {/* Card Background / Frosted Mockup */}
                                                {previews.login_background ? (
                                                    <div 
                                                        className="absolute inset-0 bg-cover bg-center"
                                                        style={{ backgroundImage: `url(${previews.login_background})` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px]"></div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-3 text-center">
                                                        <span className="text-xs text-gray-400 font-medium">Kotak Putih Standar</span>
                                                    </div>
                                                )}

                                                {/* Mini Mockup Elements on Card */}
                                                <div className="relative z-10 p-3 flex flex-col items-center h-full justify-between pointer-events-none">
                                                    <div className="flex flex-col items-center mt-1">
                                                        <div className="w-9 h-9 rounded-lg bg-white/90 shadow-xs border border-gray-200 flex items-center justify-center p-1 mb-1">
                                                            {previews.app_logo ? (
                                                                <img src={previews.app_logo} alt="Logo" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-[8px] text-gray-400">Logo</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-800">SIKAP</span>
                                                        <span className="text-[8px] text-gray-500">Masuk ke Akun</span>
                                                    </div>

                                                    <div className="w-full space-y-1.5 my-auto">
                                                        <div className="h-4 w-full rounded bg-white/90 border border-gray-200 shadow-xs"></div>
                                                        <div className="h-4 w-full rounded bg-white/90 border border-gray-200 shadow-xs"></div>
                                                        <div className="h-4 w-full rounded bg-emerald-600 shadow-xs"></div>
                                                    </div>

                                                    <span className="text-[8px] font-mono text-gray-400 mb-1">Pratinjau Kotak</span>
                                                </div>
                                            </div>

                                            {/* Action & Description */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <label
                                                        htmlFor="login_background"
                                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer active:scale-95 transition-all"
                                                    >
                                                        <Upload className="w-3.5 h-3.5 text-white" />
                                                        Pilih Gambar Kotak Login
                                                        <input
                                                            type="file"
                                                            id="login_background"
                                                            className="sr-only"
                                                            onChange={(e) => handleFileChange(e, 'login_background')}
                                                            accept="image/jpeg,image/png,image/webp"
                                                        />
                                                    </label>

                                                    {(previews.login_background || data.login_background) && (
                                                        <button
                                                            type="button"
                                                            onClick={handleResetBackground}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs ring-1 ring-inset ring-rose-200 hover:bg-rose-50 active:scale-95 transition-all"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                                            Hapus Background (Kembali Putih)
                                                        </button>
                                                    )}
                                                </div>
                                                <InputError className="mt-2" message={errors.login_background} />

                                                {/* Keterangan Spesifikasi Ukuran Khusus Kotak Login */}
                                                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs space-y-2">
                                                    <div className="flex items-center gap-2 font-bold text-amber-900">
                                                        <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                                                        <span>Spesifikasi Ukuran untuk Kotak Login:</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900/90 pl-6">
                                                        <div>
                                                            <span className="font-semibold text-amber-950">📐 Bentuk/Rasio:</span> <strong>3:4</strong> atau <strong>4:5</strong> (Potret / Vertikal Tegak)
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-amber-950">📏 Resolusi Ideal:</span> <strong>600 × 800 px</strong> s/d <strong>800 × 1000 px</strong>
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-amber-950">📁 Format File:</span> JPG, JPEG, PNG, atau WebP
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-amber-950">⚖️ Ukuran File:</span> Maks. 2 MB (Disarankan 300 - 500 KB)
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-amber-800/90 pl-6 leading-relaxed border-t border-amber-200/60 pt-2">
                                                        ✨ <strong>Keamanan Visual:</strong> Gambar otomatis diberi lapisan kaca transparan (*frosted glass shield*) sehingga input email, password, dan tombol masuk tetap terbaca 100% tajam dan mudah diisi santri/wali.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>



                        {/* Section: Pengaturan Bobot Nilai Rapor */}
                        <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                            <section className="max-w-xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">Pengaturan Bobot Nilai Rapor Akhir</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Atur bobot kontribusi nilai per semester untuk penentuan nilai rapor akhir tahun (kenaikan kelas/kelulusan).
                                    </p>
                                </header>

                                <div className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="sem1_weight" value="Bobot Semester Ganjil" />
                                            <TextInput
                                                id="sem1_weight"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.sem1_weight}
                                                onChange={(e) => setData('sem1_weight', parseInt(e.target.value) || 0)}
                                            />
                                            <InputError className="mt-2" message={errors.sem1_weight} />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="sem2_weight" value="Bobot Semester Genap" />
                                            <TextInput
                                                id="sem2_weight"
                                                type="number"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.sem2_weight}
                                                onChange={(e) => setData('sem2_weight', parseInt(e.target.value) || 0)}
                                            />
                                            <InputError className="mt-2" message={errors.sem2_weight} />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                                        <p className="text-sm font-medium text-gray-700">Simulasi Rumus Aktif:</p>
                                        <code className="text-indigo-600 font-mono mt-1 block">
                                            ((Nilai Ganjil x {data.sem1_weight}) + (Nilai Genap x {data.sem2_weight})) / {(parseInt(data.sem1_weight) || 0) + (parseInt(data.sem2_weight) || 0)}
                                        </code>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Simpan Semua Pengaturan</PrimaryButton>
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-gray-600">Berhasil disimpan.</p>
                            </Transition>
                        </div>

                    </form>
            </div>
        </MasterSekolahLayout>
    );
}
