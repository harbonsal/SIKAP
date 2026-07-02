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
        Schema::table('tahfidz_memorization_details', function (Blueprint $table) {
            $table->json('mistakes_history')->nullable()->after('mistake_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_memorization_details', function (Blueprint $table) {
            $table->dropColumn('mistakes_history');
        });
    }
};
