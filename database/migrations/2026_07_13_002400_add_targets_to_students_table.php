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
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'target_sabqi_pages')) {
                $table->integer('target_sabqi_pages')->nullable();
            }
            if (!Schema::hasColumn('students', 'target_manzil_pages')) {
                $table->integer('target_manzil_pages')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['target_sabqi_pages', 'target_manzil_pages']);
        });
    }
};

