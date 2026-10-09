<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Student;
use App\Models\User;
use App\Models\CareViolation;
use App\Models\TarbiyahIndividualLog;
use App\Models\TahfidzMemorization;
use App\Models\StudentGrade;
use App\Services\AcademicStateService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class MusyrifTarbiyahProfileController extends Controller
{
    public function show($student_id)
    {
        $user = Auth::user();
        $activeAcademic = AcademicStateService::currentAcademicYear();
        
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        try {
            $student = Student::with(['user:id,name,nomor_induk'])->findOrFail($student_id);

            // 1. Data Pelanggaran Pengasuhan
            $careViolations = CareViolation::with('user:id,name')
                ->where('student_id', $student_id)
                ->orderBy('date', 'desc')
                ->get();

            // 2. Data Jurnal Pengasuhan (Individu)
            $individualLogs = TarbiyahIndividualLog::with('user:id,name')
                ->where('student_id', $student_id)
                ->orderBy('date', 'desc')
                ->get();

            // 3. Data Akademik
            $grades = StudentGrade::with('activeSubject.subject')
                ->where('student_id', $student_id)
                ->whereHas('activeSubject.activeClass', function($q) use ($activeAcademic) {
                    $q->where('academic_year_id', $activeAcademic->id);
                })
                ->get();

            $totalGrades = 0;
            $belowKkmCount = 0;
            $academicScore = 100; // Base score
            foreach ($grades as $grade) {
                $totalGrades++;
                // Check if below KKM
                $kkm = $grade->activeSubject->subject->kkm ?? 75;
                $finalScore = $grade->final_score ?? $grade->score ?? 0;
                if ($finalScore < $kkm) {
                    $belowKkmCount++;
                    $academicScore -= 5;
                }
            }
            if ($academicScore < 0) $academicScore = 0;

            // Memorizations details for frontend rendering
            $memorizations = \App\Models\TahfidzMemorizationDetail::where('student_id', $student_id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($detail) {
                    $verses = explode('-', $detail->verse_key ?? '');
                    $start_verse = trim($verses[0] ?? '-');
                    $end_verse = trim($verses[1] ?? $start_verse);
                    
                    return [
                        'id' => $detail->id,
                        'juz' => $detail->juz,
                        'surah_name' => $detail->surah_name ?? 'Tidak ada',
                        'start_verse' => $start_verse,
                        'end_verse' => $end_verse
                    ];
                });
                
            $tahfidzScore = 100;
            $bolosHalaqoh = 0; // Temporarily disabled until proper student halaqoh attendance is mapped
            $tahfidzScore -= ($bolosHalaqoh * 5); // Subtract 5 points for every skipped halaqoh
            
            // Analyze daily and weekly tahfidz targets
            $tahfidzService = app(\App\Services\TahfidzTargetAnalysisService::class);
            $dailyTarget = $tahfidzService->analyzeSingleStudentTarget($student, now()->startOfDay(), now()->endOfDay());
            $weeklyTarget = $tahfidzService->analyzeSingleStudentTarget($student, now()->startOfWeek(), now()->endOfWeek());
            
            // Deduct tahfidzScore based on unmet weekly targets
            if (!$weeklyTarget['sabaq']['is_met']) $tahfidzScore -= 10;
            if (!$weeklyTarget['sabqi']['is_met']) $tahfidzScore -= 10;
            if (!$weeklyTarget['manzil']['is_met']) $tahfidzScore -= 10;
            
            if ($tahfidzScore < 0) $tahfidzScore = 0;
            
            // 5. Data Kedisiplinan (Pengasuhan)
            $disciplineScore = 100;
            foreach ($careViolations as $cv) {
                if ($cv->violation_type === 'Berat') $disciplineScore -= 30;
                elseif ($cv->violation_type === 'Sedang') $disciplineScore -= 15;
                else $disciplineScore -= 5;
            }
            if ($disciplineScore < 0) $disciplineScore = 0;
            
            // 6. Data Adab/Karakter (Dari Jurnal Individu & Jurnal KBM Akademik)
            $characterScore = 100;
            $problemCount = 0;
            
            // A. Dari Jurnal Individu Pengasuhan
            foreach ($individualLogs as $log) {
                if (!empty($log->personal_problem) || !empty($log->worship_problem)) {
                    $problemCount++;
                    $characterScore -= 5;
                }
            }
            
            // B. Dari Jurnal KBM Akademik (Guru Kelas)
            $academicNotes = \App\Models\StudentAttendance::with(['classJournal.activeSubject', 'classJournal.teacher'])
                ->where('student_id', $student->user_id)
                ->where(function ($query) {
                    $query->whereIn('status', ['Alpa', 'Terlambat'])
                          ->orWhere(function($q) {
                              $q->whereNotNull('note')->where('note', '!=', '');
                          });
                })
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($att) {
                    return [
                        'id' => $att->id,
                        'date' => $att->classJournal->date,
                        'subject' => $att->classJournal->activeSubject->name ?? 'Mata Pelajaran',
                        'teacher' => $att->classJournal->teacher->name ?? 'Guru',
                        'status' => $att->status,
                        'note' => $att->note
                    ];
                });
                
            foreach ($academicNotes as $note) {
                $problemCount++;
                if (in_array($note['status'], ['Alpa', 'Terlambat'])) {
                    $characterScore -= 2; // Kurangi poin adab/karakter
                }
            }
            
            if ($characterScore < 0) $characterScore = 0;

            // 7. Auto Summary & Traffic Light
            $averageScore = ($academicScore + $tahfidzScore + $disciplineScore + $characterScore) / 4;
            
            if ($averageScore >= 85 && $disciplineScore > 70) {
                $trafficLight = 'Aman';
                $trafficColor = 'green';
                $summaryText = "Santri memiliki perkembangan yang baik dan seimbang secara keseluruhan. Pertahankan capaian akademik dan kedisiplinannya.";
            } elseif ($averageScore < 60 || $disciplineScore <= 40 || $belowKkmCount > 3 || $bolosHalaqoh > 3) {
                $trafficLight = 'Kritis';
                $trafficColor = 'red';
                $summaryText = "Perlu intervensi khusus! ";
                if ($belowKkmCount > 3) $summaryText .= "Ada banyak nilai di bawah KKM. ";
                if ($bolosHalaqoh > 3) $summaryText .= "Tercatat sering membolos halaqoh tahfidz. ";
                if ($disciplineScore <= 40) $summaryText .= "Banyak catatan pelanggaran kedisiplinan yang perlu ditindaklanjuti. ";
            } else {
                $trafficLight = 'Perlu Perhatian';
                $trafficColor = 'yellow';
                $summaryText = "Perkembangan cukup stabil, namun perlu perhatian pada ";
                $areas = [];
                if ($academicScore < 75) $areas[] = "prestasi akademik";
                if ($tahfidzScore < 75) $areas[] = "kedisiplinan halaqoh";
                if ($disciplineScore < 75) $areas[] = "kepatuhan tata tertib asrama";
                if ($characterScore < 75) $areas[] = "adab dan ibadah harian";
                
                $summaryText .= implode(", ", $areas) . ".";
            }

            return Inertia::render('Settings/Pengasuhan/MusyrifTarbiyah/Profile', [
                'student' => $student,
                'careViolations' => $careViolations,
                'individualLogs' => $individualLogs,
                'grades' => $grades,
                'memorizations' => $memorizations,
                'tahfidzViolations' => collect([]), // Passed to frontend to prevent undefined error
                'academicNotes' => $academicNotes,
                'analytics' => [
                    'scores' => [
                        'akademik' => $academicScore,
                        'tahfidz' => $tahfidzScore,
                        'kedisiplinan' => $disciplineScore,
                        'karakter' => $characterScore
                    ],
                    'metrics' => [
                        'below_kkm' => $belowKkmCount,
                        'bolos_halaqoh' => $bolosHalaqoh,
                        'total_violations' => $careViolations->count(),
                        'problems_noted' => $problemCount
                    ],
                    'tahfidzTargets' => [
                        'daily' => $dailyTarget,
                        'weekly' => $weeklyTarget
                    ],
                    'trafficLight' => $trafficLight,
                    'trafficColor' => $trafficColor,
                    'summaryText' => $summaryText
                ]
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Musyrif Profile Error: " . $e->getMessage());
            return back()->with('error', 'System Error: ' . $e->getMessage() . ' di file ' . basename($e->getFile()) . ' baris ' . $e->getLine());
        }
    }

    public function storeViolation(Request $request, $student_id)
    {
        $request->validate([
            'date' => 'required|date',
            'violation_type' => 'required|in:Ringan,Sedang,Berat',
            'description' => 'required|string',
            'punishment' => 'nullable|string',
            'points' => 'nullable|integer'
        ]);

        try {
            CareViolation::create([
                'student_id' => $student_id,
                'user_id' => Auth::id(),
                'date' => $request->date,
                'violation_type' => $request->violation_type,
                'description' => $request->description,
                'punishment' => $request->punishment,
                'points' => $request->points ?? 0
            ]);

            return back()->with('success', 'Catatan pelanggaran pengasuhan berhasil ditambahkan.');
        } catch (\Exception $e) {
            return back()->with('error', 'System Error: ' . $e->getMessage());
        }
    }
}
