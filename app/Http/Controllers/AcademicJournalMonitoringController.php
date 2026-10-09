<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ClassJournal;
use App\Models\StudentAttendance;
use App\Models\Schedule;
use App\Models\User;
use App\Models\Day;
use App\Services\AcademicStateService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Mapel;
use App\Models\Kelas;

class AcademicJournalMonitoringController extends Controller
{
    public function index(Request $request)
    {
        // 1. Authorization
        $user = auth()->user();
        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager') && !$user->hasRole('Sekretaris Divisi')) {
            abort(403);
        }

        $academicYear = AcademicStateService::currentAcademicYear();
        
        // Setup Date Range
        $startDate = $request->input('start_date', Carbon::now()->startOfWeek()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->endOfWeek()->format('Y-m-d'));

        $teacherId = $request->input('teacher_id');
        $mapelId = $request->input('mapel_id');
        $kelasId = $request->input('kelas_id');
        $status = $request->input('status');
        $problemType = $request->input('problem_type');

        $filterOptions = [
            'teachers' => User::whereHas('activeSubjects')->orderBy('name')->get(['id', 'name']),
            'mapels' => Mapel::orderBy('name')->get(['id', 'name']),
            'kelas' => Kelas::orderBy('name')->get(['id', 'name']),
        ];

        // --- 2. Teacher Compliance (Kepatuhan Guru vs Schedule) ---
        // Actually, the user asked to compare with Schedule: "membandingkan Jurnal yang masuk dengan Jadwal Mengajar (Schedule)".
        // So we need to:
        // a. Fetch all schedules
        $schedulesQuery = Schedule::with(['activeSubject.mapel', 'activeSubject.activeClass.kelas', 'day', 'teacher'])
            ->where('academic_year_id', $academicYear?->id);

        if ($teacherId) {
            $schedulesQuery->where('teacher_id', $teacherId);
        }
        if ($mapelId) {
            $schedulesQuery->whereHas('activeSubject', function($q) use ($mapelId) {
                $q->where('mapel_id', $mapelId);
            });
        }
        if ($kelasId) {
            $schedulesQuery->whereHas('activeSubject.activeClass', function($q) use ($kelasId) {
                $q->where('kelas_id', $kelasId);
            });
        }
        
        $schedules = $schedulesQuery->get();
            
        $journalsQuery = ClassJournal::with(['activeSubject'])
            ->whereBetween('date', [$startDate, $endDate])
            ->where('academic_year_id', $academicYear?->id);

        if ($teacherId) {
            $journalsQuery->where('teacher_id', $teacherId);
        }
        if ($mapelId) {
            $journalsQuery->whereHas('activeSubject', function($q) use ($mapelId) {
                $q->where('mapel_id', $mapelId);
            });
        }
        if ($kelasId) {
            $journalsQuery->whereHas('activeSubject.activeClass', function($q) use ($kelasId) {
                $q->where('kelas_id', $kelasId);
            });
        }
        
        $journals = $journalsQuery->get();

        $currentDate = Carbon::parse($startDate);
        $endDateObj = Carbon::parse($endDate);
        $today = Carbon::today();

        // Prevent calculating expected journals for future dates
        $loopEndDate = $endDateObj->copy();
        if ($loopEndDate->gt($today)) {
            $loopEndDate = $today;
        }
        
        // Day mapping: Carbon dayOfWeekIso (1 = Mon, 7 = Sun) to day name in DB
        $carbonToDayName = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Ahad' // or Minggu
        ];
        
        // Pre-fetch Days mapping to ID
        $days = Day::all()->keyBy('name');
        
        $teacherComplianceRaw = [];
        
        while ($currentDate->lte($loopEndDate)) {
            $dayName = $carbonToDayName[$currentDate->dayOfWeekIso];
            $dayNameAlt = ($dayName === 'Ahad') ? 'Minggu' : $dayName; // Just in case
            
            $dayModel = $days->get($dayName) ?? $days->get($dayNameAlt);
            
            if ($dayModel) {
                // Find all schedules for this day of week
                $dailySchedules = $schedules->where('day_id', $dayModel->id);
                
                foreach ($dailySchedules as $sch) {
                    $teacherId = $sch->teacher_id;
                    $subjectId = $sch->active_subject_id;
                    $dateStr = $currentDate->format('Y-m-d');
                    
                    if (!isset($teacherComplianceRaw[$teacherId])) {
                        $teacherComplianceRaw[$teacherId] = [
                            'teacher_id' => $teacherId,
                            'teacher_name' => $sch->teacher?->name ?? 'Unknown',
                            'expected' => 0,
                            'submitted' => 0,
                            'missed' => [],
                        ];
                    }
                    
                    $teacherComplianceRaw[$teacherId]['expected']++;
                    
                    // Did the teacher submit a journal for this schedule on this date?
                    // We check if a journal exists with same active_subject_id and date
                    $hasJournal = $journals->where('teacher_id', $teacherId)
                                           ->where('active_subject_id', $subjectId)
                                           ->where('date', $dateStr)
                                           ->first();
                                           
                    if ($hasJournal) {
                        $teacherComplianceRaw[$teacherId]['submitted']++;
                    } else {
                        // Record the missed schedule
                        $teacherComplianceRaw[$teacherId]['missed'][] = [
                            'date' => $dateStr,
                            'day' => $dayName,
                            'mapel' => $sch->activeSubject?->mapel?->name ?? '-',
                            'kelas' => $sch->activeSubject?->activeClass?->kelas?->name ?? '-',
                        ];
                    }
                }
            }
            
            $currentDate->addDay();
        }
        
        // Convert array to collection and calculate percentage
        $teacherCompliance = collect($teacherComplianceRaw)->map(function ($item) {
            $item['percentage'] = $item['expected'] > 0 
                ? round(($item['submitted'] / $item['expected']) * 100) 
                : 100;
            return $item;
        })->sortBy('percentage')->values(); // Lowest percentage first

        // --- 3. Student Attendance Problems (Santri Bermasalah) ---
        $problemAttendancesQuery = StudentAttendance::with(['student', 'classJournal.activeSubject.mapel', 'classJournal.activeSubject.activeClass.kelas'])
            ->whereHas('classJournal', function ($q) use ($startDate, $endDate, $academicYear, $teacherId, $mapelId, $kelasId) {
                $q->whereBetween('date', [$startDate, $endDate])
                  ->where('academic_year_id', $academicYear?->id);
                  
                if ($teacherId) {
                    $q->where('teacher_id', $teacherId);
                }
                if ($mapelId) {
                    $q->whereHas('activeSubject', function($sq) use ($mapelId) {
                        $sq->where('mapel_id', $mapelId);
                    });
                }
                if ($kelasId) {
                    $q->whereHas('activeSubject.activeClass', function($sq) use ($kelasId) {
                        $sq->where('kelas_id', $kelasId);
                    });
                }
            })
            ->where(function($q) use ($problemType) {
                if ($problemType) {
                    if ($problemType === 'Seragam') {
                        $q->where('is_uniform_complete', false);
                    } else {
                        $q->where('status', $problemType);
                    }
                } else {
                    $q->whereIn('status', ['Alpa', 'Sakit', 'Izin', 'Terlambat'])
                      ->orWhere('is_uniform_complete', false);
                }
            });

        $problemAttendances = $problemAttendancesQuery->get();

        $problemStudents = $problemAttendances->groupBy('student_id')->map(function ($group) {
            $student = $group->first()->student;
            $alpaCount = $group->where('status', 'Alpa')->count();
            $sakitCount = $group->where('status', 'Sakit')->count();
            $izinCount = $group->where('status', 'Izin')->count();
            $terlambatCount = $group->where('status', 'Terlambat')->count();
            $seragamCount = $group->where('is_uniform_complete', false)->count();
            
            return [
                'student_id' => $student?->id,
                'student_name' => $student?->name ?? 'Unknown Student',
                'total_issues' => $group->count(),
                'alpa_count' => $alpaCount,
                'sakit_count' => $sakitCount,
                'izin_count' => $izinCount,
                'terlambat_count' => $terlambatCount,
                'seragam_count' => $seragamCount,
                'details' => $group->map(function ($a) {
                    $statusArr = [];
                    if (in_array($a->status, ['Alpa', 'Sakit', 'Izin', 'Terlambat'])) {
                        $statusArr[] = $a->status;
                    }
                    if ($a->is_uniform_complete === false || $a->is_uniform_complete === 0) {
                        $statusArr[] = 'Seragam Tdk Sesuai';
                    }
                    return [
                        'date' => $a->classJournal?->date,
                        'jam_ke' => $a->classJournal?->jam_ke,
                        'mapel' => $a->classJournal?->activeSubject?->mapel?->name ?? '-',
                        'status' => implode(', ', $statusArr) ?: $a->status,
                        'note' => $a->note,
                    ];
                })->values()
            ];
        })->sortByDesc('total_issues')->values()->take(50); // Top 50

        // --- 4. Journal Analysis (Analisa Jurnal) ---
        $journalAnalysisQuery = ClassJournal::with(['teacher', 'activeSubject.mapel', 'activeSubject.activeClass.kelas', 'pekan'])
            ->whereBetween('date', [$startDate, $endDate])
            ->where('academic_year_id', $academicYear?->id);

        if ($teacherId) {
            $journalAnalysisQuery->where('teacher_id', $teacherId);
        }
        if ($mapelId) {
            $journalAnalysisQuery->whereHas('activeSubject', function($q) use ($mapelId) {
                $q->where('mapel_id', $mapelId);
            });
        }
        if ($kelasId) {
            $journalAnalysisQuery->whereHas('activeSubject.activeClass', function($q) use ($kelasId) {
                $q->where('kelas_id', $kelasId);
            });
        }
        if ($status === 'sinkron') {
            $journalAnalysisQuery->where(function($q) {
                $q->whereNull('description')->orWhere('description', '');
            });
        } elseif ($status === 'tidak_sinkron') {
            $journalAnalysisQuery->whereNotNull('description')->where('description', '!=', '');
        }

        $journalAnalysis = $journalAnalysisQuery->orderBy('date', 'desc')
            ->orderBy('jam_ke', 'asc')
            ->get()
            ->map(function ($journal) {
                return [
                    'id' => $journal->id,
                    'date' => $journal->date,
                    'jam_ke' => $journal->jam_ke,
                    'teacher_name' => $journal->teacher?->name ?? 'Unknown',
                    'mapel' => $journal->activeSubject?->mapel?->name ?? '-',
                    'kelas' => $journal->activeSubject?->activeClass?->kelas?->name ?? '-',
                    'pekan' => $journal->pekan?->name ?? '-',
                    'topic' => $journal->topic,
                    'description' => $journal->description,
                ];
            });

        return Inertia::render('Academic/Monitoring/Index', [
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'teacher_id' => $teacherId,
                'mapel_id' => $mapelId,
                'kelas_id' => $kelasId,
                'status' => $status,
            ],
            'filterOptions' => $filterOptions,
            'teacherCompliance' => $teacherCompliance,
            'problemStudents' => $problemStudents,
            'journalAnalysis' => $journalAnalysis,
        ]);
    }
}
