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
        Schema::create('tahfidz_memorizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->tinyInteger('juz');
            $table->json('completed_pages')->nullable(); // Stores array of actual page numbers
            $table->boolean('is_completed')->default(false);
            $table->timestamps();

            $table->unique(['student_id', 'juz']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_memorizations');
    }
};
