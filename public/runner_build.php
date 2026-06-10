<?php
/**
 * SIKAP — Build React Assets
 * File ini ada di: public/runner_build.php
 * Akses: https://sikap.sinawang.my.id/runner_build.php
 * ⚠️ Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
set_time_limit(600);

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
    <div class="box"><h2>🔐 SIKAP Runner</h2><p>Password untuk build assets:</p>
    <form method="POST"><input type="password" name="key" placeholder="Password..." autofocus>
    <button type="submit">Build Assets</button></form></div></body></html>';
    exit;
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP — Build Assets</title>
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
<h1>🔨 SIKAP Runner — Build React Assets</h1>';

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
    
    echo '<div class="log">';
    echo '<span class="info">▶ Memulai build React assets...</span>'."\n\n";
    
    // Check if npm is available
    $npmCheck = shell_exec('which npm 2>&1');
    if (!$npmCheck) {
        $npmCheck = shell_exec('where npm 2>&1');
    }
    
    echo '<span class="info">NPM location: </span>'.htmlspecialchars(trim($npmCheck ?: 'NOT FOUND'))."\n\n";
    
    // Change to Laravel root directory
    chdir($laravelRoot);
    echo '<span class="info">Working directory: </span>'.htmlspecialchars(getcwd())."\n\n";
    
    // Run npm install if node_modules doesn't exist
    if (!file_exists($laravelRoot.'/node_modules')) {
        echo '<span class="warn">⚠️ node_modules tidak ditemukan. Menjalankan npm install...</span>'."\n";
        $output = shell_exec('npm install 2>&1');
        echo htmlspecialchars($output)."\n\n";
    } else {
        echo '<span class="ok">✅ node_modules sudah ada.</span>'."\n\n";
    }
    
    // Run npm run build
    echo '<span class="info">▶ Menjalankan npm run build...</span>'."\n";
    $output = shell_exec('npm run build 2>&1');
    echo htmlspecialchars($output)."\n\n";
    
    echo '</div>';

    $elapsed = round(microtime(true) - LARAVEL_START, 2);
    
    // Check if build was successful
    if (file_exists($laravelRoot.'/public/build') || file_exists($laravelRoot.'/build')) {
        echo '<div class="done">✅ <strong>Build selesai ('.$elapsed.'s)!</strong><br><br>
        Assets React berhasil di-build.<br><br>
        🗑️ Hapus <code>runner_build.php</code> dari server setelah selesai!</div>';
    } else {
        echo '<div class="err">⚠️ Build mungkin gagal. Periksa output di atas.<br><br>
        Pastikan Node.js dan npm sudah terinstall di server.</div>';
    }

} catch (\Throwable $e) {
    echo '<span class="fail">EXCEPTION: '.htmlspecialchars($e->getMessage()).'</span>'."\n";
    echo '<span class="warn">'.htmlspecialchars($e->getFile()).' line '.$e->getLine().'</span>'."\n";
    echo htmlspecialchars($e->getTraceAsString());
    echo '</div>';
    echo '<div class="err">❌ Error. Lihat detail di atas.</div>';
}

echo '</body></html>';
