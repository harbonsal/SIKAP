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
        if (!Schema::hasTable('tahfidz_standard_targets')) {
            Schema::create('tahfidz_standard_targets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('jenjang_id')->constrained()->cascadeOnDelete();
                $table->integer('semester_number');
                $table->integer('target_juz_count')->default(0);
                $table->string('juz_details')->nullable();
                $table->timestamps();
                
                // Ensure unique combination of jenjang and semester
                $table->unique(['jenjang_id', 'semester_number'], 'tst_jenjang_semester_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahfidz_standard_targets');
    }
};
