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
        Schema::create('student_grade_histories', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('student_grade_id')->constrained()->onDelete('cascade');
            $blueprint->decimal('old_score', 5, 2)->nullable();
            $blueprint->decimal('new_score', 5, 2)->nullable();
            $blueprint->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Who changed it
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grade_histories');
    }
};
