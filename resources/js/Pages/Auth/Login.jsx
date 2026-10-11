import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles } from 'lucide-react';

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

            {/* Bismillah Header & Welcome Greeting */}
            <div className="text-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-serif text-sm tracking-wide text-emerald-800 dark:text-emerald-300 font-medium select-none">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center justify-center gap-1.5">
                    <span>Masuk ke Akun Anda</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Gunakan NIP, NISN, atau Email yang telah terdaftar
                </p>
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
                        className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
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
                            placeholder="Contoh: ustadz@alwan.sch.id / 1985..."
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all shadow-2xs"
                        />
                    </div>

                    <InputError message={errors.email} className="mt-1.5 text-xs text-red-600 dark:text-red-400" />
                </div>

                {/* Field 2: Password */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                        >
                            Kata Sandi (Password)
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors"
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
                            placeholder="Masukkan kata sandi..."
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-2xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <InputError message={errors.password} className="mt-1.5 text-xs text-red-600 dark:text-red-400" />
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded-md border-slate-300 text-emerald-600 shadow-xs focus:ring-emerald-500"
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
                        className="w-full relative py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-800 shadow-md shadow-emerald-700/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed group overflow-hidden"
                    >
                        {/* Golden Highlight Rim on top edge of button */}
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

            {/* Micro Portal Badge & Last Update */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Portal Terpadu Santri, Wali Santri & Asatidz</span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    ⚡ Last Update: 12 Okt 2026 04:22 WIB
                </div>
            </div>
        </GuestLayout>
    );
}
