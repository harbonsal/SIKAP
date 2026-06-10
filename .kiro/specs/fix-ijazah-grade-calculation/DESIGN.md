# Design: Fix Ijazah Grade Calculation

## Overview
Refactor `IjazahSettingsController::print()` method to calculate grades using the correct report card (rapor) formula instead of raw semester 2 scores.

## Current Flow
```
1. Get semester 2 (Genap)
2. Get grade weights for semester 2
3. For each subject:
   - Get student grades for semester 2
   - Calculate weighted score
   - Store as final_score
4. Calculate total and average
```

## New Flow
```
1. Get semester 1 (Ganjil) and semester 2 (Genap)
2. Get grade weights for both semesters
3. For each subject:
   - Check if manual grade exists → use it
   - Otherwise:
     a. Calculate semester 1 score (weighted)
     b. Calculate semester 2 score (weighted)
     c. Calculate rapor score: (Sem1 + 2*Sem2) / 3
     d. Store as final_score
4. Calculate total and average from rapor scores
```

## Implementation Details

### 1. Helper Function: Calculate Semester Score
```php
private function calculateSemesterScore($student, $subjectMapelId, $semesterId, $academicYearId)
{
    // Get grade weights for this semester
    $semester = \App\Models\Semester::find($semesterId);
    if (!$semester) return 0;
    
    $gradeWeights = \App\Models\GradeWeight::where('academic_year_id', $academicYearId)
        ->where('category', 'pengetahuan')
        ->whereIn('semester', ['all', 'semua', 'All', $semester->name, strtolower($semester->name)])
        ->get();
    
    if ($gradeWeights->isEmpty()) return 0;
    
    // Get student grades for this subject and semester
    $gradesForSubj = $student->studentGrades->filter(function ($g) use ($subjectMapelId, $semesterId) {
        return $g->activeSubject
            && $g->activeSubject->mapel_id == $subjectMapelId
            && $g->semester_id == $semesterId;
    });
    
    if ($gradesForSubj->isEmpty()) return 0;
    
    // Calculate weighted score
    $computedFinal = 0;
    foreach ($gradeWeights as $weight) {
        $g = $gradesForSubj->firstWhere('grade_weight_id', $weight->id);
        $s = $g ? $g->score : 0;
        $computedFinal += $s * ($weight->weight / 100);
    }
    
    return round($computedFinal);
}
```

### 2. Modified Grade Calculation Logic
```php
// In print() method, replace the grade calculation section:

// Get Semester IDs
$sem1 = \App\Models\Semester::where('name', 'Ganjil')
    ->orWhere('name', 'Semester 1')
    ->first();
$sem2 = \App\Models\Semester::where('name', 'Genap')
    ->orWhere('name', 'Semester 2')
    ->first();

$sem1Id = $sem1 ? $sem1->id : null;
$sem2Id = $sem2 ? $sem2->id : null;

// For each subject:
foreach ($subjects as $idx => &$subj) {
    if (!is_array($subj)) continue;
    
    $finalGrade = 0;
    $subjName = isset($subj['name']) ? (string)$subj['name'] : '';
    
    // 1. Check Manual Grade First
    if ($subjName && isset($manualGrades[$subjName])) {
        $finalGrade = (int) $manualGrades[$subjName];
    }
    // 2. Calculate Rapor Score
    elseif (!empty($subj['mapel_id']) && $sem2Id) {
        $latestClassMember = $student->classMembers()->with('activeClass')->latest()->first();
        $academicYearId = $latestClassMember?->activeClass?->academic_year_id ?? null;
        
        if ($academicYearId) {
            // Calculate Semester 2 score
            $sem2Score = $this->calculateSemesterScore($student, $subj['mapel_id'], $sem2Id, $academicYearId);
            
            // Calculate Semester 1 score (if exists)
            $sem1Score = 0;
            if ($sem1Id) {
                $sem1Score = $this->calculateSemesterScore($student, $subj['mapel_id'], $sem1Id, $academicYearId);
            }
            
            // Calculate Rapor: (Sem1 + 2*Sem2) / 3
            if ($sem1Score > 0) {
                $finalGrade = round(($sem1Score + (2 * $sem2Score)) / 3);
            } else {
                // If no Sem1 data, use Sem2 only
                $finalGrade = $sem2Score;
            }
        }
    }
    
    $subj['final_score'] = $finalGrade;
    $subj['score_text'] = $finalGrade > 0
        ? \App\Helpers\ArabicNumberConverter::convert((int) $finalGrade)
        : '-';
    
    if ($finalGrade > 0) {
        $totalScore += $finalGrade;
        $count++;
    }
}
```

### 3. Apply Same Logic to Candidates Data
The same calculation logic must be applied when processing candidates data for the recap table.

## Edge Cases
1. **No Semester 1 data**: Use Semester 2 score only
2. **No Semester 2 data**: Return 0 (shouldn't happen for graduating students)
3. **Manual grade exists**: Always prioritize manual grade
4. **No grade weights**: Return 0
5. **No student grades**: Return 0

## Testing Considerations
- Test with student who has both Sem1 and Sem2 grades
- Test with student who only has Sem2 grades
- Test with student who has manual grades
- Verify formula: (Sem1 + 2*Sem2) / 3
- Verify total and average calculations
- Compare with StudentGradeRecapController output

## Backward Compatibility
- Manual grades still take priority
- If calculation fails, gracefully return 0
- Existing settings and configurations remain unchanged
