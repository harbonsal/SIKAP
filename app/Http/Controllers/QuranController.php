<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuranController extends Controller
{
    public function index(Request $request)
    {
        return redirect()->route($this->isSkriningEnabled() ? 'quran.skrining' : 'quran.tilawah');
    }

    public function skrining(Request $request)
    {
        // Force fresh read from database to ensure latest setting
        $settingValue = \App\Models\Setting::where('key', 'quran_skrining_enabled')->value('value');
        $isEnabled = $settingValue !== '0';

        // If disabled, render page with disabled state instead of redirect
        if (!$isEnabled) {
            return Inertia::render('Quran/Index', array_merge([
                'allowed_juz' => [],
                'quran_progress' => [],
                'skrining_disabled' => true,
                'skrining_disabled_message' => 'Mohon maaf, fitur Skrining Al-Quran sedang dinonaktifkan sementara oleh manajemen Tahfidz. Anda dapat menggunakan mode Tilawah untuk membaca dan mendengarkan Al-Quran.',
            ], $this->getSharedProps()));
        }

        $allowedJuz = null;
        $user = auth()->user();

        if ($user && $user->user_level && in_array($user->user_level->name, ['Santri', 'Siswa'])) {
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if ($student) {
                $allowedJuz = \App\Models\TahfidzMemorization::where('student_id', $student->id)
                    ->where('is_completed', true)
                    ->pluck('juz')
                    ->toArray();
            } else {
                $allowedJuz = [];
            }
        }

        $quranProgress = [];
        if ($user) {
            $quranProgress = \App\Models\QuranProgress::where('user_id', $user->id)
                ->get()
                ->keyBy('juz_number')
                ->toArray();
        }

        return Inertia::render('Quran/Index', array_merge([
            'allowed_juz' => $allowedJuz,
            'quran_progress' => $quranProgress,
        ], $this->getSharedProps()));
    }

    public function tilawah(Request $request)
    {
        return Inertia::render('Quran/Tilawah', $this->getSharedProps());
    }

    private function getSharedProps(): array
    {
        $user = auth()->user();
        $hiddenQorisSetting = \App\Models\Setting::where('key', 'quran_hidden_qoris')->first();
        $hiddenQoriIds = $hiddenQorisSetting ? json_decode($hiddenQorisSetting->value, true) : [];

        if (!is_array($hiddenQoriIds)) {
            $hiddenQoriIds = [];
        }

        return [
            'is_admin' => $user ? $user->hasRole('Administrator') : false,
            'hidden_qori_ids' => $hiddenQoriIds,
        ];
    }

    private function isSkriningEnabled(): bool
    {
        // Force fresh read from database
        $settingValue = Setting::where('key', 'quran_skrining_enabled')->value('value');
        return $settingValue !== '0';
    }

    public function saveSetting(Request $request)
    {
        $user = auth()->user();

        if (!$user || !$user->hasRole('Administrator')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'key' => 'required|string',
            'value' => 'nullable',
        ]);

        $value = $validated['value'];
        if (is_array($value)) {
            $value = json_encode($value);
        }

        \App\Models\Setting::updateOrCreate(
            ['key' => $validated['key']],
            ['value' => $value]
        );

        return response()->json(['success' => true]);
    }

    public function saveProgress(Request $request)
    {
        $validated = $request->validate([
            'juz_number' => 'required|integer|min:1|max:30',
            'last_verse_key' => 'nullable|string',
            'last_page_number' => 'nullable|integer',
            'played_ayahs' => 'nullable|array',
            'is_completed' => 'nullable|boolean'
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $progress = \App\Models\QuranProgress::firstOrNew([
            'user_id' => $user->id,
            'juz_number' => $validated['juz_number']
        ]);

        if (array_key_exists('last_verse_key', $validated)) {
            $progress->last_verse_key = $validated['last_verse_key'];
        }

        if (array_key_exists('last_page_number', $validated)) {
            $progress->last_page_number = $validated['last_page_number'];
        }

        if (array_key_exists('played_ayahs', $validated)) {
            // Merge new played ayahs with existing
            $existing = $progress->played_ayahs ?? [];
            $new = $validated['played_ayahs'] ?? [];
            $merged = array_unique(array_merge($existing, $new));
            $progress->played_ayahs = array_values($merged);
        }

        if (array_key_exists('is_completed', $validated) && $validated['is_completed'] !== null) {
            $progress->is_completed = $validated['is_completed'];
        }

        $progress->save();

        return response()->json([
            'success' => true,
            'data' => $progress
        ]);
    }

    public function manualCompleteProgress(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'juz_number' => 'required|integer|min:1|max:30',
        ]);

        $user = auth()->user();
        if (!$user || !$user->hasRole(['Administrator', 'Manager Tahfidz', 'Musrif', 'Kepala Sekolah', 'Guru'])) {
            return redirect()->back()->with('error', 'Anda tidak memiliki otoritas untuk melakukan aksi ini.');
        }

        $student = \App\Models\Student::find($validated['student_id']);

        $progress = \App\Models\QuranProgress::firstOrNew([
            'user_id' => $student->user_id,
            'juz_number' => $validated['juz_number']
        ]);

        $progress->is_completed = true;
        // Opsional: rekam info by admin di suatu tempat jika perlu
        $progress->save();

        // Tambahkan record ke HafalanSkriningReport agar muncul di tabel admin
        \App\Models\HafalanSkriningReport::updateOrCreate(
            ['user_id' => $student->user_id, 'juz_number' => $validated['juz_number']],
            ['total_mistakes' => 0]
        );

        return redirect()->back()->with('success', 'Skrining berhasil diselesaikan secara manual untuk Santri tersebut di Juz ' . $validated['juz_number']);
    }
}
