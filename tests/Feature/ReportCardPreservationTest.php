<?php

use App\Models\Student;
use App\Models\User;
use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\Kelas;
use App\Models\Jenjang;
use App\Models\KelasParalel;
use App\Models\ClassMember;
use App\Models\ActiveSubject;
use App\Models\Mapel;
use App\Models\StudentGrade;
use App\Models\GradeWeight;
use App\Models\Semester;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Preservation Property Tests for Report Card Print Issues
 * 
 * **Property 2: Preservation** - Ranking Calculation, Report Card Display, and Non-Buggy Arabic Text
 * **IMPORTANT**: These tests verify baseline behavior that must be preserved
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

beforeEach(function () {
    // Create authenticated admin user
    $adminLevel = \App\Models\UserLevel::create(['name' => 'Administrator']);
    $this->admin = User::factory()->create([
        'user_level_id' => $adminLevel->id,
    ]);
    $this->actingAs($this->admin);

    // Create academic year and semesters
    $this->academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'semester' => 'Genap',
        'is_active' => true,
    ]);

    $this->semesterGanjil = Semester::create(['name' => 'Ganjil', 'is_active' => false]);
    $this->semesterGenap = Semester::create(['name' => 'Genap', 'is_active' => true]);

    // Set session for academic state
    session(['view_academic_year_id' => $this->academicYear->id]);
    session(['view_semester_id' => $this->semesterGenap->id]);
});

/**
 * Preservation Test 2.1: Ranking display for students ranked 1-10 works correctly
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves ranking display for students ranked 1-10 showing actual rank', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Tsanawiyah', 'nama_arab' => 'المرحلة الثانوية']);
    $kelas = Kelas::create(['name' => '3', 'jenjang_id' => $jenjang->id, 'level' => 3]);
    $kelasParalel = KelasParalel::create(['name' => 'A']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create active subject
    $mapel = Mapel::create(['name' => 'Matematika', 'nama_arab' => 'الرياضيات']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    // Create grade weight
    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'UTS',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    // Create 10 students with varying scores
    $students = [];
    for ($i = 0; $i < 10; $i++) {
        $nomorInduk = "NIS00$i";
        $user = User::factory()->create([
            'name' => "Student $i",
            'nomor_induk' => $nomorInduk,
            'user_level_id' => $this->admin->user_level_id,
        ]);
        
        $student = Student::create([
            'user_id' => $user->id,
            'nomor_induk' => $nomorInduk,
            'name' => "Student $i",
        ]);

        ClassMember::create([
            'student_id' => $student->id,
            'active_class_id' => $activeClass->id,
        ]);

        // Assign descending scores (100, 95, 90, ...)
        $score = 100 - ($i * 5);
        
        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => $score,
        ]);

        $students[] = $student;
    }

    // Test multiple students in ranks 1-10
    $testCases = [
        ['index' => 0, 'expectedRank' => 1],  // Rank 1
        ['index' => 4, 'expectedRank' => 5],  // Rank 5
        ['index' => 9, 'expectedRank' => 10], // Rank 10
    ];

    foreach ($testCases as $testCase) {
        $targetStudent = $students[$testCase['index']];
        $expectedRank = $testCase['expectedRank'];

        // Make request to print endpoint
        $response = $this->get("/academic/reports/{$targetStudent->id}/print?semester=Genap");
        $response->assertStatus(200);
        
        // Extract rank from response props
        $rank = $response->viewData('rank');
        
        // EXPECTED: rank should be the actual numerical rank (1-10)
        // This should PASS on unfixed code (ranks 1-10 already work correctly)
        expect($rank)->toBe($expectedRank, "Student at index {$testCase['index']} should have rank {$expectedRank}");
    }
});

/**
 * Preservation Test 2.2: Grades display correctly in report card
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves grades display showing correct scores for all subjects', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Mutawassith', 'nama_arab' => 'المرحلة المتوسطة']);
    $kelas = Kelas::create(['name' => '2', 'jenjang_id' => $jenjang->id, 'level' => 2]);
    $kelasParalel = KelasParalel::create(['name' => 'A']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create student
    $user = User::factory()->create([
        'name' => 'Ahmad',
        'nomor_induk' => 'NIS001',
        'user_level_id' => $this->admin->user_level_id,
    ]);
    
    $student = Student::create([
        'user_id' => $user->id,
        'nomor_induk' => 'NIS001',
        'name' => 'Ahmad',
    ]);

    ClassMember::create([
        'student_id' => $student->id,
        'active_class_id' => $activeClass->id,
    ]);

    // Create multiple subjects with grades
    $subjects = [
        ['name' => 'Matematika', 'nama_arab' => 'الرياضيات', 'score' => 85],
        ['name' => 'Bahasa Arab', 'nama_arab' => 'اللغة العربية', 'score' => 90],
        ['name' => 'Fiqih', 'nama_arab' => 'الفقه', 'score' => 78],
    ];

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'UTS',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    foreach ($subjects as $subjectData) {
        $mapel = Mapel::create([
            'name' => $subjectData['name'],
            'nama_arab' => $subjectData['nama_arab']
        ]);
        
        $activeSubject = ActiveSubject::create([
            'active_class_id' => $activeClass->id,
            'mapel_id' => $mapel->id,
        ]);

        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => $subjectData['score'],
        ]);
    }

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");
    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: All subject names and scores should be displayed
    // This should PASS on unfixed code (grades display already works correctly)
    foreach ($subjects as $subjectData) {
        expect($content)->toContain($subjectData['name'], "Should display subject name: {$subjectData['name']}");
        expect($content)->toContain($subjectData['nama_arab'], "Should display Arabic subject name: {$subjectData['nama_arab']}");
        expect($content)->toContain((string)$subjectData['score'], "Should display score: {$subjectData['score']}");
    }
});

/**
 * Preservation Test 2.3: Semester 1 reports do not display Decision section
 * Validates: Requirements 4.5, 4.6
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves Semester 1 reports not displaying Decision section', function () {
    // Update academic year to Semester 1 (Ganjil)
    $this->academicYear->update(['semester' => 'Ganjil']);
    session(['view_semester_id' => $this->semesterGanjil->id]);

    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Ibtidaiyah', 'nama_arab' => 'المرحلة الإبتدائية']);
    $kelas = Kelas::create(['name' => '1', 'jenjang_id' => $jenjang->id, 'level' => 1]);
    $kelasParalel = KelasParalel::create(['name' => 'A']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create student
    $user = User::factory()->create([
        'name' => 'Fatimah',
        'nomor_induk' => 'NIS002',
        'user_level_id' => $this->admin->user_level_id,
    ]);
    
    $student = Student::create([
        'user_id' => $user->id,
        'nomor_induk' => 'NIS002',
        'name' => 'Fatimah',
    ]);

    ClassMember::create([
        'student_id' => $student->id,
        'active_class_id' => $activeClass->id,
    ]);

    // Create subject and grades
    $mapel = Mapel::create(['name' => 'Quran', 'nama_arab' => 'القرآن']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'UTS',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Ganjil',
    ]);

    StudentGrade::create([
        'student_id' => $student->id,
        'active_subject_id' => $activeSubject->id,
        'semester_id' => $this->semesterGanjil->id,
        'grade_weight_id' => $gradeWeight->id,
        'score' => 85,
    ]);

    // Make request to print endpoint for Semester 1 (Ganjil)
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Ganjil");
    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: Decision section (القرار) should NOT be displayed for Semester 1
    // This should PASS on unfixed code (Semester 1 already doesn't show Decision section)
    expect($content)->not->toContain('القرار', 'Decision section should not be displayed for Semester 1 reports');
    expect($content)->not->toContain('بناءً على النتائج', 'Decision text should not be displayed for Semester 1 reports');
});

/**
 * Preservation Test 2.4: Arabic text in non-Decision sections displays correctly
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves Arabic text display in non-Decision sections', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Tsanawiyah', 'nama_arab' => 'المرحلة الثانوية']);
    $kelas = Kelas::create(['name' => '3', 'jenjang_id' => $jenjang->id, 'level' => 3]);
    $kelasParalel = KelasParalel::create(['name' => 'B']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create student with Arabic name
    $user = User::factory()->create([
        'name' => 'Yusuf',
        'nomor_induk' => 'NIS003',
        'nama_arab' => 'يوسف',
        'user_level_id' => $this->admin->user_level_id,
    ]);
    
    $student = Student::create([
        'user_id' => $user->id,
        'nomor_induk' => 'NIS003',
        'name' => 'Yusuf',
    ]);

    ClassMember::create([
        'student_id' => $student->id,
        'active_class_id' => $activeClass->id,
    ]);

    // Create subjects with Arabic names
    $arabicSubjects = [
        ['name' => 'Quran', 'nama_arab' => 'القرآن'],
        ['name' => 'Hadith', 'nama_arab' => 'الحديث'],
        ['name' => 'Fiqih', 'nama_arab' => 'الفقه'],
    ];

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'Final',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    foreach ($arabicSubjects as $subjectData) {
        $mapel = Mapel::create([
            'name' => $subjectData['name'],
            'nama_arab' => $subjectData['nama_arab']
        ]);
        
        $activeSubject = ActiveSubject::create([
            'active_class_id' => $activeClass->id,
            'mapel_id' => $mapel->id,
        ]);

        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => 80,
        ]);
    }

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");
    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: All Arabic text in non-Decision sections should display correctly
    // This should PASS on unfixed code (Arabic text outside Decision section already works correctly)
    
    // Check student Arabic name
    expect($content)->toContain('يوسف', 'Should display student Arabic name correctly');
    
    // Check subject Arabic names
    foreach ($arabicSubjects as $subjectData) {
        expect($content)->toContain($subjectData['nama_arab'], "Should display Arabic subject name: {$subjectData['nama_arab']}");
    }
    
    // Check jenjang Arabic name
    expect($content)->toContain('المرحلة الثانوية', 'Should display jenjang Arabic name correctly');
});

/**
 * Preservation Test 2.5: Average score calculation remains unchanged
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves average score calculation using weighted formula', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Mutawassith', 'nama_arab' => 'المرحلة المتوسطة']);
    $kelas = Kelas::create(['name' => '1', 'jenjang_id' => $jenjang->id, 'level' => 1]);
    $kelasParalel = KelasParalel::create(['name' => 'A']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create student
    $user = User::factory()->create([
        'name' => 'Zahra',
        'nomor_induk' => 'NIS004',
        'user_level_id' => $this->admin->user_level_id,
    ]);
    
    $student = Student::create([
        'user_id' => $user->id,
        'nomor_induk' => 'NIS004',
        'name' => 'Zahra',
    ]);

    ClassMember::create([
        'student_id' => $student->id,
        'active_class_id' => $activeClass->id,
    ]);

    // Create subject
    $mapel = Mapel::create(['name' => 'Matematika', 'nama_arab' => 'الرياضيات']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    // Create multiple grade weights with different weights
    $gradeWeights = [
        ['name' => 'UTS', 'weight' => 30, 'score' => 80],
        ['name' => 'UAS', 'weight' => 40, 'score' => 90],
        ['name' => 'Tugas', 'weight' => 30, 'score' => 85],
    ];

    $totalWeightedScore = 0;
    $totalWeight = 0;

    foreach ($gradeWeights as $gwData) {
        $gradeWeight = GradeWeight::create([
            'academic_year_id' => $this->academicYear->id,
            'name' => $gwData['name'],
            'weight' => $gwData['weight'],
            'category' => 'pengetahuan',
            'semester' => 'Genap',
        ]);

        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => $gwData['score'],
        ]);

        $totalWeightedScore += $gwData['score'] * $gwData['weight'];
        $totalWeight += $gwData['weight'];
    }

    // Calculate expected average: (80*30 + 90*40 + 85*30) / (30+40+30) = 86
    $expectedAverage = $totalWeightedScore / $totalWeight;

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");
    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: Average score should be calculated using weighted formula
    // This should PASS on unfixed code (average calculation already works correctly)
    $formattedAverage = number_format($expectedAverage, 2);
    expect($content)->toContain($formattedAverage, "Should display weighted average score: {$formattedAverage}");
});

/**
 * Preservation Test 2.6: Total students count displays correctly
 * Validates: Requirements 4.3, 4.4
 * Expected: PASS on unfixed code (baseline behavior to preserve)
 */
it('preserves total students count display in report card', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Tsanawiyah', 'nama_arab' => 'المرحلة الثانوية']);
    $kelas = Kelas::create(['name' => '2', 'jenjang_id' => $jenjang->id, 'level' => 2]);
    $kelasParalel = KelasParalel::create(['name' => 'A']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create active subject
    $mapel = Mapel::create(['name' => 'Bahasa Arab', 'nama_arab' => 'اللغة العربية']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    // Create grade weight
    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'UTS',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    // Create exactly 8 students
    $totalStudents = 8;
    $students = [];
    
    for ($i = 0; $i < $totalStudents; $i++) {
        $user = User::factory()->create([
            'name' => "Student $i",
            'nomor_induk' => "NIS10$i",
            'user_level_id' => $this->admin->user_level_id,
        ]);
        
        $student = Student::create([
            'user_id' => $user->id,
            'nomor_induk' => "NIS10$i",
            'name' => "Student $i",
        ]);

        ClassMember::create([
            'student_id' => $student->id,
            'active_class_id' => $activeClass->id,
        ]);

        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => 80 + $i,
        ]);

        $students[] = $student;
    }

    // Make request to print endpoint for first student
    $response = $this->get("/academic/reports/{$students[0]->id}/print?semester=Genap");
    $response->assertStatus(200);
    
    // Extract total students from response
    $totalStudentsFromResponse = $response->viewData('totalStudents');
    
    // EXPECTED: Total students should be 8
    // This should PASS on unfixed code (total students count already works correctly)
    expect($totalStudentsFromResponse)->toBe($totalStudents, "Should display correct total students count: {$totalStudents}");
});
