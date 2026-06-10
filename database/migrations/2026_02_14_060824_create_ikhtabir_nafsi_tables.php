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
        Schema::create('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('session_id')->unique(); // To track conversational session
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();

            // Scoring & Feedback (Filled at end of session)
            $table->integer('fluency_score')->nullable();
            $table->integer('pronunciation_score')->nullable();
            $table->integer('grammar_score')->nullable();
            $table->integer('vocabulary_score')->nullable();
            $table->integer('final_score')->nullable();
            $table->text('summary')->nullable(); // Simpulan (Bahasa Indonesia)

            $table->timestamps();
        });

        Schema::create('ikhtabir_nafsi_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('ikhtabir_nafsi_attempts')->onDelete('cascade');
            $table->enum('role', ['user', 'assistant']);
            $table->text('content')->nullable(); // Transcribed text or AI response
            $table->string('audio_path')->nullable(); // Path to audio file (User or AI TTS)
            $table->json('metadata')->nullable(); // To store individual utterance feedback
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ikhtabir_nafsi_messages');
        Schema::dropIfExists('ikhtabir_nafsi_attempts');
    }
};
