import MainLayout from '@/Layouts/MainLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import AdminDashboard from './DashboardComponents/AdminDashboard';
import TeacherDashboard from './DashboardComponents/TeacherDashboard';
import StudentDashboard from './DashboardComponents/StudentDashboard';
import StudentHolidayDashboard from './DashboardComponents/StudentHolidayDashboard';
import OswanDashboard from './DashboardComponents/OswanDashboard';

export default function Dashboard({ stats, schedule, dashboard_type, allowed_widgets, available_dashboards }) {
    // If dashboard_type is not provided (legacy), try to guess
    const type = dashboard_type || (stats.role === 'teacher' ? 'Teacher' : (stats.role === 'oswan' ? 'Oswan' : 'Admin'));

    const renderDashboard = () => {
        switch (type) {
            case 'Oswan':
                return <OswanDashboard stats={stats} />;
            case 'Teacher':
                return <TeacherDashboard stats={stats} schedule={schedule} allowedWidgets={allowed_widgets} />;
            case 'Admin':
                return <AdminDashboard stats={stats} allowedWidgets={allowed_widgets} />;
            case 'Student':
                if (stats.active_holiday) {
                    return <StudentHolidayDashboard stats={stats} />;
                }
                return <StudentDashboard stats={stats} schedule={schedule} allowedWidgets={allowed_widgets} />;
            default:
                // Fallback to Admin or generic
                return <AdminDashboard stats={stats} allowedWidgets={allowed_widgets} />;
        }
    };

    return (
        <MainLayout>
            <Head title="Dashboard" />

            <div className="max-w-7xl mx-auto space-y-4">
                {available_dashboards && available_dashboards.length > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-2.5 px-4 rounded-2xl border border-indigo-100 dark:border-zinc-800 shadow-xs print:hidden">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Peran ganda terdeteksi. Beralih mode tampilan:</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                            {available_dashboards.map((dash) => {
                                const isActive = type === dash.type;
                                return (
                                    <button
                                        key={dash.type}
                                        type="button"
                                        onClick={() => router.get(route('dashboard'), { view_as: dash.type }, { preserveScroll: true, preserveState: true })}
                                        className={cn(
                                            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer",
                                            isActive
                                                ? "bg-white dark:bg-zinc-950 text-indigo-700 dark:text-indigo-400 shadow-xs ring-1 ring-black/5"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                                        )}
                                    >
                                        <span>
                                            {dash.type === 'Oswan'
                                                ? '🛡️ OSWAN'
                                                : (dash.type === 'Teacher' 
                                                    ? '👨‍🏫 Guru / Pengajar' 
                                                    : (dash.type === 'Student' ? '🎓 Santri' : '👔 Manager Tahfidz / Admin'))}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {renderDashboard()}
            </div>
        </MainLayout>
    );
}
