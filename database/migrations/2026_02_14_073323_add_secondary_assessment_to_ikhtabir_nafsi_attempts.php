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
            $table->text('secondary_assessment')->nullable()->after('cefr_level'); // Changed to text to avoid JSON migration issues on older MySQL/MariaDB if any
            $table->decimal('secondary_final_score', 5, 2)->nullable()->after('secondary_assessment');
            $table->string('secondary_cefr_level', 5)->nullable()->after('secondary_final_score');
        });
    }

    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn(['secondary_assessment', 'secondary_final_score', 'secondary_cefr_level']);
        });
    }
};
