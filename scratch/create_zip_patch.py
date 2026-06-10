import zipfile
import os

def create_zip():
    zip_name = r"f:\MASTER PROGRAM\SIKAP\sikap_patch_import_biodata_fix_20260520.zip"
    
    files_to_pack = [
        (r"f:\MASTER PROGRAM\SIKAP\app\Http\Controllers\StudentController.php", "app/Http/Controllers/StudentController.php"),
        (r"f:\MASTER PROGRAM\SIKAP\public\import_biodata_runner.php", "public/import_biodata_runner.php"),
        (r"f:\MASTER PROGRAM\SIKAP\upload_biodata.csv", "upload_biodata.csv"),
    ]
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filepath, arcname in files_to_pack:
            if os.path.exists(filepath):
                zipf.write(filepath, arcname)
                print(f"Packed: {filepath} -> {arcname}")
            else:
                print(f"ERROR: File not found: {filepath}")
                
    print(f"Successfully created patch zip file: {zip_name}")

if __name__ == "__main__":
    create_zip()
