<?php

namespace App\Http\Controllers;

use App\Models\Silabus;
use App\Models\Mapel;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SilabusController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_silabus')->only(['index', 'show']);
        $this->middleware('permission:create_silabus')->only(['create', 'store']);
        $this->middleware('permission:edit_silabus')->only(['edit', 'update']);
        $this->middleware('permission:delete_silabus')->only(['destroy']);
        $this->middleware('permission:create_silabus')->only(['downloadTemplate', 'processImport']);
    }

    private function getAccessibleSubjects()
    {
        $user = auth()->user();

        // If Admin or Manager, return null (meaning all access)
        if ($user->hasRole('Administrator') || $user->hasRole('Manager')) {
            return null;
        }

        // Get active subjects where user is teacher AND in Active Academic Year
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        $query = \App\Models\ActiveSubject::with('activeClass')->where(function ($q) use ($user) {
            $q->where('teacher_id', $user->id)
                ->orWhereHas('semesterSubjectTeachers', function ($subQ) use ($user) {
                    $subQ->where('teacher_id', $user->id);
                });
        });

        if ($activeYearId) {
            $query->whereHas('activeClass', function ($q) use ($activeYearId) {
                $q->where('academic_year_id', $activeYearId);
            });
        }

        $activeSubjects = $query->get();
        
        return [
            'mapel_ids' => $activeSubjects->pluck('mapel_id')->filter()->unique()->toArray(),
            'kelas_ids' => $activeSubjects->pluck('activeClass.kelas_id')->filter()->unique()->toArray(),
            'pairs' => $activeSubjects->map(function($subject) {
                return [
                    'mapel_id' => $subject->mapel_id,
                    'kelas_id' => $subject->activeClass ? $subject->activeClass->kelas_id : null,
                ];
            })->filter(function($pair) {
                return $pair['mapel_id'] !== null && $pair['kelas_id'] !== null;
            })->toArray()
        ];
    }

    private function getFilteredDropdowns($accessible)
    {
        $mapels = Mapel::query();
        $jenjangs = Jenjang::query();
        $kelas = \App\Models\Kelas::query();

        if ($accessible !== null) {
            $mapels->whereIn('id', $accessible['mapel_ids']);
            $kelas->whereIn('id', $accessible['kelas_ids']);
            $accessibleKelas = \App\Models\Kelas::whereIn('id', $accessible['kelas_ids'])->get();
            $jenjangIds = $accessibleKelas->pluck('jenjang_id')->filter()->unique()->toArray();
            $jenjangs->whereIn('id', $jenjangIds);
        }

        return [
            'mapels' => $mapels->get(),
            'jenjangs' => $jenjangs->get(),
            'kelas' => $kelas->get(),
        ];
    }

    public function index(Request $request)
    {
        $query = Silabus::with(['mapel', 'jenjang', 'kelas']);

        // RESTRICTION LOGIC
        $accessible = $this->getAccessibleSubjects();
        if ($accessible !== null) {
            if (empty($accessible['pairs'])) {
                // If they don't teach any subjects, they shouldn't see anything
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function($q) use ($accessible) {
                    foreach ($accessible['pairs'] as $pair) {
                        $q->orWhere(function($subQ) use ($pair) {
                            $subQ->where('mapel_id', $pair['mapel_id'])
                                 ->where('kelas_id', $pair['kelas_id']);
                        });
                    }
                });
            }
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kompetensi', 'like', '%' . $request->search . '%')
                    ->orWhere('materi', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('mapel_id')) {
            $query->where('mapel_id', $request->mapel_id);
        }

        if ($request->filled('jenjang_id')) {
            $query->where('jenjang_id', $request->jenjang_id);
        }

        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->kelas_id);
        }

        $defaultSemester = \App\Services\AcademicStateService::currentSemester()->name ?? 'Ganjil';
        $activeSemesterVal = (strtolower($defaultSemester) === 'ganjil') ? '1' : '2';
        $semesterFilter = $request->has('semester') ? $request->semester : $activeSemesterVal;

        if ($semesterFilter !== null && $semesterFilter !== '') {
            $sem = trim($semesterFilter);
            $semesterValues = [$sem];
            
            if (strtolower($sem) === 'ganjil' || $sem == '1') {
                $semesterValues = ['Ganjil', 'ganjil', '1'];
            } elseif (strtolower($sem) === 'genap' || $sem == '2') {
                $semesterValues = ['Genap', 'genap', '2'];
            }
            
            $query->whereIn('semester', $semesterValues);
        }

        // Sort by Pekan ascending, then by ID ascending
        $silabuses = $query->orderBy('pekan', 'asc')
            ->orderBy('id', 'asc')
            ->paginate(10)
            ->withQueryString();

        $dropdowns = $this->getFilteredDropdowns($accessible);
        
        $filters = $request->only(['search', 'mapel_id', 'jenjang_id', 'kelas_id', 'semester']);
        if (!$request->has('semester')) {
            $filters['semester'] = $activeSemesterVal;
        }

        return Inertia::render('Settings/Education/Silabus/Index', [
            'silabuses' => $silabuses,
            'mapels' => $dropdowns['mapels'],
            'jenjangs' => $dropdowns['jenjangs'],
            'kelas' => $dropdowns['kelas'],
            'filters' => $filters,
        ]);
    }


    public function create()
    {
        $accessible = $this->getAccessibleSubjects();
        $dropdowns = $this->getFilteredDropdowns($accessible);

        return Inertia::render('Settings/Education/Silabus/Create', [
            'mapels' => $dropdowns['mapels'],
            'jenjangs' => $dropdowns['jenjangs'],
            'kelas' => $dropdowns['kelas'],
        ]);
    }

    public function store(Request $request)
    {
        $accessible = $this->getAccessibleSubjects();

        $rules = [
            'mapel_id' => 'required|exists:mapels,id',
            'jenjang_id' => 'required|exists:jenjangs,id',
            'kelas_id' => 'required|exists:kelas,id',
            'kurikulum' => 'required|string',
            'semester' => 'required|string',
            'kode' => 'nullable|string',
            'standar_kompetensi' => 'nullable|string',
            'kompetensi' => 'required|string',
            'materi' => 'required|string',
            'alokasi_waktu' => 'nullable|string',
            'pekan' => 'nullable|integer',
        ];

        // Add extra validation if restricted
        if ($accessible !== null) {
            $allowedMapels = empty($accessible['mapel_ids']) ? [-1] : $accessible['mapel_ids'];
            $rules['mapel_id'] .= '|in:' . implode(',', $allowedMapels);
        }

        $validated = $request->validate($rules);

        Silabus::create($validated);

        return redirect()->route('silabus.index')->with('success', 'Silabus berhasil ditambahkan.');
    }

    public function edit(Silabus $silabus)
    {
        // Check access
        $accessible = $this->getAccessibleSubjects();
        if ($accessible !== null && !in_array($silabus->mapel_id, $accessible['mapel_ids'])) {
            abort(403, 'Anda tidak memiliki akses ke mapel ini.');
        }

        $dropdowns = $this->getFilteredDropdowns($accessible);

        return Inertia::render('Settings/Education/Silabus/Edit', [
            'silabus' => $silabus,
            'mapels' => $dropdowns['mapels'],
            'jenjangs' => $dropdowns['jenjangs'],
            'kelas' => $dropdowns['kelas'],
        ]);
    }

    public function update(Request $request, Silabus $silabus)
    {
        // Check initial access
        $accessible = $this->getAccessibleSubjects();
        if ($accessible !== null && !in_array($silabus->mapel_id, $accessible['mapel_ids'])) {
            abort(403, 'Anda tidak memiliki akses ke mapel ini.');
        }

        $rules = [
            'mapel_id' => 'sometimes|exists:mapels,id',
            'jenjang_id' => 'sometimes|exists:jenjangs,id',
            'kelas_id' => 'sometimes|exists:kelas,id',
            'kurikulum' => 'sometimes|string',
            'semester' => 'sometimes|string',
            'kompetensi' => 'sometimes|string',
            'materi' => 'sometimes|string',
            'pekan' => 'nullable|integer',
        ];

        if ($accessible !== null) {
            $allowedMapels = empty($accessible['mapel_ids']) ? [-1] : $accessible['mapel_ids'];
            $rules['mapel_id'] .= '|in:' . implode(',', $allowedMapels);
        }

        $request->validate($rules);

        $silabus->update($request->all());

        return redirect()->route('silabus.index')->with('success', 'Silabus berhasil diperbarui.');
    }

    public function destroy(Silabus $silabus)
    {
        // Check access
        $accessible = $this->getAccessibleSubjects();
        if ($accessible !== null && !in_array($silabus->mapel_id, $accessible['mapel_ids'])) {
            abort(403, 'Anda tidak memiliki akses ke mapel ini.');
        }

        $silabus->delete();
        return redirect()->route('silabus.index')->with('success', 'Silabus berhasil dihapus.');
    }
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="silabus_template.csv"',
        ];

        $columns = [
            'Mapel',
            'Jenjang',
            'Kelas',
            'Kurikulum',
            'Semester',
            'Kode',
            'Standar Kompetensi',
            'Kompetensi Dasar',
            'Materi Pokok',
            'Alokasi Waktu',
            'Pekan'
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function processImport(Request $request)
    {
        \Log::info('Import Process Started', $request->all());

        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');

        // Fix for Mac/Office CSV line endings
        ini_set('auto_detect_line_endings', true);

        $handle = fopen($file->getPathname(), 'r');
        if (!$handle) {
            \Log::error('Failed to open file');
            return redirect()->route('silabus.index')->with('error', 'Gagal membuka file.');
        }

        // Skip header
        fgetcsv($handle);

        $successCount = 0;
        $failCount = 0;
        $errors = [];
        $rowNumber = 1;

        $accessible = $this->getAccessibleSubjects();

        while (($data = fgetcsv($handle, 1000, ',')) !== false) {
            \Log::info("Row Data:", $data);
            $rowNumber++;

            // Map columns
            // 0: Mapel, 1: Jenjang, 2: Kelas, 3: Kurikulum, 4: Semester, 
            // 5: Kode, 6: Standar Kompetensi, 7: Kompetensi Dasar, 
            // 8: Materi Pokok, 9: Alokasi Waktu, 10: Pekan

            if (count($data) < 11) {
                $failCount++;
                $errors[] = "Baris $rowNumber: Format kolom tidak lengkap.";
                continue;
            }

            $mapelName = trim(str_replace(["\r", "\n"], ' ', $data[0]));
            $jenjangName = trim(str_replace(["\r", "\n"], ' ', $data[1]));
            $kelasName = trim(str_replace(["\r", "\n"], ' ', $data[2]));

            // Map abbreviations (MTW -> Mutawassith, etc.)
            $replacements = [
                '/\bMTW\b/i' => 'Mutawassith',
                '/\bMTS\b/i' => 'Mutawassith',
                '/\bMA\b/i' => 'Aliyah',
                '/\bMI\b/i' => 'Ibtidaiyah',
            ];
            $kelasName = preg_replace(array_keys($replacements), array_values($replacements), $kelasName);

            $kurikulum = trim($data[3]);
            $semester = trim($data[4]);
            $kode = trim($data[5]);
            $sk = trim($data[6]);
            $kd = trim($data[7]);
            $materi = trim($data[8]);
            $waktu = trim($data[9]);
            $pekan = trim($data[10]);

            // Find IDs
            $mapel = Mapel::where('name', $mapelName)->first();

            // Allow loose search for Kelas (e.g. "1 MTW" vs "1 Mutawassith")
            $kelas = \App\Models\Kelas::where('name', $kelasName)
                ->orWhere('name', 'like', $kelasName . '%') // Try prefix
                ->first();

            // Auto-infer Jenjang if empty but Class found
            $jenjang = null;
            if ($jenjangName) {
                $jenjang = Jenjang::where('name', $jenjangName)->first();
            } elseif ($kelas) {
                $jenjang = $kelas->jenjang; // Assume relation exists
            }

            if (!$mapel || !$jenjang || !$kelas) {
                $failCount++;
                $missing = [];
                if (!$mapel) $missing[] = "Mapel '$mapelName' tidak ditemukan";
                if (!$jenjang && !$jenjangName) $missing[] = "Jenjang Kosong & tidak bisa ditebak dari kelas";
                if (!$jenjang && $jenjangName) $missing[] = "Jenjang '$jenjangName' tidak ditemukan";
                if (!$kelas) $missing[] = "Kelas '$kelasName' tidak ditemukan";
                $errors[] = "Baris $rowNumber: " . implode(", ", $missing);
                continue;
            }

            // Check Permission
            if ($accessible !== null && !in_array($mapel->id, $accessible['mapel_ids'])) {
                $failCount++;
                $errors[] = "Baris $rowNumber: Anda tidak memiliki akses ke mapel '$mapelName'.";
                continue;
            }

            try {
                Silabus::create([
                    'mapel_id' => $mapel->id,
                    'jenjang_id' => $jenjang->id,
                    'kelas_id' => $kelas->id,
                    'kurikulum' => $kurikulum,
                    'semester' => $semester,
                    'kode' => $kode,
                    'standar_kompetensi' => $sk,
                    'kompetensi' => $kd,
                    'materi' => $materi,
                    'alokasi_waktu' => $waktu,
                    'pekan' => is_numeric($pekan) ? $pekan : null,
                ]);
                $successCount++;
            } catch (\Exception $e) {
                $failCount++;
                $errors[] = "Baris $rowNumber: Gagal menyimpan data.";
            }
        }

        fclose($handle);

        $message = "Impor selesai. Sukses: $successCount, Gagal: $failCount.";
        if (count($errors) > 0) {
            // Limit errors shown to avoid session overflow headers
            $shownErrors = array_slice($errors, 0, 5);
            $message .= " Error (5 pertama): " . implode("; ", $shownErrors);
            if (count($errors) > 5) $message .= "... dan " . (count($errors) - 5) . " lainnya.";

            return redirect()->route('silabus.index')->with('error', $message);
        }

        return redirect()->route('silabus.index')->with('success', $message);
    }
}
