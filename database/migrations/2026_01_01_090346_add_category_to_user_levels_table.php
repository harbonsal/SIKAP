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
        Schema::table('user_levels', function (Blueprint $table) {
            $table->enum('category', ['Santri', 'Ustadz', 'Lainnya'])->default('Lainnya')->after('name');
        });

        // Seed Categories
        DB::table('user_levels')->whereIn('name', ['Santri', 'Santri Khusus', 'Santri Dengan Catatan', 'Calon Santri', 'Siswa', 'Alumni'])->update(['category' => 'Santri']);
        DB::table('user_levels')->whereIn('name', ['Guru', 'Guru Kelas', 'Wali Kelas', 'Kepala Sekolah', 'Administrator', 'Admin', 'Musyrif'])->update(['category' => 'Ustadz']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_levels', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
