<?php

namespace App\Http\Controllers;

use App\Models\ActiveKamar;
use App\Models\AcademicYear;
use App\Models\Kamar;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActiveKamarController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $activeAcademicYear = \App\Services\AcademicStateService::currentAcademicYear();
        $systemAcademicYear = \App\Services\AcademicStateService::activeAcademicYear();

        if (!$activeAcademicYear) {
            return redirect()->route('dashboard')->with('error', 'Belum ada Tahun Pelajaran yang bisa dipakai.');
        }

        $query = ActiveKamar::with(['kamar', 'musrif' => function ($q) {
            $q->select('id', 'name');
        }, 'members'])
            ->where('academic_year_id', $activeAcademicYear->id);

        if ($request->has('search')) {
            $query->whereHas('kamar', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('building', 'like', '%' . $request->search . '%');
            });
        }

        $activeKamars = $query->latest()->paginate(25)->withQueryString();

        // Optimize: Disable 'permissions' append on loaded musrifs to save memory
        $activeKamars->getCollection()->each(function ($item) {
            if ($item->musrif) {
                $item->musrif->setAppends([]);
            }
        });

        // Get available kamars that are not yet active in this academic year
        $existingActiveKamarIds = ActiveKamar::where('academic_year_id', $activeAcademicYear->id)
            ->pluck('kamar_id');

        $availableKamars = Kamar::whereNotIn('id', $existingActiveKamarIds)->get();

        // Get available musrifs - Optimize: Select minimal fields and disable appends
        $musrifs = User::select('id', 'name')->whereHas('userLevel', function ($q) {
            $q->where('name', 'Musrif Asrama')->orWhere('name', 'Administrator')->orWhere('name', 'Guru');
        })->get()->each(function ($user) {
            $user->setAppends([]);
        });

        return Inertia::render('Settings/ActiveKamar/Index', [
            'activeKamars' => $activeKamars,
            'availableKamars' => $availableKamars,
            'musrifs' => $musrifs,
            'academicYear' => $activeAcademicYear,
            'systemAcademicYear' => $systemAcademicYear,
            'preparationSourceYears' => AcademicYear::where('id', '!=', $activeAcademicYear->id)
                ->orderBy('name', 'desc')
                ->get(['id', 'name', 'is_active']),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'kamar_id' => 'required|exists:kamars,id',
            'musrif_id' => 'nullable|exists:users,id',
            'name' => 'nullable|string|max:255',
        ]);

        ActiveKamar::create($validated);

        return redirect()->back()->with('success', 'Kamar berhasil diaktifkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ActiveKamar $activeKamar)
    {
        $validated = $request->validate([
            'musrif_id' => 'nullable|exists:users,id',
            'name' => 'nullable|string|max:255',
        ]);

        $activeKamar->update($validated);

        return redirect()->back()->with('success', 'Data kamar aktif berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ActiveKamar $activeKamar)
    {
        $activeKamar->delete();

        return redirect()->back()->with('success', 'Kamar dinonaktifkan.');
    }

    public function copyFromYear(Request $request, \App\Services\AcademicPreparationService $preparationService)
    {
        if (!$request->user()?->hasRole('Administrator')) {
            abort(403, 'Anda tidak memiliki izin untuk menyalin struktur asrama.');
        }

        $request->validate([
            'source_year_id' => 'required|exists:academic_years,id',
        ]);

        $targetYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$targetYear) {
            return back()->with('error', 'Tahun tujuan belum tersedia.');
        }

        if ((int) $request->source_year_id === (int) $targetYear->id) {
            return back()->with('error', 'Tahun sumber dan tahun tujuan tidak boleh sama.');
        }

        $sourceYear = AcademicYear::findOrFail($request->source_year_id);
        $result = $preparationService->copyActiveKamars($sourceYear, $targetYear);

        return back()->with(
            'success',
            "Kamar aktif dari {$sourceYear->name} berhasil disalin ke {$targetYear->name}. {$result['created']} dibuat, {$result['updated']} diperbarui."
        );
    }
}
