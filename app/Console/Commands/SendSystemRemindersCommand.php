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
    protected $signature = 'sikap:send-reminders 
        {--type=all : Jenis reminder (academic, tarbiyah, kbm, all, broadcast)} 
        {--force : Abaikan jeda throttling waktu/cache} 
        {--to-user= : Kirim simulasi pengingat langsung ke ID user tertentu}';

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
        $toUserId = $this->option('to-user') ? (int)$this->option('to-user') : null;

        $this->info("=======================================================");
        $this->info("🚀 SIKAP SYSTEM REMINDER ENGINE (Tipe: " . strtoupper($type) . ")");
        $this->info("=======================================================");

        $totalActiveSubscriptions = PushSubscription::count();
        $this->line("📱 Total Perangkat HP Terdaftar di Sistem: {$totalActiveSubscriptions} perangkat.");

        if ($totalActiveSubscriptions === 0 && !$toUserId) {
            $this->warn("⚠️  PERHATIAN: Saat ini BELUM ADA satupun perangkat HP/browser yang mengaktifkan izin notifikasi di tabel push_subscriptions.");
            $this->warn("    Notifikasi hanya dapat terkirim secara fisik jika pengguna telah mengaktifkan izin push notifikasi di perangkat mereka.");
        }

        // Mode Broadcast Tes ke Seluruh Perangkat
        if ($type === 'broadcast') {
            $sent = $this->broadcastTestNotification();
            $this->info("Broadcast selesai. Notifikasi terkirim ke {$sent} perangkat.");
            return Command::SUCCESS;
        }

        $academicYear = AcademicStateService::activeAcademicYear();
        $semester = AcademicStateService::activeSemester();

        if (!$academicYear || !$semester) {
            $this->error('Tahun ajaran atau semester aktif tidak ditemukan di sistem.');
            return Command::SUCCESS;
        }

        $this->line("📅 Tahun Ajaran: {$academicYear->name} | Semester: {$semester->name}");
        $this->newLine();

        $sentCount = 0;

        // 1. Pengingat Jam Mengajar KBM (lewat 10 menit belum isi jurnal/absensi)
        if (in_array($type, ['all', 'kbm'])) {
            $sentCount += $this->remindKbmJournals($academicYear, $toUserId);
            $this->newLine();
        }

        // 2. Pengingat Batas Akhir Input Nilai Akademik
        if (in_array($type, ['all', 'academic'])) {
            $sentCount += $this->remindAcademicGrades($academicYear, $semester, $toUserId);
            $this->newLine();
        }

        // 3. Pengingat Musrif Tarbiyah (Bimbingan Santri Asuh)
        if (in_array($type, ['all', 'tarbiyah'])) {
            $sentCount += $this->remindMusyrifTarbiyah($academicYear, $toUserId);
            $this->newLine();
        }

        $this->info("=======================================================");
        $this->info("🏁 Pengiriman selesai. Total notifikasi terkirim: {$sentCount}");
        $this->info("=======================================================");

        return Command::SUCCESS;
    }

    /**
     * Broadcast pengujian ke seluruh perangkat yang terdaftar.
     */
    protected function broadcastTestNotification(): int
    {
        $this->line('Mengirim pesan pengujian broadcast ke seluruh perangkat terdaftar...');
        $subscriptions = PushSubscription::with('user')->get();

        if ($subscriptions->isEmpty()) {
            $this->warn('Belum ada perangkat yang terdaftar di database.');
            return 0;
        }

        $sent = 0;
        foreach ($subscriptions as $sub) {
            $user = $sub->user;
            $title = '🔔 Pengingat SIKAP Berfungsi!';
            $body = 'Alhamdulillah, sistem pengingat otomatis HP SIKAP Pesantren terhubung dengan sukses di perangkat ' . ($sub->device_name ?: 'Anda') . '.';
            $url = route('dashboard', [], false);

            $result = $this->pushService->sendToSubscription(
                $sub,
                $title,
                $body,
                $url,
                ['tag' => 'broadcast-test-' . time()]
            );

            if ($result) {
                $sent++;
                $this->info("✅ Terkirim ke: " . ($user?->name ?? 'User #' . $sub->user_id) . " ({$sub->device_name})");
            } else {
                $this->warn("❌ Gagal mengirim ke: " . ($user?->name ?? 'User #' . $sub->user_id) . " ({$sub->device_name})");
            }
        }

        return $sent;
    }

    /**
     * Kirim reminder ke guru yang sedang mengajar hari ini jika sudah lewat 10 menit
     * tetapi jurnal KBM / absensi santri belum diisi.
     */
    protected function remindKbmJournals($academicYear, ?int $toUserId = null): int
    {
        $this->info("--- [1] PENGECEKAN JURNAL & ABSENSI KBM 10 MENIT ---");

        // Jika mode simulasi user spesifik
        if ($toUserId) {
            return $this->simulateKbmReminder($toUserId);
        }

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

        $this->line("-> Hari ini: {$dayName}, {$todayDate}");
        $this->line("-> Total jadwal KBM terdaftar hari ini: " . $schedules->count() . " sesi");

        if ($schedules->isEmpty()) {
            $this->line("-> Tidak ada jadwal KBM aktif untuk hari {$dayName}.");
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

            $teacherName = $schedule->teacher->name;
            $subjectName = $schedule->activeSubject?->mapel?->name ?? 'Mata Pelajaran';
            $className = trim(($schedule->activeClass?->kelas?->name ?? '') . ' ' . ($schedule->activeClass?->kelasParalel?->name ?? ''));

            $subsCount = PushSubscription::where('user_id', $schedule->teacher_id)->count();
            if ($subsCount === 0) {
                $this->warn("   [!] Ustadz {$teacherName} belum isi jurnal ({$subjectName} {$className} - Jam {$hourNum}), TETAPI BELUM mengaktifkan notifikasi di HP (0 perangkat).");
                continue;
            }

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
                $this->info("   ✅ Terkirim ke: {$teacherName} ({$subjectName} {$className} - Jam ke-{$hourNum}) [{$result['success']} perangkat]");
            }
        }

        return $sentCount;
    }

    /**
     * Kirim reminder batas akhir pengisian nilai akademik ke guru-guru yang belum tuntas.
     */
    protected function remindAcademicGrades($academicYear, $semester, ?int $toUserId = null): int
    {
        $this->info("--- [2] PENGECEKAN BATAS AKHIR INPUT NILAI AKADEMIK ---");

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
                $this->line("-> Konfigurasi Batas Akhir (Deadline): {$gradeDeadlineStr} ({$deadlineFormatted}) | Tersisa: {$daysLeft} hari.");
            } catch (\Throwable $e) {
                $daysLeft = null;
            }
        } else {
            $this->warn("-> [INFO] Batas akhir input nilai rapor belum ditentukan di Pengaturan Lembaga (/settings/school-info).");
        }

        // Jika mode simulasi langsung ke user tertentu
        if ($toUserId) {
            return $this->simulateAcademicReminder($toUserId, $daysLeft, $deadlineFormatted);
        }

        // Ambil semua guru yang memiliki mapel aktif di tahun ajaran berjalan
        $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($academicYear) {
            $q->where('academic_year_id', $academicYear->id);
        })
        ->whereNotNull('teacher_id')
        ->with(['teacher', 'mapel', 'activeClass.kelas', 'activeClass.kelasParalel'])
        ->get();

        $this->line("-> Total mata pelajaran aktif di semester ini: " . $activeSubjects->count());

        $teachersWithPendingGrades = [];

        foreach ($activeSubjects as $subject) {
            if (!$subject->teacher) {
                continue;
            }

            $studentsCount = $subject->activeClass?->classMembers()?->count() ?? 0;
            if ($studentsCount === 0) {
                continue;
            }

            // Hitung santri yang sudah memiliki nilai riil (bukan null)
            $gradedCount = StudentGrade::where('active_subject_id', $subject->id)
                ->where('semester_id', $semester->id)
                ->whereNotNull('score')
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

        $this->line("-> Guru terdeteksi memiliki nilai belum lengkap: " . count($teachersWithPendingGrades) . " orang.");

        if (empty($teachersWithPendingGrades)) {
            $this->info("-> Alhamdulillah, seluruh guru telah melengkapi nilai santri di tahun ajaran & semester aktif ini!");
            return 0;
        }

        $sentCount = 0;

        foreach ($teachersWithPendingGrades as $teacherId => $data) {
            $teacherName = $data['teacher']->name;
            $subsCount = PushSubscription::where('user_id', $teacherId)->count();

            $subjectListStr = implode(', ', array_slice($data['pending_subjects'], 0, 2));
            if (count($data['pending_subjects']) > 2) {
                $subjectListStr .= ' dan ' . (count($data['pending_subjects']) - 2) . ' kelas lainnya';
            }

            $this->line("   • [Guru] {$teacherName}: Belum lengkap pada {$subjectListStr} ({$data['missing_students_count']} santri)");

            if ($subsCount === 0) {
                $this->warn("     -> Dilewati: Ustadz {$teacherName} BELUM mengaktifkan notifikasi di HP (0 perangkat terdaftar).");
                continue;
            }

            // Throttle: Maksimal 1x notifikasi nilai per hari untuk setiap guru
            $cacheKey = "academic_grade_reminder_sent_{$teacherId}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                $this->line("     -> Dilewati: Sudah dikirim hari ini (Throttle). Gunakan --force untuk mengabaikan.");
                continue;
            }

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
                $this->info("     ✅ Terkirim ke {$teacherName} ({$result['success']} perangkat HP)");
            }
        }

        return $sentCount;
    }

    /**
     * Kirim reminder ke musrif tarbiyah yang santri asuhnya belum dicatat mutabaah dalam sepekan terakhir.
     */
    protected function remindMusyrifTarbiyah($academicYear, ?int $toUserId = null): int
    {
        $this->info("--- [3] PENGECEKAN BIMBINGAN SANTRI ASUH MUSRIF TARBIYAH ---");

        // Jika mode simulasi langsung ke user tertentu
        if ($toUserId) {
            return $this->simulateTarbiyahReminder($toUserId);
        }

        $now = Carbon::now();
        $todayDate = $now->toDateString();
        $oneWeekAgo = $now->copy()->subDays(7)->toDateString();
        $isForce = (bool)$this->option('force');

        // Ambil seluruh musrif yang memiliki santri asuh di tahun ajaran aktif
        $musyrifIds = MusyrifTarbiyahPlotting::where('academic_year_id', $academicYear->id)
            ->distinct('user_id')
            ->pluck('user_id')
            ->toArray();

        $this->line("-> Total musrif tarbiyah terdata: " . count($musyrifIds) . " orang.");

        if (empty($musyrifIds)) {
            $this->warn("-> [INFO] Belum ada data plotting santri asuh ke musrif tarbiyah di tahun ajaran ini (/pengasuhan/musyrif-tarbiyah).");
            return 0;
        }

        $sentCount = 0;

        foreach ($musyrifIds as $musrifId) {
            $user = User::find($musrifId);
            if (!$user) {
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

            if (empty($pendingStudents)) {
                $this->line("   • [Musrif] {$user->name}: Seluruh santri asuh ({$plottings->count()} santri) sudah dibimbing dalam sepekan terakhir.");
                continue;
            }

            $totalPending = count($pendingStudents);
            $namesPreview = implode(', ', array_slice($pendingStudents, 0, 2));
            if ($totalPending > 2) {
                $namesPreview .= ' dan ' . ($totalPending - 2) . ' santri lainnya';
            }

            $subsCount = PushSubscription::where('user_id', $musrifId)->count();
            $this->line("   • [Musrif] {$user->name}: Ada {$totalPending} santri asuh belum dimutabaah sepekan terakhir ({$namesPreview})");

            if ($subsCount === 0) {
                $this->warn("     -> Dilewati: Musrif {$user->name} BELUM mengaktifkan notifikasi di HP (0 perangkat terdaftar).");
                continue;
            }

            // Throttle: 1x reminder tarbiyah per hari
            $cacheKey = "tarbiyah_reminder_sent_{$musrifId}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                $this->line("     -> Dilewati: Sudah dikirim hari ini (Throttle). Gunakan --force untuk mengabaikan.");
                continue;
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
                $this->info("     ✅ Terkirim ke {$user->name} ({$result['success']} perangkat HP)");
            }
        }

        return $sentCount;
    }

    /**
     * Simulasi pengiriman notifikasi pengingat nilai ke user tertentu.
     */
    protected function simulateAcademicReminder(int $userId, ?int $daysLeft, ?string $deadlineFormatted): int
    {
        $user = User::find($userId);
        if (!$user) {
            $this->error("User ID #{$userId} tidak ditemukan.");
            return 0;
        }

        $subsCount = PushSubscription::where('user_id', $userId)->count();
        $this->line("-> Simulasi Pengingat Nilai ditargetkan ke: {$user->name} (User ID #{$userId})");
        $this->line("-> Perangkat HP terdaftar untuk akun ini: {$subsCount} perangkat");

        if ($subsCount === 0) {
            $this->warn("❌ Akun {$user->name} BELUM memiliki perangkat HP yang terdaftar di tabel push_subscriptions.");
            $this->warn("   Silakan buka SIKAP di HP dan izinkan notifikasi terlebih dahulu.");
            return 0;
        }

        $sisaText = $daysLeft !== null ? "tersisa {$daysLeft} hari ({$deadlineFormatted})" : "segera berakhir";
        $title = "📋 [TES SIMULASI] Batas Input Nilai Santri";
        $body = "Ustadz {$user->name}, batas akhir input nilai rapor {$sisaText}. Ini adalah simulasi notifikasi ke HP antum.";
        $url = route('assessments.index', [], false);

        $result = $this->pushService->sendToUser($userId, $title, $body, $url, ['tag' => 'simulasi-nilai-' . time()]);
        if ($result['success'] > 0) {
            $this->info("✅ Simulasi berhasil terkirim ke {$result['success']} perangkat HP {$user->name}!");
            return $result['success'];
        }

        $this->warn("❌ Gagal mengirim notifikasi ke perangkat HP.");
        return 0;
    }

    /**
     * Simulasi pengiriman pengingat tarbiyah ke user tertentu.
     */
    protected function simulateTarbiyahReminder(int $userId): int
    {
        $user = User::find($userId);
        if (!$user) {
            $this->error("User ID #{$userId} tidak ditemukan.");
            return 0;
        }

        $subsCount = PushSubscription::where('user_id', $userId)->count();
        $this->line("-> Simulasi Pengingat Tarbiyah ditargetkan ke: {$user->name} (User ID #{$userId})");
        $this->line("-> Perangkat HP terdaftar untuk akun ini: {$subsCount} perangkat");

        if ($subsCount === 0) {
            $this->warn("❌ Akun {$user->name} BELUM memiliki perangkat HP yang terdaftar di tabel push_subscriptions.");
            return 0;
        }

        $title = "🤝 [TES SIMULASI] Pengingat Musrif Tarbiyah";
        $body = "Ustadz {$user->name}, antum memiliki santri asuh yang belum dicatat mutaba'ahnya. Ini adalah simulasi pengingat bimbingan santri ke HP antum.";
        $url = route('musyrif-tarbiyah.index', [], false);

        $result = $this->pushService->sendToUser($userId, $title, $body, $url, ['tag' => 'simulasi-tarbiyah-' . time()]);
        if ($result['success'] > 0) {
            $this->info("✅ Simulasi berhasil terkirim ke {$result['success']} perangkat HP {$user->name}!");
            return $result['success'];
        }

        $this->warn("❌ Gagal mengirim notifikasi ke perangkat HP.");
        return 0;
    }

    /**
     * Simulasi pengiriman pengingat KBM ke user tertentu.
     */
    protected function simulateKbmReminder(int $userId): int
    {
        $user = User::find($userId);
        if (!$user) {
            $this->error("User ID #{$userId} tidak ditemukan.");
            return 0;
        }

        $subsCount = PushSubscription::where('user_id', $userId)->count();
        $this->line("-> Simulasi Pengingat KBM ditargetkan ke: {$user->name} (User ID #{$userId})");
        $this->line("-> Perangkat HP terdaftar untuk akun ini: {$subsCount} perangkat");

        if ($subsCount === 0) {
            $this->warn("❌ Akun {$user->name} BELUM memiliki perangkat HP yang terdaftar di tabel push_subscriptions.");
            return 0;
        }

        $title = "⏰ [TES SIMULASI] Pengingat Jurnal & Absensi KBM";
        $body = "Ustadz {$user->name}, jam mengajar sudah berjalan 10 menit. Ini adalah simulasi pengingat jurnal KBM ke HP antum.";
        $url = route('journals.create', [], false);

        $result = $this->pushService->sendToUser($userId, $title, $body, $url, ['tag' => 'simulasi-kbm-' . time()]);
        if ($result['success'] > 0) {
            $this->info("✅ Simulasi berhasil terkirim ke {$result['success']} perangkat HP {$user->name}!");
            return $result['success'];
        }

        $this->warn("❌ Gagal mengirim notifikasi ke perangkat HP.");
        return 0;
    }
}
