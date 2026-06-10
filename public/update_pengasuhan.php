<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

echo "<h1>Proses Update...</h1>";
echo "<pre>";

// Clear Cache
$kernel->call('optimize:clear');
echo "Cache cleared!\n";

echo "</pre>";
echo "<h2>Selesai! Silakan hapus file update_pengasuhan.php ini untuk keamanan.</h2>";
