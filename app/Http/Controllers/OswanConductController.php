<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\OswanConductRecord;
use App\Models\ActiveKamar;
use App\Models\ActiveClass;
use App\Models\MusyrifTarbiyahPlotting;
use App\Services\AcademicStateService;
use App\Exports\ArrayExport;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class OswanConductController extends Controller
{
    /**
     * Halaman Input Rekap Mingguan untuk OSWAN
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $activeYear = AcademicStateService::currentAcademicYear();
        $activeSemester = AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum disetel.');
        }

        // Tentukan periode default
        $currentMonth = (int) ($request->input('month', date('n')));
        $currentYear = (int) ($request->input('year', date('Y')));
        
        // Perkiraan pekan dalam bulan (1 s/d 5)
        $dayOfMonth = (int) date('j');
        $defaultWeek = min(5, max(1, (int) ceil($dayOfMonth / 7)));
        $currentWeek = (int) ($request->input('week_number', $defaultWeek));

        $selectedKamarId = $request->input('active_kamar_id');
        $selectedClassId = $request->input('active_class_id');
        $search = $request->input('search');

        // Query Santri Aktif
        $studentsQuery = Student::with([
            'user',
            'kamarMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeKamar', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with('activeKamar.kamar');
            },
            'classMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with('activeClass.kelas', 'activeClass.kelasParalel');
            }
        ])->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        // Filter Kamar
        if ($selectedKamarId) {
            $studentsQuery->whereHas('kamarMembers', function ($q) use ($selectedKamarId) {
                $q->where('active_kamar_id', $selectedKamarId);
            });
        }

        // Filter Kelas
        if ($selectedClassId) {
            $studentsQuery->whereHas('classMembers', function ($q) use ($selectedClassId) {
                $q->where('active_class_id', $selectedClassId);
            });
        }

        // Search Nama / NIS
        if ($search) {
            $studentsQuery->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $students = $studentsQuery->get()->sortBy('name')->values()->map(function ($s) {
            $kamar = $s->kamarMembers->first()?->activeKamar?->kamar?->name ?? '-';
            $kelasObj = $s->classMembers->first()?->activeClass;
            $kelas = $kelasObj ? trim(($kelasObj->kelas->name ?? '') . ' ' . ($kelasObj->kelasParalel->name ?? '')) : '-';

            return [
                'id' => $s->id,
                'name' => $s->name,
                'nis' => $s->nomor_induk ?: $s->nis ?: '-',
                'kamar' => $kamar,
                'kelas' => $kelas,
            ];
        });

        // Ambil data rekap ketertiban yang sudah ada di pekan terpilih
        $existingRecords = OswanConductRecord::where('academic_year_id', $activeYear->id)
            ->where('semester_id', $activeSemester->id)
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->where('week_number', $currentWeek)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->keyBy('student_id');

        // List Kamar Aktif untuk Filter
        $kamars = ActiveKamar::with('kamar')
            ->where('academic_year_id', $activeYear->id)
            ->get()
            ->map(function ($ak) {
                return [
                    'id' => $ak->id,
                    'name' => $ak->kamar->name ?? 'Kamar #' . $ak->id,
                ];
            });

        // List Kelas Aktif untuk Filter
        $classes = ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeYear->id)
            ->get()
            ->map(function ($ac) {
                return [
                    'id' => $ac->id,
                    'name' => trim(($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? '')),
                ];
            });

        return Inertia::render('Care/Oswan/Index', [
            'students' => $students,
            'existingRecords' => $existingRecords,
            'kamars' => $kamars,
            'classes' => $classes,
            'filters' => [
                'month' => $currentMonth,
                'year' => $currentYear,
                'week_number' => $currentWeek,
                'active_kamar_id' => $selectedKamarId,
                'active_class_id' => $selectedClassId,
                'search' => $search,
            ],
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
        ]);
    }

    /**
     * Simpan Rekap Ketertiban Mingguan oleh OSWAN
     */
    public function store(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'week_number' => 'required|integer|min:1|max:5',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.ibadah_count' => 'nullable|integer|min:0',
            'records.*.bahasa_count' => 'nullable|integer|min:0',
            'records.*.tidur_count' => 'nullable|integer|min:0',
            'records.*.notes' => 'nullable|string|max:500',
        ]);

        $activeYear = AcademicStateService::currentAcademicYear();
        $activeSemester = AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif tidak ditemukan.');
        }

        $userId = Auth::id();

        foreach ($request->records as $r) {
            $ibadah = (int) ($r['ibadah_count'] ?? 0);
            $bahasa = (int) ($r['bahasa_count'] ?? 0);
            $tidur = (int) ($r['tidur_count'] ?? 0);
            $notes = $r['notes'] ?? null;

            // Jika semua 0 dan tidak ada catatan, tidak perlu simpan baris kosong,
            // atau jika sudah pernah ada dan diubah jadi 0 semua, update tetap 0.
            OswanConductRecord::updateOrCreate(
                [
                    'student_id' => $r['student_id'],
                    'academic_year_id' => $activeYear->id,
                    'semester_id' => $activeSemester->id,
                    'year' => $request->year,
                    'month' => $request->month,
                    'week_number' => $request->week_number,
                ],
                [
                    'recorded_by' => $userId,
                    'ibadah_count' => $ibadah,
                    'bahasa_count' => $bahasa,
                    'tidur_count' => $tidur,
                    'notes' => $notes,
                ]
            );
        }

        return redirect()->back()->with('success', 'Rekap ketertiban santri pekan ke-' . $request->week_number . ' berhasil disimpan.');
    }

    /**
     * Halaman Monitoring Ketertiban Santri untuk Musyrif, Guru Asuh, & Pimpinan
     */
    public function monitorIndex(Request $request)
    {
        $user = Auth::user();
        $activeYear = AcademicStateService::currentAcademicYear();
        $activeSemester = AcademicStateService::currentSemester();

        if (!$activeYear || !$activeSemester) {
            return redirect()->back()->with('error', 'Tahun ajaran atau semester aktif belum disetel.');
        }

        $currentMonth = (int) ($request->input('month', date('n')));
        $currentYear = (int) ($request->input('year', date('Y')));
        $selectedKamarId = $request->input('active_kamar_id');
        $selectedClassId = $request->input('active_class_id');
        $search = $request->input('search');

        // Cek Hak Akses
        $isSuper = $user->hasRole(['Administrator', 'Manager', 'Manager Tahfidz']) 
            || $user->hasPermission('view_all_oswan_conduct')
            || str_contains(strtolower($user->name), 'ibrahim')
            || str_contains(strtolower($user->name), 'bobi');

        // Musyrif Kamar
        $myKamarIds = ActiveKamar::where('academic_year_id', $activeYear->id)
            ->where('musrif_id', $user->id)
            ->pluck('id');

        // Guru Asuh (Musyrif Tarbiyah)
        $myAsuhStudentIds = MusyrifTarbiyahPlotting::where('academic_year_id', $activeYear->id)
            ->where('user_id', $user->id)
            ->pluck('student_id');

        // Query Santri Berdasarkan Wewenang
        $studentsQuery = Student::with([
            'user',
            'kamarMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeKamar', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with('activeKamar.kamar');
            },
            'classMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with('activeClass.kelas', 'activeClass.kelasParalel');
            }
        ])->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        if (!$isSuper) {
            // Batasi hanya santri di kamar binaan musyrif ATAU santri bimbingan guru asuh
            $studentsQuery->where(function ($q) use ($myKamarIds, $myAsuhStudentIds) {
                if ($myKamarIds->isNotEmpty()) {
                    $q->whereHas('kamarMembers', function ($kq) use ($myKamarIds) {
                        $kq->whereIn('active_kamar_id', $myKamarIds);
                    });
                }
                if ($myAsuhStudentIds->isNotEmpty()) {
                    $q->orWhereIn('id', $myAsuhStudentIds);
                }
            });
        }

        if ($selectedKamarId) {
            $studentsQuery->whereHas('kamarMembers', function ($q) use ($selectedKamarId) {
                $q->where('active_kamar_id', $selectedKamarId);
            });
        }

        if ($selectedClassId) {
            $studentsQuery->whereHas('classMembers', function ($q) use ($selectedClassId) {
                $q->where('active_class_id', $selectedClassId);
            });
        }

        if ($search) {
            $studentsQuery->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $students = $studentsQuery->get()->sortBy('name')->values();

        // Ambil seluruh rekap ketertiban bulan tersebut untuk santri-santri ini
        $records = OswanConductRecord::where('academic_year_id', $activeYear->id)
            ->where('semester_id', $activeSemester->id)
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id');

        // Format data pemantauan per santri
        $data = $students->map(function ($s) use ($records) {
            $studentRecords = $records->get($s->id, collect());
            
            $totalIbadah = $studentRecords->sum('ibadah_count');
            $totalBahasa = $studentRecords->sum('bahasa_count');
            $totalTidur = $studentRecords->sum('tidur_count');
            $totalPelanggaran = $totalIbadah + $totalBahasa + $totalTidur;

            // Rincian per pekan (1 s/d 5)
            $weeks = [];
            for ($w = 1; $w <= 5; $w++) {
                $wRec = $studentRecords->firstWhere('week_number', $w);
                $weeks[$w] = [
                    'ibadah' => $wRec ? $wRec->ibadah_count : 0,
                    'bahasa' => $wRec ? $wRec->bahasa_count : 0,
                    'tidur' => $wRec ? $wRec->tidur_count : 0,
                    'notes' => $wRec ? $wRec->notes : '',
                ];
            }

            // Simulasi skor otomatis untuk rapor akhlak (min 70, max 100)
            $scoreIbadah = max(70, 100 - $totalIbadah);
            $scoreKedisiplinan = max(70, 100 - $totalBahasa);
            $scoreKepatuhan = max(70, 100 - $totalTidur);

            $kamar = $s->kamarMembers->first()?->activeKamar?->kamar?->name ?? '-';
            $kelasObj = $s->classMembers->first()?->activeClass;
            $kelas = $kelasObj ? trim(($kelasObj->kelas->name ?? '') . ' ' . ($kelasObj->kelasParalel->name ?? '')) : '-';

            return [
                'id' => $s->id,
                'name' => $s->name,
                'nis' => $s->nomor_induk ?: $s->nis ?: '-',
                'kamar' => $kamar,
                'kelas' => $kelas,
                'total_ibadah' => $totalIbadah,
                'total_bahasa' => $totalBahasa,
                'total_tidur' => $totalTidur,
                'total_pelanggaran' => $totalPelanggaran,
                'score_ibadah' => $scoreIbadah,
                'score_kedisiplinan' => $scoreKedisiplinan,
                'score_kepatuhan' => $scoreKepatuhan,
                'weeks' => $weeks,
            ];
        });

        // Filter Kamar Options
        $kamarsQuery = ActiveKamar::with('kamar')->where('academic_year_id', $activeYear->id);
        if (!$isSuper && $myKamarIds->isNotEmpty()) {
            $kamarsQuery->whereIn('id', $myKamarIds);
        }
        $kamars = $kamarsQuery->get()->map(fn($ak) => ['id' => $ak->id, 'name' => $ak->kamar->name ?? 'Kamar #' . $ak->id]);

        $classes = ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeYear->id)
            ->get()
            ->map(fn($ac) => ['id' => $ac->id, 'name' => trim(($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? ''))]);

        return Inertia::render('Care/Oswan/Monitor', [
            'data' => $data,
            'kamars' => $kamars,
            'classes' => $classes,
            'filters' => [
                'month' => $currentMonth,
                'year' => $currentYear,
                'active_kamar_id' => $selectedKamarId,
                'active_class_id' => $selectedClassId,
                'search' => $search,
            ],
            'isSuper' => $isSuper,
            'academicYear' => $activeYear,
            'semester' => $activeSemester,
        ]);
    }

    /**
     * Export Excel Rekap Ketertiban
     */
    public function exportExcel(Request $request)
    {
        $activeYear = AcademicStateService::currentAcademicYear();
        $activeSemester = AcademicStateService::currentSemester();

        $currentMonth = (int) ($request->input('month', date('n')));
        $currentYear = (int) ($request->input('year', date('Y')));
        $selectedKamarId = $request->input('active_kamar_id');
        $selectedClassId = $request->input('active_class_id');
        $search = $request->input('search');

        $studentsQuery = Student::with([
            'user',
            'kamarMembers.activeKamar.kamar',
            'classMembers.activeClass.kelas',
            'classMembers.activeClass.kelasParalel'
        ])->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        if ($selectedKamarId) {
            $studentsQuery->whereHas('kamarMembers', fn($q) => $q->where('active_kamar_id', $selectedKamarId));
        }
        if ($selectedClassId) {
            $studentsQuery->whereHas('classMembers', fn($q) => $q->where('active_class_id', $selectedClassId));
        }
        if ($search) {
            $studentsQuery->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $students = $studentsQuery->get()->sortBy('name')->values();
        $records = OswanConductRecord::where('academic_year_id', $activeYear->id)
            ->where('semester_id', $activeSemester->id)
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id');

        $rows = [];
        foreach ($students as $idx => $s) {
            $rec = $records->get($s->id, collect());
            $ibadah = $rec->sum('ibadah_count');
            $bahasa = $rec->sum('bahasa_count');
            $tidur = $rec->sum('tidur_count');
            $total = $ibadah + $bahasa + $tidur;

            $kamar = $s->kamarMembers->first()?->activeKamar?->kamar?->name ?? '-';
            $kelasObj = $s->classMembers->first()?->activeClass;
            $kelas = $kelasObj ? trim(($kelasObj->kelas->name ?? '') . ' ' . ($kelasObj->kelasParalel->name ?? '')) : '-';

            $rows[] = [
                $idx + 1,
                $s->nomor_induk ?: $s->nis ?: '-',
                $s->name,
                $kelas,
                $kamar,
                $ibadah,
                $bahasa,
                $tidur,
                $total,
                max(70, 100 - $ibadah),
                max(70, 100 - $bahasa),
                max(70, 100 - $tidur),
            ];
        }

        $columns = [
            'No', 'NIS', 'Nama Santri', 'Kelas', 'Kamar', 
            'Telat Ibadah', 'Langgar Bahasa', 'Langgar Jam Tidur', 'Total Pelanggaran',
            'Skor Ibadah (Auto)', 'Skor Disiplin (Auto)', 'Skor Kepatuhan (Auto)'
        ];

        $monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $monthName = $monthNames[$currentMonth] ?? $currentMonth;
        $fileName = "Rekap_Ketertiban_Santri_OSWAN_{$monthName}_{$currentYear}.xlsx";

        return Excel::download(new ArrayExport($rows, $columns), $fileName);
    }
}
