<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SchoolInfo;
use App\Models\User;
use App\Models\Jenjang;

$info = SchoolInfo::first();
echo "--- SchoolInfo ---\n";
echo "headmaster_name: " . ($info->headmaster_name ?? 'NULL') . "\n";
echo "headmaster_signature: " . ($info->headmaster_signature ?? 'NULL') . "\n";

echo "\n--- Headmaster User (1707012) ---\n";
$headmaster = User::where('nomor_induk', '1707012')->first();
if ($headmaster) {
    echo "ID: " . $headmaster->id . "\n";
    echo "Name: " . $headmaster->name . "\n";
    echo "Signature (DB): " . ($headmaster->signature ?? 'NULL') . "\n";
    $storagePath = storage_path('app/public/' . $headmaster->signature);
    echo "Storage File exists: " . (file_exists($storagePath) ? 'YES' : 'NO') . " ($storagePath)\n";
    $publicPath = public_path('images/signature/1707012.png');
    echo "Public File exists: " . (file_exists($publicPath) ? 'YES' : 'NO') . " ($publicPath)\n";
} else {
    echo "Headmaster not found\n";
}

echo "\n--- Jenjang and their Headmasters ---\n";
$jenjangs = Jenjang::with('headmaster')->get();
foreach ($jenjangs as $j) {
    echo "Jenjang: " . $j->name . " | Headmaster: " . ($j->headmaster->name ?? 'NONE') . " | Signature: " . ($j->headmaster->signature ?? 'NONE') . "\n";
}
