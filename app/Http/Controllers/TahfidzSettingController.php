<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\ActiveSubject;
use App\Models\TahfidzTester;
use App\Models\User;
use App\Models\TahfidzStandardTarget;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TahfidzSettingController extends Controller
{
    public function index()
    {
        // --- 1. Exam Period Data ---
        $startDate = Setting::where('key', 'tahfidz_exam_start_date')->value('value');
        $endDate = Setting::where('key', 'tahfidz_exam_end_date')->value('value');
        $quranSkriningEnabled = Setting::where('key', 'quran_skrining_enabled')->value('value') !== '0';
        $defaultSabqi = Setting::where('key', 'default_target_sabqi_pages')->value('value') ?? 1;
        $defaultManzil = Setting::where('key', 'default_target_manzil_pages')->value('value') ?? 1;

        // --- 2. Tester Plotting Data (From TahfidzTesterController) ---
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        $tahfidzMapel = \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
            ->orWhere('name', 'like', '%Tahfidz%')
            ->orderByRaw("CASE WHEN name LIKE '%Al-Quran%' THEN 0 ELSE 1 END")
            ->first();

        $subjectsWithTesters = [];

        if ($tahfidzMapel) {
            // Fetch Active Subjects for Tahfidz
            $activeSubjects = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])
                ->where('mapel_id', $tahfidzMapel->id)
                ->whereHas('activeClass', function ($q) use ($activeYear) {
                    $q->where('academic_year_id', $activeYear->id);
                })
                ->get();

            // Auto-populate Functionality (Lazy Load / Init)
            DB::transaction(function () use ($activeSubjects) {
                foreach ($activeSubjects as $subject) {
                    $existing = TahfidzTester::where('active_subject_id', $subject->id)->exists();
                    if (!$existing) {
                        $waliKelasId = $subject->activeClass->teacher_id;
                        $subjectTeacherId = $subject->teacher_id;
                        $mainTesterId = $waliKelasId ?: $subjectTeacherId;

                        if ($mainTesterId) {
                            TahfidzTester::create([
                                'active_subject_id' => $subject->id,
                                'user_id' => $mainTesterId,
                                'type' => 'main'
                            ]);
                        }
                    }
                }
            });

            // Fetch Subjects WITH Testers for Display
            $subjectsWithTesters = ActiveSubject::with([
                'activeClass.kelas',
                'activeClass.kelasParalel',
                'tahfidzTesters.user'
            ])
                ->where('mapel_id', $tahfidzMapel->id)
                ->whereHas('activeClass', function ($q) use ($activeYear) {
                    $q->where('academic_year_id', $activeYear->id);
                })
                ->get()
                ->sortBy(function ($subject) {
                    $jenjangId = $subject->activeClass->kelas->jenjang_id ?? 999;
                    $className = $subject->activeClass->kelas->name ?? '';
                    $parallelName = $subject->activeClass->kelasParalel->name ?? '';
                    // Zero-pad jenjangId to ensure numeric sorting as string
                    return sprintf('%04d-%s-%s', $jenjangId, $className, $parallelName);
                })
                ->values()
                ->map(function ($subject) {
                    return [
                        'id' => $subject->id,
                        'active_class_id' => $subject->active_class_id,
                        'class_name' => $subject->activeClass->kelas->name . ($subject->activeClass->kelasParalel ? ' ' . $subject->activeClass->kelasParalel->name : ''),
                        'testers' => $subject->tahfidzTesters->map(function ($tester) {
                            return [
                                'id' => $tester->id,
                                'user_id' => $tester->user_id,
                                'name' => $tester->user->name,
                                'type' => $tester->type,
                            ];
                        }),
                    ];
                });
        }

        $standardTargets = TahfidzStandardTarget::with('jenjang')
            ->orderBy('jenjang_id')
            ->orderBy('semester_number')
            ->get();
            
        $jenjangs = Jenjang::orderBy('id')->get(['id', 'name']);

        return Inertia::render('Settings/Tahfidz/Index', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'subjects' => $subjectsWithTesters,
            'quranSkriningEnabled' => $quranSkriningEnabled,
            'defaultSabqi' => $defaultSabqi,
            'defaultManzil' => $defaultManzil,
            'standardTargets' => $standardTargets,
            'jenjangs' => $jenjangs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'default_sabqi' => 'nullable|numeric',
            'default_manzil' => 'nullable|numeric',
        ]);

        Setting::updateOrCreate(
            ['key' => 'tahfidz_exam_start_date'],
            ['value' => $request->start_date]
        );

        Setting::updateOrCreate(
            ['key' => 'tahfidz_exam_end_date'],
            ['value' => $request->end_date]
        );

        if ($request->has('default_sabqi')) {
            Setting::updateOrCreate(
                ['key' => 'default_target_sabqi_pages'],
                ['value' => $request->default_sabqi]
            );
        }
        
        if ($request->has('default_manzil')) {
            Setting::updateOrCreate(
                ['key' => 'default_target_manzil_pages'],
                ['value' => $request->default_manzil]
            );
        }

        return redirect()->back()->with('success', 'Pengaturan masa ujian dan target berhasil disimpan.');
    }

    public function storeQuranSkrining(Request $request)
    {
        abort_unless($request->user()?->hasRole(['Administrator', 'Manager Tahfidz']), 403);

        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        Setting::updateOrCreate(
            ['key' => 'quran_skrining_enabled'],
            ['value' => $validated['enabled'] ? '1' : '0']
        );

        // Clear cache to ensure setting takes effect immediately
        \Cache::forget('quran_skrining_enabled');

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'enabled' => $validated['enabled'],
                'message' => $validated['enabled']
                    ? 'Menu Skrining Al-Quran berhasil diaktifkan.'
                    : 'Menu Skrining Al-Quran berhasil dinonaktifkan.'
            ]);
        }

        return redirect()->back()->with(
            'success',
            $validated['enabled']
                ? 'Menu Skrining Al-Quran berhasil diaktifkan.'
                : 'Menu Skrining Al-Quran berhasil dinonaktifkan.'
        );
    }

    // --- Tester Logic ---

    public function storeTester(Request $request)
    {
        $request->validate([
            'active_subject_id' => 'required|exists:active_subjects,id',
            'user_id' => 'required|exists:users,id',
            'type' => 'required|in:main,assistant'
        ]);

        // Prevent Duplicate
        $exists = TahfidzTester::where('active_subject_id', $request->active_subject_id)
            ->where('user_id', $request->user_id)
            ->exists();

        if ($exists) {
            return back()->with('error', 'Penguji sudah terdaftar di kelas ini.');
        }

        TahfidzTester::create([
            'active_subject_id' => $request->active_subject_id,
            'user_id' => $request->user_id,
            'type' => $request->type,
        ]);

        return back()->with('success', 'Penguji berhasil ditambahkan.');
    }

    public function destroyTester($id)
    {
        $tester = TahfidzTester::findOrFail($id);
        $tester->delete();
        return back()->with('success', 'Penguji berhasil dihapus.');
    }

    public function searchTeachers(Request $request)
    {
        $query = $request->get('query');
        if (!$query) return response()->json([]);

        $teachers = User::where('name', 'like', "%{$query}%")
            ->limit(10)
            ->get(['id', 'name', 'nomor_induk']);

        return response()->json($teachers);
    }

    // --- Standard Target Logic ---
    
    public function storeStandardTarget(Request $request)
    {
        $validated = $request->validate([
            'jenjang_id' => 'required|exists:jenjangs,id',
            'semester_number' => 'required|integer|min:1|max:20',
            'target_juz_count' => 'required|numeric|min:0',
            'juz_details' => 'nullable|string|max:255',
        ]);

        TahfidzStandardTarget::updateOrCreate(
            [
                'jenjang_id' => $validated['jenjang_id'],
                'semester_number' => $validated['semester_number'],
            ],
            [
                'target_juz_count' => $validated['target_juz_count'],
                'juz_details' => $validated['juz_details'],
            ]
        );

        return back()->with('success', 'Standar target berhasil disimpan.');
    }

    public function destroyStandardTarget($id)
    {
        $target = TahfidzStandardTarget::findOrFail($id);
        $target->delete();
        
        return back()->with('success', 'Standar target berhasil dihapus.');
    }
}
