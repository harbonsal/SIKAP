<?php
$logPath = __DIR__ . '/../storage/logs/laravel.log';
if (file_exists($logPath)) {
    // Tampilkan 50 baris terakhir dari laravel.log
    $lines = file($logPath);
    $lastLines = array_slice($lines, -50);
    echo "<h1>Last 50 lines of Laravel Log</h1>";
    echo "<pre>";
    foreach ($lastLines as $line) {
        echo htmlspecialchars($line);
    }
    echo "</pre>";
} else {
    echo "Log file not found at: " . htmlspecialchars($logPath);
}
