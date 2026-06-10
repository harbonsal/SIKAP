<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TahfidzHalaqohSession;
use App\Models\TahfidzHalaqohOfficer;
use App\Models\TahfidzMusyrif;
use App\Models\TahfidzMonitoring;
use App\Models\TahfidzMonitoringAttendance;
use App\Models\TahfidzMonitoringViolation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TahfidzMonitoringController extends Controller
{
    public function index(Request $request)
    {
        $query = TahfidzMonitoring::with(['user', 'session'])
            ->orderBy('recorded_at', 'desc');

        if ($request->date) {
            $query->whereDate('recorded_at', $request->date);
        }

        $monitorings = $query->paginate(10);

        return Inertia::render('Tahfidz/Monitoring/Index', [
            'monitorings' => $monitorings,
            'filters' => $request->all(),
        ]);
    }

    public function create()
    {
        $sessions = TahfidzHalaqohSession::all();
        // Active Musyrifs
        $musyrifs = TahfidzMusyrif::with('student.user')->where('is_active', true)->get();

        // Officers Schedule (For "pancingan" / suggestions)
        // We get officers for TODAY (Date)
        $todayDate = Carbon::now()->format('Y-m-d');
        // Check if day_of_week usage is needed for frontend display? 
        // Frontend might want current day name. We passed 'currentDate' formatted.
        // We pass 'currentDayOfWeek' (1-7) for compatibility if needed, but data is date-based.

        $scheduledOfficers = TahfidzHalaqohOfficer::whereDate('assigned_date', $todayDate)
            ->with(['user', 'session'])
            ->get();

        return Inertia::render('Tahfidz/Monitoring/Create', [
            'sessions' => $sessions,
            'musyrifs' => $musyrifs,
            'scheduledOfficers' => $scheduledOfficers,
            'currentDate' => Carbon::now()->locale('id')->isoFormat('dddd, D MMMM Y HH:mm'),
            'currentDayOfWeek' => Carbon::now()->dayOfWeekIso, // Keep passing this if frontend uses it for titles
            'currentUser' => Auth::user(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:tahfidz_halaqoh_sessions,id',
            'officer_name' => 'nullable|string',
            'general_note' => 'nullable|string',
            'attendances' => 'required|array',
            'violations' => 'nullable|array',
        ]);

        \DB::transaction(function () use ($request) {
            $monitoring = TahfidzMonitoring::create([
                'user_id' => $request->filled('user_id') ? $request->user_id : Auth::id(),
                'session_id' => $request->session_id,
                'recorded_at' => Carbon::now(),
                'general_note' => $request->general_note,
            ]);

            foreach ($request->attendances as $att) {
                // $att: musyrif_id, status
                TahfidzMonitoringAttendance::create([
                    'monitoring_id' => $monitoring->id,
                    'musyrif_id' => $att['musyrif_id'],
                    'status' => $att['status'], // Hadir, Izin, etc
                ]);
            }

            if ($request->violations) {
                foreach ($request->violations as $vio) {
                    TahfidzMonitoringViolation::create([
                        'monitoring_id' => $monitoring->id,
                        'musyrif_id' => $vio['musyrif_id'],
                        'violation_type' => $vio['violation_type'],
                        'note' => $vio['note'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('tahfidz.monitoring.index')->with('success', 'Laporan pemantauan berhasil disimpan.');
    }

    public function show(TahfidzMonitoring $monitoring)
    {
        $monitoring->load(['user', 'session', 'attendances.musyrif.student', 'violations.musyrif.student']);

        return Inertia::render('Tahfidz/Monitoring/Show', [
            'monitoring' => $monitoring
        ]);
    }
}
