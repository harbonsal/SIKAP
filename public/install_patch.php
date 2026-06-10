<?php
// Script to run migrations and clear cache on cPanel

// Load Laravel
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

echo "<h1>Patch Installer: Kaldik & Dashboard</h1>";

try {
    echo "<p>Running migrations...</p>";
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";

    echo "<p>Clearing caches...</p>";
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo "<pre>" . \Illuminate\Support\Facades\Artisan::output() . "</pre>";
    
    echo "<h3>Success! The patch has been installed.</h3>";
    echo "<p><b>IMPORTANT:</b> Please delete this file (<code>public/install_patch.php</code>) for security.</p>";
} catch (\Exception $e) {
    echo "<h3>Error:</h3>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
