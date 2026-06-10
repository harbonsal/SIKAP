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
        if (!Schema::hasColumn('ikhtabir_nafsi_attempts', 'model_name')) {
            Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
                $table->string('model_name')->nullable()->after('ai_model');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn('model_name');
        });
    }
};
