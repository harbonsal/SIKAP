<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tahfidz_musyrifs MODIFY student_id bigint unsigned NULL;');
        } else {
            Schema::table('tahfidz_musyrifs', function (Blueprint $table) {
                // For newer Laravel versions / sqlite
                try {
                    $table->unsignedBigInteger('student_id')->nullable()->change();
                } catch (\Exception $e) {
                    // ignore if sqlite fails on change
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tahfidz_musyrifs MODIFY student_id bigint unsigned NOT NULL;');
        }
    }
};
