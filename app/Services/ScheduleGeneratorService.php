<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ActiveSubject;
use App\Models\DayLearningHour;
use App\Models\Schedule;
use App\Models\TeacherUnavailableHour;
use Illuminate\Support\Facades\DB;

class ScheduleGeneratorService
{
    private $classSchedule = [];
    private $teacherSchedule = [];
    private $teacherDailyClassHours = [];
    private $teacherDailyTotalHours = [];
    private $unavailable = [];
    private $enableTeacherOff = true;
    private $maxHoursPerClass = 4;
    private $maxHoursPerDay = 6;
    private $allowSplit2Hours = false;
    private $schedulesToInsert = [];

    public function generate(AcademicYear $year, $keepExisting = false)
    {
        // Auto-create is_manual column to distinguish manual vs auto-generated without migrations
        if (!\Illuminate\Support\Facades\Schema::hasColumn('schedules', 'is_manual')) {
            \Illuminate\Support\Facades\Schema::table('schedules', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->boolean('is_manual')->default(true); // Default true so existing manual schedules are protected
            });
        }

        DB::beginTransaction();
        try {
            // 1. Clear existing schedules for this year if not keeping
            if (!$keepExisting) {
                Schedule::where('academic_year_id', $year->id)->delete();
            } else {
                // If keepExisting, we ONLY keep manual schedules!
                // Delete all auto-generated schedules from previous runs
                Schedule::where('academic_year_id', $year->id)
                    ->where('is_manual', false)
                    ->delete();

                // Also delete any manual schedules where the subject's jam is 0
                // Because if they 0-ed it, they want it gone and those slots freed up.
                $zeroJamSubjectIds = ActiveSubject::whereHas('activeClass', function ($q) use ($year) {
                    $q->where('academic_year_id', $year->id);
                })->where('jam', '<=', 0)->pluck('id');

                if ($zeroJamSubjectIds->isNotEmpty()) {
                    Schedule::where('academic_year_id', $year->id)
                        ->whereIn('active_subject_id', $zeroJamSubjectIds)
                        ->delete();
                }
            }

            $schoolInfo = \App\Models\SchoolInfo::first();
            $config = $schoolInfo?->schedule_config ?? [];
            $this->enableTeacherOff = $config['enable_teacher_off'] ?? true;
            $this->maxHoursPerClass = $config['max_hours_per_class'] ?? 4;
            $this->maxHoursPerDay = $config['max_hours_per_day'] ?? 6;
            $this->allowSplit2Hours = $config['allow_split_2_hours'] ?? false;

            // 2. Get Active Slots (Day + Hour)
            $activeSlots = DayLearningHour::where('is_active', true)
                ->with(['day', 'learningHour'])
                ->get()
                ->sortBy(['day.order', 'learningHour.hour_number']);

            $daySlots = [];
            foreach ($activeSlots as $slot) {
                $daySlots[$slot->day_id][] = $slot->learning_hour_id;
            }

            // 3. Pre-fetch Unavailable Hours
            $this->unavailable = TeacherUnavailableHour::where('academic_year_id', $year->id)
                ->get()
                ->groupBy('user_id');

            // 4. Get Active Subjects (Load) - EXCLUDE 0 HOURS
            $activeSubjects = ActiveSubject::whereHas('activeClass', function ($q) use ($year) {
                $q->where('academic_year_id', $year->id);
            })
                ->whereNotNull('teacher_id')
                ->where('jam', '>', 0)
                ->with(['teacher', 'activeClass'])
                ->get();

            // Calculate Heuristics for Sorting
            $teacherLoad = [];
            $teacherOffCount = [];
            foreach ($activeSubjects as $sub) {
                $tid = $sub->teacher_id;
                if (!isset($teacherLoad[$tid])) $teacherLoad[$tid] = 0;
                $teacherLoad[$tid] += (int) $sub->jam;
                
                if (!isset($teacherOffCount[$tid])) {
                    $teacherOffCount[$tid] = isset($this->unavailable[$tid]) ? $this->unavailable[$tid]->count() : 0;
                }
            }

            // SORTING LOGIC:
            // 1. Prioritize teachers with OFF days (most restricted).
            // 2. Prioritize teachers with HIGHEST total load.
            // 3. Prioritize subjects with LARGEST jam.
            $activeSubjects = $activeSubjects->sortByDesc(function ($sub) use ($teacherLoad, $teacherOffCount) {
                return ($teacherOffCount[$sub->teacher_id] * 100000) 
                     + ($teacherLoad[$sub->teacher_id] * 1000) 
                     + (int) $sub->jam;
            });

            // 5. Tracking for Assignments (In-Memory for speed)
            $this->classSchedule = [];
            $this->teacherSchedule = [];
            $this->teacherDailyClassHours = [];
            $this->teacherDailyTotalHours = [];
            $this->schedulesToInsert = [];

            if ($keepExisting) {
                $existingSchedules = Schedule::where('academic_year_id', $year->id)->get();
                foreach ($existingSchedules as $sch) {
                    $this->markAsAssigned($sch->active_class_id, $sch->teacher_id, $sch->day_id, $sch->learning_hour_id);
                }
            }

            foreach ($activeSubjects as $subject) {
                $hoursNeeded = (int) $subject->jam;
                
                if ($keepExisting) {
                    $alreadyAssigned = Schedule::where('academic_year_id', $year->id)
                        ->where('active_subject_id', $subject->id)
                        ->count();
                    $hoursNeeded -= $alreadyAssigned;
                }
                
                if ($hoursNeeded <= 0) continue;

                // Decompose required hours into blocks
                $blocks = $this->decomposeHours($hoursNeeded);
                
                // We use a queue for blocks so we can break them down if they fail
                $blockQueue = $blocks;
                
                while (!empty($blockQueue)) {
                    $blockSize = array_shift($blockQueue);
                    if ($blockSize <= 0) continue;

                    $placed = $this->tryPlaceBlock($subject, $year->id, $blockSize, $daySlots);
                    
                    if (!$placed) {
                        // Fallback: Break down the block
                        if ($blockSize > 1) {
                            if ((int) $subject->jam === 2 && $blockSize === 2 && !$this->allowSplit2Hours) {
                                // Rule: jadwal yang hanya 2 jam jangan dipecah (kecuali diizinkan)
                            } else {
                                $blockQueue[] = 1;
                                $blockQueue[] = $blockSize - 1;
                                // Sort descending to try larger blocks first
                                rsort($blockQueue);
                            }
                        } else {
                            // Cannot be scheduled at all (total conflict)
                            // It will just be skipped and left for manual fixing
                        }
                    }
                }
            }

            // Batch Insert
            if (!empty($this->schedulesToInsert)) {
                $chunks = array_chunk($this->schedulesToInsert, 100);
                foreach ($chunks as $chunk) {
                    Schedule::insert($chunk);
                }
            }

            DB::commit();
            return count($this->schedulesToInsert);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function decomposeHours($hours)
    {
        $blocks = [];
        $maxBlockSize = $this->maxHoursPerClass > 0 ? $this->maxHoursPerClass : 4;
        
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

    private function tryPlaceBlock($subject, $yearId, $blockSize, $daySlots)
    {
        $classId = $subject->active_class_id;
        $teacherId = $subject->teacher_id;

        foreach ($daySlots as $dayId => $hourIds) {
            $consecutiveCount = 0;
            $startIdx = -1;
            
            for ($i = 0; $i < count($hourIds); $i++) {
                $hourId = $hourIds[$i];
                
                if ($this->canPlace($classId, $teacherId, $dayId, $hourId)) {
                    if ($consecutiveCount == 0) {
                        $startIdx = $i;
                    }
                    $consecutiveCount++;
                    
                    // We must also check daily limits!
                    // If we add this block, will it exceed daily max hours?
                    $currentDailyTotal = $this->teacherDailyTotalHours[$teacherId][$dayId] ?? 0;
                    $currentDailyClass = $this->teacherDailyClassHours[$teacherId][$classId][$dayId] ?? 0;
                    
                    if (($currentDailyTotal + $blockSize) > $this->maxHoursPerDay) {
                        // Placing this block would exceed the day's limit
                        $consecutiveCount = 0;
                        break;
                    }
                    
                    if (($currentDailyClass + $blockSize) > $this->maxHoursPerClass) {
                        // Placing this block would exceed the class limit
                        $consecutiveCount = 0;
                        break;
                    }
                    
                    if ($consecutiveCount == $blockSize) {
                        // Found a valid block! Assign it.
                        for ($j = $startIdx; $j <= $i; $j++) {
                            $hId = $hourIds[$j];
                            $this->markAsAssigned($classId, $teacherId, $dayId, $hId);
                            
                            $this->schedulesToInsert[] = [
                                'academic_year_id' => $yearId,
                                'active_class_id' => $classId,
                                'active_subject_id' => $subject->id,
                                'teacher_id' => $teacherId,
                                'day_id' => $dayId,
                                'learning_hour_id' => $hId,
                                'is_manual' => false,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                        return true;
                    }
                } else {
                    $consecutiveCount = 0;
                    $startIdx = -1;
                }
            }
        }
        
        return false;
    }

    private function canPlace($classId, $teacherId, $dayId, $hourId)
    {
        // 1. Class Availability
        if (isset($this->classSchedule[$classId][$dayId][$hourId])) return false;

        // 2. Teacher Availability (Strict no overlap for Auto Generator)
        if (isset($this->teacherSchedule[$teacherId][$dayId][$hourId])) return false;

        // 3. Teacher Unavailable (Off Hours)
        if ($this->enableTeacherOff && isset($this->unavailable[$teacherId])) {
            $isOff = $this->unavailable[$teacherId]->contains(function ($un) use ($dayId, $hourId) {
                if (!$un->learning_hour_id) return $un->day_id == $dayId;
                return $un->day_id == $dayId && $un->learning_hour_id == $hourId;
            });
            if ($isOff) return false;
        }

        return true;
    }

    private function markAsAssigned($classId, $teacherId, $dayId, $hourId)
    {
        $this->classSchedule[$classId][$dayId][$hourId] = true;
        $this->teacherSchedule[$teacherId][$dayId][$hourId] = true;

        if (!isset($this->teacherDailyClassHours[$teacherId][$classId][$dayId])) {
            $this->teacherDailyClassHours[$teacherId][$classId][$dayId] = 0;
        }
        $this->teacherDailyClassHours[$teacherId][$classId][$dayId]++;

        if (!isset($this->teacherDailyTotalHours[$teacherId][$dayId])) {
            $this->teacherDailyTotalHours[$teacherId][$dayId] = 0;
        }
        $this->teacherDailyTotalHours[$teacherId][$dayId]++;
    }
}
