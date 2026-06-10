<?php

declare(strict_types=1);

/**
 * cPanel patch runner (browser-accessible from public folder).
 *
 * Usage:
 *   https://your-domain.com/cpanel_patch_runner.php?token=CHANGE_ME
 *
 * IMPORTANT:
 * - Change $token before running.
 * - Delete this file immediately after success.
 */

$token = 'sikap_api_patch_20260422_x7k9m2p4';

if (!isset($_GET['token']) || !hash_equals($token, (string) $_GET['token'])) {
    http_response_code(403);
    exit('Forbidden');
}

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$commands = [
    'optimize:clear',
    'migrate --force',
];

header('Content-Type: text/plain; charset=utf-8');
echo "Running patch commands...\n\n";

foreach ($commands as $command) {
    echo ">>> php artisan {$command}\n";
    $exitCode = $kernel->call($command);
    echo $kernel->output();
    echo "Exit code: {$exitCode}\n";
    echo str_repeat('-', 70) . "\n";
}

echo "\nDone.\n";
echo "Delete public/cpanel_patch_runner.php now for security.\n";
