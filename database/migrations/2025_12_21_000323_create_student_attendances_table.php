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
        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_journal_id')->constrained('class_journals')->onDelete('cascade');
            $table->unsignedBigInteger('student_id'); // Usually points to users table but let's be flexible
            // If student is a User
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');

            $table->enum('status', ['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'])->default('Hadir');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_attendances');
    }
};
