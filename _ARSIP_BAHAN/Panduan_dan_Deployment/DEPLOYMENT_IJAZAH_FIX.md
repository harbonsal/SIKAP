# Deployment Guide - Perbaikan Perhitungan Nilai Ijazah

## 📦 File yang Dimodifikasi

File ZIP: `sikap_ijazah_fix_20260514_024757.zip`

### Isi ZIP:
```
app/Http/Controllers/IjazahSettingsController.php
```

## 🔧 Perubahan yang Dilakukan

### Perbaikan Formula Nilai Rapor
**Sebelum:** Menggunakan nilai semester 2 saja
**Sesudah:** Menggunakan formula nilai rapor: `(Sem1 + 2*Sem2) / 3`

### Detail Perubahan:
1. ✅ Menambahkan helper method `calculateSemesterScore()`
2. ✅ Mengambil nilai Semester 1 (Ganjil) dan Semester 2 (Genap)
3. ✅ Menghitung nilai rapor dengan formula: `(Sem1 + 2*Sem2) / 3`
4. ✅ Fallback ke Sem2 jika tidak ada data Sem1
5. ✅ Prioritas nilai manual tetap dipertahankan

## 📋 Langkah Deployment ke cPanel

### 1. Backup File Lama
```bash
# Login ke cPanel > File Manager
# Navigate ke: public_html/app/Http/Controllers/
# Download file: IjazahSettingsController.php
# Rename menjadi: IjazahSettingsController.php.backup
```

### 2. Upload File Baru
```bash
# Upload sikap_ijazah_fix_20260514_024757.zip ke public_html/
# Extract ZIP file
# File akan ter-extract ke struktur folder yang benar:
#   public_html/app/Http/Controllers/IjazahSettingsController.php
```

### 3. Set Permissions (Jika Diperlukan)
```bash
# File permissions: 644
# Folder permissions: 755
```

### 4. Clear Cache
```bash
# Via Terminal cPanel atau SSH:
cd public_html
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Atau via cPanel > Terminal:
php artisan optimize:clear
```

## ✅ Verifikasi Deployment

### Test 1: Cek Halaman Ijazah
1. Login ke aplikasi
2. Buka menu: **Pengaturan > Pendidikan > Ijazah**
3. Pilih santri kelas 3 Tsanawiyah
4. Klik **Cetak Ijazah**
5. Verifikasi nilai yang ditampilkan

### Test 2: Bandingkan dengan Rapor
1. Buka halaman **Rapor** untuk santri yang sama
2. Lihat nilai rapor semester 2
3. Nilai di ijazah harus **sama persis** dengan nilai rapor

### Test 3: Cek Formula
Untuk santri dengan:
- Sem 1 = 80
- Sem 2 = 90

Nilai Rapor/Ijazah harus = `(80 + 2*90) / 3 = 87` (dibulatkan)

## 🔍 Troubleshooting

### Masalah: Nilai masih salah
**Solusi:**
1. Clear cache: `php artisan optimize:clear`
2. Refresh browser dengan Ctrl+F5
3. Cek apakah file ter-upload dengan benar

### Masalah: Error 500
**Solusi:**
1. Cek file permissions (644 untuk file, 755 untuk folder)
2. Cek error log di cPanel > Error Log
3. Pastikan syntax PHP tidak ada error

### Masalah: Nilai manual tidak muncul
**Solusi:**
- Nilai manual tetap diprioritaskan
- Cek tabel `ijazah_manual_grades` di database
- Pastikan `mapel_name` sesuai dengan setting

## 📊 Contoh Hasil

### Sebelum Perbaikan:
- Tauhid: 90 (nilai Sem 2 saja)
- Fiqih: 85 (nilai Sem 2 saja)

### Sesudah Perbaikan:
- Tauhid: 87 (formula: (80 + 2*90) / 3)
- Fiqih: 83 (formula: (80 + 2*85) / 3)

## 📝 Catatan Penting

1. **Backup Wajib:** Selalu backup file lama sebelum deploy
2. **Test Dulu:** Test di environment development jika memungkinkan
3. **Nilai Manual:** Nilai manual tetap override nilai sistem
4. **Konsistensi:** Nilai ijazah sekarang konsisten dengan nilai rapor

## 🆘 Rollback (Jika Diperlukan)

Jika ada masalah, restore file backup:
```bash
# Via cPanel File Manager:
1. Delete: IjazahSettingsController.php
2. Rename: IjazahSettingsController.php.backup → IjazahSettingsController.php
3. Clear cache: php artisan optimize:clear
```

## 📞 Support

Jika ada masalah atau pertanyaan:
- Cek dokumentasi di: `.kiro/specs/fix-ijazah-grade-calculation/`
- Review test results di: `TEST-SUMMARY.md`
- Lihat verification di: `VERIFICATION.md`

---

**Deployment Date:** 2026-05-14
**Version:** 1.0.0
**Status:** Ready for Production ✅
