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
        Schema::table('tahfidz_halaqoh_officers', function (Blueprint $table) {
            $table->date('assigned_date')->nullable()->after('session_id');
            // Note: Dropping day_of_week causes SQLite issues with indexes
            // Commenting out for now - the column will remain but won't be used
            // $table->dropColumn('day_of_week');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_halaqoh_officers', function (Blueprint $table) {
            $table->tinyInteger('day_of_week')->after('session_id'); // Re-add
            $table->dropColumn('assigned_date');
        });
    }
};
