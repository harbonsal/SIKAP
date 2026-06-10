<?php
/**
 * SIKAP — Check Migration Status
 * File ini ada di: public/runner_check_migration.php
 * Akses: https://sikap.sinawang.my.id/runner_check_migration.php
 * ⚠️ Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
set_time_limit(300);

define('RUNNER_PASSWORD', 'sikap2026');

$inputPassword = $_GET['key'] ?? $_POST['key'] ?? '';

if ($inputPassword !== RUNNER_PASSWORD) {
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP Runner</title>
    <style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;}
    .box{background:#16213e;padding:40px;border-radius:12px;color:#e0e0e0;text-align:center;width:350px;}
    h2{color:#e94560;margin-bottom:20px;}
    input{width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:#fff;margin-bottom:15px;box-sizing:border-box;}
    button{width:100%;padding:12px;background:#e94560;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px;}
    button:hover{background:#c73652;}</style></head><body>
    <div class="box"><h2>🔐 SIKAP Runner</h2><p>Password untuk cek migration:</p>
    <form method="POST"><input type="password" name="key" placeholder="Password..." autofocus>
    <button type="submit">Cek Migration</button></form></div></body></html>';
    exit;
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP — Check Migration</title>
<style>
body{font-family:"Courier New",monospace;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;}
h1{color:#58a6ff;border-bottom:1px solid #30363d;padding-bottom:10px;}
.log{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;white-space:pre-wrap;line-height:1.8;font-size:13px;}
.ok{color:#3fb950;font-weight:bold;} .fail{color:#f85149;font-weight:bold;} .info{color:#58a6ff;} .warn{color:#d29922;}
.done{background:#1a3a1a;border:1px solid #3fb950;border-radius:8px;padding:20px;margin-top:20px;color:#3fb950;}
.err{background:#3a1a1a;border:1px solid #f85149;border-radius:8px;padding:20px;margin-top:20px;color:#f85149;}
.debug{background:#1e1e2e;border:1px solid #444;border-radius:6px;padding:10px;margin-bottom:15px;font-size:12px;color:#888;}
code{background:#2d2d2d;padding:2px 6px;border-radius:4px;}
</style></head><body>
<h1>🔍 SIKAP Runner — Check Migration Status</h1>';

// Auto-detect Laravel root
$candidates = [__DIR__, dirname(__DIR__), dirname(dirname(__DIR__))];
$laravelRoot = null;
foreach ($candidates as $path) {
    if (file_exists($path.'/vendor/autoload.php') && file_exists($path.'/bootstrap/app.php')) {
        $laravelRoot = $path;
        break;
    }
}

echo '<div class="debug">';
echo 'Laravel root: <code>'.htmlspecialchars($laravelRoot ?? 'NOT FOUND').'</code>';
echo '</div>';

if (!$laravelRoot) {
    echo '<div class="err">❌ Laravel root tidak ditemukan!</div>';
    echo '</body></html>';
    exit;
}

try {
    define('LARAVEL_START', microtime(true));
    require $laravelRoot.'/vendor/autoload.php';
    echo '<span class="ok">✅ Autoloader OK</span>'."\n";

    $app = require_once $laravelRoot.'/bootstrap/app.php';
    echo '<span class="ok">✅ Bootstrap OK</span>'."\n\n";

    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    echo '<div class="log">';
    echo '<span class="info">▶ Cek kolom status di tabel academic_years...</span>'."\n\n";

    // Check if status column exists
    $schema = Illuminate\Support\Facades\Schema::getConnection()->getDoctrineSchemaManager();
    $columns = $schema->listTableColumns('academic_years');
    
    if (isset($columns['status'])) {
        echo '<span class="ok">✅ Kolom "status" ADA di tabel academic_years.</span>'."\n";
        echo '  - Type: '.$columns['status']->getType()->getName()."\n";
        echo '  - Default: '.($columns['status']->getDefault() ?? 'NULL')."\n\n";
        
        // Check data
        $academicYears = \App\Models\AcademicYear::all(['id', 'name', 'is_active', 'status']);
        echo '<span class="info">▶ Data di tabel academic_years:</span>'."\n";
        foreach ($academicYears as $year) {
            $status = $year->status ?? 'NULL';
            echo "  ID: {$year->id} | Name: {$year->name} | is_active: " . ($year->is_active ? 'true' : 'false') . " | status: {$status}\n";
        }
    } else {
        echo '<span class="fail">❌ Kolom "status" TIDAK ADA di tabel academic_years.</span>'."\n";
        echo '  Migration belum dijalankan atau gagal.'."\n\n";
        echo '<span class="warn">⚠️ Jalankan runner_migrate.php untuk menambahkan kolom status.</span>'."\n";
    }

    echo '</div>';

    $elapsed = round(microtime(true) - LARAVEL_START, 2);

    if (isset($columns['status'])) {
        echo '<div class="done">✅ <strong>Migration berhasil! Kolom status sudah ada.</strong><br><br>
        Langkah selanjutnya → <a href="runner_cache.php?key='.RUNNER_PASSWORD.'"><strong>runner_cache.php</strong></a><br><br>
        🗑️ Hapus <code>runner_check_migration.php</code> setelah selesai!</div>';
    } else {
        echo '<div class="err">⚠️ Migration belum berhasil. Kolom status belum ada.<br><br>
        Jalankan <a href="runner_migrate.php?key='.RUNNER_PASSWORD.'"><strong>runner_migrate.php</strong></a> terlebih dahulu.</div>';
    }

} catch (\Throwable $e) {
    echo '<span class="fail">EXCEPTION: '.htmlspecialchars($e->getMessage()).'</span>'."\n";
    echo '<span class="warn">'.htmlspecialchars($e->getFile()).' line '.$e->getLine().'</span>'."\n";
    echo htmlspecialchars($e->getTraceAsString());
    echo '</div>';
    echo '<div class="err">❌ Error. Lihat detail di atas.</div>';
}

echo '</body></html>';
