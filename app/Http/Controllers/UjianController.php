<?php

namespace App\Http\Controllers;

use App\Models\Ujian;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UjianController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_ujians')->only(['index', 'show']);
        $this->middleware('permission:create_ujians')->only(['create', 'store']);
        $this->middleware('permission:edit_ujians')->only(['edit', 'update']);
        $this->middleware('permission:delete_ujians')->only(['destroy']);
    }

    public function index()
    {
        $ujians = Ujian::latest()->paginate(10);

        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $gradeWeights = [];

        if ($activeYear) {
            $gradeWeights = \App\Models\GradeWeight::where('academic_year_id', $activeYear->id)
                ->where('category', 'pengetahuan')
                ->get()
                ->pluck('weight', 'name');
        }

        $examSemesters = Ujian::pluck('semester', 'name');

        return Inertia::render('Master/Ujian/Index', [
            'ujians' => $ujians,
            'gradeWeights' => $gradeWeights,
            'examSemesters' => $examSemesters,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:ujians',
            'semester' => 'required|in:ganjil,genap,all',
        ]);

        Ujian::create($request->all());

        return redirect()->route('ujians.index')->with('success', 'Jenis Ujian berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ujian $ujian)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:ujians,name,' . $ujian->id,
            'semester' => 'required|in:ganjil,genap,all',
        ]);

        $originalName = $ujian->name;
        $ujian->update($request->all());

        if ($originalName !== $ujian->name) {
            $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
            if ($activeYear) {
                \App\Models\GradeWeight::where('academic_year_id', $activeYear->id)
                    ->where('category', 'pengetahuan')
                    ->where('name', $originalName)
                    ->update(['name' => $ujian->name]);
            }
        }

        return redirect()->route('ujians.index')->with('success', 'Jenis Ujian berhasil diperbarui.');
    }

    public function updateWeight(Request $request, Ujian $ujian)
    {
        $request->validate([
            'weight' => 'required|integer|min:0|max:100',
        ]);

        $activeYear = \App\Models\AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return back()->with('error', 'Tidak ada tahun ajaran aktif.');
        }

        \App\Models\GradeWeight::updateOrCreate(
            [
                'academic_year_id' => $activeYear->id,
                'category' => 'pengetahuan', // Hardcoded for now, or could make dynamic if needed
                'name' => $ujian->name,
            ],
            [
                'weight' => $request->weight,
                'semester' => $ujian->semester,
            ]
        );

        return back()->with('success', 'Bobot ujian berhasil disimpan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ujian $ujian)
    {
        $ujian->delete();
        // Optionally delete associated weight? 
        // Keeping it safer to just delete the master data.
        return redirect()->route('ujians.index')->with('success', 'Jenis Ujian berhasil dihapus.');
    }
}
