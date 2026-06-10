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
        Schema::table('hafalan_skrinings', function (Blueprint $table) {
            $table->foreignId('hafalan_skrining_report_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hafalan_skrinings', function (Blueprint $table) {
            $table->dropForeign(['hafalan_skrining_report_id']);
            $table->dropColumn('hafalan_skrining_report_id');
        });
    }
};
