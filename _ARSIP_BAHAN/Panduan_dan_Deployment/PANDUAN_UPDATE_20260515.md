# 📦 PANDUAN UPDATE SIKAP — 15 Mei 2026

## ✅ File yang Berubah Sejak Kemarin

### 🖥️ Backend (PHP)
| File | Perubahan |
|------|-----------|
| `app/Http/Controllers/AnalysisController.php` | Update data Rapor Semester 2 di halaman Analisis |
| `app/Http/Controllers/ReportController.php` | Perbaikan cetak rapor |
| `app/Http/Controllers/ClassGradeRecapController.php` | Perbaikan rekap nilai kelas |
| `app/Http/Controllers/IjazahRecapController.php` | Perbaikan rekap ijazah |
| `app/Http/Controllers/IjazahSettingsController.php` | Pengaturan ijazah |

### 🎨 Frontend (React/JSX) — sudah di-build
| File | Perubahan |
|------|-----------|
| `resources/js/Pages/Academic/Analysis/Index.jsx` | Tambah kolom Rapor Semester 2 di tab Target Nilai Aman |
| `resources/js/Pages/Academic/Report/Print.jsx` | Penyesuaian font & layout cetak rapor (F4/Legal) |
| `resources/js/Pages/Teacher/Assessment/Recap/Class/Index.jsx` | Perbaikan rekap kelas |
| `resources/js/Pages/Teacher/Assessment/Recap/Class/Show.jsx` | Tampilan detail rekap kelas |
| `resources/js/Pages/Teacher/Assessment/Recap/Class/LedgerTab.jsx` | Tab ledger nilai |
| `resources/js/Pages/Teacher/Assessment/Recap/Class/RekapNilaiTab.jsx` | Tab rekap nilai |
| `resources/js/Pages/Teacher/Assessment/Recap/Class/RekapIjazahTab.jsx` | Tab rekap ijazah |
| `resources/js/Pages/Teacher/Assessment/Recap/Ijazah/Index.jsx` | Halaman rekap ijazah |
| `resources/js/Pages/Settings/Education/Ijazah/Print.jsx` | Cetak ijazah |
| `resources/js/Pages/Settings/Education/Ijazah/Index.jsx` | Halaman manajemen ijazah |

### 🛣️ Routes
| File | Perubahan |
|------|-----------|
| `routes/web.php` | Penambahan/update route ijazah recap |

---

## 🚀 LANGKAH DEPLOY KE SERVER (cPanel — Tanpa Terminal)

### Langkah 1 — Upload & Ekstrak ZIP
1. Buka **cPanel → File Manager**
2. Masuk ke folder **root project** (biasanya `public_html` atau folder project)
3. Upload file `sikap_update_20260515.zip`
4. Klik kanan → **Extract** → ekstrak di folder yang sama
5. Semua file akan langsung masuk ke folder yang sesuai (app/, resources/, dll.)

---

### Langkah 2 — Jalankan Migration via PHP Runner (WAJIB)

File `runner_migrate.php` sudah ada di dalam zip ini.

1. Buka browser, akses:
   ```
   https://yourdomain.com/runner_migrate.php
   ```
2. Masukkan password: **`sikap2026`**
3. Klik **"Jalankan Migrate"**
4. Tunggu hingga muncul pesan ✅ hijau

> **Apa yang dilakukan:** Menambah index performa ke tabel `student_grades`, `active_subjects`, `class_members`.
> **AMAN** — tidak menghapus data apapun.

---

### Langkah 3 — Clear Cache via PHP Runner (WAJIB)

File `runner_cache.php` sudah ada di dalam zip ini.

1. Setelah migrate selesai, klik link yang muncul **atau** akses:
   ```
   https://yourdomain.com/runner_cache.php
   ```
2. Masukkan password: **`sikap2026`**
3. Klik **"Jalankan Cache Clear"**
4. Tunggu semua langkah menunjukkan ✅ hijau

---

### Langkah 4 — Hapus PHP Runner (WAJIB demi keamanan!)

Setelah semua selesai, **hapus kedua file ini dari server** via File Manager:
- ❌ `runner_migrate.php`
- ❌ `runner_cache.php`

---

### Langkah 5 — Verifikasi
Cek halaman-halaman berikut setelah deploy:
- [ ] Halaman **Analisis** → tab "Target Nilai Aman" → pastikan kolom Rapor Semester 2 muncul
- [ ] **Cetak Rapor** → pastikan layout muat di kertas F4/Legal
- [ ] **Rekap Ijazah** → pastikan data tampil dengan benar
- [ ] **Cetak Ijazah** → pastikan format cetak oke

---

## ⚠️ CATATAN PENTING

- Password runner default: **`sikap2026`** — ganti di file PHP jika perlu
- **JANGAN** jalankan migrate jika sudah pernah dijalankan sebelumnya (aman, tapi tidak perlu)
- Folder `storage/`, `node_modules/`, `vendor/` tidak ada di zip — **jangan dihapus dari server!**
- Jika ada error setelah deploy, coba akses `runner_cache.php` untuk clear cache ulang

---

*Generated: 2026-05-15 | SIKAP System Update*
