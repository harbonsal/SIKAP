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
 * Bug Condition Exploration Tests for Report Card Print Issues
 * 
 * **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
 * **DO NOT attempt to fix the tests or the code when they fail**
 * **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
 * **GOAL**: Surface counterexamples that demonstrate the bugs exist
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
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
 * Test 1.1: Ranking display for student with rank 11 shows "-" instead of "11"
 * Bug Condition 1: isBugCondition_Ranking(rank) where rank > 10
 * Expected Behavior: Display actual numerical rank "11" (from Property 1 in design)
 */
it('displays actual rank 11 instead of dash for student ranked 11th', function () {
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

    // Create 15 students with varying scores (target student will be rank 11)
    $students = [];
    for ($i = 0; $i < 15; $i++) {
        $user = User::factory()->create([
            'name' => "Student $i",
            'nomor_induk' => "NIS00$i",
            'user_level_id' => $this->admin->user_level_id,
        ]);
        
        $student = Student::create([
            'user_id' => $user->id,
            'nomor_induk' => "NIS00$i",
            'name' => "Student $i",
        ]);

        ClassMember::create([
            'student_id' => $student->id,
            'active_class_id' => $activeClass->id,
        ]);

        // Assign scores: higher scores for first 10 students, lower for 11-15
        $score = ($i < 10) ? (100 - $i) : (50 - ($i - 10));
        
        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => $score,
        ]);

        $students[] = $student;
    }

    // Target student is at index 10 (rank 11)
    $targetStudent = $students[10];

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$targetStudent->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Extract rank from response props
    $rank = $response->viewData('rank');
    
    // EXPECTED: rank should be 11 (actual numerical rank)
    // ACTUAL (on unfixed code): rank will be "-" because of the filter on line 260
    expect($rank)->toBe(11)
        ->and($rank)->not->toBe('-');
});

/**
 * Test 1.2: Ranking display for student with rank 25 shows "-" instead of "25"
 * Bug Condition 1: isBugCondition_Ranking(rank) where rank > 10
 * Expected Behavior: Display actual numerical rank "25" (from Property 1 in design)
 */
it('displays actual rank 25 instead of dash for student ranked 25th', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Tsanawiyah', 'nama_arab' => 'المرحلة الثانوية']);
    $kelas = Kelas::create(['name' => '2', 'jenjang_id' => $jenjang->id, 'level' => 2]);
    $kelasParalel = KelasParalel::create(['name' => 'B']);
    
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
        'name' => 'UAS',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    // Create 30 students with varying scores (target student will be rank 25)
    $students = [];
    for ($i = 0; $i < 30; $i++) {
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

        // Assign scores: descending from 100
        $score = 100 - ($i * 2);
        
        StudentGrade::create([
            'student_id' => $student->id,
            'active_subject_id' => $activeSubject->id,
            'semester_id' => $this->semesterGenap->id,
            'grade_weight_id' => $gradeWeight->id,
            'score' => $score,
        ]);

        $students[] = $student;
    }

    // Target student is at index 24 (rank 25)
    $targetStudent = $students[24];

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$targetStudent->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Extract rank from response props
    $rank = $response->viewData('rank');
    
    // EXPECTED: rank should be 25 (actual numerical rank)
    // ACTUAL (on unfixed code): rank will be "-" because of the filter on line 260
    expect($rank)->toBe(25)
        ->and($rank)->not->toBe('-');
});

/**
 * Test 1.3: Arabic Decision section text breaks across lines unnaturally for Semester 2 reports
 * Bug Condition 2: isBugCondition_Arabic_Layout(semester, decision) where semester='Genap'
 * Expected Behavior: Arabic text flows naturally without artificial line breaks (from Property 2 in design)
 */
it('displays Arabic Decision section text with natural flow for Semester 2 reports', function () {
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

    // Create subject and grades (passing grades to trigger decision)
    $mapel = Mapel::create(['name' => 'Fiqih', 'nama_arab' => 'الفقه']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'Final',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    StudentGrade::create([
        'student_id' => $student->id,
        'active_subject_id' => $activeSubject->id,
        'semester_id' => $this->semesterGenap->id,
        'grade_weight_id' => $gradeWeight->id,
        'score' => 85,
    ]);

    // Create KKM
    \App\Models\Kkm::create([
        'kelas_id' => $kelas->id,
        'mapel_id' => $mapel->id,
        'kkm_value' => 70,
    ]);

    // Make request to print endpoint for Semester 2 (Genap)
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // Check that Decision section exists (only for Semester 2)
    expect($content)->toContain('القرار');
    
    // Check that the Arabic text contains the expected phrase
    expect($content)->toContain('بناءً على النتائج التي تحققت في الفصل الدراسي الأول والثاني');
    
    // EXPECTED: The paragraph should have CSS properties to prevent unnatural wrapping
    // Look for whitespace-nowrap or similar CSS class/style
    // ACTUAL (on unfixed code): The paragraph lacks CSS properties, causing unnatural line breaks
    
    // Check for presence of CSS styling to control text flow
    // This will FAIL on unfixed code because line 447 doesn't have whitespace-nowrap
    $hasWhitespaceControl = str_contains($content, 'whitespace-nowrap') || 
                           str_contains($content, 'white-space: nowrap') ||
                           str_contains($content, 'word-break: keep-all');
    
    expect($hasWhitespaceControl)->toBeTrue(
        'Decision section should have CSS properties to prevent unnatural text wrapping'
    );
});

/**
 * Test 1.4: Arabic class name "3 Tsanawiyah" displays as "٣ الثانوية" instead of "الثالث الثانوي"
 * Bug Condition 3: isBugCondition_Arabic_Grammar(className, jenjangName) where className contains digit
 * Expected Behavior: Use ordinal words and masculine forms (from Property 3 in design)
 */
it('displays Arabic class name "3 Tsanawiyah" as "الثالث الثانوي" with correct grammar', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Tsanawiyah', 'nama_arab' => 'المرحلة الثانوية']);
    $kelas = Kelas::create(['name' => '3 Tsanawiyah', 'jenjang_id' => $jenjang->id, 'level' => 3]);
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
        'nama_arab' => 'فاطمة',
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

    // Create minimal grade data
    $mapel = Mapel::create(['name' => 'Quran', 'nama_arab' => 'القرآن']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'Test',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    StudentGrade::create([
        'student_id' => $student->id,
        'active_subject_id' => $activeSubject->id,
        'semester_id' => $this->semesterGenap->id,
        'grade_weight_id' => $gradeWeight->id,
        'score' => 80,
    ]);

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: Should display "الصف : الثالث الثانوي" (ordinal + masculine)
    // ACTUAL (on unfixed code): Will display "٣ الثانوية" (cardinal + feminine)
    
    // Check for correct ordinal word "الثالث" (third)
    expect($content)->toContain('الثالث', 'Should use ordinal word "الثالث" not cardinal "٣"');
    
    // Check for correct masculine form "الثانوي" (not feminine "الثانوية")
    expect($content)->toContain('الثانوي', 'Should use masculine form "الثانوي" not feminine "الثانوية"');
    
    // Check for proper idlafah structure with colon
    expect($content)->toContain('الصف : الثالث الثانوي', 'Should display complete proper format');
});

/**
 * Test 1.5: Arabic class name "2 Mutawassith" displays as "٢ المتوسطة" instead of "الثاني المتوسط"
 * Bug Condition 3: isBugCondition_Arabic_Grammar(className, jenjangName) where className contains digit
 * Expected Behavior: Use ordinal words and masculine forms (from Property 3 in design)
 */
it('displays Arabic class name "2 Mutawassith" as "الثاني المتوسط" with correct grammar', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Mutawassith', 'nama_arab' => 'المرحلة المتوسطة']);
    $kelas = Kelas::create(['name' => '2 Mutawassith', 'jenjang_id' => $jenjang->id, 'level' => 2]);
    $kelasParalel = KelasParalel::create(['name' => 'B']);
    
    $activeClass = ActiveClass::create([
        'academic_year_id' => $this->academicYear->id,
        'kelas_id' => $kelas->id,
        'kelas_paralel_id' => $kelasParalel->id,
        'teacher_id' => $this->admin->id,
    ]);

    // Create student
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

    // Create minimal grade data
    $mapel = Mapel::create(['name' => 'Hadith', 'nama_arab' => 'الحديث']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'Test',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    StudentGrade::create([
        'student_id' => $student->id,
        'active_subject_id' => $activeSubject->id,
        'semester_id' => $this->semesterGenap->id,
        'grade_weight_id' => $gradeWeight->id,
        'score' => 75,
    ]);

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: Should display "الصف : الثاني المتوسط" (ordinal + masculine)
    // ACTUAL (on unfixed code): Will display "٢ المتوسطة" (cardinal + feminine)
    
    // Check for correct ordinal word "الثاني" (second)
    expect($content)->toContain('الثاني', 'Should use ordinal word "الثاني" not cardinal "٢"');
    
    // Check for correct masculine form "المتوسط" (not feminine "المتوسطة")
    expect($content)->toContain('المتوسط', 'Should use masculine form "المتوسط" not feminine "المتوسطة"');
    
    // Check for proper idlafah structure with colon
    expect($content)->toContain('الصف : الثاني المتوسط', 'Should display complete proper format');
});

/**
 * Test 1.6: Arabic class name "1 Ibtidaiyah" displays as "١ الإبتدائية" instead of "الأول الإبتدائي"
 * Bug Condition 3: isBugCondition_Arabic_Grammar(className, jenjangName) where className contains digit
 * Expected Behavior: Use ordinal words and masculine forms (from Property 3 in design)
 */
it('displays Arabic class name "1 Ibtidaiyah" as "الأول الإبتدائي" with correct grammar', function () {
    // Create jenjang and kelas
    $jenjang = Jenjang::create(['name' => 'Ibtidaiyah', 'nama_arab' => 'المرحلة الإبتدائية']);
    $kelas = Kelas::create(['name' => '1 Ibtidaiyah', 'jenjang_id' => $jenjang->id, 'level' => 1]);
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
        'nama_arab' => 'زهراء',
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

    // Create minimal grade data
    $mapel = Mapel::create(['name' => 'Tauhid', 'nama_arab' => 'التوحيد']);
    $activeSubject = ActiveSubject::create([
        'active_class_id' => $activeClass->id,
        'mapel_id' => $mapel->id,
    ]);

    $gradeWeight = GradeWeight::create([
        'academic_year_id' => $this->academicYear->id,
        'name' => 'Test',
        'weight' => 100,
        'category' => 'pengetahuan',
        'semester' => 'Genap',
    ]);

    StudentGrade::create([
        'student_id' => $student->id,
        'active_subject_id' => $activeSubject->id,
        'semester_id' => $this->semesterGenap->id,
        'grade_weight_id' => $gradeWeight->id,
        'score' => 90,
    ]);

    // Make request to print endpoint
    $response = $this->get("/academic/reports/{$student->id}/print?semester=Genap");

    $response->assertStatus(200);
    
    // Get the rendered HTML content
    $content = $response->getContent();
    
    // EXPECTED: Should display "الصف : الأول الإبتدائي" (ordinal + masculine)
    // ACTUAL (on unfixed code): Will display "١ الإبتدائية" (cardinal + feminine)
    
    // Check for correct ordinal word "الأول" (first)
    expect($content)->toContain('الأول', 'Should use ordinal word "الأول" not cardinal "١"');
    
    // Check for correct masculine form "الإبتدائي" (not feminine "الإبتدائية")
    expect($content)->toContain('الإبتدائي', 'Should use masculine form "الإبتدائي" not feminine "الإبتدائية"');
    
    // Check for proper idlafah structure with colon
    expect($content)->toContain('الصف : الأول الإبتدائي', 'Should display complete proper format');
});
