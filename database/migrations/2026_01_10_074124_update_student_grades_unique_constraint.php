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
        Schema::table('student_grades', function (Blueprint $table) {
            // 1. Drop the FK that relies on the index (active_subject_id)
            // Laravel default FK name: table_column_foreign -> student_grades_active_subject_id_foreign
            $table->dropForeign(['active_subject_id']);

            // 2. Drop existing unique index
            $table->dropUnique('student_grade_unique');

            // 3. Add new unique index including semester_id
            $table->unique(['active_subject_id', 'student_id', 'grade_weight_id', 'semester_id'], 'student_grade_unique');

            // 4. Restore the FK
            $table->foreign('active_subject_id')
                ->references('id')
                ->on('active_subjects')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            // Reverse process
            $table->dropForeign(['active_subject_id']);
            $table->dropUnique('student_grade_unique');

            $table->unique(['active_subject_id', 'student_id', 'grade_weight_id'], 'student_grade_unique');

            $table->foreign('active_subject_id')
                ->references('id')
                ->on('active_subjects')
                ->onDelete('cascade');
        });
    }
};
