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

        if ($user && $user->userLevel && in_array($user->userLevel->name, ['Santri', 'Siswa'])) {
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if ($student) {
                $allowedJuz = \App\Models\TahfidzMemorization::where('student_id', $student->id)
                    ->where('is_completed', true)
                    ->pluck('juz')
                    ->map(fn($juz) => (int) $juz)
                    ->toArray();
            } else {
                $allowedJuz = [];
            }
        }

        $quranProgress = [];
        if ($user) {
            try {
                $quranProgress = \App\Models\QuranProgress::where('user_id', $user->id)
                    ->get()
                    ->keyBy('juz_number')
                    ->toArray();
            } catch (\Exception $e) {
                // Log abaikan error jika tabel quran_progress belum di-migrate (karena fitur baru)
                // Ini mencegah halaman Skrining yang lama ikut rusak
                $quranProgress = [];
            }
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
            'is_completed' => 'nullable|boolean',
            'last_qari_id' => 'nullable|string',
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

        if (array_key_exists('last_qari_id', $validated)) {
            $progress->last_qari_id = $validated['last_qari_id'];
        }

        if (array_key_exists('played_ayahs', $validated)) {
            $now = now();
            $new = $validated['played_ayahs'] ?? [];
            
            // Deteksi jika ini adalah aksi "Mulai Ulang" (array kosong & last_verse_key null)
            $isMulaiUlang = empty($new) && array_key_exists('last_verse_key', $validated) && $validated['last_verse_key'] === null;
            
            if (!$progress->exists || !$progress->started_at || $isMulaiUlang) {
                $progress->started_at = $now;
            }
            
            $existing = $progress->played_ayahs ?? [];
            if (!is_array($existing)) $existing = [];
            if (!is_array($new)) $new = [];
            
            if ($isMulaiUlang) {
                $merged = [];
            } else {
                // Gunakan array_merge agar data lama TIDAK PERNAH HILANG meski frontend mengirim data parsial (cache lama)
                $merged = array_values(array_unique(array_merge($existing, $new)));
            }
            
            $progress->played_ayahs = $merged;
            $progress->last_activity_at = $now;
        }

        $progress->save();

        return response()->json([
            'success' => true,
            'data' => $progress
        ]);
    }

    public function reportAudioError(Request $request)
    {
        $validated = $request->validate([
            'qari_id' => 'required|string',
            'surah_number' => 'nullable|integer',
            'ayat_number' => 'nullable|integer',
            'verse_key' => 'nullable|string',
        ]);

        \App\Models\QuranAudioError::create(array_merge($validated, [
            'user_id' => auth()->id(),
        ]));

        return response()->json([
            'success' => true,
        ]);
    }

    public function hideQari(Request $request)
    {
        $validated = $request->validate([
            'qari_id' => 'required|string',
            'action' => 'required|in:hide,show',
        ]);

        $setting = \App\Models\Setting::firstOrCreate(
            ['key' => 'quran_hidden_qoris'],
            ['value' => json_encode([])]
        );

        $hiddenIds = json_decode($setting->value, true) ?: [];

        if ($validated['action'] === 'hide') {
            if (!in_array($validated['qari_id'], $hiddenIds)) {
                $hiddenIds[] = $validated['qari_id'];
            }
        } else {
            $hiddenIds = array_values(array_filter($hiddenIds, fn($id) => $id !== $validated['qari_id']));
        }

        $setting->value = json_encode($hiddenIds);
        $setting->save();

        return response()->json([
            'success' => true,
            'hidden_qori_ids' => $hiddenIds
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
