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
        Schema::table('student_permissions', function (Blueprint $table) {
            $table->integer('uang_saku')->nullable();
            $table->string('barang_titipan')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_permissions', function (Blueprint $table) {
            $table->dropColumn(['uang_saku', 'barang_titipan']);
        });
    }
};
