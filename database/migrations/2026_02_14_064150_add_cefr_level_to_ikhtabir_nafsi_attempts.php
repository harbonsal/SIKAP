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
            $table->string('cefr_level', 5)->nullable()->after('final_score'); // A1, A2, B1, B2, C1, C2
        });
    }

    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn('cefr_level');
            //
        });
    }
};
