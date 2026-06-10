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
            if (!Schema::hasColumn('supervisions', 'topic')) {
                $table->string('topic')->nullable()->after('active_subject_id');
            }
            if (!Schema::hasColumn('supervisions', 'lesson_hours')) {
                $table->string('lesson_hours')->nullable()->after('date');
            }
            if (!Schema::hasColumn('supervisions', 'status')) {
                $table->string('status')->default('Belum Dinilai')->after('total_score');
            }
            if (!Schema::hasColumn('supervisions', 'proof_url')) {
                $table->string('proof_url')->nullable()->after('status');
            }
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
            $table->dropColumn(['topic', 'lesson_hours', 'status', 'proof_url', 'is_student_questionnaire_open']);
        });
    }
};
