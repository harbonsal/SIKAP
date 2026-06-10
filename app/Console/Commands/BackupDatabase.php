<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:database {--email : Send the backup via email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup the database to a .sql file and zip it.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting database backup...');

        $filename = 'backup-' . Carbon::now()->format('Y-m-d_H-i-s') . '.sql';
        $path = storage_path('app/backups/');

        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }

        $fullPath = $path . $filename;

        // DB Credentials
        $dbHost = config('database.connections.mysql.host');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        // Command for mysqldump
        // Added --no-tablespaces to avoid permission issues on some shared hosting
        $command = sprintf(
            'mysqldump --user=%s --password=%s --host=%s %s > %s',
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($dbHost),
            escapeshellarg($dbName),
            escapeshellarg($fullPath)
        );

        $output = [];
        $returnVar = null;
        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            $this->error('Database dump failed.');
            Log::error('Database backup failed for ' . $dbName);
            return 1;
        }

        // Zip the file
        $zipFilename = $filename . '.zip';
        $zipPath = $path . $zipFilename;

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) === TRUE) {
            $zip->addFile($fullPath, $filename);
            $zip->close();
            unlink($fullPath); // Remove raw .sql
        } else {
            $this->error('Failed to create zip file.');
            return 1;
        }

        $this->info('Backup created: ' . $zipFilename);
        Log::info('Database backup created: ' . $zipFilename);

        // Record status
        \App\Models\Setting::updateOrCreate(
            ['key' => 'last_backup_run'],
            ['value' => Carbon::now()->format('Y-m-d H:i:s')]
        );
        \App\Models\Setting::updateOrCreate(
            ['key' => 'last_backup_status'],
            ['value' => 'Success (' . $zipFilename . ')']
        );

        // CLEANUP: Keep last 7 days
        $this->cleanup();

        // Optional Email
        if ($this->option('email')) {
            $this->sendEmail($zipPath);
        }

        return 0;
    }

    protected function cleanup()
    {
        $path = storage_path('app/backups/');
        $files = glob($path . '*.zip');
        $now = time();
        $daysToKeep = 7;

        foreach ($files as $file) {
            if (is_file($file)) {
                if ($now - filemtime($file) >= 60 * 60 * 24 * $daysToKeep) {
                    unlink($file);
                }
            }
        }
    }

    protected function sendEmail($filePath)
    {
        // Try to get email from settings or .env
        $targetEmail = \App\Models\Setting::where('key', 'backup_email')->value('value') ?? env('ADMIN_EMAIL');

        if (!$targetEmail) {
            $this->warn('Backup finished, but no backup_email setting found. Email not sent.');
            return;
        }

        try {
            Mail::raw('Terlampir adalah backup database terbaru sistem SIKAP.', function ($message) use ($filePath, $targetEmail) {
                $message->to($targetEmail)
                    ->subject('SIKAP System Backup - ' . Carbon::now()->format('d M Y'))
                    ->attach($filePath);
            });
            $this->info('Backup email sent to ' . $targetEmail);
        } catch (\Exception $e) {
            $this->error('Failed to send backup email: ' . $e->getMessage());
            Log::error('Backup email failure: ' . $e->getMessage());
        }
    }
}
