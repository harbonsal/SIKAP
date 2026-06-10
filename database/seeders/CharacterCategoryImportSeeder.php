<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\CharacterCategory;

class CharacterCategoryImportSeeder extends Seeder
{
    public function run()
    {
        // 1. Seed Dimensions
        $dimensions = ['Ibadah', 'Patuh', 'Disiplin', 'Bersih', 'Sopan', 'Rajin'];

        // Truncate existing data first? 
        // Caution: If we truncate, we lose existing manual edits.
        // But for development fix now, truncate is safest to clean up the pure rubric import from before.
        CharacterCategory::truncate();

        foreach ($dimensions as $dim) {
            CharacterCategory::create([
                'name' => $dim,
                'type' => 'dimension',
                'is_active' => true,
                'description' => 'Aspek penilaian ' . $dim,
            ]);
        }

        // 2. Seed Rubrics from CSV
        $csvFile = base_path('komentar_akhlak.csv');

        if (!file_exists($csvFile)) {
            $this->command->error("File not found: $csvFile");
            return;
        }

        $handle = fopen($csvFile, 'r');
        fgetcsv($handle); // Skip header

        $count = 0;
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if (count($data) < 3) continue;

            $kode = trim($data[0]);
            $komentar = trim($data[1]);

            // Clean content
            $komentar = preg_replace('/^"+|"+$/', '', $komentar);
            $komentar = preg_replace('/^“|”$/', '', $komentar);

            $aktif = strtoupper(trim($data[2])) === 'Y';

            // Attempt to guess range or type from $kode?
            // "Kepatuhan Kurang", "IBADAH-01"
            // For now just import as Rubric. Ranges will be manual or future logic.


            // Attempt to guess range based on keywords
            $min = null;
            $max = null;
            $lowerKode = strtolower($kode);

            if (str_contains($lowerKode, 'kurang')) {
                $min = 0;
                $max = 60;
            } elseif (str_contains($lowerKode, 'sangat cukup')) {
                $min = 71;
                $max = 80;
            } // "Sangat Cukup" before "Cukup"
            elseif (str_contains($lowerKode, 'cukup')) {
                $min = 61;
                $max = 70;
            } elseif (str_contains($lowerKode, 'istimewa')) {
                $min = 96;
                $max = 100;
            } elseif (str_contains($lowerKode, 'sangat baik')) {
                $min = 89;
                $max = 95;
            } elseif (str_contains($lowerKode, 'baik')) {
                $min = 81;
                $max = 88;
            }

            // Numeric codes 01 (Best) to 03 (Low) logic from analysis
            elseif (str_ends_with($lowerKode, '01')) {
                $min = 86;
                $max = 100;
            } elseif (str_ends_with($lowerKode, '02')) {
                $min = 71;
                $max = 85;
            } elseif (str_ends_with($lowerKode, '03')) {
                $min = 0;
                $max = 70;
            }

            CharacterCategory::create([
                'name' => $kode,
                'type' => 'rubric',
                'description' => $komentar,
                'is_active' => $aktif,
                'min_score' => $min,
                'max_score' => $max,
            ]);
            $count++;
        }
        fclose($handle);

        $this->command->info("Successfully imported $count rubrics with auto-ranges and seeded dimensions.");
    }
}
