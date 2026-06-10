import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconArrowLeft } from '@tabler/icons-react';
import { confirmDelete } from '@/lib/sweetalert';

export default function Index({ auth, topics }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        text_ar: '',
        active: true
    });

    const openModal = (topic = null) => {
        setEditingTopic(topic);
        setData({
            text_ar: topic ? topic.text_ar : '',
            active: topic ? topic.active : true
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTopic(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingTopic) {
            put(route('ikhtabir-nafsi.topics.update', editingTopic.id), {
                onSuccess: closeModal
            });
        } else {
            post(route('ikhtabir-nafsi.topics.store'), {
                onSuccess: closeModal
            });
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmDelete({
            title: 'Hapus Topik?',
            text: 'Yakin ingin menghapus topik ini?',
            confirmButtonText: 'Ya, Hapus!',
        });

        if (confirmed) {
            destroy(route('ikhtabir-nafsi.topics.destroy', id));
        }
    };

    const handleToggle = (id) => {
        router.post(route('ikhtabir-nafsi.topics.toggle', id));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen Topik Ikhtabir Nafsi</h2>}
        >
            <Head title="Manajemen Topik" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex justify-between items-center">
                        <button
                            onClick={() => window.history.back()}
                            className="text-gray-600 hover:text-gray-900 flex items-center"
                        >
                            <IconArrowLeft size={16} className="mr-1" /> Kembali
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
                        >
                            <IconPlus size={16} className="mr-2" /> Tambah Topik
                        </button>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topik</th>
                                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topics.map((topic) => (
                                    <tr key={topic.id}>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                            {topic.text_ar}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button
                                                onClick={() => handleToggle(topic.id)}
                                                className={`px-2 py-1 rounded-full text-xs font-bold ${topic.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            >
                                                {topic.active ? 'Aktif' : 'Non-Aktif'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openModal(topic)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <IconEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(topic.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingTopic ? 'Edit Topik' : 'Tambah Topik Baru'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Judul Topik (Bahasa Arab/Indonesia)
                                </label>
                                <textarea
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows="3"
                                    value={data.text_ar}
                                    onChange={(e) => setData('text_ar', e.target.value)}
                                    placeholder="Contoh: Menjelaskan Rukun Islam..."
                                    required
                                />
                                {errors.text_ar && <p className="text-red-500 text-xs italic">{errors.text_ar}</p>}
                            </div>

                            <div className="mb-6 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={data.active}
                                    onChange={(e) => setData('active', e.target.checked)}
                                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="text-gray-700 text-sm">Aktifkan Topik ini?</label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
