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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('active_class_id')->constrained('active_classes')->onDelete('cascade');
            $table->foreignId('active_subject_id')->constrained('active_subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('day_id')->constrained()->onDelete('cascade');
            $table->foreignId('learning_hour_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Constraint: Class can only have one lesson per slot
            $table->unique(['active_class_id', 'day_id', 'learning_hour_id'], 'unique_class_slot');

            // Constraint: Teacher can only teach one lesson per slot
            $table->unique(['teacher_id', 'day_id', 'learning_hour_id'], 'unique_teacher_slot');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
