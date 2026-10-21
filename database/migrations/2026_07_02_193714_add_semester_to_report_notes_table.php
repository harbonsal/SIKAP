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
        if (!Schema::hasColumn('report_notes', 'semester')) {
            Schema::table('report_notes', function (Blueprint $table) {
                $table->string('semester')->nullable()->after('type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_notes', function (Blueprint $table) {
            $table->dropColumn('semester');
        });
    }
};
