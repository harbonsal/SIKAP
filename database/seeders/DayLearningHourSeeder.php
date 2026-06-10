<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DayLearningHourSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing
        \App\Models\DayLearningHour::truncate();

        $days = \App\Models\Day::all();
        $hours = \App\Models\LearningHour::all();

        foreach ($days as $day) {
            $dayName = strtolower($day->name);

            foreach ($hours as $hour) {
                $isActive = false;
                $h = $hour->hour_number;

                if ($dayName == 'senin') {
                    // Senin: 2-6 active
                    if ($h >= 2 && $h <= 6) {
                        $isActive = true;
                    }
                } else {
                    // Tue-Sat: 1-6 active (Assuming Sunday is not in Days or handled)
                    // If day is Ahad/Sunday, maybe not active?
                    // User said "ada 6 hari aktif", so assuming Mon-Sat.
                    if ($dayName != 'ahad' && $dayName != 'sunday') {
                        if ($h >= 1 && $h <= 6) {
                            $isActive = true;
                        }
                    }
                }

                if ($isActive) {
                    \App\Models\DayLearningHour::create([
                        'day_id' => $day->id,
                        'learning_hour_id' => $hour->id,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
