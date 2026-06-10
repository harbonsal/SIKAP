<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Schedule;
use App\Models\AcademicYear;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        ini_set('memory_limit', '512M');
        $user = auth()->user();

        if (!$user->can('view_academic_schedules') && !$user->can('view_own_schedule')) {
            abort(403, 'Unauthorized. Anda tidak memiliki izin untuk melihat jadwal akademik.');
        }

        return Inertia::render('Settings/Education/Schedule/Workspace', $this->buildWorkspaceProps($request, [
            'defaultTab' => $request->query('tab', 'schedule'),
            'initialScheduleView' => $request->query('view'),
            'canManageWorkspace' => $this->canManageWorkspace($user),
        ]));
    }

    public function manage(Request $request)
    {
        return redirect()->route('settings.education.schedules.index', [
            'tab' => $request->query('tab', 'schedule'),
        ]);
    }

    public function updateSchoolInfo(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'header_config' => 'nullable|array',
            'schedule_config' => 'nullable|array',
        ]);

        $info = \App\Models\SchoolInfo::firstOrCreate([]);
        $info->update($validated);

        return back()->with('success', 'Informasi sekolah berhasil diperbarui.');
    }

    public function generate(Request $request, \App\Services\ScheduleGeneratorService $service)
    {
        try {
            $activeYear = $this->currentPlanningYear();
            $keepExisting = $request->boolean('keep_existing', false);
            
            $count = $service->generate($activeYear, $keepExisting);
            return back()->with('success', "Jadwal berhasil digenerate. {$count} slot tambahan terisi.");
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal generate jadwal: ' . $e->getMessage());
        }
    }

    public function downloadFet(
        Request $request, 
        \App\Services\Fet\FetXmlGeneratorService $generator
    ) {
        try {
            $activeYear = $this->currentPlanningYear();
            
            // 1. Generate XML
            $inputFilePath = $generator->generate($activeYear);
            
            // Return file as download
            return response()->download($inputFilePath, "SIKAP_Jadwal.fet");
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal membuat file FET: ' . $e->getMessage());
        }
    }

    public function uploadFet(
        Request $request,
        \App\Services\Fet\FetXmlParserService $parser
    ) {
        $request->validate([
            'fet_file' => 'required|file'
        ]);

        try {
            $activeYear = $this->currentPlanningYear();
            
            $file = $request->file('fet_file');
            $path = $file->storeAs('fet/upload', 'uploaded_timetable.fet');
            $fullPath = storage_path('app/' . $path);
            
            // Parse and Insert
            $count = $parser->parse($fullPath, $activeYear);
            
            return back()->with('success', "Jadwal berhasil dibaca dari file FET. {$count} slot terisi.");
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memproses file hasil FET: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        // Auto-create is_manual column if missing
        if (!\Illuminate\Support\Facades\Schema::hasColumn('schedules', 'is_manual')) {
            \Illuminate\Support\Facades\Schema::table('schedules', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->boolean('is_manual')->default(true);
            });
        }

        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'active_subject_id' => 'required|exists:active_subjects,id', // Mapel terpilih
            'day_id' => 'required|exists:days,id',
            'learning_hour_id' => 'required|exists:learning_hours,id',
        ]);

        $activeYear = $this->currentPlanningYear();
        $activeSubject = \App\Models\ActiveSubject::findOrFail($request->active_subject_id);

        // 1. Cek Bentrok Kelas (Kelas ini sudah ada jadwal di jam segitu?)
        $conflictClass = Schedule::where('active_class_id', $request->active_class_id)
            ->where('day_id', $request->day_id)
            ->where('learning_hour_id', $request->learning_hour_id)
            ->where('academic_year_id', $activeYear->id)
            ->exists();

        if ($conflictClass) {
            return back()->with('error', 'Bentrok: Kelas ini sudah memiliki jadwal pada Hari & Jam tersebut.');
        }

        // 2. Cek Bentrok Guru (Guru ini sudah mengajar di jam segitu?)
        // Cari semester aktif
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();
        $systemYear = \App\Services\AcademicStateService::activeAcademicYear();

        // Tentukan guru: cek override semester dulu, kalau tidak ada pakai guru tahunan
        $teacherId = $activeSubject->teacher_id; // Default tahunan

        // Hanya terapkan override jika tahun yang sedang direncanakan adalah tahun aktif
        if ($activeSemester && $systemYear && $activeYear->id === $systemYear->id) {
            // Cek override di tabel semester_subject_teachers
            $override = \App\Models\SemesterSubjectTeacher::where('active_subject_id', $activeSubject->id)
                ->where('semester_id', $activeSemester->id)
                ->first();

            if ($override && $override->teacher_id) {
                $teacherId = $override->teacher_id;
            }
        }

        if ($teacherId) {
            $conflictTeacher = Schedule::where('teacher_id', $teacherId)
                ->where('day_id', $request->day_id)
                ->where('learning_hour_id', $request->learning_hour_id)
                ->where('academic_year_id', $activeYear->id)
                ->with('activeSubject')
                ->first();

            if ($conflictTeacher) {
                $isCombined = false;
                if ($conflictTeacher->activeSubject && $activeSubject) {
                    if ($conflictTeacher->activeSubject->mapel_id == $activeSubject->mapel_id) {
                        $isCombined = true;
                    }
                }
                
                if (!$isCombined) {
                    return back()->with('error', 'Bentrok: Guru pengampu sudah memiliki jadwal di kelas lain pada waktu tersebut.');
                }
            }
        }

        Schedule::create([
            'academic_year_id' => $activeYear->id,
            'active_class_id' => $request->active_class_id,
            'active_subject_id' => $request->active_subject_id,
            'teacher_id' => $teacherId, // Simpan ID teacher yang benar (Semester atau Tahunan)
            'day_id' => $request->day_id,
            'learning_hour_id' => $request->learning_hour_id,
            'is_manual' => true,
        ]);

        return back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return back()->with('success', 'Jadwal berhasil dihapus.');
    }

    public function clear()
    {
        $activeYear = $this->currentPlanningYear();
        Schedule::where('academic_year_id', $activeYear->id)->delete();
        return back()->with('success', 'Seluruh jadwal berhasil dikosongkan.');
    }

    public function clearClass($classId)
    {
        $activeYear = $this->currentPlanningYear();
        Schedule::where('academic_year_id', $activeYear->id)
            ->where('active_class_id', $classId)
            ->delete();
        return back()->with('success', 'Jadwal kelas berhasil dikosongkan.');
    }

    public function bulkStore(Request $request)
    {
        // Auto-create is_manual column if missing
        if (!\Illuminate\Support\Facades\Schema::hasColumn('schedules', 'is_manual')) {
            \Illuminate\Support\Facades\Schema::table('schedules', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->boolean('is_manual')->default(true);
            });
        }

        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'schedule_items' => 'array', // format: [{ day_id, learning_hour_id, active_subject_id }]
        ]);

        $activeYear = $this->currentPlanningYear();
        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        $activeClassId = $request->active_class_id;
        $items = $request->schedule_items ?? [];

        // Pre-fetch Active Subjects to minimize queries
        $subjectIds = collect($items)->pluck('active_subject_id')->unique()->filter();
        $activeSubjects = \App\Models\ActiveSubject::whereIn('id', $subjectIds)->get()->keyBy('id');

        // 1. Collect wanted slots to "Sync" (Delete unmentioned slots for this class? No, maybe just update/upsert provided ones)
        // User requested "Grid Input", usually implies "What you see is what you get". 
        // Strategy: We will process each item. If active_subject_id is empty, we delete the schedule. If present, we update/create.

        \DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $dayId = $item['day_id'];
                $hourId = $item['learning_hour_id'];
                $subjectId = $item['active_subject_id']; // Can be null/empty string to clear slot

                // Existing schedule for this slot?
                $existing = Schedule::where('active_class_id', $activeClassId)
                    ->where('day_id', $dayId)
                    ->where('learning_hour_id', $hourId)
                    ->where('academic_year_id', $activeYear->id)
                    ->first();

                if (empty($subjectId)) {
                    // Remove if exists
                    if ($existing) {
                        $existing->delete();
                    }
                    continue;
                }

                // Prepare Teacher ID
                $activeSubject = $activeSubjects[$subjectId] ?? null;
                if (!$activeSubject) continue; // Should not happen if data valid

                $teacherId = $activeSubject->teacher_id;
                $systemYear = \App\Services\AcademicStateService::activeAcademicYear();
                if ($activeSemester && $systemYear && $activeYear->id === $systemYear->id) {
                    $override = \App\Models\SemesterSubjectTeacher::where('active_subject_id', $subjectId)
                        ->where('semester_id', $activeSemester->id)
                        ->first();
                    if ($override && $override->teacher_id) {
                        $teacherId = $override->teacher_id;
                    }
                }

                // Conflict Check (Only checks Teacher conflict, Class conflict is impossible as we are editing THE class)
                // Ignore conflict if it's the SAME active_subject_id (meaning no change) or same teacher in same slot?
                // Actually, if we are editing, we are the authority. 
                // But we must check if OTHER classes use this teacher at this time.

                if ($teacherId) {
                    $conflictTeacher = Schedule::where('teacher_id', $teacherId)
                        ->where('day_id', $dayId)
                        ->where('learning_hour_id', $hourId)
                        ->where('academic_year_id', $activeYear->id)
                        ->where('active_class_id', '!=', $activeClassId) // Don't conflict with self
                        ->with('activeSubject')
                        ->first();

                    if ($conflictTeacher) {
                        $isCombined = false;
                        if ($conflictTeacher->activeSubject && $activeSubject) {
                            if ($conflictTeacher->activeSubject->mapel_id == $activeSubject->mapel_id) {
                                $isCombined = true;
                            }
                        }

                        if (!$isCombined) {
                            throw new \Exception("Bentrok Guru: " . $conflictTeacher->teacher->name . " sudah mengajar di kelas " . $conflictTeacher->activeClass->kelas->name . " pada Hari " . $conflictTeacher->day->name . " Jam ke-" . $conflictTeacher->learningHour->hour_number);
                        }
                    }
                }

                if ($existing) {
                    if ($existing->active_subject_id == $subjectId && $existing->teacher_id == $teacherId) {
                        // Jika tidak ada perubahan mapel/guru, pertahankan status is_manual (bisa false jika dari auto-generate)
                        $existing->update([
                            'active_subject_id' => $subjectId,
                            'teacher_id' => $teacherId,
                        ]);
                    } else {
                        // Ada perubahan manual oleh user
                        $existing->update([
                            'active_subject_id' => $subjectId,
                            'teacher_id' => $teacherId,
                            'is_manual' => true,
                        ]);
                    }
                } else {
                    Schedule::create([
                        'active_class_id' => $activeClassId,
                        'day_id' => $dayId,
                        'learning_hour_id' => $hourId,
                        'academic_year_id' => $activeYear->id,
                        'active_subject_id' => $subjectId,
                        'teacher_id' => $teacherId,
                        'is_manual' => true,
                    ]);
                }
            }
            \DB::commit();
            return back()->with('success', 'Jadwal kelas berhasil diperbarui.');
        } catch (\Exception $e) {
            \DB::rollback();
            return back()->with('error', $e->getMessage());
        }
    }

    public function copyClasses(Request $request, \App\Services\AcademicPreparationService $preparationService)
    {
        if (!$this->canManageWorkspace($request->user())) {
            abort(403, 'Anda tidak memiliki izin untuk menyalin struktur tahun ajaran.');
        }

        $request->validate([
            'source_year_id' => 'required|exists:academic_years,id',
        ]);

        $targetYear = $this->currentPlanningYear();

        if ((int) $request->source_year_id === (int) $targetYear->id) {
            return back()->with('error', 'Tahun sumber dan tahun tujuan tidak boleh sama.');
        }

        $sourceYear = AcademicYear::findOrFail($request->source_year_id);
        $result = $preparationService->copyActiveClasses($sourceYear, $targetYear);

        return back()->with(
            'success',
            "Kelas aktif dari {$sourceYear->name} berhasil disalin ke {$targetYear->name}. {$result['created']} dibuat, {$result['updated']} diperbarui."
        );
    }

    public function copySubjects(Request $request, \App\Services\AcademicPreparationService $preparationService)
    {
        if (!$this->canManageWorkspace($request->user())) {
            abort(403, 'Anda tidak memiliki izin untuk menyalin struktur tahun ajaran.');
        }

        $request->validate([
            'source_year_id' => 'required|exists:academic_years,id',
        ]);

        $targetYear = $this->currentPlanningYear();

        if ((int) $request->source_year_id === (int) $targetYear->id) {
            return back()->with('error', 'Tahun sumber dan tahun tujuan tidak boleh sama.');
        }

        $sourceYear = AcademicYear::findOrFail($request->source_year_id);
        $result = $preparationService->copyActiveSubjects($sourceYear, $targetYear);

        return back()->with(
            'success',
            "Mapel, jam, dan plotting guru dari {$sourceYear->name} berhasil disalin ke {$targetYear->name}. {$result['created']} dibuat, {$result['updated']} diperbarui, {$result['skipped']} dilewati karena kelas target belum tersedia."
        );
    }

    public function copyTeacherSettings(Request $request, \App\Services\AcademicPreparationService $preparationService)
    {
        if (!$this->canManageWorkspace($request->user())) {
            abort(403, 'Anda tidak memiliki izin untuk menyalin struktur tahun ajaran.');
        }

        $request->validate([
            'source_year_id' => 'required|exists:academic_years,id',
        ]);

        $targetYear = $this->currentPlanningYear();

        if ((int) $request->source_year_id === (int) $targetYear->id) {
            return back()->with('error', 'Tahun sumber dan tahun tujuan tidak boleh sama.');
        }

        $sourceYear = AcademicYear::findOrFail($request->source_year_id);
        $result = $preparationService->copyTeacherSettings($sourceYear, $targetYear);

        return back()->with(
            'success',
            "Kuota dan jam off guru dari {$sourceYear->name} berhasil disalin ke {$targetYear->name}. Kuota: {$result['quotaCreated']} dibuat, {$result['quotaUpdated']} diperbarui. Jam off: {$result['offTeachers']} guru, {$result['offSlots']} slot."
        );
    }

    private function canManageWorkspace($user): bool
    {
        return $user->hasPermission('edit_active_subjects')
            || $user->hasPermission('create_active_subjects')
            || $user->hasPermission('edit_active_classes')
            || $user->hasPermission('create_active_classes')
            || $user->hasPermission('edit_access_control')
            || $user->userLevel?->name === 'Administrator';
    }

    private function buildWorkspaceProps(Request $request, array $overrides = []): array
    {
        $activeYear = $this->currentPlanningYear();
        $systemYear = \App\Services\AcademicStateService::activeAcademicYear();
        $schoolInfo = \App\Models\SchoolInfo::first();

        $activeClasses = \App\Models\ActiveClass::where('academic_year_id', $activeYear->id)
            ->withCount('classMembers')
            ->with([
                'academicYear',
                'kelas',
                'kelasParalel',
                'teacher',
                'activeSubjects.mapel',
                'activeSubjects.teacher',
                'activeSubjects.semesterSubjectTeachers.teacher',
                'activeSubjects.semesterSubjectTeachers.semester',
            ])
            ->get()
            ->sort(function ($a, $b) {
                $nameCmp = strnatcmp($a->kelas->name ?? '', $b->kelas->name ?? '');
                if ($nameCmp !== 0) {
                    return $nameCmp;
                }

                return strnatcmp($a->kelasParalel->name ?? '', $b->kelasParalel->name ?? '');
            })
            ->values();

        $schedules = \App\Models\Schedule::where('academic_year_id', $activeYear->id)
            ->with([
                'activeClass.kelas',
                'activeClass.kelasParalel',
                'activeSubject.mapel',
                'teacher',
                'day',
                'learningHour',
            ])
            ->get();

        $days = \App\Models\Day::orderBy('order')->get();

        $activeSlots = \App\Models\DayLearningHour::where('is_active', true)
            ->with(['learningHour'])
            ->get()
            ->groupBy('day_id');

        $learningHours = \App\Models\LearningHour::orderBy('hour_number')->get();

        $teacherBaseQuery = \App\Models\User::where('status', 'Aktif')
            ->where(function ($q) use ($activeYear) {
                $q->whereHas('userLevel', function ($subQ) {
                    $subQ->where('category', 'Ustadz');
                })
                    ->orWhereHas('additionalLevels', function ($subQ) {
                        $subQ->where('category', 'Ustadz');
                    })
                    ->orWhereHas('teacherQuota', function ($subQ) use ($activeYear) {
                        $subQ->where('academic_year_id', $activeYear->id);
                    })
                    ->orWhereHas('activeSubjects', function ($subQ) use ($activeYear) {
                        $subQ->whereHas('activeClass', function ($classQ) use ($activeYear) {
                            $classQ->where('academic_year_id', $activeYear->id);
                        });
                    });
            });

        $teachers = (clone $teacherBaseQuery)
            ->with(['userLevel'])
            ->orderBy('name')
            ->get();


        $classAnalysis = $activeClasses->map(function ($class) use ($schedules) {
            $targetHours = $class->total_hours_per_week ?: 35;
            $assignedHours = $schedules->where('active_class_id', $class->id)->count();
            $missingTeacherCount = $class->activeSubjects->whereNull('teacher_id')->count();

            return [
                'id' => $class->id,
                'name' => ($class->kelas->name ?? '') . ($class->kelasParalel ? ' ' . $class->kelasParalel->name : ''),
                'full_name' => $class->name ? $class->name : (($class->kelas->name ?? '') . ($class->kelasParalel ? ' ' . $class->kelasParalel->name : '')),
                'teacher' => $class->teacher,
                'target_hours' => $targetHours,
                'assigned_hours' => $assignedHours,
                'remaining_hours' => max(0, $targetHours - $assignedHours),
                'is_complete' => $assignedHours >= $targetHours,
                'missing_teacher_count' => $missingTeacherCount,
                'status' => ($assignedHours < $targetHours) ? 'Kurang Jam' : 'Lengkap',
            ];
        })
            ->sortBy('name')
            ->values();

        $teacherLoadSummaries = (clone $teacherBaseQuery)
            ->with(['userLevel'])
            ->with(['teacherQuota' => function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            }])
            ->with(['activeSubjects' => function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($classQ) use ($activeYear) {
                    $classQ->where('academic_year_id', $activeYear->id);
                })->with(['mapel', 'activeClass.kelas', 'activeClass.kelasParalel']);
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($teacher) use ($schedules) {
                $teacher->assigned_hours = $schedules->where('teacher_id', $teacher->id)->count();
                $teacher->max_hours = $teacher->teacherQuota?->max_hours ?? 0;

                return $teacher;
            })
            ->values();

        $summary = [
            'total_classes' => $classAnalysis->count(),
            'incomplete_hours_count' => $classAnalysis->where('is_complete', false)->count(),
            'missing_teacher_count' => $classAnalysis->where('missing_teacher_count', '>', 0)->count(),
            'total_unallocated_hours' => $classAnalysis->sum('remaining_hours'),
        ];

        $unavailableByTeacher = \App\Models\TeacherUnavailableHour::where('academic_year_id', $activeYear->id)
            ->get()
            ->groupBy('user_id')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return $item->day_id . '-' . $item->learning_hour_id;
                })->values();
            });

        $mapels = \App\Models\Mapel::orderBy('name')->get(['id', 'name', 'nama_arab']);
        $kelasOptions = \App\Models\Kelas::with('jenjang')->orderBy('name')->get(['id', 'name', 'jenjang_id']);
        $kelasParalels = \App\Models\KelasParalel::orderBy('name')->get(['id', 'name']);
        $semesters = \App\Models\Semester::orderBy('id')->get(['id', 'name', 'is_active']);

        return array_merge([
            'activeYear' => $activeYear,
            'systemAcademicYear' => $systemYear,
            'preparationSourceYears' => AcademicYear::where('id', '!=', $activeYear->id)
                ->orderBy('name', 'desc')
                ->get(['id', 'name', 'is_active']),
            'schoolInfo' => $schoolInfo,
            'schedules' => $schedules,
            'activeClasses' => $activeClasses,
            'days' => $days,
            'activeSlots' => $activeSlots,
            'learningHours' => $learningHours,
            'teachers' => $teachers,
            'mapels' => $mapels,
            'kelasOptions' => $kelasOptions,
            'kelasParalels' => $kelasParalels,
            'semesters' => $semesters,
            'teacherLoadSummaries' => $teacherLoadSummaries,
            'classAnalysis' => $classAnalysis,
            'summary' => $summary,
            'unavailableByTeacher' => $unavailableByTeacher,
            'defaultTab' => 'schedule',
            'initialScheduleView' => 'master',
            'initialClassId' => $activeClasses->first()?->id,
            'initialTeacherId' => null,
            'canManageWorkspace' => false,
        ], $overrides);
    }

    private function currentPlanningYear(): AcademicYear
    {
        return \App\Services\AcademicStateService::currentAcademicYear()
            ?? AcademicYear::where('is_active', true)->firstOrFail();
    }
}
