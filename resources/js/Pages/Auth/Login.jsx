import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        const intendedUrl = sessionStorage.getItem('intended_url');
        if (intendedUrl) {
            sessionStorage.removeItem('intended_url');
        }
    }, []);

    const submit = (e) => {
        e.preventDefault();
        const intendedUrl = sessionStorage.getItem('intended_url');

        post(route('login'), {
            onFinish: () => {
                reset('password');
                if (intendedUrl) {
                    sessionStorage.removeItem('intended_url');
                }
            },
            onSuccess: () => {
                if (intendedUrl) {
                    window.location.href = intendedUrl;
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk - SIKAP Pesantren" />

            {/* Clean Mobile-First Header */}
            <div className="text-center mb-5">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Masuk ke Akun
                </h2>
            </div>

            {status && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center shadow-xs">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Field 1: Email / NIP / NIS */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                        Email / NIP / NISN
                    </label>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <input
                            id="email"
                            type="text"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            placeholder="Email, NIP, atau NISN"
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                        />
                    </div>

                    <InputError message={errors.email} className="mt-1.5 text-xs text-red-600 dark:text-red-400" />
                </div>

                {/* Field 2: Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                        >
                            Kata Sandi (Password)
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors"
                            >
                                Lupa sandi?
                            </Link>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="Kata sandi akun"
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-2xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                            className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-1.5 text-xs text-red-600 dark:text-red-400" />
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded-md border-slate-300 text-emerald-600 shadow-xs focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Ingat sesi saya
                        </span>
                    </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full h-12 relative rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-800 shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed group overflow-hidden"
                    >
                        {/* Golden Highlight Rim on top edge */}
                        <span className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-amber-400/40 via-amber-300 to-amber-400/40"></span>

                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Memverifikasi Akun...</span>
                            </>
                        ) : (
                            <>
                                <span>Masuk ke Sistem</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Clean Subtle Last Update */}
            <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    ⚡ Last Update: 31 Okt 2026 12:16 WIB
                </span>
            </div>
        </GuestLayout>
    );
}
