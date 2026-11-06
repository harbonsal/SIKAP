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
        Schema::table('tahfidz_halaqoh_members', function (Blueprint $table) {
            if (!Schema::hasColumn('tahfidz_halaqoh_members', 'role')) {
                $table->string('role', 20)->default('anggota')->after('student_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_halaqoh_members', function (Blueprint $table) {
            if (Schema::hasColumn('tahfidz_halaqoh_members', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};

