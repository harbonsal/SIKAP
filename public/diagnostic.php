<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\ActiveSubject;
use App\Models\Schedule;
use App\Models\TeacherUnavailableHour;

$year = \App\Services\AcademicStateService::currentAcademicYear() ?? \App\Services\AcademicStateService::activeAcademicYear();
if (!$year) die("No active year");

echo "<h2>Analisis Jadwal Kosong (Unallocated Hours)</h2>";
echo "<b>Tahun Ajaran:</b> " . $year->name . "<br><br>";

$activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($year) {
    $q->where('academic_year_id', $year->id);
})->whereNotNull('teacher_id')->where('jam', '>', 0)->with(['teacher', 'activeClass.kelas', 'activeClass.kelasParalel', 'mapel'])->get();

$unallocated = [];
foreach ($activeSubjects as $subject) {
    $assigned = Schedule::where('academic_year_id', $year->id)
        ->where('active_subject_id', $subject->id)
        ->count();
    $needed = (int)$subject->jam - $assigned;
    if ($needed > 0) {
        $unallocated[] = [
            'subject' => $subject->mapel->name ?? 'Unknown',
            'class' => ($subject->activeClass->kelas->name ?? 'Unknown') . ($subject->activeClass->kelasParalel ? ' ' . $subject->activeClass->kelasParalel->name : ''),
            'teacher' => $subject->teacher->name ?? 'Unknown',
            'needed' => $needed,
            'id' => $subject->id,
            'teacher_id' => $subject->teacher_id,
            'class_id' => $subject->active_class_id,
            'total_jam' => $subject->jam
        ];
    }
}

echo "<h3>Total Mapel yang gagal dialokasikan penuh: " . count($unallocated) . "</h3>";
echo "<table border='1' cellpadding='8' style='border-collapse: collapse;'>";
echo "<tr><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Total Jam</th><th>Kurang (Gagal Masuk)</th><th>Analisa Penyebab Utama</th></tr>";

foreach ($unallocated as $u) {
    // Analyze why it failed
    $teacherSchedules = Schedule::where('academic_year_id', $year->id)->where('teacher_id', $u['teacher_id'])->count();
    $classSchedules = Schedule::where('academic_year_id', $year->id)->where('active_class_id', $u['class_id'])->count();
    $offs = TeacherUnavailableHour::where('academic_year_id', $year->id)->where('user_id', $u['teacher_id'])->count();
    
    $reason = "";
    if ($teacherSchedules + $offs >= 30) {
        $reason .= "<li style='color:red;'>Jadwal guru bersangkutan sangat padat ($teacherSchedules jam terisi, $offs jam off). Kemungkinan besar bentrok.</li>";
    }
    if ($classSchedules >= 33) {
        $reason .= "<li>Jadwal kelas hampir penuh, sisa slot sangat sempit.</li>";
    }
    if ((int)$u['total_jam'] == 2 && $u['needed'] == 2) {
        $reason .= "<li>Aturan 'Jadwal 2 jam tidak boleh dipecah' membuat mapel ini menyerah karena tidak ada slot 2 jam berurutan yang kosong.</li>";
    }
    if ($reason == "") {
        $reason = "<li>Bentrok jadwal normal (Guru mengajar di kelas lain pada slot yang tersisa di kelas ini).</li>";
    }
    
    echo "<tr>";
    echo "<td>{$u['class']}</td>";
    echo "<td>{$u['subject']}</td>";
    echo "<td>{$u['teacher']}</td>";
    echo "<td>{$u['total_jam']} Jam</td>";
    echo "<td style='color:red; font-weight:bold;'>{$u['needed']} Jam</td>";
    echo "<td><ul>$reason</ul></td>";
    echo "</tr>";
}
echo "</table>";
echo "<br><p><b>Saran Perbaikan:</b><br>1. Cek kembali tab 'Jam Off Guru', pastikan tidak terlalu banyak guru yang off di hari yang sama (misal Jumat/Sabtu).<br>2. Hapus secara manual (Kosongkan Jadwal) lalu Generate ulang untuk mendapatkan permutasi yang berbeda.<br>3. Input secara manual mapel-mapel merah di atas sebelum menekan Generate.</p>";
