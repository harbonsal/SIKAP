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
            $table->text('spoken_production_analysis')->nullable()->after('spoken_production_score');
            $table->text('range_analysis')->nullable()->after('range_score');
            $table->text('accuracy_analysis')->nullable()->after('accuracy_score');
            $table->text('fluency_analysis')->nullable()->after('fluency_score_advanced');
            $table->text('coherence_analysis')->nullable()->after('coherence_score');
            $table->text('interaction_analysis')->nullable()->after('interaction_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn([
                'spoken_production_analysis',
                'range_analysis',
                'accuracy_analysis',
                'fluency_analysis',
                'coherence_analysis',
                'interaction_analysis'
            ]);
        });
    }
};
