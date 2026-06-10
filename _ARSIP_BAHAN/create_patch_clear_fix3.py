import os
import shutil
import zipfile

patch_dir = r'f:\MASTER PROGRAM\SIKAP\temp_patch_clear_fix3'
if os.path.exists(patch_dir):
    shutil.rmtree(patch_dir)

# Create directory structure
os.makedirs(os.path.join(patch_dir, 'resources', 'js', 'Pages', 'Settings', 'Education', 'Schedule'))

# Copy files
shutil.copy2(r'resources\js\Pages\Settings\Education\Schedule\Workspace.jsx', os.path.join(patch_dir, r'resources\js\Pages\Settings\Education\Schedule\Workspace.jsx'))

# Copy public/build folder
if os.path.exists('public/build'):
    shutil.copytree('public/build', os.path.join(patch_dir, 'public', 'build'))

zip_path = r'f:\MASTER PROGRAM\SIKAP\patch_clear_fix3.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(patch_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, patch_dir)
            zipf.write(file_path, arcname)

shutil.rmtree(patch_dir)
print('Smart zip patch_clear_fix3.zip successfully created.')
