# Deployment Guide - Pengaktifan Kembali Formula Rapor Semester 2

## 📦 File yang Dimodifikasi

File ZIP: `sikap_ijazah_formula_fix_20260514.zip`

### Isi ZIP:
```text
app/Http/Controllers/IjazahSettingsController.php
public/clear_cache.php
```

## 🔧 Perubahan yang Dilakukan

- **Formula Dikembalikan:** Menjalankan rumus `((Semester 1 + 2 * Semester 2) / 3)` secara mutlak untuk mendapatkan nilai Rapor Semester 2, persis seperti yang digunakan di halaman cetak rapor.
- **Konsistensi Nilai:** Menghilangkan fitur *fallback* (di mana sistem sebelumnya menggunakan murni nilai Semester 2 jika Semester 1 kosong). Sekarang, sistem akan tetap menghitung dan membagi dengan 3 meskipun nilai Semester 1 kosong, sehingga nilai di Rapor dan Ijazah akan selalu **sama**.

## 📋 Langkah Deployment ke cPanel (Tanpa Terminal)

### 1. Upload File ZIP
1. Login ke cPanel dan buka **File Manager**.
2. Masuk ke folder root aplikasi Anda (biasanya `public_html` atau folder tempat aplikasi Laravel diinstal).
3. Klik **Upload** dan pilih file `sikap_ijazah_formula_fix_20260514.zip`.
4. Setelah berhasil, kembali ke File Manager.

### 2. Extract dan Overwrite
1. Klik kanan pada file `sikap_ijazah_formula_fix_20260514.zip` lalu pilih **Extract**.
2. Pastikan tujuannya adalah folder root aplikasi Anda.
3. Karena struktur ZIP sudah disesuaikan, file akan otomatis menimpa (overwrite) file yang ada di `app/Http/Controllers/` dan menambahkan file `clear_cache.php` di folder `public/`.

### 3. Clear Cache via Browser (Pengganti Terminal)
Karena Anda tidak memiliki akses terminal di cPanel, saya telah menyertakan sebuah *script* khusus (`clear_cache.php`) untuk membersihkan *cache* aplikasi secara otomatis.

1. Buka *browser* Anda.
2. Ketikkan URL berikut di *address bar*:
   `https://domain-anda.com/clear_cache.php` *(ganti `domain-anda.com` dengan nama domain aplikasi Anda)*.
3. Anda akan melihat pesan **"Cache Cleared Successfully!"**. Ini menandakan bahwa sistem telah berhasil memperbarui aplikasi dengan kode terbaru.

### 4. Hapus File Script (PENTING)
Untuk alasan keamanan server, **Anda wajib menghapus** file pembersih cache tersebut setelah selesai digunakan:
1. Kembali ke **File Manager** di cPanel.
2. Masuk ke folder `public/` (atau `public_html/` jika root folder Laravel Anda langsung ke public_html).
3. Cari file `clear_cache.php`.
4. Klik kanan dan pilih **Delete**.

## ✅ Verifikasi Deployment

1. Buka kembali halaman cetak Ijazah untuk santri Kelas 3 Tsanawiyah.
2. Bandingkan nilainya dengan halaman cetak Rapor Semester 2 untuk santri tersebut.
3. Pastikan nilainya sudah **sama persis**.

---

**Tanggal Deployment:** 14 Mei 2026
**Status:** Siap di-deploy ✅
