import os
import shutil
import zipfile

patch_dir = r'f:\MASTER PROGRAM\SIKAP\temp_patch_tahfidz_quran'
if os.path.exists(patch_dir):
    shutil.rmtree(patch_dir)

# Create directory structure
os.makedirs(os.path.join(patch_dir, 'resources', 'js', 'Pages', 'Teacher', 'TahfidzAssessment'))
os.makedirs(os.path.join(patch_dir, 'resources', 'js', 'Components'))

# Copy files
shutil.copy2(r'resources\js\Pages\Teacher\TahfidzAssessment\Assessment.jsx', os.path.join(patch_dir, r'resources\js\Pages\Teacher\TahfidzAssessment\Assessment.jsx'))
shutil.copy2(r'resources\js\Components\QuranPageViewer.jsx', os.path.join(patch_dir, r'resources\js\Components\QuranPageViewer.jsx'))

# Copy public/build folder
if os.path.exists('public/build'):
    shutil.copytree('public/build', os.path.join(patch_dir, 'public', 'build'))
if os.path.exists('public/clear_cache.php'):
    shutil.copy2('public/clear_cache.php', os.path.join(patch_dir, 'public', 'clear_cache.php'))

zip_path = r'f:\MASTER PROGRAM\SIKAP\patch_tahfidz_quran_v5.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(patch_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, patch_dir)
            zipf.write(file_path, arcname)

shutil.rmtree(patch_dir)
print('Patch zip patch_tahfidz_quran_v5.zip successfully created.')
