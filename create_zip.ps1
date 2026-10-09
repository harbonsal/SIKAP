$sourceDir = "f:\MASTER PROGRAM\SIKAP"
$zipFile = "f:\MASTER PROGRAM\SIKAP\update_musyrif_v2.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipFile, 'Create')

$files = @(
    "app/Http/Controllers/MusyrifTarbiyahDashboardController.php",
    "app/Models/Student.php",
    "resources/js/Pages/Settings/Pengasuhan/MusyrifTarbiyah/Dashboard.jsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $sourceDir $file
    if (Test-Path $fullPath) {
        $entryName = $file -replace '\\', '/'
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $entryName)
    }
}

$buildDir = Join-Path $sourceDir "public\build"
if (Test-Path $buildDir) {
    $buildFiles = Get-ChildItem -Path $buildDir -Recurse -File
    foreach ($file in $buildFiles) {
        $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
        $entryName = $relativePath -replace '\\', '/'
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName)
    }
}

$zip.Dispose()
Write-Output "Zip created successfully at $zipFile"
