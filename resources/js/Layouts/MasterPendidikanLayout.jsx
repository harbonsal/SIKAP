import MainLayout from '@/Layouts/MainLayout';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Settings, Layers, Hash, Calendar, CalendarDays, Percent, BarChart } from 'lucide-react';

const tabs = [
    { title: 'Tahun & Semester', route: 'settings.academic.index', icon: Settings },
    { title: 'Jenjang', route: 'jenjangs.index', icon: Layers },
    { title: 'Kelas Paralel', route: 'kelas-paralel.index', icon: Hash },
    { title: 'Bobot Nilai', route: 'grade-weights.index', icon: Percent },
    { title: 'KKM', route: 'kkms.index', icon: BarChart },
    { title: 'Data Pekan', route: 'pekans.index', icon: CalendarDays },
    { title: 'Data Hari', route: 'days.index', icon: Calendar },
];

export default function MasterPendidikanLayout({ children, breadcrumbItems }) {
    const { url } = usePage();

    const isTabActive = (routeName) => {
        return route().current(routeName);
    };

    return (
        <MainLayout breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Master Pendidikan</h2>
                </div>
                
                {/* Tab Navigation */}
                <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-border shadow-sm overflow-x-auto no-scrollbar mb-6">
                    <nav className="flex space-x-2 min-w-max">
                        {tabs.map((tab) => {
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
