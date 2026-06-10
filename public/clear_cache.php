<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);
\Illuminate\Support\Facades\Artisan::call('optimize:clear');
echo "<h1>Cache Laravel berhasil dibersihkan!</h1>";
echo "<p>Silakan kembali ke aplikasi dan lakukan Hard Refresh (Ctrl + F5).</p>";
