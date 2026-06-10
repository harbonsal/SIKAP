<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Setting;
use App\Models\Kelas;
use App\Models\KelasParalel;
use App\Models\ClassMember;
use Illuminate\Support\Facades\DB;
use App\Models\GradeWeight;
use Illuminate\Pagination\LengthAwarePaginator;

class IjazahRecapController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return redirect()->back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        // Get Semesters
        $semester2 = Semester::where('name', 'like', '%Genap%')->orWhere('name', 'Semester 2')->first();
        $semester1 = Semester::where('name', 'like', '%Ganjil%')->orWhere('name', 'Semester 1')->first();

        // Filters
        $kelasId = $request->kelas_id;
        $paralelId = $request->paralel_id;
        $search = $request->search;

        // Base Query for ClassMembers in the current academic year
        $query = ClassMember::with(['student.user', 'activeClass.kelas', 'activeClass.kelasParalel', 'activeClass.activeSubjects', 'student.studentGrades'])
            ->whereHas('activeClass', function ($q) use ($activeYear, $kelasId, $paralelId) {
                $q->where('academic_year_id', $activeYear->id);
                if ($kelasId) {
                    $q->where('kelas_id', $kelasId);
                }
                if ($paralelId) {
                    $q->where('kelas_paralel_id', $paralelId);
                }
            });

        if ($search) {
            $query->whereHas('student.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $classMembers = $query->get();

        // Fetch Ijazah Settings
        $ijazahSettings = Setting::where('key', 'like', 'ijazah_%')->pluck('value', 'key');
        $ijazahSubjectsRaw = $ijazahSettings->get('ijazah_subjects', '[]');
        $ijazahSubjects = json_decode($ijazahSubjectsRaw ?? '[]', true);
        if (!is_array($ijazahSubjects)) $ijazahSubjects = [];
        $ijazahSubjects = array_values($ijazahSubjects);

        // Fetch Manual Grades for fetched students
        $studentIds = $classMembers->pluck('student_id');
        $ijazahManualGradesRaw = DB::table('ijazah_manual_grades')
            ->whereIn('student_id', $studentIds)
            ->get();
        $ijazahManualGrades = [];
        foreach ($ijazahManualGradesRaw as $mg) {
            $ijazahManualGrades[$mg->student_id][$mg->mapel_name] = $mg->score;
        }

        // Fetch Grade Weights
        $gradeWeightsSem2 = $semester2 ? GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $semester2->name, strtolower($semester2->name)])
            ->get() : collect();

        $gradeWeightsSem1 = $semester1 ? GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $semester1->name, strtolower($semester1->name)])
            ->get() : collect();

        // Calculate Ijazah Grades
        $studentIjazahs = $classMembers->map(function ($member) use ($ijazahSubjects, $ijazahManualGrades, $semester2, $semester1, $gradeWeightsSem2, $gradeWeightsSem1) {
            $student = $member->student;
            $grades = $student->studentGrades;
            $activeSubjects = $member->activeClass->activeSubjects->keyBy('mapel_id');
            $subjectsData = [];
            $totalScore = 0;
            $count = 0;

            // Helper Calc
            $calc = function ($weights, $semId, $subjId) use ($grades) {
                $sg = $grades->where('active_subject_id', $subjId)->where('semester_id', $semId);
                $final = 0;
                foreach ($weights as $w) {
                    $g = $sg->where('grade_weight_id', $w->id)->first();
                    $s = $g ? $g->score : 0;
                    $final += $s * ($w->weight / 100);
                }
                return round($final);
            };

            foreach ($ijazahSubjects as $idx => $subj) {
                if (!is_array($subj)) continue;
                $subjName = isset($subj['name']) ? (string)$subj['name'] : (isset($subj['mapel_name']) ? (string)$subj['mapel_name'] : '');
                $mapelId = $subj['mapel_id'] ?? null;
                $finalGrade = 0;

                // 1. Manual Grade
                if ($subjName && isset($ijazahManualGrades[$student->id][$subjName])) {
                    $finalGrade = (int) $ijazahManualGrades[$student->id][$subjName];
                }
                // 2. Calculated Grade
                elseif ($mapelId) {
                    $activeSubject = $activeSubjects->get($mapelId);
                    if ($activeSubject && $semester2) {
                        $sem2Score = $calc($gradeWeightsSem2, $semester2->id, $activeSubject->id);
                        $sem1Score = 0;
                        if ($semester1) {
                            $sem1Score = $calc($gradeWeightsSem1, $semester1->id, $activeSubject->id);
                        }
                        $finalGrade = round(($sem1Score + (2 * $sem2Score)) / 3);
                    }
                }

                $subjectsData[$idx] = [
                    'final_score' => $finalGrade,
                ];
                if ($finalGrade > 0) {
                    $totalScore += $finalGrade;
                    $count++;
                }
            }

            $averageScore = $count > 0 ? $totalScore / $count : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name ?? ($student->user->name ?? '-'),
                'nomor_induk' => $student->nomor_induk,
                'kelas_name' => $member->activeClass->kelas->name . ' ' . ($member->activeClass->kelasParalel->name ?? ''),
                'subjects' => $subjectsData,
                'total_score' => $totalScore,
                'average_score' => round($averageScore, 2),
            ];
        });

        // Sort by Total Score Descending for Global Rank
        $studentIjazahs = $studentIjazahs->sortByDesc('total_score')->values();

        // Add Rank
        $studentIjazahs = $studentIjazahs->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // Manual Pagination
        $perPage = 50;
        $page = $request->input('page', 1);
        $offset = ($page - 1) * $perPage;
        
        $paginatedItems = new LengthAwarePaginator(
            $studentIjazahs->slice($offset, $perPage)->values(),
            $studentIjazahs->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/Assessment/Recap/Ijazah/Index', [
            'ijazahSubjects' => $ijazahSubjects,
            'students' => $paginatedItems,
            'filters' => [
                'kelas_id' => $kelasId,
                'paralel_id' => $paralelId,
                'search' => $search,
            ],
            'kelasList' => Kelas::all(),
            'paralelList' => KelasParalel::all(),
            'academicYear' => $activeYear,
        ]);
    }
}
