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
        Schema::table('character_categories', function (Blueprint $table) {
            $table->string('type')->default('rubric')->after('id'); // 'dimension' or 'rubric'
            $table->integer('min_score')->nullable()->after('description');
            $table->integer('max_score')->nullable()->after('min_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('character_categories', function (Blueprint $table) {
            $table->dropColumn(['type', 'min_score', 'max_score']);
        });
    }
};
