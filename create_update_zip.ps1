$filesToZip = @(
    "database/migrations/2026_07_24_213116_create_musyrif_tarbiyah_plottings_table.php",
    "database/migrations/2026_07_24_213134_create_tarbiyah_individual_logs_table.php",
    "database/migrations/2026_07_24_213143_create_tarbiyah_group_logs_table.php",
    "database/migrations/2026_07_24_213152_create_tarbiyah_group_attendances_table.php",
    "app/Models/MusyrifTarbiyahPlotting.php",
    "app/Models/TarbiyahIndividualLog.php",
    "app/Models/TarbiyahGroupLog.php",
    "app/Models/TarbiyahGroupAttendance.php",
    "app/Http/Controllers/MusyrifTarbiyahDashboardController.php",
    "app/Http/Controllers/MusyrifTarbiyahPlottingController.php",
    "app/Http/Controllers/MusyrifTarbiyahIndividualLogController.php",
    "app/Http/Controllers/MusyrifTarbiyahGroupLogController.php",
    "routes/web.php",
    "resources/js/Components/Sidebar.jsx",
    "resources/js/Pages/Settings/Pengasuhan/MusyrifTarbiyah/Dashboard.jsx",
    "resources/js/Pages/Settings/Pengasuhan/MusyrifTarbiyah/Plotting.jsx",
    "resources/js/Pages/Settings/Pengasuhan/MusyrifTarbiyah/IndividualLog.jsx",
    "resources/js/Pages/Settings/Pengasuhan/MusyrifTarbiyah/GroupLog.jsx",
    "public/build"
)

$tempDir = "update_musyrif_temp"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToZip) {
    if (Test-Path $file) {
        $destPath = Join-Path $tempDir $file
        $destDir = Split-Path $destPath
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $file -Destination $destDir -Recurse -Force
    }
}

$migrationCode = @"
<?php
require __DIR__.'/../vendor/autoload.php';
`$app = require_once __DIR__.'/../bootstrap/app.php';
`$kernel = `$app->make(Illuminate\Contracts\Http\Kernel::class);
`$response = `$kernel->handle(
    `$request = Illuminate\Http\Request::capture()
);

try {
    Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    `$output = Illuminate\Support\Facades\Artisan::output();
    echo "<h1>Migrasi Berhasil</h1>";
    echo "<pre>" . htmlspecialchars(`$output) . "</pre>";
    
    // Delete this script after running
    @unlink(__FILE__);
    echo "<p><i>Script update otomatis dihapus untuk keamanan.</i></p>";
} catch (\Exception `$e) {
    echo "<h1>Migrasi Gagal</h1>";
    echo "<pre>" . htmlspecialchars(`$e->getMessage()) . "</pre>";
}
"@
Set-Content -Path "$tempDir/public/run_migration.php" -Value $migrationCode -Encoding UTF8

if (Test-Path "update_musyrif_cerdas.zip") { Remove-Item -Force "update_musyrif_cerdas.zip" }
Compress-Archive -Path "$tempDir/*" -DestinationPath "update_musyrif_cerdas.zip"
Remove-Item -Recurse -Force $tempDir
