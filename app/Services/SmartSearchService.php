<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\ActiveClass;
use App\Models\TahfidzMemorization;
use App\Models\KamarMember;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SmartSearchService
{
    protected $litellmService;

    // Peta halaman yang bisa disarankan AI
    protected array $pageMap = [
        'students.index'          => ['url' => '/students',              'label' => 'Biodata Santri'],
        'students.import'         => ['url' => '/students/import',       'label' => 'Import / Update Biodata Massal'],
        'analysis.index'          => ['url' => '/analysis',              'label' => 'Analisis Akademik'],
        'recap.class.index'       => ['url' => '/recap/class',           'label' => 'Rekap Nilai Kelas'],
        'assessments.index'       => ['url' => '/assessments',           'label' => 'Input Nilai'],
        'tahfidz.index'           => ['url' => '/tahfidz',               'label' => 'Tahfidz Al-Quran'],
        'kamar.index'             => ['url' => '/active-kamars',         'label' => 'Data Asrama / Kamar'],
        'active-classes.index'    => ['url' => '/active-classes',        'label' => 'Kelas Aktif'],
        'daftar-pengajar.index'   => ['url' => '/daftar-pengajar',       'label' => 'Daftar Pengajar'],
        'dashboard'               => ['url' => '/dashboard',             'label' => 'Dashboard'],
        'users.index'             => ['url' => '/users',                 'label' => 'Manajemen User'],
        'character.index'         => ['url' => '/character-assessments', 'label' => 'Penilaian Akhlak'],
        'health.index'            => ['url' => '/care/health',           'label' => 'Kesehatan Santri'],
        'permissions.index'       => ['url' => '/care/permissions',      'label' => 'Perizinan Santri'],
        'schedules.index'         => ['url' => '/academic/schedules',    'label' => 'Jadwal Pelajaran'],
        'reports.index'           => ['url' => '/academic/reports',      'label' => 'Cetak Rapor'],
    ];

    public function __construct(LiteLLMService $litellmService)
    {
        $this->litellmService = $litellmService;
    }

    public function search(string $query, $user): array
    {
        $query = trim($query);
        if (mb_strlen($query) < 2) {
            return ['type' => 'empty', 'results' => [], 'answer' => 'Ketik sesuatu untuk dicari.'];
        }

        // Resolve context
        $academicYear = \App\Models\AcademicYear::where('is_active', true)->first();
        $semester     = \App\Models\Semester::where('is_active', true)->first();

        // Build data snapshot for AI
        $snapshot = $this->buildSnapshot($academicYear, $semester);

        // Ask AI: what does user want?
        $intent = $this->resolveIntent($query, $snapshot);

        if (!$intent) {
            return $this->fallbackLinks($query);
        }

        // Execute data fetch based on intent
        $data = $this->fetchData($intent, $academicYear, $semester);

        // Ask AI to compose a natural answer
        $answer = $this->composeAnswer($query, $intent, $data, $snapshot);

        return [
            'type'    => $data ? 'data' : 'links',
            'answer'  => $answer['text'] ?? '',
            'results' => $data ?? [],
            'columns' => $answer['columns'] ?? [],
            'links'   => $answer['links'] ?? [],
        ];
    }

    // ─── Step 1: Resolve intent via AI ──────────────────────────────

    protected function resolveIntent(string $query, string $snapshot): ?array
    {
        $pageList = collect($this->pageMap)
            ->map(fn($v, $k) => "- {$v['label']} → {$v['url']}")
            ->implode("\n");

        $system = <<<PROMPT
Anda adalah asisten pencarian untuk sistem pesantren SIKAP.
Tugas: analisis query user dan tentukan data apa yang harus diambil dari database.

KONTEKS SISTEM:
{$snapshot}

HALAMAN YANG TERSEDIA:
{$pageList}

TIPE DATA YANG BISA DIAMBIL:
- search_student: cari santri by nama/NIS
- student_grades_top: santri nilai tertinggi
- student_grades_bottom: santri nilai terendah  
- student_hafalan_top: santri hafalan terbanyak
- student_hafalan_bottom: santri hafalan paling sedikit
- count_students: hitung jumlah santri
- homeroom_teacher: wali kelas
- list_teachers: daftar guru/pegawai
- student_list_by_class: daftar santri per kelas
- student_list_by_kamar: daftar santri per kamar

Jika query tidak bisa dijawab dengan data di atas, gunakan type "suggest_links".

Output HANYA JSON (tanpa markdown):
{
  "type": "search_student",
  "params": { "name": "Ahmad", "class": null, "kamar": null, "limit": 15 },
  "reason": "user mencari santri bernama Ahmad"
}

Atau jika tidak ada data yang cocok:
{
  "type": "suggest_links",
  "params": {},
  "reason": "user bertanya tentang jadwal",
  "suggested_urls": ["/academic/schedules", "/dashboard"]
}
PROMPT;

        try {
            $model    = $this->pickModel();
            $response = $this->litellmService->chatCompletionWithFallback([
                ['role' => 'system', 'content' => $system],
                ['role' => 'user',   'content' => $query],
            ], $model, 0.1);

            $raw = trim($response['choices'][0]['message']['content'] ?? '');
            $raw = preg_replace('/^```json|^```|```$/m', '', $raw);
            $parsed = json_decode(trim($raw), true);

            return (is_array($parsed) && isset($parsed['type'])) ? $parsed : null;
        } catch (\Exception $e) {
            Log::warning('SmartSearch intent error: ' . $e->getMessage());
            return null;
        }
    }

    // ─── Step 2: Fetch data from DB ─────────────────────────────────

    protected function fetchData(?array $intent, $academicYear, $semester): ?array
    {
        if (!$intent || $intent['type'] === 'suggest_links') return null;

        $params = $intent['params'] ?? [];
        $limit  = min((int)($params['limit'] ?? 15), 50);

        return match ($intent['type']) {
            'search_student'         => $this->dbSearchStudent($params['name'] ?? '', $limit),
            'student_grades_top'     => $this->dbGrades('desc', $params, $semester, $limit),
            'student_grades_bottom'  => $this->dbGrades('asc',  $params, $semester, $limit),
            'student_hafalan_top'    => $this->dbHafalan('desc', $limit),
            'student_hafalan_bottom' => $this->dbHafalan('asc',  $limit),
            'count_students'         => $this->dbCountStudents($params, $academicYear),
            'homeroom_teacher'       => $this->dbHomeroomTeacher($params, $academicYear),
            'list_teachers'          => $this->dbListTeachers($limit),
            'student_list_by_class'  => $this->dbStudentsByClass($params['class'] ?? '', $academicYear, $limit),
            'student_list_by_kamar'  => $this->dbStudentsByKamar($params['kamar'] ?? '', $academicYear, $limit),
            default                  => null,
        };
    }

    // ─── Step 3: Compose natural answer via AI ──────────────────────

    protected function composeAnswer(string $query, array $intent, ?array $data, string $snapshot): array
    {
        $pageList = collect($this->pageMap)
            ->map(fn($v, $k) => "- {$v['label']} → {$v['url']}")
            ->implode("\n");

        $dataJson = $data ? json_encode(array_slice($data['rows'] ?? [], 0, 5), JSON_UNESCAPED_UNICODE) : 'null';
        $totalRows = $data ? count($data['rows'] ?? []) : 0;

        $system = <<<PROMPT
Anda adalah asisten SIKAP yang menjawab pertanyaan tentang data pesantren.
Jawab dalam Bahasa Indonesia, singkat dan informatif.

KONTEKS: {$snapshot}
HALAMAN TERSEDIA:
{$pageList}

DATA YANG DITEMUKAN ({$totalRows} baris, contoh 5 pertama):
{$dataJson}

INSTRUKSI:
- Jika ada data: buat ringkasan singkat (1-2 kalimat), sebutkan jumlah total.
- Jika tidak ada data atau suggest_links: arahkan user ke halaman yang relevan.
- Sertakan link yang relevan jika membantu.
- Jangan ulangi semua data, cukup ringkasan.

Output JSON:
{
  "text": "Ditemukan 12 santri dengan nama Ahmad. ...",
  "columns": ["name","nis","kelas"],
  "links": [
    {"label": "Lihat semua di Biodata Santri", "url": "/students"}
  ]
}
PROMPT;

        try {
            $model    = $this->pickModel();
            $response = $this->litellmService->chatCompletionWithFallback([
                ['role' => 'system', 'content' => $system],
                ['role' => 'user',   'content' => "Query: {$query}\nIntent: {$intent['type']}\nReason: {$intent['reason']}"],
            ], $model, 0.3);

            $raw = trim($response['choices'][0]['message']['content'] ?? '');
            $raw = preg_replace('/^```json|^```|```$/m', '', $raw);
            $parsed = json_decode(trim($raw), true);

            if (is_array($parsed)) {
                return $parsed;
            }
        } catch (\Exception $e) {
            Log::warning('SmartSearch compose error: ' . $e->getMessage());
        }

        // Fallback answer
        if ($data && !empty($data['rows'])) {
            return [
                'text'    => "Ditemukan {$totalRows} hasil untuk pencarian Anda.",
                'columns' => array_keys($data['rows'][0] ?? []),
                'links'   => [],
            ];
        }

        return [
            'text'    => 'Tidak ditemukan data yang sesuai. Coba cari di halaman berikut:',
            'columns' => [],
            'links'   => array_values(array_map(fn($v) => ['label' => $v['label'], 'url' => $v['url']], $this->pageMap)),
        ];
    }

    protected function fallbackLinks(string $query): array
    {
        $links = array_values(array_map(fn($v) => ['label' => $v['label'], 'url' => $v['url']], $this->pageMap));
        return [
            'type'    => 'links',
            'answer'  => 'Tidak dapat memproses pencarian. Coba akses halaman berikut:',
            'results' => [],
            'columns' => [],
            'links'   => $links,
        ];
    }

    // ─── DB Queries ─────────────────────────────────────────────────

    protected function dbSearchStudent(string $name, int $limit): array
    {
        if (mb_strlen(trim($name)) < 2) return ['rows' => []];

        $rows = Student::with(['user', 'latestClassMember.activeClass', 'kamarMembers.activeKamar'])
            ->whereHas('user', fn($q) => $q
                ->where('status', 'Aktif')
                ->where(fn($q2) => $q2
                    ->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($name) . '%'])
                    ->orWhereRaw('LOWER(nomor_induk) LIKE ?', ['%' . mb_strtolower($name) . '%'])
                )
            )
            ->limit($limit)->get()
            ->map(fn($s) => [
                'Nama'   => $s->user->name ?? '-',
                'NIS'    => $s->user->nomor_induk ?? '-',
                'Kelas'  => $s->latestClassMember?->activeClass?->name ?? '-',
                'Kamar'  => $s->kamarMembers->last()?->activeKamar?->name ?? '-',
                'Gender' => $s->gender === 'L' ? 'L' : 'P',
            ])->toArray();

        return ['rows' => $rows];
    }

    protected function dbGrades(string $dir, array $params, $semester, int $limit): array
    {
        $q = StudentGrade::with(['student.user', 'student.latestClassMember.activeClass'])
            ->whereHas('student.user', fn($q) => $q->where('status', 'Aktif'))
            ->selectRaw('student_id, ROUND(AVG(score),1) as avg_score')
            ->groupBy('student_id')
            ->orderBy('avg_score', $dir);

        if ($semester) $q->where('semester_id', $semester->id);
        if (!empty($params['class'])) {
            $q->whereHas('student.latestClassMember.activeClass', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($params['class']) . '%'])
            );
        }

        $rows = $q->limit($limit)->get()->map(function ($r) {
            $s = Student::with(['user', 'latestClassMember.activeClass'])->find($r->student_id);
            return [
                'Nama'       => $s?->user?->name ?? '-',
                'NIS'        => $s?->user?->nomor_induk ?? '-',
                'Kelas'      => $s?->latestClassMember?->activeClass?->name ?? '-',
                'Rata-rata'  => $r->avg_score,
            ];
        })->toArray();

        return ['rows' => $rows];
    }

    protected function dbHafalan(string $dir, int $limit): array
    {
        $rows = TahfidzMemorization::selectRaw('student_id, COUNT(CASE WHEN is_completed=1 THEN 1 END) as juz_selesai')
            ->groupBy('student_id')
            ->orderBy('juz_selesai', $dir)
            ->limit($limit)->get()
            ->map(function ($r) {
                $s = Student::with(['user', 'latestClassMember.activeClass'])->find($r->student_id);
                return [
                    'Nama'        => $s?->user?->name ?? '-',
                    'NIS'         => $s?->user?->nomor_induk ?? '-',
                    'Kelas'       => $s?->latestClassMember?->activeClass?->name ?? '-',
                    'Juz Selesai' => (int)$r->juz_selesai,
                ];
            })->toArray();

        return ['rows' => $rows];
    }

    protected function dbCountStudents(array $params, $academicYear): array
    {
        $q = Student::whereHas('user', fn($q) => $q->where('status', 'Aktif'));
        if (!empty($params['class'])) {
            $q->whereHas('latestClassMember.activeClass', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($params['class']) . '%'])
            );
        }
        if (!empty($params['kamar'])) {
            $q->whereHas('kamarMembers.activeKamar', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($params['kamar']) . '%'])
            );
        }
        $count = $q->count();
        return ['rows' => [['Keterangan' => 'Total Santri Aktif', 'Jumlah' => $count]]];
    }

    protected function dbHomeroomTeacher(array $params, $academicYear): array
    {
        $q = ActiveClass::with(['teacher', 'kelas', 'kelasParalel'])
            ->when($academicYear, fn($q) => $q->where('academic_year_id', $academicYear->id));

        if (!empty($params['class'])) {
            $q->whereHas('kelas', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($params['class']) . '%'])
            );
        }

        $rows = $q->limit(30)->get()->map(fn($c) => [
            'Kelas'          => ($c->kelas->name ?? '') . ' ' . ($c->kelasParalel->name ?? ''),
            'Wali Kelas'     => $c->teacher?->name ?? '-',
            'Jumlah Santri'  => $c->classMembers()->count(),
        ])->toArray();

        return ['rows' => $rows];
    }

    protected function dbListTeachers(int $limit): array
    {
        $rows = User::where('status', 'Aktif')
            ->whereHas('userLevel', fn($q) => $q->whereNotIn('name', ['Santri', 'Siswa']))
            ->with('userLevel')
            ->orderBy('name')
            ->limit($limit)->get()
            ->map(fn($t) => [
                'Nama'    => $t->name,
                'Jabatan' => $t->userLevel?->name ?? '-',
                'No. HP'  => $t->no_hp ?? '-',
            ])->toArray();

        return ['rows' => $rows];
    }

    protected function dbStudentsByClass(string $className, $academicYear, int $limit): array
    {
        $q = Student::with(['user', 'latestClassMember.activeClass'])
            ->whereHas('user', fn($q) => $q->where('status', 'Aktif'));

        if ($className) {
            $q->whereHas('latestClassMember.activeClass.kelas', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($className) . '%'])
            );
        }

        $rows = $q->limit($limit)->get()->map(fn($s) => [
            'Nama'  => $s->user->name ?? '-',
            'NIS'   => $s->user->nomor_induk ?? '-',
            'Kelas' => $s->latestClassMember?->activeClass?->name ?? '-',
        ])->toArray();

        return ['rows' => $rows];
    }

    protected function dbStudentsByKamar(string $kamarName, $academicYear, int $limit): array
    {
        $q = Student::with(['user', 'latestClassMember.activeClass', 'kamarMembers.activeKamar'])
            ->whereHas('user', fn($q) => $q->where('status', 'Aktif'));

        if ($kamarName) {
            $q->whereHas('kamarMembers.activeKamar', fn($q2) =>
                $q2->whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($kamarName) . '%'])
            );
        }

        $rows = $q->limit($limit)->get()->map(fn($s) => [
            'Nama'  => $s->user->name ?? '-',
            'NIS'   => $s->user->nomor_induk ?? '-',
            'Kelas' => $s->latestClassMember?->activeClass?->name ?? '-',
            'Kamar' => $s->kamarMembers->last()?->activeKamar?->name ?? '-',
        ])->toArray();

        return ['rows' => $rows];
    }

    // ─── Helpers ────────────────────────────────────────────────────

    protected function buildSnapshot($academicYear, $semester): string
    {
        $studentCount = Student::whereHas('user', fn($q) => $q->where('status', 'Aktif'))->count();
        $classCount   = ActiveClass::when($academicYear, fn($q) => $q->where('academic_year_id', $academicYear->id))->count();
        $teacherCount = User::where('status', 'Aktif')
            ->whereHas('userLevel', fn($q) => $q->whereNotIn('name', ['Santri', 'Siswa']))->count();

        $classes = ActiveClass::with(['kelas', 'kelasParalel'])
            ->when($academicYear, fn($q) => $q->where('academic_year_id', $academicYear->id))
            ->limit(20)->get()
            ->map(fn($c) => ($c->kelas->name ?? '') . ' ' . ($c->kelasParalel->name ?? ''))
            ->implode(', ');

        $kamars = \App\Models\Kamar::pluck('name')->implode(', ');

        return "Tahun Ajaran: {$academicYear?->name}, Semester: {$semester?->name}. " .
               "Santri aktif: {$studentCount}. Kelas: {$classCount}. Pengajar: {$teacherCount}. " .
               "Daftar kelas: {$classes}. Kamar: {$kamars}.";
    }

    protected function pickModel(): string
    {
        $allowedModels = \App\Models\Setting::where('key', 'ikhtabir_allowed_models')->value('value');
        if ($allowedModels) {
            $models = json_decode($allowedModels, true);
            $enabled = array_keys(array_filter($models, function ($v, $k) {
                if ($v !== true) return false;
                $k = strtolower($k);
                return !str_contains($k, '-tts') && !str_contains($k, '-stt') && !str_contains($k, 'whisper');
            }, ARRAY_FILTER_USE_BOTH));
            if (!empty($enabled)) return $enabled[0];
        }
        return 'gpt-4o-mini';
    }
}
