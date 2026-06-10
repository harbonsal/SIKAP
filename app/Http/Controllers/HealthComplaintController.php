<?php

namespace App\Http\Controllers;

use App\Models\HealthComplaint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HealthComplaintController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = HealthComplaint::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $complaints = $query->orderBy('name')->paginate(10)->withQueryString();

        return Inertia::render('Care/Health/Complaint/Index', [
            'complaints' => $complaints,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:health_complaints',
        ]);

        HealthComplaint::create($request->all());

        return redirect()->back()->with('success', 'Data keluhan berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, HealthComplaint $health_complaint)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:health_complaints,name,' . $health_complaint->id,
        ]);

        $health_complaint->update($request->all());

        return redirect()->back()->with('success', 'Data keluhan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(HealthComplaint $health_complaint)
    {
        $health_complaint->delete();

        return redirect()->back()->with('success', 'Data keluhan berhasil dihapus.');
    }
}
