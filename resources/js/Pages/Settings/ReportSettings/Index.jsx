import MasterSekolahLayout from '@/Layouts/MasterSekolahLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Save, Calendar, FileImage, AlertCircle, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function Index({ auth, schoolInfo }) {
    const { flash } = usePage().props;
    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        report_date: schoolInfo.report_date || '',
        report_place_ar: schoolInfo.report_place_ar || '',
        use_system_header: schoolInfo.header_config?.use_system_header || false,
        yayasan_name: schoolInfo.header_config?.yayasan_name || '',
        institution_name: schoolInfo.header_config?.institution_name || '',
        institution_location: schoolInfo.header_config?.institution_location || '',
        kop_image: null,
        stamp_image: null,
        headmaster_signature: null,
        use_watermark: schoolInfo.header_config?.use_watermark || false,
        watermark_image: null,
        watermark_opacity: schoolInfo.header_config?.watermark_opacity ?? 20,
        watermark_scale: schoolInfo.header_config?.watermark_scale ?? 100,
        watermark_brightness: schoolInfo.header_config?.watermark_brightness ?? 100,
        headmaster_ar: schoolInfo.header_config?.headmaster_ar ?? 'مدير المدرسة',
        wali_kelas_ar: schoolInfo.header_config?.wali_kelas_ar ?? 'مشرف الصف',
        parents_ar: schoolInfo.header_config?.parents_ar ?? 'ولي الأمر',
        _method: 'POST',
    });

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
        kop_image: schoolInfo.kop_image ? `/storage/${schoolInfo.kop_image}` : null,
        stamp_image: schoolInfo.stamp_image ? `/storage/${schoolInfo.stamp_image}` : null,
        headmaster_signature: schoolInfo.headmaster_signature ? `/storage/${schoolInfo.headmaster_signature}` : null,
        watermark_image: schoolInfo.header_config?.watermark_image ? `/storage/${schoolInfo.header_config.watermark_image}` : null,
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
        post(route('settings.report.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <MasterSekolahLayout breadcrumbItems={[{ title: 'Pengaturan Cetak Rapor', href: route('settings.report.index') }]}>
            <Head title="Pengaturan Cetak Rapor" />

            <div className="space-y-6">
                <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
                    
                    {/* Atribut Rapor & Titimangsa */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">Atribut & Titimangsa Rapor</h2>
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

                                {/* Stamp & Signature Image */}
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

                    {/* Penamaan Arab */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">Penamaan Arab (Tanda Tangan)</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Sesuaikan gelar tanda tangan dalam bahasa Arab.
                                </p>
                            </header>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel htmlFor="wali_kelas_ar" value="Wali Kelas (Arab)" />
                                    <TextInput
                                        id="wali_kelas_ar"
                                        className="mt-1 block w-full font-arabic text-right"
                                        value={data.wali_kelas_ar}
                                        onChange={(e) => setData('wali_kelas_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                    <InputError className="mt-2" message={errors.wali_kelas_ar} />
                                </div>
                                <div>
                                    <InputLabel htmlFor="headmaster_ar" value="Kepala Sekolah (Arab)" />
                                    <TextInput
                                        id="headmaster_ar"
                                        className="mt-1 block w-full font-arabic text-right"
                                        value={data.headmaster_ar}
                                        onChange={(e) => setData('headmaster_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                    <InputError className="mt-2" message={errors.headmaster_ar} />
                                </div>
                                <div>
                                    <InputLabel htmlFor="parents_ar" value="Orang Tua (Arab)" />
                                    <TextInput
                                        id="parents_ar"
                                        className="mt-1 block w-full font-arabic text-right"
                                        value={data.parents_ar}
                                        onChange={(e) => setData('parents_ar', e.target.value)}
                                        dir="rtl"
                                    />
                                    <InputError className="mt-2" message={errors.parents_ar} />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Kop Surat Rapor & Watermark */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section className="max-w-2xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">Kop Surat Rapor & Watermark</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Atur apakah rapor menggunakan kop surat cetak otomatis oleh sistem atau pre-printed, serta pengaturan watermark.
                                </p>
                            </header>

                            <div className="mt-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="use_system_header"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 w-5 h-5"
                                        checked={data.use_system_header}
                                        onChange={(e) => setData('use_system_header', e.target.checked)}
                                    />
                                    <label htmlFor="use_system_header" className="font-medium text-gray-700 cursor-pointer">
                                        Gunakan Kop Surat Sistem
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Jika tidak dicentang, rapor akan menyisakan margin atas (sekitar 3.5cm) untuk kertas rapor yang sudah ada kopnya.
                                </p>

                                {data.use_system_header && (
                                    <div className="mt-4 p-4 border rounded-md bg-gray-50 space-y-4">
                                        <div>
                                            <InputLabel value="Logo Kop Surat" />
                                            <div className="mt-2 flex items-center gap-x-3">
                                                {previews.kop_image ? (
                                                    <img src={previews.kop_image} alt="Kop Logo Preview" className="h-20 w-auto object-contain border rounded-md bg-white" />
                                                ) : (
                                                    <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs px-1 text-center bg-white">
                                                        Belum ada logo
                                                    </div>
                                                )}
                                                <label
                                                    htmlFor="kop_image"
                                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    Upload Logo
                                                    <input
                                                        type="file"
                                                        id="kop_image"
                                                        className="sr-only"
                                                        onChange={(e) => handleFileChange(e, 'kop_image')}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                            <InputError className="mt-2" message={errors.kop_image} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="yayasan_name" value="Nama Yayasan (Posisi Atas)" />
                                            <TextInput
                                                id="yayasan_name"
                                                className="mt-1 block w-full"
                                                value={data.yayasan_name}
                                                onChange={(e) => setData('yayasan_name', e.target.value)}
                                                placeholder="Contoh: YAYASAN PENDIDIKAN ISLAM..."
                                            />
                                            <InputError className="mt-2" message={errors.yayasan_name} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="institution_name" value="Nama Lembaga Utama (Posisi Tengah, Besar)" />
                                            <TextInput
                                                id="institution_name"
                                                className="mt-1 block w-full font-bold"
                                                value={data.institution_name}
                                                onChange={(e) => setData('institution_name', e.target.value)}
                                                placeholder="Contoh: SMP IT BINA INSANI"
                                            />
                                            <InputError className="mt-2" message={errors.institution_name} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="institution_location" value="Lokasi Lembaga (Contoh: Kabupaten/Kota)" />
                                            <TextInput
                                                id="institution_location"
                                                className="mt-1 block w-full"
                                                value={data.institution_location}
                                                onChange={(e) => setData('institution_location', e.target.value)}
                                                placeholder="Contoh: KABUPATEN SEMARANG"
                                            />
                                            <InputError className="mt-2" message={errors.institution_location} />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="use_watermark"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 w-5 h-5"
                                            checked={data.use_watermark}
                                            onChange={(e) => setData('use_watermark', e.target.checked)}
                                        />
                                        <label htmlFor="use_watermark" className="font-medium text-gray-700 cursor-pointer">
                                            Gunakan Watermark pada Cetak Rapor
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">
                                        Memberikan efek logo bayang-bayang di tengah halaman (opsional).
                                    </p>

                                    {data.use_watermark && (
                                        <div className="space-y-6">
                                            <div>
                                                <InputLabel value="Gambar Watermark (Opsional, akan pakai logo utama jika kosong)" />
                                                <div className="mt-2 flex items-center gap-x-3">
                                                    {previews.watermark_image ? (
                                                        <img 
                                                            src={previews.watermark_image} 
                                                            alt="Watermark Preview" 
                                                            className="h-20 w-auto object-contain border rounded-md bg-white transition-all" 
                                                            style={{ 
                                                                opacity: data.watermark_opacity / 100, 
                                                                filter: `brightness(${data.watermark_brightness}%)`
                                                            }}
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs px-1 text-center bg-white transition-all"
                                                            style={{ 
                                                                opacity: data.watermark_opacity / 100, 
                                                                filter: `brightness(${data.watermark_brightness}%)`
                                                            }}
                                                        >
                                                            Default Logo
                                                        </div>
                                                    )}
                                                    <label
                                                        htmlFor="watermark_image"
                                                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        Upload Watermark
                                                        <input
                                                            type="file"
                                                            id="watermark_image"
                                                            className="sr-only"
                                                            onChange={(e) => handleFileChange(e, 'watermark_image')}
                                                            accept="image/*"
                                                        />
                                                    </label>
                                                </div>
                                                <InputError className="mt-2" message={errors.watermark_image} />
                                            </div>

                                            {/* Sliders untuk Watermark Dinamis */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 pb-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <InputLabel htmlFor="watermark_scale" value="Skala / Ukuran" />
                                                        <span className="text-xs font-semibold text-indigo-600">{data.watermark_scale}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        id="watermark_scale" 
                                                        min="10" max="300" 
                                                        className="w-full accent-indigo-600" 
                                                        value={data.watermark_scale}
                                                        onChange={(e) => setData('watermark_scale', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <InputLabel htmlFor="watermark_opacity" value="Transparansi" />
                                                        <span className="text-xs font-semibold text-indigo-600">{data.watermark_opacity}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        id="watermark_opacity" 
                                                        min="0" max="100" 
                                                        className="w-full accent-indigo-600" 
                                                        value={data.watermark_opacity}
                                                        onChange={(e) => setData('watermark_opacity', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <InputLabel htmlFor="watermark_brightness" value="Kecerahan" />
                                                        <span className="text-xs font-semibold text-indigo-600">{data.watermark_brightness}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        id="watermark_brightness" 
                                                        min="0" max="300" 
                                                        className="w-full accent-indigo-600" 
                                                        value={data.watermark_brightness}
                                                        onChange={(e) => setData('watermark_brightness', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>Simpan Pengaturan Rapor</PrimaryButton>
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
