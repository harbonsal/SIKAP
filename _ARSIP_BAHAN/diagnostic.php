<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AcademicYear;
use App\Models\ActiveSubject;
use App\Models\DayLearningHour;
use App\Models\Schedule;
use App\Models\TeacherUnavailableHour;

$year = \App\Services\AcademicStateService::activeAcademicYear();
if (!$year) die("No active year");

echo "Academic Year: " . $year->name . "\n";

$schoolInfo = \App\Models\SchoolInfo::first();
$config = $schoolInfo?->schedule_config ?? [];
$maxHoursPerClass = $config['max_hours_per_class'] ?? 4;
$maxHoursPerDay = $config['max_hours_per_day'] ?? 6;

echo "Max Hours Per Class: $maxHoursPerClass\n";
echo "Max Hours Per Day: $maxHoursPerDay\n";

// Get Unallocated subjects
$activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($year) {
    $q->where('academic_year_id', $year->id);
})->whereNotNull('teacher_id')->where('jam', '>', 0)->with(['teacher', 'activeClass', 'mapel'])->get();

$unallocated = [];
foreach ($activeSubjects as $subject) {
    $assigned = Schedule::where('academic_year_id', $year->id)
        ->where('active_subject_id', $subject->id)
        ->count();
    $needed = (int)$subject->jam - $assigned;
    if ($needed > 0) {
        $unallocated[] = [
            'subject' => $subject->mapel->name ?? 'Unknown',
            'class' => $subject->activeClass->kelas->name ?? 'Unknown',
            'teacher' => $subject->teacher->name ?? 'Unknown',
            'needed' => $needed,
            'id' => $subject->id,
            'total_jam' => $subject->jam
        ];
    }
}

echo "Unallocated Subjects: " . count($unallocated) . "\n";
foreach ($unallocated as $u) {
    echo "- Class: {$u['class']}, Subject: {$u['subject']}, Teacher: {$u['teacher']}, Total Jam: {$u['total_jam']}, Unallocated: {$u['needed']} hours\n";
}

// Deep analysis for all unallocated subjects
if (count($unallocated) > 0) {
    echo "\n--- Deep Analysis ---\n";
    foreach(array_slice($unallocated, 0, 10) as $target) { // Analyze first 10
        echo "\nAnalyzing: Class {$target['class']}, Subject {$target['subject']}, Teacher {$target['teacher']}\n";
        $subject = ActiveSubject::find($target['id']);
        
        $teacherSchedules = Schedule::where('academic_year_id', $year->id)
            ->where('teacher_id', $subject->teacher_id)
            ->get();
        echo "Teacher total assigned hours: " . $teacherSchedules->count() . "\n";
        
        $classSchedules = Schedule::where('academic_year_id', $year->id)
            ->where('active_class_id', $subject->active_class_id)
            ->get();
        echo "Class total assigned hours: " . $classSchedules->count() . "\n";
        
        $offs = TeacherUnavailableHour::where('academic_year_id', $year->id)
            ->where('user_id', $subject->teacher_id)
            ->get();
        echo "Teacher Off Hours count: " . $offs->count() . "\n";
    }
}
