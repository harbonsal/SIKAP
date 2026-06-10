<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicYear::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $academicYears = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Master/AcademicYears/Index', [
            'academicYears' => $academicYears,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Master/AcademicYears/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'unique:academic_years,name', 'regex:/^\d{4}\/\d{4}$/'],
            'is_active' => 'boolean',
            'status' => 'required|in:draft,active,archived',
        ], [
            'name.regex' => 'Format Tahun Pelajaran harus YYYY/YYYY (contoh: 2024/2025)',
        ]);

        $data = $request->all();

        // Sync status and is_active:
        // 1. If status is active, is_active must be true
        if ($request->status === 'active') {
            $data['is_active'] = true;
        }
        // 2. If is_active is checked, status must be active
        if ($request->boolean('is_active')) {
            $data['is_active'] = true;
            $data['status'] = 'active';
        }
        // 3. If status is draft or archived, is_active must be false (unless explicitly set active)
        if (in_array($request->status, ['draft', 'archived']) && !$request->boolean('is_active')) {
            $data['is_active'] = false;
        }

        if ($data['is_active']) {
            // Deactivate all others if this one is active
            AcademicYear::query()->update(['is_active' => false]);
        }

        $academicYear = AcademicYear::create($data);

        return redirect()->route('academic-years.index')
            ->with('success', 'Tahun Pelajaran berhasil ditambahkan.');
    }

    public function edit(AcademicYear $academicYear)
    {
        return Inertia::render('Master/AcademicYears/Edit', [
            'academicYear' => $academicYear,
        ]);
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $request->validate([
            'name' => ['required', 'string', 'unique:academic_years,name,' . $academicYear->id, 'regex:/^\d{4}\/\d{4}$/'],
            'is_active' => 'boolean',
            'status' => 'required|in:draft,active,archived',
        ], [
            'name.regex' => 'Format Tahun Pelajaran harus YYYY/YYYY (contoh: 2024/2025)',
        ]);

        $data = $request->all();

        // Sync status and is_active:
        // 1. If status is active, is_active must be true
        if ($request->status === 'active') {
            $data['is_active'] = true;
        }
        // 2. If is_active is checked, status must be active
        if ($request->boolean('is_active')) {
            $data['is_active'] = true;
            $data['status'] = 'active';
        }
        // 3. If status is draft or archived, is_active must be false (unless explicitly set active)
        if (in_array($request->status, ['draft', 'archived']) && !$request->boolean('is_active')) {
            $data['is_active'] = false;
        }

        // Check if trying to activate a draft year without data
        if ($data['is_active']) {
            $hasClasses = \App\Models\ActiveClass::where('academic_year_id', $academicYear->id)->exists();
            if (!$hasClasses) {
                return back()->with('error', 'Tidak dapat mengaktifkan tahun pelajaran yang belum memiliki data kelas. Silakan salin data dari tahun sebelumnya terlebih dahulu.');
            }
        }

        if ($data['is_active']) {
            AcademicYear::query()->where('id', '!=', $academicYear->id)->update(['is_active' => false]);
        }

        $academicYear->update($data);

        return redirect()->route('academic-years.index')
            ->with('success', 'Tahun Pelajaran berhasil diperbarui.');
    }

    public function destroy(AcademicYear $academicYear)
    {
        if ($academicYear->is_active) {
            return back()->with('error', 'Tidak dapat menghapus Tahun Pelajaran yang sedang aktif.');
        }

        $academicYear->delete();

        return redirect()->route('academic-years.index')
            ->with('success', 'Tahun Pelajaran berhasil dihapus.');
    }

    public function unified(Request $request)
    {
        $search = $request->query('search');

        $academicYears = AcademicYear::when($search, function ($query, $search) {
            return $query->where('name', 'like', "%{$search}%");
        })
        ->orderBy('name', 'desc')
        ->paginate(10);

        $semesters = \App\Models\Semester::orderBy('id')->get();
        $activeAcademicYearId = AcademicYear::where('is_active', true)->value('id');
        $activeSemesterId = \App\Models\Semester::where('is_active', true)->value('id');

        // Get schedule data for preparation tab
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear()
            ?? AcademicYear::where('is_active', true)->first();
        $systemYear = \App\Services\AcademicStateService::activeAcademicYear();

        $scheduleData = [
            'preparationSourceYears' => AcademicYear::where('id', '!=', $activeYear?->id)
                ->orderBy('name', 'desc')
                ->get(['id', 'name', 'is_active']),
        ];

        return Inertia::render('Settings/Academic/Unified', [
            'academicYears' => $academicYears,
            'allAcademicYears' => AcademicYear::orderBy('name', 'desc')->get(),
            'semesters' => $semesters,
            'activeAcademicYearId' => $activeAcademicYearId,
            'activeSemesterId' => $activeSemesterId,
            'scheduleData' => $scheduleData,
            'filters' => ['search' => $search],
        ]);
    }
}
