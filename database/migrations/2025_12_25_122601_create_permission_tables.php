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
        Schema::create('permission_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Pesiar Jumat"
            $table->foreignId('active_kamar_id')->constrained('active_kamars')->onDelete('cascade');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users'); // Musrif/Admin ID
            $table->timestamps();
        });

        Schema::create('student_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_group_id')->constrained('permission_groups')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade'); // Assuming 'students' table exists, or should it be 'users'? Usually reports link to Student ID.
            // Student table usually links to User. Let's use Student ID for consistency with other academic data.

            $table->enum('status', ['Pending', 'Out', 'Returned'])->default('Pending');
            $table->dateTime('exit_at')->nullable();
            $table->dateTime('return_at')->nullable();
            $table->boolean('is_late')->default(false);
            $table->text('keterangan')->nullable(); // Auto note like "Late 15 mins"
            $table->timestamps();

            // Unique constraint: A student status should not duplicate in same group
            $table->unique(['permission_group_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_permissions');
        Schema::dropIfExists('permission_groups');
    }
};
