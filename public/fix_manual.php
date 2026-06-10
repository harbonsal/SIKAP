<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\Schedule;
use Illuminate\Support\Facades\DB;

echo "<h2>Penyelamat Jadwal Manual</h2>";

// Ensure column exists
if (!Schema::hasColumn('schedules', 'is_manual')) {
    Schema::table('schedules', function (Blueprint $table) {
        $table->boolean('is_manual')->default(true);
    });
    echo "✅ Kolom keamanan (is_manual) berhasil dipasang.<br>";
}

// Find timestamps with > 50 schedules
$bulkTimestamps = Schedule::select('created_at', DB::raw('count(*) as total'))
    ->groupBy('created_at')
    ->having('total', '>', 50)
    ->get();

$totalFixed = 0;
foreach ($bulkTimestamps as $group) {
    $count = Schedule::where('created_at', $group->created_at)->update(['is_manual' => false]);
    $totalFixed += $count;
    echo "Memisahkan {$count} jadwal dari hasil auto-generate (waktu pembuatan: {$group->created_at}).<br>";
}

echo "<br><b>Operasi Selesai!</b><br>";
echo "Total <b>{$totalFixed}</b> jadwal berhasil diidentifikasi sebagai jadwal otomatis dan dicabut status manualnya.<br>";
echo "Jadwal yang Anda input sendiri lewat Editor (baik satuan maupun per kelas) tetap aman dan tidak akan terhapus.<br>";
echo "<br><h3>Langkah Selanjutnya:</h3>";
echo "Silakan kembali ke halaman SIKAP dan klik tombol <b>Auto Generate</b> (jangan klik Kosongkan Jadwal). Sistem kini akan mempertahankan jadwal manual Anda dan membongkar ulang $totalFixed jadwal otomatis tersebut untuk mengisi celah-celah kosong dengan lebih pintar.";
