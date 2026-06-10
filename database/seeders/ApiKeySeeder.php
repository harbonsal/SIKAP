<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ApiKey;
use Illuminate\Support\Str;

class ApiKeySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $existingKey = config('services.ortu_api_key');
        $keyToUse = $existingKey ? $existingKey : 'WALI_APP_' . Str::random(24);

        ApiKey::firstOrCreate(
            ['name' => 'Aplikasi Wali Santri'],
            [
                'key' => $keyToUse,
                'is_active' => true,
            ]
        );

        echo "Seeded API Key for Aplikasi Wali Santri: " . $keyToUse . "\n";
    }
}
