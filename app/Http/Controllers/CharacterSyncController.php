<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\CharacterAssessment;
use App\Models\CharacterCategory;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class CharacterSyncController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Sync/Character');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'nullable|file',
            'file_path' => 'nullable|string',
        ]);

        if ($request->hasFile('file')) {
            $content = file_get_contents($request->file('file')->getRealPath());
        } elseif ($request->filled('file_path')) {
            $path = $request->input('file_path');
            if (!file_exists($path)) {
                return response()->json(['message' => "File tidak ditemukan di path: $path"], 404);
            }
            $content = file_get_contents($path);
        } else {
            return response()->json(['message' => 'Harap upload file atau isi path file.'], 400);
        }

        // Ensure UTF-8
        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'ISO-8859-1');
        }

        // Regex to find INSERT INTO statements. 
        // We will try to detect the table name or just grab all inserts.
        // Assuming user provides a dump like `INSERT INTO tb_nilai_akhlak ...`

        preg_match_all('/INSERT INTO `?(\w+)`?.*?VALUES \((.*?)\);/s', $content, $matches);

        $rows = [];
        $tableName = $matches[1][0] ?? 'Unknown';

        if (!empty($matches[2])) {
            foreach ($matches[2] as $block) {
                // Split by "),(" or "), ("
                $records = preg_split('/\),\s*\(/', $block);
                foreach ($records as $record) {
                    $record = trim($record, "()");
                    // Parse CSV line respecting quotes
                    $fields = str_getcsv($record, ',', "'");

                    // WE NEED TO KNOW THE COLUMN MAPPING.
                    // Since we don't know the exact legacy structure, we will return the raw fields of the first few rows
                    // so the user (or I) can map them in the next step, OR I'll try to auto-detect if standard.

                    // For now, let's store the raw fields and try to guess.
                    // Legacy Format Guess: ID, NIS/ID_Siswa, Bulan, Tahun, Val1, Val2...

                    $rows[] = $fields;
                }
            }
        }

        // Cache the rows
        $cacheKey = 'sync_akhlak_' . auth()->id();
        Cache::put($cacheKey, $rows, 3600); // 1 hour

        // Analyze Columns from first row
        $sample = $rows[0] ?? [];

        return response()->json([
            'table_name' => $tableName,
            'total_rows' => count($rows),
            'sample_row' => $sample,
            'message' => 'File uploaded. Please confirm column mapping.',
            'file_snippet' => substr($content, 0, 2000) // DEBUG: See what the file looks like
        ]);
    }

    public function sync(Request $request)
    {
        // This will be implemented after we see the sample data structure
        return redirect()->back()->with('error', 'Sync logic not yet implemented. Please share the sample structure.');
    }
}
