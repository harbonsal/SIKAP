<?php

namespace App\Http\Controllers;

use App\Models\Supervision;
use App\Models\StudentQuestionnaire;
use App\Models\StudentQuestionnaireResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StudentSupervisionController extends Controller
{
    // List open questionnaires for the logged-in student
    // A student sees a supervision if:
    // 1. Coverage: They are in the class being supervised (ActiveSubject -> ActiveClass -> ClassMember -> Student)
    // 2. Status: is_student_questionnaire_open is true
    // 3. Not submitted: They haven't filled it yet (Optional, or show status)
    public function index()
    {
        $user = auth()->user();
        $student = \App\Models\Student::where('user_id', $user->id)->first();

        if (!$student) {
            abort(403, 'Anda tidak terdaftar sebagai santri.');
        }

        // Find classes the student is a member of for the current academic year?
        // Or just find any supervision where the student is in the active subject's class.

        $supervisions = Supervision::where('is_student_questionnaire_open', true)
            ->whereHas('activeSubject.activeClass.classMembers', function ($q) use ($student) {
                $q->where('student_id', $student->id);
            })
            ->with(['teacher', 'activeSubject.mapel', 'activeSubject.activeClass.kelas', 'activeSubject.activeClass.kelasParalel'])
            ->get();

        // Check which ones are already filled
        $filledSupervisionIds = StudentQuestionnaireResponse::where('student_id', $student->id)
            ->whereIn('supervision_id', $supervisions->pluck('id'))
            ->pluck('supervision_id')
            ->unique();

        $supervisions->transform(function ($s) use ($filledSupervisionIds) {
            $s->is_filled = $filledSupervisionIds->contains($s->id);
            return $s;
        });

        return Inertia::render('Student/Supervision/Index', [
            'supervisions' => $supervisions
        ]);
    }

    // Show form
    public function show(Supervision $supervision)
    {
        $user = auth()->user();
        $student = \App\Models\Student::where('user_id', $user->id)->first();

        if (!$student) {
            abort(403, 'Anda tidak terdaftar sebagai santri.');
        }

        // Security check: Is student in the class?
        $isInClass = $supervision->activeSubject->activeClass->classMembers()
            ->where('student_id', $student->id)
            ->exists();

        if (!$isInClass) {
            abort(403, 'Anda tidak terdaftar di kelas pertemuan ini.');
        }

        if (!$supervision->is_student_questionnaire_open) {
            return redirect()->route('student.supervisions.index')->with('error', 'Angket untuk supervisi ini suda ditutup.');
        }

        // Check if already filled
        $existingResponse = StudentQuestionnaireResponse::where('supervision_id', $supervision->id)
            ->where('student_id', $student->id)
            ->exists();

        if ($existingResponse) {
            return redirect()->route('student.supervisions.index')->with('warning', 'Anda sudah mengisi angket ini sebelumnya.');
        }

        $questions = StudentQuestionnaire::where('is_active', true)->orderBy('order')->get();

        return Inertia::render('Student/Supervision/Show', [
            'supervision' => $supervision->load(['teacher', 'activeSubject.mapel']),
            'questions' => $questions
        ]);
    }

    public function store(Request $request, Supervision $supervision)
    {
        $user = auth()->user();
        $student = \App\Models\Student::where('user_id', $user->id)->firstOrFail();

        // Security check (Double check)
        $isInClass = $supervision->activeSubject->activeClass->classMembers()
            ->where('student_id', $student->id)
            ->exists();

        if (!$isInClass) {
            abort(403, 'Unauthorized');
        }

        // Validate dynamically based on question type
        $questions = StudentQuestionnaire::where('is_active', true)->get();
        $rules = [];
        $hasAnswer = false;

        foreach ($questions as $q) {
            $answer = $request->input("answers.{$q->id}");
            if ($answer !== null && $answer !== '') {
                $hasAnswer = true;
                if ($q->type === 'rating') {
                    $rules["answers.{$q->id}"] = 'in:1,2,3,4';
                } elseif ($q->type === 'scale_1_3') {
                    $rules["answers.{$q->id}"] = 'in:1,2,3';
                } else {
                    $rules["answers.{$q->id}"] = 'in:Ya,Tidak';
                }
            } else {
                $rules["answers.{$q->id}"] = 'nullable';
            }
        }

        if (!$hasAnswer) {
            return redirect()->back()->with('error', 'Mohon isi setidaknya salah satu bagian angket.');
        }

        $request->validate($rules);

        // Transaction save
        DB::transaction(function () use ($request, $supervision, $student, $questions) {
            foreach ($questions as $q) {
                $answer = $request->input("answers.{$q->id}");
                if ($answer !== null && $answer !== '') {
                    StudentQuestionnaireResponse::create([
                        'supervision_id' => $supervision->id,
                        'student_id' => $student->id,
                        'question_id' => $q->id,
                        'answer' => $answer,
                    ]);
                }
            }
        });

        return redirect()->route('student.supervisions.index')->with('success', 'Terima kasih, angket Anda berhasil dikirim.');
    }
}
