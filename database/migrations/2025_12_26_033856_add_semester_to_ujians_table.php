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
        Schema::table('ujians', function (Blueprint $table) {
            $table->enum('semester', ['ganjil', 'genap', 'all'])->default('all')->after('name');
        });

        // Update existing data
        DB::table('ujians')->where('name', 'UAS')->update(['semester' => 'ganjil']);
        DB::table('ujians')->where('name', 'UKK')->update(['semester' => 'genap']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ujians', function (Blueprint $table) {
            $table->dropColumn('semester');
        });
    }
};
