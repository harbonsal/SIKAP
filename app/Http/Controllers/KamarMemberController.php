<?php

namespace App\Http\Controllers;

use App\Models\ActiveKamar;
use App\Models\KamarMember;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KamarMemberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $activeKamarId = $request->query('active_kamar');

        if (!$activeKamarId) {
            return redirect()->route('active-kamars.index');
        }

        $activeKamar = ActiveKamar::with(['kamar', 'musrif', 'academicYear'])->findOrFail($activeKamarId);

        $query = KamarMember::with(['student.classMembers.activeClass.kelas', 'student.classMembers.activeClass.kelasParalel'])
            ->where('active_kamar_id', $activeKamarId);

        if ($request->has('search')) {
            $query->whereHas('student', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('nis', 'like', '%' . $request->search . '%');
            });
        }

        $members = $query->latest()->paginate(20)->withQueryString();

        $occupiedStudentIds = KamarMember::whereHas('activeKamar', function ($q) use ($activeKamar) {
            $q->where('academic_year_id', $activeKamar->academic_year_id);
        })->pluck('student_id');

        $availableStudents = Student::whereNotIn('id', $occupiedStudentIds)
            ->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->limit(50)
            ->get();

        return Inertia::render('Settings/KamarMember/Index', [
            'activeKamar' => $activeKamar,
            'members' => $members,
            'availableStudents' => $availableStudents,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!$request->user()?->hasRole('Administrator')) {
            abort(403, 'Anda tidak memiliki hak untuk menambah anggota kamar.');
        }

        $validated = $request->validate([
            'active_kamar_id' => 'required|exists:active_kamars,id',
            'student_id' => 'required|exists:students,id',
        ]);

        $activeKamar = ActiveKamar::findOrFail($validated['active_kamar_id']);
        $exists = KamarMember::where('student_id', $validated['student_id'])
            ->whereHas('activeKamar', function ($q) use ($activeKamar) {
                $q->where('academic_year_id', $activeKamar->academic_year_id);
            })->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'Santri sudah terdaftar di kamar lain pada tahun ajaran ini.');
        }

        KamarMember::create($validated);

        return redirect()->back()->with('success', 'Santri berhasil ditambahkan ke kamar.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(KamarMember $kamarMember)
    {
        if (!request()->user()?->hasRole('Administrator')) {
            abort(403, 'Anda tidak memiliki hak untuk menghapus anggota kamar.');
        }

        $kamarMember->delete();

        return redirect()->back()->with('success', 'Santri dikeluarkan dari kamar.');
    }
}
