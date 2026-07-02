<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TahfidzMusyrif;
use App\Models\TahfidzMemorizationDetail;
use App\Models\Student;
use Carbon\Carbon;
use DB;

class TahfidzDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $musyrifsQuery = TahfidzMusyrif::with('user', 'student');
        
        // Jika bukan admin/pengurus tahfidz, musyrif hanya bisa melihat dashboard miliknya sendiri
        if (!$user->can('manage_tahfidz_settings') && !$user->hasRole('admin')) {
            $studentId = $user->student?->id;
            if ($studentId) {
                $musyrifsQuery->where('student_id', $studentId)->orWhere('user_id', $user->id);
            } else {
                $musyrifsQuery->where('user_id', $user->id);
            }
        }

        $musyrifs = $musyrifsQuery->get();
        $selectedMusyrifId = $request->get('musyrif_id', $musyrifs->first()?->id);
        
        $dashboardData = [];
        
        if ($selectedMusyrifId) {
            $halaqohStudentIds = \App\Models\TahfidzHalaqohMember::where('musyrif_id', $selectedMusyrifId)
                                    ->pluck('student_id')
                                    ->toArray();
                                    
            // A. Status Setoran (Belum Setor Hari Ini)
            $todayDetails = TahfidzMemorizationDetail::whereIn('student_id', $halaqohStudentIds)
                                ->whereDate('updated_at', Carbon::today())
                                ->pluck('student_id')
                                ->unique()
                                ->toArray();
                                
            $belumSetorHariIni = Student::with('user', 'classMembers.activeClass')
                                ->whereIn('id', array_diff($halaqohStudentIds, $todayDetails))
                                ->get()
                                ->map(function($s) {
                                    return [
                                        'id' => $s->id,
                                        'name' => $s->user->name,
                                        'class' => $s->classMembers->last()?->activeClass?->name ?? '-'
                                    ];
                                });
                                
            // B. Mistake Tracker (Top Kesalahan)
            $mistakes = TahfidzMemorizationDetail::whereIn('student_id', $halaqohStudentIds)
                                ->where('mistake_count', '>', 0)
                                ->with('student.user')
                                ->orderByDesc('mistake_count')
                                ->take(10)
                                ->get()
                                ->map(function($m) {
                                    return [
                                        'student_name' => $m->student->user->name,
                                        'surah' => $m->surah_name,
                                        'ayat' => $m->verse_key,
                                        'juz' => $m->juz,
                                        'page' => $m->page_number,
                                        'count' => $m->mistake_count,
                                        'history' => $m->mistakes_history
                                    ];
                                });
                                
            $dashboardData['belum_setor'] = $belumSetorHariIni;
            $dashboardData['mistakes'] = $mistakes;
        }

        // C. Leaderboard Halaqoh (Penambahan Halaman Bulan Ini)
        $leaderboard = [];
        $startOfMonth = Carbon::now()->startOfMonth();
        
        $monthlyDetails = TahfidzMemorizationDetail::where('updated_at', '>=', $startOfMonth)
                            ->where('status', 'full') 
                            ->select('student_id', DB::raw('count(*) as pages_added'))
                            ->groupBy('student_id')
                            ->get()
                            ->keyBy('student_id');
                            
        $allMusyrifs = TahfidzMusyrif::with('user', 'student', 'members')->get();
        foreach($allMusyrifs as $m) {
            $totalAdded = 0;
            $memberCount = $m->members->count();
            if ($memberCount > 0) {
                foreach($m->members as $member) {
                    if (isset($monthlyDetails[$member->student_id])) {
                        $totalAdded += $monthlyDetails[$member->student_id]->pages_added;
                    }
                }
                $leaderboard[] = [
                    'musyrif_name' => $m->student ? $m->student->name : ($m->user ? $m->user->name : 'Unknown'),
                    'total_pages' => $totalAdded,
                    'avg_pages' => round($totalAdded / $memberCount, 1)
                ];
            }
        }
        
        usort($leaderboard, function($a, $b) {
            return $b['avg_pages'] <=> $a['avg_pages'];
        });

        $dashboardData['leaderboard'] = array_slice($leaderboard, 0, 10);
        
        return Inertia::render('Tahfidz/Dashboard/Index', [
            'musyrifs' => $musyrifs->map(fn($m) => [
                'id' => $m->id, 
                'name' => $m->student ? $m->student->name : ($m->user ? $m->user->name : 'Ust. '.$m->user?->name)
            ]),
            'selected_musyrif_id' => $selectedMusyrifId,
            'dashboard_data' => $dashboardData
        ]);
    }


    public function startSession(Request $request)
    {
        $user = auth()->user();
        
        $musyrif = TahfidzMusyrif::where('user_id', $user->id)
                ->orWhere('student_id', $user->student?->id)
                ->first();

        if (!$musyrif) {
            return redirect()->back()->with('error', 'Anda tidak terdaftar sebagai Musyrif aktif.');
        }

        // Ambil sesi pertama yang sedang berjalan atau sesi default
        $session = \App\Models\TahfidzHalaqohSession::first();
        if (!$session) {
            return redirect()->back()->with('error', 'Belum ada sesi halaqoh yang dikonfigurasi di pengaturan.');
        }

        // Cek apakah sudah absen hari ini
        $todayMonitoring = \App\Models\TahfidzMonitoring::whereDate('recorded_at', Carbon::today())
                            ->whereHas('attendances', function($q) use ($musyrif) {
                                $q->where('musyrif_id', $musyrif->id);
                            })->first();

        if (!$todayMonitoring) {
            DB::transaction(function () use ($user, $session, $musyrif) {
                $monitoring = \App\Models\TahfidzMonitoring::create([
                    'user_id' => $user->id,
                    'session_id' => $session->id,
                    'recorded_at' => Carbon::now(),
                    'general_note' => 'Halaqoh dimulai via Quick Access Dashboard',
                ]);

                \App\Models\TahfidzMonitoringAttendance::create([
                    'monitoring_id' => $monitoring->id,
                    'musyrif_id' => $musyrif->id,
                    'status' => 'Hadir',
                ]);
            });
        }

        // Redirect ke Input Setoran dengan memfilter santri sesuai musyrif
        return redirect()->route('tahfidz.achievements.index', ['musyrif_id' => $musyrif->id])
                         ->with('success', 'Sesi halaqoh dimulai, presensi Anda sudah dicatat!');
    }
}
