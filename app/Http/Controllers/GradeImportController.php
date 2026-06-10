<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\GradeWeight;
use App\Models\Mapel;
use App\Models\Kelas;
use App\Models\KelasParalel;
use App\Models\ActiveSubject;
use App\Models\ActiveClass;
use App\Services\AcademicStateService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class GradeImportController extends Controller
{
    public function store(Request $request)
    {
        set_time_limit(300);
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt',
        ]);

        $file = $request->file('file');
        $data = Excel::toArray([], $file)[0];

        if (empty($data)) {
            return back()->with('error', 'File kosong atau format tidak terbaca.');
        }

        $header = $data[0];
        $rows = array_slice($data, 1);

        $activeYear = AcademicStateService::currentAcademicYear();
        $activeSemester = AcademicStateService::currentSemester();

        // 1. Identify Grade Columns and Create/Get GradeWeights
        $gradeColumns = [];
        $weightsToCreate = [];

        // Match columns first
        foreach ($header as $index => $colName) {
            if (preg_match('/(.*)\s*\[(\d+)%\]/', $colName, $matches)) {
                $name = trim($matches[1]);
                $weightVal = (int) $matches[2];
                $weightsToCreate[$index] = [
                    'name' => $name,
                    'weight' => $weightVal,
                    'col_index' => $index
                ];
            }
        }

        if (empty($weightsToCreate)) {
            return back()->with('error', 'Tidak ditemukan kolom nilai dengan format "NAMA [BOBOT%]".');
        }

        // Optimization: Create/Get GradeWeights one by one (this is low volume, so fine)
        foreach ($weightsToCreate as $info) {
            $weightModel = GradeWeight::updateOrCreate(
                [
                    'academic_year_id' => $activeYear->id,
                    'name' => $info['name'],
                    'category' => 'pengetahuan',
                ],
                [
                    'semester' => $activeSemester->name,
                    'weight' => $info['weight'],
                ]
            );
            $gradeColumns[$info['col_index']] = ['weight_id' => $weightModel->id];
        }

        // 2. PRE-FETCHING DATA (Optimization)

        // Fetch all Mapels
        // Key: lowercase name -> ID
        $mapels = Mapel::all()->mapWithKeys(function ($item) {
            return [strtolower($item->name) => $item->id];
        });

        // Fetch all Kelas
        // Key: lowercase name -> ID
        $allKelas = Kelas::all()->mapWithKeys(function ($item) {
            return [strtolower($item->name) => $item->id];
        });

        // Fetch all Kelas Paralel
        // Key: lowercase name -> ID
        $allKelasParalel = KelasParalel::all()->mapWithKeys(function ($item) {
            return [strtolower($item->name) => $item->id];
        });

        // Fetch ActiveClasses for current Year
        // Key: "kelas_id_kelas_paralel_id" (paralel can be 'null' string) -> ActiveClass ID
        $activeClasses = ActiveClass::where('academic_year_id', $activeYear->id)
            ->get()
            ->mapWithKeys(function ($item) {
                $key = $item->kelas_id . '_' . ($item->kelas_paralel_id ?? 'null');
                return [$key => $item->id];
            });

        // Fetch ActiveSubjects for current Year (via ActiveClasses)
        // We need lookup: "active_class_id_mapel_id" -> active_subject_id
        $activeClassIds = $activeClasses->values()->toArray();
        $activeSubjects = ActiveSubject::whereIn('active_class_id', $activeClassIds)
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->active_class_id . '_' . $item->mapel_id => $item->id];
            });

        // Fetch all Students (NIS -> ID)
        // Optimization: Only fetch students whose NIS appears in the file? 
        // Or just fetch all if not huge. Let's filter by NIS in file to be safe.
        $nisList = collect($rows)->pluck(3)->filter()->unique()->toArray();
        $students = Student::whereHas('user', function ($q) use ($nisList) {
            $q->whereIn('nomor_induk', $nisList);
        })->with('user:id,nomor_induk')->get()
            ->mapWithKeys(function ($item) {
                return [$item->user->nomor_induk => $item->id];
            });


        // 3. PROCESS ROWS
        $successCount = 0;
        $failCount = 0;
        $errors = [];
        $gradesToInsert = [];

        // Chunking output for bulk insert could be complex with updateOrCreate logic,
        // so we will keep loop but use in-memory lookups which is MUCH faster.

        DB::beginTransaction();
        try {
            foreach ($rows as $rowIndex => $row) {
                $rowNum = $rowIndex + 2;

                $kelasRaw = trim($row[2] ?? '');
                $nis = trim($row[3] ?? '');
                $mapelNameRaw = trim($row[5] ?? '');

                if (empty($nis) || empty($mapelNameRaw)) continue;

                // Lookup Student
                if (!isset($students[$nis])) {
                    $failCount++;
                    $errors[] = "Baris $rowNum: Siswa NIS $nis tidak ditemukan.";
                    continue;
                }
                $studentId = $students[$nis];

                // Lookup Mapel
                $mapelKey = strtolower($mapelNameRaw);
                if (!isset($mapels[$mapelKey])) {
                    $failCount++;
                    $errors[] = "Baris $rowNum: Mapel '$mapelNameRaw' tidak ditemukan.";
                    continue;
                }
                $mapelId = $mapels[$mapelKey];

                // Parse & Lookup Kelas
                // Parsing logic same as before
                $kelasId = null;
                $kelasParalelId = null;

                if (preg_match('/^(\d+)([A-Z])\s+(.*)$/i', $kelasRaw, $matches)) {
                    $level = $matches[1];
                    $paralelCode = $matches[2];
                    $baseName = $matches[3];
                    $baseName = str_replace('Mutawassith', 'Mutawasith', $baseName); // Fix typo
                    $dbClassName = "$level $baseName";

                    // Lookup Kelas
                    $kelasKey = strtolower($dbClassName);
                    if (isset($allKelas[$kelasKey])) {
                        $kelasId = $allKelas[$kelasKey];
                    }

                    // Lookup Paralel
                    $paralelKey = strtolower($paralelCode);
                    if (isset($allKelasParalel[$paralelKey])) {
                        $kelasParalelId = $allKelasParalel[$paralelKey];
                    }
                } else {
                    $dbClassName = $kelasRaw;
                    // Lookup Kelas
                    $kelasKey = strtolower($dbClassName);
                    if (isset($allKelas[$kelasKey])) {
                        $kelasId = $allKelas[$kelasKey];
                    }
                }

                if (!$kelasId) {
                    $failCount++;
                    $errors[] = "Baris $rowNum: Kelas '$kelasRaw' tidak ditemukan.";
                    continue;
                }

                // Lookup ActiveClass
                $acKey = $kelasId . '_' . ($kelasParalelId ?? 'null');
                if (!isset($activeClasses[$acKey])) {
                    $failCount++;
                    // Try less strict? If parallel not found in ActiveClass but only classes without parallel exist?
                    // For now, strict.
                    $errors[] = "Baris $rowNum: Kelas Aktif tidak ditemukan ($kelasRaw).";
                    continue;
                }
                $activeClassId = $activeClasses[$acKey];

                // Lookup ActiveSubject
                $asKey = $activeClassId . '_' . $mapelId;
                if (!isset($activeSubjects[$asKey])) {
                    $failCount++;
                    $errors[] = "Baris $rowNum: Mapel Aktif '$mapelNameRaw' belum diset di kelas ini.";
                    continue;
                }
                $activeSubjectId = $activeSubjects[$asKey];

                // Process Grades
                foreach ($gradeColumns as $colIndex => $colInfo) {
                    $score = $row[$colIndex] ?? '';
                    if ($score === '' || $score === null || !is_numeric($score)) continue;

                    // Bulk friendly? updateOrCreate is expensive in loop, but better than full lookup
                    // Optimization: We could prepare array for bulk upsert if Laravel supported it easily for composite keys
                    // For now, let's stick to updateOrCreate but it should be fast enough without overhead queries

                    StudentGrade::updateOrCreate(
                        [
                            'active_subject_id' => $activeSubjectId,
                            'student_id' => $studentId,
                            'grade_weight_id' => $colInfo['weight_id'],
                            'semester_id' => $activeSemester->id,
                        ],
                        [
                            'score' => $score
                        ]
                    );
                }
                $successCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }

        $message = "Impor selesai. Data diproses: $successCount. Gagal: $failCount.";
        if (count($errors)) {
            $shownErrors = array_slice($errors, 0, 5);
            $message .= " Error: " . implode('; ', $shownErrors);
            if (count($errors) > 5) $message .= "...";
            return back()->with('error', $message);
        }

        return back()->with('success', $message);
    }
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"Format_Import_Nilai_Massal.csv\"",
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');

            // Header Row based on user requirement
            $header = ['TP', 'Sem', 'Kelas', 'NIS', 'Nama', 'Mata Pelajaran', 'UH1 [10%]', 'UH2 [10%]', 'UTS [20%]', 'UAS [60%]'];
            fputcsv($file, $header);

            // Example Row
            $example = ['2025/2026', 'Ganjil', '1 Mutawasith', '123456', 'Nama Siswa', 'Fikih', '90', '88', '85', '88'];
            fputcsv($file, $example);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
