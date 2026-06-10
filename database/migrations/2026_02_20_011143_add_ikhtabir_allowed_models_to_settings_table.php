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
        // Insert default allowed models configuration
        \DB::table('settings')->insertOrIgnore([
            'key' => 'ikhtabir_allowed_models',
            'value' => json_encode([
                'gemini-1.5-flash' => true,
                'gemini-1.5-pro' => true,
                'gpt-4o' => false,
                'gpt-4o-mini' => true,
                'gpt-3.5-turbo' => true,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the setting
        \DB::table('settings')->where('key', 'ikhtabir_allowed_models')->delete();
    }
};
