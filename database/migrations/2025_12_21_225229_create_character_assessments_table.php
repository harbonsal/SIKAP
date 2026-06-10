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
        Schema::create('character_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade'); // Assuming student references User
            $table->foreignId('active_class_id')->constrained('active_classes')->onDelete('cascade');
            $table->string('category'); // Ibadah, Akhlak, etc.
            $table->decimal('score', 8, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();

            // Unique constraint per student-class-category
            $table->unique(['student_id', 'active_class_id', 'category'], 'char_assess_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('character_assessments');
    }
};
