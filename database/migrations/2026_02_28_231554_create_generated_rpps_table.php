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
        Schema::create('generated_rpps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('active_subject_id')->nullable();
            $table->string('topic');
            $table->foreignId('teaching_method_id')->nullable()->constrained('teaching_methods')->onDelete('set null');
            $table->integer('duration_minutes');
            $table->text('additional_notes')->nullable();
            $table->longText('ai_result_html')->nullable();
            $table->timestamps();

            // Foreign key to active_subjects if needed (without constraint if active_subjects might be wiped each semester)
            // Or with constraint if safe:
            // $table->foreign('active_subject_id')->references('id')->on('active_subjects')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_rpps');
    }
};
