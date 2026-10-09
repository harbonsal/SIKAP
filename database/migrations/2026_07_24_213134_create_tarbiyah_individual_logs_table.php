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
        Schema::create('tarbiyah_individual_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('month'); // e.g. "Juli 2026"
            $table->integer('week');
            
            // Catatan Kondisi & Masalah
            $table->text('academic_prob')->nullable();
            $table->text('academic_sol')->nullable();
            $table->text('ibadah_prob')->nullable();
            $table->text('ibadah_sol')->nullable();
            $table->text('personal_prob')->nullable();
            $table->text('personal_sol')->nullable();
            $table->text('social_prob')->nullable();
            $table->text('social_sol')->nullable();
            $table->text('comfort_prob')->nullable();
            $table->text('comfort_sol')->nullable();
            $table->text('family_prob')->nullable();
            $table->text('family_sol')->nullable();
            $table->text('health_prob')->nullable();
            $table->text('health_sol')->nullable();

            // Rekomendasi tingkat penanganan
            $table->enum('academic_trend', ['NAIK', 'STABIL', 'MENURUN'])->nullable();
            $table->enum('academic_action', ['PEMBINAAN', 'PEMBINAAN_INTENSIF', 'KONSELOR'])->nullable();
            $table->enum('akhlaq_trend', ['NAIK', 'STABIL', 'MENURUN'])->nullable();
            $table->enum('akhlaq_action', ['PEMBINAAN', 'PEMBINAAN_INTENSIF', 'KONSELOR'])->nullable();

            // Catatan Publik (Wali Santri)
            $table->text('public_notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarbiyah_individual_logs');
    }
};
