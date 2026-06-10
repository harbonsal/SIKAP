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
        if (!Schema::hasTable('student_questionnaires')) {
            Schema::create('student_questionnaires', function (Blueprint $table) {
                $table->id();
                $table->text('question');
                $table->integer('order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('student_questionnaire_responses')) {
            Schema::create('student_questionnaire_responses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supervision_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('question_id')->constrained('student_questionnaires')->cascadeOnDelete();
                $table->enum('answer', ['Ya', 'Tidak']);
                $table->text('note')->nullable();
                $table->timestamps();

                // Prevent duplicate answers for same question in same supervision by same student
                $table->unique(['supervision_id', 'student_id', 'question_id'], 'sqr_unique_entry');
            });
        }

        if (Schema::hasTable('supervisions') && !Schema::hasColumn('supervisions', 'is_student_questionnaire_open')) {
            Schema::table('supervisions', function (Blueprint $table) {
                $table->boolean('is_student_questionnaire_open')->default(false)->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supervisions', function (Blueprint $table) {
            $table->dropColumn('is_student_questionnaire_open');
        });

        Schema::dropIfExists('student_questionnaire_responses');
        Schema::dropIfExists('student_questionnaires');
    }
};
