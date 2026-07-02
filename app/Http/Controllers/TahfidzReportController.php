<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Student;
use App\Models\TahfidzMemorization;
use App\Models\TahfidzMemorizationDetail;
use Carbon\Carbon;

class TahfidzReportController extends Controller
{
    public function print(Request $request, Student $student)
    {
        $user = Auth::user();
        // Permission check
        if (!$user->hasRole('Administrator') && !$user->hasRole('Kepala Sekolah') && !$user->hasRole('Manager Tahfidz')) {
            if (!$user->hasPermission('view_tahfidz_achievements')) {
                abort(403, 'Anda tidak memiliki akses ke halaman ini.');
            }
        }

        $student->load([
            'user', 
            'classMembers.activeClass.kelas', 
            'classMembers.activeClass.kelasParalel',
            'kamarMembers.activeKamar.kamar',
            'tahfidzHalaqohMember.musyrif.user',
            'tahfidzHalaqohMember.musyrif.student'
        ]);

        $className = ($student->classMembers->last()?->activeClass->kelas->name ?? '-') . ' ' . ($student->classMembers->last()?->activeClass->kelasParalel->name ?? '');
        
        $musyrif = $student->tahfidzHalaqohMember->first()?->musyrif;
        $musyrifName = '-';
        if ($musyrif) {
            $musyrifName = $musyrif->user ? $musyrif->user->name : ($musyrif->student ? $musyrif->student->name : '-');
        }

        // Get Summary of Memorization
        $memorizations = TahfidzMemorization::where('student_id', $student->id)->get();
        $completedJuzList = $memorizations->where('is_completed', true)->pluck('juz')->toArray();
        sort($completedJuzList);
        $totalJuz = count($completedJuzList);

        // Recent Details (e.g. last 30 entries)
        $recentSetoran = TahfidzMemorizationDetail::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get();

        // Speed calculation (From Modul 2)
        $detailsFull = TahfidzMemorizationDetail::where('student_id', $student->id)
            ->where('status', 'full')
            ->orderBy('created_at', 'asc')
            ->get();
            
        $totalPages = $detailsFull->unique(function ($item) {
            return $item->juz . '-' . $item->page_number;
        })->count();

        $now = Carbon::now();
        $sixMonthsAgo = $now->copy()->subMonths(6)->startOfMonth();

        $recentPages = $detailsFull->filter(function ($item) use ($sixMonthsAgo) {
            return $item->created_at >= $sixMonthsAgo;
        })->unique(function ($item) {
            return $item->juz . '-' . $item->page_number;
        });

        $activeMonths = $recentPages->groupBy(function($item) {
            return Carbon::parse($item->created_at)->format('Y-m');
        })->count();

        $avgSpeed = $activeMonths > 0 ? round($recentPages->count() / $activeMonths, 1) : 0;
        
        $remaining = max(0, 604 - $totalPages);
        $predictedMonths = $avgSpeed > 0 ? ceil($remaining / $avgSpeed) : null;
        $predictedDate = $predictedMonths !== null ? $now->copy()->addMonths($predictedMonths)->translatedFormat('F Y') : '-';

        return Inertia::render('Tahfidz/Report/Print', [
            'student' => [
                'name' => $student->user->name,
                'nis' => $student->user->nomor_induk ?? $student->nisn ?? '-',
                'class_name' => $className,
                'musyrif_name' => $musyrifName,
            ],
            'stats' => [
                'total_juz' => $totalJuz,
                'completed_juz_list' => implode(', ', $completedJuzList) ?: '-',
                'total_pages' => $totalPages,
                'avg_speed' => $avgSpeed,
                'predicted_date' => $predictedDate
            ],
            'recentSetoran' => $recentSetoran->map(function($item) {
                return [
                    'date' => Carbon::parse($item->created_at)->translatedFormat('d M Y'),
                    'juz' => $item->juz,
                    'page_number' => $item->page_number,
                    'status' => $item->status,
                    'surah' => $item->surah_name ?? '-',
                    'mistakes' => $item->mistake_count
                ];
            }),
            'schoolName' => config('app.name', 'SIKAP'),
            'printDate' => $now->translatedFormat('d F Y')
        ]);
    }
}
