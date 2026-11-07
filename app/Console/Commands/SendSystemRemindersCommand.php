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

        // Cek status toggle switch Reminder Sistem (ON / OFF) dari Dashboard Admin
        $schoolInfo = SchoolInfo::first();
        $isReminderActive = $schoolInfo?->schedule_config['reminder_active'] ?? true;
        if (!$isReminderActive && !$this->option('force') && !$toUserId) {
            $this->warn('⚠️ Fitur Pengingat Sistem (Reminder) saat ini dalam status NONAKTIF (OFF) di Dashboard.');
            $this->line('Aktifkan tombol toggle "REMINDER" di Dashboard Admin untuk menjalankan pengingat otomatis.');
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

            if (!empty($result['success'])) {
                $sent++;
                $this->info("✅ Terkirim ke: " . ($user?->name ?? 'User #' . $sub->user_id) . " ({$sub->device_name})");
            } else {
                $reason = $result['reason'] ?? 'Gagal menghubungi server push provider';
                $this->warn("❌ Gagal mengirim ke: " . ($user?->name ?? 'User #' . $sub->user_id) . " ({$sub->device_name}) -> Alasan: {$reason}");
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
        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();
        $dayNameId = $now->translatedFormat('l');
        $dayNameEn = $now->format('l');
        $dayName = $dayNameId;

        $day = Day::where('name', $dayNameId)
            ->orWhereRaw('LOWER(name) = ?', [strtolower($dayNameId)])
            ->orWhere('name', $dayNameEn)
            ->orWhereRaw('LOWER(name) = ?', [strtolower($dayNameEn)])
            ->first();

        if (!$day) {
            $this->line("Hari {$dayNameId} tidak terdaftar di data master hari.");
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

        $this->line("-> Hari ini: {$dayNameId}, {$todayDate}");
        $this->line("-> Total jadwal KBM terdaftar hari ini: " . $schedules->count() . " sesi");

        if ($schedules->isEmpty()) {
            $this->line("-> Tidak ada jadwal KBM aktif untuk hari {$dayNameId}.");
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
                $lessonStart = Carbon::parse($todayDate . ' ' . $learningHour->start_time, 'Asia/Jakarta');
                $lessonEnd = Carbon::parse($todayDate . ' ' . $learningHour->end_time, 'Asia/Jakarta');
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

            // 1. Cek apakah ada jurnal yang mencakup jam ke-X ini secara eksplisit
            $hasJournal = ClassJournal::where('teacher_id', $schedule->teacher_id)
                ->where('active_subject_id', $schedule->active_subject_id)
                ->where('date', $todayDate)
                ->where(function ($q) use ($hourNum) {
                    $q->where('jam_ke', $hourNum)
                      ->orWhere('jam_ke', 'like', "%{$hourNum}%")
                      ->orWhereNull('jam_ke');
                })
                ->exists();

            // 2. Jika ustadz mengajar 2 jam atau lebih untuk mapel & kelas yang sama hari ini (jam bersambung),
            // dan ustadz sudah mengisi minimal 1 jurnal untuk mapel tersebut hari ini (misal di jam awal),
            // maka jam-jam sisanya otomatis dianggap sudah tercover dan TIDAK terkena reminder.
            if (!$hasJournal) {
                $hasAnyJournalToday = ClassJournal::where('teacher_id', $schedule->teacher_id)
                    ->where('active_subject_id', $schedule->active_subject_id)
                    ->where('date', $todayDate)
                    ->exists();

                if ($hasAnyJournalToday) {
                    $sameSubjectCount = $schedules->where('teacher_id', $schedule->teacher_id)
                        ->where('active_subject_id', $schedule->active_subject_id)
                        ->count();

                    if ($sameSubjectCount > 1) {
                        $hasJournal = true;
                    }
                }
            }

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
     * Mendukung evaluasi granular batas waktu per komponen: UH1, UTS, UH2, UAS, dan Rapor.
     */
    protected function remindAcademicGrades($academicYear, $semester, ?int $toUserId = null): int
    {
        $this->info("--- [2] PENGECEKAN BATAS AKHIR INPUT NILAI AKADEMIK (UH1, UTS, UH2, UAS) ---");

        Carbon::setLocale('id');
        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $todayDate = $today->toDateString();
        $isForce = (bool)$this->option('force');

        $schoolInfo = SchoolInfo::first();
        $gradeConfig = $schoolInfo?->grade_config ?? [];

        // 1. Ambil deadline masing-masing komponen penilaian
        $deadlines = [
            'uh1' => Setting::where('key', 'academic_deadline_uh1')->value('value') ?: ($gradeConfig['deadline_uh1'] ?? null),
            'uts' => Setting::where('key', 'academic_deadline_uts')->value('value') ?: ($gradeConfig['deadline_uts'] ?? null),
            'uh2' => Setting::where('key', 'academic_deadline_uh2')->value('value') ?: ($gradeConfig['deadline_uh2'] ?? null),
            'uas' => Setting::where('key', 'academic_deadline_uas')->value('value') ?: ($gradeConfig['deadline_uas'] ?? null),
            'rapor' => Setting::where('key', 'academic_grade_deadline')->value('value') ?: ($gradeConfig['grade_deadline'] ?? null),
        ];

        // Cari juga di kalender akademik jika belum disetel manual di setting
        if (!$deadlines['rapor']) {
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
                $deadlines['rapor'] = $calendarEvent->end_date;
            }
        }

        // Tampilkan status batas waktu setiap komponen di terminal
        $activeDeadlines = [];
        foreach ($deadlines as $comp => $dStr) {
            if (!$dStr) continue;
            try {
                $dDate = Carbon::parse($dStr)->startOfDay();
                $diff = (int)$today->diffInDays($dDate, false);
                $activeDeadlines[$comp] = [
                    'key' => $comp,
                    'label' => strtoupper($comp),
                    'date' => $dStr,
                    'formatted' => $dDate->translatedFormat('d F Y'),
                    'days_left' => $diff,
                    'is_overdue' => $diff < 0,
                    'is_today' => $diff === 0,
                    'is_urgent' => $diff <= 3, // Terlewat atau tersisa <= 3 hari
                ];
                $statusTxt = $diff < 0 ? "LEWAT (" . abs($diff) . " hari lalu)" : ($diff === 0 ? "HARI TERAKHIR (Hari H)" : "Tersisa {$diff} hari");
                $this->line("   • Batas Nilai {$activeDeadlines[$comp]['label']}: {$dStr} ({$activeDeadlines[$comp]['formatted']}) -> {$statusTxt}");
            } catch (\Throwable $e) {}
        }

        if (empty($activeDeadlines)) {
            $this->warn("-> [INFO] Belum ada batas waktu penilaian (UH1, UTS, UH2, UAS, atau Rapor) yang ditentukan di Pengaturan Lembaga (/settings/school-info).");
        }

        // Jika mode simulasi langsung ke user tertentu
        if ($toUserId) {
            $firstDeadline = reset($activeDeadlines);
            return $this->simulateAcademicReminder(
                $toUserId, 
                $firstDeadline ? $firstDeadline['days_left'] : null, 
                $firstDeadline ? $firstDeadline['formatted'] : null
            );
        }

        // Ambil semua guru yang memiliki mapel aktif di tahun ajaran berjalan
        $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($academicYear) {
            $q->where('academic_year_id', $academicYear->id);
        })
        ->whereNotNull('teacher_id')
        ->with(['teacher', 'mapel', 'activeClass.kelas', 'activeClass.kelasParalel'])
        ->get();

        $this->line("-> Total mata pelajaran aktif di semester ini: " . $activeSubjects->count());

        // Cache grade weights untuk tahun ajaran & semester aktif
        $gradeWeights = \App\Models\GradeWeight::where('academic_year_id', $academicYear->id)->get();

        $teachersWithPendingGrades = [];

        // Cek apakah ada komponen spesifik yang berstatus urgent / overdue
        $urgentComponents = array_filter($activeDeadlines, fn($item) => $item['is_urgent']);

        foreach ($activeSubjects as $subject) {
            if (!$subject->teacher) {
                continue;
            }

            $studentsCount = $subject->activeClass?->classMembers()?->count() ?? 0;
            if ($studentsCount === 0) {
                continue;
            }

            $className = trim(($subject->activeClass?->kelas?->name ?? '') . ' ' . ($subject->activeClass?->kelasParalel?->name ?? ''));
            $mapelName = $subject->mapel?->name ?? 'Mata Pelajaran';

            // Jika ada deadline per komponen yang aktif & urgent (sudah lewat / mendekati H-3)
            if (!empty($urgentComponents)) {
                foreach ($urgentComponents as $compKey => $compInfo) {
                    if ($compKey === 'rapor') continue;

                    // Cari GradeWeight yang sesuai dengan komponen ini
                    $matchedWeight = $gradeWeights->first(function ($gw) use ($compKey) {
                        $name = strtolower($gw->name);
                        switch ($compKey) {
                            case 'uh1':
                                return str_contains($name, 'uh1') || str_contains($name, 'uh 1') || str_contains($name, 'harian 1');
                            case 'uts':
                                return str_contains($name, 'uts') || str_contains($name, 'pts') || str_contains($name, 'tengah');
                            case 'uh2':
                                return str_contains($name, 'uh2') || str_contains($name, 'uh 2') || str_contains($name, 'harian 2');
                            case 'uas':
                                return str_contains($name, 'uas') || str_contains($name, 'pas') || str_contains($name, 'pat') || str_contains($name, 'ukk') || str_contains($name, 'akhir');
                            default:
                                return false;
                        }
                    });

                    // Jika bobot penilaian ditemukan
                    if ($matchedWeight) {
                        $gradedCount = StudentGrade::where('active_subject_id', $subject->id)
                            ->where('grade_weight_id', $matchedWeight->id)
                            ->whereNotNull('score')
                            ->count();

                        if ($gradedCount < $studentsCount) {
                            $missing = $studentsCount - $gradedCount;
                            $teacherId = $subject->teacher_id;
                            if (!isset($teachersWithPendingGrades[$teacherId])) {
                                $teachersWithPendingGrades[$teacherId] = [
                                    'teacher' => $subject->teacher,
                                    'pending_components' => [],
                                    'pending_subjects' => [],
                                    'missing_total' => 0,
                                    'worst_days_left' => 999,
                                ];
                            }
                            $teachersWithPendingGrades[$teacherId]['pending_components'][$compInfo['label']] = true;
                            $teachersWithPendingGrades[$teacherId]['pending_subjects'][] = "{$compInfo['label']} {$mapelName} ({$className}) [{$missing} santri]";
                            $teachersWithPendingGrades[$teacherId]['missing_total'] += $missing;
                            if ($compInfo['days_left'] < $teachersWithPendingGrades[$teacherId]['worst_days_left']) {
                                $teachersWithPendingGrades[$teacherId]['worst_days_left'] = $compInfo['days_left'];
                            }
                        }
                    }
                }
            } else {
                // Fallback: Jika belum ada deadline per komponen yang urgent, evaluasi kelengkapan nilai secara umum
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
                            'pending_components' => [],
                            'pending_subjects' => [],
                            'missing_total' => 0,
                            'worst_days_left' => $activeDeadlines['rapor']['days_left'] ?? null,
                        ];
                    }
                    $teachersWithPendingGrades[$teacherId]['pending_subjects'][] = "{$mapelName} ({$className})";
                    $teachersWithPendingGrades[$teacherId]['missing_total'] += ($studentsCount - $gradedCount);
                }
            }
        }

        $this->line("-> Guru terdeteksi memiliki nilai belum lengkap: " . count($teachersWithPendingGrades) . " orang.");

        if (empty($teachersWithPendingGrades)) {
            $this->info("-> Alhamdulillah, seluruh guru telah melengkapi nilai santri pada komponen yang dievaluasi!");
            return 0;
        }

        $sentCount = 0;

        foreach ($teachersWithPendingGrades as $teacherId => $data) {
            $teacherName = $data['teacher']->name;
            $subsCount = PushSubscription::where('user_id', $teacherId)->count();

            $subjectSummary = implode(', ', array_slice($data['pending_subjects'], 0, 2));
            if (count($data['pending_subjects']) > 2) {
                $subjectSummary .= ' dan ' . (count($data['pending_subjects']) - 2) . ' mapel lainnya';
            }

            $compNames = !empty($data['pending_components']) ? implode(', ', array_keys($data['pending_components'])) : 'Rapor';
            $this->line("   • [Guru] {$teacherName}: Belum tuntas {$compNames} -> {$subjectSummary}");

            if ($subsCount === 0) {
                $this->warn("     -> Dilewati: Ustadz {$teacherName} BELUM mengaktifkan notifikasi di HP (0 perangkat terdaftar).");
                continue;
            }

            // Throttle: Maksimal 1x notifikasi per hari per guru
            $cacheKey = "academic_grade_reminder_sent_{$teacherId}_{$todayDate}";
            if (!$isForce && Cache::has($cacheKey)) {
                $this->line("     -> Dilewati: Sudah dikirim hari ini (Throttle). Gunakan --force untuk mengabaikan.");
                continue;
            }

            $daysLeft = $data['worst_days_left'];

            if ($daysLeft !== null && $daysLeft < 0) {
                $absDays = abs($daysLeft);
                $title = "⚠️ Batas Nilai {$compNames} Terlewat";
                $body = "Ustadz {$teacherName}, batas waktu input nilai {$compNames} telah terlewat {$absDays} hari. Masih ada nilai santri pada {$subjectSummary} yang belum lengkap. Mohon segera diselesaikan.";
            } elseif ($daysLeft !== null && $daysLeft === 0) {
                $title = "🚨 HARI TERAKHIR: Batas Nilai {$compNames}";
                $body = "Ustadz {$teacherName}, HARI INI adalah batas akhir input nilai {$compNames}. Mohon segera lengkapi nilai santri pada {$subjectSummary}.";
            } elseif ($daysLeft !== null && $daysLeft > 0) {
                $title = "⏳ Batas Nilai {$compNames} Tersisa {$daysLeft} Hari";
                $body = "Ustadz {$teacherName}, batas akhir input nilai {$compNames} tersisa {$daysLeft} hari. Mohon segera lengkapi nilai santri pada {$subjectSummary}.";
            } else {
                $title = "📋 Pengingat Input Nilai: {$compNames}";
                $body = "Ustadz {$teacherName}, masih ada nilai santri pada {$subjectSummary} yang belum lengkap. Mohon segera diinput di portal SIKAP.";
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
     * Kirim reminder ke musrif tarbiyah berdasarkan 2 tagihan baku:
     * 1. Tagihan pertemuan kelompok: minimal 1 kali per bulan kalender.
     * 2. Tagihan pertemuan personal: minimal 2 kali per bulan per santri asuh.
     */
    protected function remindMusyrifTarbiyah($academicYear, ?int $toUserId = null): int
    {
        $this->info("--- [3] PENGECEKAN BIMBINGAN SANTRI ASUH MUSRIF TARBIYAH (KELOMPOK & PERSONAL) ---");

        // Jika mode simulasi langsung ke user tertentu
        if ($toUserId) {
            return $this->simulateTarbiyahReminder($toUserId);
        }

        Carbon::setLocale('id');
        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();
        $currentYear = $now->year;
        $currentMonth = $now->month;
        $monthName = $now->translatedFormat('F Y');
        $dayOfMonth = $now->day;
        $isForce = (bool)$this->option('force');

        // Ambil seluruh musrif yang memiliki santri asuh di tahun ajaran aktif
        $musyrifIds = MusyrifTarbiyahPlotting::where('academic_year_id', $academicYear->id)
            ->distinct('user_id')
            ->pluck('user_id')
            ->toArray();

        $this->line("-> Bulan Evaluasi: {$monthName} (Tanggal {$dayOfMonth})");
        $this->line("-> Standar Tagihan: Pertemuan Kelompok min. 1x/bulan | Pertemuan Personal min. 2x/bulan/santri");
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

            $totalSantriAsuh = $plottings->count();

            // 1. EVALUASI TAGIHAN PERTEMUAN KELOMPOK (Min. 1x per bulan)
            $groupCount = TarbiyahGroupLog::where('user_id', $musrifId)
                ->whereYear('date', $currentYear)
                ->whereMonth('date', $currentMonth)
                ->count();

            $isGroupPending = ($groupCount < 1);

            // 2. EVALUASI TAGIHAN PERTEMUAN PERSONAL (Min. 2x per bulan per santri asuh)
            $pendingPersonalStudents = [];

            foreach ($plottings as $plot) {
                $student = $plot->student;
                if (!$student) continue;

                $personalCount = TarbiyahIndividualLog::where('user_id', $musrifId)
                    ->where('student_id', $plot->student_id)
                    ->whereYear('date', $currentYear)
                    ->whereMonth('date', $currentMonth)
                    ->count();

                // Santri belum mencapai kuota 2x di bulan ini
                if ($personalCount < 2) {
                    $pendingPersonalStudents[] = [
                        'name' => $student->name,
                        'current' => $personalCount,
                    ];
                }
            }

            $totalPendingPersonal = count($pendingPersonalStudents);

            // Jika kedua tagihan sudah tuntas terpenuhi bulan ini
            if (!$isGroupPending && $totalPendingPersonal === 0) {
                $this->line("   • [Musrif] {$user->name}: Alhamdulillah, seluruh tagihan bulan {$monthName} tuntas (Kelompok {$groupCount}x, Personal {$totalSantriAsuh} santri memenuhi kuota).");
                continue;
            }

            // Susun detail kekurangan tagihan
            $tagihanDetails = [];
            if ($isGroupPending) {
                $tagihanDetails[] = "Pertemuan kelompok belum tercatat (0/1)";
            }
            if ($totalPendingPersonal > 0) {
                $previewSantri = implode(', ', array_slice(array_column($pendingPersonalStudents, 'name'), 0, 2));
                if ($totalPendingPersonal > 2) {
                    $previewSantri .= ' dan ' . ($totalPendingPersonal - 2) . ' santri lainnya';
                }
                $tagihanDetails[] = "{$totalPendingPersonal} santri asuh belum memenuhi target personal min. 2x ({$previewSantri})";
            }

            $subsCount = PushSubscription::where('user_id', $musrifId)->count();
            $tagihanSummary = implode(' & ', $tagihanDetails);
            $this->line("   • [Musrif] {$user->name}: Belum tuntas -> {$tagihanSummary}");

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

            // Susun pesan notifikasi yang santun, jelas, dan edukatif
            $title = "🤝 Pengingat Bimbingan Tarbiyah";
            
            if ($isGroupPending && $totalPendingPersonal > 0) {
                $body = "Ustadz {$user->name}, tagihan bimbingan bulan {$monthName}: Pertemuan kelompok belum terlaksana & masih ada {$totalPendingPersonal} santri asuh yang belum mencapai target personal minimal 2x. Mohon luangkan waktu membimbing adik asuh antum.";
            } elseif ($isGroupPending) {
                $body = "Ustadz {$user->name}, pertemuan kelompok bulanan santri asuh (target 1x/bulan) untuk bulan {$monthName} belum tercatat. Mohon segera jadwalkan halaqoh kelompok bersama santri asuh antum.";
            } else {
                $previewSantri = implode(', ', array_slice(array_column($pendingPersonalStudents, 'name'), 0, 2));
                if ($totalPendingPersonal > 2) {
                    $previewSantri .= ' dan ' . ($totalPendingPersonal - 2) . ' lainnya';
                }
                $body = "Ustadz {$user->name}, masih ada {$totalPendingPersonal} santri asuh ({$previewSantri}) yang belum memenuhi target bimbingan personal bulan {$monthName} (minimal 2x/bulan). Mohon segera luangkan waktu tatap muka.";
            }

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
        $body = "Ustadz {$user->name}, tagihan bimbingan bulan ini: Pertemuan kelompok (target 1x/bulan) & bimbingan personal santri asuh (min. 2x/bulan). Ini adalah simulasi pengingat ke HP antum.";
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
