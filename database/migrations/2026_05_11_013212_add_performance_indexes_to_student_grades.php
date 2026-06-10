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
        // Add indexes to student_grades table for query optimization
        Schema::table('student_grades', function (Blueprint $table) {
            // Add composite index for student-semester-subject queries
            if (!$this->indexExists('student_grades', 'idx_student_semester_subject')) {
                $table->index(['student_id', 'semester_id', 'active_subject_id'], 'idx_student_semester_subject');
            }
            
            // Add composite index for subject-semester-weight queries
            if (!$this->indexExists('student_grades', 'idx_subject_semester_weight')) {
                $table->index(['active_subject_id', 'semester_id', 'grade_weight_id'], 'idx_subject_semester_weight');
            }
            
            // Add composite index for semester-weight queries
            if (!$this->indexExists('student_grades', 'idx_semester_weight')) {
                $table->index(['semester_id', 'grade_weight_id'], 'idx_semester_weight');
            }
        });

        // Add indexes to active_subjects table
        Schema::table('active_subjects', function (Blueprint $table) {
            if (!$this->indexExists('active_subjects', 'idx_mapel_class')) {
                $table->index(['mapel_id', 'active_class_id'], 'idx_mapel_class');
            }
        });

        // Add indexes to class_members table
        Schema::table('class_members', function (Blueprint $table) {
            if (!$this->indexExists('class_members', 'idx_student_class')) {
                $table->index(['student_id', 'active_class_id'], 'idx_student_class');
            }
        });
    }
    
    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $driver = \DB::getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite: Query sqlite_master table
            $indexes = \DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name=?", [$indexName]);
            return count($indexes) > 0;
        } else {
            // MySQL/MariaDB: Use SHOW INDEX
            $indexes = \DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from student_grades table
        Schema::table('student_grades', function (Blueprint $table) {
            if ($this->indexExists('student_grades', 'idx_student_semester_subject')) {
                $table->dropIndex('idx_student_semester_subject');
            }
            
            if ($this->indexExists('student_grades', 'idx_subject_semester_weight')) {
                $table->dropIndex('idx_subject_semester_weight');
            }
            
            if ($this->indexExists('student_grades', 'idx_semester_weight')) {
                $table->dropIndex('idx_semester_weight');
            }
        });

        // Drop indexes from active_subjects table
        Schema::table('active_subjects', function (Blueprint $table) {
            if ($this->indexExists('active_subjects', 'idx_mapel_class')) {
                $table->dropIndex('idx_mapel_class');
            }
        });

        // Drop indexes from class_members table
        Schema::table('class_members', function (Blueprint $table) {
            if ($this->indexExists('class_members', 'idx_student_class')) {
                $table->dropIndex('idx_student_class');
            }
        });
    }
};
