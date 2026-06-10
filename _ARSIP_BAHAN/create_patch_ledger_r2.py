import os
import zipfile

# Files to include
files_to_zip = [
    'app/Http/Controllers/ClassGradeRecapController.php',
    'resources/js/Pages/Teacher/Assessment/Recap/Class/Show.jsx',
    'resources/js/Pages/Teacher/Assessment/Recap/Class/LedgerTab.jsx',
]

directories_to_zip = [
    'public/build'
]

output_filename = 'update_ledger_r2.zip'

# Create update.php
update_php_content = """<?php
echo "Memulai proses update Penambahan Kolom R2 pada Ledger...<br>";

// 1. Ekstrak file
$zip = new ZipArchive;
$res = $zip->open('update_ledger_r2.zip');
if ($res === TRUE) {
    $zip->extractTo(__DIR__);
    $zip->close();
    echo "File berhasil diekstrak.<br>";
} else {
    echo "Gagal mengekstrak file ZIP.<br>";
}

// 2. Clear cache
echo "Membersihkan cache...<br>";
exec('php artisan optimize:clear 2>&1', $output, $return_var);
foreach($output as $line) {
    echo $line . "<br>";
}

echo "<b>Update Selesai!</b><br>";
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
