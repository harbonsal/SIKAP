<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ActiveSubject;
use App\Models\UhSession;
use App\Models\UhQuizScore;
use App\Models\UhParticipationScore;
use App\Models\StudentGrade;
use App\Models\GradeWeight;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class UhAssessmentController extends Controller
{
    public function show(Request $request, $id, $type)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $activeSubject = ActiveSubject::with([
            'mapel',
            'teacher',
            'activeClass.kelas',
            'activeClass.kelasParalel',
            'activeClass.classMembers.student.user'
        ])->findOrFail($id);

        // Sort Class Members by User Nomor Induk (NIS)
        if ($activeSubject->activeClass && $activeSubject->activeClass->classMembers) {
            $sortedMembers = $activeSubject->activeClass->classMembers->sortBy(function ($member) {
                return $member->student->user->nomor_induk ?? $member->student->nis ?? 999999;
            })->values();
            $activeSubject->activeClass->setRelation('classMembers', $sortedMembers);
        }

        $session = UhSession::with(['quizScores', 'participationScores'])
            ->firstOrCreate([
                'active_subject_id' => $id,
                'semester_id' => $activeSemester->id,
                'type' => strtoupper($type)
            ]);

        // Map data to easy array for frontend
        $quizScores = [];
        foreach ($session->quizScores as $q) {
            $quizScores[$q->student_id][$q->quiz_number] = $q->score;
        }

        $participationScores = [];
        foreach ($session->participationScores as $p) {
            $participationScores[$p->student_id] = $p->score;
        }

        return Inertia::render('Teacher/Assessment/UhInput', [
            'activeSubject' => $activeSubject,
            'semester' => $activeSemester,
            'uhType' => strtoupper($type),
            'quizCount' => $session->quiz_count,
            'quizScores' => $quizScores,
            'participationScores' => $participationScores,
            'previousParams' => $request->query()
        ]);
    }

    public function storeQuiz(Request $request, $id, $type)
    {
        $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.quiz_number' => 'required|integer|min:1',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $session = UhSession::firstOrCreate([
            'active_subject_id' => $id,
            'semester_id' => $activeSemester->id,
            'type' => strtoupper($type)
        ]);

        foreach ($request->grades as $g) {
            if ($g['score'] !== null && $g['score'] !== '') {
                UhQuizScore::updateOrCreate(
                    [
                        'uh_session_id' => $session->id,
                        'student_id' => $g['student_id'],
                        'quiz_number' => $g['quiz_number'],
                    ],
                    ['score' => $g['score']]
                );
            } else {
                UhQuizScore::where('uh_session_id', $session->id)
                    ->where('student_id', $g['student_id'])
                    ->where('quiz_number', $g['quiz_number'])
                    ->delete();
            }
        }

        $this->syncToGrade($id, $type);

        return redirect()->back()->with('success', 'Nilai pemahaman disimpan.');
    }

    public function storeParticipation(Request $request, $id, $type)
    {
        $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.score' => 'nullable|numeric|min:0|max:100',
        ]);

        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $session = UhSession::firstOrCreate([
            'active_subject_id' => $id,
            'semester_id' => $activeSemester->id,
            'type' => strtoupper($type)
        ]);

        foreach ($request->grades as $g) {
            if ($g['score'] !== null && $g['score'] !== '') {
                UhParticipationScore::updateOrCreate(
                    [
                        'uh_session_id' => $session->id,
                        'student_id' => $g['student_id'],
                    ],
                    ['score' => $g['score']]
                );
            } else {
                UhParticipationScore::where('uh_session_id', $session->id)
                    ->where('student_id', $g['student_id'])
                    ->delete();
            }
        }

        $this->syncToGrade($id, $type);

        return redirect()->back()->with('success', 'Nilai partisipasi disimpan.');
    }

    public function addQuiz(Request $request, $id, $type)
    {
        $activeSemester = \App\Services\AcademicStateService::currentSemester();
        $session = UhSession::firstOrCreate([
            'active_subject_id' => $id,
            'semester_id' => $activeSemester->id,
            'type' => strtoupper($type)
        ]);
        
        $session->increment('quiz_count');
        return redirect()->back();
    }

    public function removeQuiz(Request $request, $id, $type, $num)
    {
        $activeSemester = \App\Services\AcademicStateService::currentSemester();
        $session = UhSession::where([
            'active_subject_id' => $id,
            'semester_id' => $activeSemester->id,
            'type' => strtoupper($type)
        ])->first();

        if ($session) {
            UhQuizScore::where('uh_session_id', $session->id)->where('quiz_number', $num)->delete();
            if ($session->quiz_count > 1) {
                $session->decrement('quiz_count');
            }
            $this->syncToGrade($id, $type);
        }

        return redirect()->back();
    }

    public function syncToGrade($activeSubjectId, $type)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeSemester = \App\Services\AcademicStateService::currentSemester();
        $user = Auth::user();

        $session = UhSession::with(['quizScores', 'participationScores'])->where([
            'active_subject_id' => $activeSubjectId,
            'semester_id' => $activeSemester->id,
            'type' => strtoupper($type)
        ])->first();

        if (!$session) return;

        $upperType = strtoupper($type);
        $gradeWeight = GradeWeight::where('academic_year_id', $activeYear->id)
            ->where('category', 'pengetahuan')
            ->whereIn('semester', ['all', 'semua', 'All', $activeSemester->name, strtolower($activeSemester->name)])
            ->where(function($q) use ($upperType) {
                if ($upperType === 'UH1') {
                    $q->where('name', 'like', 'UH1%')->orWhere('name', 'like', 'UH 1%')->orWhere('name', 'UH1');
                } else {
                    $q->where('name', 'like', 'UH2%')->orWhere('name', 'like', 'UH 2%')->orWhere('name', 'UH2');
                }
            })
            ->first();

        if (!$gradeWeight) return;

        $quizGroups = $session->quizScores->groupBy('student_id');
        $participationGroups = $session->participationScores->keyBy('student_id');

        $activeSubject = ActiveSubject::with('activeClass.classMembers')->find($activeSubjectId);
        if(!$activeSubject || !$activeSubject->activeClass) return;

        $studentIds = $activeSubject->activeClass->classMembers->pluck('student_id');

        foreach ($studentIds as $studentId) {
            $avgQuiz = 0;
            if ($quizGroups->has($studentId)) {
                $avgQuiz = $quizGroups[$studentId]->avg('score');
            }

            $partScore = 0;
            if ($participationGroups->has($studentId)) {
                $partScore = $participationGroups[$studentId]->score;
            }

            // If either quiz or participation is missing, the grade is incomplete.
            // Do not sync, and remove existing synchronized grade if any.
            if (!$quizGroups->has($studentId) || !$participationGroups->has($studentId)) {
                $existingGrade = StudentGrade::where([
                    'active_subject_id' => $activeSubjectId,
                    'student_id' => $studentId,
                    'grade_weight_id' => $gradeWeight->id,
                    'semester_id' => $activeSemester->id,
                ])->first();

                if ($existingGrade) {
                    $existingGrade->delete();
                }
                continue;
            }

            $finalScore = ($avgQuiz * 0.5) + ($partScore * 0.5);

            $existingGrade = StudentGrade::where([
                'active_subject_id' => $activeSubjectId,
                'student_id' => $studentId,
                'grade_weight_id' => $gradeWeight->id,
                'semester_id' => $activeSemester->id,
            ])->first();

            $newScore = round($finalScore, 2);

            if ($existingGrade) {
                if ((string)$existingGrade->score !== (string)$newScore) {
                    $oldScore = $existingGrade->score;
                    $existingGrade->update(['score' => $newScore]);

                    if($user) {
                        \App\Models\StudentGradeHistory::create([
                            'student_grade_id' => $existingGrade->id,
                            'old_score' => $oldScore,
                            'new_score' => $newScore,
                            'user_id' => $user->id,
                        ]);
                    }
                }
            } else {
                StudentGrade::create([
                    'active_subject_id' => $activeSubjectId,
                    'student_id' => $studentId,
                    'grade_weight_id' => $gradeWeight->id,
                    'semester_id' => $activeSemester->id,
                    'score' => $newScore,
                ]);
            }
        }
    }
}
