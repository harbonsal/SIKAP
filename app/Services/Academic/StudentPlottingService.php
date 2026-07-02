<?php

namespace App\Services\Academic;

use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\ActiveClass;
use Illuminate\Support\Collection;

class StudentPlottingService
{
    /**
     * Get ranked students for a specific grade level and exam type.
     */
    public function getRankedStudents($sourceLevelIds, $sourceSemesterId, $gradingMethod = 'average'): Collection
    {
        $sourceLevelIds = (array) $sourceLevelIds;
        $isNewStudents = in_array('new_students', $sourceLevelIds);

        // 1. Get students
        if ($isNewStudents) {
            // New students who don't have any class assignment yet
            $students = Student::doesntHave('classMembers')->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            })->get();
        } else {
            // Get all students currently in the source levels
            $students = Student::whereHas('classMembers', function ($q) use ($sourceLevelIds, $sourceSemesterId) {
                $q->whereHas('activeClass', function ($q2) use ($sourceLevelIds, $sourceSemesterId) {
                    $q2->whereIn('kelas_id', $sourceLevelIds)
                       ->where('academic_year_id', $sourceSemesterId);
                });
            })->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            })->get();
        }

        // 2. Fetch their grades if applicable
        if ($gradingMethod !== 'manual' && !$isNewStudents) {
            // We assume StudentGrade has relation to active class or semester
            $students->map(function ($student) use ($sourceSemesterId) {
                // Calculate average score across all their grades.
                // This is robust against schema variations in how active subjects/classes are linked to academic years.
                $score = StudentGrade::where('student_id', $student->id)->avg('score') ?? 0;

                $student->plotting_score = $score;
                return $student;
            });

            // Sort by score descending
            return $students->sortByDesc('plotting_score')->values();
        }

        // For new students (Kelas 7) or manual mode
        $students->map(function($student) {
            $student->plotting_score = 0;
            return $student;
        });
        
        return $students->sortBy('name')->values();
    }

    /**
     * Distribute students into target classes using Round-Robin algorithm.
     * 
     * @param Collection $rankedStudents
     * @param array $targetClassIds
     * @param array $lockedStudents Format: ['student_id' => 'class_id']
     * @param array $retainedStudents Array of student IDs to exclude (Tinggal Kelas)
     */
    public function generateDistribution(Collection $rankedStudents, array $targetClassIds, array $lockedStudents = [], array $retainedStudents = [], bool $isNewStudents = false): array
    {
        // Filter out retained students
        $pool = $rankedStudents->reject(function ($student) use ($retainedStudents) {
            return in_array($student->id, $retainedStudents);
        })->values();

        // Initialize buckets
        $buckets = [];
        $targetClasses = ActiveClass::with('kelas')->whereIn('id', $targetClassIds)->get()->keyBy('id');
        
        foreach ($targetClassIds as $classId) {
            $buckets[$classId] = [
                'class' => $targetClasses[$classId] ?? null,
                'students' => []
            ];
        }

        // Place locked students
        $remainingPool = [];
        foreach ($pool as $student) {
            if (isset($lockedStudents[$student->id]) && isset($buckets[$lockedStudents[$student->id]])) {
                $student->is_locked = true;
                $buckets[$lockedStudents[$student->id]]['students'][] = $student;
            } else {
                $student->is_locked = false;
                $remainingPool[] = $student;
            }
        }

        // Round-Robin Distribution balancing
        $classIdsCycle = array_values($targetClassIds);
        $cycleIndex = 0;

        foreach ($remainingPool as $student) {
            $nomorInduk = $student->nomor_induk ?? '';
            $jenjangKode = strlen($nomorInduk) >= 4 ? substr($nomorInduk, 2, 2) : '';

            $validClassIdsCycle = [];
            foreach ($classIdsCycle as $cid) {
                if ($isNewStudents) {
                    $className = $buckets[$cid]['class']->name ?? ($buckets[$cid]['class']->kelas->name ?? '');
                    // 03 cannot enter Mutawasith
                    if ($jenjangKode === '03' && stripos($className, 'Mutawas') !== false) {
                        continue;
                    }
                    // 02 cannot enter Tsanawy
                    if ($jenjangKode === '02' && stripos($className, 'Tsanaw') !== false) {
                        continue;
                    }
                }
                $validClassIdsCycle[] = $cid;
            }

            if (empty($validClassIdsCycle)) {
                continue;
            }

            $selectedClassId = null;
            $attempts = 0;
            
            while ($attempts < count($validClassIdsCycle)) {
                $candidateClassId = $validClassIdsCycle[$cycleIndex % count($validClassIdsCycle)];
                
                // Find the absolute minimum across only valid buckets
                $validBuckets = collect($buckets)->only($validClassIdsCycle);
                $globalMin = $validBuckets->min(fn($b) => count($b['students']));
                $currentCount = count($buckets[$candidateClassId]['students']);

                if ($currentCount == $globalMin) {
                    $selectedClassId = $candidateClassId;
                    $cycleIndex = ($cycleIndex + 1) % count($validClassIdsCycle);
                    break;
                }
                
                $cycleIndex = ($cycleIndex + 1) % count($validClassIdsCycle);
                $attempts++;
            }

            if ($selectedClassId) {
                $buckets[$selectedClassId]['students'][] = $student;
            }
        }

        return array_values($buckets);
    }
}
