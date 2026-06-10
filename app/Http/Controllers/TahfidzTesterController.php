<?php

namespace App\Http\Controllers;

use App\Models\ActiveSubject;
use App\Models\TahfidzTester;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TahfidzTesterController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        // 1. Identify Tahfidz Mapel
        $tahfidzMapel = \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
            ->orWhere('name', 'like', '%Tahfidz%')
            ->orderByRaw("CASE WHEN name LIKE '%Al-Quran%' THEN 0 ELSE 1 END")
            ->first();

        if (!$tahfidzMapel) {
            return redirect()->back()->with('error', 'Mapel Tahfidz tidak ditemukan.');
        }

        // 2. Fetch Active Subjects for Tahfidz
        $activeSubjects = ActiveSubject::with(['activeClass.kelas', 'activeClass.kelasParalel', 'teacher'])
            ->where('mapel_id', $tahfidzMapel->id)
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            })
            ->get();

        // 3. Auto-populate Functionality (Lazy Load)
        DB::transaction(function () use ($activeSubjects) {
            foreach ($activeSubjects as $subject) {
                // Check if any tester exists
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

        // 4. Fetch Subjects WITH Testers for Display
        $subjectsWithTesters = ActiveSubject::with([
            'activeClass.kelas',
            'activeClass.kelasParalel',
            'tahfidzTesters.user' // Assuming relationship is defined in ActiveSubject
        ])
            ->where('mapel_id', $tahfidzMapel->id)
            ->whereHas('activeClass', function ($q) use ($activeYear) {
                $q->where('academic_year_id', $activeYear->id);
            })
            ->orderBy('active_class_id')
            ->get()
            ->map(function ($subject) {
                return [
                    'id' => $subject->id,
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

        return Inertia::render('Teacher/TahfidzAssessment/TesterPlotting', [
            'subjects' => $subjectsWithTesters,
        ]);
    }

    public function store(Request $request)
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

    public function destroy($id)
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
}
