<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GradeWeight;
use App\Models\StudentGrade;
use App\Models\UhSession;
use App\Models\UhQuizScore;
use App\Services\AcademicStateService;

class MigrateUhManualToQuizCommand extends Command
{
    protected $signature = 'uh:migrate-manual';
    protected $description = 'Migrasikan nilai manual UH1 dan UH2 yang sudah ada di student_grades ke penilaian pemahaman 1 (quiz 1)';

    public function handle()
    {
        $this->info('Memulai migrasi nilai manual UH ke Penilaian Pemahaman 1...');

        $uhWeights = GradeWeight::where('category', 'pengetahuan')
            ->where(function($q) {
                $q->where('name', 'like', 'UH1%')
                  ->orWhere('name', 'like', 'UH 1%')
                  ->orWhere('name', 'UH1')
                  ->orWhere('name', 'like', 'UH2%')
                  ->orWhere('name', 'like', 'UH 2%')
                  ->orWhere('name', 'UH2');
            })
            ->get();

        $migratedCount = 0;

        foreach ($uhWeights as $weight) {
            $upperName = strtoupper($weight->name);
            $type = (str_contains($upperName, 'UH2') || str_contains($upperName, 'UH 2')) ? 'UH2' : 'UH1';

            $grades = StudentGrade::where('grade_weight_id', $weight->id)
                ->whereNotNull('score')
                ->get();

            foreach ($grades as $grade) {
                $session = UhSession::firstOrCreate([
                    'active_subject_id' => $grade->active_subject_id,
                    'semester_id' => $grade->semester_id,
                    'type' => $type,
                ]);

                $quiz1 = UhQuizScore::where('uh_session_id', $session->id)
                    ->where('student_id', $grade->student_id)
                    ->where('quiz_number', 1)
                    ->first();

                if (!$quiz1) {
                    UhQuizScore::create([
                        'uh_session_id' => $session->id,
                        'student_id' => $grade->student_id,
                        'quiz_number' => 1,
                        'score' => $grade->score,
                    ]);
                    $migratedCount++;
                }
            }
        }

        $this->info("Migrasi selesai! Total $migratedCount nilai santri berhasil disinkronkan ke Penilaian Pemahaman 1.");
        return 0;
    }
}
