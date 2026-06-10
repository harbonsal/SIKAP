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
        if (!Schema::hasColumn('supervisions', 'topic')) {
            Schema::table('supervisions', function (Blueprint $table) {
                $table->string('topic')->nullable()->after('active_subject_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supervisions', function (Blueprint $table) {
            $table->dropColumn('topic');
        });
    }
};
