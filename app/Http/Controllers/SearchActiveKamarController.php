<?php

namespace App\Http\Controllers;

use App\Models\ActiveKamar;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchActiveKamarController extends Controller
{
    /**
     * Display a listing of the resource for searching/viewing only.
     */
    public function index(Request $request)
    {
        $activeAcademicYear = AcademicYear::where('is_active', true)->first();

        if (!$activeAcademicYear) {
            return redirect()->route('dashboard')->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        $query = ActiveKamar::with(['kamar', 'musrif', 'members'])
            ->where('academic_year_id', $activeAcademicYear->id);

        if ($request->has('search')) {
            $query->whereHas('kamar', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('building', 'like', '%' . $request->search . '%');
            });
        }

        // Get all data without pagination
        $activeKamars = $query->latest()->get();

        // Calculate total members
        $totalMembers = 0;
        foreach ($activeKamars as $kamar) {
            $totalMembers += $kamar->members->count();
        }

        return Inertia::render('Search/ActiveKamar/Index', [
            'activeKamars' => $activeKamars,
            'totalMembers' => $totalMembers,
            'academicYear' => $activeAcademicYear,
            'filters' => $request->only(['search']),
        ]);
    }
}
