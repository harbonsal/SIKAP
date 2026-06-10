<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TahfidzAchievementController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = \App\Models\Student::query()
            ->with('user', 'classMembers.activeClass.kelas', 'classMembers.activeClass.kelasParalel', 'kamarMembers.activeKamar.kamar', 'memorizations')
            ->whereHas('user', function ($q) {
                $q->active();
            });

        // Filter by Active Class
        if ($request->has('active_class_id') && $request->active_class_id !== 'all') {
            $query->whereHas('classMembers', function ($q) use ($request) {
                $q->where('active_class_id', $request->active_class_id);
            });
        }

        // Filter by Kamar (active_kamar)
        if ($request->has('active_kamar_id') && $request->active_kamar_id !== 'all') {
            $query->whereHas('kamarMembers', function ($q) use ($request) {
                $q->where('active_kamar_id', $request->active_kamar_id);
            });
        }

        // Filter by Halaqoh (Musyrif)
        if ($request->has('musyrif_id') && $request->musyrif_id !== 'all') {
            $query->whereHas('tahfidzHalaqohMember', function ($q) use ($request) {
                $q->where('musyrif_id', $request->musyrif_id);
            });
        }

        // Filter by Search (nama / NIS)
        if ($request->has('search') && trim($request->search) !== '') {
            $search = trim($request->search);
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $students = $query->paginate(20)->through(function ($student) {
            $completedJuz = $student->memorizations->where('is_completed', true)->count();

            $latestClassMember = $student->classMembers->sortByDesc('id')->first();
            $activeClass = $latestClassMember?->activeClass;
            $kelasName = $activeClass?->kelas?->name ?? '-';
            $parallelName = $activeClass?->kelasParalel?->name ?? '';
            $className = $parallelName ? "{$kelasName} {$parallelName}" : $kelasName;

            // Find halaqoh info
            $halaqohMember = \App\Models\TahfidzHalaqohMember::with('musyrif.student')->where('student_id', $student->id)->first();
            $musyrifName = $halaqohMember?->musyrif?->student?->name ?? '-';

            // Find Juz Validasi (is_validated = true)
            $validatedJuzList = $student->memorizations
                ->where('is_completed', true)
                ->where('is_validated', true)
                ->pluck('juz')
                ->sort()
                ->toArray();

            $validatedJuzString = count($validatedJuzList) > 0
                ? 'Juz ' . implode(', ', $validatedJuzList)
                : '-';

            // Find Progress Saat Ini (Juz Proses)
            $inProgressJuz = $student->memorizations
                ->where('is_completed', false)
                ->sortByDesc('juz')
                ->first();

            $currentProgressString = '-';
            $juzProsesData = null;
            if ($inProgressJuz) {
                $juz = $inProgressJuz->juz;
                $completedPagesCount = is_array($inProgressJuz->completed_pages) ? count($inProgressJuz->completed_pages) : 0;

                $totalPages = 20;
                if ($juz == 1) $totalPages = 21;
                elseif ($juz == 30) $totalPages = 23;

                $currentProgressString = "Juz $juz ($completedPagesCount/$totalPages Hal)";
                $juzProsesData = [
                    'juz' => $juz,
                    'completed' => $completedPagesCount,
                    'total' => $totalPages,
                ];
            }

            $kamarName = $student->kamarMembers->sortByDesc('id')->first()?->activeKamar?->kamar?->name
                ?? $student->kamarMembers->sortByDesc('id')->first()?->activeKamar?->name
                ?? '-';

            return [
                'id' => $student->id,
                'name' => $student->user->name,
                'nis' => $student->user->nomor_induk ?? $student->nisn ?? '-',
                'class_name' => $className,
                'kamar_name' => $kamarName,
                'musyrif_name' => $musyrifName,
                'total_juz_completed' => $completedJuz,
                'juz_validasi' => $validatedJuzString,
                'juz_validasi_count' => count($validatedJuzList),
                'juz_proses' => $currentProgressString,
                'juz_proses_data' => $juzProsesData,
            ];
        });

        // Get Musyrifs for dropdown
        $musyrifs = \App\Models\TahfidzMusyrif::with('student')->where('is_active', true)->get()->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->student->name . ' (' . ($m->student->classMembers->last()?->activeClass?->name ?? '-') . ')'
        ]);

        // Classes: dengan paralel
        $classes = \App\Models\ActiveClass::with(['kelas', 'kelasParalel', 'academicYear'])
            ->get()
            ->sortBy(function ($ac) {
                return ($ac->kelas?->level ?? 99) . ($ac->kelas?->name ?? '') . ($ac->kelasParalel?->name ?? '');
            })
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => trim(($c->kelas?->name ?? '') . ' ' . ($c->kelasParalel?->name ?? ''))
            ])
            ->values();

        // Kamars: dari ActiveKamar dengan relasi kamar
        $kamars = \App\Models\ActiveKamar::with('kamar')
            ->get()
            ->sortBy(fn($k) => $k->kamar?->name ?? $k->name ?? '')
            ->map(fn($k) => [
                'id' => $k->id,
                'name' => $k->kamar?->name ?? $k->name ?? '-'
            ])
            ->values();

        return Inertia::render('Tahfidz/Achievement/Index', [
            'students' => $students,
            'filters' => $request->only(['active_class_id', 'active_kamar_id', 'musyrif_id', 'search']),
            'classes' => $classes,
            'kamars' => $kamars,
            'musyrifs' => $musyrifs,
        ]);
    }

    public function show(\App\Models\Student $student)
    {
        $student->load('user', 'classMembers.activeClass', 'kamarMembers.activeKamar');
        $memorizations = \App\Models\TahfidzMemorization::where('student_id', $student->id)->get()->keyBy('juz');
        $screenedJuzNumbers = \App\Models\HafalanSkriningReport::where('user_id', $student->user_id)->pluck('juz_number')->toArray();

        $latestClassMember = $student->classMembers->sortByDesc('id')->first();
        $className = $latestClassMember?->activeClass?->name ?? '-';

        $juzData = [];
        for ($i = 1; $i <= 30; $i++) {
            $mem = $memorizations->get($i);

            // Determine total pages for this Juz based on Madinah Standard
            $totalPages = 20;
            $startPage = 22 + ($i - 2) * 20;
            $endPage = $startPage + 19;

            if ($i == 1) {
                $totalPages = 21;
                $startPage = 1;
                $endPage = 21;
            } elseif ($i == 30) {
                $totalPages = 23;
                $startPage = 582;
                $endPage = 604;
            }

            $currentProgress = 0;
            if ($mem && $mem->is_completed) {
                $currentProgress = $totalPages;
            } elseif ($mem && $mem->completed_pages) {
                $currentProgress = count($mem->completed_pages);
            }

            $juzData[] = [
                'juz' => $i,
                'start_page' => $startPage,
                'end_page' => $endPage,
                'total_pages' => $totalPages,
                'completed_pages' => $mem ? $mem->completed_pages : [],
                'is_completed' => $mem ? $mem->is_completed : false,
                'is_validated' => $mem ? $mem->is_validated : false,
                'progress' => $currentProgress,
                'is_screened' => in_array($i, $screenedJuzNumbers),
            ];
        }

        return Inertia::render('Tahfidz/Achievement/Show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name,
                'nis' => $student->user->nomor_induk ?? $student->nisn ?? '-',
                'class_name' => $className,
                'kamar_name' => $student->kamarMembers->sortByDesc('id')->first()?->activeKamar?->name ?? '-',
            ],
            'juz_data' => $juzData,
        ]);
    }

    public function searchStudents(Request $request)
    {
        $query = $request->get('q');
        $musyrifId = $request->get('musyrif_id');

        $students = \App\Models\Student::with(['user', 'classMembers.activeClass'])
            ->whereHas('user', function ($q) use ($query) {
                $q->active();
                if ($query) {
                    $q->where('name', 'like', "%{$query}%");
                }
            })
            ->when($musyrifId && $musyrifId !== 'all', function ($q) use ($musyrifId) {
                $q->whereHas('tahfidzHalaqohMember', function ($sub) use ($musyrifId) {
                    $sub->where('musyrif_id', $musyrifId);
                });
            })
            ->limit(20)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'text' => $s->user->name . ' (' . ($s->classMembers->last()?->activeClass?->name ?? '-') . ')',
                'nis' => $s->user->nomor_induk ?? '-'
            ]);

        return response()->json($students);
    }

    public function getStudentData(\App\Models\Student $student)
    {
        $memorizations = \App\Models\TahfidzMemorization::where('student_id', $student->id)->get()->keyBy('juz');
        $screenedJuzNumbers = \App\Models\HafalanSkriningReport::where('user_id', $student->user_id)->pluck('juz_number')->toArray();

        $juzData = [];
        for ($i = 1; $i <= 30; $i++) {
            $mem = $memorizations->get($i);

            // Determine total pages for this Juz based on Madinah Standard
            $totalPages = 20;
            $startPage = 22 + ($i - 2) * 20;
            $endPage = $startPage + 19;

            if ($i == 1) {
                $totalPages = 21;
                $startPage = 1;
                $endPage = 21;
            } elseif ($i == 30) {
                $totalPages = 23;
                $startPage = 582;
                $endPage = 604;
            }

            $currentProgress = 0;
            if ($mem && $mem->is_completed) {
                $currentProgress = $totalPages;
            } elseif ($mem && $mem->completed_pages) {
                $currentProgress = count($mem->completed_pages);
            }

            $juzData[] = [
                'juz' => $i,
                'start_page' => $startPage,
                'end_page' => $endPage,
                'total_pages' => $totalPages,
                'completed_pages' => $mem ? $mem->completed_pages : [],
                'is_completed' => $mem ? $mem->is_completed : false,
                'is_validated' => $mem ? $mem->is_validated : false,
                'progress' => $currentProgress,
                'is_screened' => in_array($i, $screenedJuzNumbers),
            ];
        }

        return response()->json([
            'student' => $student->load('user'),
            'juz_data' => $juzData
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'juz' => 'required|integer|min:1|max:30',
            'completed_pages' => 'array',
            'mark_full_juz' => 'boolean'
        ]);

        $juz = $request->juz;

        // Madinah Page Logic
        $totalPages = 20;
        $startPage = 22 + ($juz - 2) * 20;
        $endPage = $startPage + 19;

        if ($juz == 1) {
            $totalPages = 21;
            $startPage = 1;
            $endPage = 21;
        } elseif ($juz == 30) {
            $totalPages = 23;
            $startPage = 582;
            $endPage = 604;
        }

        $isCompleted = false;
        $completedPages = $request->completed_pages ?? [];

        if ($request->mark_full_juz) {
            $isCompleted = true;
            // Fill all pages
            $completedPages = range($startPage, $endPage);
        } else {
            // Check if all pages are present
            // We need to ensure we only count valid pages for this juz
            $validPages = array_filter($completedPages, function ($p) use ($startPage, $endPage) {
                return $p >= $startPage && $p <= $endPage;
            });
            $completedPages = array_values(array_unique($validPages)); // Reindex and dedup

            if (count($completedPages) >= $totalPages) {
                $isCompleted = true;
            }
        }

        \App\Models\TahfidzMemorization::updateOrCreate(
            ['student_id' => $request->student_id, 'juz' => $juz],
            [
                'completed_pages' => $completedPages,
                'is_completed' => $isCompleted
            ]
        );

        // If request expects JSON (from Index tab), return JSON
        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Hafalan berhasil diperbarui.']);
        }

        return back()->with('success', 'Hafalan berhasil diperbarui.');
    }
}
