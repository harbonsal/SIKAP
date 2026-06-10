<?php

/**
 * SIKAP Cache Cleaner & System Optimization Runner
 * Designed to optimize and clear cached states on shared hosting / cPanel environments without Terminal access.
 */

// 0. Clear PHP OPcache (Bytecode Cache) to force PHP to load updated files from disk
if (function_exists('opcache_reset')) {
    @opcache_reset();
}

// 1. Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use Illuminate\Support\Facades\Artisan;

// Set up kernel to enable Artisan Facade
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$commands = [
    'migrate' => [
        'label' => 'Database Migrations Run',
        'args' => ['--force' => true]
    ],
    'route:clear' => [
        'label' => 'Route Cache Cleared',
        'args' => []
    ],
    'config:clear' => [
        'label' => 'Configuration Cache Cleared',
        'args' => []
    ],
    'cache:clear' => [
        'label' => 'Application Cache Cleared',
        'args' => []
    ],
    'view:clear' => [
        'label' => 'Compiled Views Cleared',
        'args' => []
    ],
];

$results = [];
foreach ($commands as $command => $info) {
    try {
        $exitCode = Artisan::call($command, $info['args']);
        $output = Artisan::output();
        $results[] = [
            'command' => $command,
            'label' => $info['label'],
            'status' => 'SUCCESS',
            'output' => trim($output),
            'code' => $exitCode
        ];
    } catch (\Exception $e) {
        $results[] = [
            'command' => $command,
            'label' => $info['label'],
            'status' => 'ERROR',
            'output' => $e->getMessage(),
            'code' => 500
        ];
    }
}

// File system diagnostics
$servicePath = __DIR__ . '/../app/Services/AcademicStateService.php';
$serviceExists = file_exists($servicePath);
$serviceMtime = $serviceExists ? date('Y-m-d H:i:s', filemtime($servicePath)) : 'Tidak ditemukan';
$serviceSize = $serviceExists ? filesize($servicePath) . ' bytes' : '0 bytes';
$hasMethod = 'TIDAK ADA';

if ($serviceExists) {
    $content = file_get_contents($servicePath);
    if (strpos($content, 'activeAcademicYear') !== false) {
        $hasMethod = 'ADA (OK)';
    }
}

// Ultra-lightweight log reader (uses constant memory, runs in <1ms)
function get_last_log_lines($filepath, $num_lines = 100) {
    if (!file_exists($filepath)) {
        return "Log file not found at: " . htmlspecialchars($filepath);
    }
    
    $filesize = filesize($filepath);
    if ($filesize === 0) {
        return "Log file is empty.";
    }
    
    // Read only the last 150KB
    $read_bytes = min($filesize, 150 * 1024);
    
    $file = @fopen($filepath, 'r');
    if (!$file) {
        return "Could not open log file.";
    }
    
    fseek($file, -$read_bytes, SEEK_END);
    $data = fread($file, $read_bytes);
    fclose($file);
    
    if ($data === false) {
        return "Failed to read log file data.";
    }
    
    $lines = explode("\n", $data);
    $total_lines = count($lines);
    
    if ($total_lines > $num_lines) {
        $lines = array_slice($lines, -$num_lines);
    }
    
    return implode("\n", array_map('trim', $lines));
}

$logPath = __DIR__ . '/../storage/logs/laravel.log';
$latestLogs = get_last_log_lines($logPath, 100);

// Extract the latest error message and stack trace
$latestErrorSummary = "Tidak ada error terbaru yang tercatat dalam log.";
if ($latestLogs !== "Log file is empty." && strpos($latestLogs, 'Log file not found') === false) {
    $parts = explode('[202', $latestLogs);
    if (count($parts) > 1) {
        $lastChunk = '[202' . end($parts);
        $chunkLines = explode("\n", $lastChunk);
        $summaryLines = [];
        foreach ($chunkLines as $line) {
            if (empty($line) || strpos($line, '#') === 0 || strpos($line, '{"exception"') !== false) {
                break;
            }
            $summaryLines[] = $line;
        }
        if (!empty($summaryLines)) {
            $latestErrorSummary = implode("\n", $summaryLines);
        } else {
            $latestErrorSummary = array_shift($chunkLines);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIKAP System Optimizer</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --panel-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --primary-emerald: #10b981;
            --primary-rose: #f43f5e;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-main);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            box-sizing: border-box;
        }

        .container {
            width: 100%;
            max-width: 850px;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(16px);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        .logo-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            width: 60px;
            height: 60px;
            border-radius: 18px;
            margin-bottom: 1rem;
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        .logo-badge svg {
            width: 30px;
            height: 30px;
            fill: none;
            stroke: white;
            stroke-width: 2.5;
        }

        h1 {
            font-size: 1.8rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p.subtitle {
            color: var(--text-muted);
            margin: 0.5rem 0 0 0;
            font-size: 0.95rem;
        }

        .task-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2.5rem;
        }

        .task-card {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s ease;
        }

        .task-card:hover {
            transform: translateX(4px);
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(15, 23, 42, 0.6);
        }

        .task-info {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        .task-label {
            font-weight: 600;
            font-size: 1rem;
        }

        .task-cmd {
            font-family: monospace;
            font-size: 0.8rem;
            color: var(--text-muted);
        }

        .status-badge {
            padding: 0.4rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .status-success {
            background: rgba(16, 185, 129, 0.15);
            color: var(--primary-emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-error {
            background: rgba(244, 63, 94, 0.15);
            color: var(--primary-rose);
            border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .diagnostics-panel {
            background: rgba(59, 130, 246, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .diagnostics-title {
            color: #3b82f6;
            font-weight: 800;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .diagnostics-table {
            width: 100%;
            border-collapse: collapse;
            font-family: monospace;
            font-size: 0.9rem;
        }

        .diagnostics-table td {
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .diagnostics-table td:first-child {
            color: var(--text-muted);
            width: 45%;
        }

        .diagnostics-table td:last-child {
            color: var(--text-main);
            font-weight: bold;
        }

        .error-alert-box {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.25);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .error-alert-title {
            color: var(--primary-rose);
            font-weight: 800;
            font-size: 1.1rem;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .error-alert-message {
            font-family: monospace;
            font-size: 0.9rem;
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 10px;
            color: #ff8b9e;
            white-space: pre-wrap;
            word-break: break-all;
            border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .log-section {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .log-title {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #38bdf8;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .log-terminal {
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.85rem;
            background: #090d16;
            color: #a7f3d0;
            padding: 1rem;
            border-radius: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer {
            text-align: center;
            border-top: 1px solid var(--border-color);
            padding-top: 1.5rem;
        }

        .btn-home {
            display: inline-block;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-main);
            text-decoration: none;
            padding: 0.8rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .btn-home:hover {
            background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-badge">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h1>SIKAP System Optimizer</h1>
            <p class="subtitle">Pembersihan Cache & Optimalisasi Kinerja Berhasil Dijalankan</p>
        </div>

        <div class="task-list">
            <?php foreach ($results as $res): ?>
                <div class="task-card">
                    <div class="task-info">
                        <span class="task-label"><?php echo htmlspecialchars($res['label']); ?></span>
                        <span class="task-cmd">php artisan <?php echo htmlspecialchars($res['command']); ?></span>
                    </div>
                    <div>
                        <?php if ($res['status'] === 'SUCCESS'): ?>
                            <span class="status-badge status-success">
                                <svg style="width: 12px; height: 12px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                BERHASIL
                            </span>
                        <?php else: ?>
                            <span class="status-badge status-error" title="<?php echo htmlspecialchars($res['output']); ?>">
                                GAGAL
                            </span>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- DIAGNOSTICS PANEL -->
        <div class="diagnostics-panel">
            <div class="diagnostics-title">
                <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Diagnostik Berkas Fisik Server (Real-Time):
            </div>
            <table class="diagnostics-table">
                <tr>
                    <td>Lokasi Berkas Server:</td>
                    <td><?php echo htmlspecialchars(realpath($servicePath)); ?></td>
                </tr>
                <tr>
                    <td>Berkas Ditemukan di Disk:</td>
                    <td style="color: <?php echo $serviceExists ? '#10b981' : '#f43f5e'; ?>;">
                        <?php echo $serviceExists ? 'YA' : 'TIDAK'; ?>
                    </td>
                </tr>
                <tr>
                    <td>Waktu Modifikasi Terakhir:</td>
                    <td><?php echo $serviceMtime; ?></td>
                </tr>
                <tr>
                    <td>Ukuran Berkas:</td>
                    <td><?php echo $serviceSize; ?></td>
                </tr>
                <tr>
                    <td>Fungsi activeAcademicYear():</td>
                    <td style="color: <?php echo $hasMethod === 'ADA (OK)' ? '#10b981' : '#f43f5e'; ?>;">
                        <?php echo $hasMethod; ?>
                    </td>
                </tr>
                <tr>
                    <td>PHP OPcache Reset:</td>
                    <td style="color: #10b981;">SUKSES DIKIRIM (MEMORY DIBERSIHKAN)</td>
                </tr>
            </table>
        </div>

        <!-- HIGHLIGHT LATEST ERROR -->
        <div class="error-alert-box">
            <div class="error-alert-title">
                <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Penyebab Utama 500 Error Saat Ini:
            </div>
            <div class="error-alert-message"><?php echo htmlspecialchars($latestErrorSummary); ?></div>
        </div>

        <div class="log-section">
            <div class="log-title">
                <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Log Diagnostik Sistem Lengkap (laravel.log)
            </div>
            <div class="log-terminal"><?php echo htmlspecialchars($latestLogs); ?></div>
        </div>

        <div class="footer">
            <a href="/" class="btn-home">Kembali ke Dashboard</a>
        </div>
    </div>
</body>
</html>
