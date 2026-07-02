<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

ini_set('display_errors', '1');
error_reporting(E_ALL);

try {
    define('LARAVEL_START', microtime(true));

    if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
        require $maintenance;
    }

    require __DIR__.'/../vendor/autoload.php';

    /** @var Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';

    $app->handleRequest(Request::capture());
} catch (\Throwable $e) {
    echo "<div style='font-family:sans-serif; padding:20px; background:#ffebeb; border:2px solid red; border-radius:10px;'>";
    echo "<h1 style='color:red;'>🚨 ULTIMATE DEBUGGER 🚨</h1>";
    echo "<p><b>PESAN ERROR:</b> " . $e->getMessage() . "</p>";
    echo "<p><b>LOKASI FILE:</b> " . $e->getFile() . " (Baris " . $e->getLine() . ")</p>";
    echo "<hr><p><b>Detail Lacak:</b></p><pre style='background:#fff; padding:10px; border:1px solid #ccc; font-size:12px; overflow-x:auto;'>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
}
