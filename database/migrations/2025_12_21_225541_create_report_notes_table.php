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
        Schema::create('report_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('active_class_id')->constrained('active_classes')->onDelete('cascade');
            $table->text('note');
            $table->string('type')->default('wali_kelas'); // wali_kelas, kepala_sekolah, etc.
            $table->timestamps();

            // Unique constraint per student-class-type
            $table->unique(['student_id', 'active_class_id', 'type'], 'report_notes_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_notes');
    }
};
