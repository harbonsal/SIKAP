<?php

namespace App\Http\Controllers;

use App\Models\ActiveSubject;
use App\Models\ActiveClass;
use App\Models\Mapel;
use App\Models\User;
use App\Models\AcademicYear;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ActiveSubjectController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_active_subjects')->only(['index', 'show']);
        $this->middleware('permission:create_active_subjects')->only(['store']);
        $this->middleware('permission:edit_active_subjects')->only(['update']);
        $this->middleware('permission:delete_active_subjects')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $request->academic_year_id ?? ($activeYear ? $activeYear->id : null);

        // List Grades (Kelas) that have active classes in the selected year
        $query = Kelas::join('jenjangs', 'kelas.jenjang_id', '=', 'jenjangs.id')
            ->whereHas('activeClasses', function ($q) use ($activeYearId) {
                $q->where('academic_year_id', $activeYearId);
            })->with(['activeClasses' => function ($q) use ($activeYearId) {
                $q->where('academic_year_id', $activeYearId);
            }])
            ->select('kelas.*');

        if ($request->has('search')) {
            $query->where('kelas.name', 'like', '%' . $request->search . '%');
        }

        $grades = $query->orderBy('jenjangs.name')
            ->orderBy('kelas.name')
            ->paginate(10)
            ->withQueryString();

        // Transform data for the view
        $grades->getCollection()->transform(function ($grade) {
            // Pick the first active class as representative for ID and subject count
            $representative = $grade->activeClasses->first();

            return [
                'id' => $representative ? $representative->id : null, // Use active_class_id for link
                'kelas_name' => $grade->name,
                'active_subjects_count' => $representative ? $representative->activeSubjects()->count() : 0,
                // Teacher might be different per parallel class, but we'll show the first one or 'Varies'
                'teacher' => $representative && $representative->teacher ? $representative->teacher : null,
            ];
        });

        return Inertia::render('Settings/Education/ActiveSubject/Index', [
            'grades' => $grades, // Renamed from activeClasses
            'activeYearId' => $activeYearId,
            'filters' => $request->only(['search', 'academic_year_id']),
        ]);
    }

    public function show(ActiveClass $activeSubject) // Route param is 'active_subject' (active_class_id)
    {
        // $activeSubject is one of the parallel classes (e.g., 7A)
        // We want to manage subjects for the whole Grade (7)

        $activeClass = $activeSubject->load(['academicYear', 'kelas', 'kelasParalel', 'teacher']);

        // Fetch subjects for this specific class (assuming all parallels are synced)
        $subjects = ActiveSubject::where('active_class_id', $activeClass->id)
            ->with(['mapel', 'teacher'])
            ->get()
            ->sortBy('mapel.name')
            ->values();

        // Get subjects NOT in this class yet
        $assignedMapelIds = ActiveSubject::where('active_class_id', $activeClass->id)->pluck('mapel_id');

        $availableMapels = Mapel::whereNotIn('id', $assignedMapelIds)
            ->orderBy('name')
            ->get();

        // Get all teachers (Exclude Santri)
        $teachers = User::whereHas('userLevel', function ($q) {
            $q->where('name', '!=', 'Santri');
        })->get();

        // Calculate Analysis Data
        $totalAssignedHours = $subjects->sum('jam');
        // Use total_hours_per_week from ActiveClass (default to 35 if not set or 0)
        $targetHours = $activeClass->total_hours_per_week ?: 35;

        return Inertia::render('Settings/Education/ActiveSubject/Show', [
            'activeClass' => $activeClass,
            'subjects' => $subjects,
            'availableMapels' => $availableMapels,
            'teachers' => $teachers,
            'analysis' => [
                'total_assigned' => $totalAssignedHours,
                'target' => $targetHours,
                'is_valid' => $totalAssignedHours >= $targetHours,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'mapel_id' => 'required|exists:mapels,id',
            'jam' => 'required|integer|min:0',
        ]);

        $representativeClass = ActiveClass::findOrFail($request->active_class_id);

        // Find ALL sibling active classes (Same Grade, Same Year)
        $siblingClasses = ActiveClass::where('kelas_id', $representativeClass->kelas_id)
            ->where('academic_year_id', $representativeClass->academic_year_id)
            ->get();

        DB::transaction(function () use ($siblingClasses, $request) {
            foreach ($siblingClasses as $class) {
                // Check if already exists to avoid duplicates
                $exists = ActiveSubject::where('active_class_id', $class->id)
                    ->where('mapel_id', $request->mapel_id)
                    ->exists();

                if (!$exists) {
                    ActiveSubject::create([
                        'active_class_id' => $class->id,
                        'mapel_id' => $request->mapel_id,
                        'teacher_id' => null, // Explicitly null, managed in SubjectTeacher
                        'jam' => $request->jam,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Mapel berhasil ditambahkan ke semua kelas paralel.');
    }

    public function update(Request $request, ActiveSubject $activeSubject)
    {
        $request->validate([
            'jam' => 'required|integer|min:0',
        ]);

        // $activeSubject belongs to one class. We need to find its "siblings" in other parallel classes.
        $currentClass = $activeSubject->activeClass;

        $siblingClasses = ActiveClass::where('kelas_id', $currentClass->kelas_id)
            ->where('academic_year_id', $currentClass->academic_year_id)
            ->pluck('id');

        // Update ALL active subjects with same mapel_id in these classes
        ActiveSubject::whereIn('active_class_id', $siblingClasses)
            ->where('mapel_id', $activeSubject->mapel_id)
            ->update([
                'jam' => $request->jam,
            ]);

        return redirect()->back()->with('success', 'Guru pengampu berhasil diperbarui untuk semua kelas paralel.');
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'subjects' => 'required|array',
            'subjects.*.id' => 'required|exists:active_subjects,id',
            'subjects.*.jam' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->subjects as $item) {
                // Find the subject
                $activeSubject = ActiveSubject::find($item['id']);
                if (!$activeSubject) continue;

                // Only update if changed
                if ($activeSubject->jam == $item['jam']) continue;

                // Sync with siblings (Parallel Classes)
                $currentClass = $activeSubject->activeClass;
                $siblingClasses = ActiveClass::where('kelas_id', $currentClass->kelas_id)
                    ->where('academic_year_id', $currentClass->academic_year_id)
                    ->pluck('id');

                ActiveSubject::whereIn('active_class_id', $siblingClasses)
                    ->where('mapel_id', $activeSubject->mapel_id)
                    ->update(['jam' => $item['jam']]);
            }
        });

        return redirect()->back()->with('success', 'Jam pelajaran berhasil diperbarui.');
    }

    public function destroy(ActiveSubject $activeSubject)
    {
        $currentClass = $activeSubject->activeClass;

        $siblingClasses = ActiveClass::where('kelas_id', $currentClass->kelas_id)
            ->where('academic_year_id', $currentClass->academic_year_id)
            ->pluck('id');

        // Delete ALL active subjects with same mapel_id in these classes
        ActiveSubject::whereIn('active_class_id', $siblingClasses)
            ->where('mapel_id', $activeSubject->mapel_id)
            ->delete();

        return redirect()->back()->with('success', 'Mapel berhasil dihapus dari semua kelas paralel.');
    }

    public function copyFromClass(Request $request, ActiveClass $activeClass)
    {
        $request->validate([
            'source_class_id' => 'required|exists:active_classes,id',
        ]);

        if ((int)$request->source_class_id === (int)$activeClass->id) {
            return redirect()->back()->with('error', 'Tidak dapat menyalin dari kelas yang sama.');
        }

        $sourceSubjects = ActiveSubject::where('active_class_id', $request->source_class_id)->get();

        DB::transaction(function () use ($sourceSubjects, $activeClass) {
            // Find all sibling classes of the TARGET class to keep them in sync
            $siblingClasses = ActiveClass::where('kelas_id', $activeClass->kelas_id)
                ->where('academic_year_id', $activeClass->academic_year_id)
                ->get();

            foreach ($sourceSubjects as $src) {
                foreach ($siblingClasses as $class) {
                    ActiveSubject::updateOrCreate(
                        [
                            'active_class_id' => $class->id,
                            'mapel_id' => $src->mapel_id,
                        ],
                        [
                            'jam' => $src->jam,
                            // Set teacher_id explicitly if you want to copy it. The user requested to copy the teacher too.
                            'teacher_id' => $src->teacher_id,
                        ]
                    );
                }
            }
        });

        return redirect()->back()->with('success', 'Daftar Mapel dan Guru berhasil disalin.');
    }
}
