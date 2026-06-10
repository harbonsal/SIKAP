<?php
echo "Memulai proses update Analisa Nilai Akhlak...<br>";

echo "Membersihkan cache aplikasi agar route baru terbaca...<br>";
exec('php artisan optimize:clear 2>&1', $output, $return_var);
foreach($output as $line) {
    echo $line . "<br>";
}

echo "<br><b>Update Selesai! Fitur Analisa Nilai Akhlak sudah siap digunakan.</b><br>";
?>
