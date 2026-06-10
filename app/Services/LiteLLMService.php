<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LiteLLMService
{
    protected $baseUrl;
    protected $apiKey;
    protected $openaiApiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.litellm.base_url');

        // Fallback if config is null/empty
        if (empty($this->baseUrl)) {
            $this->baseUrl = 'https://litellm.koboi2026.biz.id/v1';
        }

        if (!str_starts_with($this->baseUrl, 'http://') && !str_starts_with($this->baseUrl, 'https://')) {
            $this->baseUrl = 'https://' . $this->baseUrl;
        }

        // Ensure no trailing slash
        $this->baseUrl = rtrim($this->baseUrl, '/');

        $this->apiKey = config('services.litellm.api_key');
        $this->openaiApiKey = config('services.openai.api_key');

        // Fallback: Manually read .env if config failed (Common in Shared Hosting)
        if (empty($this->apiKey) && file_exists(base_path('.env'))) {
            $lines = file(base_path('.env'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), 'LITELLM_API_KEY=') === 0) {
                    $parts = explode('=', $line, 2);
                    $this->apiKey = trim($parts[1] ?? '');
                }
                if (strpos(trim($line), 'OPENAI_API_KEY=') === 0) {
                    $parts = explode('=', $line, 2);
                    $this->openaiApiKey = trim($parts[1] ?? '');
                }
            }
        }

        // Final fallback from API_KEY.txt in project root
        if (empty($this->apiKey)) {
            $this->apiKey = $this->loadApiKeyFromTextFile();
        }

        if ($this->baseUrl === 'https://litellm.koboi2026.biz.id/v1') {
            $fileBaseUrl = $this->loadBaseUrlFromTextFile();
            if (!empty($fileBaseUrl)) {
                $this->baseUrl = rtrim($fileBaseUrl, '/');
            }
        }

        if (empty($this->apiKey)) {
            Log::error("LiteLLM Critical: API Key is MISSING even after fallbacks.");
        }
    }

    protected function loadApiKeyFromTextFile()
    {
        $path = base_path('API_KEY.txt');
        if (!file_exists($path)) {
            return null;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with(strtolower($line), 'base url:') || str_starts_with(strtolower($line), 'arahan')) {
                continue;
            }
            if (str_starts_with($line, 'sk-')) {
                return $line;
            }
        }

        return null;
    }

    protected function loadBaseUrlFromTextFile()
    {
        $path = base_path('API_KEY.txt');
        if (!file_exists($path)) {
            return null;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (!str_starts_with(strtolower($line), 'base url:')) {
                continue;
            }

            $value = trim(substr($line, strlen('base url:')));
            if ($value === '') {
                return null;
            }
            if (!str_starts_with($value, 'http://') && !str_starts_with($value, 'https://')) {
                $value = 'https://' . $value;
            }
            return $value;
        }

        return null;
    }

    protected function fetchTranscriptionModels()
    {
        $preferred = [
            'gpt-4o-mini-transcribe',
            'openai/gpt-4o-mini-transcribe',
            'gpt-4o-transcribe',
            'openai/gpt-4o-transcribe',
            'whisper-1',
            'openai/whisper-1',
        ];

        try {
            $url = $this->baseUrl . '/models';
            $response = Http::withoutVerifying()->timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($url);

            if ($response->successful()) {
                $data = $response->json('data', []);
                $detected = collect($data)
                    ->map(function ($m) {
                        return trim($m['id'] ?? '');
                    })
                    ->filter(function ($id) {
                        $idLower = strtolower($id);
                        if ($id === '') {
                            return false;
                        }
                        return str_contains($idLower, 'whisper')
                            || str_contains($idLower, 'transcribe')
                            || str_contains($idLower, '-stt')
                            || str_contains($idLower, '/stt')
                            || str_contains($idLower, 'speech-to-text');
                    })
                    ->values()
                    ->toArray();

                return array_values(array_unique(array_merge($preferred, $detected)));
            }
        } catch (\Exception $e) {
            Log::warning('LiteLLM transcription model discovery failed: ' . $e->getMessage());
        }

        return $preferred;
    }

    /**
     * Fetch available models from LiteLLM
     */
    public function fetchAvailableModels()
    {
        try {
            $url = $this->baseUrl . '/models';
            $response = Http::withoutVerifying()->timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($url);

            if ($response->successful()) {
                $data = $response->json('data', []);

                // Known non-chat model patterns to filter out
                $excludePatterns = [
                    '-tts',
                    '-stt',
                    'whisper',
                    'dall-e',
                    'embedding',
                    'omni-moderation',
                    'text-embedding',
                    'can-stt',
                    'can-tts',
                    '(discontinued)',
                    '(maintenance)',
                    'preview',
                    'computer-use'
                ];

                return collect($data)
                    ->filter(function ($m) use ($excludePatterns) {
                        $id = strtolower($m['id']);
                        foreach ($excludePatterns as $pattern) {
                            if (str_contains($id, $pattern)) return false;
                        }
                        return true;
                    })
                    ->map(fn($m) => [
                        'id'   => $m['id'],
                        'name' => $m['id'],
                    ])
                    ->sortBy('id')
                    ->values()
                    ->toArray();
            }
        } catch (\Exception $e) {
            Log::warning('LiteLLM fetchAvailableModels failed: ' . $e->getMessage());
        }

        // Fallback if server unreachable
        return [
            ['id' => 'gemini-2.5-pro',  'name' => 'Gemini 2.5 Pro'],
            ['id' => 'gpt-4o-mini',      'name' => 'GPT-4o Mini'],
            ['id' => 'gpt-3.5-turbo',    'name' => 'GPT-3.5 Turbo'],
        ];
    }

    public function transcribeAudio($path)
    {
        try {
            if (!file_exists($path)) {
                return ['success' => false, 'error' => "File audio tidak ditemukan di server: " . $path];
            }

            // Use the configured LiteLLM Base URL (which ends in /v1)
            $url = $this->baseUrl . '/audio/transcriptions';
            $audioContent = file_get_contents($path);
            $filename = basename($path);

            if ($audioContent === false) {
                return ['success' => false, 'error' => 'Gagal membaca file audio untuk proses transkripsi.'];
            }

            // Try modern transcription models first, then discovered STT models from server
            $models = $this->fetchTranscriptionModels();
            $lastError = 'Unknown error';

            foreach ($models as $model) {
                // Retry each model to reduce transient network/provider failures.
                for ($attempt = 1; $attempt <= 2; $attempt++) {
                    try {
                        $response = Http::withoutVerifying()->timeout(70)->withHeaders([
                            'Authorization' => 'Bearer ' . $this->apiKey,
                        ])->attach(
                            'file',
                            $audioContent,
                            $filename
                        )->post($url, [
                            'model' => $model,
                            'language' => 'ar'
                        ]);

                        if ($response->successful()) {
                            return ['success' => true, 'text' => $response->json()['text'] ?? ''];
                        }

                        $lastError = $response->body();
                        Log::warning("LiteLLM STT failed for {$model} (attempt {$attempt}/2): " . $lastError);
                    } catch (\Exception $trialEx) {
                        $lastError = $trialEx->getMessage();
                        Log::warning("LiteLLM STT exception for {$model} (attempt {$attempt}/2): " . $lastError);
                    }
                }
            }

            // Last fallback: direct OpenAI STT when LiteLLM gateway is unstable.
            $openaiFallback = $this->transcribeAudioViaOpenAI($audioContent, $filename);
            if ($openaiFallback['success']) {
                return $openaiFallback;
            }
            $lastError = $openaiFallback['error'] ?? $lastError;

            return ['success' => false, 'error' => $lastError];
        } catch (\Exception $e) {
            Log::error("LiteLLM Whisper Critical Exception: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    protected function transcribeAudioViaOpenAI($audioContent, $filename)
    {
        try {
            if (empty($this->openaiApiKey)) {
                return ['success' => false, 'error' => 'OPENAI_API_KEY tidak tersedia untuk fallback STT.'];
            }

            $models = ['gpt-4o-mini-transcribe', 'whisper-1'];
            $lastError = 'Unknown OpenAI STT fallback error';

            foreach ($models as $model) {
                try {
                    $response = Http::withoutVerifying()->timeout(70)->withHeaders([
                        'Authorization' => 'Bearer ' . $this->openaiApiKey,
                    ])->attach(
                        'file',
                        $audioContent,
                        $filename
                    )->post('https://api.openai.com/v1/audio/transcriptions', [
                        'model' => $model,
                        'language' => 'ar',
                    ]);

                    if ($response->successful()) {
                        return ['success' => true, 'text' => $response->json()['text'] ?? ''];
                    }

                    $lastError = $response->body();
                    Log::warning("OpenAI STT fallback failed for {$model}: " . $lastError);
                } catch (\Exception $e) {
                    $lastError = $e->getMessage();
                    Log::warning("OpenAI STT fallback exception for {$model}: " . $lastError);
                }
            }

            return ['success' => false, 'error' => $lastError];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Analyze audio session (Transcription typically handled by frontend or separate service, 
     * but here we assume text input or we need STT if sending audio directly).
     * 
     * Since LiteLLM is OpenAI compatible, we use the standard Chat Completion endpoint.
     */
    public function analyzeAudioSession($transcription, $history = [], $modelName = 'gpt-3.5-turbo')
    {
        $topicText = null;
        foreach ($history as $msg) {
            if (!isset($msg['topic_text'])) {
                continue;
            }
            $candidate = trim((string) $msg['topic_text']);
            if ($candidate !== '') {
                $topicText = $candidate;
                break;
            }
        }

        $topicInstruction = '';
        if (!empty($topicText)) {
            $topicInstruction = "Assigned topic: {$topicText}. Keep the conversation focused on this topic. "
                . "If the user deviates, politely bring them back to the assigned topic. ";
        }

        // 1. Prepare Messages
        $messages = [];
        $messages[] = [
            'role' => 'system',
            'content' => "You are a friendly but professional Arabic language examiner (Guru Bahasa Arab). " .
                $topicInstruction .
                "Your goal is to test the user's speaking ability using the CEFR standards. " .
                "1. Reply conversationally in Arabic to the user's input. " .
                "2. ALSO, strictly provide a JSON object at the END of your response containing assessment feedback. " .
                "Format: [ARABIC_REPLY] ###JSON### { \"score\": 0-100, \"correction\": \"...\", \"praise\": \"...\" } "
        ];

        // History
        foreach ($history as $msg) {
            // Skip synthetic topic marker rows.
            if (isset($msg['topic_text'])) {
                continue;
            }

            $content = trim((string) ($msg['content'] ?? ''));
            if ($content === '') {
                continue;
            }

            // Adapt role for LiteLLM/OpenAI standard
            $storedRole = strtolower((string) ($msg['role'] ?? 'assistant'));
            $role = match ($storedRole) {
                'user' => 'user',
                'system' => 'system',
                default => 'assistant',
            };

            $messages[] = ['role' => $role, 'content' => $content];
        }

        // Current Input (Transcribed)
        $messages[] = ['role' => 'user', 'content' => $transcription];

        // 2. Chat Completion
        $response = $this->chatCompletion($messages, $modelName);

        // 3. Parse Response
        $content = trim((string) ($response['choices'][0]['message']['content'] ?? ''));
        $parsed = $this->extractConversationAndJson($content);

        return [
            'response_text' => $parsed['response_text'],
            'feedback' => $parsed['feedback'],
            'raw_response' => $content
        ];
    }

    public function analyzeFinalSession($history, $modelName = 'gpt-3.5-turbo')
    {
        // Convert history to text format
        $conversationText = "";
        foreach ($history as $h) {
            $conversationText .= $h['role'] . ": " . $h['content'] . "\n";
        }

        $prompt = "You are an OFFICIAL CEFR ORAL EXAMINER. Your job is to assess an Arabic teacher's speaking proficiency STRICTLY based on CEFR standards.\n\n" .
            "CONTEXT:\n" .
            // Convert history to text format
            $conversationText = "";
        foreach ($history as $h) {
            $conversationText .= $h['role'] . ": " . $h['content'] . "\n";
        }

        $prompt = "You are an OFFICIAL CEFR ORAL EXAMINER. Your job is to assess an Arabic teacher's speaking proficiency STRICTLY based on CEFR standards.\n\n" .
            "CONTEXT:\n" .
            "- Role: The user is a teacher/candidate. You are the examiner.\n" .
            "- Task: Evaluate their spoken Arabic performance in this session.\n" .
            "- Topic: '{{TOPIC}}'\n\n" .
            "TRANSCRIPT:\n" .
            $conversationText . "\n\n" .
            "ASSESSMENT RUBRIC (Strictly 1-5 Scale):\n" .
            "1. Overall Spoken Production (Systematic explanation, structure)\n" .
            "2. Range (Vocabulary variety, academic terms)\n" .
            "3. Accuracy (Nahwu/Sharaf precision. Recurring errors = Max B1)\n" .
            "4. Fluency (Natural flow, minimal pauses)\n" .
            "5. Coherence (Logical sequencing, transitions)\n\n" .
            "STRICT RULES:\n" .
            "- Total Score = Average of the 5 metrics (scaled to 100).\n" .
            "- PROVIDE A BRIEF ANALYSIS/RATIONALE (1-2 sentences in Indonesian) for EACH score to explain why that specific point was given.\n\n" .
            "- TEACHING ELIGIBILITY GUIDE (WAJIB IKUTI):\n" .
            "  * B1: layak di jenjang SD.\n" .
            "  * B2: standar minimal, layak untuk SMP dan SMA pada mata pelajaran ringan.\n" .
            "  * C1: sesuai untuk SMP dan SMA termasuk mapel sulit (mis. fikih).\n" .
            "  * A1/A2: belum layak mengajar mandiri.\n" .
            "  * C2: sangat layak untuk semua jenjang.\n\n" .
            "OUTPUT JSON ONLY:\n" .
            "{\n" .
            "  \"spoken_production_score\": 1-5,\n" .
            "  \"spoken_production_analysis\": \"Penjelasan dalam Bahasa Indonesia...\",\n" .
            "  \"range_score\": 1-5,\n" .
            "  \"range_analysis\": \"Penjelasan dalam Bahasa Indonesia...\",\n" .
            "  \"accuracy_score\": 1-5,\n" .
            "  \"accuracy_analysis\": \"Penjelasan dalam Bahasa Indonesia...\",\n" .
            "  \"fluency_score\": 1-5,\n" .
            "  \"fluency_analysis\": \"Penjelasan dalam Bahasa Indonesia...\",\n" .
            "  \"coherence_score\": 1-5,\n" .
            "  \"coherence_analysis\": \"Penjelasan dalam Bahasa Indonesia...\",\n" .
            "  \"final_score\": 0-100,\n" .
            "  \"cefr_level\": \"A1/A2/B1/B2/C1/C2\",\n" .
            "  \"professional_verdict\": \"Layak\" (for B1+ with level-appropriate scope) or \"Belum Layak\",\n" .
            "  \"summary\": \"Bahasa Indonesia. Ringkasan umum.\",\n" .
            "  \"topic_relevance\": \"...\",\n" .
            "  \"supervisor_note\": {\n" .
            "    \"suitable_to_teach\": true/false,\n" .
            "    \"recommended_levels\": \"Tuliskan eksplisit jenjang sekolah: SD, SMP, SMA sesuai panduan CEFR di atas.\",\n" .
            "    \"weaknesses\": [],\n" .
            "    \"improvement_steps\": []\n" .
            "  }\n" .
            "}";

        // Inject Topic
        $topicText = 'Topik Bebas';
        foreach ($history as $msg) {
            if (isset($msg['topic_text'])) {
                $topicText = $msg['topic_text'];
                break;
            }
        }
        $prompt = str_replace('{{TOPIC}}', $topicText, $prompt);

        $response = $this->chatCompletion([
            ['role' => 'system', 'content' => 'You are an expert Arabic linguist and examiner. Respond ONLY with the JSON assessment.'],
            ['role' => 'user', 'content' => $prompt],
        ], $modelName);

        $content = $response['choices'][0]['message']['content'] ?? '{}';

        // Clean markdown json if present
        $content = str_replace(['```json', '```'], '', $content);

        $decoded = json_decode($content, true);

        // Fallback: attempt extracting first JSON object if model adds extra text
        if (!is_array($decoded) && preg_match('/\{(?:[^{}]|(?R))*\}/s', $content, $matches)) {
            $decoded = json_decode($matches[0], true);
        }

        if (!is_array($decoded)) {
            $decoded = [];
        }

        return $this->normalizeFinalAssessment($decoded);
    }

    protected function normalizeFinalAssessment(array $raw)
    {
        $result = [];

        $scoreKeys = [
            'spoken_production_score' => ['spoken_production_score', 'spokenProductionScore', 'spoken_production', 'production_score', 'produksi_lisan_score'],
            'range_score' => ['range_score', 'rangeScore', 'vocabulary_range_score', 'range'],
            'accuracy_score' => ['accuracy_score', 'accuracyScore', 'grammar_score', 'ketepatan_score'],
            'fluency_score' => ['fluency_score', 'fluencyScore', 'kelancaran_score'],
            'coherence_score' => ['coherence_score', 'coherenceScore', 'cohesion_score', 'keterpaduan_score'],
        ];

        $analysisKeys = [
            'spoken_production_analysis' => ['spoken_production_analysis', 'spoken_production_rationale', 'spoken_production_reason', 'spoken_production_feedback', 'analysis_spoken_production', 'rationale_spoken_production'],
            'range_analysis' => ['range_analysis', 'range_rationale', 'range_reason', 'range_feedback', 'analysis_range', 'rationale_range'],
            'accuracy_analysis' => ['accuracy_analysis', 'accuracy_rationale', 'accuracy_reason', 'accuracy_feedback', 'analysis_accuracy', 'rationale_accuracy'],
            'fluency_analysis' => ['fluency_analysis', 'fluency_rationale', 'fluency_reason', 'fluency_feedback', 'analysis_fluency', 'rationale_fluency'],
            'coherence_analysis' => ['coherence_analysis', 'coherence_rationale', 'coherence_reason', 'coherence_feedback', 'analysis_coherence', 'rationale_coherence'],
        ];

        foreach ($scoreKeys as $targetKey => $aliases) {
            $score = $this->pickFirstNumeric($raw, $aliases);
            $result[$targetKey] = $score !== null ? max(0, min(5, (int) round($score))) : 0;
        }

        $metricLabels = [
            'spoken_production_analysis' => 'spoken production',
            'range_analysis' => 'range',
            'accuracy_analysis' => 'accuracy',
            'fluency_analysis' => 'fluency',
            'coherence_analysis' => 'coherence',
        ];

        foreach ($analysisKeys as $targetKey => $aliases) {
            $analysis = $this->pickFirstString($raw, $aliases);
            if (empty($analysis)) {
                $scoreKey = str_replace('_analysis', '_score', $targetKey);
                $analysis = $this->buildFallbackAnalysis($metricLabels[$targetKey], $result[$scoreKey] ?? 0);
            }
            $result[$targetKey] = $analysis;
        }

        $avg = (
            $result['spoken_production_score'] +
            $result['range_score'] +
            $result['accuracy_score'] +
            $result['fluency_score'] +
            $result['coherence_score']
        ) / 5;

        // Keep final score deterministic from the 5 rubric scores.
        $result['final_score'] = (int) round(($avg / 5) * 100);

        // Enforce deterministic CEFR mapping from final score to keep the system consistent.
        $result['cefr_level'] = $this->inferCefrFromScore($result['final_score']);

        // Teaching eligibility policy follows the displayed guide:
        // B1+ is eligible (B1 for SD, B2+ for broader levels).
        $suitableToTeach = in_array($result['cefr_level'], ['B1', 'B2', 'C1', 'C2'], true);
        $result['professional_verdict'] = $suitableToTeach ? 'Layak' : 'Belum Layak';

        $result['summary'] = $this->pickFirstString($raw, ['summary', 'ringkasan']) ?: 'Analisis umum belum tersedia.';
        $result['topic_relevance'] = $this->pickFirstString($raw, ['topic_relevance', 'topicRelevance', 'kecocokan_topik']) ?: null;

        $supervisorNote = $raw['supervisor_note'] ?? null;
        $result['supervisor_note'] = is_array($supervisorNote) ? $supervisorNote : [];
        if (!empty($result['topic_relevance']) && !isset($result['supervisor_note']['topic_relevance'])) {
            $result['supervisor_note']['topic_relevance'] = $result['topic_relevance'];
        }

        // Override with canonical values so list/detail views cannot drift.
        $result['supervisor_note']['suitable_to_teach'] = $suitableToTeach;
        $result['supervisor_note']['recommended_levels'] = $this->inferSchoolLevelRecommendation(
            $result['cefr_level'],
            $suitableToTeach
        );
        if (!isset($result['supervisor_note']['weaknesses']) || !is_array($result['supervisor_note']['weaknesses'])) {
            $result['supervisor_note']['weaknesses'] = [];
        }
        if (!isset($result['supervisor_note']['improvement_steps']) || !is_array($result['supervisor_note']['improvement_steps'])) {
            $result['supervisor_note']['improvement_steps'] = [];
        }

        return $result;
    }

    protected function pickFirstNumeric(array $data, array $keys)
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }
            $value = $data[$key];
            if (is_numeric($value)) {
                return (float) $value;
            }
        }
        return null;
    }

    protected function pickFirstString(array $data, array $keys)
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }
            $value = $data[$key];
            if (is_string($value)) {
                $trimmed = trim($value);
                if ($trimmed !== '') {
                    return $trimmed;
                }
            }
        }
        return null;
    }

    protected function buildFallbackAnalysis($metric, $score)
    {
        if ($score <= 1) {
            return "Performa pada aspek {$metric} masih sangat terbatas. Perlu latihan terarah agar kualitas jawaban lebih konsisten.";
        }
        if ($score === 2) {
            return "Performa pada aspek {$metric} sudah mulai terlihat, namun masih sering tidak stabil. Perlu peningkatan akurasi dan konsistensi.";
        }
        if ($score === 3) {
            return "Performa pada aspek {$metric} berada di level cukup/standar. Sudah memenuhi dasar, namun masih perlu penguatan untuk hasil yang lebih matang.";
        }
        if ($score === 4) {
            return "Performa pada aspek {$metric} tergolong baik. Struktur jawaban relatif kuat, dengan sedikit area yang masih bisa disempurnakan.";
        }
        if ($score >= 5) {
            return "Performa pada aspek {$metric} sangat baik dan konsisten. Menunjukkan penguasaan yang kuat pada kriteria ini.";
        }

        return "Analisis pada aspek {$metric} belum tersedia.";
    }

    protected function inferCefrFromScore($finalScore)
    {
        if ($finalScore >= 90) return 'C2';
        if ($finalScore >= 70) return 'C1';
        if ($finalScore >= 50) return 'B2';
        if ($finalScore >= 30) return 'B1';
        if ($finalScore >= 10) return 'A2';
        return 'A1';
    }

    protected function inferSchoolLevelRecommendation($cefrLevel, $suitableToTeach)
    {
        if (!$suitableToTeach) {
            return 'Belum Direkomendasikan';
        }

        $map = [
            'A1' => 'Belum Direkomendasikan',
            'A2' => 'Belum Direkomendasikan',
            'B1' => 'Layak SD',
            'B2' => 'Layak SD/SMP',
            'C1' => 'Layak SD/SMP/SMA',
            'C2' => 'Layak SD/SMP/SMA',
        ];

        return $map[$cefrLevel] ?? 'Rekomendasi jenjang belum spesifik. Perlu verifikasi supervisor.';
    }

    protected function extractConversationAndJson($content)
    {
        $raw = trim((string) $content);
        if ($raw === '') {
            return [
                'response_text' => '',
                'feedback' => [],
            ];
        }

        $responseText = $raw;
        $jsonStr = '';

        if (str_contains($raw, '###JSON###')) {
            $parts = explode('###JSON###', $raw, 2);
            $responseText = trim((string) ($parts[0] ?? ''));
            $jsonStr = trim((string) ($parts[1] ?? ''));
        } else {
            $candidate = str_replace(['```json', '```JSON', '```'], '', $raw);
            if (preg_match('/\{(?:[^{}]|(?R))*\}/s', $candidate, $matches)) {
                $jsonStr = trim($matches[0]);
                $responseText = trim(str_replace($matches[0], '', $candidate));
            }
        }

        if ($responseText === '') {
            $responseText = $raw;
        }

        $feedback = [];
        if ($jsonStr !== '') {
            $decoded = json_decode($jsonStr, true);
            if (is_array($decoded)) {
                $feedback = $decoded;
            }
        }

        return [
            'response_text' => $responseText,
            'feedback' => $feedback,
        ];
    }

    public function chatCompletion($messages, $modelName, $temperature = 0.7)
    {
        try {
            $url = $this->baseUrl . '/chat/completions';

            $response = Http::withoutVerifying()->timeout(120)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($url, [
                'model' => $modelName,
                'messages' => $messages,
                'temperature' => $temperature
            ]);

            if ($response->failed()) {
                throw new \Exception("LiteLLM Error: " . $response->body());
            }

            return $response->json();
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Chat completion dengan fallback otomatis ke model lain jika gagal.
     * Urutan: model yang diminta → semua model aktif dari settings → hardcoded fallback.
     * Cocok untuk fitur yang butuh resiliensi tinggi (SmartSearch, RPP, dll).
     */
    public function chatCompletionWithFallback(array $messages, string $preferredModel = '', float $temperature = 0.3): array
    {
        $models = $this->buildFallbackChain($preferredModel);
        $lastError = 'No models available.';

        foreach ($models as $model) {
            try {
                Log::info("SmartSearch: trying model [{$model}]");
                $result = $this->chatCompletion($messages, $model, $temperature);

                // Validate response has expected structure
                if (!empty($result['choices'][0]['message']['content'])) {
                    Log::info("SmartSearch: success with model [{$model}]");
                    $result['_model_used'] = $model;
                    return $result;
                }

                $lastError = "Empty response from model [{$model}]";
                Log::warning("SmartSearch: empty response from [{$model}], trying next...");

            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                $isQuotaError = $this->isQuotaOrRateLimitError($lastError);

                Log::warning("SmartSearch: model [{$model}] failed" .
                    ($isQuotaError ? ' (quota/rate limit)' : '') .
                    ": " . substr($lastError, 0, 100));

                // Continue to next model
                continue;
            }
        }

        throw new \Exception("All AI models failed. Last error: " . $lastError);
    }

    /**
     * Build ordered list of models to try:
     * 1. Preferred model (if specified and enabled)
     * 2. All other enabled models from settings
     * 3. Hardcoded fallbacks
     */
    protected function buildFallbackChain(string $preferredModel = ''): array
    {
        $chain = [];

        // Add preferred model first
        if (!empty($preferredModel)) {
            $chain[] = $preferredModel;
        }

        // Get all enabled models from settings
        $settingValue = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        if ($settingValue) {
            $allModels = json_decode($settingValue, true) ?? [];
            foreach ($allModels as $modelId => $enabled) {
                if (!$enabled) continue;
                $id = strtolower($modelId);
                // Skip non-chat models
                if (str_contains($id, '-tts') || str_contains($id, '-stt') ||
                    str_contains($id, 'whisper') || str_contains($id, 'embedding')) {
                    continue;
                }
                if (!in_array($modelId, $chain)) {
                    $chain[] = $modelId;
                }
            }
        }

        // Hardcoded fallbacks (always at the end)
        $hardcodedFallbacks = [
            'gemini-1.5-flash',
            'gemini-2.0-flash',
            'gpt-4o-mini',
            'gpt-3.5-turbo',
        ];
        foreach ($hardcodedFallbacks as $fb) {
            if (!in_array($fb, $chain)) {
                $chain[] = $fb;
            }
        }

        return $chain;
    }

    /**
     * Detect quota/rate limit errors to log them differently
     */
    protected function isQuotaOrRateLimitError(string $errorMessage): bool
    {
        $keywords = [
            'quota', 'rate limit', 'rate_limit', 'too many requests',
            '429', 'exceeded', 'insufficient_quota', 'billing',
            'resource_exhausted', 'RESOURCE_EXHAUSTED',
        ];
        $lower = strtolower($errorMessage);
        foreach ($keywords as $kw) {
            if (str_contains($lower, strtolower($kw))) return true;
        }
        return false;
    }
}
