<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uh_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_subject_id')->constrained('active_subjects')->onDelete('cascade');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('cascade');
            $table->enum('type', ['UH1', 'UH2']);
            $table->unsignedTinyInteger('quiz_count')->default(1);
            $table->timestamps();

            $table->unique(['active_subject_id', 'semester_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uh_sessions');
    }
};
