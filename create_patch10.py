import zipfile
import os

def create_zip():
    zipf = zipfile.ZipFile('update-schedule-v10-fix.zip', 'w', zipfile.ZIP_DEFLATED)
    for root, dirs, files in os.walk('patch10'):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, 'patch10')
            arcname = arcname.replace('\\', '/') # MUST NORMALIZE
            zipf.write(file_path, arcname)
    zipf.close()

create_zip()
