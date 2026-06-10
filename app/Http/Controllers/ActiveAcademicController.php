<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActiveAcademicController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Academic/Index', [
            'academicYears' => AcademicYear::orderBy('name', 'desc')->get(),
            'semesters' => Semester::all(),
            'activeAcademicYearId' => AcademicYear::where('is_active', true)->value('id'),
            'activeSemesterId' => Semester::where('is_active', true)->value('id'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        // Update Academic Year
        AcademicYear::query()->update(['is_active' => false]);
        AcademicYear::where('id', $request->academic_year_id)->update(['is_active' => true, 'status' => 'active']);

        // Update Semester
        Semester::query()->update(['is_active' => false]);
        Semester::where('id', $request->semester_id)->update(['is_active' => true]);

        return redirect()->back()->with('success', 'Pengaturan akademik berhasil diperbarui.');
    }
}
