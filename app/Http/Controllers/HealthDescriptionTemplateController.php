<?php

namespace App\Http\Controllers;

use App\Models\HealthDescriptionTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HealthDescriptionTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = HealthDescriptionTemplate::query();

        if ($request->has('search')) {
            $query->where('message', 'like', '%' . $request->search . '%');
        }

        $templates = $query->orderBy('message')->paginate(10)->withQueryString();

        return Inertia::render('Care/Health/Description/Index', [
            'templates' => $templates,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        HealthDescriptionTemplate::create($request->all());

        return redirect()->back()->with('success', 'Template keterangan berhasil ditambahkan.');
    }

    public function update(Request $request, HealthDescriptionTemplate $description_template)
    {
        $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $description_template->update($request->all());

        return redirect()->back()->with('success', 'Template berhasil diperbarui.');
    }

    public function destroy(HealthDescriptionTemplate $description_template)
    {
        $description_template->delete();

        return redirect()->back()->with('success', 'Template berhasil dihapus.');
    }
}
