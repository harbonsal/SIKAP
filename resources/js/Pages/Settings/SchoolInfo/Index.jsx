import MasterSekolahLayout from '@/Layouts/MasterSekolahLayout';
import { Head, useForm, usePage } from '@inertiajs/react'; // Add usePage
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Save, Calendar, FileImage, AlertCircle } from 'lucide-react';
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
            setData(key, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [key]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
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

                        {/* Section 1.5: Branding & Tema */}
                        <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                            <section className="max-w-xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">Branding Aplikasi (White-Label)</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Atur logo aplikasi dan latar belakang (background) pada halaman login.
                                    </p>
                                </header>

                                <div className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Logo Utama SIKAP" />
                                            <div className="mt-2 flex items-center gap-x-3">
                                                {previews.app_logo ? (
                                                    <img src={previews.app_logo} alt="App Logo Preview" className="h-20 w-auto object-contain border rounded-md bg-gray-50" />
                                                ) : (
                                                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs px-1 text-center">
                                                        Belum ada logo
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="app_logo"
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    Upload Logo
                                                    <input
                                                        type="file"
                                                        id="app_logo"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'app_logo')}
                                                        accept="image/png"
                                                    />
                                                </label>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Dapat menggunakan format <strong>PNG/JPG/JPEG</strong>.<br/>
                                                Maks ukuran file <strong>2MB</strong>.
                                            </p>
                                            <InputError className="mt-2" message={errors.app_logo} />
                                        </div>

                                        <div>
                                            <InputLabel value="Background Login" />
                                            <div className="mt-2 flex flex-col gap-y-3">
                                                {previews.login_background ? (
                                                    <img src={previews.login_background} alt="Login Bg Preview" className="h-20 w-full object-cover border rounded-md bg-gray-50" />
                                                ) : (
                                                    <div className="h-20 w-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs px-1 text-center">
                                                        Belum ada background
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="login_background"
                                                    className="inline-flex items-center justify-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer self-start"
                                                >
                                                    Upload Background
                                                    <input
                                                        type="file"
                                                        id="login_background"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'login_background')}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500">
                                                Maks ukuran file <strong>2MB</strong> (Sesuai batas server).
                                            </p>
                                            <InputError className="mt-2" message={errors.login_background} />
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
