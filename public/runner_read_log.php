<?php
/**
 * SIKAP — Laravel Log Reader
 * File ini ada di: public/runner_read_log.php
 * Akses: https://sikap.sinawang.my.id/runner_read_log.php
 * Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

$candidates = [
    __DIR__,                    // public/
    dirname(__DIR__),           // Laravel root
    dirname(dirname(__DIR__)),  // two levels up
];

$foundRoot = null;
foreach ($candidates as $path) {
    if (file_exists($path.'/vendor/autoload.php') && file_exists($path.'/bootstrap/app.php')) {
        $foundRoot = $path;
        break;
    }
}

if (!$foundRoot) {
    echo "<h1>❌ Laravel Root Not Found</h1>";
    exit;
}

$logFile = $foundRoot . '/storage/logs/laravel.log';

echo "<html><head><title>Laravel Log Reader</title></head><body style='font-family: Arial, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px;'>";
echo "<h1 style='color: #58a6ff;'>📄 SIKAP Production Laravel Log Reader</h1>";
echo "<p>Log File: <code>" . htmlspecialchars($logFile) . "</code></p>";

if (!file_exists($logFile)) {
    echo "<p style='color: #f85149;'>Log file does not exist yet.</p>";
    exit;
}

$content = file_get_contents($logFile);
$lines = explode("\n", $content);
$lastLines = array_slice($lines, -150);

echo "<pre style='background: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 8px; overflow: auto; font-size: 13px; line-height: 1.5; color: #e6edf3;'>";
echo htmlspecialchars(implode("\n", $lastLines));
echo "</pre>";
echo "</body></html>";
