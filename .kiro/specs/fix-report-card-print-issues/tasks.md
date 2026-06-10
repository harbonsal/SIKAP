# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Ranking Display, Arabic Layout, and Arabic Grammar Bugs
  - **CRITICAL**: These tests MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior - they will validate the fixes when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: For deterministic bugs, scope the properties to concrete failing cases to ensure reproducibility
  - Test 1.1: Ranking display for student with rank 11 shows "-" instead of "11" (from Bug Condition 1 in design)
  - Test 1.2: Ranking display for student with rank 25 shows "-" instead of "25" (from Bug Condition 1 in design)
  - Test 1.3: Arabic Decision section text breaks across lines unnaturally for Semester 2 reports (from Bug Condition 2 in design)
  - Test 1.4: Arabic class name "3 Tsanawiyah" displays as "٣ الثانوية" instead of "الثالث الثانوي" (from Bug Condition 3 in design)
  - Test 1.5: Arabic class name "2 Mutawassith" displays as "٢ المتوسطة" instead of "الثاني المتوسط" (from Bug Condition 3 in design)
  - Test 1.6: Arabic class name "1 Ibtidaiyah" displays as "١ الإبتدائية" instead of "الأول الإبتدائي" (from Bug Condition 3 in design)
  - The test assertions should match the Expected Behavior Properties from design
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Ranking Calculation, Report Card Display, and Non-Buggy Arabic Text
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Ranking calculation for students ranked 1-10 works correctly on unfixed code
  - Observe: Grades, behaviors, attendance, notes display correctly on unfixed code
  - Observe: Semester 1 reports do not display Decision section on unfixed code
  - Observe: Arabic text in non-Decision sections displays correctly on unfixed code
  - Write property-based test: For all students with rank 1-10, ranking display shows actual rank (from Preservation Requirements in design)
  - Write property-based test: For all report sections except ranking/Decision/class name, display matches original (from Preservation Requirements in design)
  - Write property-based test: For all Semester 1 reports, Decision section is not displayed (from Preservation Requirements in design)
  - Write property-based test: For all Arabic text outside Decision section and class names, display matches original (from Preservation Requirements in design)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 3. Fix for report card print issues

  - [ ] 3.1 Fix ranking display filter in ReportController
    - Open `app/Http/Controllers/ReportController.php`
    - Locate line 260: `$rank = ($rank >= 1 && $rank <= 10) ? $rank : '-';`
    - Remove the ternary operator that filters ranks > 10
    - Change to: `// Removed filter - display actual rank for all students`
    - Ensure the rank variable is passed to the view without modification
    - Verify ranking calculation logic (lines 233-260) remains unchanged
    - _Bug_Condition: isBugCondition_Ranking(rank) where rank > 10_
    - _Expected_Behavior: Display actual numerical rank for all students from Property 1 in design_
    - _Preservation: Ranking calculation algorithm from Preservation Requirements in design_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Fix Arabic text layout in Decision section
    - Open `resources/js/Pages/Academic/Report/Print.jsx`
    - Locate the Decision section paragraph (line 447)
    - Add CSS class or inline style to prevent unnatural text wrapping
    - Option A: Add `whitespace-nowrap` to className
    - Option B: Add inline style `style={{ whiteSpace: 'nowrap' }}`
    - Option C: Add `word-break: keep-all` and adjust container width
    - Recommended: Use `className="font-arabic text-sm mb-2 whitespace-nowrap"`
    - Verify Decision section conditional rendering remains unchanged
    - Test that text flows naturally on one line or wraps at natural boundaries
    - _Bug_Condition: isBugCondition_Arabic_Layout(semester, decision) where semester='Genap'_
    - _Expected_Behavior: Arabic text flows naturally without artificial line breaks from Property 2 in design_
    - _Preservation: Decision section logic and Semester 1 behavior from Preservation Requirements in design_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.5, 4.6_

  - [ ] 3.3 Fix Arabic class name grammar
    - Open `resources/js/Pages/Academic/Report/Print.jsx`
    - Locate the `getArabicClassName` function (lines 73-85)
    - Replace the function implementation with correct grammar logic
    - Create ordinal number mapping: 1→الأول, 2→الثاني, 3→الثالث, 4→الرابع, 5→الخامس, 6→السادس
    - Replace feminine forms with masculine adjective forms:
      - الإبتدائية → الإبتدائي
      - المتوسطة → المتوسط
      - الثانوية → الثانوي
    - Construct proper idlafah structure: "الصف : [ordinal] [adjective]"
    - Example implementation:
      ```javascript
      const getArabicClassName = (className, jenjangName) => {
          // Extract class number
          const classNum = className.match(/\d+/)?.[0];
          
          // Map to ordinal words
          const ordinals = {
              '1': 'الأول',
              '2': 'الثاني',
              '3': 'الثالث',
              '4': 'الرابع',
              '5': 'الخامس',
              '6': 'السادس'
          };
          
          // Map jenjang to masculine adjective forms
          let level = '';
          if (jenjangName?.includes('Ibtida')) level = 'الإبتدائي';
          else if (jenjangName?.includes('Tsanaw')) level = 'الثانوي';
          else if (jenjangName?.includes('Mutawas')) level = 'المتوسط';
          else if (jenjangName?.includes('Aliyah')) level = 'الثانوي';
          
          const ordinal = ordinals[classNum] || classNum;
          return `الصف : ${ordinal} ${level}`;
      };
      ```
    - Verify `toArabicNums()` function remains unchanged for other uses
    - Test with all jenjang levels (Ibtidaiyah, Mutawassith, Tsanawiyah)
    - _Bug_Condition: isBugCondition_Arabic_Grammar(className, jenjangName) where className contains digit_
    - _Expected_Behavior: Use ordinal words and masculine forms from Property 3 in design_
    - _Preservation: Number conversion for other contexts from Preservation Requirements in design_
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.4 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - All Bugs Fixed
    - **IMPORTANT**: Re-run the SAME tests from task 1 - do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run bug condition exploration tests from step 1
    - Test 1.1: Ranking display for rank 11 shows "11" ✓
    - Test 1.2: Ranking display for rank 25 shows "25" ✓
    - Test 1.3: Arabic Decision section text flows naturally ✓
    - Test 1.4: Arabic class name "3 Tsanawiyah" displays as "الثالث الثانوي" ✓
    - Test 1.5: Arabic class name "2 Mutawassith" displays as "الثاني المتوسط" ✓
    - Test 1.6: Arabic class name "1 Ibtidaiyah" displays as "الأول الإبتدائي" ✓
    - **EXPECTED OUTCOME**: Tests PASS (confirms bugs are fixed)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify ranking calculation for students ranked 1-10 still works correctly
    - Verify grades, behaviors, attendance, notes display unchanged
    - Verify Semester 1 reports still do not display Decision section
    - Verify Arabic text in non-Decision sections displays unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all exploration tests - verify they pass (bugs are fixed)
  - Run all preservation tests - verify they pass (no regressions)
  - Manually test report card printing for various scenarios:
    - Student with rank 1-10 (should display actual rank)
    - Student with rank 11+ (should display actual rank, not "-")
    - Semester 1 report (no Decision section)
    - Semester 2 report (Decision section with natural Arabic text flow)
    - Class "3 Tsanawiyah" (should display "الثالث الثانوي")
    - Class "2 Mutawassith" (should display "الثاني المتوسط")
    - Class "1 Ibtidaiyah" (should display "الأول الإبتدائي")
  - Verify bilingual layout remains properly aligned
  - Verify all other report card sections display unchanged
  - Ask the user if questions arise
