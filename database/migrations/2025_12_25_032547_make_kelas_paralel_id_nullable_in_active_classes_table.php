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
        Schema::table('active_classes', function (Blueprint $table) {
            $table->foreignId('kelas_paralel_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('active_classes', function (Blueprint $table) {
            $table->foreignId('kelas_paralel_id')->nullable(false)->change();
        });
    }
};
