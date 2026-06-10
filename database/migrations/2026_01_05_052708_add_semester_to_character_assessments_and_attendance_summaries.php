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
            if (!Schema::hasColumn('character_assessments', 'semester')) {
                $table->string('semester')->default('Ganjil')->after('active_class_id');
            }
        });

        Schema::table('attendance_summaries', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_summaries', 'semester')) {
                $table->string('semester')->default('Ganjil')->after('academic_year_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('character_assessments', function (Blueprint $table) {
            $table->dropColumn('semester');
        });

        Schema::table('attendance_summaries', function (Blueprint $table) {
            $table->dropColumn('semester');
        });
    }
};
