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
        Schema::table('school_infos', function (Blueprint $table) {
            $table->string('headmaster_signature')->nullable()->after('stamp_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_infos', function (Blueprint $table) {
            $table->dropColumn('headmaster_signature');
        });
    }
};
