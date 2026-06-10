<?php
/**
 * SIKAP — PHP Runner: Clear Cache & Optimize
 * File ini ada di: public/runner_cache.php
 * Akses: https://sikap.sinawang.my.id/runner_cache.php
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
    <div class="box"><h2>🔐 SIKAP Runner</h2><p>Password untuk cache clear:</p>
    <form method="POST"><input type="password" name="key" placeholder="Password..." autofocus>
    <button type="submit">Jalankan Cache Clear</button></form></div></body></html>';
    exit;
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP — Cache Clear</title>
<style>
body{font-family:"Courier New",monospace;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;}
h1{color:#58a6ff;border-bottom:1px solid #30363d;padding-bottom:10px;}
.step{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:15px 20px;margin-bottom:10px;}
.step h3{margin:0 0 8px 0;color:#58a6ff;font-size:14px;}
.log{white-space:pre-wrap;font-size:13px;line-height:1.6;}
.ok{color:#3fb950;font-weight:bold;} .fail{color:#f85149;font-weight:bold;} .warn{color:#d29922;}
.done{background:#1a3a1a;border:1px solid #3fb950;border-radius:8px;padding:20px;margin-top:20px;color:#3fb950;}
.err{background:#3a1a1a;border:1px solid #f85149;border-radius:8px;padding:20px;margin-top:20px;color:#f85149;}
.debug{background:#1e1e2e;border:1px solid #444;border-radius:6px;padding:10px;margin-bottom:15px;font-size:12px;color:#888;}
code{background:#2d2d2d;padding:2px 6px;border-radius:4px;}
</style></head><body>
<h1>🧹 SIKAP Runner — Cache Clear & Optimize</h1>';

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
    $app    = require_once $laravelRoot.'/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

    $commands = [
        ['command'=>'optimize:clear', 'label'=>'🧹 optimize:clear', 'desc'=>'Hapus semua cache'],
        ['command'=>'config:cache',   'label'=>'⚙️  config:cache',   'desc'=>'Cache konfigurasi'],
        ['command'=>'route:cache',    'label'=>'🛣️  route:cache',    'desc'=>'Cache routing'],
        ['command'=>'view:cache',     'label'=>'👁️  view:cache',     'desc'=>'Cache view'],
    ];

    $allOk = true;

    foreach ($commands as $cmd) {
        echo '<div class="step">';
        echo '<h3>'.$cmd['label'].' <span style="color:#666;font-weight:normal;">— '.$cmd['desc'].'</span></h3>';
        echo '<div class="log">';
        try {
            $input  = new Symfony\Component\Console\Input\ArrayInput(['command'=>$cmd['command']]);
            $output = new Symfony\Component\Console\Output\BufferedOutput();
            $status = $kernel->handle($input, $output);
            $result = preg_replace('/\033\[[0-9;]*m/', '', $output->fetch());
            if ($status === 0) {
                echo '<span class="ok">✅ '.htmlspecialchars(trim($result) ?: 'Selesai.').'</span>';
            } else {
                echo '<span class="fail">❌ '.htmlspecialchars(trim($result)).'</span>';
                $allOk = false;
            }
        } catch (\Throwable $e) {
            echo '<span class="fail">❌ '.htmlspecialchars($e->getMessage()).'</span>';
            $allOk = false;
        }
        echo '</div></div>';
        flush(); ob_flush();
    }

    $elapsed = round(microtime(true) - LARAVEL_START, 2);

    if ($allOk) {
        echo '<div class="done">
        ✅ <strong>Semua cache selesai ('.$elapsed.'s)!</strong><br><br>
        🎉 <strong>Update SIKAP 17 Mei 2026 berhasil di-deploy!</strong><br><br>
        Fitur Baru: Sistem Draft Tahun Pelajaran<br>
        Verifikasi: Master → Tahun Pelajaran (lihat badge status DRAFT/SIAP/ARSIP)<br><br>
        🗑️ <strong>Hapus dari server:</strong> <code>runner_migrate.php</code> &nbsp; <code>runner_cache.php</code> &nbsp; <code>runner_diag.php</code>
        </div>';
    } else {
        echo '<div class="err">⚠️ Ada yang gagal. Periksa output di atas.</div>';
    }

} catch (\Throwable $e) {
    echo '<div class="err">❌ <strong>'.htmlspecialchars($e->getMessage()).'</strong><br>';
    echo '<small>'.htmlspecialchars($e->getFile()).' line '.$e->getLine().'</small></div>';
}

echo '</body></html>';
