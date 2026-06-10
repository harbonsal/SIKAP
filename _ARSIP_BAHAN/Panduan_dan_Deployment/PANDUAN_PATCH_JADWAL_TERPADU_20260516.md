## Patch Jadwal Terpadu

File ZIP ini disusun dari root proyek Laravel, jadi saat diekstrak langsung akan masuk ke folder yang sesuai seperti `app/`, `resources/`, `public/`, dan `bootstrap/`.

### Cara pakai

1. Upload file ZIP ini ke root proyek SIKAP pada server.
2. Ekstrak ZIP langsung dari root proyek.
3. Izinkan proses extract untuk menimpa file lama jika diminta.

### Isi patch

- Perubahan controller untuk workspace jadwal terpadu
- Perubahan sidebar/menu
- Halaman baru `resources/js/Pages/Settings/Education/Schedule/Workspace.jsx`
- Hasil build frontend di `public/build`
- Hasil build SSR di `bootstrap/ssr`

### Catatan

- ZIP ini tidak berisi `vendor`, `node_modules`, atau folder cache lain yang tidak perlu.
- Jika panel hosting punya opsi `overwrite existing files`, aktifkan opsi itu saat ekstrak.
