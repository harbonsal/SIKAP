<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tahfidz_class_targets')) {
            Schema::create('tahfidz_class_targets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('active_class_id');
                $table->integer('semester');
                $table->json('juz_targets')->nullable();
                $table->timestamps();

                $table->foreign('active_class_id')->references('id')->on('active_classes')->onDelete('cascade');
                $table->unique(['active_class_id', 'semester']);
            });
        }

        if (!Schema::hasTable('tahfidz_student_targets')) {
            Schema::create('tahfidz_student_targets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('active_class_id');
                $table->integer('semester');
                $table->json('juz_targets')->nullable();
                $table->timestamps();

                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->foreign('active_class_id')->references('id')->on('active_classes')->onDelete('cascade');
                $table->unique(['student_id', 'active_class_id', 'semester']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tahfidz_student_targets');
        Schema::dropIfExists('tahfidz_class_targets');
    }
};
