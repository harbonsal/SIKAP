<?php

namespace App\Http\Controllers;

use App\Models\Pekan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PekanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pekan::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $pekans = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Master/Pekan/Index', [
            'pekans' => $pekans,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        Pekan::create($validated);

        return redirect()->back()->with('success', 'Data pekan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Pekan $pekan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $pekan->update($validated);

        return redirect()->back()->with('success', 'Data pekan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pekan $pekan)
    {
        $pekan->delete();

        return redirect()->back()->with('success', 'Data pekan berhasil dihapus.');
    }
}
