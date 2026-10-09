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
        // CLEAR CACHE TEMPORARILY TO FIX C-PANEL ISSUE
        try {
            \Illuminate\Support\Facades\Artisan::call('route:clear');
            \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        } catch (\Exception $e) {}

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
                    ->orWhere('nomor_induk', 'like', '%' . $request->search . '%');
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
     * Store multiple resources in storage based on NIS list.
     */
    public function bulkStore(Request $request)
    {
        if (!$request->user()?->hasRole('Administrator')) {
            abort(403, 'Anda tidak memiliki hak untuk menambah anggota kamar.');
        }

        $validated = $request->validate([
            'active_kamar_id' => 'required|exists:active_kamars,id',
            'nis_list' => 'required|string',
        ]);

        $activeKamar = ActiveKamar::findOrFail($validated['active_kamar_id']);

        // Parse NIS list (split by newline, comma, or space)
        $rawNisList = preg_split('/[\s,]+/', $validated['nis_list']);
        $nisList = array_filter(array_map('trim', $rawNisList));

        $addedCount = 0;
        $failedNis = [];
        $alreadyInKamarNis = [];

        foreach ($nisList as $nis) {
            $student = Student::whereHas('user', function($q) use ($nis) {
                $q->where('nomor_induk', $nis);
            })->first();

            if (!$student) {
                $failedNis[] = $nis;
                continue;
            }

            $exists = KamarMember::where('student_id', $student->id)
                ->whereHas('activeKamar', function ($q) use ($activeKamar) {
                    $q->where('academic_year_id', $activeKamar->academic_year_id);
                })->exists();

            if ($exists) {
                $alreadyInKamarNis[] = $nis;
                continue;
            }

            KamarMember::create([
                'active_kamar_id' => $activeKamar->id,
                'student_id' => $student->id,
            ]);

            $addedCount++;
        }

        $messages = [];
        if ($addedCount > 0) {
            $messages[] = "Berhasil menambahkan $addedCount santri.";
        }
        if (!empty($failedNis)) {
            $messages[] = "Gagal (NIS tidak ditemukan): " . implode(', ', $failedNis);
        }
        if (!empty($alreadyInKamarNis)) {
            $messages[] = "Gagal (Sudah ada di kamar lain): " . implode(', ', $alreadyInKamarNis);
        }

        $finalMessage = implode(' | ', $messages);

        return redirect()->back()->with('success', $finalMessage);
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

    /**
     * Remove multiple resources from storage.
     */
    public function bulkDestroy(Request $request)
    {
        if (!$request->user()?->hasRole('Administrator')) {
            abort(403, 'Anda tidak memiliki hak untuk menghapus anggota kamar.');
        }

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:kamar_members,id',
        ]);

        KamarMember::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', count($validated['ids']) . ' santri berhasil dikeluarkan dari kamar.');
    }
}
