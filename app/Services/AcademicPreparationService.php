<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\ActiveKamar;
use App\Models\ActiveSubject;
use App\Models\SemesterSubjectTeacher;
use App\Models\TeacherQuota;
use App\Models\TeacherUnavailableHour;
use Illuminate\Support\Facades\DB;

class AcademicPreparationService
{
    public function copyActiveClasses(AcademicYear $sourceYear, AcademicYear $targetYear): array
    {
        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($sourceYear, $targetYear, &$created, &$updated) {
            $sourceClasses = ActiveClass::where('academic_year_id', $sourceYear->id)->get();

            foreach ($sourceClasses as $sourceClass) {
                $targetClass = ActiveClass::where('academic_year_id', $targetYear->id)
                    ->where('kelas_id', $sourceClass->kelas_id)
                    ->where('kelas_paralel_id', $sourceClass->kelas_paralel_id)
                    ->first();

                $payload = [
                    'teacher_id' => $sourceClass->teacher_id,
                    'name' => $sourceClass->name,
                    'total_hours_per_week' => $sourceClass->total_hours_per_week,
                ];

                if ($targetClass) {
                    $targetClass->update($payload);
                    $updated++;
                    continue;
                }

                ActiveClass::create(array_merge([
                    'academic_year_id' => $targetYear->id,
                    'kelas_id' => $sourceClass->kelas_id,
                    'kelas_paralel_id' => $sourceClass->kelas_paralel_id,
                ], $payload));
                $created++;
            }
        });

        return compact('created', 'updated');
    }

    public function copyActiveSubjects(AcademicYear $sourceYear, AcademicYear $targetYear): array
    {
        $created = 0;
        $updated = 0;
        $skipped = 0;

        DB::transaction(function () use ($sourceYear, $targetYear, &$created, &$updated, &$skipped) {
            $sourceClasses = ActiveClass::with([
                'activeSubjects.semesterSubjectTeachers',
            ])->where('academic_year_id', $sourceYear->id)->get();

            foreach ($sourceClasses as $sourceClass) {
                $targetClass = ActiveClass::where('academic_year_id', $targetYear->id)
                    ->where('kelas_id', $sourceClass->kelas_id)
                    ->where('kelas_paralel_id', $sourceClass->kelas_paralel_id)
                    ->first();

                if (!$targetClass) {
                    $skipped += $sourceClass->activeSubjects->count();
                    continue;
                }

                foreach ($sourceClass->activeSubjects as $sourceSubject) {
                    $targetSubject = ActiveSubject::where('active_class_id', $targetClass->id)
                        ->where('mapel_id', $sourceSubject->mapel_id)
                        ->first();

                    $payload = [
                        'jam' => $sourceSubject->jam,
                        'teacher_id' => $sourceSubject->teacher_id,
                    ];

                    if ($targetSubject) {
                        $targetSubject->update($payload);
                        $updated++;
                    } else {
                        $targetSubject = ActiveSubject::create(array_merge([
                            'active_class_id' => $targetClass->id,
                            'mapel_id' => $sourceSubject->mapel_id,
                        ], $payload));
                        $created++;
                    }

                    SemesterSubjectTeacher::where('active_subject_id', $targetSubject->id)->delete();

                    $overrideRows = $sourceSubject->semesterSubjectTeachers
                        ->map(function ($override) use ($targetSubject) {
                            return [
                                'active_subject_id' => $targetSubject->id,
                                'semester_id' => $override->semester_id,
                                'teacher_id' => $override->teacher_id,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        })
                        ->values()
                        ->all();

                    if (!empty($overrideRows)) {
                        SemesterSubjectTeacher::insert($overrideRows);
                    }
                }
            }
        });

        return compact('created', 'updated', 'skipped');
    }

    public function copyTeacherSettings(AcademicYear $sourceYear, AcademicYear $targetYear): array
    {
        $quotaCreated = 0;
        $quotaUpdated = 0;
        $offTeachers = 0;
        $offSlots = 0;

        DB::transaction(function () use ($sourceYear, $targetYear, &$quotaCreated, &$quotaUpdated, &$offTeachers, &$offSlots) {
            $sourceQuotas = TeacherQuota::where('academic_year_id', $sourceYear->id)->get();

            foreach ($sourceQuotas as $sourceQuota) {
                $targetQuota = TeacherQuota::where('academic_year_id', $targetYear->id)
                    ->where('user_id', $sourceQuota->user_id)
                    ->first();

                if ($targetQuota) {
                    $targetQuota->update(['max_hours' => $sourceQuota->max_hours]);
                    $quotaUpdated++;
                    continue;
                }

                TeacherQuota::create([
                    'academic_year_id' => $targetYear->id,
                    'user_id' => $sourceQuota->user_id,
                    'max_hours' => $sourceQuota->max_hours,
                ]);
                $quotaCreated++;
            }

            $unavailableByTeacher = TeacherUnavailableHour::where('academic_year_id', $sourceYear->id)
                ->get()
                ->groupBy('user_id');

            foreach ($unavailableByTeacher as $teacherId => $slots) {
                TeacherUnavailableHour::where('academic_year_id', $targetYear->id)
                    ->where('user_id', $teacherId)
                    ->delete();

                $rows = $slots->map(function ($slot) use ($targetYear) {
                    return [
                        'academic_year_id' => $targetYear->id,
                        'user_id' => $slot->user_id,
                        'day_id' => $slot->day_id,
                        'learning_hour_id' => $slot->learning_hour_id,
                        'note' => $slot->note,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })->values()->all();

                if (!empty($rows)) {
                    TeacherUnavailableHour::insert($rows);
                    $offTeachers++;
                    $offSlots += count($rows);
                }
            }
        });

        return compact('quotaCreated', 'quotaUpdated', 'offTeachers', 'offSlots');
    }

    public function copyActiveKamars(AcademicYear $sourceYear, AcademicYear $targetYear): array
    {
        $created = 0;
        $updated = 0;

        DB::transaction(function () use ($sourceYear, $targetYear, &$created, &$updated) {
            $sourceKamars = ActiveKamar::where('academic_year_id', $sourceYear->id)->get();

            foreach ($sourceKamars as $sourceKamar) {
                $targetKamar = ActiveKamar::where('academic_year_id', $targetYear->id)
                    ->where('kamar_id', $sourceKamar->kamar_id)
                    ->first();

                $payload = [
                    'musrif_id' => $sourceKamar->musrif_id,
                    'name' => $sourceKamar->name,
                ];

                if ($targetKamar) {
                    $targetKamar->update($payload);
                    $updated++;
                    continue;
                }

                ActiveKamar::create(array_merge([
                    'academic_year_id' => $targetYear->id,
                    'kamar_id' => $sourceKamar->kamar_id,
                ], $payload));
                $created++;
            }
        });

        return compact('created', 'updated');
    }
}
