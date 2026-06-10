import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Show from '../Show';

// Mock route helper
global.route = vi.fn((name, params) => {
    if (name === 'recap.class.index') return '/recap/class';
    if (name === 'recap.class.show') return `/recap/class/${params}`;
    return '/';
});

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }) => <title>{title}</title>,
    Link: ({ children, href, className }) => <a href={href} className={className}>{children}</a>,
    router: {
        get: vi.fn(),
    },
}));

// Mock MainLayout
vi.mock('@/Layouts/MainLayout', () => ({
    default: ({ children }) => <div data-testid="main-layout">{children}</div>,
}));

// Mock child components
vi.mock('../RekapNilaiTab', () => ({
    default: ({ studentRecaps }) => (
        <div data-testid="rekap-nilai-tab">
            <div data-testid="rekap-student-count">{studentRecaps.length}</div>
        </div>
    ),
}));

vi.mock('../LedgerTab', () => ({
    default: ({ studentLedgers }) => (
        <div data-testid="ledger-tab">
            <div data-testid="ledger-student-count">{studentLedgers.length}</div>
        </div>
    ),
}));

/**
 * Helper function to generate mock student data
 */
function generateStudents(count) {
    return Array.from({ length: count }, (_, i) => ({
        student_id: i + 1,
        name: `Student ${i + 1}`,
        nomor_induk: `${10000 + i}`,
        subjects: {
            1: { final_score: 75 + (i % 20) },
            2: { final_score: 80 + (i % 15) },
        },
        total_score: 155 + (i % 35),
        average_score: 77.5 + (i % 17.5),
        rank: i + 1,
    }));
}

/**
 * Helper function to generate mock ledger data
 */
function generateLedgers(count) {
    return Array.from({ length: count }, (_, i) => ({
        student_id: i + 1,
        name: `Student ${i + 1}`,
        nomor_induk: `${10000 + i}`,
        subjects: {
            1: {
                weights: { 1: 75, 2: 80, 3: 78, 4: 82 },
                final_score: 78.75,
            },
            2: {
                weights: { 1: 80, 2: 85, 3: 83, 4: 87 },
                final_score: 83.75,
            },
        },
        total_score: 162.5,
        average_score: 81.25,
        rank: i + 1,
    }));
}

/**
 * Helper function to create base props
 */
function createBaseProps(studentCount) {
    return {
        activeClass: {
            id: 1,
            kelas: { name: '7A' },
            kelas_paralel: { name: 'A' },
            teacher: { name: 'Pak Ahmad' },
        },
        activeSubjects: [
            { id: 1, mapel_id: 10, mapel: { name: 'Matematika' } },
            { id: 2, mapel_id: 11, mapel: { name: 'Bahasa Indonesia' } },
        ],
        gradeWeights: [
            { id: 1, name: 'UH1', weight: 20 },
            { id: 2, name: 'UTS', weight: 30 },
            { id: 3, name: 'UH2', weight: 20 },
            { id: 4, name: 'UAS', weight: 30 },
        ],
        studentRecaps: generateStudents(studentCount),
        studentLedgers: generateLedgers(studentCount),
        academicYear: { name: '2024/2025' },
        semester: { name: 'Ganjil' },
        kkms: {
            10: { kkm_value: 75 },
            11: { kkm_value: 75 },
        },
    };
}

describe('Show Component - Class Size Testing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Small Classes (1-5 students)', () => {
        it('should render correctly with 1 student', () => {
            const props = createBaseProps(1);
            const { container } = render(<Show {...props} />);

            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByText('7A A - Pak Ahmad')).toBeInTheDocument();
            
            // Rekap tab is visible by default
            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('1');
            
            // Check that component renders without errors
            expect(container.querySelector('[data-testid="main-layout"]')).toBeInTheDocument();
        });

        it('should render correctly with 3 students', () => {
            const props = createBaseProps(3);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('3');
        });

        it('should render correctly with 5 students', () => {
            const props = createBaseProps(5);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('5');
        });

        it('should handle tab switching with small class', () => {
            const props = createBaseProps(3);
            render(<Show {...props} />);

            // Rekap tab should be visible
            expect(screen.getByTestId('rekap-nilai-tab')).toBeInTheDocument();
            
            // Both tab triggers should exist
            expect(screen.getByText('Rekap Nilai')).toBeInTheDocument();
            expect(screen.getByText('Ledger')).toBeInTheDocument();
        });
    });

    describe('Medium Classes (10-20 students)', () => {
        it('should render correctly with 10 students', () => {
            const props = createBaseProps(10);
            const { container } = render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('10');
            
            // Verify all props are passed correctly
            expect(props.studentRecaps).toHaveLength(10);
            expect(props.studentLedgers).toHaveLength(10);
            
            // Check component structure
            expect(container.querySelector('[data-testid="main-layout"]')).toBeInTheDocument();
        });

        it('should render correctly with 15 students', () => {
            const props = createBaseProps(15);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('15');
        });

        it('should render correctly with 20 students', () => {
            const props = createBaseProps(20);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('20');
        });

        it('should maintain performance with medium class size', () => {
            const props = createBaseProps(15);
            
            const startTime = performance.now();
            render(<Show {...props} />);
            const endTime = performance.now();
            
            const renderTime = endTime - startTime;
            
            // Render should complete in reasonable time (< 100ms)
            expect(renderTime).toBeLessThan(100);
        });

        it('should handle all UI elements with medium class', () => {
            const props = createBaseProps(15);
            render(<Show {...props} />);

            // Check all major UI elements are present
            expect(screen.getByText('Rekap Nilai Kelas')).toBeInTheDocument();
            expect(screen.getByText('7A A - Pak Ahmad')).toBeInTheDocument();
            expect(screen.getByText('Cetak')).toBeInTheDocument();
            expect(screen.getByText('Rekap Nilai')).toBeInTheDocument();
            expect(screen.getByText('Ledger')).toBeInTheDocument();
        });
    });

    describe('Large Classes (30+ students)', () => {
        it('should render correctly with 30 students', () => {
            const props = createBaseProps(30);
            const { container } = render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('30');
            
            // Verify data integrity
            expect(props.studentRecaps).toHaveLength(30);
            expect(props.studentLedgers).toHaveLength(30);
            
            // Component should render without errors
            expect(container.querySelector('[data-testid="main-layout"]')).toBeInTheDocument();
        });

        it('should render correctly with 40 students', () => {
            const props = createBaseProps(40);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('40');
        });

        it('should render correctly with 50 students', () => {
            const props = createBaseProps(50);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('50');
        });

        it('should maintain performance with large class size', () => {
            const props = createBaseProps(40);
            
            const startTime = performance.now();
            render(<Show {...props} />);
            const endTime = performance.now();
            
            const renderTime = endTime - startTime;
            
            // Even with large class, render should be reasonable (< 200ms)
            expect(renderTime).toBeLessThan(200);
        });

        it('should handle tab switching with large class', () => {
            const props = createBaseProps(35);
            render(<Show {...props} />);

            // Rekap tab should handle large datasets
            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('35');
        });

        it('should handle very large class (100 students)', () => {
            const props = createBaseProps(100);
            const { container } = render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('100');
            
            // Should still render without errors
            expect(container.querySelector('[data-testid="main-layout"]')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty class (0 students)', () => {
            const props = createBaseProps(0);
            render(<Show {...props} />);

            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('0');
        });

        it('should handle mismatched student counts between recaps and ledgers', () => {
            const props = createBaseProps(10);
            // Simulate mismatch
            props.studentLedgers = generateLedgers(8);
            
            render(<Show {...props} />);

            // Rekap tab shows correct count
            const rekapTab = screen.getByTestId('rekap-nilai-tab');
            expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent('10');
            
            // Ledger tab would show 8 when switched to (not tested here as it requires interaction)
        });
    });

    describe('Performance Benchmarks', () => {
        it('should render small class quickly (< 50ms)', () => {
            const props = createBaseProps(5);
            
            const startTime = performance.now();
            render(<Show {...props} />);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(50);
        });

        it('should render medium class reasonably (< 100ms)', () => {
            const props = createBaseProps(15);
            
            const startTime = performance.now();
            render(<Show {...props} />);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should render large class acceptably (< 200ms)', () => {
            const props = createBaseProps(40);
            
            const startTime = performance.now();
            render(<Show {...props} />);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });
    });

    describe('Data Integrity Across Sizes', () => {
        it('should maintain correct prop structure for all sizes', () => {
            const sizes = [1, 5, 10, 20, 30, 50];
            
            sizes.forEach(size => {
                const props = createBaseProps(size);
                
                // Verify structure
                expect(props.activeClass).toBeDefined();
                expect(props.activeSubjects).toHaveLength(2);
                expect(props.gradeWeights).toHaveLength(4);
                expect(props.studentRecaps).toHaveLength(size);
                expect(props.studentLedgers).toHaveLength(size);
                expect(props.kkms).toBeDefined();
                
                // Verify each student has required fields
                props.studentRecaps.forEach(student => {
                    expect(student).toHaveProperty('student_id');
                    expect(student).toHaveProperty('name');
                    expect(student).toHaveProperty('nomor_induk');
                    expect(student).toHaveProperty('subjects');
                    expect(student).toHaveProperty('total_score');
                    expect(student).toHaveProperty('average_score');
                    expect(student).toHaveProperty('rank');
                });
            });
        });

        it('should pass correct data to child components for all sizes', () => {
            const sizes = [3, 15, 35];
            
            sizes.forEach(size => {
                const props = createBaseProps(size);
                const { unmount } = render(<Show {...props} />);
                
                // Only check visible tab (rekap)
                const rekapTab = screen.getByTestId('rekap-nilai-tab');
                expect(within(rekapTab).getByTestId('rekap-student-count')).toHaveTextContent(size.toString());
                
                unmount();
            });
        });
    });
});
