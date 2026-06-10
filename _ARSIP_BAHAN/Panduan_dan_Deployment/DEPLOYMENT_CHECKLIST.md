# ✅ Deployment Checklist - Perbaikan Ijazah

## Pre-Deployment

- [ ] Backup database (export via phpMyAdmin)
- [ ] Backup file `IjazahSettingsController.php` yang lama
- [ ] Download ZIP file: `sikap_ijazah_fix_20260514_024757.zip`
- [ ] Baca dokumentasi: `DEPLOYMENT_IJAZAH_FIX.md`

## Deployment Steps

- [ ] Login ke cPanel
- [ ] Buka File Manager
- [ ] Navigate ke `public_html/app/Http/Controllers/`
- [ ] Download file `IjazahSettingsController.php` (backup)
- [ ] Upload ZIP file ke `public_html/`
- [ ] Extract ZIP file
- [ ] Verify file ter-extract dengan benar
- [ ] Hapus ZIP file (opsional)
- [ ] Set permissions jika diperlukan (644 untuk file)

## Clear Cache

- [ ] Buka cPanel Terminal
- [ ] Jalankan: `cd public_html`
- [ ] Jalankan: `php artisan config:clear`
- [ ] Jalankan: `php artisan cache:clear`
- [ ] Jalankan: `php artisan view:clear`
- [ ] Jalankan: `php artisan route:clear`
- [ ] Atau: `php artisan optimize:clear` (all in one)

## Testing

### Test 1: Akses Halaman
- [ ] Login ke aplikasi SIKAP
- [ ] Buka menu: Pengaturan > Pendidikan > Ijazah
- [ ] Halaman terbuka tanpa error

### Test 2: Cetak Ijazah
- [ ] Pilih santri kelas 3 Tsanawiyah
- [ ] Klik "Cetak Ijazah"
- [ ] Halaman cetak terbuka
- [ ] Nilai ditampilkan dengan benar

### Test 3: Verifikasi Formula
- [ ] Pilih santri yang memiliki nilai Sem 1 dan Sem 2
- [ ] Buka halaman Rapor untuk santri yang sama
- [ ] Bandingkan nilai rapor dengan nilai ijazah
- [ ] Nilai harus sama persis
- [ ] Verifikasi formula: (Sem1 + 2*Sem2) / 3

### Test 4: Nilai Manual
- [ ] Cek santri yang memiliki nilai manual
- [ ] Nilai manual harus tetap ditampilkan
- [ ] Nilai manual override nilai sistem

### Test 5: Rekapitulasi
- [ ] Buka tab "Rekapitulasi Nilai (3 Tsanawy)"
- [ ] Semua santri ditampilkan
- [ ] Ranking berdasarkan nilai rapor
- [ ] Total dan rata-rata benar

## Post-Deployment

- [ ] Monitor error log di cPanel
- [ ] Cek feedback dari user
- [ ] Dokumentasikan hasil deployment
- [ ] Simpan backup file di tempat aman

## Rollback (Jika Diperlukan)

- [ ] Delete file `IjazahSettingsController.php` yang baru
- [ ] Restore file backup
- [ ] Clear cache: `php artisan optimize:clear`
- [ ] Test aplikasi kembali

## Verification Checklist

### ✅ Nilai Ijazah Benar
- [ ] Menggunakan formula rapor: (Sem1 + 2*Sem2) / 3
- [ ] Nilai sama dengan nilai rapor
- [ ] Nilai manual tetap diprioritaskan

### ✅ Tidak Ada Error
- [ ] Tidak ada error 500
- [ ] Tidak ada error di log
- [ ] Semua fitur berfungsi normal

### ✅ Performance
- [ ] Halaman load dengan cepat
- [ ] Tidak ada query yang lambat
- [ ] Cache berfungsi dengan baik

## Sign-Off

**Deployed by:** ___________________  
**Date:** ___________________  
**Time:** ___________________  
**Status:** [ ] Success [ ] Failed [ ] Rolled Back  

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Reference

**Formula Nilai Rapor:**
```
Nilai Rapor = (Sem1 + 2*Sem2) / 3
```

**Contoh:**
- Sem1 = 80, Sem2 = 90
- Rapor = (80 + 2*90) / 3 = 87

**Clear Cache Command:**
```bash
php artisan optimize:clear
```

**Rollback Command:**
```bash
mv IjazahSettingsController.php.backup IjazahSettingsController.php
php artisan optimize:clear
```
