<?php

namespace App\Http\Controllers;

use App\Models\ClassJournal;
use App\Models\ActiveSubject;
use App\Models\StudentAttendance;
use App\Models\AcademicYear;
use App\Models\Pekan;
use App\Models\LearningHour;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;


class JournalController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $query = ClassJournal::with(['activeSubject.mapel', 'activeSubject.activeClass.kelas', 'activeSubject.activeClass.kelasParalel']);

        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager')) {
            $query->where('teacher_id', $user->id);
        }

        // Apply Filters
        $query->when(request('start_date'), function ($q) {
            $q->whereDate('date', '>=', request('start_date'));
        });

        $query->when(request('end_date'), function ($q) {
            $q->whereDate('date', '<=', request('end_date'));
        });

        $query->when(request('active_class_id'), function ($q) {
            $q->whereHas('activeSubject', function ($subQ) {
                $subQ->where('active_class_id', request('active_class_id'));
            });
        });

        $query->when(request('mapel_id'), function ($q) {
            $q->whereHas('activeSubject', function ($subQ) {
                $subQ->where('mapel_id', request('mapel_id'));
            });
        });

        $journals = $query->latest()
            ->paginate(10)
            ->withQueryString();

        // Data for Filters
        // Use ActiveClass and Mapel models. Assuming necessary imports or full path.
        // Better to use full path to avoid import errors if not imported at top, or add imports.
        // Let's add imports in a separate step or just use full path here for safety/speed if I don't want to re-read top.
        // But cleaner to add use statements. I'll use full path for now to minimize disruption to top of file lines.

        $classes = \App\Models\ActiveClass::with(['kelas', 'kelasParalel'])
            ->whereHas('academicYear', function ($q) {
                $q->where('is_active', true);
            })
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->kelas->name . ' ' . ($c->kelasParalel->name ?? ''),
                ];
            })
            ->sortBy('name')
            ->values();

        $mapels = \App\Models\Mapel::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Academic/Journal/Index', [
            'journals' => $journals,
            'filters' => request()->all(['start_date', 'end_date', 'active_class_id', 'mapel_id']),
            'classes' => $classes,
            'mapels' => $mapels,
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $today = now();
        $time = now()->format('H:i:s');

        // 1. Detect Active Academic Year
        $academicYear = AcademicYear::where('is_active', true)->first();

        // 2. Detect Active Week (Pekan)
        $currentPekan = Pekan::where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->first();

        // 3. Detect Current Period (Jam Ke)
        $currentHour = LearningHour::where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->first();

        $jamKe = $currentHour ? $currentHour->hour_number : '';

        // 4. Get Teacher's Active Subjects
        // Assuming the logged in user IS the teacher.
        // If the user is Admin, they might need to select a teacher, but let's stick to "Ustadz masuk kelas" scenario.
        $activeSubjects = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'mapel'])
            ->whereHas('activeClass', function ($q) use ($academicYear) {
                if ($academicYear) {
                    $q->where('academic_year_id', $academicYear->id);
                }
            });

        // Filter by teacher if not Admin
        if (!$user->hasRole('Administrator')) {
            $activeSubjects->where(function ($q) use ($user) {
                $q->where('teacher_id', $user->id)
                    ->orWhereHas('semesterSubjectTeachers', function ($query) use ($user) {
                        $query->where('teacher_id', $user->id);
                    });
            });
        }

        $activeSubjects = $activeSubjects->get()
            ->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'name' => ($subject->mapel?->name ?? 'Mapel?') . ' - ' . ($subject->activeClass?->kelas?->name ?? '?') . ' ' . ($subject->activeClass?->kelasParalel?->name ?? ''),
                    'class_name' => ($subject->activeClass?->kelas?->name ?? '?') . ' ' . ($subject->activeClass?->kelasParalel?->name ?? ''),
                ];
            });

        return Inertia::render('Academic/Journal/Create', [
            'academicYear' => $academicYear,
            'currentPekan' => $currentPekan,
            'jamKe' => $jamKe,
            'activeSubjects' => $activeSubjects,
            'date' => $today->format('Y-m-d'),
            'selectedSubjectId' => $request->active_subject_id,
        ]);
    }

    public function getStudents(ActiveSubject $activeSubject)
    {
        $students = $activeSubject->activeClass?->classMembers()
            ->with(['student.user'])
            ->get()
            ->filter(fn($member) => $member->student !== null)
            ->map(function ($member) {
                return [
                    'id' => $member->student->user_id ?? $member->student->id,
                    'name' => $member->student->name,
                    'nis' => $member->student->nomor_induk ?? $member->student->nis ?? '-',
                ];
            })
            ->values() ?? collect();

        return response()->json($students);
    }

    public function getSilabus(ActiveSubject $activeSubject)
    {
        $mapelId = $activeSubject->mapel_id;
        $kelasId = $activeSubject->activeClass?->kelas_id;

        $defaultSemester = \App\Services\AcademicStateService::currentSemester()->name ?? 'Ganjil';
        $semesterValues = (strtolower($defaultSemester) === 'ganjil' || $defaultSemester == '1')
            ? ['Ganjil', 'ganjil', '1']
            : ['Genap', 'genap', '2'];

        $query = \App\Models\Silabus::where('mapel_id', $mapelId);

        if ($kelasId) {
            $query->where(function ($q) use ($kelasId) {
                $q->where('kelas_id', $kelasId)
                  ->orWhereNull('kelas_id');
            });
        }

        if (!empty($semesterValues)) {
            $query->where(function ($q) use ($semesterValues) {
                $q->whereIn('semester', $semesterValues)
                  ->orWhereNull('semester');
            });
        }

        $silabuses = $query->orderBy('pekan', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Fallback jika tidak ditemukan spesifik kelas/semester
        if ($silabuses->isEmpty()) {
            $silabuses = \App\Models\Silabus::where('mapel_id', $mapelId)
                ->orderBy('pekan', 'asc')
                ->orderBy('id', 'asc')
                ->get();
        }

        return response()->json($silabuses);
    }

    public function getLastJournal(ActiveSubject $activeSubject)
    {
        $lastJournal = ClassJournal::where('active_subject_id', $activeSubject->id)
            ->latest('date')
            ->latest('id')
            ->first(['id', 'topic', 'description', 'date', 'jam_ke']);

        return response()->json($lastJournal);
    }

    public function missing(Request $request)
    {
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfWeek()->format('Y-m-d'));
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfWeek()->format('Y-m-d'));
        $teacherId = $request->input('teacher_id');
        $activeClassId = $request->input('active_class_id');

        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();

        $teachers = \App\Models\User::whereHas('activeSubjects')->orderBy('name')->get(['id', 'name']);
        $classes = \App\Models\ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $academicYear?->id)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => ($c->kelas?->name ?? '') . ' ' . ($c->kelasParalel?->name ?? ''),
            ])->sortBy('name')->values();

        $schedulesQuery = \App\Models\Schedule::with(['activeSubject.mapel', 'activeSubject.activeClass.kelas', 'activeSubject.activeClass.kelasParalel', 'day', 'teacher', 'learningHour'])
            ->where('academic_year_id', $academicYear?->id);

        if ($teacherId) {
            $schedulesQuery->where('teacher_id', $teacherId);
        }
        if ($activeClassId) {
            $schedulesQuery->whereHas('activeSubject', function($q) use ($activeClassId) {
                $q->where('active_class_id', $activeClassId);
            });
        }

        $schedules = $schedulesQuery->get();

        $journals = ClassJournal::whereBetween('date', [$startDate, $endDate])
            ->where('academic_year_id', $academicYear?->id)
            ->get();

        $currentDate = \Carbon\Carbon::parse($startDate);
        $endDateObj = \Carbon\Carbon::parse($endDate);
        $today = \Carbon\Carbon::today();
        $loopEndDate = $endDateObj->gt($today) ? $today : $endDateObj;

        $carbonToDayName = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Ahad',
        ];

        $days = \App\Models\Day::all()->keyBy('name');
        $missingGrouped = [];

        while ($currentDate->lte($loopEndDate)) {
            $dayName = $carbonToDayName[$currentDate->dayOfWeekIso];
            $dayNameAlt = ($dayName === 'Ahad') ? 'Minggu' : $dayName;
            $dayModel = $days->get($dayName) ?? $days->get($dayNameAlt);

            if ($dayModel) {
                $dailySchedules = $schedules->where('day_id', $dayModel->id);
                $dateStr = $currentDate->format('Y-m-d');

                foreach ($dailySchedules as $sch) {
                    $tId = $sch->teacher_id;
                    $subjectId = $sch->active_subject_id;

                    $hasJournal = $journals->where('teacher_id', $tId)
                        ->where('active_subject_id', $subjectId)
                        ->where('date', $dateStr)
                        ->first();

                    if (!$hasJournal) {
                        if (!isset($missingGrouped[$tId])) {
                            $missingGrouped[$tId] = [
                                'teacher_name' => $sch->teacher?->name ?? 'Unknown',
                                'schedules' => [],
                            ];
                        }

                        $missingGrouped[$tId]['schedules'][] = [
                            'day_name' => $dayName,
                            'date' => $currentDate->translatedFormat('d M Y'),
                            'jam_ke' => $sch->learningHour?->hour_number ?? '-',
                            'waktu' => ($sch->learningHour ? $sch->learningHour->start_time . ' - ' . $sch->learningHour->end_time : '-'),
                            'class_name' => ($sch->activeSubject?->activeClass?->kelas?->name ?? '-') . ' ' . ($sch->activeSubject?->activeClass?->kelasParalel?->name ?? ''),
                            'mapel_name' => $sch->activeSubject?->mapel?->name ?? '-',
                        ];
                    }
                }
            }
            $currentDate->addDay();
        }

        return Inertia::render('Academic/Journal/Missing', [
            'missing' => array_values($missingGrouped),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'teacher_id' => $teacherId,
                'active_class_id' => $activeClassId,
            ],
            'teachers' => $teachers,
            'classes' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'active_subject_id' => 'required|exists:active_subjects,id',
            'date' => 'required|date',
            'jam_ke' => 'required',
            'topic' => 'required|string',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:Hadir,Sakit,Izin,Alpa,Terlambat',
        ]);

        $activeSubject = ActiveSubject::findOrFail($request->active_subject_id);

        DB::transaction(function () use ($request, $activeSubject) {
            // Create Journal
            $journal = ClassJournal::create([
                'active_subject_id' => $request->active_subject_id,
                'teacher_id' => Auth::id(),
                'academic_year_id' => $activeSubject->activeClass->academic_year_id,
                'pekan_id' => $request->pekan_id, // Sent from form (auto-detected or manual)
                'jam_ke' => $request->jam_ke,
                'date' => $request->date,
                'topic' => $request->topic,
                'description' => $request->description,
                'status' => 'submitted',
            ]);

            // Create Attendances
            foreach ($request->attendances as $attendance) {
                // Determine status locally to avoid trust issues? No, trust teacher input.
                // Only save if status is NOT Hadir? 
                // Proposal says "Default Hadir", but we should save all for explicit records? 
                // Saving all is safer for "Confirmed Present" vs "Forgot to Input".
                // But to save space, maybe only non-present? 
                // Let's save ALL for now for completeness.

                StudentAttendance::create([
                    'class_journal_id' => $journal->id,
                    'student_id' => $attendance['student_id'],
                    'status' => $attendance['status'],
                    'note' => $attendance['note'] ?? null,
                ]);
            }
        });

        return redirect()->route('journals.index')->with('success', 'Jurnal dan Absensi berhasil disimpan.');
    }

    public function edit(ClassJournal $journal)
    {
        $user = Auth::user();

        // Authorization: Only Creator or Admin/Manager/KS
        if ($journal->teacher_id !== $user->id && !$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager')) {
            abort(403);
        }

        $journal->load(['activeSubject.activeClass.kelas', 'activeSubject.activeClass.kelasParalel', 'activeSubject.mapel', 'studentAttendances.student']);

        // Re-fetch subjects for the dropdown (simplified logic from create)
        $activeClass = $journal->activeSubject->activeClass;
        $academicYearId = $activeClass ? $activeClass->academic_year_id : null;

        $activeSubjects = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'mapel'])
            ->whereHas('activeClass', function ($q) use ($academicYearId) {
                if ($academicYearId) {
                    $q->where('academic_year_id', $academicYearId);
                }
            });

        if (!$user->hasRole('Administrator')) {
            $activeSubjects->where(function ($q) use ($user) {
                // If editing own journal, surely they have access to the subject? 
                // But let's keep it loose: if they are the teacher OR if they are the journal creator (already checked)
                // Actually, if I am the journal creator, I should be able to see the subject I selected.
                // The filter in `create` is to restrict what they can *start* with.
                // Here we just want to allow them to perhaps switch subject? Or maybe just Lock it?
                // Let's allow switching but restricted to their subjects.
                $q->where('teacher_id', $user->id)
                    ->orWhereHas('semesterSubjectTeachers', function ($query) use ($user) {
                        $query->where('teacher_id', $user->id);
                    });
            });
        }

        $activeSubjects = $activeSubjects->get()
            ->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'name' => ($subject->mapel?->name ?? 'Mapel?') . ' - ' . ($subject->activeClass?->kelas?->name ?? '?') . ' ' . ($subject->activeClass?->kelasParalel?->name ?? ''),
                ];
            });

        // We also need the list of students for the attendance form.
        // The `getStudents` API returns them, but for Edit we might want to pre-load them.
        // Let's use the same `getStudents` logic but manually here to pass as prop if needed, 
        // OR simpler: The frontend `Edit.jsx` will likely fetch students on mount based on `active_subject_id`.
        // BUT we need to merge with existing attendance.

        // Let's fetch the class members to ensure we show everyone, then merge status.
        $classMembers = $journal->activeSubject->activeClass->classMembers()
            ->with('student')
            ->get()
            ->map(function ($member) use ($journal) {
                // Find existing attendance
                $attendance = $journal->studentAttendances->firstWhere('student_id', $member->student->user_id);

                return [
                    'student_id' => $member->student->user_id, // User ID
                    'name' => $member->student->name,
                    'nis' => $member->student->nomor_induk ?? '-',
                    'status' => $attendance ? $attendance->status : 'Hadir', // Default to Hadir if new student?
                    'note' => $attendance ? $attendance->note : '',
                ];
            });

        return Inertia::render('Academic/Journal/Edit', [
            'journal' => $journal,
            'activeSubjects' => $activeSubjects,
            'initialStudents' => $classMembers,
        ]);
    }

    public function update(Request $request, ClassJournal $journal)
    {
        $user = Auth::user();
        if ($journal->teacher_id !== $user->id && !$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager')) {
            abort(403);
        }

        $request->validate([
            'active_subject_id' => 'required|exists:active_subjects,id',
            'date' => 'required|date',
            'jam_ke' => 'required',
            'topic' => 'required|string',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:Hadir,Sakit,Izin,Alpa,Terlambat',
        ]);

        $activeSubject = ActiveSubject::findOrFail($request->active_subject_id);

        DB::transaction(function () use ($request, $journal, $activeSubject) {

            $journal->update([
                'active_subject_id' => $request->active_subject_id,
                // 'teacher_id' => ... don't change teacher
                // 'academic_year_id' => ... don't change academic year easily? assumes same subject year.
                'jam_ke' => $request->jam_ke,
                'date' => $request->date,
                'topic' => $request->topic,
                'description' => $request->description,
            ]);

            // Update Attendances
            // Strategy: Loop through request and updateOrCreate
            // What if a student was removed from class? We probably keep the record??
            // Or what if we need to remove attendance for a student who is no longer there?
            // Let's just update based on the list provided.

            foreach ($request->attendances as $attendance) {
                StudentAttendance::updateOrCreate(
                    [
                        'class_journal_id' => $journal->id,
                        'student_id' => $attendance['student_id'],
                    ],
                    [
                        'status' => $attendance['status'],
                        'note' => $attendance['note'] ?? null,
                    ]
                );
            }
        });

        return redirect()->route('journals.index')->with('success', 'Jurnal dan Absensi berhasil diperbarui.');
    }
}
