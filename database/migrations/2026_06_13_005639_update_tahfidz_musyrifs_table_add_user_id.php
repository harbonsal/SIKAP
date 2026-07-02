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
        Schema::table('tahfidz_musyrifs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
        });

        // Migrate existing data (find user_id from student_id)
        $musyrifs = \Illuminate\Support\Facades\DB::table('tahfidz_musyrifs')->get();
        foreach ($musyrifs as $m) {
            if ($m->student_id) {
                $student = \Illuminate\Support\Facades\DB::table('students')->where('id', $m->student_id)->first();
                if ($student && $student->user_id) {
                    \Illuminate\Support\Facades\DB::table('tahfidz_musyrifs')
                        ->where('id', $m->id)
                        ->update(['user_id' => $student->user_id]);
                }
            }
        }

        // Just make student_id nullable to avoid SQLite drop issues
        Schema::table('tahfidz_musyrifs', function (Blueprint $table) {
            // $table->dropForeign(['student_id']);
            // $table->dropColumn('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tahfidz_musyrifs', function (Blueprint $table) {
            $table->foreignId('student_id')->nullable()->after('id')->constrained('students')->onDelete('cascade');
        });

        $musyrifs = \Illuminate\Support\Facades\DB::table('tahfidz_musyrifs')->get();
        foreach ($musyrifs as $m) {
            if ($m->user_id) {
                $student = \Illuminate\Support\Facades\DB::table('students')->where('user_id', $m->user_id)->first();
                if ($student) {
                    \Illuminate\Support\Facades\DB::table('tahfidz_musyrifs')
                        ->where('id', $m->id)
                        ->update(['student_id' => $student->id]);
                }
            }
        }

        Schema::table('tahfidz_musyrifs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
