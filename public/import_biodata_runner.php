<?php
/**
 * SIKAP — Import/Update Biodata Runner
 * File ini ada di: public/import_biodata_runner.php
 * Akses: https://sikap.sinawang.my.id/import_biodata_runner.php
 * ⚠️ Hapus setelah selesai!
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
@set_time_limit(0);
@ini_set('max_execution_time', 0);

use App\Models\User;
use App\Models\Student;
use App\Models\UserLevel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

define('RUNNER_PASSWORD', 'sikap2026');

$inputPassword = $_GET['key'] ?? $_POST['key'] ?? '';

if ($inputPassword !== RUNNER_PASSWORD) {
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP Runner</title>
    <style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#1a1a2e;}
    .box{background:#16213e;padding:40px;border-radius:12px;color:#e0e0e0;text-align:center;width:350px;}
    h2{color:#e94560;margin-bottom:20px;}
    input{width:100%;padding:10px;border-radius:6px;border:1px solid #444;background:#0f3460;color:#fff;margin-bottom:15px;box-sizing:border-box;}
    button{width:100%;padding:12px;background:#e94560;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px;}
    button:hover{background:#c73652;}</style></head><body>
    <div class="box"><h2>🔐 SIKAP Runner</h2><p>Password untuk Eksekusi Import:</p>
    <form method="POST"><input type="password" name="key" placeholder="Password..." autofocus>
    <button type="submit">Jalankan Import</button></form></div></body></html>';
    exit;
}

echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIKAP — Import Runner</title>
<style>
body{font-family:"Courier New",monospace;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;}
h1{color:#58a6ff;border-bottom:1px solid #30363d;padding-bottom:10px;}
.log{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;white-space:pre-wrap;line-height:1.8;font-size:13px;height:400px;overflow-y:scroll;}
.ok{color:#3fb950;font-weight:bold;} .fail{color:#f85149;font-weight:bold;} .info{color:#58a6ff;} .warn{color:#d29922;}
.done{background:#1a3a1a;border:1px solid #3fb950;border-radius:8px;padding:20px;margin-top:20px;color:#3fb950;}
.err{background:#3a1a1a;border:1px solid #f85149;border-radius:8px;padding:20px;margin-top:20px;color:#f85149;}
.debug{background:#1e1e2e;border:1px solid #444;border-radius:6px;padding:10px;margin-bottom:15px;font-size:12px;color:#888;}
code{background:#2d2d2d;padding:2px 6px;border-radius:4px;}
</style></head><body>
<h1>🔍 SIKAP Runner — Import & Update Biodata</h1>';

// Auto-detect Laravel root
$candidates = [__DIR__, dirname(__DIR__), dirname(dirname(__DIR__))];
$laravelRoot = null;
foreach ($candidates as $path) {
    if (file_exists($path.'/vendor/autoload.php') && file_exists($path.'/bootstrap/app.php')) {
        $laravelRoot = $path;
        break;
    }
}

echo '<div class="debug">';
echo 'Laravel root: <code>'.htmlspecialchars($laravelRoot ?? 'NOT FOUND').'</code><br>';
$csvPath = $laravelRoot . '/upload_biodata.csv';
echo 'CSV file: <code>'.htmlspecialchars($csvPath).'</code> (' . (file_exists($csvPath) ? 'Ada / Size: ' . filesize($csvPath) . ' bytes' : 'TIDAK ADA!') . ')';
echo '</div>';

if (!$laravelRoot) {
    echo '<div class="err">❌ Laravel root tidak ditemukan!</div>';
    echo '</body></html>';
    exit;
}

if (!file_exists($csvPath)) {
    echo '<div class="err">❌ File <code>upload_biodata.csv</code> tidak ditemukan di Laravel root! Silakan upload file CSV Anda terlebih dahulu.</div>';
    echo '</body></html>';
    exit;
}

echo '<div class="log" id="log_div">';
echo 'Memulai proses import...<br>';
flush();
ob_flush();

try {
    define('LARAVEL_START', microtime(true));
    require $laravelRoot.'/vendor/autoload.php';
    $app = require_once $laravelRoot.'/bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

    $studentLevel = UserLevel::firstOrCreate(['name' => 'Siswa']);
    $userLevelId = UserLevel::where('name', 'Santri')->value('id') ?? UserLevel::where('name', 'Siswa')->value('id') ?? $studentLevel->id;

    $successCount = 0;
    $errors = [];

    if (($handle = fopen($csvPath, 'r')) !== false) {
        $header = fgetcsv($handle);
        if ($header && isset($header[0])) {
            $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);
        }

        $index = 0;
        
        while (($row = fgetcsv($handle)) !== false) {
            $rowNum = $index + 2;
            $index++;

            if (count($row) < 1 || empty(trim($row[0]))) {
                continue;
            }

            $nis = trim($row[0]);
            $name = isset($row[1]) ? trim($row[1]) : '';

            if (!$nis || !$name) {
                echo "<span class='warn'>[Baris {$rowNum}] Skip: NIS atau Nama kosong.</span>\n";
                flush();
                ob_flush();
                continue;
            }

            try {
                DB::beginTransaction();

                // Cari atau buat User
                $user = User::where('nomor_induk', $nis)->first();
                if (!$user) {
                    $user = User::create([
                        'name' => $name,
                        'nomor_induk' => $nis,
                        'email' => null,
                        'password' => Hash::make($nis),
                        'user_level_id' => $userLevelId,
                    ]);
                    echo "<span class='info'>[Baris {$rowNum}] Membuat User Baru: {$name} ({$nis})</span>\n";
                } else {
                    $user->update(['name' => $name]);
                }

                // Map data columns
                $fieldMap = [
                    2  => 'nisn',
                    3  => 'nik',
                    4  => 'gender',
                    5  => 'birth_place',
                    6  => 'birth_date',
                    7  => 'religion',
                    8  => 'origin_region',
                    9  => 'citizenship',
                    10 => 'child_order',
                    11 => 'siblings_count',
                    12 => 'living_with',
                    13 => 'financial_sponsor',
                    14 => 'height',
                    15 => 'weight',
                    16 => 'blood_type',
                    17 => 'province',
                    18 => 'city',
                    19 => 'district',
                    20 => 'village',
                    21 => 'postal_code',
                    22 => 'address_details',
                    23 => 'father_name',
                    24 => 'father_nik',
                    25 => 'father_birth_year',
                    26 => 'father_education',
                    27 => 'father_occupation',
                    28 => 'father_income',
                    29 => 'mother_name',
                    30 => 'mother_nik',
                    31 => 'mother_birth_year',
                    32 => 'mother_education',
                    33 => 'mother_occupation',
                    34 => 'mother_income',
                    35 => 'guardian_name',
                    36 => 'guardian_nik',
                    37 => 'guardian_birth_year',
                    38 => 'guardian_education',
                    39 => 'guardian_occupation',
                    40 => 'guardian_income',
                    41 => 'guardian_address',
                ];

                $studentData = [];
                foreach ($fieldMap as $colIndex => $field) {
                    if (isset($row[$colIndex])) {
                        $val = trim($row[$colIndex]);
                        if ($val !== '') {
                            if ($field === 'nisn' || $field === 'nik') {
                                $cleanVal = preg_replace('/[^0-9]/', '', $val);
                                if ($cleanVal === '' || intval($cleanVal) === 0) {
                                    $studentData[$field] = null;
                                    continue;
                                }
                            }
                            
                            $intFields = [
                                'child_order', 'siblings_count', 'height', 'weight',
                                'father_birth_year', 'mother_birth_year', 'guardian_birth_year'
                            ];
                            if (in_array($field, $intFields)) {
                                $cleanVal = preg_replace('/[^0-9]/', '', $val);
                                if ($cleanVal === '') {
                                    $studentData[$field] = null;
                                    continue;
                                }
                                $val = intval($cleanVal);
                            }

                            if ($field === 'birth_date') {
                                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
                                    continue;
                                }
                            }

                            if ($field === 'gender') {
                                $val = strtoupper($val);
                                if ($val !== 'L' && $val !== 'P') {
                                    $val = 'L';
                                }
                            }
                            $studentData[$field] = $val;
                        }
                    }
                }

                // Compile address
                $province = $studentData['province'] ?? '';
                $city = $studentData['city'] ?? '';
                $district = $studentData['district'] ?? '';
                $village = $studentData['village'] ?? '';
                $postalCode = $studentData['postal_code'] ?? '';
                $addressDetails = $studentData['address_details'] ?? '';
                $parts = array_filter([$addressDetails, $village, $district, $city, $province, $postalCode]);
                if (!empty($parts)) {
                    $studentData['address'] = implode(', ', $parts);
                }

                // Set parent_name
                $fatherName = $studentData['father_name'] ?? '';
                $motherName = $studentData['mother_name'] ?? '';
                $guardianName = $studentData['guardian_name'] ?? '';
                $parentName = $fatherName ?: ($motherName ?: ($guardianName ?: ''));
                if ($parentName !== '') {
                    $studentData['parent_name'] = $parentName;
                }

                // Cari atau buat Student profile
                $student = Student::where('user_id', $user->id)->first();
                if (!$student) {
                    $studentData['user_id'] = $user->id;
                    $defaults = [
                        'gender' => 'L',
                        'birth_place' => '-',
                        'birth_date' => '2010-01-01',
                        'address' => '-',
                        'parent_name' => '-',
                        'religion' => 'Islam',
                        'citizenship' => 'WNI',
                    ];
                    try {
                        $finalStudentData = array_merge($defaults, $studentData);
                        Student::create($finalStudentData);
                        echo "<span class='ok'>[Baris {$rowNum}] Berhasil membuat profil biodata untuk {$name}</span>\n";
                    } catch (\Illuminate\Database\QueryException $ex) {
                        if ($ex->errorInfo[1] == 1062) {
                            echo "<span class='warn'>[Baris {$rowNum}] Warning: NISN/NIK duplikat terdeteksi saat pembuatan. Mencoba membuat tanpa NISN/NIK...</span>\n";
                            unset($studentData['nisn']);
                            unset($studentData['nik']);
                            $finalStudentData = array_merge($defaults, $studentData);
                            $finalStudentData['nisn'] = null;
                            $finalStudentData['nik'] = null;
                            Student::create($finalStudentData);
                            echo "<span class='info'>[Baris {$rowNum}] Berhasil membuat profil biodata (tanpa NISN/NIK) untuk {$name}</span>\n";
                        } else {
                            throw $ex;
                        }
                    }
                } else {
                    try {
                        if (!empty($studentData)) {
                            $student->update($studentData);
                        }
                        echo "<span class='ok'>[Baris {$rowNum}] Berhasil memperbarui biodata untuk {$name}</span>\n";
                    } catch (\Illuminate\Database\QueryException $ex) {
                        if ($ex->errorInfo[1] == 1062) {
                            echo "<span class='warn'>[Baris {$rowNum}] Warning: NISN/NIK duplikat terdeteksi saat update. Mencoba memperbarui sisa data...</span>\n";
                            unset($studentData['nisn']);
                            unset($studentData['nik']);
                            if (!empty($studentData)) {
                                $freshStudent = Student::find($student->id);
                                if ($freshStudent) {
                                    $freshStudent->update($studentData);
                                }
                            }
                            echo "<span class='info'>[Baris {$rowNum}] Berhasil memperbarui sisa biodata (tanpa NISN/NIK duplikat) untuk {$name}</span>\n";
                        } else {
                            throw $ex;
                        }
                    }
                }

                DB::commit();
                $successCount++;
            } catch (\Exception $ex) {
                DB::rollBack();
                $errStr = "Error di baris {$rowNum} ({$name}): " . $ex->getMessage();
                echo "<span class='fail'>[Gagal] {$errStr}</span>\n";
                $errors[] = $errStr;
            }

            // Flush output periodically
            if ($index % 10 == 0) {
                echo "<script>document.getElementById('log_div').scrollTop = document.getElementById('log_div').scrollHeight;</script>";
                flush();
                ob_flush();
            }
        }
        fclose($handle);
    }

    echo '</div>'; // End log

    $elapsed = round(microtime(true) - LARAVEL_START, 2);

    if (count($errors) == 0) {
        echo "<div class='done'>🎉 <strong>Import Selesai dengan Sukses!</strong><br><br>
        - Total data berhasil dimasukkan/diupdate: <strong>{$successCount}</strong><br>
        - Waktu eksekusi: {$elapsed} detik.<br><br>
        🗑️ <strong>PENTING:</strong> Segera hapus file <code>public/import_biodata_runner.php</code> dan <code>upload_biodata.csv</code> dari server cPanel demi keamanan!</div>";
    } else {
        echo "<div class='err'>⚠️ <strong>Import Selesai dengan beberapa error.</strong><br><br>
        - Total data sukses: <strong>{$successCount}</strong><br>
        - Gagal: <strong>" . count($errors) . "</strong><br>
        - Waktu eksekusi: {$elapsed} detik.<br><br>
        Silakan periksa log di atas. Hapus file script ini setelah selesai!</div>";
    }

} catch (\Throwable $e) {
    echo '</div>'; // End log if not ended
    echo '<div class="err">❌ Error fatal saat memuat Laravel: ' . htmlspecialchars($e->getMessage()) . '<br>';
    echo htmlspecialchars($e->getFile()) . ' line ' . $e->getLine() . '</div>';
}

echo '</body></html>';
