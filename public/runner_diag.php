<?php
/**
 * SIKAP — Diagnostik Runner
 * File ini ada di: public/runner_diag.php
 * Akses: https://sikap.sinawang.my.id/runner_diag.php
 * Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

// Dari public/, Laravel root ada di ../
$candidates = [
    __DIR__,                    // public/ sendiri (jika domain → root laravel)
    dirname(__DIR__),           // satu level up = Laravel root (jika domain → public/)
    dirname(dirname(__DIR__)),  // dua level up
];

function checkPath($path, $label) {
    $exists = file_exists($path);
    return ($exists ? '✅' : '❌') . " $label";
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>SIKAP Diagnostik</title>
<style>
body{font-family:Arial,sans-serif;background:#0d1117;color:#c9d1d9;padding:20px;margin:0;}
h1{color:#58a6ff;} h2{color:#79c0ff;border-bottom:1px solid #30363d;padding-bottom:5px;margin-top:25px;}
table{width:100%;border-collapse:collapse;margin-bottom:15px;}
td{padding:8px 12px;border:1px solid #30363d;vertical-align:top;font-size:13px;}
tr:nth-child(even){background:#161b22;}
code{background:#2d333b;padding:2px 6px;border-radius:4px;font-size:12px;word-break:break-all;}
.ok{color:#3fb950;font-weight:bold;} .fail{color:#f85149;font-weight:bold;} .warn{color:#d29922;}
.box{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:15px 20px;margin-bottom:15px;}
</style>
</head>
<body>
<h1>🔍 SIKAP Diagnostik</h1>

<div class="box">
<h2>📂 Lokasi File</h2>
<table>
<tr><td>__FILE__</td><td><code><?= htmlspecialchars(__FILE__) ?></code></td></tr>
<tr><td>__DIR__</td><td><code><?= htmlspecialchars(__DIR__) ?></code></td></tr>
<tr><td>DOCUMENT_ROOT</td><td><code><?= htmlspecialchars($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') ?></code></td></tr>
<tr><td>SCRIPT_FILENAME</td><td><code><?= htmlspecialchars($_SERVER['SCRIPT_FILENAME'] ?? 'N/A') ?></code></td></tr>
</table>
</div>

<div class="box">
<h2>🔎 Deteksi Laravel Root</h2>
<table>
<?php
$foundRoot = null;
foreach ($candidates as $i => $path) {
    $labels = ['Folder ini (__DIR__)', 'Satu level atas (../)', 'Dua level atas (../../)'];
    $v = file_exists($path.'/vendor/autoload.php') ? '✅' : '❌';
    $b = file_exists($path.'/bootstrap/app.php')   ? '✅' : '❌';
    $e = file_exists($path.'/.env')                ? '✅' : '❌';
    $a = file_exists($path.'/artisan')              ? '✅' : '❌';
    $isRoot = (!$foundRoot && $v==='✅' && $b==='✅') ? ' ← <strong class="ok">INI ROOTNYA</strong>' : '';
    echo "<tr><td><strong>{$labels[$i]}</strong><br><code>" . htmlspecialchars($path) . "</code>$isRoot</td>";
    echo "<td>vendor: $v &nbsp; bootstrap: $b &nbsp; .env: $e &nbsp; artisan: $a</td></tr>\n";
    if (!$foundRoot && $v==='✅' && $b==='✅') $foundRoot = $path;
}
?>
</table>
<?php if ($foundRoot): ?>
<p class="ok">✅ Laravel root: <code><?= htmlspecialchars($foundRoot) ?></code></p>
<?php else: ?>
<p class="fail">❌ Laravel root tidak ditemukan di 3 lokasi yang dicek!</p>
<?php endif; ?>
</div>

<div class="box">
<h2>🐘 PHP Server Info</h2>
<table>
<tr><td>PHP Version</td><td><code><?= PHP_VERSION ?></code></td></tr>
<tr><td>Memory Limit</td><td><code><?= ini_get('memory_limit') ?></code></td></tr>
<tr><td>Max Exec Time</td><td><code><?= ini_get('max_execution_time') ?>s</code></td></tr>
<tr><td>disable_functions</td><td><code><?= ini_get('disable_functions') ?: '(none)' ?></code></td></tr>
<tr><td>Extensions</td><td>
pdo: <?= extension_loaded('pdo') ? '<span class="ok">✅</span>' : '<span class="fail">❌</span>' ?> &nbsp;
pdo_mysql: <?= extension_loaded('pdo_mysql') ? '<span class="ok">✅</span>' : '<span class="fail">❌</span>' ?> &nbsp;
mbstring: <?= extension_loaded('mbstring') ? '<span class="ok">✅</span>' : '<span class="fail">❌</span>' ?> &nbsp;
openssl: <?= extension_loaded('openssl') ? '<span class="ok">✅</span>' : '<span class="fail">❌</span>' ?> &nbsp;
tokenizer: <?= extension_loaded('tokenizer') ? '<span class="ok">✅</span>' : '<span class="fail">❌</span>' ?>
</td></tr>
</table>
</div>

<?php if ($foundRoot && file_exists($foundRoot.'/.env')): ?>
<div class="box">
<h2>📄 .env (sensor data sensitif)</h2>
<table>
<?php
$lines = file($foundRoot.'/.env', FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    if (str_starts_with(trim($line), '#')) continue;
    if (preg_match('/^(APP_KEY|DB_PASSWORD|MAIL_PASSWORD|SECRET)/', $line)) {
        $line = preg_replace('/=.*/', '=***', $line);
    }
    echo "<tr><td><code>".htmlspecialchars($line)."</code></td></tr>\n";
}
?>
</table>
</div>
<?php endif; ?>

<p style="color:#555;font-size:12px;margin-top:30px;">⚠️ Hapus <code>runner_diag.php</code> dari server setelah selesai!</p>
</body>
</html>
