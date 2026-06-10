# 🩹 PANDUAN PATCH SIKAP — 16 Mei 2026

## 🛠️ Apa yang Diperbaiki?
1.  **Tanda Tangan Kepala Sekolah (Rapor):** Menambahkan sistem hirarki pencarian tanda tangan. Sekarang sistem akan mengecek:
    *   Tanda tangan di profil User kepala sekolah (Storage).
    *   File manual berdasarkan NIP di `public/images/signature/{NIP}.png`.
    *   Tanda tangan global di Pengaturan Sekolah sebagai fallback terakhir.
2.  **Tanda Tangan & Stempel (Ijazah):** Menambahkan dukungan gambar tanda tangan dan stempel pada cetakan Ijazah (sebelumnya hanya teks).
3.  **Stempel Rapor:** Memastikan stempel muncul dengan efek *mix-blend* (seperti stempel basah) di atas tanda tangan.

---

## 🚀 Cara Update ke Server

### Langkah 1 — Upload Patch
1.  Upload file `sikap_patch_signature_20260516.zip` ke folder root project Anda di cPanel.
2.  **Extract** file tersebut. File ini akan menimpa (overwrite):
    *   `app/Http/Controllers/IjazahSettingsController.php`
    *   `resources/js/Pages/Academic/Report/Print.jsx`
    *   `resources/js/Pages/Settings/Education/Ijazah/Print.jsx`
    *   `public/build/` (File hasil kompilasi terbaru)

### Langkah 2 — Clear Cache (Opsional tapi Disarankan)
Jika tanda tangan masih tidak berubah, jalankan file `runner_cache.php` yang sudah Anda miliki dari update sebelumnya (jika belum dihapus), atau hapus manual folder `storage/framework/views/*`.

---

## ⚠️ Catatan Penting
*   Pastikan Anda sudah mengupload gambar tanda tangan di **Pengaturan Sekolah** atau di **Profil User** yang menjadi Kepala Sekolah.
*   Jika menggunakan file manual, pastikan path-nya benar: `public/images/signature/1707012.png`.
*   Jika di Ijazah tanda tangan belum muncul, pastikan data "Mudir" sudah diset di menu Pengaturan Ijazah.

---
*Generated: 2026-05-16 | SIKAP System Patch*
