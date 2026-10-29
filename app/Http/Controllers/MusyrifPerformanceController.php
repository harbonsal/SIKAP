<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MusyrifDutyTemplate;
use App\Models\MusyrifDutyLog;
use App\Models\User;
use App\Models\ActiveKamar;
use App\Services\AcademicStateService;
use App\Exports\ArrayExport;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class MusyrifPerformanceController extends Controller
{
    /**
     * Halaman Logbook & Checklist Tugas Harian Musyrif (Tampilan Musyrif)
     */
    public function myLogbook(Request $request)
    {
        $user = Auth::user();
        $date = $request->input('date', Carbon::today()->toDateString());
        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek; // 0 = Ahad, 1 = Senin, dst.

        // Ambil Kamar yang diampu Musyrif ini
        $activeYear = AcademicStateService::currentAcademicYear();
        $myKamar = null;
        if ($activeYear) {
            $myKamar = ActiveKamar::with('kamar')
                ->where('academic_year_id', $activeYear->id)
                ->where('musrif_id', $user->id)
                ->first();
        }

        // Ambil Template Tugas yang berlaku untuk hari ini
        $allTemplates = MusyrifDutyTemplate::where('is_active', true)
            ->orderBy('order_num')
            ->get();

        $dutiesToday = $allTemplates->filter(function ($t) use ($dayOfWeek) {
            if ($t->applicable_days === 'all' || empty($t->applicable_days)) {
                return true;
            }
            $days = explode(',', $t->applicable_days);
            return in_array((string) $dayOfWeek, $days);
        })->values();

        // Ambil Log checklist musyrif ini pada tanggal yang dipilih
        $logs = MusyrifDutyLog::where('user_id', $user->id)
            ->where('date', $date)
            ->get()
            ->keyBy('duty_template_id');

        // Waktu saat ini untuk menentukan sesi yang sedang aktif
        $currentTime = Carbon::now()->format('H:i:s');
        $isToday = $carbonDate->isToday();

        $mappedDuties = $dutiesToday->map(function ($duty) use ($logs, $currentTime, $isToday) {
            $log = $logs->get($duty->id);
            $startTime = $duty->start_time;
            $endTime = $duty->end_time;

            // Cek apakah sesi ini adalah sesi yang sedang berjalan sekarang
            $isCurrentSession = false;
            if ($isToday) {
                $isCurrentSession = ($currentTime >= $startTime && $currentTime <= $endTime);
            }

            return [
                'id' => $duty->id,
                'title' => $duty->title,
                'category' => $duty->category,
                'start_time' => substr($duty->start_time, 0, 5),
                'end_time' => substr($duty->end_time, 0, 5),
                'target_description' => $duty->target_description,
                'order_num' => $duty->order_num,
                'is_current_session' => $isCurrentSession,
                'is_past_session' => $isToday ? ($currentTime > $endTime) : false,
                'status' => $log ? $log->status : 'pending', // 'completed', 'late', 'excused', 'pending'
                'checked_at' => $log && $log->checked_at ? $log->checked_at->format('H:i') : null,
                'checked_at_full' => $log && $log->checked_at ? $log->checked_at->format('d M Y H:i') : null,
                'notes' => $log ? $log->notes : '',
            ];
        });

        // Hitung Kepatuhan Hari Ini
        $totalDuties = $mappedDuties->count();
        $completedDuties = $mappedDuties->filter(fn($d) => in_array($d['status'], ['completed', 'late']))->count();
        $compliancePercent = $totalDuties > 0 ? round(($completedDuties / $totalDuties) * 100) : 0;

        // Riwayat Singkat 7 Hari Terakhir
        $sevenDaysHistory = [];
        for ($i = 6; $i >= 0; $i--) {
            $hDate = Carbon::today()->subDays($i)->toDateString();
            $hCarbon = Carbon::parse($hDate);
            $hDay = $hCarbon->dayOfWeek;

            $hApplicable = $allTemplates->filter(function ($t) use ($hDay) {
                return $t->applicable_days === 'all' || in_array((string)$hDay, explode(',', $t->applicable_days));
            })->count();

            $hDone = MusyrifDutyLog::where('user_id', $user->id)
                ->where('date', $hDate)
                ->whereIn('status', ['completed', 'late'])
                ->count();

            $sevenDaysHistory[] = [
                'date' => $hDate,
                'day_name' => $hCarbon->isoFormat('ddd'),
                'is_selected' => ($hDate === $date),
                'total' => $hApplicable,
                'done' => $hDone,
                'rate' => $hApplicable > 0 ? round(($hDone / $hApplicable) * 100) : 100,
            ];
        }

        return Inertia::render('Care/MusyrifPerformance/MyLogbook', [
            'date' => $date,
            'isToday' => $isToday,
            'formattedDate' => $carbonDate->isoFormat('dddd, D MMMM Y'),
            'duties' => $mappedDuties,
            'myKamar' => $myKamar ? ($myKamar->kamar?->name ?? 'Kamar Asrama') : 'Musyrif Asrama',
            'stats' => [
                'total' => $totalDuties,
                'completed' => $completedDuties,
                'compliance_rate' => $compliancePercent,
            ],
            'sevenDaysHistory' => $sevenDaysHistory,
        ]);
    }

    /**
     * Checklist Tugas atau Pembatalan (Simpan Cepat via AJAX/Inertia Post)
     */
    public function toggleCheck(Request $request)
    {
        $request->validate([
            'duty_template_id' => 'required|exists:musyrif_duty_templates,id',
            'date' => 'required|date',
            'status' => 'required|in:completed,late,excused,uncheck',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $date = $request->date;
        $dutyTemplateId = $request->duty_template_id;
        $status = $request->status;

        // Ambil Kamar aktif musyrif jika ada
        $activeYear = AcademicStateService::currentAcademicYear();
        $kamarId = null;
        if ($activeYear) {
            $kamarId = ActiveKamar::where('academic_year_id', $activeYear->id)
                ->where('musrif_id', $user->id)
                ->value('id');
        }

        if ($status === 'uncheck') {
            MusyrifDutyLog::where('user_id', $user->id)
                ->where('duty_template_id', $dutyTemplateId)
                ->where('date', $date)
                ->delete();

            return redirect()->back()->with('success', 'Tanda tugas berhasil dibatalkan.');
        }

        MusyrifDutyLog::updateOrCreate(
            [
                'user_id' => $user->id,
                'duty_template_id' => $dutyTemplateId,
                'date' => $date,
            ],
            [
                'active_kamar_id' => $kamarId,
                'status' => $status,
                'checked_at' => Carbon::now(),
                'notes' => $request->notes,
            ]
        );

        return redirect()->back()->with('success', 'Status tugas berhasil diperbarui.');
    }

    /**
     * Halaman Monitoring & Rekapitulasi Kinerja Musyrif (Tampilan Pimpinan / Admin / OSWAN)
     */
    public function monitorIndex(Request $request)
    {
        $user = Auth::user();

        // Tanggal dan Filter
        $date = $request->input('date', Carbon::today()->toDateString());
        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek;

        // Ambil Seluruh Musyrif (dari UserLevel Musrif / Musyrif / yang mengampu Kamar)
        $musyrifs = User::whereHas('userLevel', function ($q) {
            $q->whereIn('name', ['Musrif', 'Musyrif', 'Musrif Asrama']);
        })->orWhereHas('activeKamars', function ($q) {
            $q->whereNotNull('id');
        })->where('status', 'Aktif')
          ->orderBy('name')
          ->get(['id', 'name', 'nomor_induk']);

        // Jika tidak ada dari level, ambil semua user dengan kategori Musrif atau staff pengasuhan
        if ($musyrifs->isEmpty()) {
            $musyrifs = User::whereHas('userLevel', function ($q) {
                $q->where('category', 'Musrif');
            })->where('status', 'Aktif')->orderBy('name')->get(['id', 'name', 'nomor_induk']);
        }

        // Ambil Template Tugas Hari Tersebut
        $allTemplates = MusyrifDutyTemplate::where('is_active', true)
            ->orderBy('order_num')
            ->get();

        $dutiesToday = $allTemplates->filter(function ($t) use ($dayOfWeek) {
            if ($t->applicable_days === 'all' || empty($t->applicable_days)) return true;
            return in_array((string) $dayOfWeek, explode(',', $t->applicable_days));
        })->values();

        // Ambil seluruh log pada tanggal tersebut
        $logs = MusyrifDutyLog::where('date', $date)
            ->with('dutyTemplate')
            ->get();

        // Pemetaan Matriks Musyrif vs Tugas
        $activeYear = AcademicStateService::currentAcademicYear();
        $kamarsMap = [];
        if ($activeYear) {
            $kamarsMap = ActiveKamar::with('kamar')
                ->where('academic_year_id', $activeYear->id)
                ->get()
                ->keyBy('musrif_id');
        }

        $matrix = $musyrifs->map(function ($m) use ($dutiesToday, $logs, $kamarsMap) {
            $userLogs = $logs->where('user_id', $m->id)->keyBy('duty_template_id');
            $kamarName = $kamarsMap->get($m->id)?->kamar?->name ?? '-';

            $total = $dutiesToday->count();
            $completedCount = 0;
            $lateCount = 0;
            $excusedCount = 0;

            $dutiesStatus = [];
            foreach ($dutiesToday as $d) {
                $log = $userLogs->get($d->id);
                $status = $log ? $log->status : 'pending';
                if ($status === 'completed') $completedCount++;
                if ($status === 'late') $lateCount++;
                if ($status === 'excused') $excusedCount++;

                $dutiesStatus[$d->id] = [
                    'duty_id' => $d->id,
                    'status' => $status,
                    'checked_at' => $log && $log->checked_at ? $log->checked_at->format('H:i') : null,
                    'notes' => $log ? $log->notes : null,
                ];
            }

            $score = $total > 0 ? round((($completedCount + ($lateCount * 0.8)) / $total) * 100) : 100;

            return [
                'id' => $m->id,
                'name' => $m->name,
                'nomor_induk' => $m->nomor_induk ?? '-',
                'kamar' => $kamarName,
                'total_duties' => $total,
                'completed' => $completedCount,
                'late' => $lateCount,
                'excused' => $excusedCount,
                'pending' => $total - ($completedCount + $lateCount + $excusedCount),
                'score' => $score,
                'duties' => $dutiesStatus,
            ];
        });

        // Ringkasan Global
        $totalMusyrif = $musyrifs->count();
        $avgScore = $matrix->count() > 0 ? round($matrix->avg('score')) : 0;
        $totalCompletedAll = $logs->where('status', 'completed')->count();
        $totalLateAll = $logs->where('status', 'late')->count();

        return Inertia::render('Care/MusyrifPerformance/Monitoring', [
            'date' => $date,
            'formattedDate' => $carbonDate->isoFormat('dddd, D MMMM Y'),
            'duties' => $dutiesToday->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'category' => $d->category,
                'time_range' => substr($d->start_time, 0, 5) . ' - ' . substr($d->end_time, 0, 5),
            ]),
            'matrix' => $matrix,
            'summary' => [
                'total_musyrif' => $totalMusyrif,
                'avg_score' => $avgScore,
                'total_completed' => $totalCompletedAll,
                'total_late' => $totalLateAll,
            ],
        ]);
    }

    /**
     * Ekspor Data Rekapitulasi Kepatuhan Musyrif ke Excel (.xlsx)
     */
    public function exportExcel(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $carbonDate = Carbon::parse($date);
        $dayOfWeek = $carbonDate->dayOfWeek;

        $musyrifs = User::whereHas('userLevel', function ($q) {
            $q->whereIn('name', ['Musrif', 'Musyrif', 'Musrif Asrama']);
        })->orWhereHas('activeKamars', function ($q) {
            $q->whereNotNull('id');
        })->where('status', 'Aktif')
          ->orderBy('name')
          ->get();

        $allTemplates = MusyrifDutyTemplate::where('is_active', true)->orderBy('order_num')->get();
        $dutiesToday = $allTemplates->filter(function ($t) use ($dayOfWeek) {
            return $t->applicable_days === 'all' || in_array((string)$dayOfWeek, explode(',', $t->applicable_days));
        })->values();

        $logs = MusyrifDutyLog::where('date', $date)->get();

        $headings = ['No', 'Nama Musyrif', 'Nomor Induk'];
        foreach ($dutiesToday as $d) {
            $headings[] = $d->title . ' (' . substr($d->start_time, 0, 5) . '-' . substr($d->end_time, 0, 5) . ')';
        }
        $headings[] = 'Total Tugas';
        $headings[] = 'Selesai';
        $headings[] = 'Terlambat';
        $headings[] = 'Izin';
        $headings[] = 'Belum';
        $headings[] = 'Skor Kepatuhan (%)';

        $dataRows = [];
        $no = 1;

        foreach ($musyrifs as $m) {
            $userLogs = $logs->where('user_id', $m->id)->keyBy('duty_template_id');
            $row = [
                $no++,
                $m->name,
                $m->nomor_induk ?? '-',
            ];

            $done = 0;
            $late = 0;
            $excused = 0;

            foreach ($dutiesToday as $d) {
                $l = $userLogs->get($d->id);
                if (!$l) {
                    $row[] = 'Belum';
                } elseif ($l->status === 'completed') {
                    $done++;
                    $row[] = 'Hadir (' . ($l->checked_at ? $l->checked_at->format('H:i') : '-') . ')';
                } elseif ($l->status === 'late') {
                    $late++;
                    $row[] = 'Terlambat (' . ($l->checked_at ? $l->checked_at->format('H:i') : '-') . ')';
                } elseif ($l->status === 'excused') {
                    $excused++;
                    $row[] = 'Izin (' . ($l->notes ?: 'Izin') . ')';
                } else {
                    $row[] = '-';
                }
            }

            $total = $dutiesToday->count();
            $pending = $total - ($done + $late + $excused);
            $score = $total > 0 ? round((($done + ($late * 0.8)) / $total) * 100) : 100;

            $row[] = $total;
            $row[] = $done;
            $row[] = $late;
            $row[] = $excused;
            $row[] = $pending;
            $row[] = $score . '%';

            $dataRows[] = $row;
        }

        $fileName = 'Rekap_Kinerja_Musyrif_' . $date . '.xlsx';
        return Excel::download(new ArrayExport($dataRows, $headings), $fileName);
    }
}

