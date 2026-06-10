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
        try {
            Schema::table('report_notes', function (Blueprint $table) {
                $table->dropUnique('report_notes_unique');
            });
        } catch (\Exception $e) {
        }

        try {
            Schema::table('report_notes', function (Blueprint $table) {
                $table->unique(['student_id', 'active_class_id', 'type', 'semester'], 'report_notes_unique_semester');
            });
        } catch (\Exception $e) {
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('report_notes', function (Blueprint $table) {
                $table->dropUnique('report_notes_unique_semester');
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        try {
            Schema::table('report_notes', function (Blueprint $table) {
                $table->unique(['student_id', 'active_class_id', 'type'], 'report_notes_unique');
            });
        } catch (\Exception $e) {
            // Constraint might already exist
        }
    }
};
