<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\StudentGrade;
use App\Models\GradeWeight;
use App\Models\Kkm;
use Illuminate\Http\Request;

class ApiGradeController extends Controller
{
    private const ACADEMIC_COMPONENT_ORDER = ['UH1', 'UTS', 'UH2', 'UKK', 'UAS'];

    /**
     * Cari student berdasarkan nomor_induk.
     * nomor_induk disimpan di tabel users (field nomor_induk)
     */
    private function findStudentByNomorInduk(string $nomorInduk): ?Student
    {
        return Student::whereHas('user', function ($q) use ($nomorInduk) {
            $q->where('nomor_induk', $nomorInduk);
        })->with(['user', 'classMembers.activeClass.kelas.jenjang', 'classMembers.activeClass.kelasParalel'])
            ->first();
    }

    private function isValidationWeight(?string $weightName): bool
    {
        return str_contains(strtolower(trim((string) $weightName)), 'validasi');
    }

    private function sortAcademicWeights($weights)
    {
        return $weights
            ->reject(fn($weight) => $this->isValidationWeight($weight->name))
            ->sortBy(function ($weight) {
                $name = strtoupper($weight->name ?? '');
                $index = array_search($name, self::ACADEMIC_COMPONENT_ORDER, true);

                return $index === false ? 999 : $index;
            })
            ->values();
    }

    /**
     * GET /api/v1/student/{nomor_induk}/info
     * Informasi dasar santri
     */
    public function studentInfo(string $nomorInduk)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        $academicYear = AcademicYear::where('is_active', true)->first();

        // Ambil kelas aktif
        $activeMember = $student->classMembers
            ->filter(fn($m) => $m->activeClass && $m->activeClass->academic_year_id == $academicYear?->id)
            ->first();

        $kelasName = '-';
        $jenjangName = '-';

        if ($activeMember && $activeMember->activeClass) {
            $ac = $activeMember->activeClass;
            $kelasName = ($ac->kelas->name ?? '') . ' ' . ($ac->kelasParalel->name ?? '');
            $jenjangName = $ac->kelas->jenjang->name ?? '-';
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'nomor_induk'  => $student->user->nomor_induk ?? $nomorInduk,
                'nama'         => $student->user->name,
                'kelas'        => trim($kelasName) ?: '-',
                'jenjang'      => $jenjangName,
                'tahun_ajaran' => $academicYear->name ?? '-',
            ],
        ]);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/semesters
     * Daftar semester yang pernah/sedang diiukuti santri berdasarkan riwayat kelas
     */
    public function studentSemesters(string $nomorInduk)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        // Ambil riwayat kelas santri
        $history = $student->classMembers()
            ->with(['activeClass.academicYear'])
            ->get();

        $semestersList = [];

        // Ambil standar semester (1 = Ganjil, 2 = Genap) dari database
        $semesters = Semester::orderBy('id')->get();

        foreach ($history as $member) {
            if ($member->activeClass && $member->activeClass->academicYear) {
                // Untuk setiap tahun ajaran, biasanya ada 2 semester.
                // Kita asumsikan jika dia terdaftar di tahun tersebut, dia melewati semester tersebut.
                // Idealnya bisa dicek dari StudentGrade, tapi berdasar kelas lebih cepat.
                foreach ($semesters as $semester) {
                    $semestersList[] = [
                        'academic_year_id' => $member->activeClass->academic_year_id,
                        'tahun_ajaran' => $member->activeClass->academicYear->name,
                        'semester_id' => $semester->id,
                        'semester' => $semester->name,
                    ];
                }
            }
        }

        // Hilangkan duplikat jika ada murid masuk kelas berulang di tahun yang sama
        $uniqueSemesters = collect($semestersList)->unique(function ($item) {
            return $item['academic_year_id'] . '-' . $item['semester_id'];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'nomor_induk' => $student->user->nomor_induk ?? $nomorInduk,
                'nama' => $student->user->name,
                'riwayat_semester' => $uniqueSemesters
            ]
        ]);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/grades
     * Nilai akademik santri (per mapel, per komponen nilai)
     * Dapat menerima param opsional: ?academic_year_id=X&semester_id=Y
     */
    /**
     * GET /api/v1/student/{nomor_induk}/grades
     * Nilai akademik, Akhlak, Tahfidz & Absensi santri
     * Dapat menerima param opsional: ?academic_year_id=X&semester_id=Y
     */
    public function academicGrades(Request $request, string $nomorInduk)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        // Gunakan parameter opsional jika diberikan, jika tidak gunakan yang aktif
        if ($request->has('academic_year_id')) {
            $academicYear = AcademicYear::find($request->academic_year_id);
        } else {
            $academicYear = AcademicYear::where('is_active', true)->first();
        }

        if ($request->has('semester_id')) {
            $activeSemester = Semester::find($request->semester_id);
        } else {
            $activeSemester = Semester::where('is_active', true)->first();
        }

        if (!$academicYear || !$activeSemester) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran atau semester tidak valid.',
            ], 404);
        }

        // Ambil riwayat kelas santri di tahun ajaran yang dipilih
        $activeMember = $student->classMembers
            ->filter(fn($m) => $m->activeClass && $m->activeClass->academic_year_id == $academicYear->id)
            ->first();

        if (!$activeMember || !$activeMember->activeClass) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak memiliki kelas aktif pada tahun ajaran ini.',
            ], 404);
        }

        $activeClass = $activeMember->activeClass->load(['kelas.jenjang', 'kelasParalel', 'activeSubjects.mapel']);
        $kelasId = $activeClass->kelas_id;

        // --- 1. DATA AKADEMIK ---
        $isSem2 = false;
        $sem1 = null;
        if (in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $isSem2 = true;
            $sem1 = Semester::where('name', 'Ganjil')->orWhere('name', 'Semester 1')->first();
        }

        $gradeQuery = StudentGrade::where('student_id', $student->id)
            ->with(['activeSubject.mapel', 'gradeWeight'])
            ->when($isSem2 && $sem1, function ($query) use ($activeSemester, $sem1) {
                $query->whereIn('semester_id', [$activeSemester->id, $sem1->id]);
            }, function ($query) use ($activeSemester) {
                $query->where('semester_id', $activeSemester->id);
            });

        $grades = $gradeQuery->get();

        $gradeWeights = $this->sortAcademicWeights(
            GradeWeight::where('academic_year_id', $academicYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['All', 'all', 'Semua', 'semua', $activeSemester->name])
            ->get()
        );

        $gradeWeightsSem1 = collect();
        if ($isSem2 && $sem1) {
            $gradeWeightsSem1 = $this->sortAcademicWeights(
                GradeWeight::where('academic_year_id', $academicYear->id)
                    ->where('category', 'pengetahuan')
                    ->whereIn('semester', ['All', 'all', 'Semua', 'semua', $sem1->name])
                    ->get()
            );
        }

        $kkms = Kkm::where('kelas_id', $kelasId)->get()->keyBy('mapel_id');
        $gradesBySubject = $grades->groupBy(fn($g) => $g->active_subject_id);
        $knowledgeWeightSum = $gradeWeights->sum('weight');

        $academicSubjects = [];
        foreach ($activeClass->activeSubjects as $subject) {
            $mapelName = $subject->mapel->name ?? 'Unknown';
            $mapelId   = $subject->mapel_id;
            $kkm       = $kkms[$mapelId]->kkm_value ?? 70;

            $subjectGrades = $gradesBySubject->get($subject->id, collect());
            $subjectGradesCurrent = $subjectGrades->where('semester_id', $activeSemester->id);
            $subjectGradesSem1 = $isSem2 && $sem1 ? $subjectGrades->where('semester_id', $sem1->id) : collect();

            $sem1Score = 0;
            $hasSem1Data = false;
            if ($isSem2 && $sem1 && $subjectGradesSem1->count() > 0) {
                $hasSem1Data = true;
                $sem1Total = 0;
                $sem1WeightSum = $gradeWeightsSem1->sum('weight');

                foreach ($gradeWeightsSem1 as $weight) {
                    $grade = $subjectGradesSem1->firstWhere('grade_weight_id', $weight->id);
                    $value = $grade ? (float) $grade->score : 0;
                    $sem1Total += $value * $weight->weight;
                }

                $sem1Score = $sem1WeightSum > 0 ? round($sem1Total / $sem1WeightSum, 1) : 0;
            }

            $currentWeightedSum = 0;

            foreach ($gradeWeights as $weight) {
                $grade = $subjectGradesCurrent->firstWhere('grade_weight_id', $weight->id);
                if ($grade && $grade->score !== null) {
                    $currentWeightedSum += ((float) $grade->score) * $weight->weight;
                }
            }

            $komponen = [];
            $hasAnyActualScore = false;

            foreach ($gradeWeights as $weight) {
                $grade = $subjectGradesCurrent->firstWhere('grade_weight_id', $weight->id);
                $value = null;

                if ($grade && $grade->score !== null) {
                    $value = round((float) $grade->score, 1);
                }

                if ($value !== null) {
                    $hasAnyActualScore = true;
                }

                $komponen[$weight->name] = $value;
            }

            $progressScore = $knowledgeWeightSum > 0 ? round($currentWeightedSum / $knowledgeWeightSum, 1) : null;
            if (!$hasAnyActualScore && $progressScore === 0.0) {
                $progressScore = null;
            }

            $finalRapor = $progressScore ?? 0;
            if ($isSem2 && $hasSem1Data) {
                $finalRapor = ($sem1Score + (2 * ($progressScore ?? 0))) / 3;
            }

            $displayScore = round($finalRapor, 1);

            $hasRedMark = false;
            if ($isSem2 && $hasSem1Data && $sem1Score < $kkm) {
                $hasRedMark = true;
            }

            foreach ($komponen as $componentScore) {
                if ($componentScore !== null && $componentScore < $kkm) {
                    $hasRedMark = true;
                    break;
                }
            }

            $status = 'Aman';
            if ($isSem2 && $displayScore < $kkm) {
                $status = 'Belum Aman';
            } elseif ($hasRedMark || (($progressScore ?? 0) < $kkm)) {
                $status = 'Perlu Perhatian';
            }

            $academicSubjects[] = [
                'name'      => $mapelName,
                'kkm'       => $kkm,
                'sem1_score' => $isSem2 ? ($hasSem1Data ? $sem1Score : null) : null,
                'score'     => $displayScore,
                'components' => $komponen,
                'status'    => $status,
                'pass_status' => $displayScore >= $kkm ? 'Tuntas' : 'Belum Tuntas',
                'progress_score' => $progressScore,
            ];
        }

        // --- 2. DATA AKHLAK (CHARACTER) ---
        $charQuery = \App\Models\CharacterAssessment::where('student_id', $student->user_id)
            ->where('active_class_id', $activeClass->id);

        if (in_array($activeSemester->name, ['Ganjil', 'Semester 1'])) {
            $charQuery->whereIn('month', [7, 8, 9, 10, 11, 12]);
        } elseif (in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $charQuery->whereIn('month', [1, 2, 3, 4, 5, 6]);
        }

        $rawAssessments = $charQuery->get();
        $characterAssessments = $rawAssessments->groupBy('category');

        $characterData = [];
        foreach ($characterAssessments as $category => $items) {
            $characterData[] = [
                'category' => $category,
                'score' => round($items->avg('score'), 1),
                'note' => $items->last()->note ?? null, // Ambil catatan terbaru di kategori tsb
            ];
        }

        // --- DATA BULANAN AKHLAK ---
        $monthlyData = $this->getMonthlyCharacterData($rawAssessments, $activeSemester);

        // --- 3. DATA TAHFIDZ ---
        $tahfidzMemorizations = \App\Models\TahfidzMemorization::where('student_id', $student->id)
            ->where('is_completed', true)
            ->orderBy('juz')
            ->get();

        $tahfidzData = [
            'completed_juz' => $tahfidzMemorizations->pluck('juz')->map(fn($j) => (int)$j),
            'validated_juz' => $tahfidzMemorizations->where('is_validated', true)->pluck('juz')->map(fn($j) => (int)$j),
            'total_completed' => $tahfidzMemorizations->count(),
        ];

        // --- 4. DATA ABSENSI ---
        $attendanceSummary = \App\Models\AttendanceSummary::where('student_id', $student->user_id)
            ->where('active_class_id', $activeClass->id)
            ->where('semester', $activeSemester->name)
            ->first();

        $attendanceData = [
            'sakit' => $attendanceSummary->sakit ?? 0,
            'izin'  => $attendanceSummary->izin ?? 0,
            'alpa'  => $attendanceSummary->alpa ?? 0,
            'total' => ($attendanceSummary->sakit ?? 0) + ($attendanceSummary->izin ?? 0) + ($attendanceSummary->alpa ?? 0),
        ];

        // --- FINAL RESPONSE ---
        $kelasName = ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? '');
        $averageAcademicScore = collect($academicSubjects)->whereNotNull('score')->avg('score');

        return response()->json([
            'success' => true,
            'data'    => [
                'student' => [
                    'nomor_induk'   => $student->user->nomor_induk ?? $nomorInduk,
                    'nama'          => $student->user->name,
                    'kelas'         => trim($kelasName) ?: '-',
                    'jenjang'       => $activeClass->kelas->jenjang->name ?? '-',
                ],
                'academic' => [
                    'semester'      => $activeSemester->name,
                    'tahun_ajaran'  => $academicYear->name,
                    'is_sem2'       => $isSem2,
                    'weight_components' => $gradeWeights->pluck('name')->values(),
                    'average_score' => $averageAcademicScore !== null ? round((float) $averageAcademicScore, 2) : null,
                    'subjects'      => $academicSubjects,
                ],
                'character' => $characterData,
                'monthly_character' => $monthlyData,
                'tahfidz'   => $tahfidzData,
                'attendance' => $attendanceData,
            ],
        ]);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026
     * Versi Query Parameter untuk External Developer
     * semester: nama semester (Ganjil/Genap)
     * tahunAjaran: format tahun ajaran (2025/2026)
     */
    public function academicGradesByQuery(Request $request, string $nomorInduk, string $semester)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        // Cari semester berdasarkan nama
        $activeSemester = Semester::where('name', $semester)->first();

        if (!$activeSemester) {
            return response()->json([
                'success' => false,
                'message' => 'Semester tidak valid. Gunakan "Ganjil" atau "Genap".',
            ], 404);
        }

        // Cari tahun ajaran berdasarkan nama dari query parameter
        $tahunAjaran = $request->query('tahunAjaran');
        if (!$tahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tahunAjaran wajib diisi. Contoh: ?tahunAjaran=2025/2026',
            ], 400);
        }

        $academicYear = AcademicYear::where('name', $tahunAjaran)->first();

        if (!$academicYear) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak valid.',
            ], 404);
        }

        // Masukkan ke request agar dibaca oleh academicGrades
        $request->merge([
            'semester_id' => $activeSemester->id,
            'academic_year_id' => $academicYear->id,
        ]);

        return $this->academicGrades($request, $nomorInduk);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/character
     * Nilai karakter/akhlak santri (khusus dari menu pengasuhan)
     * Dapat menerima param opsional: ?academic_year_id=X&semester_id=Y
     */
    public function characterGrades(Request $request, string $nomorInduk)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        // Gunakan parameter opsional jika diberikan, jika tidak gunakan yang aktif
        if ($request->has('academic_year_id')) {
            $academicYear = AcademicYear::find($request->academic_year_id);
        } else {
            $academicYear = AcademicYear::where('is_active', true)->first();
        }

        if ($request->has('semester_id')) {
            $activeSemester = Semester::find($request->semester_id);
        } else {
            $activeSemester = Semester::where('is_active', true)->first();
        }

        if (!$academicYear || !$activeSemester) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran atau semester tidak valid.',
            ], 404);
        }

        // Ambil riwayat kelas santri di tahun ajaran yang dipilih
        $activeMember = $student->classMembers
            ->filter(fn($m) => $m->activeClass && $m->activeClass->academic_year_id == $academicYear->id)
            ->first();

        if (!$activeMember || !$activeMember->activeClass) {
            return response()->json([
                'success' => false,
                'message' => 'Santri tidak memiliki kelas aktif pada tahun ajaran ini.',
            ], 404);
        }

        $activeClass = $activeMember->activeClass->load(['kelas.jenjang', 'kelasParalel']);

        // --- DATA KARAKTER (CHARACTER) ---
        $charQuery = \App\Models\CharacterAssessment::where('student_id', $student->user_id)
            ->where('active_class_id', $activeClass->id);

        if (in_array($activeSemester->name, ['Ganjil', 'Semester 1'])) {
            $charQuery->whereIn('month', [7, 8, 9, 10, 11, 12]);
        } elseif (in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $charQuery->whereIn('month', [1, 2, 3, 4, 5, 6]);
        }

        $rawAssessments = $charQuery->get();
        $characterAssessments = $rawAssessments->groupBy('category');

        $characterData = [];
        foreach ($characterAssessments as $category => $items) {
            $characterData[] = [
                'category' => $category,
                'score' => round($items->avg('score'), 1),
                'note' => $items->last()->note ?? null,
            ];
        }

        // --- DATA BULANAN AKHLAK ---
        $monthlyData = $this->getMonthlyCharacterData($rawAssessments, $activeSemester);

        // --- FINAL RESPONSE ---
        $kelasName = ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? '');

        return response()->json([
            'success' => true,
            'data'    => [
                'student' => [
                    'nomor_induk'   => $student->user->nomor_induk ?? $nomorInduk,
                    'nama'          => $student->user->name,
                    'kelas'         => trim($kelasName) ?: '-',
                    'jenjang'       => $activeClass->kelas->jenjang->name ?? '-',
                ],
                'academic' => [
                    'semester'      => $activeSemester->name,
                    'tahun_ajaran'  => $academicYear->name,
                ],
                'character' => $characterData,
                'monthly_character' => $monthlyData,
            ],
        ]);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026
     * Versi Query Parameter untuk External Developer
     * semester: nama semester (Ganjil/Genap)
     * tahunAjaran: format tahun ajaran (2025/2026)
     */
    public function characterGradesByQuery(Request $request, string $nomorInduk, string $semester)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Santri dengan nomor induk tersebut tidak ditemukan.',
            ], 404);
        }

        // Cari semester berdasarkan nama
        $activeSemester = Semester::where('name', $semester)->first();

        if (!$activeSemester) {
            return response()->json([
                'success' => false,
                'message' => 'Semester tidak valid. Gunakan "Ganjil" atau "Genap".',
            ], 404);
        }

        // Cari tahun ajaran berdasarkan nama dari query parameter
        $tahunAjaran = $request->query('tahunAjaran');
        if (!$tahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tahunAjaran wajib diisi. Contoh: ?tahunAjaran=2025/2026',
            ], 400);
        }

        $academicYear = AcademicYear::where('name', $tahunAjaran)->first();

        if (!$academicYear) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak valid.',
            ], 404);
        }

        // Masukkan ke request agar dibaca oleh characterGrades
        $request->merge([
            'semester_id' => $activeSemester->id,
            'academic_year_id' => $academicYear->id,
        ]);

        return $this->characterGrades($request, $nomorInduk);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/{semester}/character/monthly?tahunAjaran=2025/2026
     * Data Akhlak bulanan untuk aplikasi eksternal
     */
    public function characterMonthlyGradesByQuery(Request $request, string $nomorInduk, string $semester)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Santri tidak ditemukan.'], 404);
        }

        $activeSemester = Semester::where('name', $semester)->first();
        if (!$activeSemester) {
            return response()->json(['success' => false, 'message' => 'Semester tidak valid. Gunakan "Ganjil" atau "Genap".'], 404);
        }

        $tahunAjaran = $request->query('tahunAjaran');
        if (!$tahunAjaran) {
            return response()->json(['success' => false, 'message' => 'Parameter tahunAjaran wajib diisi.'], 400);
        }

        $academicYear = AcademicYear::where('name', $tahunAjaran)->first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak valid.'], 404);
        }

        $activeMember = $student->classMembers
            ->filter(fn($m) => $m->activeClass && $m->activeClass->academic_year_id == $academicYear->id)
            ->first();

        if (!$activeMember || !$activeMember->activeClass) {
            return response()->json(['success' => false, 'message' => 'Santri tidak memiliki kelas aktif pada tahun ajaran ini.'], 404);
        }

        $activeClass = $activeMember->activeClass->load(['kelas.jenjang', 'kelasParalel']);

        $charQuery = \App\Models\CharacterAssessment::where('student_id', $student->user_id)
            ->where('active_class_id', $activeClass->id);

        if (in_array($activeSemester->name, ['Ganjil', 'Semester 1'])) {
            $charQuery->whereIn('month', [7, 8, 9, 10, 11, 12]);
        } elseif (in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $charQuery->whereIn('month', [1, 2, 3, 4, 5, 6]);
        }

        $characterAssessments = $charQuery->get();

        $monthlyData = $this->getMonthlyCharacterData($characterAssessments, $activeSemester);

        $kelasName = ($activeClass->kelas->name ?? '') . ' ' . ($activeClass->kelasParalel->name ?? '');

        return response()->json([
            'success' => true,
            'data'    => [
                'student' => [
                    'nomor_induk' => $student->user->nomor_induk ?? $nomorInduk,
                    'nama'        => $student->user->name,
                    'kelas'       => trim($kelasName) ?: '-',
                ],
                'academic' => [
                    'semester'     => $activeSemester->name,
                    'tahun_ajaran' => $academicYear->name,
                ],
                'monthly_character' => $monthlyData,
            ],
        ]);
    }

    /**
     * GET /api/v1/student/{nomor_induk}/{semester}/tahfidz?tahunAjaran=2025/2026
     * Data Tahfidz (Juz, Lembar, Nilai, Predikat) untuk aplikasi eksternal
     */
    public function tahfidzGradesByQuery(Request $request, string $nomorInduk, string $semester)
    {
        $student = $this->findStudentByNomorInduk($nomorInduk);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Santri tidak ditemukan.'], 404);
        }

        $activeSemester = Semester::where('name', $semester)->first();
        if (!$activeSemester) {
            return response()->json(['success' => false, 'message' => 'Semester tidak valid. Gunakan "Ganjil" atau "Genap".'], 404);
        }

        $tahunAjaran = $request->query('tahunAjaran');
        if (!$tahunAjaran) {
            return response()->json(['success' => false, 'message' => 'Parameter tahunAjaran wajib diisi.'], 400);
        }

        $academicYear = AcademicYear::where('name', $tahunAjaran)->first();
        if (!$academicYear) {
            return response()->json(['success' => false, 'message' => 'Tahun ajaran tidak valid.'], 404);
        }

        $tahfidzMapelIds = \App\Models\Mapel::where('name', 'like', '%Tahfizh Al-Quran%')
            ->orWhere('name', 'like', '%Tahfidz%')
            ->pluck('id');

        if ($tahfidzMapelIds->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Mapel Tahfidz tidak ditemukan.'], 404);
        }

        // Ambil nilai ujian Tahfidz dari StudentGrade
        $tahfidzGrades = \App\Models\StudentGrade::where('student_id', $student->id)
            ->where('semester_id', $activeSemester->id)
            ->whereHas('activeSubject', function ($q) use ($tahfidzMapelIds, $academicYear) {
                $q->whereIn('mapel_id', $tahfidzMapelIds)
                  ->whereHas('activeClass', function ($sq) use ($academicYear) {
                      $sq->where('academic_year_id', $academicYear->id);
                  });
            })
            ->with(['tahfidzDetails', 'gradeWeight'])
            ->get();

        $tahfidzData = [];
        foreach ($tahfidzGrades as $grade) {
            $score = round((float) $grade->score);
            
            // Predikat Logic (A, B, C, D)
            $predikat = 'D';
            if ($score >= 90) $predikat = 'A';
            elseif ($score >= 80) $predikat = 'B';
            elseif ($score >= 70) $predikat = 'C';

            // Ambil Juz dari tahfidzDetails (ujian tersebut ngetes juz berapa saja)
            $juzList = $grade->tahfidzDetails->pluck('juz')->filter()->unique()->toArray();
            $juzDisplay = empty($juzList) ? '-' : implode(', ', $juzList);
            
            // Lembar biasanya diambil dari tracking harian (TahfidzMemorization).
            // Karena tidak ada data eksplisit 'lembar' di tabel grade ujian, kita isi '-'
            // atau bisa dikembangkan lebih lanjut.
            $lembarDisplay = '-';
            
            // Jika ada juz, coba ambil jumlah lembar yang sudah selesai di TahfidzMemorization untuk juz tersebut
            if (!empty($juzList)) {
                $lembarTotal = 0;
                foreach($juzList as $j) {
                    $memo = \App\Models\TahfidzMemorization::where('student_id', $student->id)
                        ->where('juz', $j)
                        ->first();
                    if ($memo && is_array($memo->completed_pages)) {
                        $lembarTotal += count($memo->completed_pages);
                    } elseif ($memo && $memo->is_completed) {
                        $lembarTotal += 20; // Asumsi 1 juz = 20 halaman
                    }
                }
                if ($lembarTotal > 0) {
                    $lembarDisplay = (string) $lembarTotal;
                }
            }

            $tahfidzData[] = [
                'Juz' => $juzDisplay,
                'Lembar' => $lembarDisplay,
                'Nilai' => $score,
                'Predikat' => $predikat,
                'Ujian' => $grade->gradeWeight->name ?? 'Ujian'
            ];
        }
        
        $activeMember = $student->classMembers
            ->filter(fn($m) => $m->activeClass && $m->activeClass->academic_year_id == $academicYear->id)
            ->first();
        $kelasName = $activeMember && $activeMember->activeClass ? 
            trim(($activeMember->activeClass->kelas->name ?? '') . ' ' . ($activeMember->activeClass->kelasParalel->name ?? '')) : '-';

        return response()->json([
            'success' => true,
            'data'    => [
                'student' => [
                    'nomor_induk' => $student->user->nomor_induk ?? $nomorInduk,
                    'nama'        => $student->user->name,
                    'kelas'       => $kelasName,
                ],
                'academic' => [
                    'semester'     => $activeSemester->name,
                    'tahun_ajaran' => $academicYear->name,
                ],
                'tahfidz' => $tahfidzData,
            ],
        ]);
    }

    private function getMonthlyCharacterData($rawAssessments, $activeSemester)
    {
        $groupedByMonth = $rawAssessments->groupBy('month');
        $monthlyData = [];
        $monthsMap = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        // Ambil konfigurasi bulan aktif
        $settingObj = \App\Models\Setting::where('key', 'character_active_months')->first();
        $activeMonthsRaw = $settingObj ? $settingObj->value : null;

        // Filter active months based on current semester
        $semesterMonths = [];
        if (in_array($activeSemester->name, ['Ganjil', 'Semester 1'])) {
            $semesterMonths = [7, 8, 9, 10, 11, 12];
        } elseif (in_array($activeSemester->name, ['Genap', 'Semester 2'])) {
            $semesterMonths = [1, 2, 3, 4, 5, 6];
        }

        $activeMonths = [];
        if ($settingObj) {
            $decoded = json_decode($activeMonthsRaw, true);
            if (is_array($decoded)) {
                $activeMonths = $decoded;
            }
        } else {
            // Default jika belum ada setting: tampilkan bulan dari semester berjalan
            $activeMonths = $semesterMonths;
        }

        $monthKeys = collect($activeMonths)
            ->intersect($semesterMonths)
            ->unique()
            ->sort()
            ->values();

        $allCategories = \App\Models\CharacterCategory::where('type', 'dimension')
            ->where('is_active', true)
            ->pluck('name')
            ->map(fn($c) => ucfirst(strtolower($c)))
            ->unique();
        
        if ($allCategories->isEmpty()) {
             // Fallback to basic categories if no dimension is configured
             $allCategories = collect(['Ibadah', 'Patuh', 'Disiplin', 'Sopan', 'Bersih', 'Rajin']);
        }

        foreach ($monthKeys as $monthKey) {
            $items = $groupedByMonth->get($monthKey, collect([]));
            $monthName = is_numeric($monthKey) ? ($monthsMap[(int)$monthKey] ?? $monthKey) : $monthKey;
            
            $monthScores = ['Bulan' => $monthName];
            foreach ($allCategories as $cat) {
                $monthScores[$cat] = null;
            }

            foreach ($items as $item) {
                $cat = ucfirst(strtolower($item->category));
                if (isset($monthScores[$cat]) || array_key_exists($cat, $monthScores)) {
                    $monthScores[$cat] = round((float)$item->score);
                }
            }

            $monthlyData[] = $monthScores;
        }

        return $monthlyData;
    }
}
