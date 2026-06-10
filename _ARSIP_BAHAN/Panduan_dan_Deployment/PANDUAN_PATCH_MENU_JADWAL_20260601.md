# 🩹 PANDUAN PATCH MENU JADWAL PELAJARAN — 01 Juni 2026

## 🛠️ Apa yang Diperbaiki?

*   Mengembalikan menu **Pengaturan Jadwal Pelajaran** (Master Jadwal) yang sebelumnya hilang/tersembunyi akibat patch penggabungan tabs akademik.
*   Menu ini sekarang dapat diakses kembali melalui sidebar di bagian **Pengaturan > Master Pendidikan**.

---

## 🚀 Cara Update ke Server cPanel

### Langkah 1 — Upload & Extract Patch
1. Buka **File Manager** di cPanel Anda.
2. Masuk ke direktori utama aplikasi Laravel SIKAP Anda (contoh: `/home/sinawang/sikap-app/`).
3. Upload file **`sikap_patch_menu_jadwal_20260601.zip`**.
4. Klik kanan file zip tersebut di cPanel, lalu pilih **Extract**.
5. Pastikan Anda mencentang opsi atau mengizinkan extract untuk **menimpa (overwrite)** file yang lama.

### Langkah 2 — Bersihkan Cache Server (Penting!)
1. Buka browser Anda dan akses URL pembersih kustom sistem Anda (misalnya `https://sikap.domainanda.com/clean.php` atau melalui menu Clear Cache jika Anda login sebagai Administrator).
2. Jika menggunakan halaman di dalam sistem, Anda juga dapat menekan tombol **Clear Cache** berwarna oranye yang ada di bagian paling bawah pada Sidebar sebelah kiri.
3. Muat ulang (Refresh) halaman browser (tekan `Ctrl + F5` atau `Cmd + Shift + R`).

Selesai! Menu akan muncul kembali di tempat semula.
