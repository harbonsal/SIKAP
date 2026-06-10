<?php

namespace App\Http\Controllers;

use App\Models\ActiveSubject;
use App\Models\GeneratedRpp;
use App\Models\TeachingMethod;
use App\Services\LiteLLMService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RppGeneratorController extends Controller
{
    protected $litellmService;

    public function __construct(LiteLLMService $litellmService)
    {
        $this->litellmService = $litellmService;
    }

    public function index()
    {
        $user = Auth::user();

        $query = GeneratedRpp::with(['activeSubject.mapel', 'activeSubject.activeClass.kelas', 'teachingMethod']);

        if (!$user->hasRole(['Administrator', 'Kepala Sekolah'])) {
            $query->where('user_id', $user->id);
        }

        $rpps = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Teacher/RppGenerator/Index', [
            'rpps' => $rpps
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        // Get subjects taught by user
        $query = ActiveSubject::with(['mapel', 'activeClass.kelas']);
        if (!$user->hasRole(['Administrator', 'Kepala Sekolah'])) {
            $query->where('teacher_id', $user->id);
        }

        $activeSubjects = $query->get()->map(function ($as) {
            return [
                'id' => $as->id,
                'label' => ($as->mapel->name ?? 'Unknown Mapel') . ' - ' . ($as->activeClass->name ?? 'Unknown Class'),
                'jenjang' => $as->activeClass->kelas->jenjang->name ?? '',
                'kelas_name' => $as->activeClass->name ?? '',
                'mapel_name' => $as->mapel->name ?? ''
            ];
        });

        $teachingMethods = TeachingMethod::where('is_active', true)->get();

        return Inertia::render('Teacher/RppGenerator/Create', [
            'activeSubjects' => $activeSubjects,
            'teachingMethods' => $teachingMethods
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'active_subject_id' => 'required',
            'topic' => 'required|string|max:255',
            'teaching_method_id' => 'required',
            'duration_minutes' => 'required|integer|min:10',
            'additional_notes' => 'nullable|string'
        ]);

        $activeSubject = ActiveSubject::with(['mapel', 'activeClass.kelas.jenjang'])->findOrFail($request->active_subject_id);
        $method = TeachingMethod::findOrFail($request->teaching_method_id);

        $jenjang = $activeSubject->activeClass->kelas->jenjang->name ?? 'Pesantren';
        $kelas = $activeSubject->activeClass->name ?? 'Santri';
        $mapel = $activeSubject->mapel->name ?? 'Pelajaran Umum';

        // Prepare context
        $prompt = "Buatkan Rencana Pelaksanaan Pembelajaran (RPP) / Modul Ajar yang kontekstual dan komprehensif untuk lingkungan Pesantren.\n";
        $prompt .= "Jenjang: {$jenjang}\n";
        $prompt .= "Kelas: {$kelas}\n";
        $prompt .= "Mata Pelajaran: {$mapel}\n";
        $prompt .= "Materi / Topik: {$request->topic}\n";
        $prompt .= "Durasi Pembelajaran: {$request->duration_minutes} menit\n";
        $prompt .= "Metode Pembelajaran yang dipilih: {$method->name} ({$method->description})\n";

        if ($request->additional_notes) {
            $prompt .= "Catatan Tambahan dari Guru: {$request->additional_notes}\n";
        }

        $prompt .= "\nStruktur RPP harus berupa HTML yang rapi, profesional, dan siap ditampilkan di web (gunakan tag HTML seperti <h1>, <h2>, <ul>, <ol>, <strong>, <table> dll, tanpa perlu tag <html>, <head>, atau <body>, cukup isinya saja). ";
        $prompt .= "Pastikan format output TIDAK dibungkus dalam markdown code block (jangan gunakan ```html). ";
        $prompt .= "Isi RPP minimal mencakup: \n";
        $prompt .= "1. Identitas Lengkap\n";
        $prompt .= "2. Tujuan Pembelajaran\n";
        $prompt .= "3. Langkah-Langkah Pembelajaran (Pendahuluan, Inti, Penutup) beserta durasi waktunya.\n";
        $prompt .= "4. Penilaian/Asesmen.\n";
        $prompt .= "Gunakan bahasa Indonesia yang baku namun nuansa keislaman/kepesantrenan (seperti mengucap salam, doa awal dan akhir majelis, dll) sangat ditekankan mengingat konteksnya adalah pondok pesantren.";

        // Available models, pick first allowed chat model, or fallback
        $modelName = 'gpt-4o-mini'; // default fallback
        $allowedModels = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        if ($allowedModels) {
            $allowedModels = json_decode($allowedModels, true);
            $enabledModels = array_keys(array_filter($allowedModels, function ($v, $k) {
                if ($v !== true) return false;
                $k = strtolower($k);
                return !str_contains($k, '-tts') && !str_contains($k, '-stt') && !str_contains($k, 'whisper');
            }, ARRAY_FILTER_USE_BOTH));
            if (!empty($enabledModels)) {
                $modelName = $enabledModels[0];
            }
        }

        try {
            // Because chatCompletion expects an array of messages
            $response = $this->litellmService->chatCompletion([
                ['role' => 'system', 'content' => 'Anda adalah ahli kurikulum dan RPP pendidikan Islam/Pesantren yang sangat berpengalaman.'],
                ['role' => 'user', 'content' => $prompt]
            ], $modelName);

            $resultHtml = $response['choices'][0]['message']['content'] ?? '';

            // Clean markdown HTML wrapper if any
            $resultHtml = preg_replace('/^```html/i', '', $resultHtml);
            $resultHtml = preg_replace('/```$/', '', $resultHtml);
            $resultHtml = trim($resultHtml);

            $rpp = GeneratedRpp::create([
                'user_id' => Auth::id(),
                'active_subject_id' => $request->active_subject_id,
                'topic' => $request->topic,
                'teaching_method_id' => $request->teaching_method_id,
                'duration_minutes' => $request->duration_minutes,
                'additional_notes' => $request->additional_notes,
                'ai_result_html' => $resultHtml,
            ]);

            return redirect()->route('rpp-generator.show', $rpp->id)->with('success', 'RPP berhasil di-generate.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghasilkan RPP: ' . $e->getMessage())->withInput();
        }
    }

    public function show($id)
    {
        $rpp = GeneratedRpp::with(['activeSubject.mapel', 'activeSubject.activeClass.kelas.jenjang', 'teachingMethod', 'user'])
            ->findOrFail($id);

        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Kepala Sekolah']) && $rpp->user_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('Teacher/RppGenerator/Show', [
            'rpp' => $rpp
        ]);
    }

    public function destroy($id)
    {
        $rpp = GeneratedRpp::findOrFail($id);

        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Kepala Sekolah']) && $rpp->user_id !== $user->id) {
            abort(403);
        }

        $rpp->delete();

        return redirect()->route('rpp-generator.index')->with('success', 'Riwayat RPP berhasil dihapus.');
    }
}
