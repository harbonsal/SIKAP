<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Kamar;

class SyncMasterKamarCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-master-kamar';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Master Kamar data from legacy database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Master Kamar Synchronization...');

        $this->info("Fetching data from legacy table: kamar...");

        try {
            $legacyKamars = DB::connection('mysql_legacy')
                ->table('kamar')
                ->get();
        } catch (\Exception $e) {
            $this->error("Failed to query legacy table: " . $e->getMessage());
            return;
        }

        if ($legacyKamars->isEmpty()) {
            $this->warn("No data found in legacy 'kamar' table.");
            return;
        }

        $this->info("Found {$legacyKamars->count()} records. Processing...");

        $bar = $this->output->createProgressBar($legacyKamars->count());
        $bar->start();

        foreach ($legacyKamars as $row) {
            // $row has: ID_Kamar, Kode_Kamar, Kamar

            $name = $row->Kamar; // Name usually
            $code = $row->Kode_Kamar;

            Kamar::updateOrCreate(
                ['name' => $name],
                [
                    'building' => '-', // No info in legacy
                    'capacity' => 20,  // Default
                    'gender' => 'L',   // Default
                    'description' => "Kode Legacy: {$code}",
                ]
            );

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Master Kamar Synchronization completed successfully.');
    }
}
