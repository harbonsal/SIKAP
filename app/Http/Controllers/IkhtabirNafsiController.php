<?php

namespace App\Http\Controllers;

use App\Models\IkhtabirNafsiAttempt;
use App\Models\IkhtabirNafsiMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Services\LiteLLMService;

class IkhtabirNafsiController extends Controller
{
    protected $litellmService;

    public function __construct(LiteLLMService $litellmService)
    {
        $this->litellmService = $litellmService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        // Check if manager (Administrator or Kepala Sekolah)
        $isManager = $user->hasRole(['Administrator', 'Kepala Sekolah']);

        $query = IkhtabirNafsiAttempt::query();

        if ($isManager) {
            // Admin sees all, with optional filtering
            $query->with('user'); // Load user info

            if ($request->has('user_id') && $request->user_id) {
                $query->where('user_id', $request->user_id);
            }
        } else {
            // Teacher sees only own
            $query->where('user_id', $user->id);
        }

        $attempts = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        // Get list of teachers for filter dropdown (User with attempts)
        $teachers = [];
        if ($isManager) {
            $teacherIds = IkhtabirNafsiAttempt::distinct()->pluck('user_id');
            $teachers = \App\Models\User::whereIn('id', $teacherIds)->select('id', 'name')->get();
        }

        // Fetch Models from LiteLLM
        $litellmModels = $this->litellmService->fetchAvailableModels();

        // Fetch allowed_models setting from DB
        $allowedModelsSetting = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        $allowedModels = $allowedModelsSetting ? json_decode($allowedModelsSetting, true) : [];

        // Determine active model for display (Filter out TTS/STT)
        $activeModelName = null;
        if (!empty($allowedModels)) {
            $enabled = array_keys(array_filter($allowedModels, function ($v, $k) {
                if ($v !== true) return false;
                $k = strtolower($k);
                return !str_contains($k, '-tts') && !str_contains($k, '-stt') && !str_contains($k, 'whisper');
            }, ARRAY_FILTER_USE_BOTH));
            $activeModelName = $enabled[0] ?? null;
        }

        // Check Feature Status
        $featureActive = \App\Models\Setting::where('key', 'ikhtabir_nafsi_active')->value('value') === 'true';

        return Inertia::render('Teacher/IkhtabirNafsi/Index', [
            'attempts'        => $attempts,
            'is_manager'      => $isManager,
            'teachers'        => $teachers,
            'filters'         => $request->only(['user_id']),
            'feature_active'  => $featureActive,
            'status'          => [
                'litellm_ready' => !empty(config('services.litellm.api_key')),
            ],
            'available_models' => $litellmModels,
            'allowed_models'   => $allowedModels,
            'active_model'     => $activeModelName,
        ]);
    }

    public function toggleStatus(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Kepala Sekolah'])) {
            return abort(403);
        }

        $current = \App\Models\Setting::where('key', 'ikhtabir_nafsi_active')->value('value');
        $newState = ($current === 'true') ? 'false' : 'true';

        \App\Models\Setting::updateOrCreate(
            ['key' => 'ikhtabir_nafsi_active'],
            ['value' => $newState]
        );

        return back()->with('success', 'Status Ikhtabir Nafsi berhasil diubah.');
    }

    public function store(Request $request)
    {
        // Auto-clean abandoned sessions for this user (not ended, older than 1 hour)
        IkhtabirNafsiAttempt::where('user_id', Auth::id())
            ->whereNull('ended_at')
            ->where('created_at', '<', now()->subHour())
            ->delete();

        // Select Topic
        $topic = null;

        // Admin Override for Testing (e.g. force Topik Bebas even if inactive)
        if ($request->has('topic_id') && Auth::user()->hasRole(['Administrator', 'Kepala Sekolah'])) {
            $topic = \App\Models\IkhtabirNafsiTopic::find($request->topic_id);
        }

        // Random Active Topic (Default)
        if (!$topic) {
            $userId = Auth::id();

            // 1. Get IDs of topics this user has already attempted
            $attemptedTopicIds = IkhtabirNafsiAttempt::where('user_id', $userId)
                ->whereNotNull('topic_id')
                ->pluck('topic_id')
                ->toArray();

            // 2. Get all active topics
            $activeTopics = \App\Models\IkhtabirNafsiTopic::where('active', true)->get();

            if ($activeTopics->count() > 0) {
                // 3. Count global usage for each topic to prevent domination
                $topicCounts = IkhtabirNafsiAttempt::whereNotNull('topic_id')
                    ->selectRaw('topic_id, count(*) as count')
                    ->groupBy('topic_id')
                    ->pluck('count', 'topic_id')
                    ->toArray();

                // 4. Try to find topics the user hasn't attempted yet
                $unattemptedTopics = $activeTopics->filter(function ($t) use ($attemptedTopicIds) {
                    return !in_array($t->id, $attemptedTopicIds);
                });

                if ($unattemptedTopics->count() > 0) {
                    // Among unattempted topics, find the ones with the lowest global usage
                    $unattemptedTopics = $unattemptedTopics->map(function ($t) use ($topicCounts) {
                        $t->usage_count = $topicCounts[$t->id] ?? 0;
                        return $t;
                    });

                    $minCount = $unattemptedTopics->min('usage_count');
                    $leastUsedTopics = $unattemptedTopics->filter(function ($t) use ($minCount) {
                        return $t->usage_count === $minCount;
                    });

                    $topic = $leastUsedTopics->random();
                } else {
                    // If user has attempted all active topics, fallback to globally least used
                    $topicsWithCounts = $activeTopics->map(function ($t) use ($topicCounts) {
                        $t->usage_count = $topicCounts[$t->id] ?? 0;
                        return $t;
                    });

                    $minCount = $topicsWithCounts->min('usage_count');
                    $leastUsedTopics = $topicsWithCounts->filter(function ($t) use ($minCount) {
                        return $t->usage_count === $minCount;
                    });

                    $topic = $leastUsedTopics->random();
                }
            }
        }

        // Use Admin-configured model — pick first enabled model from settings
        $allowedModels = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        $allowedModels = $allowedModels ? json_decode($allowedModels, true) : [];

        // Filter only enabled (value === true) and ensure it's a chat model (avoid TTS/STT if somehow saved)
        $enabledModels = array_keys(array_filter($allowedModels, function ($v, $k) {
            if ($v !== true) return false;
            $k = strtolower($k);
            return !str_contains($k, '-tts') && !str_contains($k, '-stt') && !str_contains($k, 'whisper');
        }, ARRAY_FILTER_USE_BOTH));

        $modelName = $enabledModels[0] ?? 'gpt-3.5-turbo'; // fallback

        // Start a new session
        $attempt = IkhtabirNafsiAttempt::create([
            'user_id'    => Auth::id(),
            'session_id' => (string) Str::uuid(),
            'ai_model'   => 'litellm',
            'model_name' => $modelName,
            'topic_id'   => $topic ? $topic->id : null,
            'topic_text' => $topic ? $topic->text_ar : null,
        ]);

        return redirect()->route('ikhtabir-nafsi.session', $attempt->session_id);
    }

    public function updateModels(Request $request)
    {
        $request->validate([
            'model' => 'required|string',
            'value' => 'required|boolean'
        ]);

        $setting = \App\Models\Setting::firstOrCreate(
            ['key' => 'ikhtabir_allowed_models'],
            ['value' => json_encode([])]
        );

        $current = json_decode($setting->value, true) ?? [];
        $current[$request->model] = $request->value;

        $setting->update(['value' => json_encode($current)]);

        return back()->with('success', 'Pengaturan model berhasil diperbarui.');
    }

    public function cleanupAbandoned(Request $request)
    {
        // Only admin/kepala sekolah can bulk-clean
        abort_unless(Auth::user()->hasRole(['Administrator', 'Kepala Sekolah']), 403);

        $query = IkhtabirNafsiAttempt::whereNull('ended_at');

        // Optional: filter by specific user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $deleted = $query->delete();

        return back()->with('success', "$deleted sesi yang tidak selesai berhasil dihapus.");
    }

    public function session($sessionId)
    {
        $attempt = IkhtabirNafsiAttempt::where('session_id', $sessionId)
            ->with(['messages' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->firstOrFail();

        if ($attempt->user_id != Auth::id()) {
            return abort(403);
        }

        if ($attempt->ended_at) {
            return redirect()->route('ikhtabir-nafsi.show', $attempt->id);
        }

        return Inertia::render('Teacher/IkhtabirNafsi/ChatSession', [
            'attempt' => $attempt,
            'messages' => $attempt->messages
        ]);
    }

    public function sendAudio(Request $request, $sessionId)
    {
        try {
            // Increase execution time for long audio processing (5 minutes)
            set_time_limit(300);

            // 0. Manual Validation to catch upload errors before strict validation
            if (!$request->hasFile('audio')) {
                \Illuminate\Support\Facades\Log::error("Audio Upload Failed: No file present in request. Possible post_max_size exceeded.");
                return response()->json(['message' => 'Gagal Upload: File audio tidak terdeteksi (Mungkin terlalu besar).'], 422);
            }

            $request->validate([
                'audio' => 'required|file|mimes:mp3,wav,webm,m4a',
            ]);

            $attempt = IkhtabirNafsiAttempt::where('session_id', $sessionId)->firstOrFail();

            // 1. Save User Audio
            $file = $request->file('audio');
            if (!$file->isValid()) {
                throw new \Exception("File audio corupt atau gagal diupload (Error Check).");
            }

            $size = $file->getSize();
            \Illuminate\Support\Facades\Log::info("Audio Upload Success. Session: $sessionId. Size: " . $size . " bytes. MIME: " . $file->getMimeType());

            $path = $file->store('ikhtabir_nafsi_audio', 'public');

            // 2. Save User Message
            $userMsg = IkhtabirNafsiMessage::create([
                'attempt_id' => $attempt->id,
                'role' => 'user',
                'content' => '[Audio Message]',
                'audio_path' => $path
            ]);

            // 3. Get History for Context
            $history = $attempt->messages()->orderBy('created_at', 'asc')->get()->map(function ($m) {
                return ['role' => $m->role, 'content' => $m->content];
            })->toArray();

            // Prepend Topic context
            if ($attempt->topic_text) {
                array_unshift($history, ['role' => 'system', 'content' => '', 'topic_text' => $attempt->topic_text]);
            }

            // 4. Call AI Service (LiteLLM Only)
            $transcription = $this->litellmService->transcribeAudio(storage_path('app/public/' . $path));

            if (!$transcription['success']) {
                \Illuminate\Support\Facades\Log::error("Transcription Failed: " . ($transcription['error'] ?? 'Unknown Error'));
                return response()->json([
                    'message' => 'Gagal transkripsi audio. Layanan STT sedang bermasalah, silakan coba lagi.'
                ], 500);
            }

            $result = $this->litellmService->analyzeAudioSession($transcription['text'], $history, $attempt->model_name ?? 'gpt-3.5-turbo');

            // Inject user transcript so we can save it below
            $result['user_transcript'] = $transcription['text'];

            // 5. Save AI Response
            $aiMsg = IkhtabirNafsiMessage::create([
                'attempt_id' => $attempt->id,
                'role' => 'assistant',
                'content' => $result['response_text'],
                'metadata' => $result['feedback'] ?? null
            ]);

            // 6. Update User Message with Transcript
            if (!empty($result['user_transcript'])) {
                $userMsg->update(['content' => $result['user_transcript']]);
            }

            return response()->json([
                'success' => true,
                'response_text' => $result['response_text'],
                'user_transcript' => $result['user_transcript'] ?? '[Audio Message]',
                'feedback' => $result['feedback'] ?? null,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Audio Processing Error (Controller): " . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());

            // Standardize error response
            return response()->json([
                'message' => 'Server error: Terjadi gangguan saat memproses audio. Silakan coba lagi.'
            ], 500);
        }
    }

    public function finishSession(Request $request, $sessionId)
    {
        $attempt = IkhtabirNafsiAttempt::where('session_id', $sessionId)->firstOrFail();

        // 1. Get full history
        $history = $attempt->messages()->orderBy('created_at', 'asc')->get()->map(function ($m) {
            return ['role' => $m->role, 'content' => $m->content];
        })->toArray();

        // Prepend topic context so final analysis can evaluate topic relevance correctly.
        if ($attempt->topic_text) {
            array_unshift($history, ['role' => 'system', 'content' => '', 'topic_text' => $attempt->topic_text]);
        }

        // 2. Calculate Final Scores based on AI Model
        $primaryScores = [];
        $secondaryScores = [];

        try {
            // Always use LiteLLM
            $primaryScores = $this->litellmService->analyzeFinalSession($history, $attempt->model_name ?? 'gpt-3.5-turbo');
        } catch (\Exception $e) {
            // Log error but allow page to load with partial data
            \Illuminate\Support\Facades\Log::error("Final Analysis Failed: " . $e->getMessage());
        }

        // Prepare Supervisor Note merging Topic Relevance
        $supervisorNote = $primaryScores['supervisor_note'] ?? [];
        if (isset($primaryScores['topic_relevance'])) {
            $supervisorNote['topic_relevance'] = $primaryScores['topic_relevance'];
        }

        // 3. Update Attempt
        $attempt->update([
            'ended_at' => now(),

            // Primary Data
            // Map 1-5 scale scores (Default to 0 if missing)
            'spoken_production_score' => (int) ($primaryScores['spoken_production_score'] ?? 0),
            'spoken_production_analysis' => $primaryScores['spoken_production_analysis'] ?? null,

            'range_score' => (int) ($primaryScores['range_score'] ?? 0),
            'range_analysis' => $primaryScores['range_analysis'] ?? null,

            'accuracy_score' => (int) ($primaryScores['accuracy_score'] ?? 0),
            'accuracy_analysis' => $primaryScores['accuracy_analysis'] ?? null,

            'fluency_score' => (int) ($primaryScores['fluency_score'] ?? 0), // Base column
            'fluency_score_advanced' => (int) ($primaryScores['fluency_score'] ?? 0), // New column
            'fluency_analysis' => $primaryScores['fluency_analysis'] ?? null,

            'coherence_score' => (int) ($primaryScores['coherence_score'] ?? 0),
            'coherence_analysis' => $primaryScores['coherence_analysis'] ?? null,

            'professional_verdict' => $primaryScores['professional_verdict'] ?? null,

            'final_score' => $primaryScores['final_score'] ?? 0,
            'cefr_level' => $primaryScores['cefr_level'] ?? null,
            'summary' => $primaryScores['summary'] ?? 'Gagal mengambil simpulan. Silakan cek koneksi.',
            'supervisor_note' => $supervisorNote,
            'secondary_assessment' => null,
            'secondary_final_score' => null,
            'secondary_cefr_level' => null,
        ]);

        return redirect()->route('ikhtabir-nafsi.show', $attempt->id);
    }

    public function show($id)
    {
        $attempt = IkhtabirNafsiAttempt::with(['messages', 'user.userLevel'])->findOrFail($id);
        $user = Auth::user();

        // Check if owner
        $isOwner = $attempt->user_id == $user->id;

        // Check if manager (Administrator or Kepala Sekolah)
        $isManager = $user->hasRole(['Administrator', 'Kepala Sekolah']);

        if (!$isOwner && !$isManager) {
            return abort(403, 'Unauthorized access');
        }

        // Get Allowed Models
        $allowedModels = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        $allowedModels = $allowedModels ? json_decode($allowedModels, true) : null;

        return Inertia::render('Teacher/IkhtabirNafsi/Show', [
            'attempt' => $attempt,
            'is_manager' => $isManager,
            'allowed_models' => $allowedModels
        ]);
    }

    public function publish($id)
    {
        $user = Auth::user();
        if (!$user->hasRole(['Administrator', 'Kepala Sekolah'])) {
            return abort(403);
        }

        $attempt = IkhtabirNafsiAttempt::findOrFail($id);
        $attempt->update(['published_at' => now()]);

        return back()->with('success', 'Catatan Supervisor berhasil dipublish ke Guru.');
    }

    public function destroy($id)
    {
        $attempt = IkhtabirNafsiAttempt::findOrFail($id);
        $user = Auth::user();

        // Allow Owner OR Manager (Administrator/Kepala Sekolah)
        if ($attempt->user_id != $user->id && !$user->hasRole(['Administrator', 'Kepala Sekolah'])) {
            return abort(403);
        }

        $attempt->delete();

        return redirect()->route('ikhtabir-nafsi.index')->with('success', 'Riwayat tes berhasil dihapus.');
    }
}
