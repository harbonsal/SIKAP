<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\ActiveKamar;

class MapLegacyData extends Command
{
    protected $signature = 'map:legacy-data';
    protected $description = 'Helper to map CSV values to DB IDs';

    public function handle()
    {
        $csvFile = base_path('sim_lama.csv');
        $csvData = array_map('str_getcsv', file($csvFile));
        $header = array_shift($csvData);

        $colMap = [];
        foreach ($header as $idx => $h) {
            $colMap[trim($h)] = $idx;
        }

        $idxKelas = $colMap['Kelas'] ?? -1;
        $idxKamar = $colMap['Kamar'] ?? -1;

        if ($idxKelas == -1 || $idxKamar == -1) {
            $this->error("Columns Kelas or Kamar not found.");
            return;
        }

        $csvClasses = [];
        $csvKamars = [];

        foreach ($csvData as $row) {
            if (isset($row[$idxKelas])) $csvClasses[] = trim($row[$idxKelas]);
            if (isset($row[$idxKamar])) $csvKamars[] = trim($row[$idxKamar]);
        }

        $csvClasses = array_unique(array_filter($csvClasses));
        $csvKamars = array_unique(array_filter($csvKamars));
        sort($csvClasses);
        sort($csvKamars);

        // DB Data
        $ay = AcademicYear::where('name', '2025/2026')->first();

        $this->info("--- CLASS MAPPING CANDIDATES (AY {$ay->name}) ---");
        $dbClasses = ActiveClass::where('academic_year_id', $ay->id)
            ->with('kelas', 'kelasParalel')->get();

        foreach ($dbClasses as $c) {
            $name = $c->kelas->name . ($c->kelasParalel ? " " . $c->kelasParalel->name : "");
            // Heuristic matching
            $this->line("DB ID: {$c->id} | Name: $name");
        }

        $this->info("\n--- CSV CLASSES FOUND ---");
        foreach ($csvClasses as $c) $this->line("CSV: $c");

        $this->info("\n--- KAMAR MAPPING CANDIDATES ---");
        $dbKamars = ActiveKamar::where('academic_year_id', $ay->id)->get();
        foreach ($dbKamars as $k) {
            $this->line("DB ID: {$k->id} | Name: {$k->name}");
        }

        $this->info("\n--- CSV KAMARS FOUND ---");
        foreach ($csvKamars as $k) $this->line("CSV: $k");
    }
}
