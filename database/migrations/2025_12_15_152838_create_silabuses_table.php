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
        Schema::create('silabuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapel_id')->constrained('mapels')->onDelete('cascade');
            $table->foreignId('jenjang_id')->constrained('jenjangs')->onDelete('cascade');
            $table->string('kurikulum')->default('Merdeka'); // e.g., Merdeka, K13
            $table->string('semester')->default('Ganjil'); // Ganjil, Genap
            $table->string('kode')->nullable(); // e.g., 3.1
            $table->text('kompetensi'); // KD or CP
            $table->text('materi'); // Materi Pokok
            $table->string('alokasi_waktu')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('silabuses');
    }
};
