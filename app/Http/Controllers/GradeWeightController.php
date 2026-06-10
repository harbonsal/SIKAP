<?php

namespace App\Http\Controllers;

use App\Models\GradeWeight;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradeWeightController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_grade_weights')->only(['index']);
        $this->middleware('permission:create_grade_weights')->only(['store']);
        $this->middleware('permission:edit_grade_weights')->only(['update']);
        $this->middleware('permission:delete_grade_weights')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        // Filter by Academic Year (Default to Active)
        $selectedYearId = $request->academic_year_id ?? $activeYearId;

        $weights = GradeWeight::where('academic_year_id', $selectedYearId)
            ->get()
            ->groupBy('category');

        return Inertia::render('Settings/Education/GradeWeight/Index', [
            'weights' => $weights,
            'academicYears' => AcademicYear::orderBy('name', 'desc')->get(),
            'selectedYearId' => $selectedYearId,
            'activeYearId' => $activeYearId,
            'activeSemester' => \App\Models\Semester::where('is_active', true)->value('name') ?? 'Ganjil',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'category' => 'required|in:pengetahuan,keterampilan',
            'name' => 'required|string|max:255',
            'weight' => 'required|integer|min:1|max:100',
        ]);

        // Check for duplicate name in same category/year
        $exists = GradeWeight::where('academic_year_id', $request->academic_year_id)
            ->where('category', $request->category)
            ->where('name', $request->name)
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'Nama bobot sudah ada di kategori ini.']);
        }

        GradeWeight::create($request->all());

        return redirect()->back()->with('success', 'Bobot nilai berhasil ditambahkan.');
    }

    public function update(Request $request, GradeWeight $gradeWeight)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'weight' => 'required|integer|min:1|max:100',
            'semester' => 'required|in:Ganjil,Genap,All,Semua,all,semua',
        ]);

        $gradeWeight->update([
            'name' => $request->name,
            'weight' => $request->weight,
            'semester' => $request->semester,
        ]);

        return redirect()->back()->with('success', 'Bobot nilai berhasil diperbarui.');
    }

    public function destroy(GradeWeight $gradeWeight)
    {
        $gradeWeight->delete();
        return redirect()->back()->with('success', 'Bobot nilai berhasil dihapus.');
    }
}
