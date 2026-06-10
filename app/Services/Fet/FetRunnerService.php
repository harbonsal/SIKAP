<?php

namespace App\Services\Fet;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\Log;

class FetRunnerService
{
    public function run($inputFilePath)
    {
        $outputDir = storage_path('app/fet/output');
        if (!file_exists($outputDir)) {
            mkdir($outputDir, 0755, true);
        }
        
        // Bersihkan output sebelumnya
        $files = glob($outputDir . '/*');
        foreach($files as $file){
            if(is_file($file)) {
                unlink($file);
            }
        }
        
        $binaryPath = env('FET_BINARY_PATH', base_path('FET_EXE/fet-cl.exe'));
        
        if (!file_exists($binaryPath)) {
            throw new \Exception("File eksekusi FET tidak ditemukan di: {$binaryPath}. Pastikan Anda telah meletakkan fet-cl.exe ke lokasi tersebut atau atur FET_BINARY_PATH di .env. (fet-7.8.6.exe adalah installer, silakan instal dulu di komputer lalu copy file fet-cl.exe dan file .dll nya ke folder FET_EXE).");
        }
        
        $process = new Process([
            $binaryPath,
            '--inputfile=' . $inputFilePath,
            '--outputdir=' . $outputDir,
            '--timelimitseconds=300' // Limit 5 menit pencarian
        ]);
        
        // Timeout PHP Process
        $process->setTimeout(360); 
        
        $process->run();
        
        if (!$process->isSuccessful()) {
            $errorOutput = $process->getErrorOutput();
            Log::error('FET Execution Failed: ' . $errorOutput);
            
            // Kadang FET mengembalikan exit code tidak nol jika impossible
            throw new \Exception('Proses SIKAP gagal menjalankan FET, atau jadwal terdeteksi mustahil (Impossible Timetable) oleh algoritma FET. ' . $errorOutput);
        }
        
        return $outputDir;
    }
}
