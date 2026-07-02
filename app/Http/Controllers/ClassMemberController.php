<?php

namespace App\Http\Controllers;

use App\Models\ClassMember;
use App\Models\ActiveClass;
use App\Models\Student;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ClassMemberController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_class_members')->only(['index', 'show']);
        $this->middleware('permission:create_class_members')->only(['store']);
        $this->middleware('permission:delete_class_members')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        $query = ActiveClass::join('kelas', 'active_classes.kelas_id', '=', 'kelas.id')
            ->join('jenjangs', 'kelas.jenjang_id', '=', 'jenjangs.id')
            ->with(['kelas', 'kelasParalel', 'teacher'])
            ->select('active_classes.*') // Select active_classes main columns
            ->withCount('classMembers');

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kelas.name', 'like', '%' . $request->search . '%')
                    ->orWhere('active_classes.name', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by Academic Year (Default to Active)
        if ($request->has('academic_year_id')) {
            $query->where('active_classes.academic_year_id', $request->academic_year_id);
        } elseif ($activeYearId) {
            $query->where('active_classes.academic_year_id', $activeYearId);
        }

        $activeClasses = $query->orderBy('jenjangs.name')
            ->orderBy('kelas.name')
            ->get();

        $totalStudents = $activeClasses->sum('class_members_count');

        return Inertia::render('Settings/Education/ClassMember/Index', [
            'activeClasses' => $activeClasses,
            'totalStudents' => $totalStudents,
            'activeYearId' => $activeYearId,
            'filters' => $request->only(['search', 'academic_year_id']),
        ]);
    }

    public function show(ActiveClass $classMember) // Route param is 'class_member' but it's actually ActiveClass ID
    {
        // We use 'show' to display the members of a specific class
        $activeClass = $classMember->load(['academicYear', 'kelas', 'kelasParalel', 'teacher']);

        $members = ClassMember::where('active_class_id', $activeClass->id)
            ->with(['student.user', 'student.kamarMembers' => function ($q) use ($activeClass) {
                $q->whereHas('activeKamar', function ($qk) use ($activeClass) {
                    $qk->where('academic_year_id', $activeClass->academic_year_id);
                })->with('activeKamar.kamar');
            }])
            ->get()
            ->sortBy(function ($member) {
                return $member->student?->user?->name ?? '';
            })
            ->values();

        $members->each(function ($member) {
            if ($member->student) {
                $member->student->makeHidden(['kelas', 'kamar']);
            }
        });

        // Get students NOT in any class for this academic year
        $activeYearId = $activeClass->academic_year_id;

        $assignedStudentIds = ClassMember::whereHas('activeClass', function ($q) use ($activeYearId) {
            $q->where('academic_year_id', $activeYearId);
        })->pluck('student_id');

        $availableStudents = Student::with('user')
            ->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->whereNotIn('id', $assignedStudentIds->toArray())
            ->get()
            ->sortBy(function ($student) {
                return $student->user?->name ?? '';
            })
            ->values();

        $availableStudents->each->makeHidden(['kelas', 'kamar']);

        $allActiveClasses = ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeYearId)
            ->where('id', '!=', $activeClass->id)
            ->get()
            ->sortBy(function($c) { return $c->kelas->name . ' ' . ($c->kelasParalel->name ?? ''); })
            ->values();

        return Inertia::render('Settings/Education/ClassMember/Show', [
            'activeClass' => $activeClass,
            'members' => $members,
            'availableStudents' => $availableStudents,
            'allActiveClasses' => $allActiveClasses,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $activeClass = ActiveClass::findOrFail($request->active_class_id);
        $count = 0;

        foreach ($request->student_ids as $studentId) {
            // Check if student is already in THIS class (handled by unique constraint, but good to check)
            // Check if student is already in ANOTHER class for this academic year?
            // Ideally yes, but for now let's just add them. The UI filters available students.

            ClassMember::firstOrCreate([
                'active_class_id' => $activeClass->id,
                'student_id' => $studentId,
            ]);
            $count++;
        }

        return redirect()->back()->with('success', "$count siswa berhasil ditambahkan ke kelas.");
    }

    public function destroy(ClassMember $classMember)
    {
        $classMember->delete();
        return redirect()->back()->with('success', 'Siswa berhasil dikeluarkan dari kelas.');
    }

    public function move(Request $request, ClassMember $classMember)
    {
        $request->validate([
            'target_class_id' => 'required|exists:active_classes,id'
        ]);

        $classMember->update([
            'active_class_id' => $request->target_class_id
        ]);

        return redirect()->back()->with('success', 'Siswa berhasil dipindahkan ke kelas baru.');
    }
}
