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
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->unsignedTinyInteger('spoken_production_score')->nullable()->after('cefr_level');
            $table->unsignedTinyInteger('range_score')->nullable()->after('spoken_production_score');
            $table->unsignedTinyInteger('accuracy_score')->nullable()->after('range_score');
            $table->unsignedTinyInteger('fluency_score_advanced')->nullable()->after('accuracy_score'); // Rename to avoid conflict if fluency_score exists, or use existing
            $table->unsignedTinyInteger('coherence_score')->nullable()->after('fluency_score_advanced');
            $table->unsignedTinyInteger('interaction_score')->nullable()->after('coherence_score');
            $table->string('professional_verdict')->nullable()->after('supervisor_note'); // Layak / Belum Layak / Di Bawah Standar
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn([
                'spoken_production_score',
                'range_score',
                'accuracy_score',
                'fluency_score_advanced',
                'coherence_score',
                'interaction_score',
                'professional_verdict'
            ]);
        });
    }
};
