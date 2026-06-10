<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Supervision;
use App\Models\SupervisionDetail;
use App\Models\SupervisionQuestion;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class SupervisionController extends Controller
{
    /**
     * Dedicated method for "My Supervision" view.
     * Strictly forces the view context to 'me' to prevent data leakage for Managers.
     */
    /**
     * Dedicated method for "My Supervision" view.
     * Redirects directly to the latest published supervision detail if exists.
     */
    public function mySupervision(Request $request)
    {
        $user = Auth::user();

        // Find the latest PUBLISHED supervision for this user
        $latest = Supervision::where('teacher_id', $user->id)
            ->where('is_published', true)
            ->latest('date')
            ->first();

        if ($latest) {
            return redirect()->route('supervisions.show', $latest);
        }

        // Fallback: If no data, show the list (which will be empty or show history)
        $request->merge(['view' => 'me']);
        return $this->index($request);
    }

    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $query = Supervision::with(['teacher', 'supervisor', 'activeSubject.activeClass.kelas', 'activeSubject.mapel'])
            ->latest('date');

        // Check for "My View" mode (forced by 'Rapor Supervisi Saya' menu)
        $forceMyView = $request->query('view') === 'me';

        $canViewAll = !$forceMyView && $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);
        $teachers = [];

        if ($canViewAll) {
            // Admin/Principal: Show All + Filter
            if ($request->filled('teacher_id')) {
                $query->where('teacher_id', $request->teacher_id);
            }

            // Get list for dropdown
            $teachers = User::where('status', 'Aktif')
                ->where(function ($query) {
                    $query->whereHas('userLevel', function ($q) {
                        $q->where('name', 'Guru');
                    })->orWhereHas('activeSubjects');
                })
                ->orderBy('name')
                ->get(['id', 'name']);
        } else {
            // Teacher: Show Own Only + Published Only (STRICT)
            // Ensures teachers only see their own supervision results after they are published/confirmed by supervisor.
            $query->where('teacher_id', $user->id)
                ->where('is_published', true);
        }

        // Capture Metric Query (Scoped but NOT filtered by category yet)
        $metricQuery = $query->clone();

        // Filter by Category (Status) for the LIST view
        if ($request->filled('category')) {
            $category = $request->category;
            $query->where('status', $category);
        }

        $supervisions = $query->paginate(10)->withQueryString();

        // Dashboard Metrics (Scoped)
        // ...

        if (!$canViewAll && $query->count() === 0) {
            // Debugging or simply handling consistency:
            // If a teacher has no published supervisions, $latestSupervision is null.
        }

        // Get Latest Supervision for Statistics (Teacher View)
        // Ensure we clone the filtered query so we don't leak other people's data if logic changes
        $latestSupervision = $query->clone()->with('details.question')->first();

        $isSingleView = !$canViewAll || $request->filled('teacher_id');

        // Calculate Metrics based on the METRIC QUERY (Global Distribution)
        // Total and Average usually show context of CURRENT VIEW.
        // If I filter by "Kurang", should total show "2" or "13"? 
        // User wants "Show All Pie", implying the Pie shows distribution of ALL.
        // So allow metrics to be Global (MetricQuery).

        $totalSupervisions = $metricQuery->clone()->count();
        $averageScore = $metricQuery->clone()->avg('total_score');

        // Category Counts using METRIC QUERY (Global Distribution)
        // This ensures the Pie Chart always shows full slices.
        $baseQuery = $metricQuery->clone();
        $categories = [
            'Sangat Baik' => (clone $baseQuery)->where('status', 'Sangat Baik')->count(),
            'Baik' => (clone $baseQuery)->where('status', 'Baik')->count(),
            'Cukup' => (clone $baseQuery)->where('status', 'Cukup')->count(),
            'Kurang' => (clone $baseQuery)->where('status', 'Kurang')->orWhereNull('status')->count(),
        ];

        // Aspect Analysis
        $supervisionIds = $baseQuery->pluck('id');
        $aspectAnalysis = SupervisionDetail::whereIn('supervision_id', $supervisionIds)
            ->selectRaw('supervision_question_id, AVG(score) as avg_score')
            ->groupBy('supervision_question_id')
            ->with('question')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->supervision_question_id,
                    'number' => $item->question->number ?? 0,
                    'aspect' => $item->question->aspect ?? 'Unknown',
                    'category' => $item->question->category ?? 'General',
                    'avg_score' => round($item->avg_score, 2),
                ];
            })
            ->sortBy('number')
            ->values();

        // Compliance Analysis - Remove or Update? 
        // Old compliance questions were specific (9, 11, 12, 25).
        // Since we truncated questions, these IDs/Numbers are invalid.
        // We will return empty for compatibility or remove.
        $compliance = [];

        return Inertia::render('Settings/Education/Supervision/Index', [
            'supervisions' => $supervisions,
            'filters' => [
                'teacher_id' => $request->teacher_id,
            ],
            'teachers' => $teachers,
            'canViewAll' => $canViewAll,
            'latestSupervision' => $latestSupervision,
            'isSingleView' => $isSingleView,
            'metrics' => [
                'total' => $totalSupervisions,
                'average' => round($averageScore, 2), // Raw average
                'categories' => $categories,
                'aspects' => $aspectAnalysis,
                'compliance' => $compliance,
            ]
        ]);
    }

    public function create()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            $this->authorize('create_supervisions');
        }
        // Fetch teachers (User with role 'guru' or connected to ActiveSubject)
        // Simplified: Fetch all users who are teachers
        // Adjust query based on your Role system implementation. 
        // Assuming simple role check or checking if they have active subjects
        $teachers = User::where('status', 'Aktif')
            ->where(function ($query) {
                $query->whereHas('userLevel', function ($q) {
                    $q->where('name', 'Guru');
                })->orWhereHas('activeSubjects');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $questions = SupervisionQuestion::with('rubrics')->orderBy('number')->get();

        // Fetch Academic Year and Semester context
        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $semester = \App\Models\Semester::where('is_active', true)->first();

        $categories = \App\Models\SupervisionCategory::orderBy('min_score', 'desc')->get();

        return Inertia::render('Settings/Education/Supervision/Create', [
            'teachers' => $teachers,
            'questions' => $questions,
            'context' => [
                'academic_year' => $academicYear,
                'semester' => $semester
            ],
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            $this->authorize('create_supervisions');
        }

        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'lesson_hours' => 'nullable|string|max:50', // e.g. "1-2"
            'semester_id' => 'required|exists:semesters,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'active_subject_id' => 'nullable|exists:active_subjects,id',
            'scores' => 'required|array', // key: question_id, value: score
            'scores.*' => 'required|integer|min:1|max:3',
            'notes' => 'nullable|array', // key: question_id, value: note
            'checked_items' => 'nullable|array', // key: question_id, value: array of strings
            'supervisor_note' => 'nullable|string', // General note
            'proof_file' => 'nullable|file|image|max:10240', // 10MB
        ]);

        // Handle File Upload
        $proofUrl = null;
        if ($request->hasFile('proof_file')) {
            $path = $request->file('proof_file')->store('supervision_proofs', 'public');
            $proofUrl = '/storage/' . $path;
        }

        $totalScore = array_sum($validated['scores']);
        $questionCount = \App\Models\SupervisionQuestion::count();
        $maxScore = $questionCount * 3;


        // Determine Category (Dynamic)
        $category = \App\Models\SupervisionCategory::getCategoryForScore($totalScore);
        $status = $category ? $category->name : 'Kurang';

        $supervision = Supervision::create([
            'teacher_id' => $validated['teacher_id'],
            'supervisor_id' => Auth::id(),
            'active_subject_id' => $validated['active_subject_id'] ?? null,
            'topic' => $validated['topic'] ?? null,
            'date' => $validated['date'],
            'lesson_hours' => $validated['lesson_hours'] ?? null,
            'semester_id' => $validated['semester_id'],
            'academic_year_id' => $validated['academic_year_id'],
            'total_score' => $totalScore,
            'status' => $status,
            'proof_url' => $proofUrl,
            'notes' => $validated['supervisor_note'] ?? null,
        ]);

        foreach ($validated['scores'] as $questionId => $score) {
            SupervisionDetail::create([
                'supervision_id' => $supervision->id,
                'supervision_question_id' => $questionId,
                'score' => $score,
                'notes' => $validated['notes'][$questionId] ?? null,
                'checked_items' => $validated['checked_items'][$questionId] ?? [],
            ]);
        }

        return redirect()->route('supervisions.show', $supervision)->with('success', 'Supervisi berhasil disimpan.');
    }

    public function createAI()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            $this->authorize('create_supervisions');
        }

        // Reusing similar data fetching as Create
        $teachers = User::where('status', 'Aktif')
            ->where(function ($query) {
                $query->whereHas('userLevel', function ($q) {
                    $q->where('name', 'Guru');
                })->orWhereHas('activeSubjects');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $questions = SupervisionQuestion::with('rubrics')->orderBy('number')->get();

        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $semester = \App\Models\Semester::where('is_active', true)->first();
        $categories = \App\Models\SupervisionCategory::orderBy('min_score', 'desc')->get();

        return Inertia::render('Settings/Education/Supervision/AICreate', [
            'teachers' => $teachers,
            'questions' => $questions,
            'context' => [
                'academic_year' => $academicYear,
                'semester' => $semester
            ],
            'categories' => $categories
        ]);
    }

    public function analyzeNote(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mode' => 'nullable|in:realtime,manual',
            'duration' => 'nullable|integer',
            'notes' => 'required', // Can be array or string
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Additional conditional validation
        $request->validate([
            'notes' => function ($attribute, $value, $fail) use ($request) {
                if ($request->mode === 'realtime' && !is_array($value)) {
                    $fail($attribute . ' must be an array of logs when in realtime mode.');
                }
                if ($request->mode === 'manual' && !is_string($value)) {
                    $fail($attribute . ' must be a string narrative when in manual mode.');
                }
            }
        ]);

        $questions = SupervisionQuestion::with('rubrics')->orderBy('number')->get();

        $aiService = new \App\Services\AISupervisionService();
        $results = $aiService->analyze($request->notes, $questions);

        return response()->json($results);
    }

    public function show(Supervision $supervision)
    {
        $supervision->load(['teacher', 'supervisor', 'details.question.rubrics', 'academicYear', 'semester', 'activeSubject.mapel', 'activeSubject.activeClass.kelas', 'activeSubject.activeClass.kelasParalel', 'studentQuestionnaireResponses.question']);

        // Visibility Check for Teacher
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $isTeacher = !$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']);

        if ($isTeacher && $user->id == $supervision->teacher_id && !$supervision->is_published) {
            abort(403, 'Hasil supervisi ini belum dipublikasikan oleh supervisor.');
        }

        $details = $supervision->details->map(function ($detail) {
            return [
                'question_number' => $detail->question->number,
                'category' => $detail->question->category,
                'aspect' => $detail->question->aspect,
                'score' => $detail->score,
                'notes' => $detail->notes,
                'checked_items' => $detail->checked_items,
                'rubrics' => $detail->question->rubrics, // Pass rubrics for gap analysis
            ];
        });

        return Inertia::render('Settings/Education/Supervision/Show', [
            'supervision' => $supervision,
            'details' => $details
        ]);
    }

    public function edit(Supervision $supervision)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            if ($user->id !== $supervision->supervisor_id) {
                abort(403, 'Unauthorized');
            }
        }

        $teachers = User::where('status', 'Aktif')
            ->where(function ($query) {
                $query->whereHas('userLevel', function ($q) {
                    $q->where('name', 'Guru');
                })->orWhereHas('activeSubjects');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $questions = SupervisionQuestion::with('rubrics')->orderBy('number')->get();
        $categories = \App\Models\SupervisionCategory::orderBy('min_score', 'desc')->get();

        return Inertia::render('Settings/Education/Supervision/Edit', [
            'supervision' => $supervision,
            'details' => $supervision->details,
            'teachers' => $teachers,
            'questions' => $questions,
            'categories' => $categories
        ]);
    }

    public function update(Request $request, Supervision $supervision)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            if ($user->id !== $supervision->supervisor_id) {
                abort(403, 'Unauthorized');
            }
        }

        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'hour' => 'nullable',
            'active_subject_id' => 'nullable|exists:active_subjects,id',
            'scores' => 'required|array',
            'scores.*' => 'required|integer|min:1|max:3',
            'notes' => 'nullable|array',
            'checked_items' => 'nullable|array',
            'supervisor_note' => 'nullable|string',
            'proof_file' => 'nullable|file|image|max:10240',
        ]);

        if ($request->hasFile('proof_file')) {
            $path = $request->file('proof_file')->store('supervision_proofs', 'public');
            $supervision->proof_url = '/storage/' . $path;
        }

        $totalScore = array_sum($validated['scores']);
        $category = \App\Models\SupervisionCategory::getCategoryForScore($totalScore);
        $status = $category ? $category->name : 'Kurang';

        $supervision->update([
            'teacher_id' => $validated['teacher_id'],
            'date' => $validated['date'],
            'lesson_hours' => $request->hour,
            'active_subject_id' => $validated['active_subject_id'],
            'total_score' => $totalScore,
            'status' => $status,
            'notes' => $validated['supervisor_note'] ?? null,
        ]);

        foreach ($validated['scores'] as $questionId => $score) {
            SupervisionDetail::updateOrCreate(
                ['supervision_id' => $supervision->id, 'supervision_question_id' => $questionId],
                [
                    'score' => $score,
                    'notes' => $validated['notes'][$questionId] ?? null,
                    'checked_items' => $validated['checked_items'][$questionId] ?? [],
                ]
            );
        }

        return redirect()->route('supervisions.show', $supervision)->with('success', 'Supervisi berhasil diperbarui.');
    }

    public function destroy(Supervision $supervision)
    {
        $supervision->delete();
        return redirect()->route('supervisions.index')->with('success', 'Data supervisi dihapus.');
    }

    public function publish(Supervision $supervision)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            abort(403, 'Unauthorized');
        }

        $supervision->update(['is_published' => true]);

        return redirect()->back()->with('success', 'Hasil supervisi berhasil dipublikasikan ke guru.');
    }

    public function toggleQuestionnaire(Supervision $supervision)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz'])) {
            abort(403, 'Unauthorized');
        }

        $supervision->update([
            'is_student_questionnaire_open' => !$supervision->is_student_questionnaire_open
        ]);

        $status = $supervision->is_student_questionnaire_open ? 'dibuka' : 'ditutup';
        return redirect()->back()->with('success', "Akses angket santri berhasil {$status}.");
    }

    public function checkSchedule(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required',
            'date' => 'required|date',
            'hour' => 'required|integer',
        ]);

        $date = \Carbon\Carbon::parse($request->date);

        // 1. Determine Day
        // Mapping Carbon dayOfWeekIso (1=Monday, 7=Sunday) to Database Day Names if needed, 
        // or simple string matching. Assuming Indonesian locale setup or manual array.
        $dayNames = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Ahad'
        ];
        $dayName = $dayNames[$date->dayOfWeekIso] ?? 'Minggu';

        $day = \App\Models\Day::where('name', $dayName)->orWhere('name', 'Minggu')->first();

        if (!$day) {
            return response()->json(['found' => false, 'message' => 'Hari tidak terdaftar.']);
        }

        // 2. Find LearningHour
        $learningHour = \App\Models\LearningHour::where('hour_number', $request->hour)->first();

        if (!$learningHour) {
            return response()->json(['found' => false, 'message' => 'Jam ke-' . $request->hour . ' tidak ditemukan.']);
        }

        // 3. Find Schedule
        // Check active academic year/semester context? Usually schedule depends on context, 
        // but let's assume active one or passed one.
        // For accurate history, we should strictly check the schedule active at that time.
        // But simplifying to current active schedule for now.
        $schedule = \App\Models\Schedule::where('teacher_id', $request->teacher_id)
            ->where('day_id', $day->id)
            ->where('learning_hour_id', $learningHour->id)
            ->with(['activeSubject.mapel', 'activeSubject.activeClass.kelas'])
            ->first();

        if (!$schedule) {
            return response()->json([
                'found' => false,
                'day' => $dayName,
                'message' => 'Tidak ada jadwal pada jam tersebut.'
            ]);
        }

        // 4. Find Pekan (Week)
        $pekan = \App\Models\Pekan::where('start_date', '<=', $date->format('Y-m-d'))
            ->where('end_date', '>=', $date->format('Y-m-d'))
            ->first();

        // 5. Find Silabus (Materi)
        $materi = null;
        $silabusData = [
            'materi' => '',
            'sk' => '',
            'kd' => '',
        ];

        // Fetch ALL available weeks for this Mapel + Class context
        $availableWeeks = [];
        if ($schedule->activeSubject) {
            $availableWeeks = \App\Models\Silabus::where('mapel_id', $schedule->activeSubject->mapel_id)
                ->where('kelas_id', $schedule->activeSubject->activeClass->kelas_id)
                ->orderBy('pekan', 'asc') // Assuming alphabetical, or cast to int if needed
                ->get()
                ->map(function ($s) {
                    return [
                        'pekan' => $s->pekan, // e.g., "Pekan 3" or "3"
                        'materi' => $s->materi,
                        'sk' => $s->standar_kompetensi,
                        'kd' => $s->kompetensi
                    ];
                });
        }

        if ($pekan && $schedule->activeSubject) {
            // Normalize Pekan: "Pekan 3" -> "3"
            $pekanNumber = preg_replace('/[^0-9]/', '', $pekan->name);
            $pekanVariations = [
                $pekan->name,           // "Pekan 3"
                $pekanNumber,           // "3"
                "Pekan ke-$pekanNumber", // "Pekan ke-3"
                (int)$pekanNumber       // 3 (integer)
            ];

            $silabus = \App\Models\Silabus::where('mapel_id', $schedule->activeSubject->mapel_id)
                ->where('kelas_id', $schedule->activeSubject->activeClass->kelas_id)
                ->whereIn('pekan', $pekanVariations)
                ->first();

            if ($silabus) {
                $materi = $silabus;
                $silabusData = [
                    'materi' => $silabus->materi,
                    'sk' => $silabus->standar_kompetensi,
                    'kd' => $silabus->kompetensi, // Often mapped to KD
                ];
            }
        }

        return response()->json([
            'found' => true,
            'day' => $dayName,
            'active_subject_id' => $schedule->active_subject_id,
            'mapel_name' => $schedule->activeSubject->mapel->name,
            'class_name' => $schedule->activeSubject->activeClass->name,
            'pekan' => $pekan ? $pekan->name : null,
            'topic' => $silabusData['materi'], // Keep strictly for backward compat if needed, but we use the object below
            'syllabus' => $silabusData, // Return structured data
            'available_weeks' => $availableWeeks,
            'schedule_id' => $schedule->id,
        ]);
    }
}
