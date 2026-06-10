<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\AcademicYear;
use App\Models\Kelas;
use App\Models\KelasParalel;
use App\Models\UserLevel;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActiveClassController extends Controller
{
    public function __construct()
    {
        // Allow index to be accessed if filtering by my_classes (checked in method)
        $this->middleware('permission:view_active_classes')->only(['show']);
        $this->middleware('permission:create_active_classes')->only(['create', 'store']);
        $this->middleware('permission:edit_active_classes')->only(['edit', 'update']);
        $this->middleware('permission:delete_active_classes')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Manual Permission Check
        if (!$request->has('my_classes') && !$request->user()->can('view_active_classes')) {
            abort(403, 'User does not have the right permissions.');
        }

        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        $query = ActiveClass::with(['kelas', 'kelasParalel', 'teacher', 'academicYear'])
            ->withCount('classMembers');

        if ($request->has('search')) {
            $query->whereHas('kelas', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            })->orWhere('name', 'like', '%' . $request->search . '%');
        }

        // Filter by Academic Year (Default to Active)
        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        } elseif ($activeYearId) {
            $query->where('academic_year_id', $activeYearId);
        }

        // Filter by My Classes (Teacher)
        if ($request->has('my_classes') && $request->user()->hasRole('Guru')) {
            $userId = $request->user()->id;
            $query->where(function ($q) use ($userId) {
                $q->where('teacher_id', $userId) // Homeroom
                    ->orWhereHas('activeSubjects', function ($subQ) use ($userId) {
                        $subQ->where('teacher_id', $userId); // Subject Teacher
                    });
            });
        }

        $activeClasses = $query->join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->leftJoin('kelas_paralels', 'active_classes.kelas_paralel_id', '=', 'kelas_paralels.id')
            ->join('jenjangs', 'kelas.jenjang_id', '=', 'jenjangs.id')
            ->select('active_classes.*') // Ensure we only get active_classes fields
            ->orderBy('jenjangs.name', 'asc')
            ->orderBy('kelas.name', 'asc')
            ->orderBy('kelas_paralels.name', 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Settings/Education/ActiveClass/Index', [
            'activeClasses' => $activeClasses,
            'academicYears' => AcademicYear::orderBy('name', 'desc')->get(),
            'activeYearId' => $activeYearId,
            'filters' => $request->only(['search', 'academic_year_id']),
        ]);
    }

    public function create()
    {
        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        return Inertia::render('Settings/Education/ActiveClass/Create', [
            'academicYears' => AcademicYear::latest()->get(),
            'kelas' => Kelas::all(),
            'kelasParalels' => KelasParalel::all(),

            'teachers' => User::whereHas('userLevel', function ($q) {
                $q->whereNotIn('name', ['Siswa', 'Santri']);
            })->orderBy('name', 'asc')->get(),
            'defaultAcademicYearId' => $activeYearId,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'kelas_id' => 'required|exists:kelas,id',
            'kelas_paralel_id' => 'nullable|exists:kelas_paralels,id',
            'teacher_id' => 'nullable|exists:users,id',
            'name' => 'nullable|string|max:255',
            'total_hours_per_week' => 'required|integer|min:0',
        ]);

        // Check for duplicate
        $exists = ActiveClass::where('academic_year_id', $request->academic_year_id)
            ->where('kelas_id', $request->kelas_id)
            ->where('kelas_paralel_id', $request->kelas_paralel_id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['kelas_id' => 'Kelas ini sudah ada di tahun pelajaran tersebut.']);
        }

        ActiveClass::create($request->all());

        if ($request->boolean('from_workspace')) {
            return redirect()->back()->with('success', 'Kelas Aktif berhasil ditambahkan.');
        }

        return redirect()->route('active-classes.index')->with('success', 'Kelas Aktif berhasil ditambahkan.');
    }

    public function edit(ActiveClass $activeClass)
    {
        return Inertia::render('Settings/Education/ActiveClass/Edit', [
            'activeClass' => $activeClass,
            'academicYears' => AcademicYear::latest()->get(),
            'kelas' => Kelas::all(),
            'kelasParalels' => KelasParalel::all(),

            'teachers' => User::whereHas('userLevel', function ($q) {
                $q->whereNotIn('name', ['Siswa', 'Santri']);
            })->orderBy('name', 'asc')->get(),
        ]);
    }

    public function update(Request $request, ActiveClass $activeClass)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'kelas_id' => 'required|exists:kelas,id',
            'kelas_paralel_id' => 'nullable|exists:kelas_paralels,id',
            'teacher_id' => 'nullable|exists:users,id',
            'name' => 'nullable|string|max:255',
            'total_hours_per_week' => 'required|integer|min:0',
        ]);

        // Check for duplicate (excluding current)
        $exists = ActiveClass::where('academic_year_id', $request->academic_year_id)
            ->where('kelas_id', $request->kelas_id)
            ->where('kelas_paralel_id', $request->kelas_paralel_id)
            ->where('id', '!=', $activeClass->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['kelas_id' => 'Kelas ini sudah ada di tahun pelajaran tersebut.']);
        }

        $activeClass->update($request->all());

        if ($request->boolean('from_workspace')) {
            return redirect()->back()->with('success', 'Kelas Aktif berhasil diperbarui.');
        }

        return redirect()->route('active-classes.index', $request->query())->with('success', 'Kelas Aktif berhasil diperbarui.');
    }

    public function destroy(ActiveClass $activeClass)
    {
        $activeClass->delete();
        return back()->with('success', 'Kelas Aktif berhasil dihapus.');
    }
}
