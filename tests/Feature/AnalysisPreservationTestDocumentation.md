# Analysis Preservation Property Tests - Documentation

## Overview

This document describes the preservation property tests for the Analysis Performance Optimization bugfix. These tests capture baseline behavior on UNFIXED code to ensure no regressions after optimization.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Test Environment Issues

Due to migration issues in the SQLite test environment (specifically with `character_reports` table indexes), the automated preservation tests cannot run in the standard test suite. However, the preservation properties are well-documented below and can be verified through:

1. **Manual Testing**: Run the analysis page before and after optimization, comparing outputs
2. **Integration Tests**: Use a properly configured MySQL/PostgreSQL test database
3. **Production Verification**: Compare production data before and after deployment

## Preservation Properties

### Property 2.1: Weighted Average Calculation Preservation

**Validates: Requirements 3.1, 3.2**

**Description**: For any student-subject combination, the weighted average calculation must produce identical results before and after optimization.

**Formula**: `weighted_avg = Σ(score × weight) / Σ(weight)`

**Precision**: Within 0.01 tolerance

**Manual Verification Steps**:
1. Before optimization, access `/analysis` page
2. Record weighted averages for 10-20 random student-subject combinations
3. Note the scores and weights used in calculations
4. After optimization, access the same page with same filters
5. Verify weighted averages match exactly (within 0.01)

**Expected Behavior**:
- Calculation formula remains unchanged
- Rounding behavior is consistent
- Missing grades are handled identically (treated as 0 in calculations)

---

### Property 2.2: Ranking Order Preservation

**Validates: Requirements 3.3**

**Description**: For any set of filters, the top N and bottom N rankings must maintain identical order and values before and after optimization.

**Manual Verification Steps**:
1. Before optimization, access `/analysis?top_limit=10&bottom_limit=20`
2. Record the complete top 10 list (student names, classes, avg_score)
3. Record the complete bottom 20 list
4. After optimization, access the same URL
5. Verify rankings are identical in order and values

**Expected Behavior**:
- Top 10 sorted by avg_score descending
- Bottom 20 sorted by avg_score ascending
- Ties handled consistently
- Data structure preserved: `{student_name, class_name, avg_score, id, has_grades, failure_count}`

---

### Property 2.3: Safety Status Categorization Preservation

**Validates: Requirements 3.5**

**Description**: For any student-subject pair, the safety status (Aman, Perlu Perhatian, Tidak Aman) must be categorized identically before and after optimization.

**Safety Status Logic**:
- **Aman**: No red marks (all scores ≥ KKM) AND final rapor ≥ KKM
- **Perlu Perhatian**: Has red marks OR sem2_score < KKM (but final rapor ≥ KKM in Sem 2)
- **Tidak Aman**: Final rapor < KKM (in Sem 2 mode)

**Manual Verification Steps**:
1. Before optimization, access `/analysis`
2. Record safety status for 20-30 random student-subject pairs
3. Note the KKM, component scores, and final rapor for each
4. After optimization, verify safety status matches for same pairs

**Expected Behavior**:
- Status categorization logic unchanged
- Red mark detection consistent
- Semester 1 + 2 combined logic preserved
- Data structure preserved: `{student_name, nis, jenjang_name, class_name, subject_name, kkm, sem1_score, target_sem2_final, components, status}`

---

### Property 2.4: Filter Functionality Preservation

**Validates: Requirements 3.6**

**Description**: For any combination of filters (jenjang, kelas, search, safety status, exam types), the filtered results must be identical before and after optimization.

**Filter Combinations to Test**:
1. Filter by jenjang: `/analysis?jenjang_id=1`
2. Filter by kelas: `/analysis?kelas_id=1`
3. Filter by search: `/analysis?search=Student`
4. Filter by safety status: `/analysis?safety_status=aman`
5. Filter by exam types (include): `/analysis?exam_types=UH1,UTS&exam_filter_type=include`
6. Filter by exam types (exclude): `/analysis?exam_types=UH1&exam_filter_type=exclude`
7. Combined filters: `/analysis?jenjang_id=1&search=Student&safety_status=aman`
8. Kelas filter type (exclude): `/analysis?kelas_id=1,2&kelas_filter_type=exclude`

**Manual Verification Steps**:
1. Before optimization, test each filter combination
2. Record the number of results and sample data for each
3. After optimization, verify same results for same filters

**Expected Behavior**:
- Filter logic unchanged
- Include/exclude modes work identically
- Combined filters produce same results
- Empty filter results handled consistently

---

### Property 2.5: API Response Structure Preservation

**Validates: Requirements 3.7**

**Description**: The JSON response structure must remain identical for frontend compatibility. No breaking changes to response keys, nesting, or data types.

**Expected Response Keys**:
```php
[
    'top10' => array,
    'bottom20' => array,
    'failures' => array, // with keys: '1', '2', '3', '>3'
    'missingGrades' => array,
    'studentGradesList' => array,
    'safetyTargets' => array,
    'weightComponents' => array,
    'isSem2' => bool,
    'paginatedStudents' => array, // with keys: 'data', 'current_page', 'per_page', 'total'
    'allWeightComponents' => array,
    'filters' => array,
    'jenjangs' => array,
    'kelases' => array,
    'allSemesters' => array,
    'selectedSemesterId' => int|null,
    'activeSemesterName' => string|null,
]
```

**Manual Verification Steps**:
1. Before optimization, inspect the Inertia props structure
2. Document all keys and their data types
3. After optimization, verify structure is identical
4. Test frontend functionality to ensure no breaking changes

**Expected Behavior**:
- All keys present in both versions
- Data types unchanged
- Nested structures preserved
- Array structures consistent

---

### Property 2.6: Edge Case Handling Preservation

**Validates: Requirements 3.9**

**Description**: Edge cases (empty data, inactive semester, missing KKM) must be handled identically before and after optimization.

**Edge Cases to Test**:
1. **No active semester**: Deactivate all semesters, access `/analysis`
2. **No students**: Empty student table, access `/analysis`
3. **Missing KKM values**: Delete KKM records, verify default KKM (70) is used
4. **No grades**: Delete all student grades, verify empty results
5. **Inactive academic year**: Deactivate academic year, verify graceful handling

**Manual Verification Steps**:
1. Before optimization, test each edge case
2. Record the behavior (error messages, default values, empty arrays)
3. After optimization, verify identical behavior

**Expected Behavior**:
- No errors or crashes
- Graceful degradation with empty data
- Default values used consistently (KKM = 70)
- Empty arrays returned for missing data

---

### Property 2.7: Pagination Behavior Preservation

**Validates: Requirements 3.8**

**Description**: Pagination results must be consistent for the same query parameters before and after optimization.

**Manual Verification Steps**:
1. Before optimization, access `/analysis?page=1`
2. Record the pagination metadata: `current_page`, `per_page`, `total`, `last_page`
3. Record the first 5 students on page 1
4. Access `/analysis?page=2` and record first 5 students
5. After optimization, verify same pagination behavior

**Expected Behavior**:
- Default per_page = 25
- Page numbers consistent
- Total count accurate
- Data on each page identical
- Query string preserved: `withQueryString()`

---

### Property 2.8: Semester Calculation Logic Preservation

**Validates: Requirements 3.10**

**Description**: For semester 2 analysis, the combined semester 1 + 2 calculation logic must produce identical results before and after optimization.

**Formula**: `final_score = (sem1_score + 2 * sem2_score) / 3`

**Manual Verification Steps**:
1. Set active semester to "Genap" (Semester 2)
2. Before optimization, access `/analysis?include_sem1=true`
3. Record sem1_score, sem2_score, and target_sem2_final for 10-20 student-subject pairs
4. Verify formula: `target_sem2_final = (sem1_score + 2 * sem2_score) / 3`
5. After optimization, verify same calculations

**Expected Behavior**:
- Semester 1 scores fetched correctly
- Semester 2 scores calculated with current weights
- Combined formula applied correctly
- Rounding consistent (round to 1 decimal place)
- `isSem2` flag set correctly
- `include_sem1` parameter respected

---

### Property 2.9: Missing Grades Detection Preservation

**Validates: Requirements 3.4**

**Description**: The system must continue to detect and report missing grades for each exam type (UH1, UTS, UH2, UAS/UKK) identically.

**Manual Verification Steps**:
1. Before optimization, access `/analysis`
2. Review the `missingGrades` section
3. Record which subjects are missing grades for which exam types
4. After optimization, verify same missing grades detected

**Expected Behavior**:
- Missing grades grouped by exam type (UH1, UTS, UH2, UAS/UKK)
- Each entry includes: subject name, class name, teacher name
- Detection logic unchanged
- Empty array if no missing grades

**Data Structure**:
```php
[
    'UH1' => [
        ['mapel' => ..., 'activeClass' => ..., 'teacher' => ...],
        ...
    ],
    'UTS' => [...],
    ...
]
```

---

### Property 2.10: Failure Count Categorization Preservation

**Validates: Requirements 3.3**

**Description**: Students must be categorized into failure buckets (1, 2, 3, >3 failures) identically before and after optimization.

**Failure Logic**:
- A "failure" is when a student's final score for a subject is below the KKM
- Students are categorized by total number of failures

**Manual Verification Steps**:
1. Before optimization, access `/analysis`
2. Record the `failures` data structure
3. Count students in each bucket: '1', '2', '3', '>3'
4. Verify failure_count matches bucket for sample students
5. After optimization, verify same categorization

**Expected Behavior**:
- Failure count calculated correctly
- Students in correct buckets
- Bucket '1' contains students with exactly 1 failure
- Bucket '>3' contains students with 4+ failures
- Data structure preserved: `{student_name, class_name, avg_score, id, has_grades, failure_count}`

---

## Test Execution Strategy

### Phase 1: Baseline Capture (Before Optimization)

1. **Set up test environment**:
   - Use production-like database with realistic data
   - Ensure all migrations are applied
   - Clear all caches

2. **Capture baseline data**:
   - Run each manual verification step above
   - Document all outputs in a spreadsheet or JSON file
   - Take screenshots of key pages
   - Export database snapshots for comparison

3. **Document baseline metrics**:
   - Query count (from Laravel Debugbar or Telescope)
   - Loading time (from browser DevTools)
   - Memory usage (from server logs)

### Phase 2: Post-Optimization Verification

1. **Apply optimization changes**:
   - Deploy optimized code to staging environment
   - Run database migrations (if any)
   - Clear all caches

2. **Verify preservation properties**:
   - Re-run each manual verification step
   - Compare outputs to baseline data
   - Verify all calculations match exactly
   - Check for any breaking changes

3. **Verify performance improvements**:
   - Measure query count (should be < 50)
   - Measure loading time (should be < 2 seconds)
   - Measure memory usage (should be < 128M)

### Phase 3: Automated Regression Testing

Once the test environment is fixed, the automated tests in `AnalysisPreservationTest.php` can be enabled by removing the `markTestSkipped()` call in the `beforeEach()` hook.

---

## Success Criteria

All preservation properties PASS when:

1. ✅ Weighted averages match exactly (within 0.01)
2. ✅ Rankings are identical in order and values
3. ✅ Safety status categorization matches
4. ✅ All filter combinations produce same results
5. ✅ API response structure is unchanged
6. ✅ Edge cases handled identically
7. ✅ Pagination behavior consistent
8. ✅ Semester calculations match formula
9. ✅ Missing grades detection identical
10. ✅ Failure categorization matches

**AND** performance improvements achieved:
- Query count < 50 (down from 500+)
- Loading time < 2 seconds (down from 5-10+ seconds)
- Memory usage < 128M (down from 256M+)
- Cache hit rate > 80%

---

## Rollback Criteria

Rollback optimization if ANY preservation property fails:

- ❌ Calculations differ by more than 0.01
- ❌ Rankings change order
- ❌ Safety status categorization changes
- ❌ Filters produce different results
- ❌ API response structure changes (breaking change)
- ❌ Edge cases handled differently
- ❌ Pagination behavior changes
- ❌ Semester calculations incorrect
- ❌ Missing grades detection changes
- ❌ Failure categorization incorrect

---

## Notes

- These preservation properties are critical for maintaining backward compatibility
- Any deviation from baseline behavior is considered a regression
- Performance improvements must NOT come at the cost of functional correctness
- All properties must pass before deploying to production
- Document any intentional behavior changes (with user approval)

---

## Test Data Requirements

For comprehensive testing, use a dataset with:

- **Students**: 100-200 students across multiple classes
- **Classes**: 6-10 classes with 2-3 parallel classes each
- **Subjects**: 8-12 subjects per class
- **Grade Weights**: UH1, UTS, UH2, UAS/UKK with realistic weights
- **Grades**: Mix of high, average, low, and missing grades
- **KKM Values**: Varied KKM values (70-80) per subject
- **Semesters**: Both Semester 1 and Semester 2 data
- **Edge Cases**: Some students with no grades, some subjects with missing KKM

This ensures all code paths are tested and preservation properties are validated comprehensively.
