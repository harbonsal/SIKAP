<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\StudentController; // Added Import
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

// --- TEMPORARY MIGRATE ROUTE ---
Route::get('/run-migrations-tahfidz', function () {
    try {
        set_time_limit(300);
        $exitCode = Artisan::call('migrate', ['--force' => true]);

        $output = Artisan::output();
        return "<h1>Status Migrasi: " . ($exitCode === 0 ? "Sukses" : "Selesai dengan peringatan") . "</h1>" .
            "<pre style='background:#111;color:#0f0;padding:10px;'>" . htmlspecialchars($output) . "</pre>" .
            "<a href='/import_tahfidz_excel.php'>Lanjut Import Excel</a>";
    } catch (\Exception $e) {
        return "<h1>Gagal!</h1><pre>" . $e->getMessage() . "</pre>";
    }
});
// -------------------------------
Route::get('/', function () {
    return redirect()->route('login');
});

// TEMPORARY DEBUG ROUTE
Route::get('/fix-inactive-students', function () {
    $count = 0;
    // Find students whose user is NOT active
    $students = \App\Models\Student::whereHas('user', function ($q) {
        $q->where('status', '!=', 'Aktif');
    })->get();

    foreach ($students as $student) {
        // Cleanup
        $c1 = \App\Models\ClassMember::where('student_id', $student->id)->delete();
        $c2 = \App\Models\KamarMember::where('student_id', $student->id)->delete();
        $c3 = \App\Models\TahfidzHalaqohMember::where('student_id', $student->id)->delete();

        if ($c1 > 0 || $c2 > 0 || $c3 > 0) {
            $count++;
            echo "Fixed Student ID {$student->id} ({$student->user->name}): Removed Class($c1), Kamar($c2), Halaqoh($c3)<br>";
        }
    }

    return "Fix Complete. Cleaned up $count students.";
});

// Corrected Setup - Removed irrelevant PermissionGroup usage
Route::get('/setup-care-permissions', function () {
    $permissions = [
        'view_character_input' => 'Akses Menu Input Nilai Akhlak',
        'view_character_recap' => 'Akses Menu Rekap Nilai Akhlak',
        'view_kamar_data' => 'Akses Menu Data Kamar',
        'view_kamar_members' => 'Akses Menu Anggota Kamar',
        'create_health_record' => 'Akses Menu Input Kesehatan',
        'view_health_stats' => 'Akses Menu Pantauan Kesehatan',
        // Added for Guru Access
        'view_students' => 'Akses Menu Pencarian Santri',
    ];

    echo "<h3>Setup Permissions</h3><ul>";

    foreach ($permissions as $name => $desc) {
        // Check if permission exists
        $perm = \App\Models\Permission::where('name', $name)->first();

        if (!$perm) {
            \App\Models\Permission::create([
                'name' => $name,
                'description' => $desc,
                // 'permission_group_id' => ... REMOVED: Model mismatch
            ]);
            echo "<li>Created: $name</li>";
        } else {
            echo "<li>Exists: $name</li>";
        }
    }

    // Assign to Roles
    $roleMap = [
        'Administrator' => array_keys($permissions),
        'Musrif' => ['view_character_input', 'view_character_recap', 'view_kamar_data', 'view_kamar_members', 'view_students'],
        'Bagian Kesehatan' => ['create_health_record', 'view_health_stats', 'view_students'],
        'Wali Kelas' => ['view_character_recap', 'view_health_stats', 'view_students'],
        'Guru' => ['view_students'], // Grant to Guru
        'Kepala Sekolah' => ['view_students'], // Grant to KS
    ];

    foreach ($roleMap as $roleName => $perms) {
        $role = \App\Models\UserLevel::where('name', $roleName)->first();
        if ($role) {
            $permIds = \App\Models\Permission::whereIn('name', $perms)->pluck('id')->toArray();
            $role->permissions()->syncWithoutDetaching($permIds);
            echo "<li>Assigned " . count($permIds) . " perms to $roleName</li>";
        }
    }
    echo "</ul><p>Done. (Corrected)</p>";
});

Route::get('/debug-search', function (\Illuminate\Http\Request $request) {
    $search = $request->query('q');
    $kamarId = $request->query('k');

    echo "<h1>Debug Search</h1>";
    echo "Search: " . htmlspecialchars($search) . "<br>";
    echo "Kamar ID: " . htmlspecialchars($kamarId) . "<br><br>";

    if (!$search && !$kamarId) {
        die("Please provide ?q=name or ?k=id");
    }

    $query = \App\Models\Student::query();

    if ($kamarId && $kamarId !== 'all') {
        echo "Filter Kamar: ActiveKamar ID $kamarId<br>";
        $query->whereHas('kamarMembers', function ($q) use ($kamarId) {
            $q->where('active_kamar_id', $kamarId);
        });
    }

    if ($search) {
        echo "Filter Name: $search<br>";
        $query->where(function ($q) use ($search) {
            $q->whereHas('user', function ($u) use ($search) {
                $u->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            })
                ->orWhere('nisn', 'like', "%{$search}%");
        });
    }

    // Show SQL
    echo "<pre>SQL: " . $query->toSql() . "</pre>";
    echo "<pre>Bindings: " . json_encode($query->getBindings()) . "</pre>";

    $results = $query->with(['user', 'kelas'])->limit(10)->get();

    echo "<h3>Results (" . $results->count() . ")</h3>";
    echo "<ul>";
    foreach ($results as $s) {
        echo "<li>ID: {$s->id} | NIS: {$s->nis} | Name: <strong>" . ($s->user->name ?? 'NO USER') . "</strong> | Kelas: " . ($s->kelas->name ?? '-') . "</li>";
    }
    echo "</ul>";
});



use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    // Smart Search
    Route::post('/smart-search', [App\Http\Controllers\SmartSearchController::class, 'search'])->name('smart-search.query');

    // TEMPORARY SYNC ROUTE
    Route::get('/sync-ganjil-tahunan', function () {
        $targetYear = \App\Services\AcademicStateService::currentAcademicYear()
            ?? \App\Models\AcademicYear::where('is_active', true)->firstOrFail();
            
        $ganjilSemester = \App\Models\Semester::where('name', 'like', '%Ganjil%')->first();
        if (!$ganjilSemester) return "Semester Ganjil tidak ditemukan.";

        $overrides = \App\Models\SemesterSubjectTeacher::where('semester_id', $ganjilSemester->id)
            ->whereHas('activeSubject.activeClass', function ($q) use ($targetYear) {
                $q->where('academic_year_id', $targetYear->id);
            })->get();

        $count = 0;
        foreach ($overrides as $override) {
            if ($override->teacher_id) {
                $override->activeSubject->update(['teacher_id' => $override->teacher_id]);
                $override->delete();
                $count++;
            }
        }
        return "Sinkronisasi selesai! $count data guru dari Semester Ganjil berhasil dipindahkan menjadi Tahunan (Default). Silakan kembali ke aplikasi.";
    });

    // TEMPORARY FIX INDEX ROUTE
    Route::get('/fix-schedule-index', function () {
        try {
            \Illuminate\Support\Facades\Schema::table('schedules', function (\Illuminate\Database\Schema\Blueprint $table) {
                // Drop foreign key first
                $table->dropForeign(['teacher_id']);
                
                // Drop the unique index to allow combined classes
                $table->dropUnique('unique_teacher_slot');
                
                // Re-add the foreign key WITHOUT the unique constraint
                $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            });
            return "Perbaikan tahap 2 berhasil! Fitur Kelas Gabungan sekarang sudah aktif. Guru dapat mengajar dua kelas atau lebih pada jam yang sama.";
        } catch (\Exception $e) {
            return "Error: " . $e->getMessage();
        }
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // students.update dan students.destroy sudah dicakup oleh Route::resource('students') di bawah
    // Renamed URI to avoid conflict with students/{student} resource
    Route::get('/ajax/students/group-members/{type}/{id}', [StudentController::class, 'showGroupMembers'])->name('students.group_members');

    Route::get('/settings/academic', [App\Http\Controllers\AcademicYearController::class, 'unified'])->name('settings.academic.index');
    Route::post('/settings/academic', [App\Http\Controllers\ActiveAcademicController::class, 'store'])->name('settings.academic.store');
    Route::get('/academic-years/unified', [App\Http\Controllers\AcademicYearController::class, 'unified'])->name('academic-years.unified');

    Route::get('/settings/access-control', [App\Http\Controllers\AccessControlController::class, 'index'])
        ->name('settings.access-control.index')
        ->middleware('permission:view_access_control');
    Route::get('/settings/access-control/{user_level}', [App\Http\Controllers\AccessControlController::class, 'edit'])
        ->name('settings.access-control.edit')
        ->middleware('permission:view_access_control');
    Route::post('/settings/access-control/bulk-update', [App\Http\Controllers\AccessControlController::class, 'bulkUpdate'])
        ->name('settings.access-control.bulk-update')
        ->middleware('permission:edit_access_control');

    Route::resource('jenjangs', App\Http\Controllers\JenjangController::class);
    Route::resource('kelas', App\Http\Controllers\KelasController::class);
    Route::resource('kelas-paralel', App\Http\Controllers\KelasParalelController::class);
    Route::resource('mapels', App\Http\Controllers\MapelController::class);
    Route::resource('ujians', App\Http\Controllers\UjianController::class);
    Route::put('ujians/{ujian}/weight', [App\Http\Controllers\UjianController::class, 'updateWeight'])->name('ujians.update-weight');
    Route::get('silabus/template', [App\Http\Controllers\SilabusController::class, 'downloadTemplate'])->name('silabus.template');
    Route::post('silabus/import', [App\Http\Controllers\SilabusController::class, 'processImport'])->name('silabus.import');
    Route::resource('silabus', App\Http\Controllers\SilabusController::class)->parameters(['silabus' => 'silabus']);
    Route::get('students/export', [App\Http\Controllers\StudentController::class, 'export'])->name('students.export');
    Route::get('students/export-template-missing', [App\Http\Controllers\StudentController::class, 'exportTemplateMissingBiodata'])->name('students.export-template-missing');
    Route::get('students/import', [App\Http\Controllers\StudentController::class, 'import'])->name('students.import');
    Route::post('students/import', [App\Http\Controllers\StudentController::class, 'processImport'])->name('students.import.process');
    Route::post('students/import-update', [App\Http\Controllers\StudentController::class, 'processImportUpdate'])->name('students.import.update');
    Route::get('students/export-update-template', [App\Http\Controllers\StudentController::class, 'exportUpdateTemplate'])->name('students.export-update-template');
    Route::get('students/my-profile', [App\Http\Controllers\StudentController::class, 'myProfile'])->name('students.my-profile');
    Route::resource('students', App\Http\Controllers\StudentController::class);
    Route::resource('active-classes', App\Http\Controllers\ActiveClassController::class);
    Route::resource('class-members', App\Http\Controllers\ClassMemberController::class);
    Route::post('active-subjects/{activeClass}/copy', [App\Http\Controllers\ActiveSubjectController::class, 'copyFromClass'])->name('active-subjects.copy');
    Route::post('active-subjects/bulk-update', [App\Http\Controllers\ActiveSubjectController::class, 'bulkUpdate'])->name('active-subjects.bulk-update');
    Route::resource('active-subjects', App\Http\Controllers\ActiveSubjectController::class);
    Route::resource('subject-teachers', App\Http\Controllers\SubjectTeacherController::class);
    Route::get('daftar-pengajar', [\App\Http\Controllers\DaftarPengajarController::class, 'index'])->name('daftar-pengajar.index');
    Route::post('/settings/education/teaching-distribution/sync', [\App\Http\Controllers\TeachingDistributionSyncController::class, 'sync'])->name('teaching-distribution.sync');
    Route::resource('teaching-distributions', App\Http\Controllers\TeachingDistributionController::class)->only(['index']);
    Route::post('teaching-distributions/bulk-quota', [App\Http\Controllers\TeachingDistributionController::class, 'bulkUpdateQuota'])->name('teaching-distribution.bulk-update-quota');
    Route::put('teaching-distributions/{user}/quota', [App\Http\Controllers\TeachingDistributionController::class, 'updateQuota'])->name('teaching-distribution.update-quota');
    Route::resource('learning-hours', App\Http\Controllers\LearningHourController::class);
    Route::resource('grade-weights', App\Http\Controllers\GradeWeightController::class);
    Route::resource('kkms', App\Http\Controllers\KkmController::class);
    Route::resource('kamars', App\Http\Controllers\KamarController::class);
    Route::resource('pekans', App\Http\Controllers\PekanController::class);
    Route::resource('days', App\Http\Controllers\DayController::class)->only(['index', 'update']);
    Route::resource('pickets', App\Http\Controllers\PicketController::class);

    // Academic Calendar (Kaldik)
    Route::get('/academic-calendar', [App\Http\Controllers\AcademicCalendarController::class, 'index'])->name('academic-calendar.index');
    Route::post('/academic-calendar/events', [App\Http\Controllers\AcademicCalendarController::class, 'storeEvent'])->name('academic-calendar.events.store');
    Route::put('/academic-calendar/events/{event}', [App\Http\Controllers\AcademicCalendarController::class, 'updateEvent'])->name('academic-calendar.events.update');
    Route::delete('/academic-calendar/events/{event}', [App\Http\Controllers\AcademicCalendarController::class, 'destroyEvent'])->name('academic-calendar.events.destroy');
    Route::put('/academic-calendar/pekans/{pekan}/kbm', [App\Http\Controllers\AcademicCalendarController::class, 'updatePekanKbm'])->name('academic-calendar.pekans.update-kbm');
    Route::post('supervisions/check-schedule', [App\Http\Controllers\SupervisionController::class, 'checkSchedule'])->name('supervisions.check-schedule');

    Route::patch('supervisions/{supervision}/publish', [App\Http\Controllers\SupervisionController::class, 'publish'])->name('supervisions.publish');
    Route::get('supervisions/ai/create', [App\Http\Controllers\SupervisionController::class, 'createAI'])->name('supervisions.ai.create');
    Route::post('supervisions/ai/analyze', [App\Http\Controllers\SupervisionController::class, 'analyzeNote'])->name('supervisions.ai.analyze');
    // Dedicated Route for "My Supervision" (Strict Privacy)
    Route::get('/supervisions/me', [App\Http\Controllers\SupervisionController::class, 'mySupervision'])->name('supervisions.me');
    Route::resource('supervisions', App\Http\Controllers\SupervisionController::class);

    // RPP Generator
    Route::post('rpp-generator/generate', [App\Http\Controllers\RppGeneratorController::class, 'generate'])->name('rpp-generator.generate');
    Route::resource('rpp-generator', App\Http\Controllers\RppGeneratorController::class);

    // Supervision Settings
    Route::prefix('settings/education/supervision')->name('supervision-settings.')->group(function () {
        Route::get('/', [App\Http\Controllers\SupervisionSettingController::class, 'index'])->name('index');

        // Categories
        Route::post('/categories', [App\Http\Controllers\SupervisionSettingController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [App\Http\Controllers\SupervisionSettingController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyCategory'])->name('categories.destroy');

        // Questions
        Route::post('/questions', [App\Http\Controllers\SupervisionSettingController::class, 'storeQuestion'])->name('questions.store');
        Route::put('/questions/{question}', [App\Http\Controllers\SupervisionSettingController::class, 'updateQuestion'])->name('questions.update');
        Route::delete('/questions/{question}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyQuestion'])->name('questions.destroy');

        // Rubrics
        // Rubrics
        Route::post('/questions/{question}/rubrics', [App\Http\Controllers\SupervisionSettingController::class, 'storeRubric'])->name('rubrics.store');
        Route::post('/questions/{question}/rubrics/row', [App\Http\Controllers\SupervisionSettingController::class, 'storeRubricRow'])->name('rubrics.store-row');
        Route::put('/rubrics/{rubric}', [App\Http\Controllers\SupervisionSettingController::class, 'updateRubric'])->name('rubrics.update');
        Route::post('/rubrics/bulk-destroy', [App\Http\Controllers\SupervisionSettingController::class, 'destroyRubricRow'])->name('rubrics.destroy-row');
        Route::delete('/rubrics/{rubric}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyRubric'])->name('rubrics.destroy');

        // Student Questionnaire Settings
        Route::resource('student-questionnaires', App\Http\Controllers\StudentQuestionnaireController::class)->except(['create', 'edit', 'show']);
    });

    // Student Access for Questionnaires
    Route::middleware(['auth'])->prefix('student/supervisions')->name('student.supervisions.')->group(function () {
        Route::get('/', [App\Http\Controllers\StudentSupervisionController::class, 'index'])->name('index');
        Route::get('/{supervision}', [App\Http\Controllers\StudentSupervisionController::class, 'show'])->name('show');
        Route::post('/{supervision}', [App\Http\Controllers\StudentSupervisionController::class, 'store'])->name('store');
    });

    // Toggle Questionnaire for Supervisor
    Route::put('supervisions/{supervision}/toggle-questionnaire', [App\Http\Controllers\SupervisionController::class, 'toggleQuestionnaire'])
        ->name('supervisions.toggle-questionnaire');

    Route::get('search/active-kamars', [App\Http\Controllers\SearchActiveKamarController::class, 'index'])->name('search.active-kamars.index');
    Route::post('active-kamars/copy', [App\Http\Controllers\ActiveKamarController::class, 'copyFromYear'])->name('active-kamars.copy');
    Route::resource('active-kamars', App\Http\Controllers\ActiveKamarController::class);
    Route::resource('kamar-members', App\Http\Controllers\KamarMemberController::class);

    // Journal & Attendance Routes
    Route::get('/journals/get-students/{active_subject}', [App\Http\Controllers\JournalController::class, 'getStudents'])->name('journals.get-students');



    // Legacy mapping (likely not needed for new feature but kept for context if any)
    // Manual Attendance (Must be before resource to avoid conflict with {journal} wildcard)
    Route::get('journals/manual', [App\Http\Controllers\ManualAttendanceController::class, 'index'])->name('journals.manual.index');
    Route::get('journals/manual/{active_class}', [App\Http\Controllers\ManualAttendanceController::class, 'show'])->name('journals.manual.show');
    Route::post('journals/manual/{active_class}', [App\Http\Controllers\ManualAttendanceController::class, 'store'])->name('journals.manual.store');

    // Print Attendance
    Route::get('attendance/print', [App\Http\Controllers\AttendancePrintController::class, 'index'])->name('attendance.print.index');
    Route::any('attendance/print/generate', [App\Http\Controllers\AttendancePrintController::class, 'print'])->name('attendance.print.generate');

    Route::resource('journals', App\Http\Controllers\JournalController::class);

    Route::get('/analysis', [App\Http\Controllers\AnalysisController::class, 'index'])->name('analysis.index');
    // Character Assessment Routes
    Route::get('assessments/character/export/excel', [App\Http\Controllers\CharacterAssessmentController::class, 'exportExcel'])->name('assessments.character.export-excel');
    Route::get('assessments/character', [App\Http\Controllers\CharacterAssessmentController::class, 'index'])->name('assessments.character.index');
    Route::post('assessments/character', [App\Http\Controllers\CharacterAssessmentController::class, 'store'])->name('assessments.character.store');

    Route::get('assessments/character/analysis', [App\Http\Controllers\CharacterAnalysisController::class, 'index'])->name('assessments.character.analysis.index');

    // Character Recap Routes
    Route::get('assessments/character/recap', [App\Http\Controllers\CharacterRecapController::class, 'index'])->name('assessments.character.recap.index');
    Route::get('assessments/character/recap/kamar/{id}', [App\Http\Controllers\CharacterRecapController::class, 'show'])->name('assessments.character.recap.show'); // Show by Kamar
    Route::get('assessments/character/recap/student', [App\Http\Controllers\CharacterRecapController::class, 'studentIndex'])->name('assessments.character.recap.student.index'); // Show Students List
    Route::get('assessments/character/recap/student/{id}', [App\Http\Controllers\CharacterRecapController::class, 'student'])->name('assessments.character.recap.student'); // Show by Student


    Route::get('/assessments', [App\Http\Controllers\AssessmentController::class, 'index'])->name('assessments.index');
    Route::get('/assessments/export/excel', [App\Http\Controllers\AssessmentController::class, 'exportExcel'])->name('assessments.export-excel');
    Route::get('/assessments/import/template', [App\Http\Controllers\GradeImportController::class, 'downloadTemplate'])->name('assessments.import_template');
    Route::post('/assessments/import', [App\Http\Controllers\GradeImportController::class, 'store'])->name('assessments.import');
    Route::get('/assessments/{active_subject}/template', [App\Http\Controllers\AssessmentController::class, 'downloadTemplate'])->name('assessments.template');
    Route::post('/assessments/{active_subject}/import', [App\Http\Controllers\AssessmentController::class, 'importSubjectGrades'])->name('assessments.import_subject');
    Route::get('/assessments/{active_subject}', [App\Http\Controllers\AssessmentController::class, 'show'])->name('assessments.show');
    Route::post('/assessments/{active_subject}', [App\Http\Controllers\AssessmentController::class, 'store'])->name('assessments.store');

    Route::get('/recap/class', [App\Http\Controllers\ClassGradeRecapController::class, 'index'])->name('recap.class.index');
    Route::get('/recap/ijazah', [App\Http\Controllers\IjazahRecapController::class, 'index'])->name('recap.ijazah.index');
    Route::get('/recap/class/{active_class}', [App\Http\Controllers\ClassGradeRecapController::class, 'show'])->name('recap.class.show');
    Route::get('/recap/ledger/{active_class}', function($id) {
        return redirect()->route('recap.class.show', ['active_class' => $id, 'tab' => 'ledger']);
    })->name('recap.ledger.show');

    Route::get('/recap/student', [App\Http\Controllers\StudentGradeRecapController::class, 'index'])->name('recap.student.index');
    Route::get('/recap/student/{student}', [App\Http\Controllers\StudentGradeRecapController::class, 'show'])->name('recap.student.show');

    Route::get('/reports/biodata', [App\Http\Controllers\ReportController::class, 'biodata'])->name('reports.biodata');

    Route::delete('users/bulk-destroy', [App\Http\Controllers\UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
    Route::post('users/{user}/impersonate', [App\Http\Controllers\UserController::class, 'impersonate'])->name('users.impersonate');
    // Student Specific Routes
    Route::middleware(['auth'])->group(function () {
        Route::get('my-grades', [App\Http\Controllers\StudentGradeController::class, 'index'])->name('students.grades.index');
        Route::get('my-tahfidz', [App\Http\Controllers\StudentTahfidzController::class, 'index'])->name('students.tahfidz.index');
        Route::get('my-health', [App\Http\Controllers\StudentHealthController::class, 'index'])->name('students.health.index');
    });

    Route::get('test-users', [App\Http\Controllers\UserController::class, 'index'])->name('test-users.index');

    Route::resource('users', App\Http\Controllers\UserController::class);
    Route::resource('academic-years', \App\Http\Controllers\AcademicYearController::class);
    Route::resource('user-levels', \App\Http\Controllers\UserLevelController::class);

    // Region Routes
    Route::get('/settings/regions', [RegionController::class, 'index'])->name('settings.regions.index');
    Route::post('/settings/regions/sync', [RegionController::class, 'sync'])->name('settings.regions.sync');

    Route::get('/settings/school-info', [App\Http\Controllers\SchoolInfoController::class, 'index'])->name('settings.school-info.index');
    Route::post('/settings/school-info', [App\Http\Controllers\SchoolInfoController::class, 'update'])->name('settings.school-info.update');

    // Hidden Menu
    Route::get('/settings/hidden-menu', [App\Http\Controllers\HiddenMenuController::class, 'index'])->name('settings.hidden-menu.index');

    // Schedule
    // Public Schedule View
    Route::get('/academic/schedules', [App\Http\Controllers\PublicScheduleController::class, 'index'])->name('academic.schedules.index');

    // Master Pendidikan
    Route::get('/settings/education/schedules', [App\Http\Controllers\ScheduleController::class, 'index'])->name('settings.education.schedules.index');
    Route::post('/settings/education/schedules/update-school-info', [App\Http\Controllers\ScheduleController::class, 'updateSchoolInfo'])->name('settings.education.schedules.update-school-info');
    Route::post('/settings/education/schedules/copy-classes', [App\Http\Controllers\ScheduleController::class, 'copyClasses'])->name('settings.education.schedules.copy-classes');
    Route::post('/settings/education/schedules/copy-subjects', [App\Http\Controllers\ScheduleController::class, 'copySubjects'])->name('settings.education.schedules.copy-subjects');
    Route::post('/settings/education/schedules/copy-teacher-settings', [App\Http\Controllers\ScheduleController::class, 'copyTeacherSettings'])->name('settings.education.schedules.copy-teacher-settings');
    Route::resource('settings/education/teaching-methods', App\Http\Controllers\TeachingMethodController::class)->names([
        'index' => 'settings.teaching-methods.index',
        'create' => 'settings.teaching-methods.create',
        'store' => 'settings.teaching-methods.store',
        'show' => 'settings.teaching-methods.show',
        'edit' => 'settings.teaching-methods.edit',
        'update' => 'settings.teaching-methods.update',
        'destroy' => 'settings.teaching-methods.destroy',
    ]);

    // Ijazah Management (Candidates & Printing)
    Route::get('/academic/ijazah', [App\Http\Controllers\IjazahSettingsController::class, 'candidates'])->name('academic.ijazah.index');

    // Ijazah Settings
    Route::prefix('settings/education/ijazah')->name('settings.education.ijazah.')->group(function () {
        Route::get('/', [App\Http\Controllers\IjazahSettingsController::class, 'index'])->name('index');
        Route::post('/update', [App\Http\Controllers\IjazahSettingsController::class, 'update'])->name('update');
        Route::post('/{student}/biodata', [App\Http\Controllers\IjazahSettingsController::class, 'updateBiodata'])->name('biodata.update');
        Route::get('/{student}/print', [App\Http\Controllers\IjazahSettingsController::class, 'print'])->name('print');
        Route::get('/collective', [App\Http\Controllers\IjazahSettingsController::class, 'collectiveGrades'])->name('collective');
        Route::post('/collective', [App\Http\Controllers\IjazahSettingsController::class, 'storeCollectiveGrades'])->name('collective.store');
        Route::get('/collective-biodata', [App\Http\Controllers\IjazahSettingsController::class, 'collectiveBiodata'])->name('collective-biodata');
        Route::post('/collective-biodata', [App\Http\Controllers\IjazahSettingsController::class, 'storeCollectiveBiodata'])->name('collective-biodata.store');
        Route::get('/{student}/manual-grades', [App\Http\Controllers\IjazahSettingsController::class, 'manualGrades'])->name('manual-grades');
        Route::post('/{student}/manual-grades', [App\Http\Controllers\IjazahSettingsController::class, 'storeManualGrades'])->name('manual-grades.store');
    });

    // Supervision Settings (Teacher & Student)
    Route::prefix('settings/education/supervision')->name('supervision-settings.')->group(function () {
        Route::get('/', [App\Http\Controllers\SupervisionSettingController::class, 'index'])->name('index');

        // Categories
        Route::post('/categories', [App\Http\Controllers\SupervisionSettingController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [App\Http\Controllers\SupervisionSettingController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyCategory'])->name('categories.destroy');

        // Questions
        Route::post('/questions', [App\Http\Controllers\SupervisionSettingController::class, 'storeQuestion'])->name('questions.store');
        Route::put('/questions/{question}', [App\Http\Controllers\SupervisionSettingController::class, 'updateQuestion'])->name('questions.update');
        Route::delete('/questions/{question}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyQuestion'])->name('questions.destroy');

        // Rubrics
        Route::post('/questions/{question}/rubrics', [App\Http\Controllers\SupervisionSettingController::class, 'storeRubric'])->name('rubrics.store');
        Route::put('/rubrics/{rubric}', [App\Http\Controllers\SupervisionSettingController::class, 'updateRubric'])->name('rubrics.update');
        Route::delete('/rubrics/{rubric}', [App\Http\Controllers\SupervisionSettingController::class, 'destroyRubric'])->name('rubrics.destroy');

        // Rubric Rows
        Route::post('/questions/{question}/rubric-rows', [App\Http\Controllers\SupervisionSettingController::class, 'storeRubricRow'])->name('rubrics.rows.store');
        Route::delete('/questions/rubric-rows', [App\Http\Controllers\SupervisionSettingController::class, 'destroyRubricRow'])->name('rubrics.rows.destroy');

        // Student Questionnaires
        Route::resource('student-questionnaires', App\Http\Controllers\StudentQuestionnaireController::class);
    });

    // Schedule Management (Master)
    Route::get('/settings/master/schedules', [App\Http\Controllers\ScheduleController::class, 'manage'])->name('settings.master.schedules.index');
    Route::post('/settings/master/schedules', [App\Http\Controllers\ScheduleController::class, 'store'])->name('settings.master.schedules.store');
    Route::post('/settings/master/schedules/bulk', [App\Http\Controllers\ScheduleController::class, 'bulkStore'])->name('settings.master.schedules.bulk-store');
    Route::delete('/settings/master/schedules/{schedule}', [App\Http\Controllers\ScheduleController::class, 'destroy'])->name('settings.master.schedules.destroy');
    Route::post('/settings/master/schedules/generate', [App\Http\Controllers\ScheduleController::class, 'generate'])->name('settings.master.schedules.generate');
    Route::get('/settings/master/schedules/download-fet', [App\Http\Controllers\ScheduleController::class, 'downloadFet'])->name('settings.master.schedules.download-fet');
    Route::post('/settings/master/schedules/upload-fet', [App\Http\Controllers\ScheduleController::class, 'uploadFet'])->name('settings.master.schedules.upload-fet');
    Route::post('/settings/master/schedules/clear', [App\Http\Controllers\ScheduleController::class, 'clear'])->name('settings.master.schedules.clear');
    Route::delete('/settings/master/schedules/clear-class/{classId}', [App\Http\Controllers\ScheduleController::class, 'clearClass'])->name('settings.master.schedules.clear-class');
    Route::get('/debug-log', function() {
        $log = storage_path('logs/laravel.log');
        if (file_exists($log)) {
            $lines = file($log);
            $last = array_slice($lines, -100);
            return '<pre>' . implode("", $last) . '</pre>';
        }
        return 'No log found.';
    });

    // Internal API for Regions
    Route::get('/api/regions/provinces', [RegionController::class, 'getProvinces'])->name('api.regions.provinces');
    Route::get('/api/regions/regencies/{province}', [RegionController::class, 'getRegencies'])->name('api.regions.regencies');
    Route::get('/api/regions/districts/{regency}', [RegionController::class, 'getDistricts'])->name('api.regions.districts');
    Route::get('/api/regions/villages/{district}', [RegionController::class, 'getVillages'])->name('api.regions.villages');
    // Search Routes
    Route::get('/search/composition', [App\Http\Controllers\CompositionController::class, 'index'])->name('search.composition.index');
    // Report Ecosystem
    Route::get('/academic/reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    Route::post('/academic/reports/note', [App\Http\Controllers\ReportController::class, 'storeNote'])->name('reports.store-note');
    Route::get('/academic/reports/{student}/print', [App\Http\Controllers\ReportController::class, 'print'])->name('reports.print');

    // Al-Quran Digital Page
    Route::get('/quran', [App\Http\Controllers\QuranController::class, 'index'])->name('quran.index');
    Route::get('/quran/skrining', [App\Http\Controllers\QuranController::class, 'skrining'])->name('quran.skrining');
    Route::get('/quran/tilawah', [App\Http\Controllers\QuranController::class, 'tilawah'])->name('quran.tilawah');
    Route::post('/quran/settings', [App\Http\Controllers\QuranController::class, 'saveSetting'])->name('quran.settings.save');
    Route::post('/quran/progress', [App\Http\Controllers\QuranController::class, 'saveProgress'])->name('quran.progress.save');
    Route::post('/quran/manual-complete', [App\Http\Controllers\QuranController::class, 'manualCompleteProgress'])->name('quran.progress.manual-complete');

    // Skrining Hafalan Mandiri
    Route::post('/hafalan-skrining', [App\Http\Controllers\HafalanSkriningController::class, 'store'])->name('hafalan-skrining.store');
    Route::get('/hafalan-skrining', [App\Http\Controllers\HafalanSkriningController::class, 'index'])->name('hafalan-skrining.index');
    Route::post('/hafalan-skrining/reports', [App\Http\Controllers\HafalanSkriningReportController::class, 'store'])->name('hafalan-skrining.reports.store');


    // Tahfidz Module
    Route::get('/tahfidz/pantau-skrining', [App\Http\Controllers\HafalanSkriningController::class, 'indexAdmin'])->name('tahfidz.pantau-skrining');
    Route::get('/tahfidz/assessments', [App\Http\Controllers\TahfidzAssessmentController::class, 'index'])->name('tahfidz.assessments.index');
    Route::get('/tahfidz/assessments/{active_subject}', [App\Http\Controllers\TahfidzAssessmentController::class, 'show'])->name('tahfidz.assessments.show');
    Route::get('/tahfidz/assessments/{active_subject}/{grade_weight}/students', [App\Http\Controllers\TahfidzAssessmentController::class, 'showStudents'])->name('tahfidz.assessments.students');
    Route::get('/tahfidz/assessments/{active_subject}/{grade_weight}/{student_id}', [App\Http\Controllers\TahfidzAssessmentController::class, 'assess'])->name('tahfidz.assessments.assess');
    Route::post('/tahfidz/assessments/{active_subject}', [App\Http\Controllers\TahfidzAssessmentController::class, 'store'])->name('tahfidz.assessments.store');
    Route::get('/tahfidz/history/{active_subject}/{student_id}', [App\Http\Controllers\TahfidzAssessmentController::class, 'history'])->name('tahfidz.assessments.history');

    // Tahfidz Recap
    Route::get('/tahfidz/recap', [App\Http\Controllers\TahfidzAssessmentController::class, 'recapIndex'])->name('tahfidz.recap.index');
    Route::get('/tahfidz/recap/{id}', [App\Http\Controllers\TahfidzAssessmentController::class, 'recapShow'])->name('tahfidz.recap.show'); // Show Recap Detail

    // Plotting Penguji Tahfidz
    Route::post('/settings/tahfidz/testers', [App\Http\Controllers\TahfidzSettingController::class, 'storeTester'])->name('settings.tahfidz.testers.store');
    Route::delete('/settings/tahfidz/testers/{id}', [App\Http\Controllers\TahfidzSettingController::class, 'destroyTester'])->name('settings.tahfidz.testers.destroy');
    Route::get('/api/teachers/search', [App\Http\Controllers\TahfidzSettingController::class, 'searchTeachers'])->name('api.teachers.search');

    // Pantauan Halaqoh Settings
    Route::get('/tahfidz/halaqoh-settings', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'index'])->name('tahfidz.halaqoh-settings.index');
    Route::post('/tahfidz/halaqoh-settings/session', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'storeSession'])->name('tahfidz.halaqoh-settings.session.store');
    Route::put('/tahfidz/halaqoh-settings/session/{session}', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'updateSession'])->name('tahfidz.halaqoh-settings.session.update');
    Route::post('/tahfidz/halaqoh-settings/musyrif', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'storeMusyrif'])->name('tahfidz.halaqoh-settings.musyrif.store');
    Route::delete('/tahfidz/halaqoh-settings/musyrif/{musyrif}', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'destroyMusyrif'])->name('tahfidz.halaqoh-settings.musyrif.destroy');
    Route::post('/tahfidz/halaqoh-settings/officer', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'storeOfficer'])->name('tahfidz.halaqoh-settings.officer.store');
    Route::delete('/tahfidz/halaqoh-settings/officer/{officer}', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'destroyOfficer'])->name('tahfidz.halaqoh-settings.officer.destroy');
    // Halaqoh Members Route
    Route::post('/tahfidz/halaqoh-settings/members', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'storeMember'])->name('tahfidz.halaqoh-settings.members.store');
    Route::delete('/tahfidz/halaqoh-settings/members/{id}', [App\Http\Controllers\TahfidzHalaqohSettingsController::class, 'destroyMember'])->name('tahfidz.halaqoh-settings.members.destroy');

    // Pengaturan Tahfidz (Merged: Exam Period & Testers)
    Route::get('/settings/tahfidz', [App\Http\Controllers\TahfidzSettingController::class, 'index'])->name('settings.tahfidz.index');
    Route::post('/settings/tahfidz/exam-period', [App\Http\Controllers\TahfidzSettingController::class, 'store'])->name('settings.tahfidz.exam-period.store');
    Route::post('/settings/tahfidz/quran-skrining', [App\Http\Controllers\TahfidzSettingController::class, 'storeQuranSkrining'])->name('settings.tahfidz.quran-skrining.store');
    
    // Helper route untuk clear cache sudah dipindah ke SystemMaintenanceController
    // (lihat Route::post '/system/clear-cache' di bagian System Maintenance)

    // Pantauan Halaqoh Monitoring
    Route::get('/tahfidz/monitoring', [App\Http\Controllers\TahfidzMonitoringController::class, 'index'])->name('tahfidz.monitoring.index'); // List/History
    Route::get('/tahfidz/monitoring/create', [App\Http\Controllers\TahfidzMonitoringController::class, 'create'])->name('tahfidz.monitoring.create'); // Form
    Route::post('/tahfidz/monitoring', [App\Http\Controllers\TahfidzMonitoringController::class, 'store'])->name('tahfidz.monitoring.store');
    Route::get('/tahfidz/monitoring/{monitoring}', [App\Http\Controllers\TahfidzMonitoringController::class, 'show'])->name('tahfidz.monitoring.show');

    Route::get('/tahfidz/achievements', [App\Http\Controllers\TahfidzAchievementController::class, 'index'])->name('tahfidz.achievements.index'); // New Capaian
    Route::get('/tahfidz/achievements/search-students', [App\Http\Controllers\TahfidzAchievementController::class, 'searchStudents'])->name('tahfidz.achievements.search-students');
    Route::get('/tahfidz/achievements/{student}/data', [App\Http\Controllers\TahfidzAchievementController::class, 'getStudentData'])->name('tahfidz.achievements.data');
    Route::get('/tahfidz/achievements/{student}', [App\Http\Controllers\TahfidzAchievementController::class, 'show'])->name('tahfidz.achievements.show');
    Route::post('/tahfidz/achievements', [App\Http\Controllers\TahfidzAchievementController::class, 'store'])->name('tahfidz.achievements.store');

    // Analisa Tahfidz
    Route::get('/tahfidz/analysis', [App\Http\Controllers\TahfidzAnalysisController::class, 'index'])->name('tahfidz.analysis.index');

    // Character Assessments


    // Master Character
    // Pengaturan Bulan Akhlak Aktif
    Route::get('settings/master/character-settings', [App\Http\Controllers\CharacterSettingController::class, 'index'])->name('settings.master.character-settings.index');
    Route::post('settings/master/character-settings', [App\Http\Controllers\CharacterSettingController::class, 'store'])->name('settings.master.character-settings.store');

    Route::resource('settings/master/character-categories', App\Http\Controllers\CharacterCategoryController::class)->names('master.character-categories');

    // Sync Legacy
    Route::get('settings/sync/grades', [App\Http\Controllers\GradeSyncController::class, 'index'])->name('settings.sync.grades.index');
    Route::post('settings/sync/grades/upload', [App\Http\Controllers\GradeSyncController::class, 'upload'])->name('settings.sync.grades.upload');
    Route::post('settings/sync/grades/sync', [App\Http\Controllers\GradeSyncController::class, 'sync'])->name('settings.sync.grades.sync');

    // Sync Akhlak (Legacy)
    Route::get('settings/sync/akhlak', [App\Http\Controllers\CharacterSyncController::class, 'index'])->name('settings.sync.akhlak.index');
    Route::post('settings/sync/akhlak/upload', [App\Http\Controllers\CharacterSyncController::class, 'upload'])->name('settings.sync.akhlak.upload');
    Route::post('settings/sync/akhlak/process', [App\Http\Controllers\CharacterSyncController::class, 'sync'])->name('settings.sync.akhlak.sync');

    // Permissions (Perizinan)
    Route::resource('permissions', App\Http\Controllers\PermissionController::class);
    Route::get('permissions/kamar/{activeKamar}/students', [App\Http\Controllers\PermissionController::class, 'getStudents'])->name('permissions.students');

    // Health (Kesehatan)
    Route::prefix('care/health')->name('health.')->group(function () {
        Route::resource('complaints', App\Http\Controllers\HealthComplaintController::class);
        Route::resource('description-templates', App\Http\Controllers\HealthDescriptionTemplateController::class); // New
        Route::resource('records', App\Http\Controllers\StudentHealthRecordController::class);
        Route::patch('records/{record}/toggle-status', [App\Http\Controllers\StudentHealthRecordController::class, 'toggleStatus'])->name('records.toggle-status');
        Route::get('students/search', [App\Http\Controllers\StudentHealthRecordController::class, 'searchStudents'])->name('students.search');
    });

    // RFID Handling
    Route::get('rfid/scan', [App\Http\Controllers\RfidController::class, 'index'])->name('rfid.scan');
    Route::post('rfid/tap', [App\Http\Controllers\RfidController::class, 'tap'])->name('rfid.tap');



    Route::get('/settings/teacher/unavailable', [App\Http\Controllers\TeacherUnavailableController::class, 'index'])->name('settings.teacher.unavailable.index');
    Route::post('/settings/teacher/unavailable', [App\Http\Controllers\TeacherUnavailableController::class, 'update'])->name('settings.teacher.unavailable.update');
    Route::post('/academic/switch-state', [App\Http\Controllers\AcademicStateController::class, 'switch'])->name('academic.switch-state');

    // System Maintenance & Backup
    Route::post('/system/clear-cache', [App\Http\Controllers\SystemMaintenanceController::class, 'clearCache'])->name('system.clear-cache');
    
    Route::prefix('settings/system/backup')->name('settings.system.backup.')->group(function () {
        Route::get('/', [App\Http\Controllers\BackupController::class, 'index'])->name('index');
        Route::post('/run', [App\Http\Controllers\BackupController::class, 'run'])->name('run');
        Route::post('/test-email', [App\Http\Controllers\BackupController::class, 'testEmail'])->name('test-email');
        Route::get('/download/{filename}', [App\Http\Controllers\BackupController::class, 'download'])->name('download');
        Route::delete('/destroy/{filename}', [App\Http\Controllers\BackupController::class, 'destroy'])->name('destroy');
        Route::post('/settings', [App\Http\Controllers\BackupController::class, 'updateSettings'])->name('settings');
    });

    // API Key Management Route
    Route::prefix('settings/system/api-keys')->name('settings.api-keys.')->group(function () {
        Route::get('/', [App\Http\Controllers\ApiKeyController::class, 'index'])->name('index');
        Route::post('/', [App\Http\Controllers\ApiKeyController::class, 'store'])->name('store');
        
        // Tester Routes
        Route::get('/tester', [App\Http\Controllers\ApiKeyTesterController::class, 'index'])->name('tester');
        Route::post('/tester/run', [App\Http\Controllers\ApiKeyTesterController::class, 'runTest'])->name('tester.run');

        Route::put('/{apiKey}', [App\Http\Controllers\ApiKeyController::class, 'update'])->name('update');
        Route::delete('/{apiKey}', [App\Http\Controllers\ApiKeyController::class, 'destroy'])->name('destroy');
    });


    Route::get('/system/run-migration', function () {
        Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return "Migration completed. Check database.";
    })->name('system.run-migration');

    // Deployment Helper for cPanel
    Route::get('/up-migration', function () {
        try {
            Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            return "<h3>Database Migration Successful!</h3><p>Tabel database telah diperbarui.</p><a href='/dashboard'>Kembali ke Dashboard</a>";
        } catch (\Exception $e) {
            return "<h3>Error:</h3><pre>" . $e->getMessage() . "</pre>";
        }
    });

    Route::get('/clear-all-caches', function () {
        try {
            Illuminate\Support\Facades\Artisan::call('optimize:clear');
            return "<h3>Cache Cleared!</h3><p>Konfigurasi telah di-reset sepenuhnya. Silakan coba tes lagi.</p><a href='/teacher/ikhtabir-nafsi'>Kembali ke Tes</a>";
        } catch (\Exception $e) {
            return "<h3>Error:</h3><pre>" . $e->getMessage() . "</pre>";
        }
    });

    Route::get('/debug-env-path', function () {
        $path = base_path('.env');
        $exists = file_exists($path);

        // Manual Read Test
        $geminiFound = 'Not Found';
        if ($exists) {
            $lines = file($path);
            foreach ($lines as $line) {
                if (strpos($line, 'GEMINI_API_KEY') !== false) {
                    $geminiFound = 'Found in file: ' . substr(trim($line), 0, 20) . '...';
                }
            }
        }

        return [
            'base_path' => base_path(),
            'env_full_path' => $path,
            'file_exists' => $exists,
            'is_readable' => is_readable($path),
            'directory_contents' => scandir(base_path()),
            'php_user' => get_current_user(),
            'env_gemini_direct' => env('GEMINI_API_KEY'),
            'config_gemini' => config('services.gemini.api_key'),
            'manual_scan_result' => $geminiFound
        ];
    });

    Route::get('/debug-gemini-models', function () {
        $apiKey = config('services.gemini.api_key');
        if (empty($apiKey)) { // Fallback check
            $apiKey = env('GEMINI_API_KEY');
        }

        if (empty($apiKey)) {
            return response()->json(['error' => 'API Key is missing.'], 500);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::get("https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}");
            return $response->json();
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    });

    Route::get('/debug-ai-table', function () {
        $columns = Illuminate\Support\Facades\Schema::getColumnListing('ikhtabir_nafsi_attempts');
        $latest = \App\Models\IkhtabirNafsiAttempt::latest()->first();
        return response()->json([
            'columns' => $columns,
            'latest_attempt' => $latest
        ]);
    });
    // Ikhtabir Nafsi (Self-Test for Teachers)
    Route::prefix('teacher/ikhtabir-nafsi')->name('ikhtabir-nafsi.')->group(function () {
        Route::get('/', [App\Http\Controllers\IkhtabirNafsiController::class, 'index'])->name('index');
        Route::post('/', [App\Http\Controllers\IkhtabirNafsiController::class, 'store'])->name('store'); // Start Session
        Route::get('/session/{session}', [App\Http\Controllers\IkhtabirNafsiController::class, 'session'])->name('session');
        Route::post('/session/{session}/audio', [App\Http\Controllers\IkhtabirNafsiController::class, 'sendAudio'])->name('session.audio');
        Route::post('/session/{session}/finish', [App\Http\Controllers\IkhtabirNafsiController::class, 'finishSession'])->name('session.finish');
        Route::get('/show/{id}', [App\Http\Controllers\IkhtabirNafsiController::class, 'show'])->name('show');
        Route::post('/publish/{id}', [App\Http\Controllers\IkhtabirNafsiController::class, 'publish'])->name('publish');
        Route::post('/toggle-status', [App\Http\Controllers\IkhtabirNafsiController::class, 'toggleStatus'])->name('toggle-status');
        Route::delete('/{attempt}', [App\Http\Controllers\IkhtabirNafsiController::class, 'destroy'])->name('destroy');

        // Topic Management (Admin)
        Route::resource('topics', App\Http\Controllers\IkhtabirNafsiTopicController::class);
        Route::post('topics/{topic}/toggle', [App\Http\Controllers\IkhtabirNafsiTopicController::class, 'toggle'])->name('topics.toggle');

        // AI Model Management
        Route::post('update-models', [App\Http\Controllers\IkhtabirNafsiController::class, 'updateModels'])->name('update-models');
        Route::post('cleanup-abandoned', [App\Http\Controllers\IkhtabirNafsiController::class, 'cleanupAbandoned'])->name('cleanup-abandoned');
    });
});





// Temporary Seeder Route (Delete after use)
Route::get('/seed-rubrics', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'RubricSeeder', '--force' => true]);
        $output = Illuminate\Support\Facades\Artisan::output();

        Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $output .= "\n" . Illuminate\Support\Facades\Artisan::output();

        return "<pre>Seeding Success:\n$output</pre>";
    } catch (\Exception $e) {
        return "<pre>Error:\n" . $e->getMessage() . "</pre>";
    }
});

// Update Health Permissions Route
Route::get('/run-health-seeder', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'HealthUserLevelSeeder', '--force' => true]);
        $output = Illuminate\Support\Facades\Artisan::output();

        Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $output .= "\n" . Illuminate\Support\Facades\Artisan::output();

        return "<pre>Health Seeder Success:\n$output\n\nSilahkan coba login kembali sebagai Bagian Kesehatan.</pre>";
    } catch (\Exception $e) {
        return "<pre>Error:\n" . $e->getMessage() . "</pre>";
    }
});

Route::get('/seed-student-questions', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'StudentQuestionnaireSeeder', '--force' => true]);
        return "Pertanyaan Angket Santri berhasil di-reset dan diisi ulang (15 pertanyaan).";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/migrate-remedial', function () {
    try {
        // Run specific migration
        Illuminate\Support\Facades\Artisan::call('migrate', [
            '--force' => true,
            '--path' => 'database/migrations/2026_01_24_000000_add_original_score_to_student_grades.php'
        ]);
        return "Migration Remedial Berhasil! Silakan cek fitur remedial sekarang.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/migrate-hafalan', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('migrate', [
            '--force' => true,
            '--path' => 'database/migrations/2026_01_27_224042_create_tahfidz_memorizations_table.php'
        ]);
        return "Migration Capaian Hafalan BERHASIL! Tabel 'tahfidz_memorizations' telah dibuat.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/fix-health-perms', function () {
    try {
        $roleName = 'Bagian Kesehatan';
        $role = \App\Models\UserLevel::where('name', $roleName)->first();

        if (!$role) return "Role '$roleName' not found!";

        $perms = [
            'menu_dashboard',
            'view_health_records',
            'view_students',
            'menu_care',
            'view_dashboard_stats',
        ];

        foreach ($perms as $pName) {
            \App\Models\Permission::firstOrCreate(['name' => $pName]);
        }

        $currentPerms = $role->permissions ?? [];
        $updatedPerms = array_unique(array_merge($currentPerms, $perms));

        $role->permissions = $updatedPerms;
        $role->save();

        return "Permissions updated for $roleName. Silakan refresh dashboard (Logout login mungkin diperlukan).";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/populate-ijazah', function () {
    $list = [
        ['ar' => 'تحفيظ القرآن', 'id' => 'Tahfidz Al-Quran', 'search' => ['Tahfizh', 'Al-Qur\'an', 'Tahfidz']],
        ['ar' => 'التوحيد', 'id' => 'Tauhid', 'search' => ['Tauhid', 'Aqidah']],
        ['ar' => 'الحديث', 'id' => 'Hadits', 'search' => ['Hadits', 'Hadis']],
        ['ar' => 'الفقه', 'id' => 'Fiqh', 'search' => ['Fiqh', 'Fiqih']],
        ['ar' => 'الأخلاق', 'id' => 'Akhlak', 'search' => ['Akhlak', 'Adab']],
        ['ar' => 'التفسير', 'id' => 'Tafsir', 'search' => ['Tafsir']],
        ['ar' => 'الفرائض', 'id' => 'Faraidh', 'search' => ['Faraidh', 'Mawaris']],
        ['ar' => 'أصول الفقه', 'id' => 'Ushul Fiqh', 'search' => ['Ushul Fiqh']],
        ['ar' => 'أصول التفسير', 'id' => 'Ushul Tafsir', 'search' => ['Ushul Tafsir']],
        ['ar' => 'مصطلح الحديث', 'id' => 'Mustholah Hadits', 'search' => ['Musthalah', 'Mustholah']],
        ['ar' => 'المنهج', 'id' => 'Manhaj', 'search' => ['Manhaj']],
        ['ar' => 'التاريخ', 'id' => 'Tarikh', 'search' => ['Tarikh', 'Sejarah']],
        ['ar' => 'القواعد الفقهية', 'id' => 'Qawaid Fiqhiyyah', 'search' => ['Qawaid', 'Qowaid']],
        ['ar' => 'النحو', 'id' => 'Nahwu', 'search' => ['Nahwu']],
        ['ar' => 'المطالعة', 'id' => 'Mutholaah', 'search' => ['Mutholaah', 'Muthalaah']],
        ['ar' => 'البلاغة', 'id' => 'Balaghah', 'search' => ['Balaghah']],
        ['ar' => 'التعبير', 'id' => 'Ta\'bir', 'search' => ['Ta\'bir', 'Insya', 'Imla']],
    ];

    $subjects = [];
    foreach ($list as $item) {
        $mapelId = '';
        foreach ($item['search'] as $term) {
            $mapel = \App\Models\Mapel::where('name', 'like', "%$term%")->first();
            if ($mapel) {
                $mapelId = $mapel->id;
                break;
            }
        }

        $subjects[] = [
            'name' => $item['id'],
            'name_ar' => $item['ar'],
            'min_score' => 70,
            'max_score' => 100,
            'mapel_id' => $mapelId // Empty string if not found
        ];
    }

    \App\Models\Setting::updateOrCreate(
        ['key' => 'ijazah_subjects'],
        ['value' => json_encode($subjects)]
    );

    return response()->json(['message' => 'Ijazah Subjects Populated', 'data' => $subjects]);
});

// ============================================================
// UTILITY ROUTES - Hapus setelah digunakan
// ============================================================

// Debug Tahfidz Grades (lihat nilai score dan original_score langsung dari database)
Route::get('/debug-tahfidz-grades', [App\Http\Controllers\DebugTahfidzGradeController::class, 'index']);

// Clear Cache (untuk hosting tanpa terminal access)
Route::get('/clear-cache', function (\Illuminate\Http\Request $request) {
    $results = [];
    $commands = ['cache:clear', 'config:clear', 'route:clear', 'view:clear'];

    foreach ($commands as $cmd) {
        try {
            \Illuminate\Support\Facades\Artisan::call($cmd);
            $results[] = "✅ {$cmd} berhasil";
        } catch (\Exception $e) {
            $results[] = "❌ {$cmd} gagal: " . $e->getMessage();
        }
    }

    return response()->json([
        'message' => 'Cache clearing completed',
        'results' => $results
    ]);
});

// Setup API Ortu (tambah ORTU_API_KEY ke .env + clear cache)
Route::get('/setup-api-ortu', function (\Illuminate\Http\Request $request) {
    if ($request->query('token') !== 'setup2026') {
        return '<h2>403 Forbidden</h2><p>Tambahkan ?token=setup2026 di URL</p>';
    }

    $results = [];
    $apiKey  = 'sikap_ortu_301321e320a02a79df2afe9d7de241044d8d3e7e';
    $envPath = base_path('.env');
    $env     = file_get_contents($envPath);

    if (str_contains($env, 'ORTU_API_KEY=')) {
        $results[] = '✅ ORTU_API_KEY sudah ada di .env';
    } else {
        file_put_contents($envPath, $env . "\nORTU_API_KEY={$apiKey}\n");
        $results[] = '✅ ORTU_API_KEY berhasil ditambahkan ke .env';
    }

    foreach (['config:clear', 'route:clear', 'cache:clear'] as $cmd) {
        try {
            Illuminate\Support\Facades\Artisan::call($cmd);
            $results[] = "✅ {$cmd} selesai";
        } catch (\Exception $e) {
            $results[] = "⚠ {$cmd}: " . $e->getMessage();
        }
    }

    try {
        $count = \App\Models\User::whereHas('userLevel', fn($q) => $q->whereIn('name', ['Santri', 'Siswa']))->count();
        $results[] = "✅ Database OK — Total santri/siswa: {$count}";
    } catch (\Exception $e) {
        $results[] = "❌ DB error: " . $e->getMessage();
    }

    $lines = implode("\n", $results);
    return "<pre style='background:#111;color:#0f0;padding:20px;font-size:14px;'>"
        . "=== SETUP API ORTU ===\n\n{$lines}\n\n"
        . "API Key: {$apiKey}\n"
        . "Endpoint: " . config('app.url') . "/api/v1/student/{nomor_induk}/info\n"
        . "Endpoint: " . config('app.url') . "/api/v1/student/{nomor_induk}/grades\n\n"
        . "⚠ HAPUS ROUTE INI DARI web.php SETELAH SELESAI!</pre>";
});

// Reset Password Santri (password = nomor_induk)
Route::get('/reset-password-santri', function (\Illuminate\Http\Request $request) {
    if ($request->query('token') !== 'reset2026') {
        return '<h2>403 Forbidden</h2><p>Tambahkan ?token=reset2026 di URL</p>';
    }

    // Halaman konfirmasi awal
    if ($request->query('confirm') !== 'yes') {
        $total = \App\Models\User::whereHas('userLevel', fn($q) => $q->whereIn('name', ['Santri', 'Siswa', 'Siswa Khusus', 'Siswa Dengan Catatan']))
            ->where('status', 'Aktif')->whereNotNull('nomor_induk')->where('nomor_induk', '!=', '')->count();
        return "
        <div style='font-family:sans-serif;padding:40px;max-width:600px;margin:auto'>
            <h2 style='color:#d97706'>&#9888; Konfirmasi Reset Password Santri</h2>
            <p>Total santri aktif yang akan di-reset: <strong>{$total}</strong></p>
            <p>Password baru = <strong>Nomor Induk</strong> masing-masing santri.</p>
            <p><em>Proses otomatis per batch kecil, tidak akan timeout.</em></p>
            <p style='margin-top:24px'>
                <a href='/reset-password-santri?token=reset2026&confirm=yes&page=1&done=0'
                   style='background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold'>
                    &#10003; Ya, Mulai Reset
                </a>
                &nbsp;&nbsp;
                <a href='/dashboard' style='background:#6b7280;color:white;padding:12px 24px;text-decoration:none;border-radius:6px'>
                    Batal
                </a>
            </p>
        </div>";
    }
    // Proses batch kecil (20 santri/request) - anti timeout
    $perPage = 20;
    $page    = max(1, (int) $request->query('page', 1));
    $done    = (int) $request->query('done', 0);
    $tok     = $request->query('token');
    $roles   = ['Santri', 'Siswa', 'Siswa Khusus', 'Siswa Dengan Catatan'];

    $users = \App\Models\User::whereHas('userLevel', fn($q) => $q->whereIn('name', $roles))
        ->where('status', 'Aktif')
        ->whereNotNull('nomor_induk')
        ->where('nomor_induk', '!=', '')
        ->select(['id', 'nomor_induk'])
        ->skip(($page - 1) * $perPage)
        ->take($perPage)
        ->get();

    foreach ($users as $u) {
        \Illuminate\Support\Facades\DB::table('users')
            ->where('id', $u->id)
            ->update(['password' => \Illuminate\Support\Facades\Hash::make($u->nomor_induk)]);
    }

    $batch     = $users->count();
    $totalDone = $done + $batch;

    if ($batch === $perPage) {
        $next = "/reset-password-santri?token={$tok}&confirm=yes&page=" . ($page + 1) . "&done={$totalDone}";
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>
            <meta http-equiv='refresh' content='1;url={$next}'></head>
            <body style='font-family:sans-serif;padding:40px;text-align:center;background:#f0fdf4'>
                <h3>Memproses... {$totalDone} santri selesai</h3>
                <p>Batch ke-{$page} ({$batch} santri) OK. Lanjut otomatis...</p>
            </body></html>";
    }

    return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>
    <body style='font-family:sans-serif;padding:40px;max-width:400px;margin:auto;text-align:center'>
        <h2 style='color:#16a34a'>Reset Selesai!</h2>
        <div style='font-size:64px;font-weight:bold;color:#16a34a'>{$totalDone}</div>
        <p>Santri aktif di-reset. Password = Nomor Induk.</p>
        <p style='color:#dc2626;font-size:12px;margin-top:24px'>Hapus route ini dari web.php setelah selesai!</p>
    </body></html>";
});

// ============================================================
require __DIR__ . '/auth.php';


Route::get('/migrate-v6', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('migrate', [
            '--force' => true,
            '--path' => 'database/migrations/2026_01_29_000000_create_health_description_templates_table.php'
        ]);
        return "Migration V6 (Health Templates) BERHASIL! Tabel 'health_description_templates' telah dibuat.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});
Route::get('/system/sync-permissions', function () {
    try {
        $user = new \App\Models\User();
        $levels = \App\Models\UserLevel::all();
        $log = [];

        // 1. Collect ALL permissions from ALL levels
        $allPermissions = [];
        foreach ($levels as $level) {
            // Use reflection or temporary instance to access the private method if needed, 
            // but since we are modifying User.php later, we can just rely on the fact that 
            // we haven't deleted the hardcoded method yet.
            // Wait, the method getHardcodedPermissionsForLevel is private. 
            // We need to make it public temporarily OR just use a closure/reflection here.

            // Easier way: Instantiate User and call getAllPermissions if we mock the user level?
            // No, getting specific level permissions is private.
            // Let's copy the array logic directly here for the migration script to be safe and independent.
        }

        // Actually, better approach: Modify User.php FIRST to expose the array publicly 
        // OR just paste the arrays here. Pasting arrays is safest to avoid side effects during refactor.

        $hardcoded = [
            'Administrator' => ['*'],
            'Kepala Sekolah' => [
                'menu_dashboard',
                'menu_academic',
                'menu_care',
                'menu_finance',
                'menu_settings',
                'menu_tahfidz',
                'menu_analysis',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'view_dashboard_announcements',
                'view_users',
                'view_students',
                'view_active_classes',
                'view_active_subjects',
                'view_schedules',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'view_all_assessments',
                'view_grade_recap',
                'view_class_recap',
                'view_student_recap',
                'view_reports',
                'view_all_reports',
                'view_journals',
                'view_attendance_recap',
                'view_supervision_rpps',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_learning_analysis',
                'view_grade_analysis',
                'view_pickets',
            ],
            'Wali Kelas' => [
                'menu_dashboard',
                'menu_academic',
                'menu_analysis',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'view_students',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'create_assessments',
                'edit_assessments',
                'view_grade_recap',
                'view_class_recap',
                'view_student_recap',
                'view_reports',
                'create_report_notes',
                'view_journals',
                'create_journals',
                'edit_journals',
                'input_manual_attendance',
                'view_supervision_rpps',
                'view_pickets',
                'view_learning_analysis',
                'view_grade_analysis',
                'view_class_members',
            ],
            'Guru' => [
                'menu_dashboard',
                'menu_academic',
                'view_dashboard_stats',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'create_assessments',
                'edit_assessments',
                'view_journals',
                'create_journals',
                'view_supervision_rpps',
                'view_pickets',
                'view_students',
            ],
            'Musrif' => [
                'menu_dashboard',
                'menu_tahfidz',
                'view_dashboard_stats',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_students'
            ],
            'Bagian Kesehatan' => [
                'menu_dashboard',
                'menu_care',
                'view_students',
                'view_health_complaints',
            ],
            'Santri' => [
                'view_own_biodata',
                'view_own_grades',
                'view_own_finance',
                'view_own_schedule'
            ]
        ];

        // Ensure "Musyrif" (y) is treated as Musrif
        $hardcoded['Musyrif'] = $hardcoded['Musrif'];

        foreach ($levels as $level) {
            $roleName = $level->name;
            if (!isset($hardcoded[$roleName])) {
                $log[] = "Skipping Role: $roleName (No hardcoded defaults found)";
                continue;
            }

            $perms = $hardcoded[$roleName];
            $ids = [];

            foreach ($perms as $pName) {
                if ($pName === '*') {
                    // Skip wildcard for DB sync, handled by code logic for Admin typically, 
                    // but if we want to support it in DB, we need a '*' permission.
                    // For now, let's create it.
                }

                $permModel = \App\Models\Permission::firstOrCreate(['name' => $pName], ['description' => 'Auto generated']);
                $ids[] = $permModel->id;
            }

            $level->permissions()->sync($ids);
            $log[] = "Synced Role: $roleName (" . count($ids) . " permissions)";
        }

        return "<pre>" . implode("\n", $log) . "\n\nSync Finished!</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});
// Route untuk Repair Permissions (Darurat & Langsung)
Route::get('/system/repair-permissions', function () {
    try {
        // DIRECT REPAIR LOGIC (Bypassing Seeder Class)
        $teacherLevel = \App\Models\UserLevel::where('name', 'Guru')->first();
        if (!$teacherLevel) return "Error: Role 'Guru' not found.";

        $essentialPermissions = [
            'menu_dashboard',
            'menu_academic',
            'view_dashboard_stats',
            'view_dashboard_calendar',
            'view_academic_schedules',
            'view_silabus',
            'view_assessments',
            'create_assessments',
            'edit_assessments',
            'view_journals',
            'create_journals',
            'view_supervision_rpps',
            'view_pickets',
            'view_students',
            'view_class_members',
            'view_active_subjects'
        ];

        $log = [];
        $ids = [];
        foreach ($essentialPermissions as $permName) {
            $p = \App\Models\Permission::firstOrCreate(['name' => $permName]);
            $ids[] = $p->id;
            $log[] = "Checked/Created: $permName";
        }

        $teacherLevel->permissions()->syncWithoutDetaching($ids);

        return "<pre>SUCCESS! Teacher permissions REPAIRED.\n\nDetails:\n" . implode("\n", $log) . "\n\nSilakan LOGOUT dan LOGIN kembali.</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

// Route untuk Cek Permission (Debug)
Route::get('/system/check-my-access', function () {
    // 1. Clear Cache
    Illuminate\Support\Facades\Artisan::call('cache:clear');
    Illuminate\Support\Facades\Artisan::call('config:clear');

    $user = auth()->user();

    if (!$user) return "ANDA BELUM LOGIN. Silakan Login sebagai Guru.";

    $level = $user->userLevel;
    $perms = $user->getAllPermissions()->values()->all();

    // Check specific keys
    $hasMenuAcademic = in_array('menu_academic', $perms);
    $hasStats = in_array('view_dashboard_stats', $perms);

    return response()->json([
        'status' => 'DEBUG_ACCESS',
        'user' => [
            'name' => $user->name,
            'id' => $user->id,
            'role_id' => $user->user_level_id,
            'role_name' => $level->name,
        ],
        'check_result' => [
            'menu_academic_exists' => $hasMenuAcademic ? 'YES' : 'NO',
            'dashboard_stats_exists' => $hasStats ? 'YES' : 'NO',
        ],
        'total_permissions' => count($perms),
        'all_permissions' => $perms,
    ]);
});
// Route untuk RESET SYSTEM (Start from 0)
Route::get('/system/reset-zero', function () {
    try {
        // 1. Truncate Permission Assignments (Start from 0)
        Illuminate\Support\Facades\DB::table('permission_user_level')->truncate();

        // 2. Clear Cache
        Illuminate\Support\Facades\Artisan::call('cache:clear');

        return "<pre>SYSTEM RESET SUCCESSFUL!\n\nSemua hak akses (selain Admin) telah DIHAPUS (WIPE).\nSilakan mulai konfigurasi kembali dari NOL melalui menu Pengaturan.</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

// Route untuk STANDARDIZE ROLES (Satu Persepsi)
Route::get('/system/standardize-roles', function () {
    try {
        $log = [];

        // 1. Standardize MUSRIF
        // Musrif Asrama, Musyrif, Pembina Asrama, Musrif Kamar -> Musrif
        $affected = \App\Models\UserLevel::whereIn('name', ['Musrif Asrama', 'Musyrif', 'Pembina Asrama', 'Musrif Kamar'])->update(['name' => 'Musrif']);
        $log[] = "Updated to 'Musrif': $affected rows";

        // 2. Standardize GURU
        // Guru Mapel, Guru Kelas, Pengajar -> Guru
        $affected = \App\Models\UserLevel::whereIn('name', ['Guru Mapel', 'Guru Kelas', 'Pengajar'])->update(['name' => 'Guru']);
        $log[] = "Updated to 'Guru': $affected rows";

        // 3. Standardize Santri
        // Siswa -> Santri
        $affected = \App\Models\UserLevel::whereIn('name', ['Siswa'])->update(['name' => 'Santri']);
        $log[] = "Updated to 'Santri': $affected rows";

        return "<pre>ROLE STANDARDIZATION COMPLETE!\n\nDetails:\n" . implode("\n", $log) . "\n\nSekarang nama role sudah seragam (Guru, Musrif, Santri).</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

// FIX PERMISSIONS FOR TAHFIDZ (Added for cPanel execution)
Route::get('/system/fix-tahfidz-permissions', function () {
    $translations = [
        // Tahfidz Permissions
        'menu_tahfidz' => 'Akses Sidebar Utama Tahfidz Al-Qur\'an',
        'manage_tahfidz_testers' => 'Mengelola Penguji (Tambah/Hapus Penguji)',
        'view_tahfidz_testers' => 'Melihat Daftar Penguji Tahfidz',
        'view_all_tahfidz_grades' => 'Melihat Seluruh Nilai (Semua Kelas)',
        'view_tahfidz_halaqoh' => 'Melihat/Mengatur Halaqoh & Kelompok',
        'view_tahfidz_achievements' => 'Melihat Capaian Hafalan Santri',

        // New Granular Menu Permissions
        'menu_tahfidz_assessment' => 'Akses Menu Penilaian Tahfidz',
        'menu_tahfidz_recap' => 'Akses Menu Rekap Nilai (Tahfidz)',

        // Common Permissions (Contextualized)
        'menu_academic' => 'Akses Menu Pendidikan',
        'view_assessments' => 'Melihat & Input Nilai Pelajaran',
        'view_academic_schedules' => 'Melihat Jadwal Pelajaran',
        'view_silabus' => 'Melihat Silabus & Materi',
        'view_journals' => 'Mengisi Jurnal & Absensi',
        'input_manual_attendance' => 'Input Absensi Manual Wali Kelas',
        'print_manual_attendance' => 'Cetak Form Absensi Manual',
        'menu_care' => 'Akses Menu Utama Pengasuhan',
        'view_character_assessments' => 'Melihat & Input Penilaian Akhlak',
        'view_kamars' => 'Melihat Data Kamar & Asrama',
        'view_permissions' => 'Mengelola Perizinan Santri',
        'view_health_records' => 'Melihat Data Kesehatan (UKS)',
        'menu_supervision' => 'Akses Menu Supervisi Guru',
        'view_supervisions' => 'Melihat & Input Supervisi',
    ];

    $output = "--- Updating Permissions ---\n";
    foreach ($translations as $name => $desc) {
        $p = \App\Models\Permission::firstOrCreate(['name' => $name], ['description' => $desc]);
        if ($p->description !== $desc) {
            $p->update(['description' => $desc]);
        }
        $output .= "[OK] Ensured: $name -> $desc\n";
    }

    // Revoke sensitive from Guru
    $guru = \App\Models\UserLevel::where('name', 'Guru')->first();
    if ($guru) {
        $sensitive = ['view_all_tahfidz_grades', 'manage_tahfidz_testers', 'view_all_assessments'];
        $ids = \App\Models\Permission::whereIn('name', $sensitive)->pluck('id');
        $guru->permissions()->detach($ids);
        $output .= "[OK] Revoked sensitive permissions from Role: Guru\n";
    }

    return "<pre>$output\n--- Done ---</pre>";
});

// Route untuk FIX Missing Tahfidz Permissions (User Request)
// Route untuk FIX Missing Tahfidz Permissions (User Request)
Route::get('/system/fix-tahfidz-roles', function () {
    $scriptPath = base_path('fix_permission_descriptions.php');

    if (file_exists($scriptPath)) {
        // Capture output
        ob_start();
        try {
            require $scriptPath;
            $output = ob_get_clean();
            return "<pre>Script executed successfully:<br>" . htmlspecialchars($output) . "</pre>";
        } catch (\Exception $e) {
            ob_end_clean();
            return "<pre>Error executing script: " . $e->getMessage() . "</pre>";
        }
    } else {
        return "Script fix_permission_descriptions.php not found in root directory.";
    }
});
// Route MASTER RESET (GABUNGAN)
Route::get('/system/master-reset', function () {
    try {
        $log = [];

        // 1. STANDARDIZE ROLES
        $affected = \App\Models\UserLevel::whereIn('name', ['Musrif Asrama', 'Musyrif', 'Pembina Asrama', 'Musrif Kamar'])->update(['name' => 'Musrif']);
        $log[] = "Roles standardized to 'Musrif': $affected";
        $affected = \App\Models\UserLevel::whereIn('name', ['Guru Mapel', 'Guru Kelas', 'Pengajar'])->update(['name' => 'Guru']);
        $log[] = "Roles standardized to 'Guru': $affected";
        $affected = \App\Models\UserLevel::whereIn('name', ['Siswa'])->update(['name' => 'Santri']);
        $log[] = "Roles standardized to 'Santri': $affected";

        // 2. RESET PERMISSIONS (START FROM 0)
        Illuminate\Support\Facades\DB::table('permission_user_level')->truncate();
        $log[] = "All Permissions WIPED (Start from 0).";

        // 3. CLEAR CACHE
        Illuminate\Support\Facades\Artisan::call('cache:clear');
        $log[] = "System Cache Cleared.";

        return "<pre>MASTER RESET COMPLETE!\n\n" . implode("\n", $log) . "\n\nSekarang database sudah bersih dan standar.\nSilakan masuk ke Pengaturan Hak Akses untuk mulai konfigurasi.</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});
// STANDARD RESET FOR MANAGER ROLE
Route::get('/system/reset-manager-role', function () {
    try {
        $roleName = 'Manager';
        $level = \App\Models\UserLevel::where('name', $roleName)->first();

        if (!$level) {
            return "Error: Role '$roleName' not found.";
        }

        // Standard Permissions for Manager
        $standardPermissions = [
            'menu_dashboard',
            'view_dashboard_stats',
            'view_dashboard_calendar',

            // Pendidikan (Supervision & Recap)
            'menu_academic',
            'view_grade_recap',
            'view_class_recap',
            'view_reports',
            'menu_supervision',
            'view_supervisions',

            // Tahfidz
            'menu_tahfidz',
            'view_all_tahfidz_grades',
            'view_tahfidz_achievements',
            'menu_tahfidz_recap',

            // Pengasuhan
            'menu_care',
            'view_character_assessments',
            'view_kamars',
            'view_health_records',

            // Keuangan
            'menu_finance',
        ];

        $ids = [];
        $log = [];
        foreach ($standardPermissions as $name) {
            $p = \App\Models\Permission::firstOrCreate(['name' => $name]);
            if ($p->wasRecentlyCreated) {
                $p->update(['description' => 'Auto-generated by Reset Manager']);
            }
            $ids[] = $p->id;
            $log[] = "[ADDED] $name";
        }

        // Sync (Overwrite existing)
        $level->permissions()->sync($ids);

        return "<pre>Manager Role Reset Successful!\n\nAccessed Granted:\n" . implode("\n", $log) . "\n\nSekarang Manager memiliki akses standar (Pendidikan, Tahfidz, Pengasuhan, Keuangan).</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

Route::get('/system/debug-perms', function () {
    $user = auth()->user();
    if (!$user) return "Please Login First.";

    $user->load(['userLevel', 'additionalLevels']);

    $output = "<h1>Debug Permissions (SYSTEM ROUTE)</h1>";
    $output .= "<p>User: <strong>{$user->name}</strong></p>";
    $output .= "<p>Role: <strong>{$user->userLevel->name}</strong></p>";

    $perms = $user->getAllPermissions()->values()->toArray();

    $output .= "<h3>Raw Permissions Check:</h3>";
    $output .= "<pre>" . print_r($perms, true) . "</pre>";

    $checks = ['menu_finance', 'menu_care', 'menu_tahfidz'];
    $output .= "<h3>Critical Menus:</h3><ul>";
    foreach ($checks as $c) {
        $has = in_array($c, $perms) ? "✅ YES" : "❌ NO";
        $output .= "<li>$c: $has</li>";
    }
    $output .= "</ul>";

    $output .= "<h3>Wildcard Check:</h3>";
    $output .= "Has '*': " . (in_array('*', $perms) ? "YES (Hardcoded)" : "NO (DB Controlled)");

    return $output;
});

// Route RESCUE PERMISSIONS (Final Solution)
Route::get('/system/rescue-permissions', function () {
    try {
        $log = [];
        $log[] = "--- STARTING RESCUE PROTOCOL ---";

        // 1. Roles Definition
        $roles = [
            'Administrator' => ['*'],
            'Kepala Sekolah' => [
                'menu_dashboard',
                'menu_academic',
                'menu_care',
                'menu_finance',
                'menu_settings',
                'menu_tahfidz',
                'menu_analysis',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'view_dashboard_announcements',
                'view_users',
                'view_students',
                'view_active_classes',
                'view_active_subjects',
                'view_schedules',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'view_all_assessments',
                'view_grade_recap',
                'view_class_recap',
                'view_student_recap',
                'view_reports',
                'view_all_reports',
                'view_journals',
                'view_attendance_recap',
                'view_supervision_rpps',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_learning_analysis',
                'view_grade_analysis',
                'view_pickets',
            ],
            'Manager' => [
                'menu_dashboard',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'menu_academic',
                'view_grade_recap',
                'view_class_recap',
                'view_reports',
                'menu_supervision',
                'view_supervisions',
                'menu_tahfidz',
                'view_all_tahfidz_grades',
                'view_tahfidz_achievements',
                'menu_tahfidz_recap',
                'menu_care',
                'view_character_assessments',
                'view_kamars',
                'view_health_records',
                'menu_finance',
            ],
            'Wali Kelas' => [
                'menu_dashboard',
                'menu_academic',
                'menu_analysis',
                'view_dashboard_stats',
                'view_dashboard_calendar',
                'view_students',
                'view_class_members',
                'view_active_classes',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'create_assessments',
                'edit_assessments',
                'view_grade_recap',
                'view_class_recap',
                'view_student_recap',
                'view_reports',
                'create_report_notes',
                'view_journals',
                'create_journals',
                'edit_journals',
                'input_manual_attendance',
                'view_supervision_rpps',
                'view_pickets',
                'view_learning_analysis',
                'view_grade_analysis',
            ],
            'Guru' => [
                'menu_dashboard',
                'menu_academic',
                'view_dashboard_stats',
                'view_academic_schedules',
                'view_silabus',
                'view_assessments',
                'create_assessments',
                'edit_assessments',
                'view_journals',
                'create_journals',
                'view_supervision_rpps',
                'view_pickets',
                'view_students',
                'view_active_classes'
            ],
            'Musrif' => [
                'menu_dashboard',
                'menu_tahfidz',
                'view_dashboard_stats',
                'view_tahfidz_testers',
                'view_tahfidz_halaqoh',
                'view_students'
            ],
            'Bagian Kesehatan' => [
                'menu_dashboard',
                'menu_care',
                'view_students',
                'view_health_complaints',
                'view_health_records',
                'view_dashboard_stats'
            ],
            'Santri' => [
                'view_own_biodata',
                'view_own_grades',
                'view_own_finance',
                'view_own_schedule',
                'menu_tahfidz'
            ]
        ];

        foreach ($roles as $roleName => $perms) {
            $level = \App\Models\UserLevel::firstOrCreate(['name' => $roleName]);
            $ids = [];

            foreach ($perms as $pName) {
                if ($pName === '*') continue;
                $p = \App\Models\Permission::firstOrCreate(['name' => $pName]);
                $ids[] = $p->id;
            }

            if (!empty($ids)) {
                $level->permissions()->syncWithoutDetaching($ids);
                $log[] = "Updated Role: $roleName (" . count($ids) . " permissions)";
            }
        }

        // Clear Cache
        Illuminate\Support\Facades\Artisan::call('cache:clear');
        Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $log[] = "System Cache Cleared.";
        $log[] = "--- RESCUE COMPLETE ---";

        return "<pre>" . implode("\n", $log) . "\n\nSekarang silakan LOGOUT dan LOGIN kembali.</pre>";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});

// PATCH UPDATE ROUTE (Auto-generated for cPanel for Ikhtabir Nafsi)
Route::get('/update-patch-ikhtabir', function () {
    try {
        Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $output = "Migration:\n" . Illuminate\Support\Facades\Artisan::output();

        Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'IkhtabirNafsiTopicSeeder', '--force' => true]);
        $output .= "\nSeeding:\n" . Illuminate\Support\Facades\Artisan::output();

        Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $output .= "\nCache Cleared.\n";

        return "<pre>Update Patch Success!\n\n$output</pre><br><a href='/teacher/ikhtabir-nafsi'>Kembali ke Tes</a>";
    } catch (\Exception $e) {
        return "<pre>Error:\n" . $e->getMessage() . "</pre>";
    }
});
