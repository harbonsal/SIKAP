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
        Schema::create('tahfidz_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('active_subject_id')->nullable()->constrained()->onDelete('set null'); // Optional link to class context
            $table->date('date');
            $table->enum('type', ['ziyadah', 'murajaah']);
            $table->integer('juz')->nullable();
            $table->integer('page')->nullable(); // Current page location
            $table->string('surah')->nullable();
            $table->integer('verse_start')->nullable();
            $table->integer('verse_end')->nullable();
            $table->integer('lines')->default(0); // Amount memorized/read in lines (15 lines = 1 page)
            $table->string('status')->default('Lancar'); // Lancar, Ulang, dll
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_entries');
    }
};
