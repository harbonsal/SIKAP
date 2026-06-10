<?php

namespace App\Http\Controllers;

use App\Models\TeachingMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeachingMethodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $methods = TeachingMethod::orderBy('id')->get();
        return Inertia::render('Settings/Education/TeachingMethods/Index', [
            'methods' => $methods
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Handled by modal in index
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        TeachingMethod::create($request->all());

        return back()->with('success', 'Metode Mengajar berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Handled by modal in index
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $method = TeachingMethod::findOrFail($id);
        $method->update($request->all());

        return back()->with('success', 'Metode Mengajar berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $method = TeachingMethod::findOrFail($id);
        $method->delete();

        return back()->with('success', 'Metode Mengajar berhasil dihapus.');
    }
}
