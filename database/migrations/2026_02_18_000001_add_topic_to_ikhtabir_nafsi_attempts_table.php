<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('ikhtabir_nafsi_attempts', 'topic_id')) {
            Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
                $table->foreignId('topic_id')->nullable()->constrained('ikhtabir_nafsi_topics')->nullOnDelete()->after('session_id');
                $table->text('topic_text')->nullable()->after('topic_id'); // Snapshot of topic text
            });
        }
    }

    public function down(): void
    {
        Schema::table('ikhtabir_nafsi_attempts', function (Blueprint $table) {
            $table->dropForeign(['topic_id']);
            $table->dropColumn(['topic_id', 'topic_text']);
        });
    }
};
