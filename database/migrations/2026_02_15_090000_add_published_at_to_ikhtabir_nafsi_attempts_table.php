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
        if (!Schema::hasColumn('ikhtabir_nafsi_attempts', 'published_at')) {
            Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
                $table->timestamp('published_at')->nullable()->after('supervisor_note');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropColumn('published_at');
        });
    }
};
