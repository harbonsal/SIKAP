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
        Schema::table('student_questionnaires', function (Blueprint $table) {
            $table->json('options')->nullable()->after('type'); // Stores custom descriptor for {4: "Desc", 3: "Desc", ...}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_questionnaires', function (Blueprint $table) {
            $table->dropColumn('options');
        });
    }
};
