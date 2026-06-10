import os
import zipfile
import shutil

# Files to include
files_to_zip = [
    'app/Http/Controllers/CharacterAnalysisController.php',
    'app/Http/Controllers/AssessmentController.php',
    'routes/web.php',
    'resources/js/Components/Sidebar.jsx',
    'resources/js/Pages/Care/Character/Analysis/Index.jsx',
    'resources/js/Pages/Teacher/Assessment/Index.jsx',
]

directories_to_zip = [
    'public/build'
]

output_filename = 'update_analisa_akhlak.zip'

# Create update.php
update_php_content = """<?php
echo "Memulai proses update Analisa Nilai Akhlak...<br>";

echo "Membersihkan cache aplikasi agar route baru terbaca...<br>";
exec('php artisan optimize:clear 2>&1', $output, $return_var);
foreach($output as $line) {
    echo $line . "<br>";
}

echo "<br><b>Update Selesai! Fitur Analisa Nilai Akhlak sudah siap digunakan.</b><br>";
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
