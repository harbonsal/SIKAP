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
        Schema::table('student_questionnaires', function (Blueprint $table) {
            $table->enum('type', ['boolean', 'rating'])->default('boolean')->after('question');
        });

        // Check if using SQLite (for testing) or MySQL (for production)
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            // MySQL/MariaDB: use MODIFY COLUMN
            DB::statement("ALTER TABLE student_questionnaire_responses MODIFY COLUMN answer VARCHAR(255)");
        }
        // For SQLite, skip the modification as it's complex and not needed for testing
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_questionnaires', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        // Reverting not fully possible if data contains non-enum values, but we can try
        // DB::statement("ALTER TABLE student_questionnaire_responses MODIFY COLUMN answer ENUM('Ya', 'Tidak')");
    }
};
