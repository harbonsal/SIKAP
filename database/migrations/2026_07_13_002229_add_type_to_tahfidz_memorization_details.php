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
        if (!Schema::hasColumn('tahfidz_memorization_details', 'type')) {
            Schema::table('tahfidz_memorization_details', function (Blueprint $table) {
                $table->enum('type', ['sabaq', 'sabqi', 'manzil'])->default('sabaq')->after('juz');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_memorization_details', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};

