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
            ->with('user', 'classMembers.activeClass.kelas', 'classMembers.activeClass.kelasParalel', 'kamarMembers.activeKamar.kamar', 'memorizations', 'latestMemorizationDetail')
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

        // Smart Filtering: If logged-in user is a Musyrif (and not admin), default to their halaqoh
        $loggedInMusyrif = null;
        if (!$user->hasRole('admin') && !$user->can('manage_tahfidz_settings')) {
            $loggedInMusyrif = \App\Models\TahfidzMusyrif::where('user_id', $user->id)
                ->orWhere('student_id', $user->student?->id)
                ->first();
        }

        // Filter by Halaqoh (Musyrif)
        if ($request->has('musyrif_id') && $request->musyrif_id !== 'all') {
            $query->whereHas('tahfidzHalaqohMember', function ($q) use ($request) {
                $q->where('musyrif_id', $request->musyrif_id);
            });
        } elseif ($loggedInMusyrif && !$request->has('musyrif_id')) {
            // Auto-filter for Musyrif if no specific filter is requested
            $query->whereHas('tahfidzHalaqohMember', function ($q) use ($loggedInMusyrif) {
                $q->where('musyrif_id', $loggedInMusyrif->id);
            });
            // Update request so frontend dropdown reflects this
            $request->merge(['musyrif_id' => $loggedInMusyrif->id]);
        }

        // Filter Stagnan (Lebih dari 7 hari)
        if ($request->has('stagnant') && $request->stagnant === '1') {
            $query->where(function ($q) {
                $q->whereDoesntHave('latestMemorizationDetail')
                  ->orWhereHas('latestMemorizationDetail', function ($sq) {
                      $sq->where('created_at', '<', now()->subDays(7));
                  });
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

            $daysSinceLastSetoran = null;
            $isStagnant = false;
            
            if ($student->latestMemorizationDetail) {
                $lastDate = \Carbon\Carbon::parse($student->latestMemorizationDetail->created_at);
                $daysSinceLastSetoran = $lastDate->diffInDays(now());
                if ($daysSinceLastSetoran > 7) {
                    $isStagnant = true;
                }
            } else {
                $isStagnant = true; // Never deposited
            }

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
                'days_since_last_setoran' => $daysSinceLastSetoran,
                'is_stagnant' => $isStagnant,
            ];
        });

        // Get Musyrifs for dropdown
        $musyrifs = \App\Models\TahfidzMusyrif::with(['student', 'user'])->where('is_active', true)->get()->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->student ? ($m->student->name . ' (' . ($m->student->classMembers->last()?->activeClass?->name ?? '-') . ')') : ($m->user ? $m->user->name . ' (Ustadz)' : '-')
        ]);

        // Classes: dengan paralel
        $classes = \App\Models\ActiveClass::with(['kelas', 'kelasParalel', 'academicYear'])
            ->whereHas('academicYear', function ($q) {
                $q->where('is_active', true);
            })
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
            ->whereHas('academicYear', function ($q) {
                $q->where('is_active', true);
            })
            ->get()
            ->sortBy(fn($k) => $k->kamar?->name ?? $k->name ?? '')
            ->map(fn($k) => [
                'id' => $k->id,
                'name' => $k->kamar?->name ?? $k->name ?? '-'
            ])
            ->values();

        return Inertia::render('Tahfidz/Achievement/Index', [
            'students' => $students,
            'filters' => $request->only(['active_class_id', 'active_kamar_id', 'musyrif_id', 'search', 'tab']),
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

        $details = \App\Models\TahfidzMemorizationDetail::where('student_id', $student->id)->get()->groupBy('juz');

        $juzData = [];
        for ($i = 1; $i <= 30; $i++) {
            $mem = $memorizations->get($i);
            $juzDetails = $details->get($i) ?? collect();

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
            
            // Count half pages towards progress
            $halfPages = $juzDetails->where('status', 'half')->pluck('page_number')->toArray();
            foreach ($halfPages as $hp) {
                if (!$mem || !in_array($hp, $mem->completed_pages ?? [])) {
                    $currentProgress += 0.5;
                }
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
                'details' => $juzDetails->keyBy('page_number'),
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

        // If a page is marked as completed, remove its 'half' status from details
        if ($isCompleted || in_array($request->completed_pages, $completedPages)) {
            // Need to know which pages were marked full
        }

        // If request expects JSON (from Index tab), return JSON
        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Hafalan berhasil diperbarui.']);
        }

        return back()->with('success', 'Hafalan berhasil diperbarui.');
    }

    public function updatePageStatus(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'juz' => 'required|integer',
            'page_number' => 'required|integer',
            'status' => 'required|in:half,full',
            'verse_key' => 'nullable|string',
            'surah_name' => 'nullable|string'
        ]);

        $detail = \App\Models\TahfidzMemorizationDetail::firstOrCreate([
            'student_id' => $request->student_id,
            'juz' => $request->juz,
            'page_number' => $request->page_number,
        ]);

        $detail->status = $request->status;
        if ($request->status === 'half') {
            $detail->verse_key = $request->verse_key;
            $detail->surah_name = $request->surah_name;
        } else {
            $detail->verse_key = null;
            $detail->surah_name = null;
        }
        $detail->save();

        if ($request->status === 'full') {
            // Update tahfidz_memorizations completed_pages array
            $mem = \App\Models\TahfidzMemorization::firstOrCreate(
                ['student_id' => $request->student_id, 'juz' => $request->juz],
                ['completed_pages' => [], 'is_completed' => false]
            );

            $pages = $mem->completed_pages ?? [];
            if (!in_array($request->page_number, $pages)) {
                $pages[] = $request->page_number;
                
                // Determine total pages to check completion
                $juz = $request->juz;
                $totalPages = 20;
                $startPage = 22 + ($juz - 2) * 20;
                $endPage = $startPage + 19;
                if ($juz == 1) { $totalPages = 21; $startPage = 1; $endPage = 21; }
                elseif ($juz == 30) { $totalPages = 23; $startPage = 582; $endPage = 604; }

                $validPages = array_filter($pages, function($p) use ($startPage, $endPage) {
                    return $p >= $startPage && $p <= $endPage;
                });
                
                $mem->completed_pages = array_values(array_unique($validPages));
                $mem->is_completed = count($mem->completed_pages) >= $totalPages;
                $mem->save();
            }
        }

        return response()->json(['success' => true]);
    }

    public function recordMistake(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'juz' => 'required|integer',
            'page_number' => 'required|integer',
            'verse_key' => 'required|string',
            'surah_name' => 'required|string',
            'action' => 'required|in:add,clear',
            'mistake_type' => 'nullable|string'
        ]);

        $detail = \App\Models\TahfidzMemorizationDetail::firstOrCreate([
            'student_id' => $request->student_id,
            'juz' => $request->juz,
            'page_number' => $request->page_number,
        ]);

        if ($request->action === 'add') {
            $detail->mistake_count += 1;
            $detail->verse_key = $request->verse_key;
            $detail->surah_name = $request->surah_name;
            
            $history = $detail->mistakes_history ?? [];
            if ($request->mistake_type) {
                $history[] = [
                    'verse_key' => $request->verse_key,
                    'type' => $request->mistake_type,
                    'time' => now()->toDateTimeString()
                ];
            }
            $detail->mistakes_history = $history;
        } else {
            $detail->mistake_count = 0;
            $detail->mistakes_history = [];
            // keep verse_key if it's half status, otherwise could nullify. Let's not nullify here
        }
        $detail->save();

        return response()->json([
            'success' => true, 
            'mistake_count' => $detail->mistake_count,
            'mistakes_history' => $detail->mistakes_history
        ]);
    }
}
