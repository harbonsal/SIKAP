# 🩹 PANDUAN PATCH API AKHLAK & TAHFIDZ — 01 Juni 2026

## 🛠️ Apa yang Diperbaiki/Ditambahkan?

*   Menambahkan endpoint API baru untuk menarik **Data Pantauan Akhlak Bulanan** khusus bagi aplikasi eksternal (`/api/v1/student/{nomor_induk}/{semester}/character/monthly?tahunAjaran=...`).
*   Menambahkan endpoint API baru untuk menarik **Data Nilai Tahfidz** (Juz, Lembar, Nilai, Predikat) khusus bagi aplikasi eksternal (`/api/v1/student/{nomor_induk}/{semester}/tahfidz?tahunAjaran=...`).
*   Tidak ada perubahan pada sistem lama, penambahan murni untuk kebutuhan integrasi data luar.

---

## 🚀 Cara Update ke Server cPanel

### Langkah 1 — Upload & Extract Patch
1. Buka **File Manager** di cPanel Anda.
2. Masuk ke direktori utama aplikasi Laravel SIKAP Anda (contoh: `/home/sinawang/sikap-app/`).
3. Upload file **`sikap_patch_api_akhlak_tahfidz_20260601.zip`**.
4. Klik kanan file zip tersebut di cPanel, lalu pilih **Extract**.
5. Pastikan Anda mengizinkan extract untuk **menimpa (overwrite)** file yang lama (karena akan menimpa file routes dan controller API).

### Langkah 2 — Selesai!
*   Karena patch ini murni hanya perubahan logika _backend_ (PHP) pada sisi controller API dan rute, Anda **tidak perlu** repot membersihkan _cache browser_. 
*   Aplikasi eksternal kini sudah bisa langsung memanggil (hit) API baru tersebut dengan menyertakan `X-Api-Key` di header.
