<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CharacterSettingController extends Controller
{
    public function index()
    {
        // Ambil data active months, default kosong array jika belum ada
        $activeMonthsRaw = Setting::where('key', 'character_active_months')->value('value');
        
        $activeMonths = [];
        if ($activeMonthsRaw) {
            $activeMonths = json_decode($activeMonthsRaw, true);
            if (!is_array($activeMonths)) {
                $activeMonths = [];
            }
        }

        return Inertia::render('Settings/Character/Index', [
            'activeMonths' => $activeMonths,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'months' => 'nullable|array',
            'months.*' => 'integer|min:1|max:12',
        ]);

        $months = $request->months ?? [];

        // Konversi semua elemen ke integer dan hapus duplikat jika ada
        $months = collect($months)->map(fn($m) => (int)$m)->unique()->values()->toArray();

        Setting::updateOrCreate(
            ['key' => 'character_active_months'],
            ['value' => json_encode($months)]
        );

        // Clear api cache jika diperlukan (opsional, karena biasanya grade caching ditangani di layer yang berbeda)
        // \Cache::forget('api_grades_*');

        return redirect()->back()->with('success', 'Pengaturan bulan aktif untuk Pantauan Akhlak berhasil disimpan.');
    }
}
