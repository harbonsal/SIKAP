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
        Schema::table('student_grades', function (Blueprint $table) {
            if (!Schema::hasColumn('student_grades', 'is_remedial')) {
                $table->boolean('is_remedial')->default(false)->after('is_excused');
            }
            if (!Schema::hasColumn('student_grades', 'is_retake')) {
                $table->boolean('is_retake')->default(false)->after('is_remedial');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            if (Schema::hasColumn('student_grades', 'is_retake')) {
                $table->dropColumn('is_retake');
            }
            if (Schema::hasColumn('student_grades', 'is_remedial')) {
                $table->dropColumn('is_remedial');
            }
        });
    }
};
