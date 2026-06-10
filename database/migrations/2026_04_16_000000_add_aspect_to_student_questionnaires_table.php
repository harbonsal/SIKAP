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
        if (!Schema::hasColumn('student_questionnaires', 'aspect')) {
            Schema::table('student_questionnaires', function (Blueprint $table) {
                $table->string('aspect')->nullable()->after('type')->comment('Aspect category: A, B, C, D, E');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_questionnaires', function (Blueprint $table) {
            $table->dropColumn('aspect');
        });
    }
};
