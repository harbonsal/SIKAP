<?php

namespace App\Http\Controllers;

use App\Models\CharacterCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CharacterCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = CharacterCategory::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->type) {
            $query->where('type', $request->type);
        } else {
            // Default show rubrics if no specific filter? Or both?
            // User focus is on 'Komentar' mostly, but dimensions are there too.
            // Let's show all but order by type then name.
        }

        $categories = $query->orderBy('type')->orderBy('name')->paginate(10)->withQueryString();

        return Inertia::render('Master/CharacterCategory/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:character_categories,name',
            'type' => 'required|in:dimension,rubric',
            'description' => 'nullable|string',
            'min_score' => 'nullable|integer|min:0|max:100',
            'max_score' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        CharacterCategory::create($validated);

        return redirect()->back()->with('success', 'Kategori akhlak berhasil ditambahkan.');
    }

    public function update(Request $request, CharacterCategory $characterCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:character_categories,name,' . $characterCategory->id,
            'type' => 'required|in:dimension,rubric',
            'description' => 'nullable|string',
            'min_score' => 'nullable|integer|min:0|max:100',
            'max_score' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $characterCategory->update($validated);

        return redirect()->back()->with('success', 'Kategori akhlak berhasil diperbarui.');
    }

    public function destroy(CharacterCategory $characterCategory)
    {
        // Add check if used in assessments? For now, soft delete or restrict might be better, 
        // but current requirement is just Master CRUD. 
        // Deleting a category won't delete existing assessment RECORDS because we stored category NAME as string.
        // So deleting is relatively safe, but will just stop new entries for that category.
        $characterCategory->delete();

        return redirect()->back()->with('success', 'Kategori akhlak berhasil dihapus.');
    }
}
