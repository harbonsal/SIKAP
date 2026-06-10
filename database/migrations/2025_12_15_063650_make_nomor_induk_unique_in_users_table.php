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
        Schema::table('users', function (Blueprint $table) {
            // Update existing users to have a unique nomor_induk
            $users = DB::table('users')->whereNull('nomor_induk')->orWhere('nomor_induk', '')->get();
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update(['nomor_induk' => 'U' . str_pad($user->id, 5, '0', STR_PAD_LEFT)]);
            }

            $table->string('nomor_induk')->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['nomor_induk']);
            $table->string('nomor_induk')->nullable()->change();
        });
    }
};
