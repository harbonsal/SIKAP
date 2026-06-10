<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SchoolInfo;
use App\Models\User;

$info = SchoolInfo::first();
echo "SchoolInfo headmaster_signature: " . ($info->headmaster_signature ?? 'NULL') . "\n";

$headmaster = User::where('nomor_induk', '1707012')->first();
if ($headmaster) {
    echo "Headmaster name: " . $headmaster->name . "\n";
    echo "Headmaster signature: " . ($headmaster->signature ?? 'NULL') . "\n";
} else {
    echo "Headmaster not found\n";
}
