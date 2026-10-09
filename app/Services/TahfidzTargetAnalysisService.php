<?php

namespace App\Services;

use App\Models\Student;
use App\Models\TahfidzMemorizationDetail;
use App\Models\AcademicCalendarEvent;
use Carbon\Carbon;

class TahfidzTargetAnalysisService
{
    /**
     * Get active KBM days between two dates.
     * Mon-Sat are considered standard days.
     */
    public function getActiveKbmDaysCount(Carbon $startDate, Carbon $endDate)
    {
        $totalDays = 0;
        $currentDate = $startDate->copy();

        // 1. Calculate base working days (Mon-Sat)
        while ($currentDate->lte($endDate)) {
            if (!$currentDate->isSunday()) {
                $totalDays++;
            }
            $currentDate->addDay();
        }

        // 2. Subtract non-KBM events (holidays)
        $holidays = AcademicCalendarEvent::where('is_kbm_active', false)
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function ($sq) use ($startDate, $endDate) {
                      $sq->where('start_date', '<=', $startDate)
                         ->where('end_date', '>=', $endDate);
                  });
            })->get();

        $holidayDaysCount = 0;
        foreach ($holidays as $holiday) {
            $hStart = Carbon::parse($holiday->start_date)->max($startDate);
            $hEnd = Carbon::parse($holiday->end_date)->min($endDate);
            
            $hCurrent = $hStart->copy();
            while ($hCurrent->lte($hEnd)) {
                if (!$hCurrent->isSunday()) {
                    $holidayDaysCount++;
                }
                $hCurrent->addDay();
            }
        }

        // Avoid negative in case of overlapping holidays
        return max(0, $totalDays - $holidayDaysCount);
    }

    public function analyzeTargets(Carbon $startDate, Carbon $endDate, $musyrifId = null)
    {
        $activeDaysCount = $this->getActiveKbmDaysCount($startDate, $endDate);
        
        $query = Student::with(['user', 'classMembers.activeClass', 'tahfidzHalaqohMember'])
            ->whereHas('user', function ($q) {
                $q->active();
            });

        if ($musyrifId && $musyrifId !== 'all') {
            $query->whereHas('tahfidzHalaqohMember', function ($q) use ($musyrifId) {
                $q->where('musyrif_id', $musyrifId);
            });
        }

        $students = $query->get();
        $studentIds = $students->pluck('id');

        // Fetch all details in the date range
        $details = TahfidzMemorizationDetail::whereIn('student_id', $studentIds)
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->get()
            ->groupBy('student_id');

        $globalSabqi = \App\Models\Setting::where('key', 'default_target_sabqi_pages')->value('value') ?? 1;
        $globalManzil = \App\Models\Setting::where('key', 'default_target_manzil_pages')->value('value') ?? 1;

        $analysis = [];

        foreach ($students as $student) {
            $studentDetails = $details->get($student->id) ?? collect();
            
            // Group by type
            $sabaqDetails = $studentDetails->where('type', 'sabaq');
            $sabqiDetails = $studentDetails->where('type', 'sabqi');
            $manzilDetails = $studentDetails->where('type', 'manzil');

            // Calculate pages (full = 1, half = 0.5)
            $sabaqPages = $sabaqDetails->where('status', 'full')->count() + ($sabaqDetails->where('status', 'half')->count() * 0.5);
            $sabqiPages = $sabqiDetails->where('status', 'full')->count() + ($sabqiDetails->where('status', 'half')->count() * 0.5);
            $manzilPages = $manzilDetails->where('status', 'full')->count() + ($manzilDetails->where('status', 'half')->count() * 0.5);

            // Targets
            $targetSabaq = $activeDaysCount * 0.5;
            $targetSabqi = $activeDaysCount * ($student->target_sabqi_pages ?? $globalSabqi);
            $targetManzil = $activeDaysCount * ($student->target_manzil_pages ?? $globalManzil);

            $analysis[] = [
                'student_id' => $student->id,
                'name' => $student->user->name ?? '-',
                'nis' => $student->user->nomor_induk ?? '-',
                'class' => $student->classMembers->last()?->activeClass?->name ?? '-',
                'active_days' => $activeDaysCount,
                
                'sabaq' => [
                    'achieved' => $sabaqPages,
                    'target' => $targetSabaq,
                    'is_met' => $sabaqPages >= $targetSabaq,
                    'deficit' => max(0, $targetSabaq - $sabaqPages)
                ],
                'sabqi' => [
                    'achieved' => $sabqiPages,
                    'target' => $targetSabqi,
                    'is_met' => $sabqiPages >= $targetSabqi,
                    'deficit' => max(0, $targetSabqi - $sabqiPages)
                ],
                'manzil' => [
                    'achieved' => $manzilPages,
                    'target' => $targetManzil,
                    'is_met' => $manzilPages >= $targetManzil,
                    'deficit' => max(0, $targetManzil - $manzilPages)
                ]
            ];
        }

        return $analysis;
    }

    public function analyzeSingleStudentTarget(Student $student, Carbon $startDate, Carbon $endDate)
    {
        $activeDaysCount = $this->getActiveKbmDaysCount($startDate, $endDate);
        
        $studentDetails = TahfidzMemorizationDetail::where('student_id', $student->id)
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->get();
            
        $globalSabqi = \App\Models\Setting::where('key', 'default_target_sabqi_pages')->value('value') ?? 1;
        $globalManzil = \App\Models\Setting::where('key', 'default_target_manzil_pages')->value('value') ?? 1;
        
        $sabaqDetails = $studentDetails->where('type', 'sabaq');
        $sabqiDetails = $studentDetails->where('type', 'sabqi');
        $manzilDetails = $studentDetails->where('type', 'manzil');

        $sabaqPages = $sabaqDetails->where('status', 'full')->count() + ($sabaqDetails->where('status', 'half')->count() * 0.5);
        $sabqiPages = $sabqiDetails->where('status', 'full')->count() + ($sabqiDetails->where('status', 'half')->count() * 0.5);
        $manzilPages = $manzilDetails->where('status', 'full')->count() + ($manzilDetails->where('status', 'half')->count() * 0.5);

        $targetSabaq = $activeDaysCount * 0.5;
        $targetSabqi = $activeDaysCount * ($student->target_sabqi_pages ?? $globalSabqi);
        $targetManzil = $activeDaysCount * ($student->target_manzil_pages ?? $globalManzil);

        return [
            'active_days' => $activeDaysCount,
            'sabaq' => [
                'achieved' => $sabaqPages,
                'target' => $targetSabaq,
                'is_met' => $sabaqPages >= $targetSabaq,
                'deficit' => max(0, $targetSabaq - $sabaqPages)
            ],
            'sabqi' => [
                'achieved' => $sabqiPages,
                'target' => $targetSabqi,
                'is_met' => $sabqiPages >= $targetSabqi,
                'deficit' => max(0, $targetSabqi - $sabqiPages)
            ],
            'manzil' => [
                'achieved' => $manzilPages,
                'target' => $targetManzil,
                'is_met' => $manzilPages >= $targetManzil,
                'deficit' => max(0, $targetManzil - $manzilPages)
            ]
        ];
    }

    public function getMistakesAnalysis(Carbon $startDate, Carbon $endDate, $musyrifId = null)
    {
        $query = TahfidzMemorizationDetail::with(['student.user', 'student.classMembers.activeClass'])
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->whereNotNull('mistakes_history')
            ->where('mistakes_history', '!=', '[]')
            ->where('mistakes_history', '!=', 'null');
            
        if ($musyrifId && $musyrifId !== 'all') {
            $query->whereHas('student.tahfidzHalaqohMember', function ($q) use ($musyrifId) {
                $q->where('musyrif_id', $musyrifId);
            });
        }

        $details = $query->get();
        $mistakesList = [];

        foreach ($details as $detail) {
            $history = is_string($detail->mistakes_history) ? json_decode($detail->mistakes_history, true) : $detail->mistakes_history;
            if (!is_array($history)) continue;

            foreach ($history as $mistake) {
                $mistakesList[] = [
                    'id' => uniqid(),
                    'student_name' => $detail->student->user->name ?? '-',
                    'class_name' => $detail->student->classMembers->last()?->activeClass?->name ?? '-',
                    'juz' => $detail->juz,
                    'page_number' => $detail->page_number,
                    'session_type' => $detail->type ?? 'sabaq',
                    'verse_key' => $mistake['verse_key'] ?? $detail->verse_key ?? '-',
                    'mistake_type' => $mistake['type'] ?? 'Lainnya',
                    'time' => $mistake['time'] ?? $detail->created_at->format('Y-m-d H:i:s')
                ];
            }
        }

        return $mistakesList;
    }
}
