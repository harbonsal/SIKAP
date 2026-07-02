import React from 'react';
import { Link } from '@inertiajs/react';

export default function TahfidzTabs({ activeRoute, activeTabParams = '' }) {
    const tabs = [
        {
            name: 'Dashboard',
            href: route('tahfidz.dashboard.index'),
            active: activeRoute === 'dashboard'
        },
        {
            name: 'Pantauan Hafalan',
            href: route('tahfidz.achievements.index', { tab: 'input' }),
            active: activeRoute === 'achievements' && activeTabParams === 'input'
        },
        {
            name: 'Monitoring Capaian',
            href: route('tahfidz.achievements.index', { tab: 'monitoring' }),
            active: activeRoute === 'achievements' && activeTabParams === 'monitoring'
        },
        {
            name: 'Analisa Tahfidz',
            href: route('tahfidz.analysis.index'),
            active: activeRoute === 'analysis'
        }
    ];

    return (
        <div className="flex space-x-1 rounded-xl bg-gray-100/50 p-1 w-fit border mb-6">
            {tabs.map((tab) => (
                <Link
                    key={tab.name}
                    href={tab.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        tab.active
                            ? 'bg-white shadow text-indigo-600'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    {tab.name}
                </Link>
            ))}
        </div>
    );
}
