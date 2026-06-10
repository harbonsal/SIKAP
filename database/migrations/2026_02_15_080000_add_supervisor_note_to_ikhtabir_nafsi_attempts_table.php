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
        if (!Schema::hasColumn('ikhtabir_nafsi_attempts', 'supervisor_note')) {
            Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
                $table->json('supervisor_note')->nullable()->after('secondary_cefr_level');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn('supervisor_note');
        });
    }
};
