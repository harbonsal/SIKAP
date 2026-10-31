<?php

namespace App\Console\Commands;

use App\Models\AcademicCalendarEvent;
use App\Models\ActiveSubject;
use App\Models\MusyrifTarbiyahPlotting;
use App\Models\PushSubscription;
use App\Models\StudentGrade;
use App\Models\TarbiyahGroupLog;
use App\Models\TarbiyahIndividualLog;
use App\Models\User;
use App\Services\AcademicStateService;
use App\Services\WebPushService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendSystemRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sikap:send-reminders {--type=all : Reminder type (academic, tarbiyah, all)} {--force : Send regardless of throttling}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi pengingat otomatis ke HP asatidzah (deadline nilai, mutabaah tarbiyah, dll)';

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

        if (in_array($type, ['all', 'academic'])) {
            $sentCount += $this->remindAcademicGrades($academicYear, $semester);
        }

        if (in_array($type, ['all', 'tarbiyah'])) {
            $sentCount += $this->remindMusyrifTarbiyah($academicYear);
        }

        $this->info("Pengiriman selesai. Total notifikasi terkirim: {$sentCount}");
        return Command::SUCCESS;
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
            // Hanya kirim ke guru yang mengaktifkan push notification di HP-nya
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

