<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }

    /**
     * Analyze audio session and return conversational response + feedback
     */
    public function analyzeAudioSession($audioPath, $history = [])
    {
        try {
            // 1. Prepare Content for Gemini
            $contents = [];

            // System Instruction (simulated via first user message or system instruction if supported)
            $topicLine = "";
            if (isset($history[0]['topic_text'])) {
                $topicLine = "TOPIC: " . $history[0]['topic_text'] . ". ";
                $topicLine .= "The user MUST speak about this topic. If they deviate significantly, politely guide them back. ";
            }

            $systemInstruction = "You are a friendly but professional Arabic language examiner (Guru Bahasa Arab). " .
                $topicLine .
                "Your goal is to test the user's speaking ability (pronunciation/makhraj, fluency, grammar). " .
                "1. Listen to the user's audio. " .
                "2. Reply conversationally in Arabic (to keep the flow going). " .
                "3. ALSO, strictly provide a JSON object at the END of your response (hidden from the user speech) containing: " .
                "   - `user_transcript`: The exact Arabic text of what the user said. " .
                "   - `response_text`: Your Arabic reply (same as spoken). " .
                "   - `feedback`: { `score`: 0-100, `correction`: '...', `praise`: '...', `topic_relevance`: 'Valid/Invalid' } " .
                "Format: [ARABIC_REPLY] ###JSON### { ...json... }";

            // Add History (Convert to Gemini format)
            foreach ($history as $msg) {
                // Skip if it's special metadata
                if (isset($msg['topic_text'])) continue;

                $role = ($msg['role'] === 'user') ? 'user' : 'model';
                $contents[] = [
                    'role' => $role,
                    'parts' => [
                        ['text' => $msg['content']]
                    ]
                ];
            }

            // 2. Prepare Current Audio Input
            // Read file and encode to base64
            $audioData = base64_encode(file_get_contents($audioPath));

            // Add current message with audio
            $contents[] = [
                'role' => 'user',
                'parts' => [
                    ['text' => $systemInstruction], // Re-inject context
                    [
                        'inline_data' => [
                            'mime_type' => 'audio/mp3', // Adjust if needed
                            'data' => $audioData
                        ]
                    ]
                ]
            ];

            // 1. Validate API Key
            if (empty($this->apiKey)) {
                throw new \Exception("Gemini API Key is missing in .env (GEMINI_API_KEY).");
            }

            // ... (rest of code)

            // 3. Call API (HTTP Client)
            // Use query parameter array for safer URL construction
            $url = $this->baseUrl . 'gemini-1.5-flash:generateContent';

            // Retry 3 times for stability
            $response = Http::withoutVerifying()->retry(3, 2000, function ($exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException ||
                    $exception->response->status() === 429 ||
                    $exception->response->status() >= 500;
            })->post($url . '?key=' . $this->apiKey, [
                'contents' => $contents
            ]);

            if ($response->failed()) {
                throw new \Exception("Gemini API Error: " . $response->body());
            }

            $data = $response->json();

            // Extract text from candidates
            $rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if (empty($rawText)) {
                throw new \Exception("Empty response from Gemini");
            }

            // 4. Parse Output (Split Text and JSON)
            $parts = explode('###JSON###', $rawText);
            $arabicReply = trim($parts[0] ?? $rawText);
            $jsonStr = trim($parts[1] ?? '{}');

            // Clean markdown json if present
            $jsonStr = str_replace(['```json', '```'], '', $jsonStr);

            $jsonData = json_decode($jsonStr, true) ?? [];

            return [
                'user_transcript' => $jsonData['user_transcript'] ?? '[Audio Message]',
                'response_text' => $arabicReply,
                'feedback' => $jsonData['feedback'] ?? [], // Fix: feedback is usually inside the json
                'raw_response' => $rawText
            ];
        } catch (\Exception $e) {
            Log::error("Gemini Error: " . $e->getMessage());
            return [
                'response_text' => "Asif, hadatha khata. (Maaf, terjadi kesalahan teknis). \nDetails: " . $e->getMessage(),
                'feedback' => [],
                'error' => $e->getMessage()
            ];
        }
    }

    public function analyzeFinalSession($history)
    {
        try {
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
                "4. Fluency (Natural flow, minimal pauses. Many pauses = Max B1)\n" .
                "5. Coherence (Logical sequencing, transitions)\n" .
                "6. Interaction (Q&A response quality, if applicable)\n\n" .
                "SCORING GUIDE:\n" .
                "- 1 = A2 (Weak/Fragmented)\n" .
                "- 2 = B1 (Threshold/Pre-Intermediate)\n" .
                "- 3 = B2 (Minimum Professional Standard)\n" .
                "- 4 = C1 (Effective Operational Proficiency - Ideal for Teachers)\n" .
                "- 5 = C2 (Mastery/Native-like)\n\n" .
                "STRICT RULES:\n" .
                "- If performance < B2, PROFESSIONAL_VERDICT must be 'Belum Layak' or 'Di Bawah Standar'.\n" .
                "- Do not inflate scores. Be objective.\n" .
                "- Total Score = Average of the 6 metrics (scaled to 100).\n\n" .
                "OUTPUT JSON ONLY:\n" .
                "{\n" .
                "  \"spoken_production_score\": 1-5,\n" .
                "  \"range_score\": 1-5,\n" .
                "  \"accuracy_score\": 1-5,\n" .
                "  \"fluency_score\": 1-5,\n" .
                "  \"coherence_score\": 1-5,\n" .
                "  \"interaction_score\": 1-5,\n" .
                "  \"final_score\": 0-100 (Calculate: (Sum of 6 scores / 30) * 100),\n" .
                "  \"cefr_level\": \"A1/A2/B1/B2/C1/C2\",\n" .
                "  \"professional_verdict\": \"Layak\" (if >= B2) or \"Belum Layak\" (if < B2),\n" .
                "  \"summary\": \"Indonesian. Professional assessment summary.\",\n" .
                "  \"topic_relevance\": \"Sangat Relevan/Cukup/Kurang/Tidak\",\n" .
                "  \"supervisor_note\": {\n" .
                "    \"suitable_to_teach\": true/false,\n" .
                "    \"recommended_levels\": \"STRICT: A1/A2->'Belum Layak', B1->'SD & SMP', B2->'SD, SMP & SMA', C1/C2->'Semua Jenjang'\",\n" .
                "    \"weaknesses\": [\"Point 1\", \"Point 2\"],\n" .
                "    \"improvement_steps\": [\"Step 1\", \"Step 2\"]\n" .
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
            $prompt = str_replace('{{TOPIC}}', $topicText, $prompt); // Note: Original prompt in GeminiService might not have {{TOPIC}} placeholder yet. I need to add it to the prompt string first.

            $url = $this->baseUrl . 'gemini-1.5-flash:generateContent?key=' . $this->apiKey;

            $safetySettings = [
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_NONE'],
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
            ];

            // Retry 3 times, wait 2s, 4s, 8s (exponential)
            $response = Http::withoutVerifying()->retry(3, 2000, function ($exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException ||
                    $exception->response->status() === 429 ||
                    $exception->response->status() >= 500;
            })->post($url, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [['text' => $prompt]]
                    ]
                ],
                'safetySettings' => $safetySettings
            ]);

            if ($response->failed()) {
                Log::error("Gemini Final Analysis API Error: " . $response->body());
                throw new \Exception("Gemini Final Analysis API Error: " . $response->body());
            }

            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

            // Robust JSON Extraction using Regex
            if (preg_match('/\{.*\}/s', $text, $matches)) {
                $jsonStr = $matches[0];
            } else {
                $jsonStr = $text;
            }

            // Cleanup for safety
            $jsonStr = str_replace(['```json', '```'], '', $jsonStr);

            $result = json_decode($jsonStr, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error("Gemini JSON Parse Error: " . json_last_error_msg() . " | Raw: " . $text);
                throw new \Exception("Failed to decode JSON from Gemini.");
            }

            return $result;
        } catch (\Exception $e) {
            Log::error("Gemini Final Analysis Exception: " . $e->getMessage());
            return [
                'final_score' => 0,
                'summary' => "Gagal menganalisis sesi. (" . substr($e->getMessage(), 0, 50) . "...)"
            ];
        }
    }
}
