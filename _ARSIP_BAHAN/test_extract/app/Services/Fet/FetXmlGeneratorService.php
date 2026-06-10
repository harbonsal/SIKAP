<?php

namespace App\Services\Fet;

use App\Models\AcademicYear;
use App\Models\ActiveSubject;
use App\Models\Day;
use App\Models\LearningHour;
use App\Models\DayLearningHour;
use App\Models\TeacherUnavailableHour;
use Illuminate\Support\Facades\Log;

class FetXmlGeneratorService
{
    public function generate(AcademicYear $year)
    {
        $schoolInfo = \App\Models\SchoolInfo::first();
        $scheduleConfig = $schoolInfo->schedule_config ?? [];
        $enableTeacherOff = $scheduleConfig['enable_teacher_off'] ?? true;
        $maxHoursPerClass = (int) ($scheduleConfig['max_hours_per_class'] ?? 4);
        $maxHoursPerDay = (int) ($scheduleConfig['max_hours_per_day'] ?? 6);
        $minDaysBetween = (int) ($scheduleConfig['min_days_between'] ?? 1);
        $maxGapsTeacher = (int) ($scheduleConfig['max_gaps_teacher'] ?? 2);
        
        $weightTeacherOff = (int) ($scheduleConfig['weight_teacher_off'] ?? 100);
        $weightMinDays = (int) ($scheduleConfig['weight_min_days_between'] ?? 100);
        $weightMaxHoursDaily = (int) ($scheduleConfig['weight_max_hours_daily'] ?? 100);
        $weightMaxGaps = (int) ($scheduleConfig['weight_max_gaps_teacher'] ?? 100);
        
        $days = Day::orderBy('order')->get();
        $hours = LearningHour::orderBy('hour_number')->get();
        
        $activeSlots = DayLearningHour::where('is_active', true)->get()->groupBy('day_id');
        
        // Manual Schedules
        $manualSchedules = \App\Models\Schedule::with(['teacher', 'day', 'learningHour', 'activeClass.kelas', 'activeClass.kelasParalel'])
            ->where('academic_year_id', $year->id)
            ->where('is_manual', true)
            ->get();
            
        $manualCountsBySubject = [];
        $manualTeacherConstraints = [];
        $manualClassConstraints = [];
        
        foreach ($manualSchedules as $ms) {
            if (!isset($manualCountsBySubject[$ms->active_subject_id])) {
                $manualCountsBySubject[$ms->active_subject_id] = 0;
            }
            $manualCountsBySubject[$ms->active_subject_id]++;
            
            if ($ms->teacher && $ms->day && $ms->learningHour) {
                $tName = $ms->teacher->name;
                $key = $ms->day->name . '|' . $ms->learningHour->hour_number;
                $manualTeacherConstraints[$tName][$key] = ['day' => $ms->day->name, 'hour' => $ms->learningHour->hour_number];
            }
            
            if ($ms->activeClass && $ms->day && $ms->learningHour) {
                $className = $ms->activeClass->name ?: (($ms->activeClass->kelas->name ?? '') . ($ms->activeClass->kelasParalel ? ' ' . $ms->activeClass->kelasParalel->name : ''));
                $key = $ms->day->name . '|' . $ms->learningHour->hour_number;
                $manualClassConstraints[$className][$key] = ['day' => $ms->day->name, 'hour' => $ms->learningHour->hour_number];
            }
        }
        
        // Active Subjects
        $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($year) {
            $q->where('academic_year_id', $year->id);
        })
        ->whereNotNull('teacher_id')
        ->where('jam', '>', 0)
        ->with(['teacher', 'activeClass.kelas', 'activeClass.kelasParalel', 'mapel'])
        ->get();
        
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><fet version="7.8.6"></fet>');
        $xml->addChild('Mode', 'Official');
        $xml->addChild('Institution_Name', htmlspecialchars($schoolInfo->name ?? 'SIKAP'));
        
        // Days
        $daysList = $xml->addChild('Days_List');
        $daysList->addChild('Number_of_Days', $days->count());
        foreach ($days as $day) {
            $daysList->addChild('Name', htmlspecialchars($day->name));
        }
        
        // Hours
        $hoursList = $xml->addChild('Hours_List');
        $hoursList->addChild('Number_of_Hours', $hours->count());
        foreach ($hours as $hour) {
            $hoursList->addChild('Name', "Jam " . $hour->hour_number);
        }
        
        // Subjects
        $subjectsList = $xml->addChild('Subjects_List');
        $uniqueMapels = $activeSubjects->pluck('mapel.name')->unique();
        foreach ($uniqueMapels as $mapelName) {
            $sub = $subjectsList->addChild('Subject');
            $sub->addChild('Name', htmlspecialchars($mapelName));
        }
        
        // Teachers
        $teachersList = $xml->addChild('Teachers_List');
        $uniqueTeachers = $activeSubjects->pluck('teacher')->unique('id');
        foreach ($uniqueTeachers as $teacher) {
            $tea = $teachersList->addChild('Teacher');
            $tea->addChild('Name', htmlspecialchars($teacher->name));
        }
        
        // Students (Classes)
        $studentsList = $xml->addChild('Students_List');
        $yearNode = $studentsList->addChild('Year');
        $yearNode->addChild('Name', htmlspecialchars($year->name));
        $yearNode->addChild('Number_of_Students', 0); // Not used for constraints usually
        
        $uniqueClasses = $activeSubjects->pluck('activeClass')->unique('id');
        foreach ($uniqueClasses as $cls) {
            $className = $cls->name ?: (($cls->kelas->name ?? '') . ($cls->kelasParalel ? ' ' . $cls->kelasParalel->name : ''));
            $groupNode = $yearNode->addChild('Group');
            $groupNode->addChild('Name', htmlspecialchars($className));
            $groupNode->addChild('Number_of_Students', 0);
        }
        
        // Activities
        $activitiesList = $xml->addChild('Activities_List');
        $timeConstraints = $xml->addChild('Time_Constraints_List');
        $basicConstraint = $timeConstraints->addChild('ConstraintBasicCompulsoryTime');
        $basicConstraint->addChild('Weight_Percentage', 100);
        
        $activityId = 1;
        
        foreach ($activeSubjects as $subject) {
            $manualJam = $manualCountsBySubject[$subject->id] ?? 0;
            $jam = (int) $subject->jam - $manualJam;
            
            if ($jam <= 0) continue; // Skip if fully scheduled manually
            
            $teacherName = $subject->teacher->name;
            $mapelName = $subject->mapel->name;
            $className = $subject->activeClass->name ?: (($subject->activeClass->kelas->name ?? '') . ($subject->activeClass->kelasParalel ? ' ' . $subject->activeClass->kelasParalel->name : ''));
            
            $blocks = $this->decomposeHours($jam, $maxHoursPerClass);
            $activityGroupId = $activityId;
            $subActivityIds = [];
            
            foreach ($blocks as $duration) {
                $act = $activitiesList->addChild('Activity');
                $act->addChild('Teacher', htmlspecialchars($teacherName));
                $act->addChild('Subject', htmlspecialchars($mapelName));
                $act->addChild('Students', htmlspecialchars($className));
                $act->addChild('Duration', $duration);
                $act->addChild('Total_Duration', $jam);
                $act->addChild('Id', $activityId);
                $act->addChild('Activity_Group_Id', $activityGroupId);
                $act->addChild('Active', 'true');
                // We add an Activity_Tag with subject id to help map back later in parser
                $act->addChild('Comments', $subject->id); 
                
                $subActivityIds[] = $activityId;
                $activityId++;
            }
            
            // Constraint Min Days Between Activities (if split)
            if ($minDaysBetween > 0 && count($subActivityIds) > 1 && count($subActivityIds) <= $days->count()) {
                $minDays = $timeConstraints->addChild('ConstraintMinDaysBetweenActivities');
                $minDays->addChild('Weight_Percentage', $weightMinDays);
                $minDays->addChild('Consecutive_If_Same_Day', 'true');
                $minDays->addChild('Number_of_Activities', count($subActivityIds));
                foreach ($subActivityIds as $sId) {
                    $minDays->addChild('Activity_Id', $sId);
                }
                $minDays->addChild('MinDays', $minDaysBetween);
            }
        }
        
        // Constraint: Breaks (Hours not active)
        $breakConstraint = $timeConstraints->addChild('ConstraintBreakTimes');
        $breakConstraint->addChild('Weight_Percentage', 100);
        
        $breakTimesCount = 0;
        foreach ($days as $day) {
            $activeHourIds = isset($activeSlots[$day->id]) ? $activeSlots[$day->id]->pluck('learning_hour_id')->toArray() : [];
            foreach ($hours as $hour) {
                if (!in_array($hour->id, $activeHourIds)) {
                    // This is a break
                    $bt = $breakConstraint->addChild('Break_Time');
                    $bt->addChild('Day', htmlspecialchars($day->name));
                    $bt->addChild('Hour', "Jam " . $hour->hour_number);
                    $breakTimesCount++;
                }
            }
        }
        $breakConstraint->addChild('Number_of_Break_Times', $breakTimesCount);
        
        // Teacher Unavailable Hours
        $teacherConstraints = [];
        if ($enableTeacherOff) {
            $unavailable = TeacherUnavailableHour::with(['user', 'day', 'learningHour'])->where('academic_year_id', $year->id)->get();
            
            foreach ($unavailable as $un) {
                if (!$un->user || !$un->day) continue;
                
                $tName = $un->user->name;
                if (!isset($teacherConstraints[$tName])) {
                    $teacherConstraints[$tName] = [];
                }
                
                if ($un->learning_hour_id && $un->learningHour) {
                    $key = $un->day->name . '|' . $un->learningHour->hour_number;
                    $teacherConstraints[$tName][$key] = ['day' => $un->day->name, 'hour' => $un->learningHour->hour_number];
                } else {
                    // Whole day
                    foreach ($hours as $hour) {
                        $key = $un->day->name . '|' . $hour->hour_number;
                        $teacherConstraints[$tName][$key] = ['day' => $un->day->name, 'hour' => $hour->hour_number];
                    }
                }
            }
        }
        
        // Merge Manual Teacher Constraints
        foreach ($manualTeacherConstraints as $tName => $times) {
            if (!isset($teacherConstraints[$tName])) {
                $teacherConstraints[$tName] = [];
            }
            foreach ($times as $key => $timeData) {
                $teacherConstraints[$tName][$key] = $timeData;
            }
        }
        
        foreach ($teacherConstraints as $tName => $times) {
            if (empty($times)) continue;
            
            $tu = $timeConstraints->addChild('ConstraintTeacherNotAvailableTimes');
            $tu->addChild('Weight_Percentage', $weightTeacherOff);
            $tu->addChild('Teacher', htmlspecialchars($tName));
            $tu->addChild('Number_of_Not_Available_Times', count($times));
            foreach ($times as $timeData) {
                $time = $tu->addChild('Not_Available_Time');
                $time->addChild('Day', htmlspecialchars($timeData['day']));
                $time->addChild('Hour', "Jam " . $timeData['hour']);
            }
        }
        
        // Class constraints from manual schedules
        foreach ($manualClassConstraints as $className => $times) {
            if (empty($times)) continue;
            
            $cu = $timeConstraints->addChild('ConstraintStudentsSetNotAvailableTimes');
            $cu->addChild('Weight_Percentage', 100);
            $cu->addChild('Students', htmlspecialchars($className));
            $cu->addChild('Number_of_Not_Available_Times', count($times));
            foreach ($times as $timeData) {
                $time = $cu->addChild('Not_Available_Time');
                $time->addChild('Day', htmlspecialchars($timeData['day']));
                $time->addChild('Hour', "Jam " . $timeData['hour']);
            }
        }
        
        // Extra brace removed here
        foreach ($uniqueTeachers as $teacher) {
            $tMaxH = $timeConstraints->addChild('ConstraintTeacherMaxHoursDaily');
            $tMaxH->addChild('Weight_Percentage', $weightMaxHoursDaily);
            $tMaxH->addChild('Teacher', htmlspecialchars($teacher->name));
            $tMaxH->addChild('Maximum_Hours_Daily', $maxHoursPerDay);
            
            if ($maxGapsTeacher < 10) {
                $tGap = $timeConstraints->addChild('ConstraintTeacherMaxGapsPerDay');
                $tGap->addChild('Weight_Percentage', $weightMaxGaps);
                $tGap->addChild('Teacher', htmlspecialchars($teacher->name));
                $tGap->addChild('Max_Gaps', $maxGapsTeacher);
            }
        }
        
        // Space Constraints (Required by FET even if empty)
        $spaceConstraints = $xml->addChild('Space_Constraints_List');
        $basicSpace = $spaceConstraints->addChild('ConstraintBasicCompulsorySpace');
        $basicSpace->addChild('Weight_Percentage', 100);

        // Format and save
        $dom = new \DOMDocument('1.0');
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        $dom->loadXML($xml->asXML());
        
        $path = storage_path("app/fet");
        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }
        
        $filePath = $path . "/input.fet";
        file_put_contents($filePath, $dom->saveXML());
        
        return $filePath;
    }
    
    private function decomposeHours($hours, $maxBlockSize)
    {
        $blocks = [];
        $maxBlockSize = (int)$maxBlockSize > 0 ? (int)$maxBlockSize : 4;
        
        if ($hours <= 6 && $hours <= ($maxBlockSize * 2)) {
            if ($hours == 1) return [1];
            if ($hours == 2) return [2];
            if ($hours == 3) return [2, 1];
            if ($hours == 4 && $maxBlockSize >= 2) return [2, 2];
            if ($hours == 5 && $maxBlockSize >= 3) return [3, 2];
            if ($hours == 6 && $maxBlockSize >= 2) return [2, 2, 2];
        }
        
        while ($hours > 0) {
            $chunk = min($hours, $maxBlockSize);
            if ($hours > $maxBlockSize && ($hours - $maxBlockSize) == 1 && $maxBlockSize > 2) {
                $chunk = $maxBlockSize - 1;
            }
            $blocks[] = $chunk;
            $hours -= $chunk;
        }
        return $blocks;
    }
}
