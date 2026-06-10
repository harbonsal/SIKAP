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
        // 1. Handle "Santri" -> "Siswa" merge/rename
        $santri = DB::table('user_levels')->where('name', 'Santri')->first();
        $siswa = DB::table('user_levels')->where('name', 'Siswa')->first();

        if ($santri && $siswa) {
            // Both exist, move users from Santri to Siswa and delete Santri level
            DB::table('users')->where('user_level_id', $santri->id)->update(['user_level_id' => $siswa->id]);
            DB::table('user_levels')->where('id', $santri->id)->delete();
        } elseif ($santri && !$siswa) {
            // Only Santri exists, rename it to Siswa
            DB::table('user_levels')->where('id', $santri->id)->update(['name' => 'Siswa']);
        }

        // 2. Rename other "Santri ..." levels to "Siswa ..."
        // We use a raw query or simple fetch-update loop to be safe with string replacement
        $levels = DB::table('user_levels')->where('name', 'LIKE', 'Santri%')->get();
        foreach ($levels as $level) {
            $newName = str_replace('Santri', 'Siswa', $level->name);

            // Check if target name already exists to avoid Unique violation if any (though unlikely for variants)
            $exists = DB::table('user_levels')->where('name', $newName)->exists();
            if (!$exists) {
                DB::table('user_levels')->where('id', $level->id)->update(['name' => $newName]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting this is complex because we merged users.
        // We can just rename "Siswa%" back to "Santri%" but we can't separate the merged users.

        $levels = DB::table('user_levels')->where('name', 'LIKE', 'Siswa%')->get();
        foreach ($levels as $level) {
            $newName = str_replace('Siswa', 'Santri', $level->name);
            $exists = DB::table('user_levels')->where('name', $newName)->exists();
            if (!$exists) {
                DB::table('user_levels')->where('id', $level->id)->update(['name' => $newName]);
            }
        }
    }
};
