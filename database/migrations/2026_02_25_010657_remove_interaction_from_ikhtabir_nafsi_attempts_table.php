<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Menyesuaikan ulang skor untuk data yang sudah ada sebelum kolom dihapus
        \Illuminate\Support\Facades\DB::table('ikhtabir_nafsi_attempts')
            ->orderBy('id')
            ->chunk(100, function ($attempts) {
                foreach ($attempts as $attempt) {
                    $sum = ($attempt->spoken_production_score ?? 0) +
                        ($attempt->range_score ?? 0) +
                        ($attempt->accuracy_score ?? 0) +
                        ($attempt->fluency_score_advanced ?? $attempt->fluency_score ?? 0) +
                        ($attempt->coherence_score ?? 0);

                    $avg = $sum / 5;
                    $finalScore = (int) round(($avg / 5) * 100);

                    $cefrLevel = 'A1';
                    if ($finalScore >= 90) $cefrLevel = 'C2';
                    elseif ($finalScore >= 70) $cefrLevel = 'C1';
                    elseif ($finalScore >= 50) $cefrLevel = 'B2';
                    elseif ($finalScore >= 30) $cefrLevel = 'B1';
                    elseif ($finalScore >= 10) $cefrLevel = 'A2';

                    \Illuminate\Support\Facades\DB::table('ikhtabir_nafsi_attempts')
                        ->where('id', $attempt->id)
                        ->update([
                            'final_score' => $finalScore,
                            'cefr_level' => $cefrLevel,
                        ]);
                }
            });

        // Only drop columns for MySQL/MariaDB, skip for SQLite due to schema complexity
        $driver = \Illuminate\Support\Facades\DB::getDriverName();
        if ($driver !== 'sqlite') {
            Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
                $table->dropColumn('interaction_score');
                $table->dropColumn('interaction_analysis');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->integer('interaction_score')->nullable();
            $table->text('interaction_analysis')->nullable();
        });
    }
};
