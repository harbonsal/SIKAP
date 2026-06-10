<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Carbon\Carbon;

class BackupController extends Controller
{
    public function index()
    {
        $path = storage_path('app/backups/');
        $backups = [];

        if (File::exists($path)) {
            $files = File::files($path);
            foreach ($files as $file) {
                if ($file->getExtension() === 'zip') {
                    $backups[] = [
                        'filename' => $file->getFilename(),
                        'size' => $this->formatBytes($file->getSize()),
                        'created_at' => Carbon::createFromTimestamp($file->getMTime())->format('Y-m-d H:i:s'),
                    ];
                }
            }
        }

        // Sort by date desc
        usort($backups, function ($a, $b) {
            return $b['created_at'] <=> $a['created_at'];
        });

        return Inertia::render('Settings/SystemBackup', [
            'backups' => $backups,
            'backup_email' => \App\Models\Setting::where('key', 'backup_email')->value('value') ?? env('ADMIN_EMAIL', ''),
            'last_backup_run' => \App\Models\Setting::where('key', 'last_backup_run')->value('value') || '-',
            'last_backup_status' => \App\Models\Setting::where('key', 'last_backup_status')->value('value') || '-',
            'mail_mailer' => env('MAIL_MAILER', 'log'),
        ]);
    }

    public function testEmail()
    {
        try {
            // Run with email flag
            Artisan::call('backup:database', ['--email' => true]);
            return back()->with('success', 'Backup & Test Email berhasil dipicu! Silakan cek inbox (atau log jika MAILER=log).');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memicu test email: ' . $e->getMessage());
        }
    }

    public function run()
    {
        try {
            // Run without email by default for manual trigger, 
            // unless we want to always send email if configured.
            Artisan::call('backup:database');
            return back()->with('success', 'Backup database berhasil dibuat!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal membuat backup: ' . $e->getMessage());
        }
    }

    public function download($filename)
    {
        $path = storage_path('app/backups/' . $filename);

        if (!File::exists($path)) {
            abort(404);
        }

        return response()->download($path);
    }

    public function destroy($filename)
    {
        $path = storage_path('app/backups/' . $filename);

        if (File::exists($path)) {
            File::delete($path);
            return back()->with('success', 'File backup berhasil dihapus.');
        }

        return back()->with('error', 'File tidak ditemukan.');
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'backup_email' => 'nullable|email',
        ]);

        \App\Models\Setting::updateOrCreate(
            ['key' => 'backup_email'],
            ['value' => $request->backup_email]
        );

        return back()->with('success', 'Pengaturan backup berhasil diperbarui.');
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
