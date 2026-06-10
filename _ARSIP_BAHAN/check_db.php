<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \App\Models\TeacherUnavailableHour::count();
$all = \App\Models\TeacherUnavailableHour::all()->toArray();
echo "Total: " . $count . "\n";
print_r($all);
