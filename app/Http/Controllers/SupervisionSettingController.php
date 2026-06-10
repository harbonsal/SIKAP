<?php

namespace App\Http\Controllers;

use App\Models\SupervisionCategory;
use App\Models\SupervisionQuestion;
use App\Models\SupervisionRubric;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SupervisionSettingController extends Controller
{
    // === CATEGORIES ===

    public function index()
    {
        $categories = SupervisionCategory::orderBy('min_score')->get();
        $questions = SupervisionQuestion::with('rubrics')->orderBy('number')->get();

        return Inertia::render('Settings/Education/Supervision/Settings/Index', [
            'categories' => $categories,
            'questions' => $questions,
        ]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_score' => 'required|integer|min:0',
            'max_score' => 'required|integer|gte:min_score',
            'color_class' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        SupervisionCategory::create($validated);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function updateCategory(Request $request, SupervisionCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_score' => 'required|integer|min:0',
            'max_score' => 'required|integer|gte:min_score',
            'color_class' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroyCategory(SupervisionCategory $category)
    {
        $category->delete();
        return redirect()->back()->with('success', 'Kategori berhasil dihapus.');
    }

    // === QUESTIONS & RUBRICS ===

    public function storeQuestion(Request $request)
    {
        $validated = $request->validate([
            'number' => 'required|integer|unique:supervision_questions,number',
            'category' => 'required|string',
            'aspect' => 'required|string',
        ]);

        $question = SupervisionQuestion::create($validated);

        // Create default rubrics structure if needed, or let user add them
        // For now, let's just create empty placeholder rubrics if specifically requested, 
        // but typically we want dynamic rubrics. 
        // Based on existing logic, we usually have score 3, 2, 1.

        return redirect()->back()->with('success', 'Pertanyaan berhasil ditambahkan.');
    }

    public function updateQuestion(Request $request, SupervisionQuestion $question)
    {
        $validated = $request->validate([
            'number' => 'required|integer|unique:supervision_questions,number,' . $question->id,
            'category' => 'required|string',
            'aspect' => 'required|string',
            'rubrics' => 'array', // Optional: update rubrics directly
        ]);

        DB::transaction(function () use ($question, $validated) {
            $question->update([
                'number' => $validated['number'],
                'category' => $validated['category'],
                'aspect' => $validated['aspect'],
            ]);

            if (isset($validated['rubrics'])) {
                // Sync Rubrics logic could go here if we send full payload
                // But for simplicity, we might handle rubrics separately or nested.
                // Let's assume separate endpoints for rubrics or nested handling:

                // Remove rubrics not in list ?? checking IDs
                // Strategy: simple update loop
                foreach ($validated['rubrics'] as $rubricData) {
                    if (isset($rubricData['id'])) {
                        SupervisionRubric::where('id', $rubricData['id'])
                            ->where('supervision_question_id', $question->id)
                            ->update([
                                'description' => $rubricData['description'],
                                'score' => $rubricData['score']
                            ]);
                    } else {
                        $question->rubrics()->create([
                            'description' => $rubricData['description'],
                            'score' => $rubricData['score']
                        ]);
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'Pertanyaan berhasil diperbarui.');
    }

    public function destroyQuestion(SupervisionQuestion $question)
    {
        $question->rubrics()->delete();
        $question->delete();
        return redirect()->back()->with('success', 'Pertanyaan berhasil dihapus.');
    }

    // === RUBRICS (Granular CRUD) ===

    public function storeRubric(Request $request, SupervisionQuestion $question)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'score' => 'required|integer|in:1,2,3', // Assuming scale 1-3
        ]);

        $question->rubrics()->create($validated);
        return redirect()->back()->with('success', 'Rubrik berhasil ditambahkan.');
    }

    public function updateRubric(Request $request, SupervisionRubric $rubric)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'score' => 'required|integer|in:1,2,3',
        ]);

        $rubric->update($validated);
        return redirect()->back()->with('success', 'Rubirik berhasil diperbarui.');
    }

    public function storeRubricRow(Request $request, SupervisionQuestion $question)
    {
        $validated = $request->validate([
            'score_3' => 'required|string',
            'score_2' => 'required|string',
            'score_1' => 'required|string',
        ]);

        DB::transaction(function () use ($question, $validated) {
            $question->rubrics()->create(['score' => 3, 'description' => $validated['score_3']]);
            $question->rubrics()->create(['score' => 2, 'description' => $validated['score_2']]);
            $question->rubrics()->create(['score' => 1, 'description' => $validated['score_1']]);
        });

        return redirect()->back()->with('success', 'Baris checklist berhasil ditambahkan.');
    }

    public function destroyRubricRow(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:supervision_rubrics,id',
        ]);

        SupervisionRubric::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', 'Baris checklist berhasil dihapus.');
    }

    public function destroyRubric(SupervisionRubric $rubric)
    {
        $rubric->delete();
        return redirect()->back()->with('success', 'Rubrik berhasil dihapus.');
    }
}
