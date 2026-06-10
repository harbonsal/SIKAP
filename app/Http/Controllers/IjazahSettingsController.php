<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class IjazahSettingsController extends Controller
{
    public function index()
    {
        $settings = \App\Models\Setting::whereIn('key', [
            'ijazah_school_name_ar',
            'ijazah_mudir_name',
            'ijazah_body_top',
            'ijazah_body_bottom',
            'ijazah_city_date',
            'ijazah_hijri_date',
            'ijazah_gregorian_date',
            'ijazah_subjects',
        ])->pluck('value', 'key');

        $systemMapels = \App\Models\Mapel::orderBy('name')->get(['id', 'name']);

        // Fetch potential Mudirs (Active users with nomor_induk AND role Guru/Kepala Sekolah/Manager/Pengasuh in Primary OR Additional Levels)
        $employees = \App\Models\User::active()
            ->whereNotNull('nomor_induk')
            ->where('nomor_induk', '!=', '')
            ->where(function ($query) {
                $query->whereHas('userLevel', function ($q) {
                    $q->whereIn('name', ['Guru', 'Kepala Sekolah', 'Manager', 'Pengasuh']);
                })
                    ->orWhereHas('additionalLevels', function ($q) {
                        $q->whereIn('name', ['Guru', 'Kepala Sekolah', 'Manager', 'Pengasuh']);
                    });
            })
            ->orderBy('name')
            ->get(['id', 'name', 'nama_arab', 'nomor_induk']);

        return Inertia::render('Settings/Education/Ijazah/Index', [
            'settings' => $settings,
            'systemMapels' => $systemMapels,
            'employees' => $employees,
        ]);
    }

    public function candidates()
    {
        $candidates = $this->getIjazahCandidates()->map(function ($student) {
            $currentClass = $student->classMembers->first()?->activeClass;

            return [
                'id' => $student->id,
                'name' => $student->user->name,
                'nama_arab' => $student->user->nama_arab,
                'nomor_induk' => $student->user->nomor_induk,
                'nisn' => $student->nisn,
                'birth_place' => $student->birth_place,
                'birth_place_ar' => $student->birth_place_ar,
                'birth_date' => $student->birth_date,
                'class_name' => $currentClass ? trim(($currentClass->kelas->name ?? '') . ' ' . ($currentClass->kelasParalel->name ?? '')) : '-',
            ];
        });

        return Inertia::render('Academic/Ijazah/Index', [
            'candidates' => $candidates
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'ijazah_school_name_ar' => 'nullable|string',
            'ijazah_mudir_name' => 'nullable|string',
            'ijazah_mudir_niy' => 'nullable|string', // Added NIY
            'ijazah_body_top' => 'nullable|string',
            'ijazah_body_bottom' => 'nullable|string',
            'ijazah_city_date' => 'nullable|string',
            'ijazah_subjects' => 'nullable', // Accepts JSON string or array
        ]);

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }
            \App\Models\Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return redirect()->back()->with('success', 'Pengaturan Ijazah berhasil disimpan.');
    }

    public function updateBiodata(Request $request, \App\Models\Student $student)
    {
        $data = $request->validate([
            'birth_place_ar' => 'nullable|string',
            'nama_arab' => 'nullable|string',
        ]);

        $student->update(['birth_place_ar' => $data['birth_place_ar']]);

        if (array_key_exists('nama_arab', $data)) {
            $student->user->update(['nama_arab' => $data['nama_arab']]);
        }

        return redirect()->back()->with('success', 'Biodata bahasa Arab berhasil diperbarui.');
    }

    public function manualGrades(\App\Models\Student $student)
    {
        $settings = \App\Models\Setting::where('key', 'ijazah_subjects')->first();
        $subjects = json_decode($settings->value ?? '[]', true);

        // Fetch existing manual grades
        $manualGrades = \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
            ->where('student_id', $student->id)
            ->pluck('score', 'mapel_name');

        return Inertia::render('Academic/Ijazah/ManualGrade', [
            'student' => $student->load('user'),
            'subjects' => $subjects,
            'existingGrades' => $manualGrades,
        ]);
    }

    public function storeManualGrades(Request $request, \App\Models\Student $student)
    {
        $data = $request->validate([
            'grades' => 'array',
            'grades.*.mapel_name' => 'required|string',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

        foreach ($data['grades'] as $grade) {
            if (isset($grade['score']) && $grade['score'] !== null) {
                \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')->updateOrInsert(
                    ['student_id' => $student->id, 'mapel_name' => $grade['mapel_name']],
                    ['score' => $grade['score'], 'updated_at' => now()]
                );
            } else {
                \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
                    ->where('student_id', $student->id)
                    ->where('mapel_name', $grade['mapel_name'])
                    ->delete();
            }
        }

        return redirect()->route('academic.ijazah.index')->with('success', 'Nilai manual berhasil disimpan.');
    }

    public function collectiveGrades(Request $request)
    {
        $settings = \App\Models\Setting::where('key', 'ijazah_subjects')->first();
        $subjects = json_decode($settings->value ?? '[]', true);
        $candidates = $this->getIjazahCandidates();

        // Fetch all manual grades for these students
        $studentIds = $candidates->pluck('id');
        $allManualGrades = \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
            ->whereIn('student_id', $studentIds)
            ->get();

        $candidatesData = $candidates->map(function ($s) use ($allManualGrades) {
            $currentClass = $s->classMembers->first()?->activeClass;

            return [
                'id' => $s->id,
                'name' => $s->user->name,
                'nomor_induk' => $s->user->nomor_induk,
                'class_name' => $currentClass ? trim(($currentClass->kelas->name ?? '') . ' ' . ($currentClass->kelasParalel->name ?? '')) : '-',
                'grades' => $allManualGrades->where('student_id', $s->id)->pluck('score', 'mapel_name')->toArray(),
            ];
        });

        return Inertia::render('Academic/Ijazah/Collective', [
            'subjects' => $subjects,
            'candidates' => $candidatesData,
        ]);
    }

    public function storeCollectiveGrades(Request $request)
    {
        $data = $request->validate([
            'mapel_name' => 'required|string',
            'grades' => 'array', // [student_id => score]
            'grades.*' => 'nullable|numeric|min:0|max:100',
        ]);

        $mapelName = $data['mapel_name'];

        foreach ($data['grades'] as $studentId => $score) {
            if ($score !== null && $score !== '') {
                \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')->updateOrInsert(
                    ['student_id' => $studentId, 'mapel_name' => $mapelName],
                    ['score' => $score, 'updated_at' => now()]
                );
            } else {
                // If cleared, delete
                \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
                    ->where('student_id', $studentId)
                    ->where('mapel_name', $mapelName)
                    ->delete();
            }
        }

        return redirect()->back()->with('success', 'Nilai kolektif berhasil disimpan.');
    }

    public function collectiveBiodata()
    {
        $candidates = $this->getIjazahCandidates()->map(function ($student) {
            $currentClass = $student->classMembers->first()?->activeClass;

            return [
                'id' => $student->id,
                'name' => $student->user->name,
                'nomor_induk' => $student->user->nomor_induk,
                'nama_arab' => $student->user->nama_arab,
                'birth_place_ar' => $student->birth_place_ar,
                'class_name' => $currentClass ? trim(($currentClass->kelas->name ?? '') . ' ' . ($currentClass->kelasParalel->name ?? '')) : '-',
            ];
        });

        return Inertia::render('Academic/Ijazah/CollectiveBiodata', [
            'candidates' => $candidates,
        ]);
    }

    public function storeCollectiveBiodata(Request $request)
    {
        $data = $request->validate([
            'biodata' => 'required|array',
            'biodata.*.nama_arab' => 'nullable|string',
            'biodata.*.birth_place_ar' => 'nullable|string',
        ]);

        $studentIds = collect(array_keys($data['biodata']))
            ->filter(fn($id) => is_numeric($id))
            ->map(fn($id) => (int) $id)
            ->values();

        $students = \App\Models\Student::with('user')
            ->whereIn('id', $studentIds)
            ->get()
            ->keyBy('id');

        \Illuminate\Support\Facades\DB::transaction(function () use ($data, $students) {
            foreach ($data['biodata'] as $studentId => $row) {
                $student = $students->get((int) $studentId);

                if (!$student) {
                    continue;
                }

                $student->update([
                    'birth_place_ar' => $row['birth_place_ar'] ?? null,
                ]);

                if ($student->user) {
                    $student->user->update([
                        'nama_arab' => $row['nama_arab'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Biodata kolektif berhasil disimpan.');
    }

    public function print(\App\Models\Student $student)
    {
        try {
        $student->load(['user', 'studentGrades.activeSubject', 'studentGrades.activeSubject.mapel']);

        $settings = \App\Models\Setting::where('key', 'like', 'ijazah_%')->pluck('value', 'key');
        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();

        // Get Semester 1 (Ganjil) and Semester 2 (Genap) for rapor calculation
        $semester1 = \App\Models\Semester::where('name', 'like', '%Ganjil%')->orWhere('name', 'Semester 1')->first();
        $semester2 = \App\Models\Semester::where('name', 'like', '%Genap%')->orWhere('name', 'Semester 2')->first();
        $sem1Id = $semester1 ? $semester1->id : null;
        $sem2Id = $semester2 ? $semester2->id : null;

        // Fetch Manual Grades - with safety check
        try {
            $manualGrades = \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
                ->where('student_id', $student->id)
                ->pluck('score', 'mapel_name');
        } catch (\Exception $e) {
            $manualGrades = collect();
        }

        $subjectsRaw = $settings->get('ijazah_subjects', '[]');
        $subjects = json_decode($subjectsRaw ?? '[]', true);
        if (!is_array($subjects)) $subjects = [];
        // Re-index array to ensure sequential keys (0,1,2,...)
        $subjects = array_values($subjects);
        $totalScore = 0;
        $count = 0;

        // Process Subjects
        foreach ($subjects as $idx => &$subj) {
            // Skip invalid entries
            if (!is_array($subj)) continue;

            $finalGrade = 0;
            $subjName = isset($subj['name']) ? (string)$subj['name'] : (isset($subj['mapel_name']) ? (string)$subj['mapel_name'] : '');

            // 1. Check Manual Grade First
            if ($subjName && isset($manualGrades[$subjName])) {
                $finalGrade = (int) $manualGrades[$subjName];
                $source = 'manual';
            }
            // 2. Calculate Rapor Score using formula: (Sem1 + 2*Sem2) / 3
            elseif (!empty($subj['mapel_id']) && $sem2Id) {
                $latestClassMember = $student->classMembers()->with('activeClass')->latest()->first();
                $academicYearId = $latestClassMember?->activeClass?->academic_year_id ?? null;

                if ($academicYearId) {
                    // Calculate Semester 2 score
                    $sem2Score = $this->calculateSemesterScore($student, $subj['mapel_id'], $sem2Id, $academicYearId);
                    
                    // Calculate Semester 1 score
                    $sem1Score = 0;
                    if ($sem1Id) {
                        $sem1Score = $this->calculateSemesterScore($student, $subj['mapel_id'], $sem1Id, $academicYearId);
                    }
                    
                    // Formula Nilai Rapor Semester 2: (Semester 1 + 2 * Semester 2) / 3
                    $finalGrade = round(($sem1Score + (2 * $sem2Score)) / 3);
                }
            }

            // Store in subject array for view
            $subj['final_score'] = $finalGrade;
            $subj['score_text'] = $finalGrade > 0
                ? \App\Helpers\ArabicNumberConverter::convert((int) $finalGrade)
                : '-';

            if ($finalGrade > 0) {
                $totalScore += $finalGrade;
                $count++;
            }
        }
        unset($subj);

        // Calculate Average
        $averageScore = $count > 0 ? round($totalScore / $count, 2) : 0;

        // Total Text in Arabic
        $totalScoreText = \App\Helpers\ArabicNumberConverter::convert($totalScore);

        // Fetch all 3 Tsanawy candidates with their grades for recap
        $candidates = $this->getIjazahCandidates();
        $candidatesData = [];

        foreach ($candidates as $candidate) {
            $candidate->load(['user', 'studentGrades.activeSubject', 'studentGrades.activeSubject.mapel']);

            $candidateManualGrades = \Illuminate\Support\Facades\DB::table('ijazah_manual_grades')
                ->where('student_id', $candidate->id)
                ->pluck('score', 'mapel_name');

            $candidateSubjects = array_values($subjects);
            $candidateTotalScore = 0;
            $candidateCount = 0;

            foreach ($candidateSubjects as &$cSubj) {
                if (!is_array($cSubj)) continue;

                $cFinalGrade = 0;
                $cSubjName = isset($cSubj['name']) ? (string)$cSubj['name'] : (isset($cSubj['mapel_name']) ? (string)$cSubj['mapel_name'] : '');

                if ($cSubjName && isset($candidateManualGrades[$cSubjName])) {
                    $cFinalGrade = (int) $candidateManualGrades[$cSubjName];
                } elseif (!empty($cSubj['mapel_id']) && $sem2Id) {
                    $latestClassMember = $candidate->classMembers()->with('activeClass')->latest()->first();
                    $academicYearId = $latestClassMember?->activeClass?->academic_year_id ?? null;

                    if ($academicYearId) {
                        // Calculate Semester 2 score
                        $cSem2Score = $this->calculateSemesterScore($candidate, $cSubj['mapel_id'], $sem2Id, $academicYearId);
                        
                        // Calculate Semester 1 score
                        $cSem1Score = 0;
                        if ($sem1Id) {
                            $cSem1Score = $this->calculateSemesterScore($candidate, $cSubj['mapel_id'], $sem1Id, $academicYearId);
                        }
                        
                        // Formula Nilai Rapor Semester 2: (Semester 1 + 2 * Semester 2) / 3
                        $cFinalGrade = round(($cSem1Score + (2 * $cSem2Score)) / 3);
                    }
                }

                $cSubj['final_score'] = $cFinalGrade;

                if ($cFinalGrade > 0) {
                    $candidateTotalScore += $cFinalGrade;
                    $candidateCount++;
                }
            }
            unset($cSubj);

            $candidateAverage = $candidateCount > 0 ? round($candidateTotalScore / $candidateCount, 2) : 0;

            $candidatesData[] = [
                'id' => $candidate->id,
                'name' => $candidate->user->name,
                'nama_arab' => $candidate->user->nama_arab,
                'nomor_induk' => $candidate->user->nomor_induk,
                'class_name' => $candidate->classMembers->first()?->activeClass ? 
                    trim(($candidate->classMembers->first()->activeClass->kelas->name ?? '') . ' ' . 
                    ($candidate->classMembers->first()->activeClass->kelasParalel->name ?? '')) : '-',
                'average_score' => $candidateAverage,
                'total_score' => $candidateTotalScore,
                'subjects' => $candidateSubjects,
            ];
        }

        // Sort candidates by average score descending for ranking
        usort($candidatesData, function($a, $b) {
            return $b['average_score'] <=> $a['average_score'];
        });

        // Add rank to each candidate
        foreach ($candidatesData as $index => &$candidate) {
            $candidate['rank'] = $index + 1;
        }
        unset($candidate);

        return Inertia::render('Settings/Education/Ijazah/Print', [
            'student' => $student,
            'averageScore' => $averageScore,
            'totalScore' => $totalScore,
            'totalScoreText' => $totalScoreText,
            'settings' => $settings,
            'schoolInfo' => \App\Models\SchoolInfo::first(), // Added
            'subjectsProcessed' => $subjects,
            'academicYear' => $academicYear,
            'candidates' => $candidatesData,
        ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('IjazahPrint error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return back()->with('error', 'Gagal memuat cetak ijazah: ' . $e->getMessage());
        }
    }

    /**
     * Calculate weighted score for a specific semester
     * 
     * @param \App\Models\Student $student
     * @param int $subjectMapelId
     * @param int $semesterId
     * @param int $academicYearId
     * @return int Rounded weighted score, or 0 if no data
     */
    private function calculateSemesterScore($student, $subjectMapelId, $semesterId, $academicYearId)
    {
        // Get semester object from ID
        $semester = \App\Models\Semester::find($semesterId);
        if (!$semester) {
            return 0;
        }
        
        // Get grade weights for the semester (category: pengetahuan)
        $gradeWeights = \App\Models\GradeWeight::where('academic_year_id', $academicYearId)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $semester->name, strtolower($semester->name)])
            ->get();
        
        if ($gradeWeights->isEmpty()) {
            return 0;
        }
        
        // Find the active subject for this mapel in the student's latest class
        $latestClassMember = $student->classMembers()->with('activeClass.activeSubjects')->latest()->first();
        $activeClass = $latestClassMember?->activeClass;
        
        if (!$activeClass) {
            return 0;
        }

        $activeSubject = $activeClass->activeSubjects->firstWhere('mapel_id', $subjectMapelId);

        if (!$activeSubject) {
            return 0;
        }
        
        // Filter student grades by active subject and semester
        $gradesForSubj = $student->studentGrades->filter(function ($g) use ($activeSubject, $semesterId) {
            return $g->active_subject_id == $activeSubject->id
                && $g->semester_id == $semesterId;
        });
        
        if ($gradesForSubj->isEmpty()) {
            return 0;
        }
        
        // Calculate weighted score using grade weights
        $computedFinal = 0;
        foreach ($gradeWeights as $weight) {
            $g = $gradesForSubj->firstWhere('grade_weight_id', $weight->id);
            $s = $g ? $g->score : 0;
            $computedFinal += $s * ($weight->weight / 100);
        }
        
        // Return rounded score
        return round($computedFinal);
    }

    private function getIjazahCandidates()
    {
        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();

        return \App\Models\Student::join('users', 'students.user_id', '=', 'users.id')
            ->with(['user', 'classMembers' => function ($q) use ($activeYear) {
                if ($activeYear) {
                    $q->whereHas('activeClass', function ($ac) use ($activeYear) {
                        $ac->where('academic_year_id', $activeYear->id);
                    })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
                }
            }])
            ->whereHas('classMembers.activeClass', function ($q) use ($activeYear) {
                if ($activeYear) {
                    $q->where('academic_year_id', $activeYear->id);
                }

                $q->whereHas('kelas', function ($k) {
                    $k->where('name', 'LIKE', '%3%')
                        ->whereHas('jenjang', function ($j) {
                            $j->where('name', 'Tsanawy');
                        });
                });
            })
            ->select('students.*')
            ->orderBy('users.nomor_induk', 'asc')
            ->get();
    }
}
