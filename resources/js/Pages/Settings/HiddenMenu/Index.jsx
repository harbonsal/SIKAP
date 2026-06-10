import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Search, ExternalLink, ShieldAlert, Database, BookOpen, Wrench } from 'lucide-react';
import { useState } from 'react';

export default function Index({ menus }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMenus = menus.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    const getIcon = (category) => {
        if (category.includes('Master')) return Database;
        if (category.includes('Akademik')) return BookOpen;
        return Wrench;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Menu Tersembunyi</h2>
                </div>
            }
        >
            <Head title="Menu Tersembunyi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Search */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
                        <Search className="text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari fitur..."
                            className="flex-1 border-none focus:ring-0 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filteredMenus.map((category, idx) => {
                        const CategoryIcon = getIcon(category.category);
                        return (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2 text-indigo-700 font-semibold px-1">
                                    <CategoryIcon className="w-5 h-5" />
                                    <h3>{category.category}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {category.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col justify-between h-full">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <div className="mt-auto">
                                                <a
                                                    href={route(item.route)}
                                                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Buka Menu
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {filteredMenus.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Tidak ada fitur yang cocok dengan pencarian "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
