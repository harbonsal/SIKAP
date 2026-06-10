import os
import shutil
import zipfile

patch_dir = r'f:\MASTER PROGRAM\SIKAP\temp_patch_debug'
if os.path.exists(patch_dir):
    shutil.rmtree(patch_dir)

os.makedirs(os.path.join(patch_dir, 'public'))

debug_code = """<?php
// Simple script to read the last 100 lines of laravel.log
$logFile = __DIR__ . '/../storage/logs/laravel.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -100);
    echo "<h1>Last 100 lines of laravel.log</h1>";
    echo "<pre>";
    foreach ($lastLines as $line) {
        echo htmlspecialchars($line);
    }
    echo "</pre>";
} else {
    echo "<h1>Log file not found</h1><p>Path checked: " . htmlspecialchars($logFile) . "</p>";
}
?>"""

with open(os.path.join(patch_dir, 'public', 'debug.php'), 'w') as f:
    f.write(debug_code)

zip_path = r'f:\MASTER PROGRAM\SIKAP\patch_debug.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(patch_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, patch_dir)
            zipf.write(file_path, arcname)

shutil.rmtree(patch_dir)
print('Smart zip patch_debug.zip successfully created.')
