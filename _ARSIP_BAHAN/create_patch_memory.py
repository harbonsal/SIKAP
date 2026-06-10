import os
import shutil
import zipfile

patch_dir = r'f:\MASTER PROGRAM\SIKAP\temp_patch_memory'
if os.path.exists(patch_dir):
    shutil.rmtree(patch_dir)

# Create directory structure
os.makedirs(os.path.join(patch_dir, 'app', 'Http', 'Controllers'))

# Copy files
shutil.copy2(r'app\Http\Controllers\ScheduleController.php', os.path.join(patch_dir, r'app\Http\Controllers\ScheduleController.php'))

zip_path = r'f:\MASTER PROGRAM\SIKAP\patch_memory_fix.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(patch_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, patch_dir)
            zipf.write(file_path, arcname)

shutil.rmtree(patch_dir)
print('Smart zip patch_memory_fix.zip successfully created.')
