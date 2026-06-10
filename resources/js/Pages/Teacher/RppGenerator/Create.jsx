import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, Save, Loader2, Bot } from 'lucide-react';

export default function Create({ auth, activeSubjects, teachingMethods }) {
    const { data, setData, post, processing, errors } = useForm({
        active_subject_id: '',
        topic: '',
        teaching_method_id: '',
        duration_minutes: 90,
        additional_notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('rpp-generator.generate'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Buat RPP Baru by AI</h2>}
        >
            <Head title="Buat RPP Baru" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">

                            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                                <Link
                                    href={route('rpp-generator.index')}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </Link>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-indigo-600" />
                                        Input Konteks RPP
                                    </h3>
                                    <p className="text-sm text-gray-500">Isi data di bawah ini, AI akan membuatkan RPP/Modul Ajar yang kontekstual dan sesuai standar pesantren.</p>
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <label htmlFor="active_subject_id" className="block text-sm font-medium text-gray-700">Mata Pelajaran & Kelas (Jatah Mengajar)</label>
                                    <select
                                        id="active_subject_id"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={data.active_subject_id}
                                        onChange={(e) => setData('active_subject_id', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Pilih Mata Pelajaran --</option>
                                        {activeSubjects.length > 0 ? (
                                            activeSubjects.map((subject) => (
                                                <option key={subject.id} value={subject.id}>
                                                    {subject.label} ({subject.jenjang})
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Anda belum memiliki jatah mengajar aktif</option>
                                        )}
                                    </select>
                                    {errors.active_subject_id && <p className="mt-2 text-sm text-red-600">{errors.active_subject_id}</p>}
                                    <p className="mt-1 text-xs text-gray-500">AI otomatis mendeteksi tingkat usia santri dari Jenjang yang dipilih.</p>
                                </div>

                                <div>
                                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Materi / Topik Pembelajaran</label>
                                    <input
                                        type="text"
                                        id="topic"
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        value={data.topic}
                                        onChange={(e) => setData('topic', e.target.value)}
                                        placeholder="Contoh: Bab Thoharoh, Fikih Shalat Jenazah, dll."
                                        required
                                    />
                                    {errors.topic && <p className="mt-2 text-sm text-red-600">{errors.topic}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="teaching_method_id" className="block text-sm font-medium text-gray-700">Metode Mengajar</label>
                                        <select
                                            id="teaching_method_id"
                                            className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            value={data.teaching_method_id}
                                            onChange={(e) => setData('teaching_method_id', e.target.value)}
                                            required
                                        >
                                            <option value="">-- Pilih Metode --</option>
                                            {teachingMethods.map((method) => (
                                                <option key={method.id} value={method.id}>
                                                    {method.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.teaching_method_id && <p className="mt-2 text-sm text-red-600">{errors.teaching_method_id}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">Durasi (Menit)</label>
                                        <input
                                            type="number"
                                            id="duration_minutes"
                                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            value={data.duration_minutes}
                                            onChange={(e) => setData('duration_minutes', e.target.value)}
                                            min="10"
                                            required
                                        />
                                        {errors.duration_minutes && <p className="mt-2 text-sm text-red-600">{errors.duration_minutes}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700">Catatan Khusus (Opsional)</label>
                                    <textarea
                                        id="additional_notes"
                                        rows="3"
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        value={data.additional_notes}
                                        onChange={(e) => setData('additional_notes', e.target.value)}
                                        placeholder="Tambahkan detail target, karakteristik santri khusus, atau fokus utama pembelajaran agar RPP lebih relevan..."
                                    ></textarea>
                                    {errors.additional_notes && <p className="mt-2 text-sm text-red-600">{errors.additional_notes}</p>}
                                </div>

                                <div className="border-t pt-5 flex justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading AI...
                                            </>
                                        ) : (
                                            <>
                                                <Bot className="w-4 h-4" />
                                                Generate RPP dengan AI
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
