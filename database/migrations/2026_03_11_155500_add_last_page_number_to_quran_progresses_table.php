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
        Schema::table('quran_progress', function (Blueprint $table) {
            $table->integer('last_page_number')->nullable()->after('last_verse_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quran_progress', function (Blueprint $table) {
            $table->dropColumn('last_page_number');
        });
    }
};
