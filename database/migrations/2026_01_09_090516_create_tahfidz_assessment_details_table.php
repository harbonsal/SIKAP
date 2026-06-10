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
        Schema::create('tahfidz_assessment_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_grade_id')->constrained()->cascadeOnDelete();
            $table->string('surah_name')->nullable();
            $table->integer('verse_start')->nullable();
            $table->integer('verse_end')->nullable();
            $table->integer('mistakes')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_assessment_details');
    }
};
