<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Student;
use App\Models\MusyrifTarbiyahPlotting;
use App\Models\TarbiyahIndividualLog;
use App\Models\TarbiyahGroupLog;
use App\Services\AcademicStateService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class MusyrifTarbiyahDashboardController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
        $activeAcademic = AcademicStateService::currentAcademicYear();
        
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        // Determine if admin
        $isAdmin = $user->hasRole(['Administrator', 'Manager', 'Manager Pengasuhan']);

        $query = MusyrifTarbiyahPlotting::with(['student.user', 'musyrif'])
                    ->where('academic_year_id', $activeAcademic->id);
        
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        $plottings = $query->get();

        // Calculate metrics
        $mappedStudents = [];
        $totalTunggakan = 0;
        
        foreach ($plottings as $plot) {
            // Get last individual log
            $lastIndLog = TarbiyahIndividualLog::where('student_id', $plot->student_id)
                            ->orderBy('date', 'desc')
                            ->first();
                            
            $lastDate = $lastIndLog ? Carbon::parse($lastIndLog->date) : null;
            $daysSinceLast = $lastDate ? $lastDate->diffInDays(Carbon::now()) : 999;
            $isTunggakan = $daysSinceLast > 14;

            if ($isTunggakan) {
                $totalTunggakan++;
            }

            $mappedStudents[] = [
                'plotting_id' => $plot->id,
                'student_id' => $plot->student_id,
                'student_name' => $plot->student->name ?? 'Unknown',
                'nis' => $plot->student->nis ?? '-',
                'musyrif_name' => $plot->musyrif->name ?? 'Unknown',
                'musyrif_id' => $plot->user_id,
                'kelas' => $plot->student->kelas_name ?? '-',
                'asrama' => $plot->student->kamar_name ?? '-',
                'last_mentoring_date' => $lastDate ? $lastDate->format('Y-m-d') : null,
                'days_since_last' => $lastDate ? $daysSinceLast : null,
                'is_tunggakan' => $isTunggakan,
            ];
        }

        // Group log statistics — pertemuan kelompok bulan ini
        $now = Carbon::now();
        $groupLogQuery = TarbiyahGroupLog::query();
        if (!$isAdmin) {
            $groupLogQuery->where('user_id', $user->id);
        }
        $groupLogThisMonth = (clone $groupLogQuery)
            ->whereYear('date', $now->year)
            ->whereMonth('date', $now->month)
            ->count();
        $groupLogLastMonth = (clone $groupLogQuery)
            ->whereYear('date', $now->copy()->subMonth()->year)
            ->whereMonth('date', $now->copy()->subMonth()->month)
            ->count();

            return Inertia::render('Settings/Pengasuhan/MusyrifTarbiyah/Dashboard', [
                'plottings' => $mappedStudents,
                'isAdmin' => $isAdmin,
                'summary' => [
                    'total_students'        => count($mappedStudents),
                    'total_tunggakan'       => $totalTunggakan,
                    'group_log_this_month'  => $groupLogThisMonth,
                    'group_log_last_month'  => $groupLogLastMonth,
                    'current_month_name'    => $now->translatedFormat('F Y'),
                ]
            ]);
        } catch (\Exception $e) {
            // Log the error for diagnostic purposes
            \Illuminate\Support\Facades\Log::error("Musyrif Dashboard Error: " . $e->getMessage());
            return back()->with('error', 'System Error: ' . $e->getMessage() . ' di file ' . basename($e->getFile()) . ' baris ' . $e->getLine());
        }
    }
}
