import MainLayout from '@/Layouts/MainLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import AdminDashboard from './DashboardComponents/AdminDashboard';
import TeacherDashboard from './DashboardComponents/TeacherDashboard';
import StudentDashboard from './DashboardComponents/StudentDashboard';

export default function Dashboard({ stats, schedule, dashboard_type, allowed_widgets, available_dashboards }) {
    // If dashboard_type is not provided (legacy), try to guess
    const type = dashboard_type || (stats.role === 'teacher' ? 'Teacher' : 'Admin');

    const renderDashboard = () => {
        switch (type) {
            case 'Teacher':
                return <TeacherDashboard stats={stats} schedule={schedule} allowedWidgets={allowed_widgets} />;
            case 'Admin':
                return <AdminDashboard stats={stats} allowedWidgets={allowed_widgets} />;
            case 'Student':
                return <StudentDashboard stats={stats} schedule={schedule} allowedWidgets={allowed_widgets} />;
            default:
                // Fallback to Admin or generic
                return <AdminDashboard stats={stats} allowedWidgets={allowed_widgets} />;
        }
    };

    return (
        <MainLayout>
            <Head title="Dashboard" />

            <div className="py-6 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {renderDashboard()}
                </div>
            </div>
        </MainLayout>
    );
}
