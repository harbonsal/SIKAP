<?php

namespace App\Http\Controllers;

use App\Models\Kamar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KamarController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Kamar::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('building', 'like', '%' . $request->search . '%');
        }

        // Get current academic year
        $currentAcademicYear = \App\Models\AcademicYear::where('is_active', true)->first();

        $kamars = $query->latest()->paginate(10)->withQueryString();

        // Attach classes information to each kamar if they have active kamar in current academic year
        if ($currentAcademicYear) {
            $kamars->getCollection()->transform(function ($kamar) use ($currentAcademicYear) {
                $activeKamar = \App\Models\ActiveKamar::where('kamar_id', $kamar->id)
                    ->where('academic_year_id', $currentAcademicYear->id)
                    ->first();

                $classNames = [];

                if ($activeKamar) {
                    // Fetch students deeply to get their active classes in current academic year
                    $members = \App\Models\KamarMember::where('active_kamar_id', $activeKamar->id)
                        ->withWhereHas('student', function ($q) use ($currentAcademicYear) {
                            $q->with(['classMembers' => function ($sq) use ($currentAcademicYear) {
                                $sq->whereHas('activeClass', function ($ssq) use ($currentAcademicYear) {
                                    $ssq->where('academic_year_id', $currentAcademicYear->id);
                                })->with('activeClass.kelas'); // Load the actual Kelas model
                            }]);
                        })->get();

                    foreach ($members as $member) {
                        if ($member->student && $member->student->classMembers->isNotEmpty()) {
                            $classMember = $member->student->classMembers->first();
                            if ($classMember->activeClass && $classMember->activeClass->kelas) {
                                $className = $classMember->activeClass->kelas->name;
                                if (!in_array($className, $classNames)) {
                                    $classNames[] = $className;
                                }
                            }
                        }
                    }
                }

                sort($classNames); // Sort alphabetically to look nice
                $kamar->classes_info = empty($classNames) ? '-' : implode(', ', $classNames);
                return $kamar;
            });
        }

        return Inertia::render('Master/Kamar/Index', [
            'kamars' => $kamars,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Master/Kamar/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'building' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'gender' => 'required|in:L,P',
            'description' => 'nullable|string',
        ]);

        Kamar::create($validated);

        return redirect()->route('kamars.index')->with('success', 'Data kamar berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Kamar $kamar)
    {
        return Inertia::render('Master/Kamar/Edit', [
            'kamar' => $kamar
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kamar $kamar)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'building' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'gender' => 'required|in:L,P',
            'description' => 'nullable|string',
        ]);

        $kamar->update($validated);

        return redirect()->route('kamars.index')->with('success', 'Data kamar berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kamar $kamar)
    {
        $kamar->delete();

        return redirect()->route('kamars.index')->with('success', 'Data kamar berhasil dihapus.');
    }
}
