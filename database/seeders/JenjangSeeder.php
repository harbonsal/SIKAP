<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JenjangSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jenjangs = [
            ['name' => "Ibtida'i", 'description' => 'Tingkat Dasar'],
            ['name' => 'Mutawassith', 'description' => 'Tingkat Menengah'],
            ['name' => 'Tsanawy', 'description' => 'Tingkat Atas'],
        ];

        foreach ($jenjangs as $jenjang) {
            \App\Models\Jenjang::create($jenjang);
        }
    }
}
