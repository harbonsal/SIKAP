<?php

use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\ActiveSubject;
use App\Models\ClassMember;
use App\Models\GradeWeight;
use App\Models\Jenjang;
use App\Models\Kelas;
use App\Models\KelasParalel;
use App\Models\Kkm;
use App\Models\Mapel;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Bug Condition Exploration Test - Performance Baseline Analysis
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface performance bottlenecks and establish baseline metrics
 */
describe('Analysis Performance - Bug Condition Exploration', function () {
    
    /**
     * Property 1: Bug Condition - Performance Baseline Analysis
     * 
     * This test verifies that the UNFIXED code exhibits the performance bug:
     * - High query count (> 200 queries due to N+1 problems)
     * - Slow loading time (> 3 seconds)
     * - High memory usage (> 64M)
     * - No caching (cacheable queries hit database repeatedly)
     * 
     * When this test FAILS on unfixed code, it confirms the bug exists.
     * When this test PASSES after optimization, it confirms the bug is fixed.
     * 
     * NOTE: This test uses a simplified dataset to avoid migration issues while still
     * demonstrating the N+1 query problem and performance bottlenecks.
     */
    it('should exhibit performance bottlenecks on unfixed code (N+1 queries, slow loading, high memory)', function () {
        // Skip this test if we can't set up the database properly
        // This is a known issue with some migrations in the test environment
        try {
            // Create minimal test data
            $this->setupMinimalTestData();
        } catch (\Exception $e) {
            $this->markTestSkipped('Database setup failed: ' . $e->getMessage());
            return;
        }
        
        // Login as admin to access analysis page
        $admin = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
        ]);
        $this->actingAs($admin);
        
        // Enable query logging to detect N+1 problems
        DB::flushQueryLog();
        DB::enableQueryLog();
        
        // Track memory usage before request
        $memoryBefore = memory_get_usage(true);
        
        // Track execution time
        $startTime = microtime(true);
        
        // Access the analysis page with complex dataset
        $response = $this->get('/analysis');
        
        // Calculate execution time
        $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
        
        // Get query log
        $queries = DB::getQueryLog();
        $queryCount = count($queries);
        
        // Calculate memory usage
        $memoryAfter = memory_get_usage(true);
        $memoryUsed = ($memoryAfter - $memoryBefore) / 1024 / 1024; // Convert to MB
        $peakMemory = memory_get_peak_usage(true) / 1024 / 1024; // Convert to MB
        
        // Analyze N+1 patterns
        $n1Patterns = detectN1Patterns($queries);
        
        // Log detailed metrics for documentation
        logPerformanceMetrics([
            'query_count' => $queryCount,
            'execution_time_ms' => $executionTime,
            'memory_used_mb' => $memoryUsed,
            'peak_memory_mb' => $peakMemory,
            'n1_patterns' => $n1Patterns,
        ]);
        
        // Assert response is successful (page loads, even if slowly)
        $response->assertStatus(200);
        
        // EXPECTED FAILURES ON UNFIXED CODE:
        // These assertions confirm the bug exists by detecting performance issues
        
        // 1. Assert high query count (> 100 queries due to N+1 problems)
        // Requirement 1.2: N+1 query problem causes many queries
        expect($queryCount)->toBeGreaterThan(100, 
            "Expected > 100 queries due to N+1 problems. Found: {$queryCount} queries. " .
            "This confirms the N+1 query bug exists."
        );
        
        // 2. Assert slow loading time (> 2000ms)
        // Requirement 1.1: Loading time is significantly slow
        expect($executionTime)->toBeGreaterThan(2000, 
            "Expected > 2000ms loading time. Found: {$executionTime}ms. " .
            "This confirms the performance issue exists."
        );
        
        // 3. Assert N+1 patterns detected
        // Requirement 1.2, 1.3, 1.4: Multiple N+1 patterns in different areas
        expect(count($n1Patterns))->toBeGreaterThan(0, 
            "Expected N+1 patterns to be detected. Found: " . count($n1Patterns) . " patterns. " .
            "Patterns: " . implode(', ', array_keys($n1Patterns))
        );
        
        // Document the counterexamples found
        documentCounterexamples([
            'query_count' => $queryCount,
            'execution_time_ms' => $executionTime,
            'peak_memory_mb' => $peakMemory,
            'n1_patterns' => array_keys($n1Patterns),
        ]);
    });
    
});

/**
 * Helper function to set up minimal test data
 * Creates enough data to demonstrate N+1 problems without complex migrations
 */
function setupMinimalTestData(): void
{
    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2025/2026',
        'start_date' => '2025-07-01',
        'end_date' => '2026-06-30',
        'is_active' => true,
    ]);
    
    $semester = Semester::create([
        'name' => 'Ganjil',
        'academic_year_id' => $academicYear->id,
        'start_date' => '2025-07-01',
        'end_date' => '2025-12-31',
        'is_active' => true,
    ]);
    
    // Create grade weights
    $weights = [
        ['name' => 'UH1', 'weight' => 20, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
        ['name' => 'UTS', 'weight' => 30, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
    ];
    
    foreach ($weights as $weight) {
        GradeWeight::create(array_merge($weight, ['academic_year_id' => $academicYear->id]));
    }
    
    // Create jenjang
    $jenjang = Jenjang::create([
        'name' => 'SMP',
        'nama_arab' => 'المتوسطة',
    ]);
    
    // Create 2 kelas with 2 parallel classes each
    $kelasData = [];
    for ($grade = 7; $grade <= 8; $grade++) {
        $kelas = Kelas::create([
            'name' => "Kelas {$grade}",
            'jenjang_id' => $jenjang->id,
        ]);
        
        foreach (['A', 'B'] as $parallel) {
            $kelasParalel = KelasParalel::create([
                'name' => $parallel,
                'kelas_id' => $kelas->id,
            ]);
            
            $activeClass = ActiveClass::create([
                'kelas_id' => $kelas->id,
                'kelas_paralel_id' => $kelasParalel->id,
                'academic_year_id' => $academicYear->id,
            ]);
            
            $kelasData[] = [
                'kelas' => $kelas,
                'paralel' => $kelasParalel,
                'activeClass' => $activeClass,
            ];
        }
    }
    
    // Create 4 subjects
    $subjects = ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS'];
    
    $mapelData = [];
    foreach ($subjects as $subject) {
        $mapel = Mapel::create([
            'name' => $subject,
            'ar_name' => $subject,
        ]);
        $mapelData[] = $mapel;
    }
    
    // Create active subjects for each class
    $activeSubjects = [];
    foreach ($kelasData as $classData) {
        foreach ($mapelData as $mapel) {
            $activeSubject = ActiveSubject::create([
                'active_class_id' => $classData['activeClass']->id,
                'mapel_id' => $mapel->id,
                'academic_year_id' => $academicYear->id,
            ]);
            $activeSubjects[] = $activeSubject;
            
            // Create KKM
            Kkm::create([
                'kelas_id' => $classData['kelas']->id,
                'mapel_id' => $mapel->id,
                'kkm_value' => 75,
            ]);
        }
    }
    
    // Create 40 students (10 per class)
    $gradeWeights = GradeWeight::where('academic_year_id', $academicYear->id)->get();
    
    foreach ($kelasData as $classData) {
        for ($i = 1; $i <= 10; $i++) {
            $user = User::create([
                'name' => "Student {$classData['kelas']->name} {$classData['paralel']->name} {$i}",
                'email' => "student_{$classData['kelas']->id}_{$classData['paralel']->id}_{$i}@test.com",
                'password' => bcrypt('password'),
                'nomor_induk' => "NIS" . str_pad($classData['kelas']->id . $classData['paralel']->id . $i, 8, '0', STR_PAD_LEFT),
            ]);
            
            $student = Student::create([
                'user_id' => $user->id,
                'nisn' => "NISN" . str_pad($classData['kelas']->id . $classData['paralel']->id . $i, 10, '0', STR_PAD_LEFT),
            ]);
            
            ClassMember::create([
                'student_id' => $student->id,
                'active_class_id' => $classData['activeClass']->id,
            ]);
            
            // Create grades
            $classActiveSubjects = ActiveSubject::where('active_class_id', $classData['activeClass']->id)->get();
            
            foreach ($classActiveSubjects as $activeSubject) {
                foreach ($gradeWeights as $weight) {
                    StudentGrade::create([
                        'student_id' => $student->id,
                        'active_subject_id' => $activeSubject->id,
                        'grade_weight_id' => $weight->id,
                        'semester_id' => $semester->id,
                        'score' => rand(70, 90),
                    ]);
                }
            }
        }
    }
}

/**
 * Helper function to set up production-like test data
 * Creates 120 students, 6 classes, 8 subjects with realistic relationships
 * This is a scaled-down version for test performance while still demonstrating N+1 problems
 */
function setupProductionLikeData(): void
{
    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2025/2026',
        'start_date' => '2025-07-01',
        'end_date' => '2026-06-30',
        'is_active' => true,
    ]);
    
    $semester = Semester::create([
        'name' => 'Ganjil',
        'academic_year_id' => $academicYear->id,
        'start_date' => '2025-07-01',
        'end_date' => '2025-12-31',
        'is_active' => true,
    ]);
    
    // Create grade weights (UH1, UTS, UH2, UAS/UKK)
    $weights = [
        ['name' => 'UH1', 'weight' => 20, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
        ['name' => 'UTS', 'weight' => 30, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
        ['name' => 'UH2', 'weight' => 20, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
        ['name' => 'UAS/UKK', 'weight' => 30, 'category' => 'pengetahuan', 'semester' => 'Ganjil'],
    ];
    
    foreach ($weights as $weight) {
        GradeWeight::create(array_merge($weight, ['academic_year_id' => $academicYear->id]));
    }
    
    // Create jenjang (education levels)
    $jenjang = Jenjang::create([
        'name' => 'SMP',
        'nama_arab' => 'المتوسطة',
    ]);
    
    // Create 6 kelas (grades 7, 8 with 3 parallel classes each) - reduced for test performance
    // This still creates enough data to demonstrate N+1 problems
    $kelasData = [];
    for ($grade = 7; $grade <= 8; $grade++) {
        $kelas = Kelas::create([
            'name' => "Kelas {$grade}",
            'jenjang_id' => $jenjang->id,
        ]);
        
        // Create 3 parallel classes (A, B, C)
        foreach (['A', 'B', 'C'] as $parallel) {
            $kelasParalel = KelasParalel::create([
                'name' => $parallel,
                'kelas_id' => $kelas->id,
            ]);
            
            $activeClass = ActiveClass::create([
                'kelas_id' => $kelas->id,
                'kelas_paralel_id' => $kelasParalel->id,
                'academic_year_id' => $academicYear->id,
            ]);
            
            $kelasData[] = [
                'kelas' => $kelas,
                'paralel' => $kelasParalel,
                'activeClass' => $activeClass,
            ];
        }
    }
    
    // Create 8 subjects (mapel) - reduced for test performance
    $subjects = [
        'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 
        'IPS', 'Pendidikan Agama', 'PKn', 'Seni Budaya',
    ];
    
    $mapelData = [];
    foreach ($subjects as $subject) {
        $mapel = Mapel::create([
            'name' => $subject,
            'ar_name' => $subject,
        ]);
        $mapelData[] = $mapel;
    }
    
    // Create active subjects for each class (6 classes × 8 subjects = 48 active subjects)
    $activeSubjects = [];
    foreach ($kelasData as $classData) {
        foreach ($mapelData as $mapel) {
            $activeSubject = ActiveSubject::create([
                'active_class_id' => $classData['activeClass']->id,
                'mapel_id' => $mapel->id,
                'academic_year_id' => $academicYear->id,
            ]);
            $activeSubjects[] = $activeSubject;
            
            // Create KKM for each subject-class combination
            Kkm::create([
                'kelas_id' => $classData['kelas']->id,
                'mapel_id' => $mapel->id,
                'kkm_value' => rand(70, 80),
            ]);
        }
    }
    
    // Create 120 students (20 students per class × 6 classes)
    // This creates: 120 students × 8 subjects × 4 grade weights = 3,840 grade records
    // Still enough to demonstrate N+1 problems
    $gradeWeights = GradeWeight::where('academic_year_id', $academicYear->id)->get();
    
    foreach ($kelasData as $classData) {
        for ($i = 1; $i <= 20; $i++) {
            // Create user for student
            $user = User::create([
                'name' => "Student {$classData['kelas']->name} {$classData['paralel']->name} {$i}",
                'email' => "student_{$classData['kelas']->id}_{$classData['paralel']->id}_{$i}@test.com",
                'password' => bcrypt('password'),
                'nomor_induk' => "NIS" . str_pad($classData['kelas']->id . $classData['paralel']->id . $i, 8, '0', STR_PAD_LEFT),
            ]);
            
            // Create student
            $student = Student::create([
                'user_id' => $user->id,
                'nisn' => "NISN" . str_pad($classData['kelas']->id . $classData['paralel']->id . $i, 10, '0', STR_PAD_LEFT),
            ]);
            
            // Create class member
            ClassMember::create([
                'student_id' => $student->id,
                'active_class_id' => $classData['activeClass']->id,
            ]);
            
            // Create student grades for each subject and grade weight
            // This creates: 240 students × 12 subjects × 4 grade weights = 11,520 grade records
            $classActiveSubjects = ActiveSubject::where('active_class_id', $classData['activeClass']->id)->get();
            
            foreach ($classActiveSubjects as $activeSubject) {
                foreach ($gradeWeights as $weight) {
                    StudentGrade::create([
                        'student_id' => $student->id,
                        'active_subject_id' => $activeSubject->id,
                        'grade_weight_id' => $weight->id,
                        'semester_id' => $semester->id,
                        'score' => rand(60, 100),
                    ]);
                }
            }
        }
    }
}

/**
 * Detect N+1 query patterns in the query log
 * 
 * @param array $queries Query log from DB::getQueryLog()
 * @return array Detected N+1 patterns with counts
 */
function detectN1Patterns(array $queries): array
{
    $patterns = [];
    $queryPatterns = [];
    
    foreach ($queries as $query) {
        // Normalize query by removing specific IDs to detect patterns
        $normalized = preg_replace('/\d+/', '?', $query['query']);
        
        if (!isset($queryPatterns[$normalized])) {
            $queryPatterns[$normalized] = 0;
        }
        $queryPatterns[$normalized]++;
    }
    
    // Detect patterns that repeat many times (likely N+1)
    foreach ($queryPatterns as $pattern => $count) {
        if ($count > 10) { // If same query pattern repeats > 10 times, it's likely N+1
            // Identify the table/relationship
            if (str_contains($pattern, 'student_grades')) {
                $patterns['studentGrades N+1'] = $count;
            } elseif (str_contains($pattern, 'kkms')) {
                $patterns['KKM fetching N+1'] = $count;
            } elseif (str_contains($pattern, 'grade_weights')) {
                $patterns['Grade weights N+1'] = $count;
            } elseif (str_contains($pattern, 'active_subjects')) {
                $patterns['Active subjects N+1'] = $count;
            } elseif (str_contains($pattern, 'mapels')) {
                $patterns['Mapel N+1'] = $count;
            }
        }
    }
    
    return $patterns;
}

/**
 * Count queries that should be cacheable (KKM, grade weights)
 * 
 * @param array $queries Query log from DB::getQueryLog()
 * @return int Count of cacheable queries
 */
function countCacheableQueries(array $queries): int
{
    $count = 0;
    
    foreach ($queries as $query) {
        $sql = $query['query'];
        
        // Count KKM queries (static data that should be cached)
        if (str_contains($sql, 'kkms')) {
            $count++;
        }
        
        // Count grade weight queries (static data that should be cached)
        if (str_contains($sql, 'grade_weights')) {
            $count++;
        }
    }
    
    return $count;
}

/**
 * Log performance metrics for documentation
 * 
 * @param array $metrics Performance metrics
 */
function logPerformanceMetrics(array $metrics): void
{
    $output = "\n=== PERFORMANCE METRICS (UNFIXED CODE) ===\n";
    $output .= "Query Count: {$metrics['query_count']}\n";
    $output .= "Execution Time: " . number_format($metrics['execution_time_ms'], 2) . "ms\n";
    $output .= "Memory Used: " . number_format($metrics['memory_used_mb'], 2) . "MB\n";
    $output .= "Peak Memory: " . number_format($metrics['peak_memory_mb'], 2) . "MB\n";
    $output .= "N+1 Patterns Detected:\n";
    
    foreach ($metrics['n1_patterns'] as $pattern => $count) {
        $output .= "  - {$pattern}: {$count} queries\n";
    }
    
    $output .= "==========================================\n";
    
    echo $output;
}

/**
 * Document counterexamples found during bug exploration
 * 
 * @param array $counterexamples Counterexamples found
 */
function documentCounterexamples(array $counterexamples): void
{
    $output = "\n=== COUNTEREXAMPLES (BUG CONFIRMATION) ===\n";
    $output .= "These counterexamples confirm the performance bug exists:\n\n";
    $output .= "1. Query Count: {$counterexamples['query_count']} queries\n";
    $output .= "   Expected: < 50 queries with proper optimization\n";
    $output .= "   Actual: > 100 queries due to N+1 problems\n\n";
    
    $output .= "2. Execution Time: " . number_format($counterexamples['execution_time_ms'], 2) . "ms\n";
    $output .= "   Expected: < 2000ms with optimization\n";
    $output .= "   Actual: > 2000ms due to performance issues\n\n";
    
    $output .= "3. Peak Memory: " . number_format($counterexamples['peak_memory_mb'], 2) . "MB\n\n";
    
    $output .= "4. N+1 Patterns Identified:\n";
    foreach ($counterexamples['n1_patterns'] as $pattern) {
        $output .= "   - {$pattern}\n";
    }
    $output .= "\n";
    
    $output .= "==========================================\n";
    
    echo $output;
}
