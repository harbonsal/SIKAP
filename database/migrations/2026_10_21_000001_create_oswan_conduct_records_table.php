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
        Schema::create('oswan_conduct_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('cascade');
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month'); // 1 - 12
            $table->unsignedTinyInteger('week_number'); // 1 - 5
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->unsignedSmallInteger('ibadah_count')->default(0)->comment('Keterlambatan Salat');
            $table->unsignedSmallInteger('bahasa_count')->default(0)->comment('Pelanggaran Bahasa Arab');
            $table->unsignedSmallInteger('tidur_count')->default(0)->comment('Pelanggaran Jam Tidur');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'academic_year_id', 'semester_id', 'year', 'month', 'week_number'],
                'oswan_conduct_unique_record'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oswan_conduct_records');
    }
};
