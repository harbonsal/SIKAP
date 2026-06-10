<?php

namespace App\Http\Controllers;

use App\Models\StudentQuestionnaire;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentQuestionnaireController extends Controller
{
    public function index()
    {
        $questions = StudentQuestionnaire::orderBy('order')->get();
        return Inertia::render('Settings/Education/Supervision/StudentQuestionnaire/Index', [
            'questions' => $questions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'order' => 'required|integer',
            'is_active' => 'boolean',
            'type' => 'required|in:boolean,rating,scale_1_3',
            'options' => 'nullable|array',
            'aspect' => 'nullable|in:A,B,C,D,E,F,G',
        ]);

        StudentQuestionnaire::create($request->all());

        return redirect()->back()->with('success', 'Pertanyaan berhasil ditambahkan.');
    }

    public function update(Request $request, StudentQuestionnaire $studentQuestionnaire)
    {
        $request->validate([
            'question' => 'required|string',
            'order' => 'required|integer',
            'is_active' => 'boolean',
            'type' => 'required|in:boolean,rating,scale_1_3',
            'options' => 'nullable|array',
            'aspect' => 'nullable|in:A,B,C,D,E',
        ]);

        $studentQuestionnaire->update($request->all());

        return redirect()->back()->with('success', 'Pertanyaan berhasil diperbarui.');
    }

    public function destroy(StudentQuestionnaire $studentQuestionnaire)
    {
        $studentQuestionnaire->delete();
        return redirect()->back()->with('success', 'Pertanyaan berhasil dihapus.');
    }
}
