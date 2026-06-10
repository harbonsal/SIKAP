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
        Schema::create('supervision_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('min_score');
            $table->integer('max_score');
            $table->string('color_class')->nullable()->default('text-slate-600');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed default data based on existing hardcoded logic
        DB::table('supervision_categories')->insert([
            [
                'name' => 'Sangat Baik',
                'min_score' => 16,
                'max_score' => 100, // Safe upper limit
                'color_class' => 'text-green-600',
                'description' => 'Asdik Teladan',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Baik',
                'min_score' => 12,
                'max_score' => 15,
                'color_class' => 'text-blue-600',
                'description' => 'Memadai',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Cukup',
                'min_score' => 9,
                'max_score' => 11,
                'color_class' => 'text-yellow-600',
                'description' => 'Perlu Rencana',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Kurang',
                'min_score' => 0,
                'max_score' => 8,
                'color_class' => 'text-red-600',
                'description' => 'Intervensi',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supervision_categories');
    }
};
