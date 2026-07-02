<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Mengecek apakah tabel semesters kosong
        $hasSemesters = DB::table('semesters')->count() > 0;

        if (!$hasSemesters) {
            DB::table('semesters')->insert([
                [
                    'name' => 'Ganjil',
                    'is_active' => true, // Default aktif pertama kali
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'Genap',
                    'is_active' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Secara default tidak melakukan penghapusan untuk mencegah data hilang
        // Jika ingin di-rollback: 
        // DB::table('semesters')->whereIn('name', ['Ganjil', 'Genap'])->delete();
    }
};
