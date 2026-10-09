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
        Schema::table('quran_progress', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('juz_number');
            $table->timestamp('last_activity_at')->nullable()->after('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_progress', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'last_activity_at']);
        });
    }
};
