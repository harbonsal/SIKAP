import os
import zipfile
import shutil

# Files to include
files_to_zip = [
    'database/migrations/2026_06_09_150131_add_is_excused_to_student_grades_table.php',
    'app/Http/Controllers/TahfidzAssessmentController.php',
    'resources/js/Pages/Teacher/TahfidzAssessment/StudentList.jsx',
    'resources/js/Pages/Teacher/TahfidzAssessment/Assessment.jsx',
    # We also updated these in the previous session:
    'resources/js/Pages/Settings/Tahfidz/Index.jsx',
    'app/Http/Controllers/SettingController.php',
    'resources/js/Pages/Settings/Education/Schedule/Workspace.jsx',
]

directories_to_zip = [
    'public/build'
]

output_filename = 'update_tahfidz_late_remedial.zip'

# Create update.php
update_php_content = """<?php
echo "Memulai proses update Tahfidz Susulan & Remedial...<br>";

// 1. Ekstrak file
$zip = new ZipArchive;
$res = $zip->open('update_tahfidz_late_remedial.zip');
if ($res === TRUE) {
    $zip->extractTo(__DIR__);
    $zip->close();
    echo "File berhasil diekstrak.<br>";
} else {
    echo "Gagal mengekstrak file ZIP.<br>";
}

// 2. Jalankan Migrasi
echo "Menjalankan migrasi database...<br>";
exec('php artisan migrate --force 2>&1', $output, $return_var);
foreach($output as $line) {
    echo $line . "<br>";
}

if ($return_var === 0) {
    echo "<b>Update Berhasil!</b><br>";
} else {
    echo "<b>Terdapat kendala saat migrasi, harap cek log di atas.</b><br>";
}
?>
"""

with open('update.php', 'w') as f:
    f.write(update_php_content)

# Create the zip
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add files
    for file in files_to_zip:
        if os.path.exists(file):
            zipf.write(file, file)
        else:
            print(f"WARNING: File not found: {file}")
            
    # Add directories
    for directory in directories_to_zip:
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, file_path)

    # Add update.php
    zipf.write('update.php', 'update.php')

print(f"Created {output_filename}")
