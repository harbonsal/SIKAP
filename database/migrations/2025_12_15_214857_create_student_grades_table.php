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
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_subject_id')->constrained('active_subjects')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('grade_weight_id')->constrained('grade_weights')->onDelete('cascade');
            $table->decimal('score', 5, 2)->nullable(); // e.g., 95.50
            $table->timestamps();

            // Ensure unique grade per student per component in a subject
            $table->unique(['active_subject_id', 'student_id', 'grade_weight_id'], 'student_grade_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
