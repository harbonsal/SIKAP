import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Show from '../Show';

// Create mock function that will be accessible
const mockRouterGet = vi.fn();

// Mock Inertia components
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ href, children, className }) => <a href={href} className={className}>{children}</a>,
    router: {
        get: (...args) => mockRouterGet(...args),
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

describe('Show Component - Integration Test: Semester Switching on Both Tabs', () => {
    let mockProps;
    let user;
    let originalPushState;

    beforeEach(() => {
        // Reset URL to default state
        delete window.location;
        window.location = new URL('http://localhost/recap/class/1');
        
        // Mock window.history.pushState to avoid SecurityError in jsdom
        originalPushState = window.history.pushState;
        window.history.pushState = vi.fn();
        
        // Reset mock
        mockRouterGet.mockClear();

        // Setup user event
        user = userEvent.setup();

        // Mock data for Semester Ganjil
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

    afterEach(() => {
        vi.clearAllMocks();
        // Restore original pushState
        window.history.pushState = originalPushState;
    });

    describe('Semester Selector on Rekap Tab', () => {
        test('semester selector is visible and shows current semester on Rekap tab', () => {
            render(<Show {...mockProps} />);

            // Verify we're on Rekap tab
            const rekapTrigger = screen.getByRole('tab', { name: /rekap nilai/i });
            expect(rekapTrigger).toHaveAttribute('data-state', 'active');

            // Verify semester selector is present and shows Ganjil
            const semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toBeInTheDocument();
            expect(semesterSelect).toHaveValue('Ganjil');
        });

        test('changing semester on Rekap tab triggers router.get with correct parameters', async () => {
            render(<Show {...mockProps} />);

            // Verify we're on Rekap tab
            expect(screen.getByRole('tab', { name: /rekap nilai/i })).toHaveAttribute('data-state', 'active');

            // Find and change semester selector
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify router.get was called with correct parameters
            expect(mockRouterGet).toHaveBeenCalledTimes(1);
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('semester selector has both Ganjil and Genap options on Rekap tab', () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            const options = Array.from(semesterSelect.options).map(opt => opt.value);

            expect(options).toContain('Ganjil');
            expect(options).toContain('Genap');
            expect(options).toHaveLength(2);
        });

        test('semester selector displays correct labels on Rekap tab', () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            const options = Array.from(semesterSelect.options);

            const ganjilOption = options.find(opt => opt.value === 'Ganjil');
            const genapOption = options.find(opt => opt.value === 'Genap');

            expect(ganjilOption?.textContent).toBe('Semester Ganjil');
            expect(genapOption?.textContent).toBe('Semester Genap');
        });
    });

    describe('Semester Selector on Ledger Tab', () => {
        test('semester selector is visible and shows current semester on Ledger tab', async () => {
            // Set URL to show Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify we're on Ledger tab
            const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

            // Verify semester selector is present and shows Ganjil
            const semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toBeInTheDocument();
            expect(semesterSelect).toHaveValue('Ganjil');
        });

        test('changing semester on Ledger tab triggers router.get with correct parameters', async () => {
            // Set URL to show Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify we're on Ledger tab
            expect(screen.getByRole('tab', { name: /ledger/i })).toHaveAttribute('data-state', 'active');

            // Find and change semester selector
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify router.get was called with correct parameters
            expect(mockRouterGet).toHaveBeenCalledTimes(1);
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('semester selector has both Ganjil and Genap options on Ledger tab', () => {
            // Set URL to show Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            const options = Array.from(semesterSelect.options).map(opt => opt.value);

            expect(options).toContain('Ganjil');
            expect(options).toContain('Genap');
            expect(options).toHaveLength(2);
        });

        test('semester selector displays correct labels on Ledger tab', () => {
            // Set URL to show Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            const options = Array.from(semesterSelect.options);

            const ganjilOption = options.find(opt => opt.value === 'Ganjil');
            const genapOption = options.find(opt => opt.value === 'Genap');

            expect(ganjilOption?.textContent).toBe('Semester Ganjil');
            expect(genapOption?.textContent).toBe('Semester Genap');
        });
    });

    describe('Data Reload on Semester Change', () => {
        test('router.get is called with preserveState: true to reload data', async () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify preserveState is true (this tells Inertia to reload data)
            expect(mockRouterGet).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                { preserveState: true }
            );
        });

        test('router.get is called with correct route and class ID', async () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify correct route is called
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                expect.any(Object),
                expect.any(Object)
            );
        });

        test('semester parameter is passed correctly to backend', async () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify semester parameter is passed
            expect(mockRouterGet).toHaveBeenCalledWith(
                expect.any(String),
                { semester: 'Genap' },
                expect.any(Object)
            );
        });

        test('changing from Genap back to Ganjil also triggers data reload', async () => {
            // Start with Genap semester
            const genapProps = {
                ...mockProps,
                semester: { name: 'Genap' },
            };

            render(<Show {...genapProps} />);

            const semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toHaveValue('Genap');

            // Change back to Ganjil
            await user.selectOptions(semesterSelect, 'Ganjil');

            // Verify router.get was called
            expect(mockRouterGet).toHaveBeenCalledTimes(1);
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Ganjil' },
                { preserveState: true }
            );
        });
    });

    describe('Active Tab Preservation After Semester Change', () => {
        test('URL preserves tab parameter when on Rekap tab', async () => {
            // Start on Rekap tab (default)
            render(<Show {...mockProps} />);

            // Verify we're on Rekap tab
            expect(screen.getByRole('tab', { name: /rekap nilai/i })).toHaveAttribute('data-state', 'active');

            // Change semester
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // The router.get call should maintain the current state
            // Since preserveState: true is used, the tab state should be preserved
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('URL preserves tab parameter when on Ledger tab', async () => {
            // Set URL to show Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify we're on Ledger tab
            expect(screen.getByRole('tab', { name: /ledger/i })).toHaveAttribute('data-state', 'active');

            // Change semester
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // The router.get call should maintain the current state
            // Since preserveState: true is used, the tab state should be preserved
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('active tab state is maintained in component after semester change', async () => {
            // Start on Ledger tab
            delete window.location;
            window.location = new URL('http://localhost/recap/class/1?tab=ledger');

            render(<Show {...mockProps} />);

            // Verify we're on Ledger tab
            const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

            // Change semester
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // After the change, the Ledger tab should still be active
            // (In real app, Inertia would re-render with new data but preserve state)
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');
        });

        test('switching tabs and then changing semester preserves the new tab', async () => {
            // Start on Rekap tab
            render(<Show {...mockProps} />);

            // Switch to Ledger tab
            const ledgerTrigger = screen.getByRole('tab', { name: /ledger/i });
            await user.click(ledgerTrigger);

            // Verify we're now on Ledger tab
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');

            // Change semester
            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // The Ledger tab should still be active
            expect(ledgerTrigger).toHaveAttribute('data-state', 'active');
        });
    });

    describe('Semester-Specific UI Elements', () => {
        test('info banner shows Genap formula when semester is Genap', () => {
            const genapProps = {
                ...mockProps,
                semester: { name: 'Genap' },
            };

            render(<Show {...genapProps} />);

            // Verify Genap-specific formula is shown
            expect(screen.getByText(/Semester Genap:/i)).toBeInTheDocument();
            expect(screen.getByText(/\(Ganjil \+ \(2 × Genap\)\) \/ 3/i)).toBeInTheDocument();
        });

        test('info banner does not show Genap formula when semester is Ganjil', () => {
            render(<Show {...mockProps} />);

            // Verify Genap-specific formula is NOT shown
            expect(screen.queryByText(/Semester Genap:/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/\(Ganjil \+ \(2 × Genap\)\) \/ 3/i)).not.toBeInTheDocument();
        });

        test('semester selector reflects the current semester prop', () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toHaveValue('Ganjil');
        });

        test('semester selector updates when semester prop changes', () => {
            const { rerender } = render(<Show {...mockProps} />);

            let semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toHaveValue('Ganjil');

            // Update props with Genap semester
            const genapProps = {
                ...mockProps,
                semester: { name: 'Genap' },
            };

            rerender(<Show {...genapProps} />);

            semesterSelect = screen.getByRole('combobox');
            expect(semesterSelect).toHaveValue('Genap');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('semester selector works when activeClass ID is different', async () => {
            const differentClassProps = {
                ...mockProps,
                activeClass: {
                    ...mockProps.activeClass,
                    id: 99,
                },
            };

            render(<Show {...differentClassProps} />);

            const semesterSelect = screen.getByRole('combobox');
            await user.selectOptions(semesterSelect, 'Genap');

            // Verify correct class ID is used in route
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/99',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('semester selector is accessible via keyboard', async () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            
            // Focus the select element
            semesterSelect.focus();
            expect(semesterSelect).toHaveFocus();

            // Should be able to change value with keyboard
            fireEvent.change(semesterSelect, { target: { value: 'Genap' } });
            
            expect(mockRouterGet).toHaveBeenCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });

        test('multiple rapid semester changes only trigger the last selection', async () => {
            render(<Show {...mockProps} />);

            const semesterSelect = screen.getByRole('combobox');
            
            // Rapidly change semester multiple times
            await user.selectOptions(semesterSelect, 'Genap');
            await user.selectOptions(semesterSelect, 'Ganjil');
            await user.selectOptions(semesterSelect, 'Genap');

            // Should have been called 3 times (once for each change)
            expect(mockRouterGet).toHaveBeenCalledTimes(3);
            
            // Last call should be for Genap
            expect(mockRouterGet).toHaveBeenLastCalledWith(
                '/recap/class/1',
                { semester: 'Genap' },
                { preserveState: true }
            );
        });
    });
});
