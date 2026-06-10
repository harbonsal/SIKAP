import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb component with automatic path generation
 * 
 * Usage:
 * 1. Auto-generate from URL:
 *    <Breadcrumb />
 * 
 * 2. Custom items:
 *    <Breadcrumb items={[
 *      { label: 'Dashboard', href: '/dashboard' },
 *      { label: 'Settings', href: '/settings' },
 *      { label: 'Profile' }
 *    ]} />
 * 
 * 3. With custom home:
 *    <Breadcrumb homeLabel="Beranda" homeHref="/dashboard" />
 */
export default function Breadcrumb({ 
    items = null, 
    homeLabel = 'Dashboard',
    homeHref = '/dashboard',
    className 
}) {
    const { url } = usePage();

    // Generate breadcrumb items from URL if not provided
    const breadcrumbItems = items || generateBreadcrumbFromUrl(url);

    // Don't show breadcrumb on home page
    if (breadcrumbItems.length === 0 || url === homeHref) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm text-muted-foreground mb-4', className)}>
            {/* Home link */}
            <Link 
                href={homeHref}
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span className="sr-only">{homeLabel}</span>
            </Link>

            {/* Breadcrumb items */}
            {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                
                return (
                    <div key={index} className="flex items-center space-x-1">
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        {isLast ? (
                            <span className="font-medium text-foreground">
                                {item.label}
                            </span>
                        ) : (
                            <Link 
                                href={item.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

/**
 * Generate breadcrumb items from URL path
 * Converts URL segments to readable labels
 */
function generateBreadcrumbFromUrl(url) {
    // Remove leading slash and split by /
    const segments = url.replace(/^\//, '').split('/').filter(Boolean);
    
    if (segments.length === 0) return [];

    const items = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Skip numeric IDs and common action words at the end
        const isNumeric = /^\d+$/.test(segment);
        const isAction = ['create', 'edit', 'show'].includes(segment.toLowerCase());
        const isLast = index === segments.length - 1;

        // For last segment, always show (even if numeric/action)
        // For middle segments, skip if numeric
        if (!isLast && isNumeric) {
            return;
        }

        items.push({
            label: formatSegmentLabel(segment, isAction, isLast),
            href: isLast ? null : currentPath
        });
    });

    return items;
}

/**
 * Format URL segment to readable label
 * Examples:
 * - "students" -> "Siswa"
 * - "ikhtabir-nafsi" -> "Ikhtabir Nafsi"
 * - "create" -> "Tambah Baru"
 * - "edit" -> "Edit"
 */
function formatSegmentLabel(segment, isAction, isLast) {
    // Action labels (Indonesian)
    const actionLabels = {
        'create': 'Tambah Baru',
        'edit': 'Edit',
        'show': 'Detail',
    };

    if (isAction && isLast) {
        return actionLabels[segment.toLowerCase()] || segment;
    }

    // Custom labels for common routes (Indonesian)
    const customLabels = {
        // Main modules
        'dashboard': 'Dashboard',
        'students': 'Siswa',
        'teachers': 'Guru',
        'classes': 'Kelas',
        'subjects': 'Mata Pelajaran',
        'grades': 'Nilai',
        'attendance': 'Absensi',
        'schedule': 'Jadwal',
        'reports': 'Laporan',
        'settings': 'Pengaturan',
        'profile': 'Profil',
        
        // Academic
        'academic-years': 'Tahun Ajaran',
        'active-classes': 'Kelas Aktif',
        'active-subjects': 'Mapel Aktif',
        'class-members': 'Anggota Kelas',
        'grade-weights': 'Bobot Nilai',
        'assessments': 'Penilaian',
        
        // Tahfidz
        'tahfidz': 'Tahfidz',
        'quran-progress': 'Progress Quran',
        'hafalan-skrining': 'Hafalan Skrining',
        'achievement': 'Prestasi',
        
        // Character
        'character': 'Karakter',
        'character-assessment': 'Penilaian Karakter',
        'character-categories': 'Kategori Karakter',
        'character-reports': 'Laporan Karakter',
        
        // Dormitory
        'kamar': 'Asrama',
        'active-kamar': 'Asrama Aktif',
        'kamar-members': 'Anggota Asrama',
        
        // Teacher tools
        'ikhtabir-nafsi': 'Ikhtabir Nafsi',
        'rpp-generator': 'Generator RPP',
        'topics': 'Topik',
        'session': 'Sesi',
        
        // Admin
        'users': 'Pengguna',
        'roles': 'Role',
        'permissions': 'Hak Akses',
        'api-keys': 'API Keys',
        'backups': 'Backup',
        'system-info': 'Info Sistem',
        
        // Education
        'education': 'Pendidikan',
        'picket': 'Piket',
        'supervision': 'Supervisi',
        'teaching-methods': 'Metode Mengajar',
        
        // Master data
        'master': 'Master Data',
        'jenjang': 'Jenjang',
        'kelas': 'Kelas',
        'districts': 'Kecamatan',
        'villages': 'Kelurahan',
    };

    const lowerSegment = segment.toLowerCase();
    
    if (customLabels[lowerSegment]) {
        return customLabels[lowerSegment];
    }

    // Convert kebab-case or snake_case to Title Case
    return segment
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
