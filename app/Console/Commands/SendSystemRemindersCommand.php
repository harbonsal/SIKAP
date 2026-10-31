<?php

namespace App\Console\Commands;

use App\Models\AcademicCalendarEvent;
use App\Models\ActiveSubject;
use App\Models\ClassJournal;
use App\Models\Day;
use App\Models\MusyrifTarbiyahPlotting;
use App\Models\PushSubscription;
use App\Models\Schedule;
use App\Models\SchoolInfo;
use App\Models\Setting;
use App\Models\StudentGrade;
use App\Models\TarbiyahGroupLog;
use App\Models\TarbiyahIndividualLog;
use App\Models\User;
use App\Services\AcademicStateService;
use App\Services\WebPushService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SendSystemRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sikap:send-reminders {--type=all : Reminder type (academic, tarbiyah, kbm, all)} {--force : Send regardless of throttling or time window}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi pengingat otomatis ke HP asatidzah (deadline nilai, jam mengajar KBM lewat 10 menit, mutabaah tarbiyah santri asuh)';

    protected WebPushService $pushService;

    public function __construct(WebPushService $pushService)
    {
        parent::__construct();
        $this->pushService = $pushService;
    }

    public function handle(): int
    {
        $type = $this->option('type') ?: 'all';
        $this->info("Memulai pengiriman reminder (Type: {$type})...");

        $academicYear = AcademicStateService::activeAcademicYear();
        $semester = AcademicStateService::activeSemester();

        if (!$academicYear || !$semester) {
            $this->warn('Tahun ajaran atau semester aktif tidak ditemukan.');
            return Command::SUCCESS;
        }

        $sentCount = 0;

        // 1. Pengingat Jam Mengajar KBM (lewat 10 menit belum isi jurnal/absensi)
        if (in_array($type, ['all', 'kbm'])) {
            $sentCount += $this->remindKbmJournals($academicYear);
        }

        // 2. Pengingat Batas Akhir Input Nilai Akademik
        if (in_array($type, ['all', 'academic'])) {
            $sentCount += $this->remindAcademicGrades($academicYear, $semester);
        }

        // 3. Pengingat Musrif Tarbiyah (Bimbingan Santri Asuh)
        if (in_array($type, ['all', 'tarbiyah'])) {
            $sentCount += $this->remindMusyrifTarbiyah($academicYear);
        }

        $this->info("Pengiriman selesai. Total notifikasi terkirim: {$sentCount}");
        return Command::SUCCESS;
    }

    /**
     * Kirim reminder ke guru yang sedang mengajar hari ini jika sudah lewat 10 menit
     * tetapi jurnal KBM / absensi santri belum diisi.
     */
    protected function remindKbmJournals($academicYear): int
    {
        $this->line('Memeriksa jadwal KBM hari ini dan kepatuhan pengisian jurnal/absensi...');

        Carbon::setLocale('id');
        $now = Carbon::now();
        $todayDate = $now->toDateString();
        $dayName = $now->translatedFormat('l');

        $day = Day::where('name', $dayName)->first();
        if (!$day) {
            $this->line("Hari {$dayName} tidak terdaftar di data master hari.");
            return 0;
        }

        $schedules = Schedule::where('academic_year_id', $academicYear->id)
            ->where('day_id', $day->id)
            ->whereNotNull('teacher_id')
            ->with([
                'learningHour',
                'teacher',
                'activeClass.kelas',
                'activeClass.kelasParalel',
                'activeSubject.mapel',
            ])
            ->get();

        if ($schedules->isEmpty()) {
            $this->line("Tidak ada jadwal KBM aktif untuk hari {$dayName}.");
            return 0;
        }

        $sentCount = 0;
        $isForce = (bool)$this->option('force');

        foreach ($schedules as $schedule) {
            $learningHour = $schedule->learningHour;
            if (!$learningHour || !$schedule->teacher) {
                continue;
            }

            try {
                $lessonStart = Carbon::parse($todayDate . ' ' . $learningHour->start_time);
                $lessonEnd = Carbon::parse($todayDate . ' ' . $learningHour->end_time);
            } catch (\Throwable $e) {
                continue;
            }

            $tenMinutesAfterStart = $lessonStart->copy()->addMinutes(10);
            $cutoffEnd = $lessonEnd->copy()->addMinutes(45);

            if (!$isForce) {
                if ($now->lessThan($tenMinutesAfterStart) || $now->greaterThan($cutoffEnd)) {
                    continue;
                }
            }

            $hourNum = (string)$learningHour->hour_number;

            $hasJournal = ClassJournal::where('teacher_id', $schedule->teacher_id)
                ->where('active_subject_id', $schedule->active_subject_id)
                ->where('date', $todayDate)
                ->where(function ($q) use ($hourNum) {
                    $q->where('jam_ke', $hourNum)
                      ->orWhere('jam_ke', 'like', "%{$hourNum}%")
                      ->orWhereNull('jam_ke');
                })
                ->exists();

            if ($hasJournal) {
                continue;
            }

            $cacheKey = "kbm_journal_reminder_sent_{$schedule->id}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                continue;
            }

            $hasSubs = PushSubscription::where('user_id', $schedule->teacher_id)->exists();
            if (!$hasSubs) {
                continue;
            }

            $teacherName = $schedule->teacher->name;
            $subjectName = $schedule->activeSubject?->mapel?->name ?? 'Mata Pelajaran';
            $className = trim(($schedule->activeClass?->kelas?->name ?? '') . ' ' . ($schedule->activeClass?->kelasParalel?->name ?? ''));

            $title = '⏰ Pengingat Jurnal & Absensi KBM';
            $body = "Ustadz {$teacherName}, jam mengajar {$subjectName} di kelas {$className} (Jam ke-{$hourNum}) sudah berjalan lebih dari 10 menit. Mohon segera isi jurnal KBM & absensi santri.";

            $url = route('journals.create', [], false);

            $result = $this->pushService->sendToUser(
                $schedule->teacher_id,
                $title,
                $body,
                $url,
                ['tag' => "kbm-reminder-{$schedule->id}-{$todayDate}"]
            );

            if ($result['success'] > 0) {
                Cache::put($cacheKey, true, now()->addHours(8));
                $sentCount += $result['success'];
                $this->info("Reminder KBM terkirim ke: {$teacherName} ({$subjectName} {$className} - Jam ke-{$hourNum})");
            }
        }

        return $sentCount;
    }

    /**
     * Kirim reminder batas akhir pengisian nilai akademik ke guru-guru yang belum tuntas.
     */
    protected function remindAcademicGrades($academicYear, $semester): int
    {
        $this->line('Memeriksa batas akhir dan kelengkapan nilai akademik guru...');

        Carbon::setLocale('id');
        $today = Carbon::now()->startOfDay();
        $todayDate = $today->toDateString();
        $isForce = (bool)$this->option('force');

        // Ambil konfigurasi deadline nilai rapor
        $gradeDeadlineStr = Setting::where('key', 'academic_grade_deadline')->value('value')
            ?: (SchoolInfo::first()?->grade_config['grade_deadline'] ?? null);

        // Cari juga di kalender akademik jika belum disetel manual di setting
        if (!$gradeDeadlineStr) {
            $calendarEvent = AcademicCalendarEvent::where('academic_year_id', $academicYear->id)
                ->where(function ($q) {
                    $q->where('title', 'like', '%nilai%')
                      ->orWhere('title', 'like', '%rapor%')
                      ->orWhere('category', 'like', '%nilai%')
                      ->orWhere('category', 'like', '%rapor%');
                })
                ->where('end_date', '>=', $todayDate)
                ->orderBy('end_date', 'asc')
                ->first();

            if ($calendarEvent) {
                $gradeDeadlineStr = $calendarEvent->end_date;
            }
        }

        $daysLeft = null;
        $deadlineFormatted = null;

        if ($gradeDeadlineStr) {
            try {
                $deadlineDate = Carbon::parse($gradeDeadlineStr)->startOfDay();
                $daysLeft = (int)$today->diffInDays($deadlineDate, false);
                $deadlineFormatted = $deadlineDate->translatedFormat('d F Y');
            } catch (\Throwable $e) {
                $daysLeft = null;
            }
        }

        // Ambil semua guru yang memiliki mapel aktif di tahun ajaran berjalan
        $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($academicYear) {
            $q->where('academic_year_id', $academicYear->id);
        })
        ->whereNotNull('teacher_id')
        ->with(['teacher', 'mapel', 'activeClass.kelas', 'activeClass.kelasParalel'])
        ->get();

        $teachersWithPendingGrades = [];

        foreach ($activeSubjects as $subject) {
            if (!$subject->teacher) {
                continue;
            }

            $studentsCount = $subject->activeClass?->classMembers()?->count() ?? 0;
            if ($studentsCount === 0) {
                continue;
            }

            $gradedCount = StudentGrade::where('active_subject_id', $subject->id)
                ->where('semester_id', $semester->id)
                ->distinct('student_id')
                ->count('student_id');

            if ($gradedCount < $studentsCount) {
                $teacherId = $subject->teacher_id;
                if (!isset($teachersWithPendingGrades[$teacherId])) {
                    $teachersWithPendingGrades[$teacherId] = [
                        'teacher' => $subject->teacher,
                        'pending_subjects' => [],
                        'missing_students_count' => 0,
                    ];
                }
                $className = trim(($subject->activeClass?->kelas?->name ?? '') . ' ' . ($subject->activeClass?->kelasParalel?->name ?? ''));
                $teachersWithPendingGrades[$teacherId]['pending_subjects'][] = ($subject->mapel?->name ?? 'Mapel') . ' (' . $className . ')';
                $teachersWithPendingGrades[$teacherId]['missing_students_count'] += ($studentsCount - $gradedCount);
            }
        }

        $sentCount = 0;

        foreach ($teachersWithPendingGrades as $teacherId => $data) {
            $hasSubs = PushSubscription::where('user_id', $teacherId)->exists();
            if (!$hasSubs) {
                continue;
            }

            // Throttle: Maksimal 1x notifikasi nilai per hari untuk setiap guru
            $cacheKey = "academic_grade_reminder_sent_{$teacherId}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                continue;
            }

            $subjectListStr = implode(', ', array_slice($data['pending_subjects'], 0, 2));
            if (count($data['pending_subjects']) > 2) {
                $subjectListStr .= ' dan ' . (count($data['pending_subjects']) - 2) . ' kelas lainnya';
            }

            $teacherName = $data['teacher']->name;

            // Variasi Pesan Berdasarkan Batas Waktu (Deadline)
            if ($daysLeft !== null) {
                if ($daysLeft > 0) {
                    $title = "📋 Batas Input Nilai Tersisa {$daysLeft} Hari";
                    $body = "Ustadz {$teacherName}, batas akhir input nilai rapor tersisa {$daysLeft} hari ({$deadlineFormatted}). Masih ada nilai santri pada {$subjectListStr} yang belum lengkap. Mohon segera diisi.";
                } elseif ($daysLeft === 0) {
                    $title = "🚨 HARI TERAKHIR: Batas Input Nilai Rapor";
                    $body = "Ustadz {$teacherName}, HARI INI adalah batas akhir input nilai rapor. Mohon tuntaskan nilai santri pada {$subjectListStr} sebelum portal ditutup.";
                } else {
                    $absDays = abs($daysLeft);
                    $title = "⚠️ PERINGATAN: Batas Input Nilai Terlewat";
                    $body = "Ustadz {$teacherName}, batas akhir input nilai rapor telah terlewat {$absDays} hari. Masih ada nilai santri pada {$subjectListStr} yang kosong. Mohon segera diselesaikan hari ini.";
                }
            } else {
                $title = "📋 Pengingat Input Nilai Santri";
                $body = "Ustadz {$teacherName}, masih ada nilai santri yang belum lengkap untuk {$subjectListStr}. Mohon segera lengkapi di portal SIKAP.";
            }

            $url = route('assessments.index', [], false);

            $result = $this->pushService->sendToUser(
                $teacherId,
                $title,
                $body,
                $url,
                ['tag' => 'sikap-grade-reminder-' . $teacherId . '-' . $todayDate]
            );

            if ($result['success'] > 0) {
                Cache::put($cacheKey, true, now()->addHours(18));
                $sentCount += $result['success'];
                $this->info("Reminder nilai terkirim ke: {$teacherName} ({$result['success']} perangkat)");
            }
        }

        return $sentCount;
    }

    /**
     * Kirim reminder ke musrif tarbiyah yang santri asuhnya belum dicatat mutabaah dalam sepekan terakhir.
     */
    protected function remindMusyrifTarbiyah($academicYear): int
    {
        $this->line('Memeriksa bimbingan santri asuh musrif tarbiyah...');

        $now = Carbon::now();
        $todayDate = $now->toDateString();
        $oneWeekAgo = $now->copy()->subDays(7)->toDateString();
        $isForce = (bool)$this->option('force');

        // Ambil seluruh musrif yang memiliki santri asuh di tahun ajaran aktif
        $musyrifIds = MusyrifTarbiyahPlotting::where('academic_year_id', $academicYear->id)
            ->distinct('user_id')
            ->pluck('user_id')
            ->toArray();

        $sentCount = 0;

        foreach ($musyrifIds as $musrifId) {
            $hasSubs = PushSubscription::where('user_id', $musrifId)->exists();
            if (!$hasSubs) {
                continue;
            }

            // Throttle: 1x reminder tarbiyah per hari
            $cacheKey = "tarbiyah_reminder_sent_{$musrifId}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                continue;
            }

            // Dapatkan seluruh santri asuh musrif ini
            $plottings = MusyrifTarbiyahPlotting::where('academic_year_id', $academicYear->id)
                ->where('user_id', $musrifId)
                ->with('student')
                ->get();

            if ($plottings->isEmpty()) {
                continue;
            }

            $pendingStudents = [];

            foreach ($plottings as $plot) {
                $student = $plot->student;
                if (!$student) continue;

                // Periksa log tatap muka / mutabaah individual terakhir
                $lastLog = TarbiyahIndividualLog::where('user_id', $musrifId)
                    ->where('student_id', $plot->student_id)
                    ->orderBy('date', 'desc')
                    ->first();

                if (!$lastLog || $lastLog->date < $oneWeekAgo) {
                    $pendingStudents[] = $student->name;
                }
            }

            // Jika ada santri asuh yang belum dimutaba'ah dalam 7 hari terakhir
            if (!empty($pendingStudents)) {
                $user = User::find($musrifId);
                if (!$user) {
                    continue;
                }

                $totalPending = count($pendingStudents);
                $namesPreview = implode(', ', array_slice($pendingStudents, 0, 2));
                if ($totalPending > 2) {
                    $namesPreview .= ' dan ' . ($totalPending - 2) . ' santri lainnya';
                }

                $title = '🤝 Pengingat Musrif Tarbiyah';
                $body = "Ustadz {$user->name}, antum memiliki {$totalPending} santri asuh yang belum dicatat mutaba'ahnya dalam 1 pekan terakhir ({$namesPreview}). Mohon luangkan waktu membimbing adik asuh antum.";

                $url = route('musyrif-tarbiyah.index', [], false);

                $result = $this->pushService->sendToUser(
                    $musrifId,
                    $title,
                    $body,
                    $url,
                    ['tag' => 'sikap-tarbiyah-reminder-' . $musrifId . '-' . $todayDate]
                );

                if ($result['success'] > 0) {
                    Cache::put($cacheKey, true, now()->addHours(18));
                    $sentCount += $result['success'];
                    $this->info("Reminder tarbiyah terkirim ke: {$user->name} ({$totalPending} santri asuh belum dimutaba'ah)");
                }
            }
        }

        return $sentCount;
    }
}
