<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = UserLevel::where('name', 'Administrator')->first();
        
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@sikap.com',
            'password' => Hash::make('password'),
            'nomor_induk' => 'ADMIN001',
            'user_level_id' => $adminRole ? $adminRole->id : null,
            'status' => 'Aktif',
        ]);
    }
}
