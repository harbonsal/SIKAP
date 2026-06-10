<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TahfidzMemorization;
use App\Models\QuranProgress;

class SyncQuranProgress extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quran:sync-progress';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync completed Validasi Hafalan to Quran Progress';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting sync for Quran Progress...');

        $validations = TahfidzMemorization::where('is_completed', true)->with('student')->get();
        $count = 0;

        foreach ($validations as $validation) {
            $student = $validation->student;
            if (!$student || !$student->user_id) {
                continue;
            }

            $userId = $student->user_id;
            $juzNumber = $validation->juz;

            $progress = QuranProgress::firstOrCreate(
                ['user_id' => $userId, 'juz_number' => $juzNumber],
                ['is_completed' => true]
            );

            if (!$progress->wasRecentlyCreated && !$progress->is_completed) {
                $progress->is_completed = true;
                $progress->save();
                $count++;
            } elseif ($progress->wasRecentlyCreated) {
                $count++;
            }

            // Juga buat laporan skrining agar muncul di dashboard admin
            \App\Models\HafalanSkriningReport::firstOrCreate(
                ['user_id' => $userId, 'juz_number' => $juzNumber],
                ['total_mistakes' => 0]
            );
        }

        $this->info("Sync complete. $count records updated or created.");
    }
}
