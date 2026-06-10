# 🩹 PANDUAN PATCH GABUNGAN TABS AKADEMIK & DRAF MANDIRI — 18 Mei 2026

## 🛠️ Apa yang Baru & Diperbaiki?

1.  **Penggabungan Halaman Pengaturan (Unified Tabs):**
    *   Menggabungkan halaman **TP & Semester Aktif** dan **Daftar Tahun Pelajaran** ke dalam satu halaman terpadu dengan sistem Tab yang sangat intuitif.
    *   Terdapat 3 Tab utama:
        *   **Daftar TP:** Untuk melihat, menambah, mengedit, atau menghapus tahun ajaran.
        *   **TP Aktif:** Untuk menetapkan Tahun Pelajaran dan Semester yang aktif untuk **seluruh sekolah** (Global).
        *   **Persiapan:** Untuk menyalin data (Kelas, Mata Pelajaran, Plotting Guru, dll.) dari tahun pelajaran sebelumnya ke tahun pelajaran draf baru.
    *   Sekarang, menu **Pengaturan > Pengaturan Tahun Pelajaran** maupun URL `/settings/academic` langsung mengarah ke halaman terpadu ini!

2.  **Mode Draf Mandiri Fungsional (Time Machine Sandbox):**
    *   Ketika Administrator mengubah konteks Tahun Ajaran di pojok kanan atas ke tahun pelajaran berstatus **DRAFT** (misalnya `2026/2027` yang sedang dipersiapkan):
        *   Sistem secara cerdas bertindak seakan **Administrator berada di tahun pelajaran tersebut**.
        *   Administrator dapat memasukkan data kelas baru, memetakan wali kelas, memetakan guru pengajar, memetakan kamar asrama, dan melakukan persiapan kurikulum sepenuhnya **tanpa mengganggu tahun pelajaran berjalan yang sedang aktif** (`2025/2026`).
        *   Semua data disimpan di database terisolasi untuk tahun draf tersebut.

3.  **Dropdown Cerdas & Pagina:**
    *   Memastikan dropdown pemilih pada Tab "TP Aktif" dan "Persiapan" memuat **seluruh** Tahun Pelajaran dari database (bukan hanya 10 data terpaginasi pertama) untuk mencegah hilangnya tahun pelajaran dari pilihan.

4.  **Kompatibilitas PHP Server cPanel (PENTING - Mengatasi Error 500):**
    *   Memperbaiki bug yang menyebabkan **500 Server Error** saat menekan tombol "Salin Kelas", "Salin Mapel", atau "Salin Kuota & Jam Off" di tab Persiapan.
    *   Masalah ini disebabkan oleh penggunaan sintaksis pembongkaran array dengan kunci string (`...$payload`) yang hanya didukung pada PHP 8.1 ke atas. 
    *   Kami telah merombak kode di `AcademicPreparationService`, `HafalanSkriningController`, dan `QuranController` menggunakan `array_merge` kustom agar **100% kompatibel dan aman dijalankan pada PHP 7.4, 8.0, hingga 8.2+** di server cPanel.

---

## 🚀 Cara Update ke Server cPanel (Sangat Mudah!)

### Langkah 1 — Upload & Extract Patch
1.  Buka **File Manager** di cPanel Anda.
2.  Masuk ke direktori utama aplikasi Laravel SIKAP Anda (misalnya `/home/sinawang/sikap-app/`).
3.  Upload file **`sikap_patch_academic_unified_tabs_20260518.zip`** (1.70 MB) yang berada di folder root komputer lokal Anda.
4.  Klik kanan file zip tersebut di cPanel, lalu pilih **Extract**.
5.  Pastikan semua file ter-extract dan menimpa (*overwrite*) folder masing-masing.

### Langkah 2 — Bersihkan Cache Server
1.  Buka browser Anda dan akses URL pembersih kustom Anda:
    `https://sikap.sinawang.my.id/clean.php`
2.  Klik tombol **Clear Cache & Optimize** untuk mereset memori OPcache PHP dan membersihkan sisa cache views/routes/config lama.
3.  Pastikan status di panel hijau/sukses.

---

## 💡 Panduan Penggunaan 3 Mode Tahun Pelajaran

Di SIKAP Alwan, terdapat 3 status/mode penting pada Tahun Pelajaran yang masing-masing memiliki peran khusus:

| Status/Mode | Deskripsi | Perilaku Keamanan & Hak Akses |
| :--- | :--- | :--- |
| **Active (Aktif)** | Tahun pelajaran yang sedang berjalan saat ini secara nasional di sekolah. | Seluruh pengguna (Admin, Guru, Staff, Santri) dapat membaca dan menulis/mengedit data sesuai izinnya. |
| **Archived (Arsip)** | Tahun pelajaran yang sudah terlewati di masa lalu (sebagai riwayat). | **Non-Admin (Guru/Staff/Santri):** Hanya bisa membaca (Read-only). Seluruh tombol simpan, edit, hapus, dan proses input nilai dinonaktifkan otomatis.<br>**Admin:** Tetap bisa melakukan perubahan jika ada koreksi darurat. |
| **Draft (Rencana/Plan)** | Tahun pelajaran masa depan yang sedang direncanakan (belum berjalan). | **Non-Admin:** Tidak dapat melihat atau beralih ke tahun ini.<br>**Admin:** Memiliki hak akses penuh (Read-Write) untuk melakukan *plotting* kelas, wali, asrama, dan guru guna persiapan tahun depan tanpa mengganggu data tahun aktif. |

---

### Cara Beralih Mode (Time Travel):
1.  Pada sudut kanan atas layar dashboard Anda, terdapat pemilih tahun ajaran (kotak berwarna oranye/kuning, contoh: `TAHUN AJARAN 2026/2027 | Ganjil`).
2.  Klik tombol tersebut untuk memunculkan sidebar **MODE LIHAT (ARSIP)**.
3.  Pilih tahun pelajaran dan semester yang ingin Anda kunjungi.
4.  Selesai! Halaman Anda sekarang akan memuat seluruh data dari tahun ajaran yang Anda pilih secara instan.

---
*Generated: 18 Mei 2026 | SIKAP Academic System Refactoring*
