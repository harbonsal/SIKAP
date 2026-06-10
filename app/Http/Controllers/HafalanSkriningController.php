<?php

namespace App\Http\Controllers;

use App\Models\HafalanSkrining;
use App\Models\UserLevel;
use App\Models\Kelas;
use App\Models\Kamar;
use App\Models\Student;
use App\Models\QuranProgress;
use App\Models\TahfidzMemorization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class HafalanSkriningController extends Controller
{
    /**
     * Simpan data skrining hafalan santri.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'surah_number'  => 'required|integer|min:1|max:114',
            'ayat_number'   => 'required|integer|min:1',
            'verse_key'     => 'required|string|max:10',
            'full_ayat_text' => 'required|string',
            'kata_benar'    => 'required|string',
            'hafalan_salah' => 'required|string',
            'juz_number'    => 'nullable|integer|min:1|max:30',
            'page_number'   => 'nullable|integer|min:1|max:604',
        ]);

        $skrining = HafalanSkrining::create(array_merge($validated, [
            'user_id' => Auth::id(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Skrining hafalan berhasil disimpan.',
            'data'    => $skrining,
        ]);
    }

    /**
     * Daftar skrining untuk santri yang sedang login.
     */
    public function index(Request $request)
    {
        $skrinings = HafalanSkrining::where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $skrinings,
        ]);
    }

    /**
     * Halaman Pantau Skrining untuk Admin/Guru/Musrif (seluruh user).
     */
    public function indexAdmin(Request $request)
    {
        $user = Auth::user();

        // Cek izin (Role berwenang atau Santri)
        $isManager = optional($user->userLevel)->name === 'Administrator' || optional($user->userLevel)->name === 'Manager Tahfidz';
        $isGuru = optional($user->userLevel)->name === 'Guru';
        $isMusrif = optional($user->userLevel)->name === 'Musrif';
        $isSantri = optional($user->userLevel)->name === 'Santri';

        if (!$isManager && !$isGuru && !$isMusrif && !$isSantri) {
            abort(403, 'Anda tidak memiliki akses ke halaman ini.');
        }

        // Ambil data untuk Filter Dropdown
        $userLevels = UserLevel::orderBy('name')->get(['id', 'name']);
        $kelasList = Kelas::orderBy('name')->get(['id', 'name']);
        $kamarList = Kamar::orderBy('name')->get(['id', 'name', 'building']);

        $usesActiveKamar = Schema::hasTable('active_kamars')
            && Schema::hasTable('kamar_members')
            && Schema::hasColumn('kamar_members', 'active_kamar_id');
        $usesLegacyKamar = Schema::hasTable('kamar_members')
            && Schema::hasColumn('kamar_members', 'kamar_id');

        $kamarEagerPath = $usesActiveKamar
            ? 'user.student.kamarMembers.activeKamar.kamar'
            : ($usesLegacyKamar ? 'user.student.kamarMembers.kamar' : 'user.student.kamarMembers');

        // Base Query
        $query = HafalanSkrining::with([
            'user:id,name,nomor_induk,user_level_id',
            'user.userLevel:id,name',
            'user.student.latestClassMember.activeClass.kelas',
            $kamarEagerPath,
        ])->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        // Restrict Santri to only see their own screening
        if ($isSantri) {
            $query->where('user_id', $user->id);
        }

        // Apply Filters
        if ($request->filled('role_category')) {
            $cat = $request->role_category;
            if ($cat === 'Santri') {
                $query->whereHas('user.userLevel', function ($q) {
                    $q->where('name', 'Santri');
                });
            } elseif ($cat === 'Pegawai') {
                $query->whereHas('user.userLevel', function ($q) {
                    $q->where('name', '!=', 'Santri');
                });
            }
        }

        if ($request->filled('user_level_id')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('user_level_id', $request->user_level_id);
            });
        }

        if ($request->filled('juz_number')) {
            $query->where('juz_number', $request->juz_number);
        }

        if ($request->filled('kelas_id')) {
            $query->whereHas('user.student.latestClassMember.activeClass', function ($q) use ($request) {
                $q->where('kelas_id', $request->kelas_id);
            });
        }

        if ($request->filled('kamar_id')) {
            if ($usesActiveKamar) {
                $query->whereHas('user.student.kamarMembers.activeKamar', function ($q) use ($request) {
                    $q->where('kamar_id', $request->kamar_id);
                });
            } elseif ($usesLegacyKamar) {
                $query->whereHas('user.student.kamarMembers', function ($q) use ($request) {
                    $q->where('kamar_id', $request->kamar_id);
                });
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Pagination
        $skrinings = $query->latest()->paginate(20)->withQueryString();
        $skrinings->getCollection()->transform(function ($item) {
            if ($item->relationLoaded('user') && $item->user) {
                $item->user->setAppends([]);
            }
            return $item;
        });

        // Query for Reports using the same base filers (user_id and juz if applicable)
        $reportQuery = \App\Models\HafalanSkriningReport::with([
            'user:id,name,nomor_induk,user_level_id',
            'user.userLevel:id,name',
            'user.student.latestClassMember.activeClass.kelas',
            $kamarEagerPath,
        ])->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        if ($isSantri) {
            $reportQuery->where('user_id', $user->id);
        }

        if ($request->filled('role_category')) {
            $cat = $request->role_category;
            if ($cat === 'Santri') {
                $reportQuery->whereHas('user.userLevel', function ($q) {
                    $q->where('name', 'Santri');
                });
            } elseif ($cat === 'Pegawai') {
                $reportQuery->whereHas('user.userLevel', function ($q) {
                    $q->where('name', '!=', 'Santri');
                });
            }
        }

        if ($request->filled('user_level_id')) {
            $reportQuery->whereHas('user', function ($q) use ($request) {
                $q->where('user_level_id', $request->user_level_id);
            });
        }

        if ($request->filled('juz_number')) {
            $reportQuery->where('juz_number', $request->juz_number);
        }

        if ($request->filled('kelas_id')) {
            $reportQuery->whereHas('user.student.latestClassMember.activeClass', function ($q) use ($request) {
                $q->where('kelas_id', $request->kelas_id);
            });
        }

        if ($request->filled('kamar_id')) {
            if ($usesActiveKamar) {
                $reportQuery->whereHas('user.student.kamarMembers.activeKamar', function ($q) use ($request) {
                    $q->where('kamar_id', $request->kamar_id);
                });
            } elseif ($usesLegacyKamar) {
                $reportQuery->whereHas('user.student.kamarMembers', function ($q) use ($request) {
                    $q->where('kamar_id', $request->kamar_id);
                });
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $reportQuery->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        if ($request->filled('start_date')) {
            $reportQuery->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $reportQuery->whereDate('created_at', '<=', $request->end_date);
        }

        $reports = $reportQuery->latest()->paginate(20, ['*'], 'reports_page')->withQueryString();
        $reports->getCollection()->transform(function ($item) {
            if ($item->relationLoaded('user') && $item->user) {
                $item->user->setAppends([]);
            }
            return $item;
        });

        // ── [NEW] Rekap Status Skrining per Santri ────────────────────────────
        $rekapData = [];
        if (!$isSantri) {
            // Ambil semua santri (user level = Santri)
            $studentQuery = Student::with([
                'user:id,name,nomor_induk,user_level_id',
                'latestClassMember.activeClass.kelas',
                $usesActiveKamar
                    ? 'kamarMembers.activeKamar.kamar'
                    : ($usesLegacyKamar ? 'kamarMembers.kamar' : 'kamarMembers'),
            ])->whereHas('user.userLevel', function ($q) {
                $q->where('name', 'Santri');
            })->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            });

            // Filter kelas
            if ($request->filled('rekap_kelas_id')) {
                $studentQuery->whereHas('latestClassMember.activeClass', function ($q) use ($request) {
                    $q->where('kelas_id', $request->rekap_kelas_id);
                });
            }

            // Filter kamar
            if ($request->filled('rekap_kamar_id')) {
                if ($usesActiveKamar) {
                    $studentQuery->whereHas('kamarMembers.activeKamar', function ($q) use ($request) {
                        $q->where('kamar_id', $request->rekap_kamar_id);
                    });
                } elseif ($usesLegacyKamar) {
                    $studentQuery->whereHas('kamarMembers', function ($q) use ($request) {
                        $q->where('kamar_id', $request->rekap_kamar_id);
                    });
                }
            }

            // Filter search
            if ($request->filled('rekap_search')) {
                $search = $request->rekap_search;
                $studentQuery->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('nomor_induk', 'like', "%{$search}%");
                });
            }

            $students = $studentQuery->orderBy('id')->get();

            // Ambil semua QuranProgress milik santri ini
            $userIds = $students->pluck('user_id')->filter()->toArray();
            $allProgress = QuranProgress::whereIn('user_id', $userIds)
                ->where('is_completed', true)
                ->get()
                ->groupBy('user_id');

            // Ambil semua TahfidzMemorization (Attainment) milik santri ini
            $studentIds = $students->pluck('id')->toArray();
            $allAttainment = TahfidzMemorization::whereIn('student_id', $studentIds)
                ->where('is_completed', true)
                ->get()
                ->groupBy('student_id');

            foreach ($students as $student) {
                $userId = $student->user_id;
                $studentId = $student->id;

                // 1. Screening Progress (yang sudah discreening)
                $completedJuz = isset($allProgress[$userId])
                    ? $allProgress[$userId]->pluck('juz_number')->sort()->values()->toArray()
                    : [];

                // 2. Attainment Progress (target: jumlah juz yang sudah dihafal)
                $attainmentJuz = isset($allAttainment[$studentId])
                    ? $allAttainment[$studentId]->pluck('juz')->toArray()
                    : [];

                sort($attainmentJuz);
                $totalTarget = count($attainmentJuz);

                // Hanya hitung juz skrining yang termasuk target hafalan santri.
                $screenedTargetJuz = $totalTarget > 0
                    ? array_values(array_intersect($attainmentJuz, $completedJuz))
                    : [];

                // 3. Calculate missing juz based on attainment target
                // Hanya wajib menskrining juz yang SUDAH dihafal
                $missingJuz = [];
                if ($totalTarget > 0) {
                    $missingJuz = array_values(array_diff($attainmentJuz, $screenedTargetJuz));
                }

                $isCompleted = $totalTarget > 0 && count($missingJuz) === 0;

                // Filter status
                $rekapStatus = $request->input('rekap_status', '');
                if ($rekapStatus === 'selesai' && !$isCompleted) continue;
                if ($rekapStatus === 'belum' && $isCompleted) continue;

                // Sort missing juz for display
                sort($missingJuz);

                $kamarInfo = null;
                if ($usesActiveKamar && $student->kamarMembers->isNotEmpty()) {
                    $kamarInfo = optional($student->kamarMembers->first()->activeKamar)->kamar;
                } elseif ($usesLegacyKamar && $student->kamarMembers->isNotEmpty()) {
                    $kamarInfo = $student->kamarMembers->first()->kamar ?? null;
                }

                $rekapData[] = [
                    'student_id'    => $student->id,
                    'user_id'       => $userId,
                    'name'          => $student->user->name ?? '-',
                    'nomor_induk'   => $student->user->nomor_induk ?? '-',
                    'kelas'         => optional(optional(optional($student->latestClassMember)->activeClass)->kelas)->name,
                    'kamar'         => $kamarInfo ? $kamarInfo->name : null,
                    'completed_juz' => $screenedTargetJuz,
                    'missing_juz'   => $missingJuz,
                    'total_done'    => count($screenedTargetJuz),
                    'total_missing' => count($missingJuz),
                    'total_target'  => $totalTarget,
                    'is_completed'  => $isCompleted,
                ];
            }
        }

        return Inertia::render('Tahfidz/PantauSkrining/Index', [
            'skrinings'  => $skrinings,
            'reports'    => $reports,
            'rekapData'  => $rekapData,
            'filters'    => $request->only([
                'role_category', 'user_level_id', 'kelas_id', 'kamar_id', 'juz_number',
                'search', 'start_date', 'end_date',
                'rekap_kelas_id', 'rekap_kamar_id', 'rekap_search', 'rekap_status',
            ]),
            'is_santri'  => $isSantri,
            'options'    => [
                'userLevels' => $userLevels,
                'kelasList'  => $kelasList,
                'kamarList'  => $kamarList,
            ],
        ]);
    }
}
