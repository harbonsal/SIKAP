<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hafalan_skrinings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('juz_number')->nullable();
            $table->unsignedSmallInteger('surah_number');
            $table->unsignedSmallInteger('ayat_number');
            $table->string('verse_key', 10);           // e.g. "78:5"
            $table->unsignedSmallInteger('page_number')->nullable();
            $table->text('full_ayat_text');             // full Arabic ayat for reference
            $table->text('kata_benar');                 // kata/frasa spesifik yang dipilih santri
            $table->text('hafalan_salah');              // hafalan yang keliru dari santri
            $table->timestamps();

            $table->index(['user_id', 'surah_number', 'ayat_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hafalan_skrinings');
    }
};
