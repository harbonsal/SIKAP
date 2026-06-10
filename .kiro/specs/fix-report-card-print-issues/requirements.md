# Requirements Document

## Introduction

This document specifies the requirements for fixing two critical issues in the report card (rapor) print page: incorrect ranking display and Arabic text layout problems. The report card print page is accessed at `/academic/reports/{student}/print?semester=Genap` and displays student academic performance with bilingual content (Indonesian and Arabic).

## Glossary

- **Report_Card_System**: The system component responsible for generating and displaying student report cards
- **Ranking_Calculator**: The component that calculates student ranking based on average scores
- **Print_View**: The frontend component that renders the printable report card
- **Student_Ranking**: A numerical value (1-N) indicating a student's position relative to classmates based on average score
- **Arabic_Text_Layout**: The right-to-left text rendering for Arabic content in the report card
- **Decision_Section**: The conclusion section (Al-Qarar) displayed only for Semester 2 (Genap) reports
- **Average_Score**: The calculated weighted average of all subject scores for a student

## Requirements

### Requirement 1: Display Actual Student Ranking

**User Story:** As a teacher, I want to see the actual student ranking on the printed report card, so that I can accurately communicate student performance relative to their peers.

#### Acceptance Criteria

1. WHEN a student's ranking is calculated, THE Ranking_Calculator SHALL return the actual numerical rank (1 through N where N is total students)
2. THE Print_View SHALL display the numerical ranking value for all students regardless of their position
3. THE Report_Card_System SHALL NOT limit ranking display to only ranks 1-10
4. WHEN the ranking is displayed, THE Print_View SHALL show the numerical value without converting it to "-"
5. FOR ALL students in a class, THE Ranking_Calculator SHALL compute ranking based on descending average scores

### Requirement 2: Fix Arabic Text Layout in Decision Section

**User Story:** As a teacher, I want the Arabic decision text to display naturally on one line, so that the report card is professionally formatted and readable.

#### Acceptance Criteria

1. WHEN the Decision_Section is rendered for Semester 2 reports, THE Print_View SHALL display the complete Arabic text without artificial line breaks
2. THE Arabic_Text_Layout SHALL flow the text "بناءً على النتائج التي تحققت في الفصل الدراسي الأول والثاني ، يثبت أن الطالب" and the status naturally
3. THE Print_View SHALL apply appropriate CSS styling to prevent text wrapping at unintended positions, WHERE the system SHALL be considered compliant IF the CSS styling is properly applied, EVEN IF natural flow is not achieved due to browser limitations or font issues
4. THE Decision_Section SHALL maintain right-to-left (RTL) text direction for Arabic content
5. WHEN the report card is printed, THE Arabic_Text_Layout SHALL preserve natural text flow without splitting phrases across lines

### Requirement 3: Maintain Ranking Calculation Logic

**User Story:** As a developer, I want to preserve the existing ranking calculation algorithm, so that rankings remain consistent and accurate.

#### Acceptance Criteria

1. THE Ranking_Calculator SHALL continue to fetch all students' average scores from the same class
2. THE Ranking_Calculator SHALL sort students by average score in descending order
3. THE Ranking_Calculator SHALL assign rank position based on array index plus one
4. WHEN two students have identical average scores, THE Ranking_Calculator SHALL assign ranks based on the sort order, WHERE the first student in sort order SHALL receive the better rank
5. THE Ranking_Calculator SHALL calculate average scores using the same weighted formula as the target student

### Requirement 3: Fix Arabic Class Name Grammar

**User Story:** As a teacher, I want the Arabic class name to be grammatically correct, so that the report card maintains professional Arabic language standards.

#### Acceptance Criteria

1. WHEN displaying class names in Arabic, THE Print_View SHALL use ordinal numbers (الأول, الثاني, الثالث) instead of cardinal numbers (١, ٢, ٣)
2. WHEN displaying jenjang (level) in Arabic, THE Print_View SHALL use adjective form (الإبتدائي, المتوسط, الثانوي) instead of noun form (الإبتدائية, المتوسطة, الثانوية)
3. THE Arabic_Text_Layout SHALL display class names in proper idlafah structure with colon separator: "الصف : [ordinal] [adjective]"
4. FOR class "3 Tsanawiyah", THE Print_View SHALL display "الصف : الثالث الثانوي" not "الصف : ٣ الثانوية"
5. FOR class "2 Mutawassith", THE Print_View SHALL display "الصف : الثاني المتوسط" not "الصف : ٢ المتوسطة"
6. FOR class "1 Ibtidaiyah", THE Print_View SHALL display "الصف : الأول الإبتدائي" not "الصف : ١ الإبتدائية"

### Requirement 4: Preserve Report Card Display Constraints

**User Story:** As a system administrator, I want the ranking fix to maintain all existing report card functionality, so that no regressions are introduced.

#### Acceptance Criteria

1. THE Report_Card_System SHALL continue to display all existing report card sections unchanged
2. THE Print_View SHALL maintain the current bilingual layout (Indonesian left, Arabic right)
3. THE Report_Card_System SHALL continue to show total students count
4. THE Report_Card_System SHALL continue to display average score
5. WHEN Semester 1 (Ganjil) reports are printed, THE Print_View SHALL NOT display the Decision_Section
6. WHEN Semester 2 (Genap) reports are printed, THE Print_View SHALL display the Decision_Section with corrected Arabic layout
