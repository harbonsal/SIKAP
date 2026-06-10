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
        Schema::create('active_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('kelas_id')->constrained('kelas')->onDelete('cascade');
            $table->foreignId('kelas_paralel_id')->constrained('kelas_paralels')->onDelete('cascade');
            $table->foreignId('teacher_id')->nullable()->constrained('users')->onDelete('set null'); // Wali Kelas
            $table->string('name')->nullable(); // Optional custom name, e.g., "7A Unggulan"
            $table->timestamps();

            // Unique constraint to prevent duplicate class in same academic year
            $table->unique(['academic_year_id', 'kelas_id', 'kelas_paralel_id'], 'unique_active_class');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_classes');
    }
};
