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
        DB::table('user_levels')->insert([
            ['name' => 'Santri Khusus', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Santri Dengan Catatan', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('user_levels')->whereIn('name', ['Santri Khusus', 'Santri Dengan Catatan'])->delete();
    }
};
