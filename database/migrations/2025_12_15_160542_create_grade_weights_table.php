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
        Schema::create('grade_weights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->enum('category', ['pengetahuan', 'keterampilan']);
            $table->string('name'); // e.g., "Rata-rata Harian", "PTS", "PAS"
            $table->integer('weight'); // e.g., 50, 25, 25
            $table->timestamps();

            // Unique constraint: No duplicate weight name per category per academic year
            $table->unique(['academic_year_id', 'category', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_weights');
    }
};
