# Report Card Print Issues Bugfix Design

## Overview

This design addresses four critical bugs in the report card print functionality: (1) ranking display showing "-" instead of actual rank for students ranked 11+, (2) Arabic text layout breaking unnaturally in the Decision section, (3) incorrect Arabic class name grammar using cardinal numbers and feminine forms instead of ordinal numbers and masculine forms. The fix targets the ranking calculation logic in `ReportController.php` and the display logic in `Print.jsx`, ensuring all students see their actual ranking while preserving existing calculation behavior and fixing Arabic text rendering.

## Glossary

- **Bug_Condition_Ranking (C1)**: The condition that triggers the ranking display bug - when a student's calculated rank is greater than 10
- **Bug_Condition_Arabic_Layout (C2)**: The condition that triggers the Arabic text layout bug - when the Decision section is rendered for Semester 2 (Genap) reports
- **Bug_Condition_Arabic_Grammar (C3)**: The condition that triggers the Arabic grammar bug - when class names are displayed in Arabic using the `getArabicClassName` function
- **Property_Ranking (P1)**: The desired behavior for ranking display - all students should see their actual numerical rank (1 through N)
- **Property_Arabic_Layout (P2)**: The desired behavior for Arabic text - the Decision section text should flow naturally without artificial line breaks
- **Property_Arabic_Grammar (P3)**: The desired behavior for Arabic class names - use ordinal numbers (الأول, الثاني, الثالث) with masculine adjective forms (الإبتدائي, المتوسط, الثانوي)
- **Preservation**: Existing ranking calculation algorithm, report card display, and non-Decision Arabic text that must remain unchanged by the fix
- **ReportController::print()**: The controller method in `app/Http/Controllers/ReportController.php` that calculates student ranking and prepares report card data
- **Print.jsx**: The React component in `resources/js/Pages/Academic/Report/Print.jsx` that renders the printable report card
- **Ranking_Calculator**: The code block in `ReportController::print()` (lines 233-260) that fetches all students' average scores, sorts them, and determines rank position
- **getArabicClassName()**: The helper function in `Print.jsx` (lines 73-85) that converts Latin class names to Arabic format

## Bug Details

### Bug Condition 1: Ranking Display

The ranking display bug manifests when a student's calculated rank is greater than 10. The `ReportController::print()` method correctly calculates the rank for all students (1 through N), but then applies a filter that converts ranks 11+ to "-" before passing to the view. The `Print.jsx` component then displays this filtered value.

**Formal Specification:**
```
FUNCTION isBugCondition_Ranking(rank)
  INPUT: rank of type integer (calculated student rank)
  OUTPUT: boolean
  
  RETURN rank > 10
END FUNCTION
```

**Root Cause:** Line 260 in `ReportController.php`:
```php
$rank = ($rank >= 1 && $rank <= 10) ? $rank : '-';
```

This line explicitly filters out ranks greater than 10, converting them to "-".

### Bug Condition 2: Arabic Text Layout

The Arabic text layout bug manifests when the Decision section (Al-Qarar) is rendered for Semester 2 (Genap) reports. The text "بناءً على النتائج التي تحققت في الفصل الدراسي الأول والثاني ، يثبت أن الطالب" is split across multiple lines at unnatural positions, breaking the flow of reading.

**Formal Specification:**
```
FUNCTION isBugCondition_Arabic_Layout(semester, decision)
  INPUT: semester of type string, decision of type object
  OUTPUT: boolean
  
  RETURN semester = 'Genap' 
         AND decision IS NOT NULL
         AND decision_section_is_rendered
END FUNCTION
```

**Root Cause:** Line 447 in `Print.jsx`:
```jsx
<p className="font-arabic text-sm mb-2">
    بناءً على النتائج التي تحققت في الفصل الدراسي الأول والثاني ، يثبت أن الطالب <span className="font-bold underline text-base px-1">{decision.status_ar || 'ناجح'}</span>
</p>
```

The paragraph lacks CSS properties to prevent text wrapping at unintended positions. The text should flow naturally on one line or wrap at natural phrase boundaries.

### Bug Condition 3: Arabic Class Name Grammar

The Arabic class name grammar bug manifests when class names are displayed in Arabic. The `getArabicClassName` function converts numbers to Arabic numerals (١, ٢, ٣) and uses feminine noun forms (الإبتدائية, المتوسطة, الثانوية), resulting in grammatically incorrect constructions like "٣ الثانوية" instead of "الثالث الثانوي".

**Formal Specification:**
```
FUNCTION isBugCondition_Arabic_Grammar(className, jenjangName)
  INPUT: className of type string, jenjangName of type string
  OUTPUT: boolean
  
  RETURN className CONTAINS digit (1-9)
         AND jenjangName IN ['Ibtidaiyah', 'Mutawassith', 'Tsanawiyah', 'Aliyah']
         AND getArabicClassName_uses_cardinal_numbers
         AND getArabicClassName_uses_feminine_forms
END FUNCTION
```

**Root Cause:** Lines 73-85 in `Print.jsx`:
```jsx
const getArabicClassName = (className, jenjangName) => {
    let arClass = className.replace(/\d+/g, (d) => toArabicNums(d)); // Converts to cardinal numerals
    
    // Uses feminine forms
    if (jenjangName?.includes('Ibtida')) arClass = arClass.replace(/Ibtidai?y?a?h?/i, 'الإبتدائية');
    if (jenjangName?.includes('Tsanaw')) arClass = arClass.replace(/Tsanawiy?a?h?/i, 'الثانوية');
    if (jenjangName?.includes('Mutawas')) arClass = arClass.replace(/Mutawas+i?t?h?/i, 'المتوسطة');
    
    return arClass;
};
```

This function converts digits to Arabic numerals (cardinal numbers) and uses feminine noun forms, which is grammatically incorrect for Arabic class names.

### Examples

**Ranking Bug:**
- Student with rank 11: Expected "11", Actual "-"
- Student with rank 25: Expected "25", Actual "-"
- Student with rank 1: Expected "1", Actual "1" ✓
- Student with rank 10: Expected "10", Actual "10" ✓

**Arabic Layout Bug:**
- Semester 2 report: Text breaks as "بناءً على النتائج التي تحققت في الفصل الدراسي" (line 1) "الأول والثاني ، يثبت أن الطالب ناجح" (line 2)
- Expected: Full text on one line or natural phrase boundaries

**Arabic Grammar Bug:**
- Class "3 Tsanawiyah": Expected "الصف : الثالث الثانوي", Actual "٣ الثانوية"
- Class "2 Mutawassith": Expected "الصف : الثاني المتوسط", Actual "٢ المتوسطة"
- Class "1 Ibtidaiyah": Expected "الصف : الأول الإبتدائي", Actual "١ الإبتدائية"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Ranking calculation algorithm must continue to fetch all students' average scores from the same class
- Ranking calculation must continue to sort students by average score in descending order
- Ranking calculation must continue to assign rank position based on array index plus one
- Average score calculation must continue using the same weighted formula
- All other report card sections (grades, behaviors, attendance, notes) must display unchanged
- Bilingual layout (Indonesian left, Arabic right) must remain unchanged
- Total students count and average score display must remain unchanged
- Semester 1 reports must NOT display the Decision section
- All Arabic text outside the Decision section must remain unchanged
- All non-Arabic text must remain unchanged

**Scope:**
All inputs that do NOT involve ranking display for students ranked 11+, Decision section rendering for Semester 2, or Arabic class name display should be completely unaffected by this fix. This includes:
- Ranking display for students ranked 1-10 (already working correctly)
- All report card sections except ranking display and Decision section
- Semester 1 reports (no Decision section)
- All other Arabic text rendering outside Decision section and class names

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Ranking Display Filter**: The `ReportController::print()` method applies an explicit filter on line 260 that converts ranks greater than 10 to "-". This is likely a legacy business rule that is no longer desired. The calculation logic is correct, but the display logic artificially limits the output.

2. **Missing CSS Properties**: The Decision section paragraph in `Print.jsx` lacks CSS properties to control text wrapping. The text should either:
   - Use `white-space: nowrap` to prevent wrapping entirely
   - Use appropriate `word-break` or `overflow-wrap` properties to wrap at natural boundaries
   - Increase container width to accommodate the full text on one line

3. **Incorrect Arabic Grammar Logic**: The `getArabicClassName` function uses:
   - Cardinal numbers (١, ٢, ٣) instead of ordinal words (الأول, الثاني, الثالث)
   - Feminine noun forms (الإبتدائية, المتوسطة, الثانوية) instead of masculine adjective forms (الإبتدائي, المتوسط, الثانوي)
   - This violates Arabic grammar rules for educational level descriptions

## Correctness Properties

Property 1: Bug Condition - Ranking Display for All Students

_For any_ student where the calculated rank is greater than 10 (isBugCondition_Ranking returns true), the fixed print method SHALL pass the actual numerical rank to the view, and the Print.jsx component SHALL display that numerical rank without converting it to "-".

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

Property 2: Bug Condition - Arabic Text Natural Flow

_For any_ Semester 2 report where the Decision section is rendered (isBugCondition_Arabic_Layout returns true), the fixed Print.jsx component SHALL apply CSS styling to prevent text wrapping at unintended positions, allowing the Arabic text to flow naturally on one line or wrap at natural phrase boundaries.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 3: Bug Condition - Arabic Class Name Grammar

_For any_ class name displayed in Arabic (isBugCondition_Arabic_Grammar returns true), the fixed getArabicClassName function SHALL use ordinal number words (الأول, الثاني, الثالث) and masculine adjective forms (الإبتدائي, المتوسط, الثانوي) to produce grammatically correct Arabic class names.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 4: Preservation - Ranking Calculation Logic

_For any_ student in a class, the fixed ranking calculation SHALL produce exactly the same rank value as the original calculation before the display filter is applied, preserving the sorting algorithm, average score calculation, and rank assignment logic.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 5: Preservation - Report Card Display

_For any_ report card section that is NOT the ranking display, Decision section, or Arabic class name, the fixed code SHALL produce exactly the same output as the original code, preserving all existing functionality including grades display, behaviors, attendance, notes, signatures, and bilingual layout.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `app/Http/Controllers/ReportController.php`

**Function**: `print()`

**Specific Changes**:
1. **Remove Ranking Display Filter**: Remove or modify line 260 to pass the actual rank value to the view
   - Current: `$rank = ($rank >= 1 && $rank <= 10) ? $rank : '-';`
   - Fixed: `$rank = $rank;` (or simply remove the ternary operator)
   - This ensures all students see their actual numerical rank

2. **Preserve Calculation Logic**: Ensure lines 233-260 remain unchanged except for the display filter
   - Keep the logic that fetches all students' average scores
   - Keep the sorting by average score in descending order
   - Keep the rank assignment based on array index + 1

**File 2**: `resources/js/Pages/Academic/Report/Print.jsx`

**Function**: Decision section rendering (lines 443-450)

**Specific Changes**:
1. **Add CSS Properties for Text Flow**: Modify the paragraph element to include CSS properties that prevent unnatural text wrapping
   - Option A: Add `white-space: nowrap` to prevent wrapping entirely
   - Option B: Add `word-break: keep-all` and `overflow-wrap: normal` to wrap at natural boundaries
   - Option C: Increase container width or adjust font size to fit text on one line
   - Recommended: Use `className="font-arabic text-sm mb-2 whitespace-nowrap"` or add inline style

2. **Preserve Decision Section Logic**: Ensure the conditional rendering (line 443) and status display remain unchanged
   - Keep the check for `academic_year.semester === 'Genap'`
   - Keep the decision status display logic

**File 3**: `resources/js/Pages/Academic/Report/Print.jsx`

**Function**: `getArabicClassName()` (lines 73-85)

**Specific Changes**:
1. **Replace Cardinal Numbers with Ordinal Words**: Modify the function to map class numbers (1, 2, 3) to Arabic ordinal words
   - 1 → الأول (al-awwal)
   - 2 → الثاني (ath-thani)
   - 3 → الثالث (ath-thalith)
   - 4 → الرابع (ar-rabi')
   - 5 → الخامس (al-khamis)
   - 6 → السادس (as-sadis)

2. **Replace Feminine Forms with Masculine Adjective Forms**: Modify the jenjang replacements
   - الإبتدائية → الإبتدائي (al-ibtida'i)
   - المتوسطة → المتوسط (al-mutawassit)
   - الثانوية → الثانوي (ath-thanawi)

3. **Construct Proper Idlafah Structure**: Return format "الصف : [ordinal] [adjective]"
   - Example: "الصف : الثالث الثانوي" for "3 Tsanawiyah"

4. **Preserve Number Conversion for Other Uses**: Ensure `toArabicNums()` function remains unchanged for use in other contexts (scores, dates, etc.)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate report card generation for students with various ranks, Semester 2 reports with Decision sections, and various class names. Run these tests on the UNFIXED code to observe failures and understand the root causes.

**Test Cases**:
1. **Ranking Display Test - Rank 11+**: Generate report for student with rank 11 (will fail on unfixed code - displays "-" instead of "11")
2. **Ranking Display Test - Rank 25**: Generate report for student with rank 25 (will fail on unfixed code - displays "-" instead of "25")
3. **Arabic Layout Test - Semester 2**: Generate Semester 2 report and inspect Decision section HTML (will fail on unfixed code - text wraps unnaturally)
4. **Arabic Grammar Test - Class 3 Tsanawiyah**: Generate report for student in "3 Tsanawiyah" (will fail on unfixed code - displays "٣ الثانوية" instead of "الثالث الثانوي")
5. **Arabic Grammar Test - Class 2 Mutawassith**: Generate report for student in "2 Mutawassith" (will fail on unfixed code - displays "٢ المتوسطة" instead of "الثاني المتوسط")
6. **Arabic Grammar Test - Class 1 Ibtidaiyah**: Generate report for student in "1 Ibtidaiyah" (will fail on unfixed code - displays "١ الإبتدائية" instead of "الأول الإبتدائي")

**Expected Counterexamples**:
- Ranking display shows "-" for students ranked 11+ instead of actual rank
- Arabic Decision section text breaks across lines at unnatural positions
- Arabic class names use cardinal numbers and feminine forms instead of ordinal words and masculine forms
- Possible causes: explicit filter in controller (ranking), missing CSS properties (Arabic layout), incorrect grammar logic (Arabic class names)

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode:**
```
// Ranking Fix Checking
FOR ALL student WHERE isBugCondition_Ranking(student.rank) DO
  result := ReportController::print_fixed(student)
  ASSERT result.rank = student.calculated_rank
  ASSERT result.rank > 10
  ASSERT result.rank != '-'
END FOR

// Arabic Layout Fix Checking
FOR ALL report WHERE isBugCondition_Arabic_Layout(report.semester, report.decision) DO
  html := Print_fixed.render(report)
  ASSERT html.decision_section_has_css_properties
  ASSERT html.decision_text_flows_naturally
END FOR

// Arabic Grammar Fix Checking
FOR ALL className WHERE isBugCondition_Arabic_Grammar(className, jenjangName) DO
  result := getArabicClassName_fixed(className, jenjangName)
  ASSERT result_uses_ordinal_words
  ASSERT result_uses_masculine_forms
  ASSERT result_matches_expected_format
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
// Ranking Calculation Preservation
FOR ALL student WHERE NOT isBugCondition_Ranking(student.rank) DO
  ASSERT ReportController::print_original(student).calculated_rank = ReportController::print_fixed(student).calculated_rank
END FOR

// Report Card Display Preservation
FOR ALL report_section WHERE section NOT IN ['ranking', 'decision', 'arabic_class_name'] DO
  ASSERT Print_original.render(report_section) = Print_fixed.render(report_section)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-bug-condition cases, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Ranking Calculation Preservation**: Observe that ranking calculation for students ranked 1-10 works correctly on unfixed code, then write test to verify this continues after fix
2. **Grades Display Preservation**: Observe that grades display correctly on unfixed code, then write test to verify this continues after fix
3. **Behaviors Display Preservation**: Observe that behaviors display correctly on unfixed code, then write test to verify this continues after fix
4. **Attendance Display Preservation**: Observe that attendance displays correctly on unfixed code, then write test to verify this continues after fix
5. **Semester 1 Reports Preservation**: Observe that Semester 1 reports do not display Decision section on unfixed code, then write test to verify this continues after fix
6. **Non-Class-Name Arabic Text Preservation**: Observe that Arabic text in other sections displays correctly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test ranking display for students with ranks 1-10 (should remain unchanged)
- Test ranking display for students with ranks 11+ (should show actual rank after fix)
- Test Decision section rendering for Semester 1 (should not display)
- Test Decision section rendering for Semester 2 (should display with proper CSS)
- Test Arabic class name conversion for all jenjang levels (1-6 for each level)
- Test that average score calculation remains unchanged
- Test that total students count remains unchanged

### Property-Based Tests

- Generate random student ranks (1-100) and verify ranking display shows actual rank for all
- Generate random class configurations and verify Arabic class names use correct grammar
- Generate random report card data and verify all non-buggy sections display identically to original
- Test that ranking calculation produces same results as original for all students

### Integration Tests

- Test full report card generation for students with various ranks
- Test Semester 1 and Semester 2 report generation with all sections
- Test report card printing for all jenjang levels (Ibtidaiyah, Mutawassith, Tsanawiyah)
- Test that visual layout remains unchanged except for fixed sections
- Test bilingual display (Indonesian/Arabic) remains properly aligned
