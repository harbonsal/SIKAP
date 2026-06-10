<?php

namespace App\Http\Controllers;

use App\Models\Kkm;
use App\Models\AcademicYear;
use App\Models\Mapel;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KkmController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_kkm')->only(['index']);
        $this->middleware('permission:create_kkm')->only(['store']);
        $this->middleware('permission:edit_kkm')->only(['update']);
        $this->middleware('permission:delete_kkm')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Get Active Academic Year ID
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        $activeYearId = $activeYear ? $activeYear->id : null;

        // Filter by Academic Year (Default to Active)
        $selectedYearId = $request->academic_year_id ?? $activeYearId;

        // Get Classes (Mutawassith and Tsanawy only)
        $kelases = \App\Models\Kelas::whereHas('jenjang', function ($q) {
            $q->whereIn('name', ['Mutawassith', 'Tsanawy']);
        })->get();

        // Create query for ActiveClass to check existence and get ID
        $activeClassQuery = \App\Models\ActiveClass::where('academic_year_id', $selectedYearId);

        $selectedClassId = $request->kelas_id;

        if ($selectedClassId) {
            $activeClassQuery->where('kelas_id', $selectedClassId);
        }

        $activeClass = $activeClassQuery->first();

        // Get Mapels
        if ($selectedYearId && $selectedClassId && $activeClass) {
            $mapels = Mapel::whereHas('activeSubjects', function ($q) use ($activeClass) {
                $q->where('active_class_id', $activeClass->id);
            })->orderBy('name')->get();
        } else {
            $mapels = collect([]);
        }

        // Get existing KKMs for the selected year
        $kkmsQuery = Kkm::where('academic_year_id', $selectedYearId);
        if ($selectedClassId) {
            $kkmsQuery->where('kelas_id', $selectedClassId);
        }
        $kkms = $kkmsQuery->get()->groupBy('kelas_id');

        // Calculate Summary
        $classesSummary = $kelases->map(function ($kelas) use ($selectedYearId) {
            // Find Active Class for this Kelas & Year to count expected mapels
            $activeClass = \App\Models\ActiveClass::where('academic_year_id', $selectedYearId)
                ->where('kelas_id', $kelas->id)
                ->first();

            $totalMapel = 0;
            if ($activeClass) {
                $totalMapel = \App\Models\ActiveSubject::where('active_class_id', $activeClass->id)->count();
            }

            $filledKkm = Kkm::where('academic_year_id', $selectedYearId)
                ->where('kelas_id', $kelas->id)
                ->whereNotNull('kkm_value')
                ->count();

            return [
                'id' => $kelas->id,
                'name' => $kelas->name,
                'jenjang' => $kelas->jenjang->name,
                'total_mapel' => $totalMapel,
                'filled_kkm' => $filledKkm,
                'is_complete' => $totalMapel > 0 && $filledKkm >= $totalMapel
            ];
        });

        return Inertia::render('Settings/Education/Kkm/Index', [
            'kkms' => $kkms,
            'academicYears' => AcademicYear::latest()->get(),
            'mapels' => $mapels,
            'kelases' => $kelases,
            'classesSummary' => $classesSummary,
            'selectedYearId' => (int)$selectedYearId,
            'activeYearId' => $activeYearId,
            'filters' => [
                'kelas_id' => $selectedClassId,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'kelas_id' => 'required|exists:kelas,id',
            'kkms' => 'array', // Array of mapel_id => kkm_value
            'kkms.*' => 'nullable|integer|min:0|max:100',
        ]);

        foreach ($request->kkms as $mapelId => $kkmValue) {
            if ($kkmValue !== null && $kkmValue !== '') {
                Kkm::updateOrCreate(
                    [
                        'academic_year_id' => $request->academic_year_id,
                        'kelas_id' => $request->kelas_id,
                        'mapel_id' => $mapelId,
                    ],
                    [
                        'kkm_value' => $kkmValue,
                    ]
                );
            } else {
                // Optional: Delete if value is cleared? Or just ignore.
                // For now, let's just ignore empty values to preserve existing data if not explicitly overwritten,
                // or we could delete if the intent is to remove the KKM.
                // Given the UI usually shows current values, clearing it might mean delete.
                // Let's stick to updateOrCreate for non-null values for now.
            }
        }

        return redirect()->route('kkms.index', [
            'academic_year_id' => $request->academic_year_id
        ])->with('success', 'Data KKM berhasil disimpan.');
    }

    public function destroy(Kkm $kkm)
    {
        $kkm->delete();
        return redirect()->back()->with('success', 'KKM berhasil dihapus.');
    }
}
