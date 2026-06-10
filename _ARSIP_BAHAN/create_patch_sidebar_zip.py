import zipfile
import os

def create_zip():
    zipf = zipfile.ZipFile('update-schedule-v8-sidebar.zip', 'w', zipfile.ZIP_DEFLATED)
    for root, dirs, files in os.walk('patch8'):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, 'patch8')
            try:
                zipf.write(file_path, arcname)
            except Exception as e:
                print(f"Skipping {file_path}: {e}")
    zipf.close()

create_zip()
