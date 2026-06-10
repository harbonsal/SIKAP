<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResetCredentials extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-credentials';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all user credentials to default format (Student: ddmmyy.., Staff: *NIS#)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting credential reset...');

        $users = \App\Models\User::with(['userLevel', 'student'])->get();
        $bar = $this->output->createProgressBar(count($users));
        $bar->start();

        foreach ($users as $user) {
            // SKIP Admin or specific user ID 1
            if ($user->id === 1 || ($user->userLevel && $user->userLevel->name === 'Administrator')) {
                $bar->advance();
                continue;
            }

            $newPassword = null;
            $roleName = $user->userLevel->name ?? 'Unknown';

            // 1. SANTRI / SISWA
            if (in_array($roleName, ['Santri', 'Siswa']) || $user->student) {
                if ($user->student && $user->student->birth_date) {
                    // Format: ddmmyy..
                    $dob = \Carbon\Carbon::parse($user->student->birth_date)->format('dmy');
                    $newPassword = $dob . '..';
                } elseif ($user->nomor_induk) {
                    // FALLBACK: NIS..
                    $newPassword = $user->nomor_induk . '..';
                    // Optional: Log fallback usage
                    // $this->line(" Fallback used for {$user->name}"); 
                } else {
                    $this->error("\nSkipping User {$user->name} ({$roleName}) - No Birth Date and No NIS found.");
                }
            }
            // 2. GURU / STAFF / OTHERS
            else {
                if ($user->nomor_induk) {
                    // Format: *NIS#
                    $newPassword = '*' . $user->nomor_induk . '#';
                } else {
                    $this->error("\nSkipping User {$user->name} ({$roleName}) - No Nomor Induk found.");
                }
            }

            // Update if password generated
            if ($newPassword) {
                $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
                $user->save();
            }

            $bar->advance();
        }

        $bar->finish();
        $this->info("\nCredentials reset completed successfully.");
    }
}
