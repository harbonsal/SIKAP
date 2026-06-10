<?php

namespace App\Http\Controllers;

use App\Models\AcademicCalendarEvent;
use App\Models\Pekan;
use App\Models\Mapel;
use App\Models\Kelas;
use App\Models\Silabus;
use App\Services\AcademicStateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcademicCalendarController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        
        // Admin-only actions for calendar event management and week KBM toggles
        $this->middleware(function ($request, $next) {
            $user = auth()->user();
            if (!$user || $user->userLevel->name !== 'Administrator') {
                abort(403, 'Akses ditolak. Hanya Administrator yang dapat mengubah data Kalender Pendidikan.');
            }
            return $next($request);
        })->only(['storeEvent', 'updateEvent', 'destroyEvent', 'updatePekanKbm']);
    }

    public function index(Request $request)
    {
        $activeYear = AcademicStateService::currentAcademicYear();
        $currentSemester = AcademicStateService::currentSemester();

        // 1. Fetch Events
        $events = AcademicCalendarEvent::orderBy('start_date', 'asc')->get();

        // 2. Fetch Weeks (Pekans)
        $pekans = Pekan::orderBy('start_date', 'asc')->get();

        // 3. Map overlapping events to weeks for UI display and automatic detection
        $pekans = $pekans->map(function ($pekan) use ($events) {
            $overlappingEvents = $events->filter(function ($event) use ($pekan) {
                if (!$pekan->start_date || !$pekan->end_date) return false;
                return $event->start_date <= $pekan->end_date && $event->end_date >= $pekan->start_date;
            });
            $pekan->overlapping_events = $overlappingEvents->values();
            return $pekan;
        });

        // 4. Calculate active weeks (where is_kbm is true)
        $totalWeeksCount = $pekans->count();
        $activeWeeksCount = $pekans->where('is_kbm', true)->count();
        $inactiveWeeksCount = $totalWeeksCount - $activeWeeksCount;

        // 5. Fetch subjects & classes for plotting tab
        $mapels = Mapel::orderBy('name')->get();
        $kelas = Kelas::orderBy('name')->get();

        // 6. Fetch syllabus if filters provided
        $selectedMapelId = $request->input('mapel_id');
        $selectedKelasId = $request->input('kelas_id');
        $selectedSemester = $request->input('semester', $currentSemester ? $currentSemester->name : 'Ganjil');

        $silabuses = [];
        if ($selectedMapelId && $selectedKelasId) {
            $semesterValues = [$selectedSemester];
            if (strtolower($selectedSemester) === 'ganjil' || $selectedSemester == '1') {
                $semesterValues = ['Ganjil', 'ganjil', '1'];
            } elseif (strtolower($selectedSemester) === 'genap' || $selectedSemester == '2') {
                $semesterValues = ['Genap', 'genap', '2'];
            }

            $silabuses = Silabus::where('mapel_id', $selectedMapelId)
                ->where('kelas_id', $selectedKelasId)
                ->whereIn('semester', $semesterValues)
                ->orderBy('pekan', 'asc')
                ->get();
        }

        return Inertia::render('Education/AcademicCalendar/Index', [
            'events' => $events,
            'pekans' => $pekans,
            'mapels' => $mapels,
            'kelas' => $kelas,
            'silabuses' => $silabuses,
            'activeYear' => $activeYear,
            'currentSemester' => $currentSemester,
            'activeWeeksCount' => $activeWeeksCount,
            'inactiveWeeksCount' => $inactiveWeeksCount,
            'totalWeeksCount' => $totalWeeksCount,
            'filters' => [
                'mapel_id' => $selectedMapelId,
                'kelas_id' => $selectedKelasId,
                'semester' => $selectedSemester,
            ],
            'isAdmin' => auth()->user()->userLevel->name === 'Administrator',
        ]);
    }

    public function storeEvent(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'color' => 'required|string',
            'description' => 'nullable|string',
            'is_kbm_active' => 'required|boolean',
        ]);

        AcademicCalendarEvent::create($validated);

        return redirect()->back()->with('success', 'Agenda Kalender Pendidikan berhasil ditambahkan.');
    }

    public function updateEvent(Request $request, AcademicCalendarEvent $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'color' => 'required|string',
            'description' => 'nullable|string',
            'is_kbm_active' => 'required|boolean',
        ]);

        $event->update($validated);

        return redirect()->back()->with('success', 'Agenda Kalender Pendidikan berhasil diperbarui.');
    }

    public function destroyEvent(AcademicCalendarEvent $event)
    {
        $event->delete();

        return redirect()->back()->with('success', 'Agenda Kalender Pendidikan berhasil dihapus.');
    }

    public function updatePekanKbm(Request $request, Pekan $pekan)
    {
        $validated = $request->validate([
            'is_kbm' => 'required|boolean',
        ]);

        $pekan->update($validated);

        return redirect()->back()->with('success', 'Status KBM Pekan berhasil diperbarui.');
    }
}
