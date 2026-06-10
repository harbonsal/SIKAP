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
        // Drop the table entirely to avoid foreign key issues during modification
        Schema::dropIfExists('kkms');

        Schema::create('kkms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->onDelete('cascade');
            $table->foreignId('mapel_id')->constrained('mapels')->onDelete('cascade');
            // Replaced jenjang_id with kelas_id
            $table->foreignId('kelas_id')->constrained('kelas')->onDelete('cascade');
            $table->integer('kkm_value');
            $table->timestamps();

            // New unique constraint
            $table->unique(['academic_year_id', 'mapel_id', 'kelas_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kkms', function (Blueprint $table) {
            $table->dropForeign(['kelas_id']);
            $table->dropColumn('kelas_id');
            $table->foreignId('jenjang_id')->after('mapel_id')->constrained('jenjangs')->onDelete('cascade');
            $table->unique(['academic_year_id', 'mapel_id', 'jenjang_id']);
        });
    }
};
