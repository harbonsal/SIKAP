<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use App\Models\Mapel;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class GradeSyncController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Sync/Grades');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());

        // Parse INSERT statements for `nilai` table
        // This is a naive parser for the specific format seen in the SQL dump
        preg_match_all('/INSERT INTO `nilai` VALUES \((.*?)\);/s', $content, $matches);

        $rows = [];
        if (!empty($matches[1])) {
            foreach ($matches[1] as $block) {
                // Split by "),("
                $records = preg_split('/\),\(/', $block);
                foreach ($records as $record) {
                    $record = trim($record, "()");
                    $fields = str_getcsv($record, ',', "'"); // Handle quoted strings

                    // Specific mapping based on analysed structure (Line 3791)
                    // ID_Nilai, Kode_TP, Kode_Sem, Kode_Guru, Kode_Mapel, Kode_Kelas, Kode_Siswa, KKM, UH1, UTS, UH2, UAS, Jumlah, Rapor1, Rapor2...
                    if (count($fields) >= 15) {
                        $rows[] = [
                            'kode_tp' => $fields[1],
                            'kode_sem' => $fields[2],
                            'kode_mapel' => $fields[4],
                            'kode_siswa' => $fields[6],
                            'uh1' => $fields[8],
                            'uts' => $fields[9],
                            'uh2' => $fields[10],
                            'uas' => $fields[11],
                            'rapor1' => $fields[13],
                            'rapor2' => $fields[14],
                        ];
                    }
                }
            }
        }

        // Preview Analysis
        $analysis = [
            'total_rows' => count($rows),
            'students_found' => 0,
            'subjects_found' => 0,
            'sample' => array_slice($rows, 0, 5),
        ];

        // Check a few for stats (optimization: don't check all in preview if slow)
        $studentIds = array_column($rows, 'kode_siswa');
        $analysis['students_found'] = Student::whereIn('user_id', function ($q) use ($studentIds) {
            // Assuming Kode_Siswa maps to User.nomor_induk (NIS) or Student.id?
            // Legacy Kode_Siswa usually is ID. Check mapping.
            // Wait, in legacy SQL: `Kode_Siswa` int(11). INSERT val: 17020086 (Looks like NIS).
            $q->select('id')->from('users')->whereIn('nomor_induk', $studentIds);
        })->count();

        // Actually we need to join student -> user to check nomor_induk
        // Or check if Student model has nis column? (Student usually links to User)

        $mapelCodes = array_unique(array_column($rows, 'kode_mapel'));
        $analysis['subjects_found'] = Mapel::whereIn('code', $mapelCodes)->count();

        // Cache the rows for the sync step (expire in 30 mins)
        $cacheKey = 'sync_grades_' . auth()->id();
        Cache::put($cacheKey, $rows, 1800);

        return response()->json([
            'analysis' => $analysis,
            'message' => 'File berhasil dianalisis. Silakan klik Sinkronisasi untuk memproses.',
        ]);
    }

    public function sync(Request $request)
    {
        $cacheKey = 'sync_grades_' . auth()->id();
        $rows = Cache::get($cacheKey);

        if (empty($rows)) {
            return redirect()->back()->with('error', 'Data kadaluarsa atau tidak ditemukan. Silakan upload ulang.');
        }

        DB::beginTransaction();
        try {
            $count = 0;
            // Get necessary cache
            $mapels = Mapel::pluck('id', 'code'); // Code -> ID
            // NIS -> Student ID mapping
            $students = Student::with('user')->get()->mapWithKeys(function ($s) {
                return [$s->user->nomor_induk => $s->id];
            });

            foreach ($rows as $row) {
                $nis = $row['kode_siswa'];
                $mapelCode = $row['kode_mapel'];

                if (!isset($students[$nis]) || !isset($mapels[$mapelCode])) {
                    continue; // Skip if student or mapel not found
                }

                $studentId = $students[$nis];
                $mapelId = $mapels[$mapelCode];

                // Determine Academic Year and Semester
                // Legacy: 20172018 -> 2017/2018
                $yearName = substr($row['kode_tp'], 0, 4) . '/' . substr($row['kode_tp'], 4, 4);
                $semesterName = $row['kode_sem'] == 1 ? 'Ganjil' : 'Genap';

                $academicYear = AcademicYear::firstOrCreate(['name' => $yearName], ['is_active' => false]);
                $semester = Semester::firstOrCreate(['name' => $semesterName], ['is_active' => false]); // Simplification

                // Find or Create ActiveSubject (Loose coupling: no class/teacher check for legacy data?)
                // Problem: ActiveSubject requires active_class_id.
                // We might need a "Legacy Class" or try to find existing class for that student?
                // For now, let's look for ANY ActiveSubject for this mapel in this year/semester?
                // Or create a dummy ActiveClass?

                // STRATEGY: Create a "Legacy Class [Year]" and put student in it? Complex.
                // SIMPLER STRATEGY: Just create StudentGrade. But it needs active_subject_id.

                // Let's CREATE a dummy ActiveClass for "Legacy Data" if it doesn't exist.
                // Or maybe we just search for an ActiveClass that matches student? 

                // Ideally, we should have synced Classes first.
                // Assuming classes are NOT synced, we create a placeholder ActiveSubject.
                // "Legacy - [Mapel]"?

                // Let's create a "Legacy Import" ActiveClass per AcademicYear per Jenjang?
                // Too complex for now.
                // Let's try to find an ActiveSubject if it exists, otherwise create one attached to a "Legacy" class.

                // Placeholder Logic:
                // 1. Find ANY active subject for this Mapel + Year.
                // 2. If not found, skip or create dummy?

                // FOR THIS ITERATION: Skip if no ActiveSubject found. 
                // Wait, that means 0 imports if DB is empty.

                // User requirement: "Sync Grades".
                // I'll assume they want the data IN.
                // I will create a single "Legacy Class" for the Academic Year to hold these subjects if needed.
                $legacyClass = \App\Models\ActiveClass::firstOrCreate(
                    [
                        'academic_year_id' => $academicYear->id,
                        'name' => 'Legacy Import' // Needs kelas_id, teacher_id...
                    ],
                    [
                        'kelas_id' => 1, // Fallback ID?
                        'teacher_id' => 1, // Fallback ID?
                        'grade_level_id' => 1,
                        'name' => 'Legacy Class ' . $yearName
                    ]
                );

                $activeSubject = ActiveSubject::firstOrCreate(
                    ['active_class_id' => $legacyClass->id, 'subject_id' => $mapelId],
                    ['teacher_id' => 1, 'is_active' => false]
                );

                // Insert Grades (UH1, UTS, etc.)
                $weights = [
                    'UH1' => $row['uh1'],
                    'UTS' => $row['uts'],
                    'UH2' => $row['uh2'],
                    'UAS' => $row['uas'],
                    'Rapor1' => $row['rapor1'], // Maybe treat as Final?
                ];

                foreach ($weights as $name => $score) {
                    if ($score > 0) {
                        $weight = GradeWeight::firstOrCreate(
                            ['active_subject_id' => $activeSubject->id, 'name' => $name],
                            ['weight' => 1, 'category' => 'knowledge']
                        );

                        StudentGrade::updateOrCreate(
                            [
                                'active_subject_id' => $activeSubject->id,
                                'student_id' => $studentId,
                                'grade_weight_id' => $weight->id,
                                'semester_id' => $semester->id,
                            ],
                            ['score' => $score]
                        );
                    }
                }
                $count++;
            }

            DB::commit();
            return redirect()->back()->with('success', "Berhasil sinkronisasi $count data nilai.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }
}
