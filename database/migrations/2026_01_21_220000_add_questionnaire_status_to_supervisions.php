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
        Schema::table('supervisions', function (Blueprint $table) {
            if (!Schema::hasColumn('supervisions', 'is_student_questionnaire_open')) {
                $table->boolean('is_student_questionnaire_open')->default(false)->after('proof_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supervisions', function (Blueprint $table) {
            if (Schema::hasColumn('supervisions', 'is_student_questionnaire_open')) {
                $table->dropColumn('is_student_questionnaire_open');
            }
        });
    }
};
