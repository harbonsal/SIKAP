<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uh_participation_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uh_session_id')->constrained('uh_sessions')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['uh_session_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uh_participation_scores');
    }
};
