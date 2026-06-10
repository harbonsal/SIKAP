<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\ActiveClass;
use App\Models\CharacterAssessment;
use App\Models\CharacterReport;
use App\Models\ClassMember;

class ImportNilaiAkhlak extends Command
{
    protected $signature = 'import:nilai-akhlak {file : Path to the CSV file}';
    protected $description = 'Import character grades from CSV file';

    public function handle()
    {
        $filePath = $this->argument('file');
        if (!file_exists($filePath)) {
            $this->error("File not found: $filePath");
            return 1;
        }

        $this->info("Starting import from: $filePath");
        $handle = fopen($filePath, 'r');
        $headers = fgetcsv($handle);

        $rowNumber = 1;
        $successCount = 0;
        $failCount = 0;

        DB::beginTransaction();

        try {
            while (($data = fgetcsv($handle)) !== false) {
                $rowNumber++;

                $nis = trim($data[0]);
                $tahunAjaranInfo = trim($data[1]);
                $bulanNama = trim($data[2]);

                if (empty($nis)) continue;
                $this->line("Processing Row $rowNumber: NIS $nis Month $bulanNama");

                // 1. Resolve Student
                $user = User::where('nomor_induk', $nis)->first();
                if (!$user) {
                    $this->warn("Row $rowNumber: User NIS $nis not found.");
                    $failCount++;
                    continue;
                }
                $studentId = $user->id;

                // 2. Resolve Academic Year
                $academicYear = AcademicYear::where('name', $tahunAjaranInfo)->first();
                if (!$academicYear) {
                    $this->warn("Row $rowNumber: AY '$tahunAjaranInfo' not found.");
                    $failCount++;
                    continue;
                }

                // 3. Resolve Active Class
                $studentModel = $user->student;
                if (!$studentModel) $studentModel = Student::where('user_id', $user->id)->first();
                if (!$studentModel) {
                    $this->warn("Row $rowNumber: Student profile not found.");
                    $failCount++;
                    continue;
                }

                $classMember = ClassMember::where('student_id', $studentModel->id)
                    ->whereHas('activeClass', function ($q) use ($academicYear) {
                        $q->where('academic_year_id', $academicYear->id);
                    })->first();

                if (!$classMember) {
                    $this->warn("Row $rowNumber: No class assigned.");
                    $failCount++;
                    continue;
                }
                $activeClassId = $classMember->active_class_id;

                // 4. Month/Year
                $monthMap = [
                    'Januari' => 1,
                    'Februari' => 2,
                    'Maret' => 3,
                    'April' => 4,
                    'Mei' => 5,
                    'Juni' => 6,
                    'Juli' => 7,
                    'Agustus' => 8,
                    'September' => 9,
                    'Oktober' => 10,
                    'November' => 11,
                    'Desember' => 12
                ];
                $month = $monthMap[$bulanNama] ?? null;
                if (!$month) {
                    $this->warn("Row $rowNumber: Invalid month '$bulanNama'.");
                    $failCount++;
                    continue;
                }

                $years = explode('/', $tahunAjaranInfo);
                if ($month >= 7) {
                    $year = (int)$years[0];
                } else {
                    $year = (int)($years[1] ?? $years[0] + 1);
                }

                // 5. Delete existing
                CharacterAssessment::where('student_id', $studentId)
                    ->where('active_class_id', $activeClassId)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->delete();

                CharacterReport::where('student_id', $studentModel->id)
                    ->where('active_class_id', $activeClassId)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->delete();

                // 6. Insert Assessments
                $categories = [
                    'Ibadah' => $data[3],
                    'Patuh' => $data[4],
                    'Disiplin' => $data[5],
                    'Bersih' => $data[6],
                    'Sopan' => $data[7],
                    'Rajin' => $data[8],
                ];

                foreach ($categories as $catName => $score) {
                    CharacterAssessment::create([
                        'student_id' => $studentId,
                        'active_class_id' => $activeClassId,
                        'category' => $catName,
                        'month' => $month,
                        'year' => $year,
                        'score' => (int)$score,
                        'note' => null
                    ]);
                }

                // 7. Insert Report
                $comment = $data[9] ?? null;
                if ($comment) {
                    CharacterReport::create([
                        'student_id' => $studentModel->id,
                        'active_class_id' => $activeClassId,
                        'month' => $month,
                        'year' => $year,
                        'notes' => $comment
                    ]);
                }

                $successCount++;
            }

            DB::commit();
            $this->info("Import Completed. Success: $successCount, Failed: $failCount");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Global Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
