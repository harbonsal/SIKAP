<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\ActiveSubject;
use App\Models\GradeWeight;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ClassLedgerController extends Controller
{
    public function show(Request $request, $id)
    {
        $activeClass = ActiveClass::with(['kelas', 'kelasParalel', 'teacher', 'classMembers.student.user'])
            ->findOrFail($id);

        $activeYear = AcademicYear::where('is_active', true)->first();
        $targetSemesterName = $request->semester ?: (Semester::where('is_active', true)->first()->name ?? 'Ganjil');
        $targetSemester = Semester::where('name', $targetSemesterName)->first();

        // 1. Get all subjects for this class
        $activeSubjects = ActiveSubject::with('mapel')
            ->where('active_class_id', $id)
            ->get();

        // 2. Get grade weights for this category (e.g., UH1, UTS, UH2, UAS/UKK)
        // Exclude 'Validasi' category from ledger display
        $gradeWeights = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->where('name', '!=', 'Validasi')
            ->whereIn('semester', ['all', 'semua', 'All', $targetSemester->name, strtolower($targetSemester->name)])
            ->orderBy('id')
            ->get();

        // 3. Get all grades for students in this class
        $activeClass->load(['classMembers.student.studentGrades' => function ($q) use ($activeSubjects, $targetSemester) {
            $q->whereIn('active_subject_id', $activeSubjects->pluck('id'))
                ->where('semester_id', $targetSemester->id);
        }]);

        // 4. Calculate Ledger Data
        $studentRecaps = $activeClass->classMembers->map(function ($member) use ($activeSubjects, $gradeWeights) {
            $student = $member->student;
            $grades = $student->studentGrades;
            $subjectsData = [];
            $totalScore = 0;

            foreach ($activeSubjects as $subject) {
                $subjectGrades = $grades->where('active_subject_id', $subject->id);
                $weightsData = [];
                $finalSubjectScore = 0;

                foreach ($gradeWeights as $weight) {
                    $grade = $subjectGrades->where('grade_weight_id', $weight->id)->first();
                    $score = $grade ? $grade->score : 0;
                    $weightsData[$weight->id] = $score;

                    // Add to final score according to weight percentage
                    $finalSubjectScore += $score * ($weight->weight / 100);
                }

                $finalSubjectScore = round($finalSubjectScore);

                $subjectsData[$subject->id] = [
                    'weights' => $weightsData,
                    'final_score' => $finalSubjectScore,
                ];

                $totalScore += $finalSubjectScore;
            }

            $averageScore = $activeSubjects->count() > 0 ? $totalScore / $activeSubjects->count() : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name, // Uses accessor in Student model
                'nomor_induk' => $student->nomor_induk,
                'subjects' => $subjectsData,
                'total_score' => $totalScore,
                'average_score' => round($averageScore, 2),
            ];
        });

        // 5. Sort by Total Score Descending to get Rank
        $studentRecaps = $studentRecaps->sortByDesc('total_score')->values();

        // Add Rank to data
        $studentRecaps = $studentRecaps->map(function ($item, $index) {
            $item['rank'] = $index + 1;
            return $item;
        });

        // Fetch KKMs
        $kkms = \App\Models\Kkm::where('kelas_id', $activeClass->kelas_id)->get()->keyBy('mapel_id');

        return Inertia::render('Teacher/Assessment/Recap/Class/Ledger', [
            'activeClass' => $activeClass,
            'activeSubjects' => $activeSubjects,
            'gradeWeights' => $gradeWeights,
            'studentRecaps' => $studentRecaps,
            'academicYear' => $activeYear,
            'semester' => $targetSemester,
            'kkms' => $kkms,
        ]);
    }
}
