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
        Schema::create('kkms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('mapel_id')->constrained('mapels')->onDelete('cascade');
            $table->foreignId('jenjang_id')->constrained('jenjangs')->onDelete('cascade'); // KKM per jenjang (e.g., 7, 8, 9)
            $table->integer('kkm_value'); // e.g., 75
            $table->timestamps();

            // Unique constraint: One KKM per mapel per jenjang per academic year
            $table->unique(['academic_year_id', 'mapel_id', 'jenjang_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kkms');
    }
};
