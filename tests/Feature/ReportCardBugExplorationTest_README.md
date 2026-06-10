# Report Card Bug Exploration Tests - Status Documentation

## Overview

This document describes the bug exploration tests created for the report card print issues bugfix spec. These tests are designed to **FAIL on unfixed code** to demonstrate that the bugs exist.

## Test File Location

`tests/Feature/ReportCardBugExplorationTest.php`

## Current Status

⚠️ **BLOCKED**: The tests cannot run due to SQLite migration compatibility issues in the existing codebase.

### Migration Issues

The following migrations have SQLite compatibility problems:

1. **2026_01_16_092000_modify_tahfidz_officers_to_date_based.php**
   - Issue: Attempts to drop column `day_of_week` which causes index constraint errors in SQLite
   - Error: `SQLSTATE[HY000]: General error: 1 error in index report_notes_unique_semester after drop column: no such column: semester`
   - Temporary Fix Applied: Commented out the `dropColumn` statement

2. **2026_01_22_075656_update_student_questionnaire_structure.php** (suspected)
   - Issue: Uses `MODIFY COLUMN` syntax which SQLite doesn't support
   - Error: `SQLSTATE[HY000]: General error: 1 near "MODIFY": syntax error`

### Recommended Actions

To run these tests, one of the following approaches is needed:

1. **Fix the migrations** to be SQLite-compatible by:
   - Using Laravel's `change()` method instead of raw MODIFY COLUMN
   - Handling column drops more carefully with SQLite
   - Using database-specific conditionals where needed

2. **Use MySQL/PostgreSQL for testing** instead of SQLite by:
   - Updating `phpunit.xml` or `.env.testing` to use a different database
   - This is the recommended approach for production-like testing

3. **Skip problematic migrations** for this specific test suite (not recommended)

## Test Descriptions

### Test 1.1: Ranking Display for Rank 11

**Purpose**: Verify that students ranked 11th see their actual rank "11" instead of "-"

**Bug Condition**: `isBugCondition_Ranking(rank)` where `rank > 10`

**Expected Behavior on Unfixed Code**: ❌ FAIL - The test will fail because line 260 in `ReportController.php` filters ranks > 10 to "-"

**Expected Behavior on Fixed Code**: ✅ PASS - After removing the filter, the test will pass

**Test Setup**:
- Creates 15 students with varying scores
- Target student is ranked 11th
- Makes HTTP request to `/academic/reports/{student}/print?semester=Genap`
- Asserts that `rank === 11` and `rank !== '-'`

### Test 1.2: Ranking Display for Rank 25

**Purpose**: Verify that students ranked 25th see their actual rank "25" instead of "-"

**Bug Condition**: `isBugCondition_Ranking(rank)` where `rank > 10`

**Expected Behavior on Unfixed Code**: ❌ FAIL - Same filter issue as Test 1.1

**Expected Behavior on Fixed Code**: ✅ PASS

**Test Setup**:
- Creates 30 students with varying scores
- Target student is ranked 25th
- Asserts that `rank === 25` and `rank !== '-'`

### Test 1.3: Arabic Decision Section Text Flow

**Purpose**: Verify that the Arabic Decision section text flows naturally without artificial line breaks for Semester 2 reports

**Bug Condition**: `isBugCondition_Arabic_Layout(semester, decision)` where `semester='Genap'`

**Expected Behavior on Unfixed Code**: ❌ FAIL - The test will fail because line 447 in `Print.jsx` lacks CSS properties to control text wrapping

**Expected Behavior on Fixed Code**: ✅ PASS - After adding `whitespace-nowrap` or similar CSS, the test will pass

**Test Setup**:
- Creates student in Mutawassith class
- Creates passing grades to trigger decision display
- Makes HTTP request for Semester 2 (Genap)
- Checks HTML content for presence of CSS properties like `whitespace-nowrap`, `white-space: nowrap`, or `word-break: keep-all`

### Test 1.4: Arabic Class Name "3 Tsanawiyah"

**Purpose**: Verify that "3 Tsanawiyah" displays as "الثالث الثانوي" (ordinal + masculine) instead of "٣ الثانوية" (cardinal + feminine)

**Bug Condition**: `isBugCondition_Arabic_Grammar(className, jenjangName)` where className contains digit

**Expected Behavior on Unfixed Code**: ❌ FAIL - The test will fail because `getArabicClassName()` uses cardinal numbers and feminine forms

**Expected Behavior on Fixed Code**: ✅ PASS - After fixing the function to use ordinal words and masculine forms

**Test Setup**:
- Creates student in "3 Tsanawiyah" class
- Checks HTML content for:
  - Ordinal word "الثالث" (not cardinal "٣")
  - Masculine form "الثانوي" (not feminine "الثانوية")
  - Complete format "الصف : الثالث الثانوي"

### Test 1.5: Arabic Class Name "2 Mutawassith"

**Purpose**: Verify that "2 Mutawassith" displays as "الثاني المتوسط" with correct grammar

**Bug Condition**: Same as Test 1.4

**Expected Behavior on Unfixed Code**: ❌ FAIL

**Expected Behavior on Fixed Code**: ✅ PASS

**Test Setup**:
- Creates student in "2 Mutawassith" class
- Checks for "الثاني" (ordinal) and "المتوسط" (masculine)

### Test 1.6: Arabic Class Name "1 Ibtidaiyah"

**Purpose**: Verify that "1 Ibtidaiyah" displays as "الأول الإبتدائي" with correct grammar

**Bug Condition**: Same as Test 1.4

**Expected Behavior on Unfixed Code**: ❌ FAIL

**Expected Behavior on Fixed Code**: ✅ PASS

**Test Setup**:
- Creates student in "1 Ibtidaiyah" class
- Checks for "الأول" (ordinal) and "الإبتدائي" (masculine)

## Requirements Validated

These tests validate the following requirements from the spec:

- **Requirements 1.1, 1.2, 1.3, 1.4**: Ranking display for all students
- **Requirements 2.1, 2.2, 2.3, 2.4, 2.5**: Arabic text layout in Decision section
- **Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**: Arabic class name grammar

## Next Steps

1. **Resolve migration issues** (see Recommended Actions above)
2. **Run the tests** to confirm they fail on unfixed code
3. **Document the counterexamples** found (the specific failures)
4. **Proceed to Task 2** (Write preservation property tests)
5. **Implement the fixes** (Task 3)
6. **Re-run these tests** to confirm they pass after fixes

## Notes

- These tests use Pest PHP testing framework
- Tests use `RefreshDatabase` trait to ensure clean state
- Tests create minimal required data (students, classes, grades, etc.)
- Tests make HTTP requests to the actual controller endpoints
- Tests inspect both the response data and rendered HTML content

## Test Execution Command

Once migration issues are resolved:

```bash
php artisan test tests/Feature/ReportCardBugExplorationTest.php
```

Or run individual tests:

```bash
php artisan test --filter="it_displays_actual_rank_11"
```
