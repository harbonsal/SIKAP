# Panduan & Aturan Alur Kerja SIKAP

## Otomatisasi Build, Git Commit & Push
- **Waktu Eksekusi**: Setiap kali selesai melakukan perubahan file/kode (fitur baru, perbaikan bug, refactor, pembaruan desain, dsb.) atas permintaan pengguna:
  1. Perbarui keterangan timestamp 'Last Update' di `resources/js/Pages/Auth/Login.jsx` sesuai tanggal & jam saat ini (format: `⚡ Last Update: DD Mmm YYYY HH:mm WIB`).
  2. Jalankan `npm run build` terlebih dahulu agar aset produksi di `public/build` selalu ter-update untuk cPanel.
  3. Cek status git menggunakan `git status --porcelain`.
  4. Jika **ada perubahan**:
     - Lakukan `git add` pada file-file yang telah diubah.
     - Buat pesan commit yang deskriptif dan relevan dalam Bahasa Indonesia mengenai apa yang baru saja diselesaikan.
     - Lakukan `git push origin <branch>` (default: `main`).
     - Laporkan status commit & push kepada pengguna.
  5. Jika **tidak ada perubahan** (misalnya hanya menjawab pertanyaan, analisis, atau membaca data):
     - Jangan lakukan commit atau push.
