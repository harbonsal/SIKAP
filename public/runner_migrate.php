<?php
/**
 * SIKAP — PHP Runner: Migrate
 * File ini ada di: public/runner_migrate.php
 * Akses: https://sikap.sinawang.my.id/runner_migrate.php
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
    <div class="box"><h2>🔐 SIKAP Runner</h2><p>Password untuk jalankan migrate:</p>
    <form method="POST"><input type="password" name="key" placeholder="Password..." autofocus>
    <button type="submit">Jalankan Migrate</button></form></div></body></html>';
    exit;
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP — Migrate</title>
<style>
body{font-family:"Courier New",monospace;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;}
h1{color:#58a6ff;border-bottom:1px solid #30363d;padding-bottom:10px;}
.log{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;white-space:pre-wrap;line-height:1.8;font-size:13px;}
.ok{color:#3fb950;font-weight:bold;} .fail{color:#f85149;font-weight:bold;} .info{color:#58a6ff;} .warn{color:#d29922;}
.done{background:#1a3a1a;border:1px solid #3fb950;border-radius:8px;padding:20px;margin-top:20px;color:#3fb950;}
.err{background:#3a1a1a;border:1px solid #f85149;border-radius:8px;padding:20px;margin-top:20px;color:#f85149;}
.debug{background:#1e1e2e;border:1px solid #444;border-radius:6px;padding:10px;margin-bottom:15px;font-size:12px;color:#888;}
code{background:#2d2d2d;padding:2px 6px;border-radius:4px;} a{color:#58a6ff;}
</style></head><body>
<h1>🚀 SIKAP Runner — migrate</h1>';

// Auto-detect Laravel root (file ada di public/, root ada di ../)
$candidates = [__DIR__, dirname(__DIR__), dirname(dirname(__DIR__))];
$laravelRoot = null;
foreach ($candidates as $path) {
    if (file_exists($path.'/vendor/autoload.php') && file_exists($path.'/bootstrap/app.php')) {
        $laravelRoot = $path;
        break;
    }
}

echo '<div class="debug">';
echo '__DIR__: <code>'.htmlspecialchars(__DIR__).'</code><br>';
echo 'Laravel root: <code>'.htmlspecialchars($laravelRoot ?? 'NOT FOUND').'</code>';
echo '</div>';

if (!$laravelRoot) {
    echo '<div class="err">❌ Laravel root tidak ditemukan! Jalankan <a href="runner_diag.php">runner_diag.php</a> untuk diagnosa.</div>';
    echo '</body></html>';
    exit;
}

echo '<div class="log">';

try {
    // ── Bersihkan bootstrap/cache dulu ──────────────────────────────────────
    // Agar referensi package dev (misal: laravel/pail) tidak menyebabkan error
    $cacheDir   = $laravelRoot . '/bootstrap/cache';
    $cacheFiles = ['packages.php', 'services.php', 'config.php', 'routes-v7.php', 'events.php'];
    foreach ($cacheFiles as $cf) {
        $fp = $cacheDir . '/' . $cf;
        if (file_exists($fp)) {
            unlink($fp);
            echo '<span class="info">🗑️ Cache dihapus: bootstrap/cache/' . $cf . '</span>' . "\n";
        }
    }
    echo "\n";

    define('LARAVEL_START', microtime(true));
    require $laravelRoot.'/vendor/autoload.php';
    echo '<span class="ok">✅ Autoloader OK</span>'."\n";

    $app    = require_once $laravelRoot.'/bootstrap/app.php';
    echo '<span class="ok">✅ Bootstrap OK</span>'."\n\n";

    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $input  = new Symfony\Component\Console\Input\ArrayInput(['command'=>'migrate','--force'=>true]);
    $output = new Symfony\Component\Console\Output\BufferedOutput();

    echo '<span class="info">▶ Menjalankan migrate --force ...</span>'."\n\n";
    $status = $kernel->handle($input, $output);
    $result = preg_replace('/\033\[[0-9;]*m/', '', $output->fetch());
    echo htmlspecialchars($result);

    $elapsed = round(microtime(true) - LARAVEL_START, 2);
    echo '</div>';

    if ($status === 0) {
        echo '<div class="done">✅ <strong>Migration selesai ('.$elapsed.'s)</strong><br><br>
        Langkah selanjutnya → <a href="runner_cache.php?key='.RUNNER_PASSWORD.'"><strong>runner_cache.php</strong></a><br><br>
        🗑️ Hapus <code>runner_migrate.php</code> & <code>runner_cache.php</code> dari server setelah selesai!</div>';
    } else {
        echo '<div class="err">⚠️ Selesai dengan error (exit code: '.$status.'). Lihat output di atas.</div>';
    }

    $kernel->terminate($input, $status);

} catch (\Throwable $e) {
    echo '<span class="fail">EXCEPTION: '.htmlspecialchars($e->getMessage()).'</span>'."\n";
    echo '<span class="warn">'.htmlspecialchars($e->getFile()).' line '.$e->getLine().'</span>'."\n";
    echo htmlspecialchars($e->getTraceAsString());
    echo '</div>';
    echo '<div class="err">❌ Error. Lihat detail di atas.</div>';
}

echo '</body></html>';
