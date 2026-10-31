<?php

namespace App\Console\Commands;

use App\Models\AcademicCalendarEvent;
use App\Models\ActiveSubject;
use App\Models\ClassJournal;
use App\Models\Day;
use App\Models\MusyrifTarbiyahPlotting;
use App\Models\PushSubscription;
use App\Models\Schedule;
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
    protected $description = 'Kirim notifikasi pengingat otomatis ke HP asatidzah (deadline nilai, jam mengajar KBM lewat 10 menit, mutabaah tarbiyah, dll)';

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

        // 2. Pengingat Nilai Akademik
        if (in_array($type, ['all', 'academic'])) {
            $sentCount += $this->remindAcademicGrades($academicYear, $semester);
        }

        // 3. Pengingat Musyrif Tarbiyah
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
        $dayName = $now->translatedFormat('l'); // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Ahad

        $day = Day::where('name', $dayName)->first();
        if (!$day) {
            $this->line("Hari {$dayName} tidak terdaftar di data master hari.");
            return 0;
        }

        // Ambil seluruh jadwal mengajar pada hari ini
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

            // Parse jam mulai dan selesai KBM
            try {
                $lessonStart = Carbon::parse($todayDate . ' ' . $learningHour->start_time);
                $lessonEnd = Carbon::parse($todayDate . ' ' . $learningHour->end_time);
            } catch (\Throwable $e) {
                continue;
            }

            // Syarat: Sudah lewat 10 menit sejak jam mulai KBM, dan belum lewat 45 menit setelah jam selesai KBM
            $tenMinutesAfterStart = $lessonStart->copy()->addMinutes(10);
            $cutoffEnd = $lessonEnd->copy()->addMinutes(45);

            if (!$isForce) {
                if ($now->lessThan($tenMinutesAfterStart) || $now->greaterThan($cutoffEnd)) {
                    continue;
                }
            }

            $hourNum = (string)$learningHour->hour_number;

            // Cek apakah guru sudah menginput jurnal untuk mapel ini pada hari ini
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

            // Throttle agar tidak mengirim notifikasi berulang kali untuk jadwal yang sama di hari yang sama
            $cacheKey = "kbm_journal_reminder_sent_{$schedule->id}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                continue;
            }

            // Cek apakah guru memiliki push subscription aktif
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
     * Kirim reminder pengisian nilai akademik ke guru-guru yang belum tuntas.
     */
    protected function remindAcademicGrades($academicYear, $semester): int
    {
        $this->line('Memeriksa pengisian nilai akademik guru...');

        // Ambil semua guru yang memiliki mapel aktif di tahun ajaran & semester berjalan
        $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($academicYear) {
            $q->where('academic_year_id', $academicYear->id);
        })
        ->whereNotNull('teacher_id')
        ->with(['teacher', 'mapel', 'activeClass'])
        ->get();

        $teachersWithPendingGrades = [];

        foreach ($activeSubjects as $subject) {
            if (!$subject->teacher) {
                continue;
            }

            // Hitung jumlah santri di kelas
            $studentsCount = $subject->activeClass?->classMembers()?->count() ?? 0;
            if ($studentsCount === 0) {
                continue;
            }

            // Hitung berapa santri yang sudah punya nilai
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
                    ];
                }
                $teachersWithPendingGrades[$teacherId]['pending_subjects'][] = ($subject->mapel?->name ?? 'Mapel') . ' (' . ($subject->activeClass?->name ?? '') . ')';
            }
        }

        $count = 0;
        foreach ($teachersWithPendingGrades as $teacherId => $data) {
            $hasSubs = PushSubscription::where('user_id', $teacherId)->exists();
            if (!$hasSubs) {
                continue;
            }

            $subjectListStr = implode(', ', array_slice($data['pending_subjects'], 0, 2));
            if (count($data['pending_subjects']) > 2) {
                $subjectListStr .= ' dan ' . (count($data['pending_subjects']) - 2) . ' kelas lainnya';
            }

            $title = '📋 Pengingat Input Nilai Santri';
            $body = 'Ustadz ' . $data['teacher']->name . ', masih ada nilai yang belum lengkap untuk ' . $subjectListStr . '. Mohon segera lengkapi di portal SIKAP.';

            $result = $this->pushService->sendToUser(
                $teacherId,
                $title,
                $body,
                '/teacher/grades',
                ['tag' => 'sikap-grade-reminder-' . $teacherId]
            );

            if ($result['success'] > 0) {
                $count += $result['success'];
                $this->info("Reminder nilai terkirim ke: {$data['teacher']->name} ({$result['success']} perangkat)");
            }
        }

        return $count;
    }

    /**
     * Kirim reminder ke musyrif tarbiyah yang belum mengisi laporan mutabaah santri asuh pekan ini.
     */
    protected function remindMusyrifTarbiyah($academicYear): int
    {
        $this->line('Memeriksa agenda musyrif tarbiyah...');

        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();

        // Ambil semua user yang diplot sebagai musyrif tarbiyah
        $musyrifIds = MusyrifTarbiyahPlotting::where('academic_year_id', $academicYear->id)
            ->distinct('user_id')
            ->pluck('user_id')
            ->toArray();

        $count = 0;
        foreach ($musyrifIds as $musyrifId) {
            $hasSubs = PushSubscription::where('user_id', $musyrifId)->exists();
            if (!$hasSubs) {
                continue;
            }

            // Cek apakah musyrif sudah mengisi log tarbiyah pekan ini
            $hasIndividualLog = TarbiyahIndividualLog::where('musyrif_id', $musyrifId)
                ->where('created_at', '>=', $startOfWeek)
                ->exists();

            $hasGroupLog = TarbiyahGroupLog::where('musyrif_id', $musyrifId)
                ->where('created_at', '>=', $startOfWeek)
                ->exists();

            if (!$hasIndividualLog && !$hasGroupLog) {
                $user = User::find($musyrifId);
                if (!$user) {
                    continue;
                }

                $title = '🤝 Pengingat Musyrif Tarbiyah';
                $body = 'Ustadz ' . $user->name . ', antum belum mencatat agenda/mutabaah santri asuh untuk pekan ini. Mohon luangkan waktu membimbing adik asuh.';

                $result = $this->pushService->sendToUser(
                    $musyrifId,
                    $title,
                    $body,
                    '/tarbiyah/musyrif',
                    ['tag' => 'sikap-tarbiyah-reminder-' . $musyrifId]
                );

                if ($result['success'] > 0) {
                    $count += $result['success'];
                    $this->info("Reminder tarbiyah terkirim ke: {$user->name} ({$result['success']} perangkat)");
                }
            }
        }

        return $count;
    }
}
