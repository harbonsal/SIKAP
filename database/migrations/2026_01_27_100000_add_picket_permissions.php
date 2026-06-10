<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Permission
        $permission = DB::table('permissions')->where('name', 'view_pickets')->first();

        if (!$permission) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'view_pickets',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } else {
            $permissionId = $permission->id;
        }

        // 2. Assign to Administrator (Level 1)
        // Assuming Administrator is ID 1 or name 'Administrator'
        $adminLevel = DB::table('user_levels')->where('name', 'Administrator')->first();
        if ($adminLevel) {
            DB::table('permission_user_level')->insert([
                'permission_id' => $permissionId,
                'user_level_id' => $adminLevel->id,
            ]);
        }

        // 3. Assign to Guru (Level ? Check name 'Guru')
        $guruLevel = DB::table('user_levels')->where('name', 'Guru')->first();
        if ($guruLevel) {
            DB::table('permission_user_level')->insert([
                'permission_id' => $permissionId,
                'user_level_id' => $guruLevel->id,
            ]);
        }

        // 4. Assign to Kepala Sekolah
        $kepsek = DB::table('user_levels')->where('name', 'Kepala Sekolah')->first();
        if ($kepsek) {
            DB::table('permission_user_level')->insert([
                'permission_id' => $permissionId,
                'user_level_id' => $kepsek->id,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $perm = DB::table('permissions')->where('name', 'view_pickets')->first();
        if ($perm) {
            DB::table('permission_user_level')->where('permission_id', $perm->id)->delete();
            DB::table('permissions')->where('id', $perm->id)->delete();
        }
    }
};
