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
            $table->string('reading_quality')->nullable()->after('score'); // 'very_good' | 'good' | 'deficient' (we will store 'bagus' or 'kurang')
            $table->json('reading_deficiencies')->nullable()->after('reading_quality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropColumn('reading_quality');
            $table->dropColumn('reading_deficiencies');
        });
    }
};
