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
        Schema::create('quran_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('juz_number');
            $table->string('last_verse_key')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->text('played_ayahs')->nullable(); // JSON array of played ayat keys
            $table->timestamps();

            $table->unique(['user_id', 'juz_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quran_progress');
    }
};
