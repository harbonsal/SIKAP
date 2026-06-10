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
        Schema::table('character_assessments', function (Blueprint $table) {
            // Add semester_id, nullable first to avoid forcing data on existing rows (if any)
            // But we can set default to 1 (Ganjil) or whatever current semester is if we want.
            // For now nullable.
            $table->foreignId('semester_id')->nullable()->after('active_class_id')->constrained('semesters')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('character_assessments', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });
    }
};
