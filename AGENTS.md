# Panduan & Aturan Alur Kerja SIKAP

## Otomatisasi Build, Git Commit & Push
- **Waktu Eksekusi**: Setiap kali selesai melakukan perubahan file/kode (fitur baru, perbaikan bug, refactor, pembaruan desain, dsb.) atas permintaan pengguna:
  1. Cek apakah ada perubahan pada file frontend (`resources/**`, `vite.config.js`, atau aset UI). Jika ada, jalankan `npm run build` terlebih dahulu agar aset produksi di `public/build` selalu ter-update untuk cPanel.
  2. Cek status git menggunakan `git status --porcelain`.
  3. Jika **ada perubahan**:
     - Lakukan `git add` pada file-file yang telah diubah.
     - Buat pesan commit yang deskriptif dan relevan dalam Bahasa Indonesia mengenai apa yang baru saja diselesaikan.
     - Lakukan `git push origin <branch>` (default: `main`).
     - Laporkan status commit & push kepada pengguna.
  4. Jika **tidak ada perubahan** (misalnya hanya menjawab pertanyaan, analisis, atau membaca data):
     - Jangan lakukan commit atau push.
