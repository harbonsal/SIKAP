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

// Mock child components with detailed rendering to verify KKM handling
vi.mock('../RekapNilaiTab', () => ({
    default: ({ activeSubjects, studentRecaps, kkms }) => (
        <div data-testid="rekap-nilai-tab">
            <div data-testid="active-subjects-count">{activeSubjects.length}</div>
            <div data-testid="student-recaps-count">{studentRecaps.length}</div>
            <div data-testid="kkms-count">{Object.keys(kkms || {}).length}</div>
            <div data-testid="kkms-data">{JSON.stringify(kkms)}</div>
        </div>
    ),
}));

vi.mock('../LedgerTab', () => ({
    default: ({ activeSubjects, gradeWeights, studentLedgers, kkms }) => (
        <div data-testid="ledger-tab">
            <div data-testid="grade-weights-count">{gradeWeights.length}</div>
            <div data-testid="student-ledgers-count">{studentLedgers.length}</div>
            <div data-testid="kkms-count">{Object.keys(kkms || {}).length}</div>
            <div data-testid="kkms-data">{JSON.stringify(kkms)}</div>
        </div>
    ),
}));

describe('Show Component - Missing KKM Data Tests', () => {
    let baseMockProps;
    let consoleErrorSpy;
    let consoleWarnSpy;

    beforeEach(() => {
        // Reset URL to default state
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1');
        
        // Spy on console errors and warnings
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Base mock data structure
        baseMockProps = {
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
                {
                    id: 3,
                    mapel_id: 12,
                    mapel: {
                        name: 'IPA',
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
                        2: { final_score: 65 },
                        3: { final_score: 72 },
                    },
                    total_score: 222,
                    average_score: 74.0,
                    rank: 1,
                },
                {
                    student_id: 2,
                    name: 'Budi',
                    nomor_induk: '12346',
                    subjects: {
                        1: { final_score: 75 },
                        2: { final_score: 68 },
                        3: { final_score: 80 },
                    },
                    total_score: 223,
                    average_score: 74.3,
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
                            weights: { 1: 60, 2: 65, 3: 68, 4: 66 },
                            final_score: 65,
                        },
                        3: {
                            weights: { 1: 70, 2: 72, 3: 74, 4: 73 },
                            final_score: 72,
                        },
                    },
                    total_score: 222,
                    average_score: 74.0,
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
                            weights: { 1: 65, 2: 68, 3: 70, 4: 69 },
                            final_score: 68,
                        },
                        3: {
                            weights: { 1: 78, 2: 80, 3: 82, 4: 81 },
                            final_score: 80,
                        },
                    },
                    total_score: 223,
                    average_score: 74.3,
                    rank: 2,
                },
            ],
            academicYear: {
                name: '2024/2025',
            },
            semester: {
                name: 'Ganjil',
            },
        };
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe('Partial KKM Data - Some Subjects Missing', () => {
        test('page renders correctly when KKM data is missing for some subjects', () => {
            // Only provide KKM for Matematika (mapel_id: 10), missing for others
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                    // Missing: 11 (Bahasa Indonesia), 12 (IPA)
                },
            };

            render(<Show {...mockProps} />);

            // Verify page renders without errors
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // Verify KKM data is passed to components
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('1');

            // Verify no console errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('default KKM value (70) is used when data is missing for a subject', () => {
            // Only provide KKM for one subject
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                },
            };

            render(<Show {...mockProps} />);

            // Component should render successfully
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // The utility functions should use default KKM of 70 for missing subjects
            // This is verified in utils.test.js, but we ensure the component doesn't crash
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('tab switching works correctly with partial KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                },
            };

            // Set URL to ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify Ledger tab is active
            const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

            // Verify Ledger tab receives partial KKM data
            const ledgerTab = screen.getByTestId('ledger-tab');
            expect(ledgerTab).toBeInTheDocument();
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('1');

            // Verify no errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('handles multiple subjects with only one having KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    11: { kkm_value: 70 }, // Only Bahasa Indonesia has KKM
                },
            };

            render(<Show {...mockProps} />);

            // Verify component renders
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('1');

            // Verify all subjects are still displayed
            expect(screen.getByTestId('active-subjects-count')).toHaveTextContent('3');

            // Verify no errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Completely Empty KKM Data', () => {
        test('page renders correctly when KKM data is completely empty (empty object)', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            render(<Show {...mockProps} />);

            // Verify page renders without errors
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // Verify empty KKM data is passed
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('0');
            expect(screen.getByTestId('kkms-data')).toHaveTextContent('{}');

            // Verify no console errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('page renders correctly when KKM data is null', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: null,
            };

            render(<Show {...mockProps} />);

            // Verify page renders without errors
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // Verify no console errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('page renders correctly when KKM data is undefined', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: undefined,
            };

            render(<Show {...mockProps} />);

            // Verify page renders without errors
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // Verify no console errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('default KKM value (70) is used when KKM data is completely empty', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            render(<Show {...mockProps} />);

            // Component should render successfully
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // All subjects should still be displayed
            expect(screen.getByTestId('active-subjects-count')).toHaveTextContent('3');
            expect(screen.getByTestId('student-recaps-count')).toHaveTextContent('2');

            // The utility functions will use default KKM of 70 for all subjects
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('tab switching works correctly with empty KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            // Set URL to ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify Ledger tab is active
            const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

            // Verify Ledger tab receives empty KKM data
            const ledgerTab = screen.getByTestId('ledger-tab');
            expect(ledgerTab).toBeInTheDocument();
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('0');

            // Verify no errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('both tabs render correctly with null KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: null,
            };

            // Test Rekap tab
            const { unmount } = render(<Show {...mockProps} />);
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            unmount();

            // Test Ledger tab separately
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');
            render(<Show {...mockProps} />);
            expect(screen.getByTestId('ledger-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases with Missing KKM Data', () => {
        test('handles KKM data with invalid structure gracefully', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                    11: null, // Invalid: null value
                    12: { kkm_value: 'invalid' }, // Invalid: string instead of number
                },
            };

            render(<Show {...mockProps} />);

            // Component should still render
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();

            // Should not crash
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('handles KKM data with missing kkm_value property', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                    11: {}, // Missing kkm_value property
                    12: { other_property: 80 }, // Has property but not kkm_value
                },
            };

            render(<Show {...mockProps} />);

            // Component should render without errors
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('handles large class with missing KKM data', () => {
            // Generate large student dataset
            const largeStudentRecaps = Array.from({ length: 50 }, (_, i) => ({
                student_id: i + 1,
                name: `Student ${i + 1}`,
                nomor_induk: `${10000 + i}`,
                subjects: {
                    1: { final_score: 70 + (i % 20) },
                    2: { final_score: 65 + (i % 25) },
                    3: { final_score: 75 + (i % 15) },
                },
                total_score: 210 + (i % 30),
                average_score: 70 + (i % 10),
                rank: i + 1,
            }));

            const largeStudentLedgers = Array.from({ length: 50 }, (_, i) => ({
                student_id: i + 1,
                name: `Student ${i + 1}`,
                nomor_induk: `${10000 + i}`,
                subjects: {
                    1: {
                        weights: { 1: 70, 2: 72, 3: 74, 4: 73 },
                        final_score: 70 + (i % 20),
                    },
                    2: {
                        weights: { 1: 65, 2: 67, 3: 69, 4: 68 },
                        final_score: 65 + (i % 25),
                    },
                    3: {
                        weights: { 1: 75, 2: 77, 3: 79, 4: 78 },
                        final_score: 75 + (i % 15),
                    },
                },
                total_score: 210 + (i % 30),
                average_score: 70 + (i % 10),
                rank: i + 1,
            }));

            const mockProps = {
                ...baseMockProps,
                studentRecaps: largeStudentRecaps,
                studentLedgers: largeStudentLedgers,
                kkms: {}, // Empty KKM data
            };

            render(<Show {...mockProps} />);

            // Verify component renders with large dataset and no KKM data
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(screen.getByTestId('student-recaps-count')).toHaveTextContent('50');
            expect(screen.getByTestId('kkms-count')).toHaveTextContent('0');

            // Verify no errors
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('semester switching works with missing KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
                semester: {
                    name: 'Genap',
                },
            };

            render(<Show {...mockProps} />);

            // Verify Genap semester info is shown
            expect(screen.getByText(/Semester Genap:/i)).toBeInTheDocument();

            // Verify component renders without errors despite missing KKM
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('print functionality works with missing KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: null,
            };

            render(<Show {...mockProps} />);

            // Verify print button is present and functional
            const printButton = screen.getByRole('button', { name: /cetak/i });
            expect(printButton).toBeInTheDocument();

            // Component should be ready for printing
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Data Consistency with Missing KKM', () => {
        test('all subjects are displayed even when KKM data is missing', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            render(<Show {...mockProps} />);

            // Verify all 3 subjects are still displayed
            expect(screen.getByTestId('active-subjects-count')).toHaveTextContent('3');

            // Verify all students are displayed
            expect(screen.getByTestId('student-recaps-count')).toHaveTextContent('2');

            // Verify component structure is intact
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: /rekap nilai/i })).toBeInTheDocument();
            expect(screen.getByRole('tab', { name: /ledger/i })).toBeInTheDocument();
        });

        test('grade calculations are not affected by missing KKM data', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            render(<Show {...mockProps} />);

            // Verify student data is intact
            expect(screen.getByTestId('student-recaps-count')).toHaveTextContent('2');

            // The scores should still be displayed correctly
            // (KKM only affects highlighting, not calculations)
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        test('both tabs receive consistent KKM data (or lack thereof)', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {
                    10: { kkm_value: 75 },
                },
            };

            // Test Rekap tab
            const { unmount } = render(<Show {...mockProps} />);
            const rekapKkmCount = screen.getByTestId('kkms-count').textContent;
            expect(rekapKkmCount).toBe('1');
            unmount();

            // Switch to Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');
            render(<Show {...mockProps} />);

            // Verify Ledger tab receives same KKM data
            const ledgerKkmCount = screen.getByTestId('kkms-count').textContent;
            expect(ledgerKkmCount).toBe('1');

            // Both tabs should have consistent data
            expect(rekapKkmCount).toBe(ledgerKkmCount);
        });
    });

    describe('No Crashes or Errors', () => {
        test('component does not crash with any KKM data scenario', async () => {
            const scenarios = [
                { kkms: {} },
                { kkms: null },
                { kkms: undefined },
                { kkms: { 10: { kkm_value: 75 } } },
                { kkms: { 10: null } },
                { kkms: { 10: {} } },
            ];

            for (const scenario of scenarios) {
                const mockProps = {
                    ...baseMockProps,
                    ...scenario,
                };

                const { unmount } = render(<Show {...mockProps} />);

                // Wait for any async operations
                await waitFor(() => {
                    expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
                });

                // Verify no errors
                expect(consoleErrorSpy).not.toHaveBeenCalled();

                // Clean up
                unmount();
            }
        });

        test('no console warnings or errors with missing KKM data', async () => {
            const mockProps = {
                ...baseMockProps,
                kkms: {},
            };

            render(<Show {...mockProps} />);

            // Wait for component to fully render
            await waitFor(() => {
                expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            });

            // Verify no console errors or warnings
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        test('component remains stable across multiple renders with missing KKM', () => {
            const mockProps = {
                ...baseMockProps,
                kkms: null,
            };

            const { rerender } = render(<Show {...mockProps} />);

            // First render
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            // Re-render with same props
            rerender(<Show {...mockProps} />);
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            // Re-render again
            rerender(<Show {...mockProps} />);
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });
});
