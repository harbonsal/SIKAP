# Deployment Guide - Perbaikan Rekap Nilai & Ledger

## 📦 File yang Dimodifikasi

File ZIP: `sikap_recap_ledger_fix_20260514_031014.zip` (4.65 KB)

### Isi ZIP:
```
resources/js/Pages/Teacher/Assessment/Recap/Class/
├── Show.jsx
├── RekapNilaiTab.jsx
└── LedgerTab.jsx
```

## 🔧 Perubahan yang Dilakukan

### 1. Fix Property Name Inconsistency
**Masalah:** Property `kelas_paralel` tidak konsisten dengan backend (`kelasParalel`)
**Solusi:** Ubah `kelas_paralel` → `kelasParalel` di Show.jsx

### 2. Add Safety Checks & Default Values
**Masalah:** TypeError saat data undefined (reading 'length')
**Solusi:** 
- Tambahkan default values untuk semua props
- Tambahkan safety checks sebelum render
- Tambahkan loading state

### 3. Improve Error Handling
**Masalah:** Halaman crash saat data belum ter-load
**Solusi:**
- Loading indicator saat data belum siap
- Empty state messages yang informatif
- Graceful degradation

## 📋 Langkah Deployment ke cPanel

### 1. Backup File Lama
```bash
# Login ke cPanel > File Manager
# Navigate ke: public_html/resources/js/Pages/Teacher/Assessment/Recap/Class/
# Download 3 files:
#   - Show.jsx
#   - RekapNilaiTab.jsx
#   - LedgerTab.jsx
# Rename dengan suffix .backup
```

### 2. Upload File Baru
```bash
# Upload sikap_recap_ledger_fix_20260514_031014.zip ke public_html/
# Extract ZIP file
# Files akan ter-extract ke struktur folder yang benar
```

### 3. Clear Cache & Rebuild Assets
```bash
# Via Terminal cPanel:
cd public_html

# Clear Laravel cache
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Rebuild Vite assets (PENTING!)
npm run build

# Atau jika menggunakan yarn:
yarn build
```

### 4. Verify Permissions
```bash
# File permissions: 644
# Folder permissions: 755
```

## ✅ Verifikasi Deployment

### Test 1: Akses Halaman Rekap Nilai
1. Login ke aplikasi
2. Buka menu: **Penilaian > Rekap Nilai Kelas**
3. Pilih salah satu kelas
4. Halaman harus terbuka tanpa error

### Test 2: Tab Rekap Nilai
1. Pastikan tab "Rekap Nilai" aktif by default
2. Tabel menampilkan:
   - Nomor urut
   - NIS
   - Nama siswa
   - Nilai per mata pelajaran
   - Total, Rerata, Rank
3. Nilai merah untuk yang di bawah KKM

### Test 3: Tab Ledger
1. Klik tab "Ledger"
2. URL berubah menjadi: `?tab=ledger`
3. Tabel menampilkan:
   - Breakdown nilai per komponen (UH1, UTS, UH2, UAS)
   - Nilai Akhir (NA) per mata pelajaran
   - Total, Rerata, Peringkat
4. Tidak ada error di console

### Test 4: Perpindahan Tab
1. Klik tab "Rekap Nilai" → "Ledger" → "Rekap Nilai"
2. Perpindahan smooth tanpa reload halaman
3. URL parameter berubah sesuai tab aktif
4. Data tetap ter-load dengan benar

### Test 5: Empty State
1. Buka kelas yang belum ada siswa
2. Harus muncul pesan: "Belum ada data siswa di kelas ini"
3. Tidak ada error

## 🔍 Troubleshooting

### Masalah: Error "Cannot read properties of undefined"
**Solusi:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Rebuild assets: `npm run build`
4. Clear Laravel cache: `php artisan optimize:clear`

### Masalah: Tab tidak berpindah
**Solusi:**
1. Cek console browser (F12) untuk error JavaScript
2. Pastikan file ter-upload dengan benar
3. Rebuild assets: `npm run build`

### Masalah: Styling tidak muncul
**Solusi:**
1. Rebuild assets: `npm run build`
2. Clear browser cache
3. Cek apakah Tailwind CSS ter-compile dengan benar

### Masalah: Data tidak muncul
**Solusi:**
1. Cek apakah ada siswa di kelas tersebut
2. Cek apakah ada mata pelajaran aktif
3. Cek apakah ada bobot nilai untuk semester aktif
4. Lihat Laravel log untuk error backend

## 📊 Perbandingan Sebelum & Sesudah

### Sebelum:
- ❌ Error: "Cannot read properties of undefined"
- ❌ Halaman crash saat data kosong
- ❌ Property name tidak konsisten
- ❌ Tidak ada loading state

### Sesudah:
- ✅ Tidak ada error
- ✅ Empty state yang informatif
- ✅ Property name konsisten
- ✅ Loading state saat data belum siap
- ✅ Safety checks di semua component

## 🎯 Fitur yang Diperbaiki

1. **Tab Navigation**
   - Smooth transition antar tab
   - URL parameter sync
   - State management yang benar

2. **Error Handling**
   - Default values untuk props
   - Safety checks sebelum render
   - Graceful degradation

3. **User Experience**
   - Loading indicator
   - Empty state messages
   - Informative error messages

## 📝 Catatan Penting

1. **Rebuild Assets Wajib:** Setelah upload, HARUS run `npm run build`
2. **Clear Cache:** Clear semua cache (Laravel + browser)
3. **Test Semua Tab:** Pastikan kedua tab berfungsi dengan baik
4. **Check Console:** Monitor console browser untuk error

## 🆘 Rollback (Jika Diperlukan)

```bash
# Via cPanel File Manager:
1. Delete 3 files yang baru
2. Rename file .backup → remove .backup suffix
3. Rebuild assets: npm run build
4. Clear cache: php artisan optimize:clear
```

## 📞 Support

Jika ada masalah:
- Cek console browser (F12 > Console)
- Cek Laravel log (storage/logs/laravel.log)
- Pastikan npm run build sudah dijalankan

---

**Deployment Date:** 2026-05-14
**Version:** 1.0.0
**Status:** Ready for Production ✅
