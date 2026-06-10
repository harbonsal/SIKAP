import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
        report_date: schoolInfo.report_date || '',
        report_place_ar: schoolInfo.report_place_ar || '',
        stamp_image: null,
        headmaster_signature: null,
        app_logo: null,
        login_background: null,
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
        stamp_image: schoolInfo.stamp_image ? `/storage/${schoolInfo.stamp_image}` : null,
        headmaster_signature: schoolInfo.headmaster_signature ? `/storage/${schoolInfo.headmaster_signature}` : null,
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
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Identitas Sekolah & Atribut Rapor</h2>}
        >
            <Head title="Pengaturan Sekolah" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
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
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
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
                                            <InputError className="mt-2" message={errors.login_background} />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Section 2: Atribut Rapor */}
                        <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                            <section className="max-w-xl">
                                <header>
                                    <h2 className="text-lg font-medium text-gray-900">Atribut Rapor</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Pengaturan titimangsa, nama tempat (Arab), dan atribut visual (Kop/Stempel).
                                    </p>
                                </header>

                                <div className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="report_date" value="Tanggal Rapor" />
                                            <input
                                                type="date"
                                                id="report_date"
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.report_date}
                                                onChange={(e) => setData('report_date', e.target.value)}
                                            />
                                            <InputError className="mt-2" message={errors.report_date} />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="report_place_ar" value="Tempat (Arab)" />
                                            <TextInput
                                                id="report_place_ar"
                                                className="mt-1 block w-full font-arabic text-right"
                                                value={data.report_place_ar}
                                                onChange={(e) => setData('report_place_ar', e.target.value)}
                                                dir="rtl"
                                                placeholder="Contoh: ماجيلانج"
                                            />
                                            <InputError className="mt-2" message={errors.report_place_ar} />
                                        </div>
                                    </div>

                                    {/* Stamp Image */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Stempel Sekolah" />
                                            <div className="mt-2 flex items-center gap-x-3">
                                                {previews.stamp_image ? (
                                                    <img src={previews.stamp_image} alt="Stamp Preview" className="h-20 w-20 object-contain border rounded-md bg-gray-50" />
                                                ) : (
                                                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                                        No Stamp
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="stamp_image"
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    Upload Stempel
                                                    <input
                                                        type="file"
                                                        id="stamp_image"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'stamp_image')}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                            <InputError className="mt-2" message={errors.stamp_image} />
                                        </div>

                                        <div>
                                            <InputLabel value="Tanda Tangan Kepala Sekolah" />
                                            <div className="mt-2 flex items-center gap-x-3">
                                                {previews.headmaster_signature ? (
                                                    <img src={previews.headmaster_signature} alt="Signature Preview" className="h-20 w-20 object-contain border rounded-md bg-gray-50" />
                                                ) : (
                                                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs text-center px-1">
                                                        No Signature
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="headmaster_signature"
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    Upload TTD
                                                    <input
                                                        type="file"
                                                        id="headmaster_signature"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'headmaster_signature')}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                            <InputError className="mt-2" message={errors.headmaster_signature} />
                                        </div>
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
            </div>
        </AuthenticatedLayout>
    );
}
