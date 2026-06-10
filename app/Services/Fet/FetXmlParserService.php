<?php

namespace App\Services\Fet;

use App\Models\AcademicYear;
use App\Models\Day;
use App\Models\LearningHour;
use App\Models\Schedule;
use App\Models\ActiveSubject;
use Illuminate\Support\Facades\DB;

class FetXmlParserService
{
    public function parse($xmlFilePath, AcademicYear $year)
    {
        if (!file_exists($xmlFilePath)) {
            throw new \Exception("File hasil dari FET tidak ditemukan di server.");
        }
        
        $xml = simplexml_load_file($xmlFilePath);
        if (!$xml) {
            throw new \Exception("Gagal membaca file XML hasil dari FET.");
        }
        
        // 1. Ambil pemetaan Activity ID -> Active Subject ID
        $activityToSubjectMap = [];
        if (isset($xml->Activities_List->Activity)) {
            foreach ($xml->Activities_List->Activity as $act) {
                $activityId = (string) $act->Id;
                $subjectId = (string) $act->Comments; // active_subject_id disimpan di sini
                if ($subjectId) {
                    $activityToSubjectMap[$activityId] = $subjectId;
                }
            }
        }
        
        // 2. Persiapkan relasi ke DB
        $dbDays = Day::all()->keyBy('name');
        $dbHours = LearningHour::all();
        $hourMap = [];
        foreach ($dbHours as $h) {
            $hourMap["Jam " . $h->hour_number] = $h->id;
        }
        
        $schedulesToInsert = [];
        
        // Pre-fetch Active Subjects
        $subjectIds = array_values($activityToSubjectMap);
        $activeSubjects = ActiveSubject::whereIn('id', $subjectIds)->get()->keyBy('id');
        
        // 3. Baca elemen Timetable
        if (isset($xml->Timetable->Activities_Timetable->Activity)) {
            foreach ($xml->Timetable->Activities_Timetable->Activity as $scheduledAct) {
                $actId = (string) $scheduledAct->Id;
                $dayName = (string) $scheduledAct->Day;
                $hourName = (string) $scheduledAct->Hour;
                
                if (isset($activityToSubjectMap[$actId])) {
                    $activeSubjectId = $activityToSubjectMap[$actId];
                    $dayId = isset($dbDays[$dayName]) ? $dbDays[$dayName]->id : null;
                    $hourId = isset($hourMap[$hourName]) ? $hourMap[$hourName] : null;
                    
                    if ($dayId && $hourId) {
                        $activeSubject = $activeSubjects[$activeSubjectId] ?? null;
                        if ($activeSubject) {
                            $schedulesToInsert[] = [
                                'academic_year_id' => $year->id,
                                'active_class_id'  => $activeSubject->active_class_id,
                                'active_subject_id'=> $activeSubject->id,
                                'teacher_id'       => $activeSubject->teacher_id,
                                'day_id'           => $dayId,
                                'learning_hour_id' => $hourId,
                                'is_manual'        => false,
                                'created_at'       => now(),
                                'updated_at'       => now(),
                            ];
                        }
                    }
                }
            }
        } else {
             throw new \Exception("Jadwal (Timetable) tidak ditemukan dalam hasil. FET mungkin gagal menyusun jadwal sempurna.");
        }
        
        if (count($schedulesToInsert) > 0) {
            DB::beginTransaction();
            try {
                // Jangan hapus jadwal manual (is_manual = true)
                // Hanya hapus jadwal hasil generate otomatis sebelumnya (is_manual = false)
                Schedule::where('academic_year_id', $year->id)
                    ->where('is_manual', false)
                    ->delete();
                    
                // Batch insert untuk performa
                $chunks = array_chunk($schedulesToInsert, 100);
                foreach ($chunks as $chunk) {
                    Schedule::insert($chunk);
                }
                
                DB::commit();
                return count($schedulesToInsert);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        }
        
        return 0;
    }
    
    private function rsearch($folder, $pattern) {
        $dir = new \RecursiveDirectoryIterator($folder);
        $ite = new \RecursiveIteratorIterator($dir);
        $files = new \RegexIterator($ite, $pattern, \RegexIterator::GET_MATCH);
        $fileList = array();
        foreach($files as $file) {
            $fileList[] = $file[0];
        }
        return $fileList;
    }
}
