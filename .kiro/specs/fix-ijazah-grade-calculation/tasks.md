# Tasks: Fix Ijazah Grade Calculation

- [x] **task-1**: Create Helper Method for Semester Score Calculation
  - Create a private helper method `calculateSemesterScore()` in `IjazahSettingsController` to calculate weighted score for a specific semester
  - Add private method `calculateSemesterScore($student, $subjectMapelId, $semesterId, $academicYearId)`
  - Get semester object from ID
  - Get grade weights for the semester (category: pengetahuan)
  - Filter student grades by subject and semester
  - Calculate weighted score using grade weights
  - Return rounded score
  - **Acceptance:** Method returns integer score, handles missing data gracefully (returns 0), uses same logic as StudentGradeRecapController

- [x] **task-2**: Refactor Grade Calculation in print() Method
  - **depends on:** task-1
  - Update the grade calculation logic in `print()` method to use rapor formula instead of raw semester 2 scores
  - Get Semester 1 (Ganjil) and Semester 2 (Genap) objects
  - For each subject: keep manual grade priority, calculate Sem1 score, calculate Sem2 score, apply rapor formula: `(Sem1 + 2*Sem2) / 3`, if no Sem1 data use Sem2 only
  - Update final_score with rapor score
  - **Acceptance:** Manual grades still take priority, rapor formula applied correctly, handles missing Sem1 data, total and average calculated from rapor scores

- [x] **task-3**: Apply Same Logic to Candidates Data
  - **depends on:** task-1, task-2
  - Update the candidates data processing loop to use the same rapor calculation logic
  - Locate the candidates data processing loop (around line 360+)
  - Apply the same rapor calculation: calculate Sem1 score, calculate Sem2 score, apply formula `(Sem1 + 2*Sem2) / 3`
  - Update candidate's final_score with rapor score
  - **Acceptance:** Candidates table shows rapor scores, ranking based on rapor scores, consistent with main student calculation

- [x] **task-4**: Test and Verify
  - **depends on:** task-1, task-2, task-3
  - Test the updated calculation with real data and verify against StudentGradeRecapController
  - Test with student who has both Sem1 and Sem2 grades
  - Verify formula: (Sem1 + 2*Sem2) / 3
  - Compare result with StudentGradeRecapController for the same student
  - Test with student who only has Sem2 grades, test with manual grades
  - Verify total and average calculations, check candidates recap table
  - **Acceptance:** Ijazah scores match rapor scores from StudentGradeRecapController, manual grades work correctly, no errors, total and average calculated correctly
