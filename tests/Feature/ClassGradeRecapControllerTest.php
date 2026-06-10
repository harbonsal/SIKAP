<?php

use App\Models\User;
use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Kelas;
use App\Models\Kkm;
use App\Models\Mapel;
use Inertia\Testing\AssertableInertia as Assert;

test('class grade recap show includes KKM data keyed by mapel_id', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Create mapels
    $mapel1 = Mapel::create([
        'name' => 'Matematika',
        'code' => 'MTK',
    ]);

    $mapel2 = Mapel::create([
        'name' => 'Bahasa Indonesia',
        'code' => 'BIND',
    ]);

    // Create KKM data for the class
    $kkm1 = Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel1->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 75,
    ]);

    $kkm2 = Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel2->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 70,
    ]);

    // Make request to the controller
    $response = $this
        ->actingAs($user)
        ->get("/recap/class/{$activeClass->id}");

    // Assert response is OK
    $response->assertOk();

    // Assert Inertia response includes KKM data
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Teacher/Assessment/Recap/Class/Show')
        ->has('kkms')
        ->where('kkms.' . $mapel1->id . '.kkm_value', 75)
        ->where('kkms.' . $mapel2->id . '.kkm_value', 70)
    );
});

test('KKM data is properly keyed by mapel_id for easy lookup', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Create multiple mapels
    $mapel1 = Mapel::create(['name' => 'Matematika', 'code' => 'MTK']);
    $mapel2 = Mapel::create(['name' => 'Bahasa Indonesia', 'code' => 'BIND']);
    $mapel3 = Mapel::create(['name' => 'IPA', 'code' => 'IPA']);

    // Create KKM data
    Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel1->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 75,
    ]);

    Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel2->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 70,
    ]);

    Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel3->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 80,
    ]);

    // Make request
    $response = $this
        ->actingAs($user)
        ->get("/recap/class/{$activeClass->id}");

    // Assert KKM data structure allows easy lookup by mapel_id
    $response->assertInertia(fn (Assert $page) => $page
        ->has('kkms')
        ->has('kkms.' . $mapel1->id)
        ->has('kkms.' . $mapel2->id)
        ->has('kkms.' . $mapel3->id)
        ->where('kkms.' . $mapel1->id . '.kkm_value', 75)
        ->where('kkms.' . $mapel2->id . '.kkm_value', 70)
        ->where('kkms.' . $mapel3->id . '.kkm_value', 80)
    );
});

test('controller returns all required data for both tabs', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Create a mapel
    $mapel = Mapel::create([
        'name' => 'Matematika',
        'code' => 'MTK',
    ]);

    // Create KKM data
    Kkm::create([
        'academic_year_id' => $academicYear->id,
        'mapel_id' => $mapel->id,
        'kelas_id' => $kelas->id,
        'kkm_value' => 75,
    ]);

    // Make request to the controller
    $response = $this
        ->actingAs($user)
        ->get("/recap/class/{$activeClass->id}");

    // Assert response is OK
    $response->assertOk();

    // Assert Inertia response includes all required data for both tabs
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Teacher/Assessment/Recap/Class/Show')
        ->has('activeClass')
        ->has('activeSubjects')
        ->has('gradeWeights')
        ->has('studentRecaps')
        ->has('studentLedgers')
        ->has('kkms')
        ->has('academicYear')
        ->has('semester')
    );
});

test('old ledger URL redirects to new route with tab parameter', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Make request to the old ledger URL
    $response = $this
        ->actingAs($user)
        ->get("/recap/ledger/{$activeClass->id}");

    // Assert redirect to new route with tab parameter
    $response->assertRedirect(route('recap.class.show', [
        'active_class' => $activeClass->id,
        'tab' => 'ledger'
    ]));
});

test('redirect preserves the class ID correctly', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create multiple classes
    $kelas1 = Kelas::create(['name' => '7A', 'jenjang_id' => 1]);
    $kelas2 = Kelas::create(['name' => '7B', 'jenjang_id' => 1]);

    $activeClass1 = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas1->id,
        'teacher_id' => $user->id,
    ]);

    $activeClass2 = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas2->id,
        'teacher_id' => $user->id,
    ]);

    // Test redirect for first class
    $response1 = $this
        ->actingAs($user)
        ->get("/recap/ledger/{$activeClass1->id}");

    $response1->assertRedirect(route('recap.class.show', [
        'active_class' => $activeClass1->id,
        'tab' => 'ledger'
    ]));

    // Test redirect for second class
    $response2 = $this
        ->actingAs($user)
        ->get("/recap/ledger/{$activeClass2->id}");

    $response2->assertRedirect(route('recap.class.show', [
        'active_class' => $activeClass2->id,
        'tab' => 'ledger'
    ]));
});

test('bookmarked ledger URLs still work after redirect', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Make request to the old ledger URL (simulating a bookmarked URL)
    $response = $this
        ->actingAs($user)
        ->get("/recap/ledger/{$activeClass->id}");

    // Assert redirect occurs
    $response->assertRedirect();

    // Follow the redirect
    $followResponse = $this
        ->actingAs($user)
        ->get($response->headers->get('Location'));

    // Assert the final page loads successfully
    $followResponse->assertOk();

    // Assert we're on the correct component with ledger tab
    $followResponse->assertInertia(fn (Assert $page) => $page
        ->component('Teacher/Assessment/Recap/Class/Show')
        ->has('activeClass')
        ->has('activeSubjects')
        ->has('gradeWeights')
        ->has('studentRecaps')
        ->has('studentLedgers')
        ->has('kkms')
    );
});

test('redirect includes tab=ledger query parameter', function () {
    // Create a user
    $user = User::factory()->create();

    // Create academic year and semester
    $academicYear = AcademicYear::create([
        'name' => '2024/2025',
        'start_date' => '2024-07-01',
        'end_date' => '2025-06-30',
        'is_active' => true,
    ]);

    $semester = Semester::create([
        'name' => 'Ganjil',
        'is_active' => true,
    ]);

    // Create a kelas
    $kelas = Kelas::create([
        'name' => '7A',
        'jenjang_id' => 1,
    ]);

    // Create an active class
    $activeClass = ActiveClass::create([
        'academic_year_id' => $academicYear->id,
        'kelas_id' => $kelas->id,
        'teacher_id' => $user->id,
    ]);

    // Make request to the old ledger URL
    $response = $this
        ->actingAs($user)
        ->get("/recap/ledger/{$activeClass->id}");

    // Get the redirect location
    $redirectUrl = $response->headers->get('Location');

    // Assert the redirect URL contains the tab=ledger parameter
    expect($redirectUrl)->toContain('tab=ledger');
});
