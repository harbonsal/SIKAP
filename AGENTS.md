# Panduan & Aturan Alur Kerja SIKAP

## Otomatisasi Git Commit & Push
- **Waktu Eksekusi**: Setiap kali selesai melakukan perubahan file/kode (fitur baru, perbaikan bug, refactor, pembaruan desain, dsb.) atas permintaan pengguna:
  1. Cek perubahan git menggunakan `git status --porcelain`.
  2. Jika **ada perubahan**:
     - Lakukan `git add` pada file-file yang telah diubah.
     - Buat pesan commit yang deskriptif dan relevan dalam Bahasa Indonesia mengenai apa yang baru saja diselesaikan.
     - Lakukan `git push origin <branch>` (default: `main`).
     - Laporkan status commit & push kepada pengguna.
  3. Jika **tidak ada perubahan** (misalnya hanya menjawab pertanyaan, analisis, atau membaca data):
     - Jangan lakukan commit atau push.
