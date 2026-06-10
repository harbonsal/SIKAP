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
        Schema::table('users', function (Blueprint $table) {
            $table->string('nomor_induk')->nullable()->after('email');
            $table->string('nama_arab')->nullable()->after('nomor_induk');
            $table->foreignId('user_level_id')->nullable()->after('nama_arab')->constrained('user_levels')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['user_level_id']);
            $table->dropColumn(['nomor_induk', 'nama_arab', 'user_level_id']);
        });
    }
};
