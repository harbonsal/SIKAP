<?php
/**
 * Safe DB Fix Script - To be placed in public/
 */
$appPath = realpath(__DIR__ . '/..');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>SIKAP - Fix DB Script</h1>";
echo "<pre>";

function runArtisan($command) {
    global $appPath;
    echo "Running: php artisan $command...\n";
    $output = [];
    $return_var = 0;
    exec("cd \"$appPath\" && php artisan $command 2>&1", $output, $return_var);
    echo implode("\n", $output) . "\n";
    echo "Exit Code: $return_var\n\n";
    return $return_var === 0;
}

echo "Migrating Database with --force...\n";
runArtisan('migrate --force');

echo "Clearing Cache...\n";
runArtisan('optimize:clear');

echo "</pre>";
echo "<h2 style='color:green'>Fix Complete!</h2>";
echo "<p>Please <strong>DELETE</strong> this file (<code>run_fix.php</code>) from your server for security reasons.</p>";
