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
        Schema::create('class_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_subject_id')->constrained('active_subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users');
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years');
            $table->foreignId('pekan_id')->nullable()->constrained('pekans');
            $table->string('jam_ke')->nullable(); // e.g., "1-2"
            $table->date('date');
            $table->text('topic');
            $table->text('description')->nullable();
            $table->string('status')->default('submitted'); // submitted, draft
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_journals');
    }
};
