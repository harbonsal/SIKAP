<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\ActiveClass;
use App\Models\ActiveKamar;

class CompositionController extends Controller
{
    public function index(Request $request)
    {
        $activeAcademicYear = AcademicYear::where('is_active', true)->first();

        if (!$activeAcademicYear) {
            return redirect()->back()->with('error', 'Tahun ajaran aktif tidak ditemukan.');
        }

        $query = Student::query()
            ->with([
                'user', // Eager load user
                'classMembers' => function ($q) use ($activeAcademicYear) {
                    $q->whereHas('activeClass', function ($q2) use ($activeAcademicYear) {
                        $q2->where('academic_year_id', $activeAcademicYear->id);
                    })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
                },
                'kamarMembers' => function ($q) use ($activeAcademicYear) {
                    $q->whereHas('activeKamar', function ($q2) use ($activeAcademicYear) {
                        $q2->where('academic_year_id', $activeAcademicYear->id);
                    })->with(['activeKamar.kamar']);
                }
            ]);

        // Filter by Search (Name or NIS)
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q2) use ($search) {
                    $q2->where('name', 'like', '%' . $search . '%')
                        ->orWhere('nomor_induk', 'like', '%' . $search . '%');
                });
            });
        }

        // Filter by Status Aktif
        $query->whereHas('user', function ($q) {
            $q->where('status', 'Aktif');
        });

        // Filter by Class (Dropdown Value)
        if ($request->filled('kelas')) {
            // Check if filtering by exact ActiveClass ID or simplified name
            // Assuming the dropdown sends the ID of ActiveClass or similar unique identifier
            // For now, let's assume it sends the ActiveClass ID for precision
            $query->whereHas('classMembers', function ($q) use ($request) {
                $q->where('active_class_id', $request->kelas);
            });
        }

        // Filter by Dorm (Dropdown Value)
        if ($request->filled('asrama')) {
            $query->whereHas('kamarMembers', function ($q) use ($request) {
                $q->where('active_kamar_id', $request->asrama);
            });
        }

        $students = $query->paginate(20)->withQueryString();

        // Redirect if page is out of bounds (e.g. user was on page 28 but now only 18 pages exist)
        if ($request->page > $students->lastPage()) {
            return redirect()->route('search.composition.index', array_merge($request->query(), ['page' => 1]));
        }

        // Transform data for frontend
        $students->getCollection()->transform(function ($student) {
            $activeClassMember = $student->classMembers->first();
            $activeKamarMember = $student->kamarMembers->first();

            return [
                'id' => $student->id,
                'nis' => $student->user->nomor_induk ?? '-', // Use User's Nomor Induk
                'name' => $student->user->name ?? '-',
                'kelas' => $activeClassMember ? ($activeClassMember->activeClass->kelas->name ?? '') . ($activeClassMember->activeClass->kelas_paralel_id ? ' ' . ($activeClassMember->activeClass->kelasParalel->name ?? '') : '') : '-',
                'asrama' => $activeKamarMember ? $activeKamarMember->activeKamar->kamar->name : '-',
            ];
        });

        // Fetch Data for Dropdowns
        $activeClasses = ActiveClass::where('academic_year_id', $activeAcademicYear->id)
            ->with(['kelas', 'kelasParalel'])
            ->get()
            ->sortBy(function ($query) {
                return $query->kelas->level . $query->kelas->name . ($query->kelasParalel->name ?? '');
            })
            ->map(function ($ac) {
                return [
                    'id' => $ac->id, // Use ID for filtering
                    'name' => $ac->kelas->name . ($ac->kelasParalel ? ' ' . $ac->kelasParalel->name : ''),
                ];
            })
            ->values(); // Reset keys for JSON array

        $activeKamars = ActiveKamar::where('academic_year_id', $activeAcademicYear->id)
            ->with('kamar')
            ->get()
            ->sortBy('kamar.name')
            ->map(function ($ak) {
                return [
                    'id' => $ak->id,
                    'name' => $ak->kamar->name ?? 'Unknown',
                ];
            })
            ->values();

        return Inertia::render('Search/Composition/Index', [
            'students' => $students,
            'filters' => $request->only(['search', 'kelas', 'asrama']),
            'total_students' => $students->total(),
            'active_classes' => $activeClasses,
            'active_kamars' => $activeKamars,
        ]);
    }
}
