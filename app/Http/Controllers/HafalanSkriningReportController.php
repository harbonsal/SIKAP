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
