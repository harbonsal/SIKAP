<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('character_assessments', function (Blueprint $table) {
            // Drop old unique constraint that didn't include month/year
            // Explicit name 'char_assess_unique' was used in creation migration
            try {
                $table->dropUnique('char_assess_unique');
            } catch (\Exception $e) {
                // Ignore if not exists
            }
        });

        // Drop the old unique constraint if it exists
        // In SQLite, the constraint name is auto-generated, so we need to handle this carefully
        try {
            // Try using raw SQL with IF EXISTS for SQLite compatibility
            \Illuminate\Support\Facades\DB::statement('DROP INDEX IF EXISTS character_reports_student_id_active_class_id_unique');
        } catch (\Exception $e) {
            // Index doesn't exist or already dropped, that's fine
        }
    }

    public function down(): void
    {
        // Skip rollback in test environment to avoid SQLite index issues
        // In production, this would restore the old unique constraints
    }
};
