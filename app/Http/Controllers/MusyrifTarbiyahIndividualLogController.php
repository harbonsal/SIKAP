<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Student;
use App\Models\TarbiyahIndividualLog;
use App\Services\AcademicStateService;
use Illuminate\Support\Facades\Auth;

class MusyrifTarbiyahIndividualLogController extends Controller
{
    public function index($student_id)
    {
        $user = Auth::user();
        $activeAcademic = AcademicStateService::currentAcademicYear();
        
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        $student = Student::with('user:id,name,nomor_induk')->findOrFail($student_id);

        $logs = TarbiyahIndividualLog::where('student_id', $student_id)
                    ->orderBy('date', 'desc')
                    ->get();

        return Inertia::render('Settings/Pengasuhan/MusyrifTarbiyah/IndividualLog', [
            'student' => $student,
            'logs' => $logs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            // Academic
            'academic_problem' => 'nullable|string',
            'academic_solution' => 'nullable|string',
            'academic_trend' => 'required|in:Positif,Negatif,Netral',
            'academic_action' => 'required|in:Selesai,Pantau,Eskalasi',
            // Ibadah
            'ibadah_problem' => 'nullable|string',
            'ibadah_solution' => 'nullable|string',
            // Personal
            'personal_problem' => 'nullable|string',
            'personal_solution' => 'nullable|string',
            // Social
            'social_problem' => 'nullable|string',
            'social_solution' => 'nullable|string',
            // Comfort
            'comfort_problem' => 'nullable|string',
            'comfort_solution' => 'nullable|string',
            // Family
            'family_problem' => 'nullable|string',
            'family_solution' => 'nullable|string',
            // Health
            'health_problem' => 'nullable|string',
            'health_solution' => 'nullable|string',
            // Akhlak (Overall)
            'akhlak_trend' => 'required|in:Positif,Negatif,Netral',
            'akhlak_action' => 'required|in:Selesai,Pantau,Eskalasi',
            // Public Notes
            'public_notes' => 'nullable|string',
        ]);

        $activeAcademic = AcademicStateService::currentAcademicYear();
        
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        $dateObj = \Carbon\Carbon::parse($request->date);
        
        $trendMap = [
            'Positif' => 'NAIK',
            'Netral'  => 'STABIL',
            'Negatif' => 'MENURUN',
        ];
        
        $actionMap = [
            'Selesai'  => 'PEMBINAAN',
            'Pantau'   => 'PEMBINAAN_INTENSIF',
            'Eskalasi' => 'KONSELOR',
        ];

        TarbiyahIndividualLog::create([
            'user_id' => Auth::id(),
            'student_id' => $request->student_id,
            'date' => $request->date,
            'month' => $dateObj->translatedFormat('F Y'),
            'week' => $dateObj->weekOfMonth,
            'academic_prob' => $request->academic_problem,
            'academic_sol' => $request->academic_solution,
            'academic_trend' => $trendMap[$request->academic_trend] ?? null,
            'academic_action' => $actionMap[$request->academic_action] ?? null,
            'ibadah_prob' => $request->ibadah_problem,
            'ibadah_sol' => $request->ibadah_solution,
            'personal_prob' => $request->personal_problem,
            'personal_sol' => $request->personal_solution,
            'social_prob' => $request->social_problem,
            'social_sol' => $request->social_solution,
            'comfort_prob' => $request->comfort_problem,
            'comfort_sol' => $request->comfort_solution,
            'family_prob' => $request->family_problem,
            'family_sol' => $request->family_solution,
            'health_prob' => $request->health_problem,
            'health_sol' => $request->health_solution,
            'akhlaq_trend' => $trendMap[$request->akhlak_trend] ?? null,
            'akhlaq_action' => $actionMap[$request->akhlak_action] ?? null,
            'public_notes' => $request->public_notes,
        ]);

        return back()->with('success', 'Catatan pendampingan individu berhasil disimpan.');
    }
}
