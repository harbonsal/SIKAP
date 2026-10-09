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
        if (!Schema::hasColumn('tahfidz_memorizations', 'type')) {
            Schema::table('tahfidz_memorizations', function (Blueprint $table) {
                $table->enum('type', ['sabaq', 'sabqi', 'manzil'])->default('sabaq')->after('juz');
            });
        }

        Schema::table('tahfidz_memorizations', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropUnique(['student_id', 'juz']);
            $table->unique(['student_id', 'juz', 'type']);
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_memorizations', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropUnique(['student_id', 'juz', 'type']);
            $table->unique(['student_id', 'juz']);
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            $table->dropColumn('type');
        });
    }
};

