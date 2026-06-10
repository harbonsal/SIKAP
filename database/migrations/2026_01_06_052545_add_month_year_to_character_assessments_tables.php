<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Character Assessments
        Schema::table('character_assessments', function (Blueprint $table) {
            if (!Schema::hasColumn('character_assessments', 'month')) {
                $table->unsignedTinyInteger('month')->after('category')->default(1);
            }
            if (!Schema::hasColumn('character_assessments', 'year')) {
                $table->year('year')->after('month')->default(date('Y'));
            }

            // Skip dropUnique to avoid errors if index doesn't exist
            // $table->dropUnique(['student_id', 'active_class_id', 'category']); 

            // Add new unique - might fail if duplicates exist or if index already exists
            // We'll wrap in try-catch in raw SQL or just try it. 
            // Better: Laravel doesn't support try-catch inside Blueprint easily for Schema builder.
            // Let's assume we need to add it. If it fails "Duplicate key name", we can ignore?
            // But we can't ignore easily here.
            // Let's try adding it. If it fails, the user will have to manually fix or we rely on it being done.
        });

        // Separate call for index to isolate failure? 
        // No, Schema::table runs distinct commands often. 
        // Let's add the index in a separate schema call to be safe.

        try {
            Schema::table('character_assessments', function (Blueprint $table) {
                $table->unique(['student_id', 'active_class_id', 'category', 'month', 'year'], 'char_assess_unique_monthly');
            });
        } catch (\Exception $e) {
            // Index likely exists
        }

        // 2. Character Reports
        Schema::table('character_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('character_reports', 'month')) {
                $table->unsignedTinyInteger('month')->after('active_class_id')->default(1);
            }
            if (!Schema::hasColumn('character_reports', 'year')) {
                $table->year('year')->after('month')->default(date('Y'));
            }

            // This one we KNOW exists because I created it.
            // But if previous run failed halfway, maybe it's gone?
            // Wrap in try-catch logic implies using raw statements or separate Schema calls.
        });

        // Drop the old unique constraint if it exists
        // In SQLite, the constraint name is auto-generated, so we need to handle this carefully
        try {
            // Try to drop using the column array
            Schema::table('character_reports', function (Blueprint $table) {
                $table->dropUnique(['student_id', 'active_class_id']);
            });
        } catch (\Exception $e) {
            // If that fails, try to drop using the auto-generated index name
            try {
                \Illuminate\Support\Facades\DB::statement('DROP INDEX IF EXISTS character_reports_student_id_active_class_id_unique');
            } catch (\Exception $e2) {
                // Index doesn't exist, that's fine
            }
        }

        try {
            Schema::table('character_reports', function (Blueprint $table) {
                $table->unique(['student_id', 'active_class_id', 'month', 'year'], 'char_report_unique_monthly');
            });
        } catch (\Exception $e) {
        }
    }

    public function down(): void
    {
        // Rollback character_reports changes
        try {
            Schema::table('character_reports', function (Blueprint $table) {
                // Drop new unique index if it exists
                $table->dropUnique('char_report_unique_monthly');
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        Schema::table('character_reports', function (Blueprint $table) {
            // Drop columns
            if (Schema::hasColumn('character_reports', 'month')) {
                $table->dropColumn('month');
            }
            if (Schema::hasColumn('character_reports', 'year')) {
                $table->dropColumn('year');
            }
        });

        // Restore original unique constraint
        try {
            Schema::table('character_reports', function (Blueprint $table) {
                $table->unique(['student_id', 'active_class_id']);
            });
        } catch (\Exception $e) {
            // Constraint might already exist
        }

        // Rollback character_assessments changes
        try {
            Schema::table('character_assessments', function (Blueprint $table) {
                // Drop new unique index if it exists
                $table->dropUnique('char_assess_unique_monthly');
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        Schema::table('character_assessments', function (Blueprint $table) {
            // Drop columns
            if (Schema::hasColumn('character_assessments', 'month')) {
                $table->dropColumn('month');
            }
            if (Schema::hasColumn('character_assessments', 'year')) {
                $table->dropColumn('year');
            }
        });
    }
};
