import MainLayout from '@/Layouts/MainLayout';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { BookOpen, CalendarClock, ShieldCheck, Settings } from 'lucide-react';

const tabs = [
    { title: 'Jurnal & Absensi Kelas', route: 'journals.index', icon: BookOpen },
    { title: 'Rekap Belum Absen', route: 'journals.missing', icon: CalendarClock },
    { title: 'Absensi Manual', route: 'journals.manual.index', icon: ShieldCheck },
    { title: 'Jadwal Piket', route: 'pickets.index', icon: CalendarClock },
    { title: 'Pengaturan Absensi', route: 'journals.settings', icon: Settings, canManage: true },
];

export default function AbsensiLayout({ children, breadcrumbItems }) {
    const { auth } = usePage().props;

    const canManage = auth?.user?.roles?.some(r => ['Administrator', 'Admin', 'Kepala Sekolah', 'Manager'].includes(r)) 
        || ['Administrator', 'Kepala Sekolah', 'Manager'].includes(auth?.user?.user_level?.name);

    const visibleTabs = tabs.filter(tab => !tab.canManage || canManage);

    const isTabActive = (routeName) => {
        return route().current(routeName) || route().current(routeName + '.*');
    };

    return (
        <MainLayout breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Absensi & Jurnal</h2>
                </div>
                
                {/* Tab Navigation */}
                <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-border shadow-sm overflow-x-auto no-scrollbar mb-6">
                    <nav className="flex space-x-2 min-w-max">
                        {visibleTabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = isTabActive(tab.route);
                            return (
                                <Link
                                    key={tab.route}
                                    href={route(tab.route)}
                                    className={cn(
                                        "group flex items-center justify-center whitespace-nowrap px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                                        active
                                            ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500/50"
                                            : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700"
                                    )}
                                >
                                    <Icon className={cn("mr-2 h-4 w-4 transition-colors", active ? "text-white" : "text-muted-foreground group-hover:text-indigo-600")} />
                                    {tab.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="pt-2">
                    {children}
                </div>
            </div>
        </MainLayout>
    );
}
