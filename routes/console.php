<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:database --email')->weeklyOn(0, '00:00');

// 1. Pengingat Jam Mengajar KBM (lewat 10 menit belum isi jurnal/absensi)
// Dijalankan otomatis setiap 5 menit pada jam aktif KBM (06:45 s/d 16:30 WIB)
Schedule::command('sikap:send-reminders --type=kbm')
    ->everyFiveMinutes()
    ->timezone('Asia/Jakarta')
    ->between('06:45', '16:30');

// 2. Pengingat Rekap Nilai Akademik & Mutaba'ah Tarbiyah Asatidzah
// Dijalankan otomatis setiap hari pukul 13:00 WIB
Schedule::command('sikap:send-reminders --type=academic')
    ->timezone('Asia/Jakarta')
    ->dailyAt('13:00');
Schedule::command('sikap:send-reminders --type=tarbiyah')
    ->timezone('Asia/Jakarta')
    ->dailyAt('13:00');
