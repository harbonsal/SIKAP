<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('backup:database --email')->weeklyOn(0, '00:00');

// Pengingat Otomatis ke HP Asatidzah (Input Nilai, Tarbiyah, dll) setiap jam 08:00 dan 16:00
Schedule::command('sikap:send-reminders')->dailyAt('08:00');
Schedule::command('sikap:send-reminders')->dailyAt('16:00');
