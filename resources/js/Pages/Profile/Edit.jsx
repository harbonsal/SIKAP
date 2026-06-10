import MainLayout from '@/Layouts/MainLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { User, Mail, Phone, Hash, FileSignature, Award, Home, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Transition } from '@headlessui/react';
import Swal from 'sweetalert2';

export default function Edit({ mustVerifyEmail, status, studentDetails, displayRoles }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    
    const { data, setData, post, processing, recentlySuccessful, errors } = useForm({
        signature: null,
        _method: 'PATCH',
    });

    const [preview, setPreview] = useState(user.signature ? `/storage/${user.signature}` : null);

    // Watch for success flash from backend
    useEffect(() => {
        if (flash.success) {
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
    }, [flash.success]);

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('signature', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const submitSignature = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const DetailRow = ({ icon: Icon, label, value, isArabic = false }) => (
        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 transition-colors">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`mt-1 font-semibold text-gray-900 dark:text-gray-100 ${isArabic ? 'font-arabic text-lg' : 'text-base'}`}>
                    {value || '-'}
                </p>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <Head title="Profil Saya" />

            <div className="max-w-3xl mx-auto space-y-6">
                <Card className="shadow-lg border-t-4 border-t-primary">
                    <CardHeader className="text-center pb-8 border-b bg-gradient-to-b from-primary/5 to-transparent">
                        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-white shadow-md">
                            <span className="text-3xl font-bold text-primary">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">{user.name}</CardTitle>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                            {displayRoles && displayRoles.length > 0 ? (
                                displayRoles.map((role, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                        <Award className="w-3.5 h-3.5" />
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    User
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailRow
                                icon={Hash}
                                label="Nomor Induk / NIP"
                                value={user.nomor_induk}
                            />
                            <DetailRow
                                icon={User}
                                label="Nama Lengkap"
                                value={user.name}
                            />
                            <DetailRow
                                icon={User}
                                label="Nama Arab"
                                value={user.nama_arab}
                                isArabic={true}
                            />
                            <DetailRow
                                icon={Mail}
                                label="Email"
                                value={user.email}
                            />
                            <DetailRow
                                icon={Phone}
                                label="Nomor HP"
                                value={user.no_hp}
                            />

                            {studentDetails && (
                                <>
                                    <DetailRow
                                        icon={Award}
                                        label="Kelas"
                                        value={studentDetails.active_class}
                                    />
                                    <DetailRow
                                        icon={User}
                                        label="Wali Kelas"
                                        value={studentDetails.wali_kelas}
                                    />
                                    <DetailRow
                                        icon={Home}
                                        label="Asrama"
                                        value={studentDetails.kamar}
                                    />
                                    <DetailRow
                                        icon={User}
                                        label="Musrif"
                                        value={studentDetails.musrif}
                                    />
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Signature Upload Card */}
                <Card className="shadow-lg border-l-4 border-l-blue-500">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                            <FileSignature className="w-5 h-5 text-blue-500" />
                            Tanda Tangan Digital
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitSignature} className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                {preview ? (
                                    <div className="relative h-32 w-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
                                        <img src={preview} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-xs font-medium">Ganti Tanda Tangan</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 w-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                        <FileSignature className="w-8 h-8 mb-2" />
                                        <p className="text-[10px] text-center px-4">Belum ada tanda tangan</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="signature-input"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleSignatureChange}
                                    accept="image/*"
                                />
                            </div>

                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Upload Tanda Tangan</h4>
                                    
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Syarat File:
                                        </div>
                                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                            <li>Format <b>PNG (Transparan)</b> sangat disarankan</li>
                                            <li>Ukuran maksimal <b>2 MB</b></li>
                                            <li>Proporsi disarankan <b>3:2</b> (misal: 300x200 px)</li>
                                            <li>Pastikan tanda tangan jelas dan tidak terpotong</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                {errors.signature && (
                                    <p className="text-sm text-red-600 font-medium">{errors.signature}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                    <Button 
                                        type="submit" 
                                        disabled={processing || !data.signature}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Menyimpan...
                                            </span>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-out duration-300"
                                        enterFrom="opacity-0 translate-y-1"
                                        enterTo="opacity-100 translate-y-0"
                                    >
                                        <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Tersimpan!
                                        </div>
                                    </Transition>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground bg-yellow-50 text-yellow-700 p-3 rounded-md border border-yellow-200 inline-block">
                        <span className="font-semibold">Perhatian:</span> Data profil dikelola oleh Administrator. Hubungi admin sekolah jika terdapat kesalahan data.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
