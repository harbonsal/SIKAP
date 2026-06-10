<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AISupervisionService
{
    /**
     * Analyze supervision notes against questions to suggest scores.
     *
     * @param array $notes Array of ['timestamp' => '...', 'text' => '...']
     * @param Collection $questions Collection of SupervisionQuestion with rubrics
     * @return array
     */
    public function analyze($notes, Collection $questions)
    {
        $mode = request('mode', 'realtime');
        $duration = request('duration', 60);

        // Normalize notes to string for Mock fallback/Context
        $notesString = "";
        if (is_array($notes)) {
            $notesString = collect($notes)->map(fn($n) => "[{$n['timestamp']}] {$n['text']}")->join("\n");
        } else {
            $notesString = $notes;
        }

        // 1. Build Prompt Context
        $systemInstruction = "Anda adalah asisten supervisor pendidikan yang ahli. ";
        $systemInstruction .= "Tugas Anda adalah menilai kinerja guru di kelas berdasarkan catatan observasi yang diberikan. ";
        $systemInstruction .= "Gunakan RUBRIK PENILAIAN yang disediakan secara ketat. ";
        $systemInstruction .= "Berikan skor (1, 2, atau 3) untuk setiap aspek pertanyaan. \n";
        $systemInstruction .= "Skor 3 (Profesional): Memenuhi semua kriteria dengan sangat baik.\n";
        $systemInstruction .= "Skor 2 (Memadai): Memenuhi sebagian besar kriteria.\n";
        $systemInstruction .= "Skor 1 (Perlu Bimbingan): Kurang memenuhi kriteria.\n\n";
        $systemInstruction .= "INSTRUKSI PENTING TENTANG REASONING (ALASAN):\n";
        $systemInstruction .= "1. Anda WAJIB menyertakan BUKTI SPESIFIK dari catatan observasi untuk mendukung penilaian Anda.\n";
        $systemInstruction .= "2. Nukil/Kutip bagian dari catatan tersebut (contoh: \"Karena pada menit 10 guru terlihat...\").\n";
        $systemInstruction .= "3. Jelaskan hubungan antara bukti tersebut dengan kriteria skor yang dipilih.\n";
        $systemInstruction .= "Format output WAJIB JSON valid: { \"question_id\": { \"score\": int, \"reasoning\": string }, ... }";

        $context = "RUBRIK PENILAIAN:\n";
        foreach ($questions as $q) {
            $context .= "ID: {$q->id}. Aspek: {$q->aspect}\n";
            foreach ($q->rubrics as $r) {
                $context .= "- Skor {$r->score}: {$r->description}\n";
            }
            $context .= "\n";
        }

        $context .= "CATATAN OBSERVASI:\n";
        if ($mode === 'manual') {
            $context .= "[MODE: MANUAL SUMMARY]\n";
            $context .= "[TOTAL DURASI KELAS: {$duration} Menit]\n";
            $context .= "Perhatikan referensi waktu dalam narasi dan bandingkan dengan Total Durasi.\n";
            $context .= "ISI NARASI:\n\"{$notesString}\"";
        } else {
            $context .= "[MODE: REALTIME LOGS]\n";
            $context .= $notesString;
        }

        // 2. Call Gemini
        try {
            if (!env('GEMINI_API_KEY')) {
                return $this->mockAnalysis($notesString, $questions);
            }

            // Combine instruction and context for simple generation
            $fullPrompt = $systemInstruction . "\n\n" . $context;

            return $this->simulatedRealCall($fullPrompt, $notesString, $questions);
        } catch (\Exception $e) {
            \Log::error("Gemini Error: " . $e->getMessage());
            return $this->mockAnalysis($notesString, $questions);
        }
    }

    private function mockAnalysis($text, $questions)
    {
        $results = [];
        // Extract timestamp if available for fake quote
        preg_match('/\[(.*?)\]/', $text, $matches);
        $time = $matches[1] ?? '00:00';

        foreach ($questions as $q) {
            $score = 2; // Default

            // Randomize slightly for demo feel
            $rand = rand(1, 10);
            if ($rand > 8) $score = 3;
            if ($rand < 3) $score = 1;

            // Generate "Simulated" evidence-based reasoning
            $mockEvidence = [
                "guru membuka salam dengan santun",
                "siswa terlihat antusias di menit awal",
                "penjelasan materi cukup runtut",
                "ada interaksi tanya jawab",
                "penggunaan media pembelajaran terlihat"
            ];
            $evidence = $mockEvidence[array_rand($mockEvidence)];
            $reason = "Berdasarkan catatan: '...{$evidence}...', terlihat indikator terpenuhi sebagian. (Simulasi)";

            $results[$q->id] = [
                'score' => $score,
                'reasoning' => $reason
            ];
        }
        return $results;
    }

    private function simulatedRealCall($prompt, $originalNotes, $questions)
    {
        try {
            // Instantiate Client directly since we don't have the Laravel Facade
            $apiKey = env('GEMINI_API_KEY');
            $client = \Gemini::client($apiKey);

            $result = $client->geminiPro()->generateContent($prompt);
            $responseText = $result->text();

            // cleanup json markdown if present
            $responseText = str_replace(['```json', '```'], '', $responseText);

            return json_decode($responseText, true);
        } catch (\Exception $e) {
            Log::error("Gemini Real Call Failed: " . $e->getMessage());
            // Fallback to mock if API fails
            return $this->mockAnalysis($originalNotes, $questions);
        }
    }
}
