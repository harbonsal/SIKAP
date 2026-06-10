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
        if (!Schema::hasTable('ikhtabir_nafsi_topics')) {
            Schema::create('ikhtabir_nafsi_topics', function (Blueprint $table) {
                $table->id();
                $table->text('text_ar'); // content in Arabic
                $table->string('level')->default('B2'); // Difficulty level
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ikhtabir_nafsi_topics');
    }
};
