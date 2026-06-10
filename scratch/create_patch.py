import os
import zipfile
import shutil
import time

def create_zip_patch():
    patch_name = "sikap_patch_academic_unified_tabs_20260518.zip"
    temp_dir = "temp_patch_unified"
    
    # Files to include (source path -> path in zip)
    files_to_include = [
        ("app/Http/Controllers/AcademicYearController.php", "app/Http/Controllers/AcademicYearController.php"),
        ("routes/web.php", "routes/web.php"),
        ("resources/js/Components/Sidebar.jsx", "resources/js/Components/Sidebar.jsx"),
        ("resources/js/Pages/Settings/Academic/Unified.jsx", "resources/js/Pages/Settings/Academic/Unified.jsx"),
        ("app/Services/AcademicPreparationService.php", "app/Services/AcademicPreparationService.php"),
        ("app/Http/Controllers/HafalanSkriningController.php", "app/Http/Controllers/HafalanSkriningController.php"),
        ("app/Http/Controllers/QuranController.php", "app/Http/Controllers/QuranController.php"),
        ("public/runner_debug_copy.php", "public/runner_debug_copy.php"),
        ("public/runner_read_log.php", "public/runner_read_log.php"),
        ("app/Http/Controllers/ScheduleController.php", "app/Http/Controllers/ScheduleController.php"),
    ]
    
    # Directories to include (source path -> path in zip)
    dirs_to_include = [
        ("public/build", "public/build"),
        ("bootstrap/ssr", "bootstrap/ssr"),
    ]
    
    # Clean up old zip and temp dir
    if os.path.exists(patch_name):
        try:
            os.remove(patch_name)
            print(f"Removed old patch: {patch_name}")
        except Exception as e:
            print(f"Warning: Could not remove old patch: {e}")
            
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir)
            print("Cleaned up old temp directory")
        except Exception as e:
            print(f"Warning: Could not clean up old temp directory: {e}")

    # Create new temp directory structure
    os.makedirs(temp_dir, exist_ok=True)
    
    # Copy files
    for src, dst in files_to_include:
        if not os.path.exists(src):
            print(f"Error: Required file {src} does not exist!")
            return
        dst_path = os.path.join(temp_dir, dst)
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        shutil.copy2(src, dst_path)
        print(f"Copied {src} -> {dst_path}")
        
    # Copy directories
    for src, dst in dirs_to_include:
        if not os.path.exists(src):
            print(f"Error: Required directory {src} does not exist!")
            return
        dst_path = os.path.join(temp_dir, dst)
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        
        # Custom copytree to handle locked files or retries
        for root, dirs, files in os.walk(src):
            rel_path = os.path.relpath(root, src)
            target_dir = dst_path if rel_path == "." else os.path.join(dst_path, rel_path)
            os.makedirs(target_dir, exist_ok=True)
            
            for file in files:
                src_file = os.path.join(root, file)
                dst_file = os.path.join(target_dir, file)
                
                # Retry copy in case of locks
                copied = False
                for attempt in range(3):
                    try:
                        shutil.copy2(src_file, dst_file)
                        copied = True
                        break
                    except IOError as e:
                        print(f"Lock detected on {src_file}, retrying ({attempt+1}/3)...")
                        time.sleep(0.5)
                if not copied:
                    print(f"Warning: Could not copy {src_file} due to locking. Skipping.")
        print(f"Copied directory {src} -> {dst_path}")
        
    # Create ZIP archive from temp_dir
    print(f"Creating ZIP archive {patch_name}...")
    with zipfile.ZipFile(patch_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, temp_dir)
                zipf.write(file_path, arcname)
                
    print(f"SUCCESS: Created ZIP patch {patch_name} ({os.path.getsize(patch_name) / 1024 / 1024:.2f} MB)")
    
    # Clean up temp_dir
    try:
        shutil.rmtree(temp_dir)
        print("Cleaned up temp directory")
    except Exception as e:
        print(f"Warning: Could not clean up temp directory: {e}")

if __name__ == "__main__":
    create_zip_patch()
