<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HafalanSkrining;
use App\Models\HafalanSkriningReport;
use Illuminate\Support\Facades\Auth;

class HafalanSkriningReportController extends Controller
{
    /**
     * Store a new report summarizing all unfinished screenings for a specific Juz.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'juz_number' => 'required|integer|min:1|max:30',
        ]);

        $userId = Auth::id();
        $juzNumber = $validated['juz_number'];

        // --- ANTI-CHEAT VALIDATION ---
        $progress = \App\Models\QuranProgress::where('user_id', $userId)
            ->where('juz_number', $juzNumber)
            ->first();

        if (!$progress) {
            return response()->json(['success' => false, 'message' => 'Anda belum memulai pemutaran Juz ini.'], 400);
        }

        // --- ANTI-CHEAT VALIDATION (NEW LOGIC) ---
        $playedCount = is_array($progress->played_ayahs) ? count($progress->played_ayahs) : 0;
        
        // HARD BLOCK: Jika ayat kurang dari 20, ini murni "Nembak Halaman Terakhir" karena 1 halaman = max ~15 ayat.
        if ($playedCount < 20) {
            return response()->json([
                'success' => false, 
                'message' => 'Sistem mendeteksi lompatan halaman. Harap dengarkan seluruh ayat dari awal hingga akhir juz tanpa di-skip.'
            ], 400);
        }

        // SOFT FLAG: Jika ayat >= 20, kita biarkan lolos (tidak error) demi menyelamatkan santri yang HP-nya sleep.
        // Guru/Admin bisa menganulirnya nanti lewat Tab "Analisa Kecurangan" jika terbukti ada gelagat curang dari durasi.
        // --- END ANTI-CHEAT ---

        // Get all unassigned screenings for this user and juz
        $unassignedSkrinings = HafalanSkrining::where('user_id', $userId)
            ->where('juz_number', $juzNumber)
            ->whereNull('hafalan_skrining_report_id')
            ->get();

        // Calculate total mistakes
        $totalMistakes = $unassignedSkrinings->count();

        // Create the report
        $report = HafalanSkriningReport::create([
            'user_id' => $userId,
            'juz_number' => $juzNumber,
            'total_mistakes' => $totalMistakes,
        ]);

        if ($totalMistakes > 0) {
            // Assign all these screenings to the new report
            HafalanSkrining::whereIn('id', $unassignedSkrinings->pluck('id'))
                ->update(['hafalan_skrining_report_id' => $report->id]);
        }

        // Update quran_progress
        \App\Models\QuranProgress::updateOrCreate(
            ['user_id' => $userId, 'juz_number' => $juzNumber],
            ['is_completed' => true]
        );

        $message = $totalMistakes > 0
            ? "Laporan Skrining Hafalan Juz {$juzNumber} berhasil dibuat dengan {$totalMistakes} kesalahan."
            : "Juz {$juzNumber} berhasil diselesaikan dengan 0 kesalahan. Alhamdulillah!";

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $report
        ]);
    }
}
