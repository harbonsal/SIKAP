<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    protected $apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key');
    }

    /**
     * Analyze audio session (Whisper STT + GPT-4o Response)
     */
    public function analyzeAudioSession($audioPath, $history = [])
    {
        try {
            // 1. Transcribe Audio (Whisper)
            $transcriptionResult = $this->transcribeAudio($audioPath);

            if (!$transcriptionResult['success']) {
                throw new \Exception("Whisper Error: " . $transcriptionResult['error']);
            }

            $transcription = $transcriptionResult['text'];

            // 2. Prepare Chat Context
            $messages = [];

            // System Instruction
            $messages[] = [
                'role' => 'system',
                'content' => "You are a friendly but professional Arabic language examiner (Guru Bahasa Arab). " .
                    "Your goal is to test the user's speaking ability using the CEFR standards. " .
                    "1. Reply conversationally in Arabic to the user's input. " .
                    "2. ALSO, strictly provide a JSON object at the END of your response containing assessment feedback. " .
                    "Format: [ARABIC_REPLY] ###JSON### { \"score\": 0-100, \"correction\": \"...\", \"praise\": \"...\" } "
            ];

            // Add Text History
            foreach ($history as $msg) {
                // Determine role based on stored history
                // Note: GeminiService stores 'model' but OpenAI uses 'assistant'
                // We should normalize this. The Controller converts DB 'assistant' to 'model' for Gemini.
                // Here we just use what's passed, but ensure it's valid for OpenAI ('user' or 'assistant').
                $role = ($msg['role'] === 'user') ? 'user' : 'assistant';
                $messages[] = ['role' => $role, 'content' => $msg['content']];
            }

            // Add Current User Message (Transcribed)
            $messages[] = ['role' => 'user', 'content' => $transcription];

            // 3. Call Chat API
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'gpt-3.5-turbo',
                'messages' => $messages,
                'temperature' => 0.7
            ]);

            if ($response->failed()) {
                throw new \Exception("OpenAI Chat API Error: " . $response->body());
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? '';

            // 4. Parse Output
            $parts = explode('###JSON###', $content);
            $arabicReply = trim($parts[0] ?? $content);
            $jsonStr = trim($parts[1] ?? '{}');

            // Clean markdown
            $jsonStr = str_replace(['```json', '```'], '', $jsonStr);
            $jsonData = json_decode($jsonStr, true) ?? [];

            return [
                'response_text' => $arabicReply,
                'feedback' => $jsonData,
                'raw_response' => $content
            ];
        } catch (\Exception $e) {
            Log::error("OpenAI Audio Session Error: " . $e->getMessage());
            return [
                'response_text' => "Asif, hadatha khata. (Maaf, terjadi kesalahan teknis pada OpenAI). \nDetails: " . $e->getMessage(),
                'feedback' => [],
                'error' => $e->getMessage()
            ];
        }
    }

    public function transcribeAudio($path)
    {
        try {
            if (!file_exists($path)) {
                return ['success' => false, 'error' => "File audio tidak ditemukan di server: " . $path];
            }

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->attach(
                'file',
                file_get_contents($path),
                basename($path)
            )->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => 'whisper-1',
                'language' => 'ar' // Hint Arabic language
            ]);

            if ($response->failed()) {
                Log::error("Whisper Error: " . $response->body());
                return ['success' => false, 'error' => $response->body()];
            }

            return ['success' => true, 'text' => $response->json()['text'] ?? ''];
        } catch (\Exception $e) {
            Log::error("Whisper Exception: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    /**
     * Analyze the final session transcript using OpenAI (ChatGPT)
     */
    public function analyzeFinalSession($history)
    {
        try {
            // Convert history to text format
            $conversationText = "";
            foreach ($history as $h) {
                $conversationText .= $h['role'] . ": " . $h['content'] . "\n";
            }

            $prompt = "You are a senior Arabic language examiner (auditor). Analyze this conversation transcript between a student and an examiner.\n\n" .
                $conversationText . "\n\n" .
                "Provide a JSON output with the following assessment data (integers 0-100, string CEFR, and summary):\n" .
                "- fluency_score\n" .
                "- pronunciation_score (infer from text context if possible, otherwise list as null or estimate based on transcript clarity)\n" . // Limitation: Text only
                "- grammar_score\n" .
                "- vocabulary_score\n" .
                "- final_score (Average)\n" .
                "- cefr_level (A1-C2)\n" .
                "- summary (In Indonesian, comprehensive assessment comparing strengths and weaknesses).";

            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an expert Arabic linguist and examiner.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                // 'response_format' => ['type' => 'json_object'], // Optional: Comment out if causing 400 on older accounts
            ]);

            if ($response->failed()) {
                throw new \Exception("OpenAI API Error: " . $response->body());
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? '{}';

            // Clean markdown json if present
            $content = str_replace(['```json', '```'], '', $content);

            return json_decode($content, true);
        } catch (\Exception $e) {
            Log::error("OpenAI Error: " . $e->getMessage());
            return null;
        }
    }
}
