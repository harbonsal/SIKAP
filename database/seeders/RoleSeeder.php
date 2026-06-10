<?php

namespace Database\Seeders;

use App\Models\UserLevel;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Administrator',
            'Kepala Sekolah',
            'Wali Kelas',
            'Guru',
            'Musrif',
            'Santri',
        ];

        foreach ($roles as $role) {
            UserLevel::firstOrCreate(['name' => $role]);
        }
    }
}
