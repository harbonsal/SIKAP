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
        Schema::create('active_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_class_id')->constrained('active_classes')->onDelete('cascade');
            $table->foreignId('mapel_id')->constrained('mapels')->onDelete('cascade');
            $table->foreignId('teacher_id')->nullable()->constrained('users')->onDelete('set null'); // Guru Pengampu
            $table->timestamps();

            // Unique constraint: A subject can only appear once per class (e.g., only one "Matematika" record for 7A)
            $table->unique(['active_class_id', 'mapel_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_subjects');
    }
};
