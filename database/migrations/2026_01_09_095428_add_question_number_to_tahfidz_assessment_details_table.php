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
        Schema::table('tahfidz_assessment_details', function (Blueprint $table) {
            $table->integer('question_number')->default(1)->after('student_grade_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_assessment_details', function (Blueprint $table) {
            $table->dropColumn('question_number');
        });
    }
};
