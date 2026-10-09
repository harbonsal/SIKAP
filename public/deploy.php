<?php
/**
 * Auto-Deploy Webhook Script untuk SIKAP
 * Endpoint: https://sikap.sinawang.my.id/deploy.php?key=sikap_auto_deploy_2026
 */

header('Content-Type: text/plain; charset=utf-8');

// 1. Validasi Kunci Keamanan (Secret Key)
$secretKey = 'sikap_auto_deploy_2026';
$providedKey = $_GET['key'] ?? '';

// Support juga jika dikirim via Header HTTP X-Git-Token / Header GitHub
if (isset($_SERVER['HTTP_X_GIT_TOKEN']) && $_SERVER['HTTP_X_GIT_TOKEN'] === $secretKey) {
    $providedKey = $secretKey;
}

if ($providedKey !== $secretKey) {
    http_response_code(403);
    echo "AKSES DITOLAK: Kunci keamanan salah atau tidak disertakan.\n";
    exit;
}

echo "========================================\n";
echo "  SIKAP AUTO-DEPLOY RUNNER\n";
echo "  Waktu: " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n\n";

$repoPath = '/home/sinawang/epositories/sikap';
$appPath  = '/home/sinawang/sikap-app';

// 2. Tarik kode terbaru dari GitHub (git pull)
echo "[1/3] Menarik commit terbaru dari GitHub...\n";
if (is_dir($repoPath)) {
    $pullOutput = shell_exec("cd $repoPath && git pull origin main 2>&1");
    echo $pullOutput . "\n";
} else {
    echo "Folder repositori $repoPath tidak ditemukan.\n";
}

// 3. Sinkronisasi file ke direktori aplikasi (sikap-app)
echo "[2/3] Menyinkronkan file ke $appPath...\n";
if (is_dir($appPath) && is_dir($repoPath)) {
    // Gunakan perintah standar cPanel
    $copyOutput = shell_exec("/bin/cp -R $repoPath/* $appPath/ 2>&1");
    echo ($copyOutput ?: "File berhasil disinkronkan.") . "\n";
}

// 4. Bersihkan Cache Laravel & Optimasi
echo "\n[3/3] Membersihkan cache Laravel...\n";
try {
    if (file_exists($appPath . '/vendor/autoload.php') && file_exists($appPath . '/bootstrap/app.php')) {
        require_once $appPath . '/vendor/autoload.php';
        $app = require_once $appPath . '/bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        echo "Cache aplikasi & views berhasil dibersihkan.\n";
    }
} catch (\Throwable $e) {
    echo "Peringatan Cache: " . $e->getMessage() . "\n";
}

echo "\n========================================\n";
echo "  DEPLOY SELESAI DENGAN SUKSES! 🚀\n";
echo "========================================\n";
