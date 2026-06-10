import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            nama_arab: user.nama_arab || '',
            no_hp: user.no_hp || '',
            signature: null,
            _method: 'PATCH',
        });

    const [signaturePreview, setSignaturePreview] = useState(
        user.signature ? `/storage/${user.signature}` : null
    );

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('signature', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignaturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information, email address, and digital signature.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6" encType="multipart/form-data">
                <div>
                    <InputLabel htmlFor="nomor_induk" value="NIK / Nomor Induk (Tidak dapat diubah)" />

                    <TextInput
                        id="nomor_induk"
                        className="mt-1 block w-full bg-gray-100"
                        value={user.nomor_induk || ''}
                        disabled
                    />
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="nama_arab" value="Nama Arab" />

                    <TextInput
                        id="nama_arab"
                        className="mt-1 block w-full"
                        value={data.nama_arab}
                        onChange={(e) => setData('nama_arab', e.target.value)}
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.nama_arab} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="no_hp" value="No HP" />

                    <TextInput
                        id="no_hp"
                        className="mt-1 block w-full"
                        value={data.no_hp}
                        onChange={(e) => setData('no_hp', e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.no_hp} />
                </div>

                <div>
                    <InputLabel htmlFor="signature" value="Digital Signature" />
                    <div className="mt-2 flex items-center gap-x-4">
                        {signaturePreview ? (
                            <div className="relative h-20 w-40 overflow-hidden rounded-md border border-gray-300 bg-white">
                                <img
                                    src={signaturePreview}
                                    alt="Signature Preview"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex h-20 w-40 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                                No Signature
                            </div>
                        )}

                        <label
                            htmlFor="signature"
                            className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Upload Signature
                            <input
                                type="file"
                                id="signature"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleSignatureChange}
                            />
                        </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Allowed formats: PNG, JPG (Max 2MB). Preferred with transparent background.</p>
                    <InputError className="mt-2" message={errors.signature} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
