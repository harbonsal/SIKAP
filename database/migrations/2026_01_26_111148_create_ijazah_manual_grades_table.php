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
        if (!Schema::hasTable('ijazah_manual_grades')) {
            Schema::create('ijazah_manual_grades', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
                $table->string('mapel_name'); // Matches the Ijazah Settings mapel name
                $table->integer('score');
                $table->timestamps();

                // Unique constraint to prevent duplicate grades for same mapel/student
                $table->unique(['student_id', 'mapel_name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ijazah_manual_grades');
    }
};
