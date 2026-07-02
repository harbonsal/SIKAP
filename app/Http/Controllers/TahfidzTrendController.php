<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Student;
use App\Models\TahfidzMemorization;
use App\Models\TahfidzMemorizationDetail;
use Carbon\Carbon;

class TahfidzTrendController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager Tahfidz')) {
            if (!$user->hasPermission('view_tahfidz_analysis')) {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }
        }

        // Logic for fetching trend summary for all students (or filtered)
        // To be implemented
    }

    public function apiList(Request $request)
    {
        // For performance, we'll calculate a simplified trend for all active students in Tahfidz
        // In a real big app, we'd cache this or use a background job, but this is fine for now
        $details = TahfidzMemorizationDetail::with(['student.user', 'student.classMembers.activeClass.kelas', 'student.classMembers.activeClass.kelasParalel'])
            ->where('status', 'full')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('student_id');

        $now = Carbon::now();
        $sixMonthsAgo = $now->copy()->subMonths(6)->startOfMonth();

        $data = [];

        foreach ($details as $studentId => $studentDetails) {
            $student = $studentDetails->first()->student;
            if (!$student || !$student->user) continue;

            $className = ($student->classMembers->last()?->activeClass->kelas->name ?? '-') . ' ' . ($student->classMembers->last()?->activeClass->kelasParalel->name ?? '');

            // Unique pages total
            $totalPages = $studentDetails->unique(function ($item) {
                return $item->juz . '-' . $item->page_number;
            })->count();

            // Calculate speed in the last 6 months
            $recentPages = $studentDetails->filter(function ($item) use ($sixMonthsAgo) {
                return $item->created_at >= $sixMonthsAgo;
            })->unique(function ($item) {
                return $item->juz . '-' . $item->page_number;
            });

            // Group by month to find active months
            $activeMonths = $recentPages->groupBy(function($item) {
                return Carbon::parse($item->created_at)->format('Y-m');
            })->count();

            $totalRecent = $recentPages->count();

            // We divide by 6 if they have been active less, or divide by active months?
            // Usually, average over active months or a fixed 6 months.
            // Let's use max(1, activeMonths) to be fair.
            $avgSpeed = $activeMonths > 0 ? round($totalRecent / $activeMonths, 1) : 0;

            $targetPages = 604;
            $remaining = max(0, $targetPages - $totalPages);
            $predictedMonths = $avgSpeed > 0 ? ceil($remaining / $avgSpeed) : null;

            $data[] = [
                'student_id' => $student->id,
                'student_name' => $student->user->name,
                'nis' => $student->user->nomor_induk ?? $student->nisn ?? '-',
                'class_name' => $className,
                'total_pages' => $totalPages,
                'avg_speed' => $avgSpeed,
                'predicted_months' => $predictedMonths,
                'predicted_date' => $predictedMonths !== null ? $now->copy()->addMonths($predictedMonths)->translatedFormat('F Y') : '-'
            ];
        }

        return response()->json($data);
    }

    public function show(Request $request, Student $student)
    {
        $user = Auth::user();
        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager Tahfidz')) {
            if (!$user->hasPermission('view_tahfidz_analysis')) {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }
        }

        $student->load('user', 'classMembers.activeClass.kelas', 'classMembers.activeClass.kelasParalel');

        // Fetch all full page details
        $details = TahfidzMemorizationDetail::where('student_id', $student->id)
            ->where('status', 'full')
            ->orderBy('created_at', 'asc')
            ->get();

        // Total Pages Memorized
        // Or we can count unique (juz, page_number)
        $totalPages = $details->unique(function ($item) {
            return $item->juz . '-' . $item->page_number;
        })->count();

        // Calculate speed per month (last 6 months)
        $monthsData = [];
        $now = Carbon::now();
        $totalSpeedLast6Months = 0;
        $activeMonths = 0;

        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth();

            $pagesThisMonth = $details->filter(function ($item) use ($monthStart, $monthEnd) {
                return $item->created_at >= $monthStart && $item->created_at <= $monthEnd;
            })->unique(function ($item) {
                return $item->juz . '-' . $item->page_number;
            })->count();

            $monthsData[] = [
                'month' => $monthStart->translatedFormat('M Y'),
                'pages' => $pagesThisMonth
            ];

            if ($pagesThisMonth > 0 || $i < 3) {
                $totalSpeedLast6Months += $pagesThisMonth;
                $activeMonths++;
            }
        }

        $avgPagesPerMonth = $activeMonths > 0 ? round($totalSpeedLast6Months / $activeMonths, 1) : 0;
        
        $targetPages = 604;
        $remainingPages = max(0, $targetPages - $totalPages);
        $predictedMonths = $avgPagesPerMonth > 0 ? ceil($remainingPages / $avgPagesPerMonth) : null;
        
        $predictedDate = null;
        if ($predictedMonths !== null) {
            $predictedDate = $now->copy()->addMonths($predictedMonths)->translatedFormat('F Y');
        }

        return Inertia::render('Tahfidz/Analysis/TrendDetail', [
            'student' => $student,
            'className' => ($student->classMembers->last()?->activeClass->kelas->name ?? '-') . ' ' . ($student->classMembers->last()?->activeClass->kelasParalel->name ?? ''),
            'trendData' => $monthsData,
            'stats' => [
                'total_pages' => $totalPages,
                'avg_speed' => $avgPagesPerMonth,
                'remaining_pages' => $remainingPages,
                'predicted_months' => $predictedMonths,
                'predicted_date' => $predictedDate
            ]
        ]);
    }
}
