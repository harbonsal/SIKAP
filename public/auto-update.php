<?php
echo "Memulai Extract Otomatis...<br>";

// Dapatkan Root Directory Laravel (1 tingkat di atas folder public tempat script ini berada)
$laravelRoot = dirname(__DIR__);
echo "• Laravel Root terdeteksi: " . $laravelRoot . "<br>";

// Clean OPCache
if(function_exists('opcache_reset')) {
    opcache_reset();
    echo "• OPCache (RAM Server) dibersihkan.<br>";
}

// Hapus cache artisan
chdir($laravelRoot);
exec('php artisan view:clear 2>&1', $out1);
exec('php artisan cache:clear 2>&1', $out2);
exec('php artisan route:clear 2>&1', $out3);
echo "• Laravel cache (View/Route) dibersihkan.<br>";

// Ekstrak file zip jika ada di laravel root
$zipFile = $laravelRoot . '/patch_final_tahfidz_v7.zip';
if(file_exists($zipFile)) {
    $zip = new ZipArchive;
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($laravelRoot);
        $zip->close();
        echo "<b>SUKSES!</b> File Zip (patch_final_tahfidz_v7.zip) berhasil terdeteksi, diekstrak, dan ditiban ke sistem Anda dengan sempurna.<br>";
    } else {
        echo "<b style='color:red;'>GAGAL:</b> Tidak dapat mengekstrak file ZIP. Pastikan server memiliki izin (permission) write.<br>";
    }
} else {
    echo "<b>INFO:</b> File patch_final_tahfidz_v7.zip tidak ditemukan di " . $laravelRoot . "<br>";
    echo "Ini wajar JIKA Anda SUDAH mengekstraknya secara manual. Script ini tetap sukses membersihkan Cache.<br>";
}

echo "<br><b>Selesai!</b> Silakan kembali ke web Penilaian Ujian dan tekan <b>Ctrl + F5</b>.";
?>
