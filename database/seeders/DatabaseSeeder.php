<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            RolePermissionSeeder::class,
            JenjangSeeder::class,
            TeachingMethodSeeder::class,
            IkhtabirNafsiTopicSeeder::class,
            CharacterCategoryImportSeeder::class,
            SupervisionQuestionSeeder::class,
            RubricSeeder::class,
            DayLearningHourSeeder::class
        ]);
    }
}
