import csv
import os
import re
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return ""
    date_str = str(date_str).strip()
    
    if date_str in ["", "-", "0"]:
        return ""
        
    date_str = re.sub(r'\s+', ' ', date_str)
    
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y"):
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.year == 1012:
                dt = dt.replace(year=2012)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    # Try custom parsing if formats above fail
    match = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', date_str)
    if match:
        d, m, y = match.groups()
        try:
            if int(y) == 1012:
                y = 2012
            dt = datetime(int(y), int(m), int(d))
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
            
    return date_str

def map_gender(val):
    if not val:
        return ""
    val_clean = str(val).strip().lower()
    if val_clean.startswith('l'):
        return 'L'
    elif val_clean.startswith('p'):
        return 'P'
    return ""

def parse_address(addr):
    if not addr:
        return "", "", "", "", "", ""
    
    # Replace tabs and newlines inside fields with commas
    normalized = addr.replace('\t', ',').replace('\n', ',')
    parts = [p.strip() for p in normalized.split(',') if p.strip()]
    
    provinsi = ""
    kota = ""
    kecamatan = ""
    kelurahan = ""
    kodepos = ""
    detail = addr.strip()
    
    if parts:
        last = parts[-1]
        if last.isdigit() and len(last) == 5:
            kodepos = last
            parts.pop()
            
    if parts:
        provinsi = parts.pop()
    if parts:
        kota = parts.pop()
    if parts:
        kecamatan = parts.pop()
    if parts:
        kelurahan = parts.pop()
        
    return provinsi, kota, kecamatan, kelurahan, kodepos, detail

def clean_name(name):
    if not name:
        return ""
    # Strip any trailing colons or weird spaces
    return str(name).strip()

def process_csv():
    source_path = r"f:\MASTER PROGRAM\SIKAP\biodata.csv"
    target_path = r"f:\MASTER PROGRAM\SIKAP\upload_biodata.csv"
    
    # Read headers from the template target file to match exactly
    # Target columns order:
    # NIS,Nama,NISN,NIK,Jenis Kelamin (L/P),Tempat Lahir,Tanggal Lahir (YYYY-MM-DD),Agama,Asal Daerah,Kewarganegaraan,Anak Ke,Jml Saudara,Tinggal Bersama,Penanggung Biaya,Tinggi (cm),Berat (kg),Gol Darah,Provinsi,Kota/Kab,Kecamatan,Kelurahan,Kode Pos,Detail Alamat,Nama Ayah,NIK Ayah,Thn Lahir Ayah,Pendidikan Ayah,Pekerjaan Ayah,Penghasilan Ayah,Nama Ibu,NIK Ibu,Thn Lahir Ibu,Pendidikan Ibu,Pekerjaan Ibu,Penghasilan Ibu,Nama Wali,NIK Wali,Thn Lahir Wali,Pendidikan Wali,Pekerjaan Wali,Penghasilan Wali,Alamat Wali
    
    target_headers = [
        "NIS", "Nama", "NISN", "NIK", "Jenis Kelamin (L/P)", "Tempat Lahir", 
        "Tanggal Lahir (YYYY-MM-DD)", "Agama", "Asal Daerah", "Kewarganegaraan", 
        "Anak Ke", "Jml Saudara", "Tinggal Bersama", "Penanggung Biaya", 
        "Tinggi (cm)", "Berat (kg)", "Gol Darah", "Provinsi", "Kota/Kab", 
        "Kecamatan", "Kelurahan", "Kode Pos", "Detail Alamat", "Nama Ayah", 
        "NIK Ayah", "Thn Lahir Ayah", "Pendidikan Ayah", "Pekerjaan Ayah", 
        "Penghasilan Ayah", "Nama Ibu", "NIK Ibu", "Thn Lahir Ibu", 
        "Pendidikan Ibu", "Pekerjaan Ibu", "Penghasilan Ibu", "Nama Wali", 
        "NIK Wali", "Thn Lahir Wali", "Pendidikan Wali", "Pekerjaan Wali", 
        "Penghasilan Wali", "Alamat Wali"
    ]
    
    mapped_rows = []
    
    with open(source_path, mode='r', encoding='utf-8-sig') as f:
        # We notice there might be tab or comma separation, but the extension is .csv.
        # Let's read first few characters to check delimiter.
        sample = f.read(2048)
        f.seek(0)
        
        # Determine delimiter automatically
        dialect = csv.Sniffer().sniff(sample)
        reader = csv.DictReader(f, dialect=dialect)
        
        for row in reader:
            # Map columns
            raw_name = row.get("Nama :") or row.get("Nama") or ""
            name = clean_name(raw_name)
            
            # If name and NIS are both empty, it might be an empty row
            nis = (row.get("NIS") or "").strip()
            if not name and not nis:
                continue
                
            nisn = (row.get("NISN") or "").strip()
            nik = "" # Not in source
            
            gender = map_gender(row.get("Jenis Kelamin") or "")
            tempat_lahir = (row.get("Tempat Lahir") or "").strip()
            tanggal_lahir = parse_date(row.get("Tanggal Lahir") or "")
            
            agama = (row.get("Agama") or "").strip()
            if agama.lower() == "islam":
                agama = "Islam"
                
            asal_daerah = ""
            kewarganegaraan = ""
            anak_ke = (row.get("Anak Ke") or "").strip()
            
            # Parse address
            alamat_raw = row.get("Alamat Peserta Didik") or ""
            provinsi, kota, kecamatan, kelurahan, kodepos, detail_alamat = parse_address(alamat_raw)
            
            nama_ayah = (row.get("Nama Ayah") or "").strip()
            nik_ayah = ""
            thn_lahir_ayah = ""
            pendidikan_ayah = ""
            pekerjaan_ayah = (row.get("Pekerjaan Ayah") or "").strip()
            penghasilan_ayah = ""
            
            nama_ibu = (row.get("Nama Ibu") or "").strip()
            nik_ibu = ""
            thn_lahir_ibu = ""
            pendidikan_ibu = ""
            pekerjaan_ibu = (row.get("Pekerjaan Ibu") or "").strip()
            penghasilan_ibu = ""
            
            nama_wali = (row.get("Nama Wali") or "").strip()
            nik_wali = ""
            thn_lahir_wali = ""
            pendidikan_wali = ""
            pekerjaan_wali = (row.get("Pekerjaan Wali") or "").strip()
            penghasilan_wali = ""
            alamat_wali = (row.get("Alamat Wali") or "").strip()
            
            # Construct mapped row
            mapped_row = {
                "NIS": nis,
                "Nama": name,
                "NISN": nisn,
                "NIK": nik,
                "Jenis Kelamin (L/P)": gender,
                "Tempat Lahir": tempat_lahir,
                "Tanggal Lahir (YYYY-MM-DD)": tanggal_lahir,
                "Agama": agama,
                "Asal Daerah": asal_daerah,
                "Kewarganegaraan": kewarganegaraan,
                "Anak Ke": anak_ke,
                "Jml Saudara": "",
                "Tinggal Bersama": "",
                "Penanggung Biaya": "",
                "Tinggi (cm)": "",
                "Berat (kg)": "",
                "Gol Darah": "",
                "Provinsi": provinsi,
                "Kota/Kab": kota,
                "Kecamatan": kecamatan,
                "Kelurahan": kelurahan,
                "Kode Pos": kodepos,
                "Detail Alamat": detail_alamat,
                "Nama Ayah": nama_ayah,
                "NIK Ayah": nik_ayah,
                "Thn Lahir Ayah": thn_lahir_ayah,
                "Pendidikan Ayah": pendidikan_ayah,
                "Pekerjaan Ayah": pekerjaan_ayah,
                "Penghasilan Ayah": penghasilan_ayah,
                "Nama Ibu": nama_ibu,
                "NIK Ibu": nik_ibu,
                "Thn Lahir Ibu": thn_lahir_ibu,
                "Pendidikan Ibu": pendidikan_ibu,
                "Pekerjaan Ibu": pekerjaan_ibu,
                "Penghasilan Ibu": penghasilan_ibu,
                "Nama Wali": nama_wali,
                "NIK Wali": nik_wali,
                "Thn Lahir Wali": thn_lahir_wali,
                "Pendidikan Wali": pendidikan_wali,
                "Pekerjaan Wali": pekerjaan_wali,
                "Penghasilan Wali": penghasilan_wali,
                "Alamat Wali": alamat_wali
            }
            
            mapped_rows.append(mapped_row)
            
    # Write to target path (overwriting it)
    with open(target_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=target_headers)
        writer.writeheader()
        for row in mapped_rows:
            writer.writerow(row)
            
    print(f"Successfully processed {len(mapped_rows)} rows of biodata.")

if __name__ == "__main__":
    process_csv()
