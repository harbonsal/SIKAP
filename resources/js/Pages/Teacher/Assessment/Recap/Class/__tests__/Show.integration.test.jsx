import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Show from '../Show';

// Mock Inertia components
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, className }) => <a href={href} className={className}>{children}</a>,
    router: {
        get: vi.fn(),
    },
}));

// Mock global route function
global.route = vi.fn((name, params) => {
    if (name === 'recap.class.index') {
        return '/recap/class';
    }
    if (name === 'recap.class.show') {
        return `/recap/class/${params?.active_class || params || ''}`;
    }
    return `/${name}`;
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    ArrowLeft: () => <span>ArrowLeft</span>,
    Printer: () => <span>Printer</span>,
}));

// Mock MainLayout
vi.mock('@/Layouts/MainLayout', () => ({
    default: ({ children }) => <div data-testid="main-layout">{children}</div>,
}));

// Mock child components
vi.mock('../RekapNilaiTab', () => ({
    default: ({ activeSubjects, studentRecaps, kkms }) => (
        <div data-testid="rekap-nilai-tab">
            <div data-testid="active-subjects-count">{activeSubjects.length}</div>
            <div data-testid="student-recaps-count">{studentRecaps.length}</div>
            <div data-testid="kkms-count">{Object.keys(kkms).length}</div>
        </div>
    ),
}));

vi.mock('../LedgerTab', () => ({
    default: ({ activeSubjects, gradeWeights, studentLedgers, kkms }) => (
        <div data-testid="ledger-tab">
            <div data-testid="grade-weights-count">{gradeWeights.length}</div>
            <div data-testid="student-ledgers-count">{studentLedgers.length}</div>
        </div>
    ),
}));

describe('Show Component - Integration Test: Page Load with Default Tab', () => {
    let mockProps;
    let consoleErrorSpy;
    let consoleWarnSpy;

    beforeEach(() => {
        // Reset URL to default state (no tab parameter)
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1');
        
        // Spy on console errors and warnings
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock data that matches the expected structure from the backend
        mockProps = {
            activeClass: {
                id: 1,
                kelas: {
                    name: '7A',
                },
                kelas_paralel: {
                    name: 'Reguler',
                },
                teacher: {
                    name: 'Pak Ahmad',
                },
            },
            activeSubjects: [
                {
                    id: 1,
                    mapel_id: 10,
                    mapel: {
                        name: 'Matematika',
                    },
                },
                {
                    id: 2,
                    mapel_id: 11,
                    mapel: {
                        name: 'Bahasa Indonesia',
                    },
                },
            ],
            gradeWeights: [
                {
                    id: 1,
                    name: 'UH1',
                    weight: 20,
                },
                {
                    id: 2,
                    name: 'UTS',
                    weight: 30,
                },
                {
                    id: 3,
                    name: 'UH2',
                    weight: 20,
                },
                {
                    id: 4,
                    name: 'UAS',
                    weight: 30,
                },
            ],
            studentRecaps: [
                {
                    student_id: 1,
                    name: 'Ahmad',
                    nomor_induk: '12345',
                    subjects: {
                        1: { final_score: 85 },
                        2: { final_score: 78 },
                    },
                    total_score: 163,
                    average_score: 81.5,
                    rank: 1,
                },
                {
                    student_id: 2,
                    name: 'Budi',
                    nomor_induk: '12346',
                    subjects: {
                        1: { final_score: 75 },
                        2: { final_score: 80 },
                    },
                    total_score: 155,
                    average_score: 77.5,
                    rank: 2,
                },
            ],
            studentLedgers: [
                {
                    student_id: 1,
                    name: 'Ahmad',
                    nomor_induk: '12345',
                    subjects: {
                        1: {
                            weights: { 1: 80, 2: 85, 3: 88, 4: 87 },
                            final_score: 85,
                        },
                        2: {
                            weights: { 1: 75, 2: 78, 3: 80, 4: 79 },
                            final_score: 78,
                        },
                    },
                    total_score: 163,
                    average_score: 81.5,
                    rank: 1,
                },
                {
                    student_id: 2,
                    name: 'Budi',
                    nomor_induk: '12346',
                    subjects: {
                        1: {
                            weights: { 1: 70, 2: 75, 3: 78, 4: 76 },
                            final_score: 75,
                        },
                        2: {
                            weights: { 1: 78, 2: 80, 3: 82, 4: 81 },
                            final_score: 80,
                        },
                    },
                    total_score: 155,
                    average_score: 77.5,
                    rank: 2,
                },
            ],
            academicYear: {
                name: '2024/2025',
            },
            semester: {
                name: 'Ganjil',
            },
            kkms: {
                10: { kkm_value: 75 },
                11: { kkm_value: 70 },
            },
        };
    });

    test('navigating to /recap/class/1 shows the Rekap tab by default', () => {
        const { container } = render(<Show {...mockProps} />);

        // Verify the Rekap Nilai tab is active (has data-state="active")
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'active');

        // Verify the Ledger tab is inactive
        const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
        expect(ledgerTrigger).toHaveAttribute('data-state', 'inactive');

        // Verify the Rekap Nilai tab content is visible
        const rekapContent = screen.getByTestId('rekap-nilai-tab');
        expect(rekapContent).toBeInTheDocument();
        expect(rekapContent).toBeVisible();
    });

    test('page loads correctly with all required data', () => {
        render(<Show {...mockProps} />);

        // Verify page title
        expect(document.title).toBe('Rekap Nilai - 7A');

        // Verify header information
        expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
        expect(screen.getByText(/7A Reguler - Pak Ahmad/i)).toBeInTheDocument();

        // Verify semester selector
        const semesterSelect = screen.getByRole('combobox');
        expect(semesterSelect).toHaveValue('Ganjil');

        // Verify info banner is present
        expect(screen.getByText(/Informasi Perhitungan Rekap Nilai Kelas/i)).toBeInTheDocument();
        expect(screen.getByText(/Nilai berwarna merah/i)).toBeInTheDocument();

        // Verify both tab triggers are present
        expect(screen.getByRole('tab', { name: /rekap nilai/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /ledger/i })).toBeInTheDocument();

        // Verify print button is present
        expect(screen.getByRole('button', { name: /cetak/i })).toBeInTheDocument();

        // Verify back button is present
        const backLink = screen.getByRole('link');
        expect(backLink).toHaveAttribute('href', '/recap/class');
    });

    test('all required data is passed to RekapNilaiTab component', () => {
        render(<Show {...mockProps} />);

        // Verify data is passed correctly to the RekapNilaiTab
        expect(screen.getByTestId('active-subjects-count')).toHaveTextContent('2');
        expect(screen.getByTestId('student-recaps-count')).toHaveTextContent('2');
        expect(screen.getByTestId('kkms-count')).toHaveTextContent('2');
    });

    test('ensures no console errors occur during page load', async () => {
        render(<Show {...mockProps} />);

        // Wait for any async operations to complete
        await waitFor(() => {
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
        });

        // Verify no console errors were logged
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        
        // Clean up spies
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    test('component renders within MainLayout', () => {
        render(<Show {...mockProps} />);

        // Verify the component is wrapped in MainLayout
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    test('all props are properly structured and accessible', () => {
        const { container } = render(<Show {...mockProps} />);

        // Verify the component renders without throwing errors
        expect(container).toBeInTheDocument();

        // Verify critical data structures are present
        expect(mockProps.activeClass).toBeDefined();
        expect(mockProps.activeSubjects).toHaveLength(2);
        expect(mockProps.gradeWeights).toHaveLength(4);
        expect(mockProps.studentRecaps).toHaveLength(2);
        expect(mockProps.studentLedgers).toHaveLength(2);
        expect(mockProps.kkms).toBeDefined();
        expect(Object.keys(mockProps.kkms)).toHaveLength(2);
    });

    test('URL does not have tab parameter on initial load', () => {
        render(<Show {...mockProps} />);

        // Verify URL doesn't have tab parameter
        expect(window.location.search).toBe('');
        
        // Verify default tab is shown
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'active');
    });

    test('semester information is displayed correctly', () => {
        render(<Show {...mockProps} />);

        // Verify semester is shown in the info banner context
        const infoBanner = screen.getByText(/Informasi Perhitungan Rekap Nilai Kelas/i).closest('div');
        expect(infoBanner).toBeInTheDocument();
        
        // Verify semester selector shows correct value
        const semesterSelect = screen.getByRole('combobox');
        expect(semesterSelect).toHaveValue('Ganjil');
    });

    test('handles Semester Genap correctly', () => {
        const genapProps = {
            ...mockProps,
            semester: {
                name: 'Genap',
            },
        };

        render(<Show {...genapProps} />);

        // Verify Genap-specific formula is shown in info banner
        expect(screen.getByText(/Semester Genap:/i)).toBeInTheDocument();
        expect(screen.getByText(/\(Ganjil \+ \(2 × Genap\)\) \/ 3/i)).toBeInTheDocument();
    });
});

describe('Show Component - Integration Test: Page Load with Tab Parameter', () => {
    let mockProps;
    let consoleErrorSpy;
    let consoleWarnSpy;

    beforeEach(() => {
        // Spy on console errors and warnings
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock data that matches the expected structure from the backend
        mockProps = {
            activeClass: {
                id: 1,
                kelas: {
                    name: '7A',
                },
                kelas_paralel: {
                    name: 'Reguler',
                },
                teacher: {
                    name: 'Pak Ahmad',
                },
            },
            activeSubjects: [
                {
                    id: 1,
                    mapel_id: 10,
                    mapel: {
                        name: 'Matematika',
                    },
                },
                {
                    id: 2,
                    mapel_id: 11,
                    mapel: {
                        name: 'Bahasa Indonesia',
                    },
                },
            ],
            gradeWeights: [
                {
                    id: 1,
                    name: 'UH1',
                    weight: 20,
                },
                {
                    id: 2,
                    name: 'UTS',
                    weight: 30,
                },
                {
                    id: 3,
                    name: 'UH2',
                    weight: 20,
                },
                {
                    id: 4,
                    name: 'UAS',
                    weight: 30,
                },
            ],
            studentRecaps: [
                {
                    student_id: 1,
                    name: 'Ahmad',
                    nomor_induk: '12345',
                    subjects: {
                        1: { final_score: 85 },
                        2: { final_score: 78 },
                    },
                    total_score: 163,
                    average_score: 81.5,
                    rank: 1,
                },
                {
                    student_id: 2,
                    name: 'Budi',
                    nomor_induk: '12346',
                    subjects: {
                        1: { final_score: 75 },
                        2: { final_score: 80 },
                    },
                    total_score: 155,
                    average_score: 77.5,
                    rank: 2,
                },
            ],
            studentLedgers: [
                {
                    student_id: 1,
                    name: 'Ahmad',
                    nomor_induk: '12345',
                    subjects: {
                        1: {
                            weights: { 1: 80, 2: 85, 3: 88, 4: 87 },
                            final_score: 85,
                        },
                        2: {
                            weights: { 1: 75, 2: 78, 3: 80, 4: 79 },
                            final_score: 78,
                        },
                    },
                    total_score: 163,
                    average_score: 81.5,
                    rank: 1,
                },
                {
                    student_id: 2,
                    name: 'Budi',
                    nomor_induk: '12346',
                    subjects: {
                        1: {
                            weights: { 1: 70, 2: 75, 3: 78, 4: 76 },
                            final_score: 75,
                        },
                        2: {
                            weights: { 1: 78, 2: 80, 3: 82, 4: 81 },
                            final_score: 80,
                        },
                    },
                    total_score: 155,
                    average_score: 77.5,
                    rank: 2,
                },
            ],
            academicYear: {
                name: '2024/2025',
            },
            semester: {
                name: 'Ganjil',
            },
            kkms: {
                10: { kkm_value: 75 },
                11: { kkm_value: 70 },
            },
        };
    });

    test('navigating to /recap/class/1?tab=ledger shows the Ledger tab', () => {
        // Set URL with tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=ledger');

        const { container } = render(<Show {...mockProps} />);

        // Verify the Ledger tab is active (has data-state="active")
        const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
        expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

        // Verify the Rekap Nilai tab is inactive
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'inactive');

        // Verify the Ledger tab content is visible
        const ledgerContent = screen.getByTestId('ledger-tab');
        expect(ledgerContent).toBeInTheDocument();
        expect(ledgerContent).toBeVisible();
    });

    test('page loads correctly with tab parameter and all required data', () => {
        // Set URL with tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=ledger');

        render(<Show {...mockProps} />);

        // Verify page title
        expect(document.title).toBe('Rekap Nilai - 7A');

        // Verify header information
        expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
        expect(screen.getByText(/7A Reguler - Pak Ahmad/i)).toBeInTheDocument();

        // Verify semester selector
        const semesterSelect = screen.getByRole('combobox');
        expect(semesterSelect).toHaveValue('Ganjil');

        // Verify info banner is present
        expect(screen.getByText(/Informasi Perhitungan Rekap Nilai Kelas/i)).toBeInTheDocument();

        // Verify both tab triggers are present
        expect(screen.getByRole('tab', { name: /rekap nilai/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /ledger/i })).toBeInTheDocument();

        // Verify the Ledger tab is active
        const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
        expect(ledgerTrigger).toHaveAttribute('data-state', 'active');
    });

    test('tab parameter is properly read from URL', () => {
        // Set URL with tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=ledger');

        render(<Show {...mockProps} />);

        // Verify URL has tab parameter
        expect(window.location.search).toBe('?tab=ledger');
        
        // Verify Ledger tab is shown based on URL parameter
        const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
        expect(ledgerTrigger).toHaveAttribute('data-state', 'active');
    });

    test('all required data is passed to LedgerTab component when tab=ledger', () => {
        // Set URL with tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=ledger');

        render(<Show {...mockProps} />);

        // Verify data is passed correctly to the LedgerTab
        expect(screen.getByTestId('grade-weights-count')).toHaveTextContent('4');
        expect(screen.getByTestId('student-ledgers-count')).toHaveTextContent('2');
    });

    test('ensures no console errors occur during page load with tab parameter', async () => {
        // Set URL with tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=ledger');

        render(<Show {...mockProps} />);

        // Wait for any async operations to complete
        await waitFor(() => {
            expect(screen.getByTestId('ledger-tab')).toBeInTheDocument();
        });

        // Verify no console errors were logged
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        
        // Clean up spies
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    test('handles invalid tab parameter gracefully', () => {
        // Set URL with invalid tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=invalid');

        render(<Show {...mockProps} />);

        // Should default to Rekap tab when tab parameter is invalid
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'active');

        // Verify Rekap Nilai tab content is visible
        const rekapContent = screen.getByTestId('rekap-nilai-tab');
        expect(rekapContent).toBeInTheDocument();
        expect(rekapContent).toBeVisible();
    });

    test('tab parameter is case-sensitive', () => {
        // Set URL with uppercase tab parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=LEDGER');

        render(<Show {...mockProps} />);

        // Should default to Rekap tab when tab parameter case doesn't match
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'active');
    });

    test('navigating to /recap/class/1?tab=rekap shows the Rekap tab explicitly', () => {
        // Set URL with tab=rekap parameter
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1?tab=rekap');

        render(<Show {...mockProps} />);

        // Verify the Rekap Nilai tab is active
        const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
        expect(rekapTrigger).toHaveAttribute('data-state', 'active');

        // Verify the Ledger tab is inactive
        const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
        expect(ledgerTrigger).toHaveAttribute('data-state', 'inactive');

        // Verify the Rekap Nilai tab content is visible
        const rekapContent = screen.getByTestId('rekap-nilai-tab');
        expect(rekapContent).toBeInTheDocument();
        expect(rekapContent).toBeVisible();
    });
});
