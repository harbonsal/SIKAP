$UpdateDir = "temp_patch_tahfidz_late"
$ZipFile = "update_tahfidz_late_remedial.zip"

If (Test-Path $UpdateDir) { Remove-Item -Recurse -Force $UpdateDir }
New-Item -ItemType Directory -Path $UpdateDir | Out-Null

$Files = @(
    "database\migrations\2026_06_09_150131_add_is_excused_to_student_grades_table.php",
    "app\Http\Controllers\TahfidzAssessmentController.php",
    "resources\js\Pages\Teacher\TahfidzAssessment\StudentList.jsx",
    "resources\js\Pages\Teacher\TahfidzAssessment\Assessment.jsx"
)

foreach ($File in $Files) {
    if (Test-Path $File) {
        $DestDir = Split-Path -Path (Join-Path $UpdateDir $File) -Parent
        if (-not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir | Out-Null }
        Copy-Item -Path $File -Destination (Join-Path $UpdateDir $File)
    } else {
        Write-Warning "File not found: $File"
    }
}

# Copy public/build
$BuildDir = Join-Path $UpdateDir "public\build"
if (-not (Test-Path $BuildDir)) { New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null }
Copy-Item -Path "public\build\*" -Destination $BuildDir -Recurse

# Create update.php inside public directory so it's accessible via URL
$UpdatePhpContent = @"
<?php
echo "Memulai proses update Tahfidz Susulan & Remedial...<br>";

// 1. Jalankan Migrasi
echo "Menjalankan migrasi database...<br>";
// Use ../artisan because this file will be in public/
exec('php ../artisan migrate --force 2>&1', `$output, `$return_var);
foreach(`$output as `$line) {
    echo `$line . "<br>";
}

if (`$return_var === 0) {
    echo "<b>Update & Migrasi Berhasil!</b><br>";
} else {
    echo "<b>Terdapat kendala saat migrasi, harap cek log di atas.</b><br>";
}
// Hapus diri sendiri jika perlu
// unlink(__FILE__);
?>
"@

Set-Content -Path (Join-Path $BuildDir "..\update.php") -Value $UpdatePhpContent

If (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }
Compress-Archive -Path "$UpdateDir\*" -DestinationPath $ZipFile

Remove-Item -Recurse -Force $UpdateDir
Write-Host "Created $ZipFile successfully."
